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

<style scoped lang="scss">
.note-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: 20px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 1px 0 rgba(22, 37, 27, .02);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: #c6d1c9;
    box-shadow: var(--shadow-card);
  }

  h2 {
    margin: 18px 0;
    overflow-wrap: anywhere;
    font-size: 1.65rem;
    font-weight: 700;
    letter-spacing: -.025em;
    line-height: 1.16;
  }
}

.note-card__topline {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #89928c;
  font-size: .75rem;
}

.note-card__count {
  color: var(--color-accent);
  font-weight: 750;
}

.note-preview {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #4e5852;
    font-size: .91rem;

    span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.is-completed span:last-child {
      color: #98a09b;
      text-decoration: line-through;
    }
  }
}

.preview-checkbox {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid #b7c2ba;
  border-radius: 5px;
  color: #fff;
  background: #fff;
  font-size: .68rem;

  .is-completed & {
    border-color: var(--color-accent);
    background: var(--color-accent);
  }
}

.note-card__empty,
.note-card__more {
  margin: 0;
  color: #8a948e;
  font-size: .85rem;
}

.note-card__more { margin-top: 10px; }

.note-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #edf0ed;
}

.text-link,
.text-button {
  padding: 0;
  border: 0;
  color: var(--color-accent);
  background: none;
  font-size: .88rem;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

.text-button--danger { color: var(--color-danger); }

@media (max-width: 600px) {
  .note-card { min-height: 270px; }
}
</style>
