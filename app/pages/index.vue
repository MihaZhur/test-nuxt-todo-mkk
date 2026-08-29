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
