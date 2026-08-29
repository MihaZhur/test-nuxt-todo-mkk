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
