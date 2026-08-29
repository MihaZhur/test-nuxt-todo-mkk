<script setup lang="ts">
import type { TodoItem } from '~/types/note'

defineProps<{
  todo: TodoItem
  invalid?: boolean
}>()

defineEmits<{
  toggle: [id: string]
  updateText: [id: string, value: string]
  commitText: [key: string]
  remove: [id: string]
}>()
</script>

<template>
  <div class="todo-editor-item" :class="{ 'has-error': invalid }">
    <input
      class="todo-editor-item__checkbox"
      type="checkbox"
      :checked="todo.completed"
      :aria-label="`Отметить пункт «${todo.text || 'без названия'}»`"
      @change="$emit('toggle', todo.id)"
    >
    <label class="todo-editor-item__field">
      <span class="visually-hidden">Текст пункта</span>
      <input
        :id="`todo-input-${todo.id}`"
        :value="todo.text"
        type="text"
        maxlength="240"
        placeholder="Что нужно сделать?"
        :aria-invalid="invalid || undefined"
        @input="$emit('updateText', todo.id, ($event.target as HTMLInputElement).value)"
        @blur="$emit('commitText', `todo:${todo.id}`)"
      >
    </label>
    <button
      class="icon-button icon-button--danger"
      type="button"
      :aria-label="`Удалить пункт «${todo.text || 'без названия'}»`"
      @click="$emit('remove', todo.id)"
    >
      <span aria-hidden="true">×</span>
    </button>
    <p v-if="invalid" class="field-error">Введите текст пункта</p>
  </div>
</template>

<style scoped lang="scss">
.todo-editor-item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 11px;
  border: 1px solid #e1e6e2;
  border-radius: 13px;
  background: #fbfcfb;

  &:focus-within {
    border-color: #a8c1b1;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(36, 107, 77, .08);
  }

  &.has-error {
    margin-bottom: 19px;
    border-color: #e5afaf;
  }

  .field-error {
    position: absolute;
    top: calc(100% + 3px);
    left: 0;
  }
}

.todo-editor-item__checkbox {
  width: 21px;
  height: 21px;
  margin: 0;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.todo-editor-item__field input {
  width: 100%;
  padding: 5px 0;
  border: 0;
  outline: none;
  color: var(--color-ink);
  background: transparent;

  &::placeholder { color: #a7afa9; }
}

.icon-button--danger:hover {
  color: var(--color-danger);
  background: #fff0f0;
}
</style>
