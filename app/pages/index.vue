<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '~/types/note'
import { useNotesStore } from '~/stores/notes'

useHead({ title: 'Заметки' })

const store = useNotesStore()
const noteToDelete = ref<Note | null>(null)

function confirmDelete() {
  if (!noteToDelete.value) return
  store.removeNote(noteToDelete.value.id, window.localStorage)
  noteToDelete.value = null
}
</script>

<template>
  <main class="page-container home-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Личное пространство</p>
        <h1>Заметки</h1>
        <p class="page-subtitle">Держите задачи рядом и отмечайте важное.</p>
      </div>
      <NuxtLink class="app-link-button" to="/notes/new">
        <span aria-hidden="true">＋</span>
        Новая заметка
      </NuxtLink>
    </header>

    <section v-if="store.sortedNotes.length" class="notes-grid" aria-label="Список заметок">
      <NoteCard
        v-for="note in store.sortedNotes"
        :key="note.id"
        :note="note"
        @remove="noteToDelete = $event"
      />
    </section>

    <section v-else class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">✦</div>
      <h2>Здесь пока тихо</h2>
      <p>Создайте первую заметку и добавьте в неё несколько задач.</p>
      <NuxtLink class="app-link-button" to="/notes/new">Создать заметку</NuxtLink>
    </section>

    <ConfirmModal
      :open="Boolean(noteToDelete)"
      title="Удалить заметку?"
      confirm-text="Удалить"
      danger
      @close="noteToDelete = null"
      @confirm="confirmDelete"
    >
      <p>«{{ noteToDelete?.title }}» будет удалена без возможности восстановления.</p>
    </ConfirmModal>
  </main>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 42px;

  h1 {
    margin: 4px 0 8px;
    font-size: clamp(2.8rem, 7vw, 5.4rem);
    font-weight: 700;
    letter-spacing: -.045em;
    line-height: .98;
  }
}

.page-subtitle {
  max-width: 34rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 1.05rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 860px) {
  .notes-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 28px;
  }

  .page-header .app-link-button { width: 100%; }
  .notes-grid { grid-template-columns: 1fr; }
}
</style>
