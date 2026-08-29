<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { createId } from '~/shared/lib/id'
import { useNotesStore } from '~/stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const routeId = Array.isArray(route.params.id) ? route.params.id[0] ?? '' : String(route.params.id)
const isNew = routeId === 'new'
const queryDraftId = Array.isArray(route.query.draft) ? route.query.draft[0] : route.query.draft
const newDraftId = isNew && queryDraftId ? queryDraftId : createId()
const editor = useNoteEditor(routeId, {
  draftRouteId: isNew ? `new:${newDraftId}` : routeId,
  newNoteId: isNew ? newDraftId : undefined
})

if (isNew && !queryDraftId) {
  void router.replace({ query: { ...route.query, draft: newDraftId } })
}

const cancelModalOpen = ref(false)
const deleteModalOpen = ref(false)
const conflictModalOpen = ref(false)
const titleError = ref(false)
const invalidTodoIds = ref(new Set<string>())

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
  if ((editor.externallyDeleted.value || editor.externallyUpdated.value) && !asCopy) {
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

      <aside v-if="editor.externallyDeleted.value || editor.externallyUpdated.value" class="status-banner" role="status">
        <strong>
          {{ editor.externallyDeleted.value
            ? 'Заметка удалена в другой вкладке.'
            : 'Заметка изменена в другой вкладке.' }}
        </strong>
        Ваши изменения сохранены на экране — их можно сохранить как новую заметку.
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
            v-if="!isNew && !editor.externallyDeleted.value && !editor.externallyUpdated.value"
            variant="danger"
            @click="deleteModalOpen = true"
          >
            Удалить
          </AppButton>
        </div>
        <div class="editor-actions__save">
          <span v-if="editor.draftSavedAt.value" class="draft-status">Черновик сохранён</span>
          <AppButton @click="save(false)">
            {{ editor.externallyDeleted.value || editor.externallyUpdated.value ? 'Сохранить копию' : 'Сохранить' }}
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
        :title="editor.externallyDeleted.value ? 'Исходная заметка удалена' : 'Исходная заметка изменена'"
        confirm-text="Сохранить как новую"
        @close="conflictModalOpen = false"
        @confirm="save(true)"
      >
        <p>Чтобы не перезаписать чужие изменения, сохраните текущую версию как новую заметку.</p>
      </ConfirmModal>
    </template>
  </main>
</template>

<style scoped lang="scss">
.editor-page { width: min(900px, calc(100% - 40px)); }

.editor-toolbar,
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.editor-toolbar { margin-bottom: 22px; }
.editor-toolbar__history { display: flex; gap: 4px; }

.back-link {
  padding: 0;
  border: 0;
  color: var(--color-muted);
  background: transparent;
  font-size: .9rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;

  &:hover { color: var(--color-ink); }
}

.status-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid #edcf9e;
  border-radius: 12px;
  color: #694815;
  background: #fff8e9;
  font-size: .9rem;

  strong {
    display: block;
    margin-bottom: 2px;
  }
}

.editor-card {
  padding: clamp(24px, 5vw, 50px);
  border: 1px solid var(--color-line);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.title-field {
  display: block;
  margin-top: 12px;

  input {
    width: 100%;
    padding: 4px 0 12px;
    border: 0;
    border-bottom: 1px solid var(--color-line);
    outline: none;
    color: var(--color-ink);
    background: transparent;
    font-size: clamp(2rem, 6vw, 3.6rem);
    letter-spacing: -.045em;

    &::placeholder { color: #afb6b1; }
    &:focus { border-color: var(--color-accent); }
    &[aria-invalid="true"] { border-color: var(--color-danger); }
  }
}

.field-error--title { margin-left: 0; }

.todo-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 44px 0 18px;

  h2 {
    margin: 0 0 3px;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: var(--color-muted);
    font-size: .82rem;
  }
}

.todo-editor-list {
  display: grid;
  gap: 9px;
}

.todo-placeholder {
  width: 100%;
  min-height: 94px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed #c8d2ca;
  border-radius: 14px;
  color: var(--color-muted);
  background: #fafbfa;
  cursor: pointer;

  &:hover {
    color: var(--color-accent);
    border-color: #8fb09a;
    background: #f5faf6;
  }
}

.editor-actions {
  margin-top: 18px;

  > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }
}

.draft-status {
  color: #89928c;
  font-size: .76rem;
}

@media (max-width: 600px) {
  .editor-page {
    width: min(100% - 24px, 100%);
    padding: 34px 0 40px;
  }

  .editor-toolbar__history :deep(.app-button span) { display: none; }
  .editor-card { border-radius: 18px; }

  .todo-section__header {
    align-items: flex-start;
    flex-direction: column;

    :deep(.app-button) { width: 100%; }
  }

  .editor-actions {
    align-items: stretch;
    flex-direction: column-reverse;

    > div { width: 100%; }
    :deep(.app-button) { flex: 1; }
  }

  .editor-actions__save {
    flex-direction: column-reverse;

    :deep(.app-button) {
      width: 100%;
      flex: none;
    }
  }
}
</style>
