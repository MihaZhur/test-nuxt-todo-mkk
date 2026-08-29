<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { createId } from '~/shared/lib/id'
import { useNotesStore } from '~/stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const routeId = Array.isArray(route.params.id) ? route.params.id[0] ?? '' : String(route.params.id)
const editor = useNoteEditor(routeId)

const cancelModalOpen = ref(false)
const deleteModalOpen = ref(false)
const conflictModalOpen = ref(false)
const titleError = ref(false)
const invalidTodoIds = ref(new Set<string>())
const isNew = routeId === 'new'

useHead({ title: computed(() => isNew ? 'Новая заметка' : editor.note.title || 'Редактирование') })
useEditorShortcuts(editor.undo, editor.redo)

function validate(): boolean {
  editor.commitAllText()
  titleError.value = !editor.note.title.trim()
  invalidTodoIds.value = new Set(
    editor.note.todos.filter(todo => !todo.text.trim()).map(todo => todo.id)
  )
  return !titleError.value && invalidTodoIds.value.size === 0
}

function save(asCopy = false) {
  if (!validate()) return
  if (editor.externallyDeleted.value && !asCopy) {
    conflictModalOpen.value = true
    return
  }

  if (asCopy) {
    const now = new Date().toISOString()
    editor.note.id = createId()
    editor.note.createdAt = now
  }

  const saved = store.saveNote(editor.note, window.localStorage)
  editor.markSaved(saved)
  void router.push('/')
}

function cancelEditing() {
  editor.resetSession()
  cancelModalOpen.value = false
  void router.push('/')
}

function deleteNote() {
  store.removeNote(routeId, window.localStorage)
  editor.resetSession()
  deleteModalOpen.value = false
  void router.push('/')
}

function onTitleInput(value: string) {
  editor.updateTitle(value)
  if (value.trim()) titleError.value = false
}

function onTodoInput(id: string, value: string) {
  editor.updateTodoText(id, value)
  if (value.trim()) {
    const next = new Set(invalidTodoIds.value)
    next.delete(id)
    invalidTodoIds.value = next
  }
}

async function addTodo() {
  const id = editor.addTodo()
  await nextTick()
  document.getElementById(`todo-input-${id}`)?.focus()
}

function formatDraftDate(value: string) {
  return new Intl.DateTimeFormat('ru', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

<template>
  <main class="page-container editor-page">
    <template v-if="editor.isMissing.value">
      <section class="empty-state empty-state--compact">
        <div class="empty-state__icon" aria-hidden="true">?</div>
        <h1>Заметка не найдена</h1>
        <p>Возможно, она была удалена или ссылка устарела.</p>
        <NuxtLink class="app-link-button" to="/">Вернуться к заметкам</NuxtLink>
      </section>
    </template>

    <template v-else>
      <header class="editor-toolbar">
        <button class="back-link" type="button" aria-label="Отменить редактирование и вернуться к заметкам" @click="cancelModalOpen = true">
          ← Все заметки
        </button>
        <div class="editor-toolbar__history" aria-label="История изменений">
          <AppButton
            variant="ghost"
            :disabled="!editor.canUndo.value"
            title="Отменить (Ctrl+Z)"
            @click="editor.undo"
          >
            ↶ <span>Отменить</span>
          </AppButton>
          <AppButton
            variant="ghost"
            :disabled="!editor.canRedo.value"
            title="Повторить (Ctrl+Shift+Z)"
            @click="editor.redo"
          >
            ↷ <span>Повторить</span>
          </AppButton>
        </div>
      </header>

      <aside v-if="editor.externallyDeleted.value" class="status-banner" role="status">
        <strong>Заметка удалена в другой вкладке.</strong>
        Текущие изменения сохранены на экране — их можно сохранить как новую заметку.
      </aside>

      <section class="editor-card">
        <p class="eyebrow">{{ isNew ? 'Новая заметка' : 'Редактирование' }}</p>
        <label class="title-field">
          <span class="visually-hidden">Название заметки</span>
          <input
            :value="editor.note.title"
            maxlength="120"
            placeholder="Название заметки"
            :aria-invalid="titleError || undefined"
            autofocus
            @input="onTitleInput(($event.target as HTMLInputElement).value)"
            @blur="editor.commitText('title')"
          >
        </label>
        <p v-if="titleError" class="field-error field-error--title">Введите название заметки</p>

        <div class="todo-section__header">
          <div>
            <h2>Задачи</h2>
            <p>{{ editor.note.todos.length ? `${editor.note.todos.length} пунктов` : 'Список пока пуст' }}</p>
          </div>
          <AppButton variant="secondary" @click="addTodo">＋ Добавить пункт</AppButton>
        </div>

        <div v-if="editor.note.todos.length" class="todo-editor-list">
          <TodoEditorItem
            v-for="todo in editor.note.todos"
            :key="todo.id"
            :todo="todo"
            :invalid="invalidTodoIds.has(todo.id)"
            @toggle="editor.toggleTodo"
            @update-text="onTodoInput"
            @commit-text="editor.commitText"
            @remove="editor.removeTodoItem"
          />
        </div>
        <button v-else class="todo-placeholder" type="button" @click="addTodo">
          <span aria-hidden="true">＋</span>
          Добавить первую задачу
        </button>
      </section>

      <footer class="editor-actions">
        <div>
          <AppButton variant="secondary" @click="cancelModalOpen = true">Отменить</AppButton>
          <AppButton
            v-if="!isNew && !editor.externallyDeleted.value"
            variant="danger"
            @click="deleteModalOpen = true"
          >
            Удалить
          </AppButton>
        </div>
        <div class="editor-actions__save">
          <span v-if="editor.draftSavedAt.value" class="draft-status">Черновик сохранён</span>
          <AppButton @click="save(false)">
            {{ editor.externallyDeleted.value ? 'Сохранить копию' : 'Сохранить' }}
          </AppButton>
        </div>
      </footer>

      <AppModal
        :open="Boolean(editor.recoveryDraft.value)"
        title="Восстановить черновик?"
        :close-on-backdrop="false"
        @close="editor.discardDraft"
      >
        <div class="modal-copy">
          <p>Найдены несохранённые изменения от {{ editor.recoveryDraft.value ? formatDraftDate(editor.recoveryDraft.value.savedAt) : '' }}.</p>
          <p>Можно продолжить редактирование или начать с последней сохранённой версии.</p>
        </div>
        <template #footer>
          <AppButton variant="secondary" @click="editor.discardDraft">Не восстанавливать</AppButton>
          <AppButton data-autofocus @click="editor.restoreDraft">Восстановить</AppButton>
        </template>
      </AppModal>

      <ConfirmModal
        :open="cancelModalOpen"
        title="Отменить редактирование?"
        confirm-text="Отменить изменения"
        danger
        @close="cancelModalOpen = false"
        @confirm="cancelEditing"
      >
        <p>Все несохранённые изменения и история действий будут удалены.</p>
      </ConfirmModal>

      <ConfirmModal
        :open="deleteModalOpen"
        title="Удалить заметку?"
        confirm-text="Удалить"
        danger
        @close="deleteModalOpen = false"
        @confirm="deleteNote"
      >
        <p>Заметка будет удалена без возможности восстановления.</p>
      </ConfirmModal>

      <ConfirmModal
        :open="conflictModalOpen"
        title="Исходная заметка удалена"
        confirm-text="Сохранить как новую"
        @close="conflictModalOpen = false"
        @confirm="save(true)"
      >
        <p>Чтобы не потерять изменения, сохраните текущую версию как новую заметку.</p>
      </ConfirmModal>
    </template>
  </main>
</template>
