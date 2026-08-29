import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { Note, NoteDraftSchema, TodoItem } from '~/types/note'
import type { EditOperation } from '~/shared/lib/edit-history'
import { cloneNote } from '~/shared/lib/clone'
import { EditHistory } from '~/shared/lib/edit-history'
import { createId } from '~/shared/lib/id'
import { classifyExternalNoteChange, isDraftStale } from '~/shared/lib/note-conflict'
import { readDraft, removeDraft, writeDraft } from '~/shared/lib/notes-storage'
import { useNotesStore } from '~/stores/notes'

const TEXT_COMMIT_DELAY = 700
const DRAFT_SAVE_DELAY = 900

interface NoteEditorOptions {
  draftRouteId?: string
  newNoteId?: string
}

function makeEmptyNote(id = createId()): Note {
  const now = new Date().toISOString()
  return {
    id,
    title: '',
    todos: [],
    createdAt: now,
    updatedAt: now
  }
}

export function useNoteEditor(routeId: string, options: NoteEditorOptions = {}) {
  const store = useNotesStore()
  const isNew = routeId === 'new'
  const draftRouteId = options.draftRouteId ?? routeId
  const source = isNew ? undefined : store.getById(routeId)
  const existedAtStart = Boolean(source)
  const initial = source ? cloneNote(source) : makeEmptyNote(options.newNoteId)
  const note = reactive<Note>(cloneNote(initial))
  const baseline = ref(cloneNote(initial))
  const history = new EditHistory(50)
  const historyVersion = ref(0)
  const recoveryDraft = ref<NoteDraftSchema | null>(null)
  const recoveryResolved = ref(false)
  const draftSavedAt = ref<string | null>(null)
  const externallyDeleted = ref(false)
  const externallyUpdated = ref(false)
  const pendingText = new Map<string, string>()
  const textTimers = new Map<string, ReturnType<typeof setTimeout>>()
  let draftTimer: ReturnType<typeof setTimeout> | undefined
  let sessionActive = true

  const canUndo = computed(() => {
    historyVersion.value
    return history.canUndo
  })
  const canRedo = computed(() => {
    historyVersion.value
    return history.canRedo
  })
  const isDirty = computed(() => JSON.stringify(note) !== JSON.stringify(baseline.value))
  const isMissing = computed(() => !isNew && !existedAtStart)

  if (import.meta.client) {
    recoveryDraft.value = readDraft(window.localStorage, draftRouteId)
    recoveryResolved.value = !recoveryDraft.value
  }

  function bumpHistory() {
    historyVersion.value += 1
  }

  function record(operation: EditOperation) {
    history.record(operation)
    bumpHistory()
  }

  function textValue(key: string): string | undefined {
    if (key === 'title') return note.title
    const todoId = key.slice('todo:'.length)
    return note.todos.find(todo => todo.id === todoId)?.text
  }

  function commitText(key: string) {
    const timer = textTimers.get(key)
    if (timer) clearTimeout(timer)
    textTimers.delete(key)

    const before = pendingText.get(key)
    const after = textValue(key)
    pendingText.delete(key)
    if (before === undefined || after === undefined || before === after) return

    if (key === 'title') record({ type: 'title', before, after })
    else record({ type: 'todo-text', todoId: key.slice('todo:'.length), before, after })
  }

  function scheduleTextCommit(key: string) {
    const active = textTimers.get(key)
    if (active) clearTimeout(active)
    textTimers.set(key, setTimeout(() => commitText(key), TEXT_COMMIT_DELAY))
  }

  function updateTitle(value: string) {
    if (!pendingText.has('title')) pendingText.set('title', note.title)
    note.title = value
    scheduleTextCommit('title')
  }

  function updateTodoText(id: string, value: string) {
    const todo = note.todos.find(item => item.id === id)
    if (!todo) return
    const key = `todo:${id}`
    if (!pendingText.has(key)) pendingText.set(key, todo.text)
    todo.text = value
    scheduleTextCommit(key)
  }

  function commitAllText() {
    for (const key of [...pendingText.keys()]) commitText(key)
  }

  function addTodo() {
    commitAllText()
    const item: TodoItem = { id: createId(), text: '', completed: false }
    const index = note.todos.length
    note.todos.push(item)
    record({ type: 'todo-add', item, index })
    return item.id
  }

  function removeTodoItem(id: string) {
    commitAllText()
    const index = note.todos.findIndex(todo => todo.id === id)
    if (index === -1) return
    const [item] = note.todos.splice(index, 1)
    if (item) record({ type: 'todo-remove', item, index })
  }

  function toggleTodo(id: string) {
    commitAllText()
    const todo = note.todos.find(item => item.id === id)
    if (!todo) return
    const before = todo.completed
    todo.completed = !before
    record({ type: 'todo-toggle', todoId: id, before, after: todo.completed })
  }

  function undo() {
    commitAllText()
    if (history.undo(note)) bumpHistory()
  }

  function redo() {
    commitAllText()
    if (history.redo(note)) bumpHistory()
  }

  function restoreDraft() {
    if (!recoveryDraft.value) return
    const currentSource = isNew ? undefined : store.getById(routeId)
    const stale = !isNew && isDraftStale(recoveryDraft.value.baseUpdatedAt, currentSource)
    Object.assign(note, cloneNote(recoveryDraft.value.note))
    baseline.value = currentSource ? cloneNote(currentSource) : cloneNote(initial)
    draftSavedAt.value = recoveryDraft.value.savedAt
    recoveryDraft.value = null
    recoveryResolved.value = true
    history.clear()
    bumpHistory()
    externallyUpdated.value = stale
  }

  function discardDraft() {
    if (import.meta.client) removeDraft(window.localStorage, draftRouteId)
    recoveryDraft.value = null
    recoveryResolved.value = true
  }

  function resetSession() {
    sessionActive = false
    if (draftTimer) clearTimeout(draftTimer)
    for (const timer of textTimers.values()) clearTimeout(timer)
    pendingText.clear()
    textTimers.clear()
    history.clear()
    bumpHistory()
    if (import.meta.client) removeDraft(window.localStorage, draftRouteId)
  }

  function markSaved(saved: Note) {
    Object.assign(note, cloneNote(saved))
    baseline.value = cloneNote(saved)
    resetSession()
  }

  watch(
    () => store.getById(routeId),
    current => {
      if (isNew || !sessionActive) return
      const change = classifyExternalNoteChange(
        existedAtStart,
        current,
        baseline.value.updatedAt,
        isDirty.value
      )

      if (change === 'deleted') externallyDeleted.value = true
      if (change === 'conflict') externallyUpdated.value = true
      if (change === 'refresh' && current) {
        Object.assign(note, cloneNote(current))
        baseline.value = cloneNote(current)
        history.clear()
        bumpHistory()
      }
    }
  )

  function persistDraft() {
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = undefined
    if (!import.meta.client || !sessionActive || !recoveryResolved.value || isMissing.value || !isDirty.value) return

    writeDraft(
      window.localStorage,
      draftRouteId,
      note,
      isNew ? null : baseline.value.updatedAt
    )
    draftSavedAt.value = new Date().toISOString()
  }

  watch(
    note,
    () => {
      if (!import.meta.client || !sessionActive || !recoveryResolved.value || isMissing.value) return
      if (draftTimer) clearTimeout(draftTimer)
      if (!isDirty.value) {
        removeDraft(window.localStorage, draftRouteId)
        draftSavedAt.value = null
        return
      }
      draftTimer = setTimeout(persistDraft, DRAFT_SAVE_DELAY)
    },
    { deep: true }
  )

  onMounted(() => window.addEventListener('pagehide', persistDraft))

  onBeforeUnmount(() => {
    persistDraft()
    window.removeEventListener('pagehide', persistDraft)
    for (const timer of textTimers.values()) clearTimeout(timer)
  })

  return {
    note,
    canUndo,
    canRedo,
    isDirty,
    isMissing,
    externallyDeleted,
    externallyUpdated,
    recoveryDraft,
    recoveryResolved,
    draftSavedAt,
    updateTitle,
    updateTodoText,
    commitText,
    commitAllText,
    addTodo,
    removeTodoItem,
    toggleTodo,
    undo,
    redo,
    restoreDraft,
    discardDraft,
    resetSession,
    markSaved
  }
}
