import { NOTES_STORAGE_KEY } from '~/shared/lib/notes-storage'
import { useNotesStore } from '~/stores/notes'

export default defineNuxtPlugin(() => {
  const store = useNotesStore()
  store.initialize(window.localStorage)

  const syncTabs = (event: StorageEvent) => {
    if (event.key === NOTES_STORAGE_KEY) store.syncFromStorage(event.newValue)
  }

  window.addEventListener('storage', syncTabs)
})
