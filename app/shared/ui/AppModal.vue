<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  closeOnBackdrop?: boolean
}>(), {
  closeOnBackdrop: true
})

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLElement | null>(null)
const titleId = useId()
let previousFocus: HTMLElement | null = null

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function close() {
  emit('close')
}

function onBackdrop() {
  if (props.closeOnBackdrop) close()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value) return

  const elements = [...dialog.value.querySelectorAll<HTMLElement>(focusableSelector)]
  if (!elements.length) {
    event.preventDefault()
    dialog.value.focus()
    return
  }

  const first = elements[0]
  const last = elements[elements.length - 1]
  if (!first || !last) return

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', onKeydown)
      document.body.classList.add('modal-open')
      await nextTick()
      const preferred = dialog.value?.querySelector<HTMLElement>('[data-autofocus]')
      const first = dialog.value?.querySelector<HTMLElement>(focusableSelector)
      ;(preferred ?? first ?? dialog.value)?.focus()
    }
    else {
      document.removeEventListener('keydown', onKeydown)
      document.body.classList.remove('modal-open')
      previousFocus?.focus()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @mousedown.self="onBackdrop">
        <section
          ref="dialog"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
        >
          <header class="modal__header">
            <h2 :id="titleId">{{ title }}</h2>
            <button class="icon-button" type="button" aria-label="Закрыть окно" @click="close">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
