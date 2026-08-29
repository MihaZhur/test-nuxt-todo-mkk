<script setup lang="ts">
import type { Note } from '~/types/note'

const props = defineProps<{ note: Note }>()
defineEmits<{ remove: [note: Note] }>()

const visibleTodos = computed(() => props.note.todos.slice(0, 3))
const hiddenCount = computed(() => Math.max(0, props.note.todos.length - visibleTodos.value.length))
const completedCount = computed(() => props.note.todos.filter(todo => todo.completed).length)
</script>

<template>
  <article class="note-card">
    <div class="note-card__topline">
      <span class="note-card__count">{{ completedCount }}/{{ note.todos.length }} выполнено</span>
      <time :datetime="note.updatedAt">
        {{ new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'short' }).format(new Date(note.updatedAt)) }}
      </time>
    </div>

    <h2>{{ note.title }}</h2>

    <ul v-if="visibleTodos.length" class="note-preview">
      <li v-for="todo in visibleTodos" :key="todo.id" :class="{ 'is-completed': todo.completed }">
        <span class="preview-checkbox" aria-hidden="true">{{ todo.completed ? '✓' : '' }}</span>
        <span>{{ todo.text }}</span>
      </li>
    </ul>
    <p v-else class="note-card__empty">Нет пунктов</p>
    <p v-if="hiddenCount" class="note-card__more">Ещё {{ hiddenCount }}</p>

    <div class="note-card__actions">
      <NuxtLink class="text-link" :to="`/notes/${note.id}`">Редактировать</NuxtLink>
      <button class="text-button text-button--danger" type="button" @click="$emit('remove', note)">
        Удалить
      </button>
    </div>
  </article>
</template>
