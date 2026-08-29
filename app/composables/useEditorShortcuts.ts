import { onBeforeUnmount, onMounted } from 'vue'

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.matches('input, textarea, [contenteditable="true"]')
}

export function useEditorShortcuts(undo: () => void, redo: () => void) {
  function onKeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
    if (isTextEditingTarget(event.target)) return

    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}
