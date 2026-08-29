import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Note } from '../app/types/note'
import { NOTES_STORAGE_KEY } from '../app/shared/lib/notes-storage'
import { useNotesStore } from '../app/stores/notes'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

function createNote(id = 'note-1'): Note {
  return {
    id,
    title: '  Покупки  ',
    todos: [{ id: 'todo-1', text: '  Молоко  ', completed: false }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('notes store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('загружает только поддерживаемую версию схемы', () => {
    const storage = new MemoryStorage()
    storage.setItem(NOTES_STORAGE_KEY, JSON.stringify({ version: 999, notes: [createNote()] }))
    const store = useNotesStore()

    store.initialize(storage)

    expect(store.notes).toEqual([])
    expect(store.initialized).toBe(true)
  })

  it('нормализует и сохраняет заметку вручную', () => {
    const storage = new MemoryStorage()
    const store = useNotesStore()
    store.initialize(storage)

    const saved = store.saveNote(createNote(), storage)
    const persisted = JSON.parse(storage.getItem(NOTES_STORAGE_KEY)!)

    expect(saved.title).toBe('Покупки')
    expect(saved.todos[0].text).toBe('Молоко')
    expect(persisted.version).toBe(1)
    expect(persisted.notes).toHaveLength(1)
  })

  it('обновляет существующую заметку без дубликатов', () => {
    const storage = new MemoryStorage()
    const store = useNotesStore()
    store.initialize(storage)
    store.saveNote(createNote(), storage)

    const changed = createNote()
    changed.title = 'Новый заголовок'
    store.saveNote(changed, storage)

    expect(store.notes).toHaveLength(1)
    expect(store.notes[0]?.title).toBe('Новый заголовок')
  })

  it('удаляет заметку и синхронизирует хранилище', () => {
    const storage = new MemoryStorage()
    const store = useNotesStore()
    store.initialize(storage)
    store.saveNote(createNote(), storage)

    expect(store.removeNote('note-1', storage)).toBe(true)
    expect(store.notes).toEqual([])
    expect(JSON.parse(storage.getItem(NOTES_STORAGE_KEY)!).notes).toEqual([])
  })

  it('принимает изменения из другой вкладки', () => {
    const store = useNotesStore()
    store.syncFromStorage(JSON.stringify({ version: 1, notes: [createNote('external')] }))

    expect(store.getById('external')).toBeDefined()
  })
})
