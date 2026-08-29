<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>(), {
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  danger: false
})

defineEmits<{
  confirm: []
  close: []
}>()
</script>

<template>
  <AppModal :open="open" :title="title" @close="$emit('close')">
    <div class="modal-copy"><slot /></div>
    <template #footer>
      <AppButton variant="secondary" @click="$emit('close')">{{ cancelText }}</AppButton>
      <AppButton :variant="danger ? 'danger' : 'primary'" data-autofocus @click="$emit('confirm')">
        {{ confirmText }}
      </AppButton>
    </template>
  </AppModal>
</template>
