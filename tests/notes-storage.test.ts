import { describe, expect, it } from 'vitest'
import type { Note } from '../app/types/note'
import {
  draftStorageKey,
  readDraft,
  removeDraft,
  writeDraft
} from '../app/shared/lib/notes-storage'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}

function createNote(id: string): Note {
  return {
    id,
    title: `Заметка ${id}`,
    todos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('хранение черновиков', () => {
  it('хранит новые заметки из разных вкладок независимо', () => {
    const storage = new MemoryStorage()

    writeDraft(storage, 'new:session-a', createNote('session-a'), null)
    writeDraft(storage, 'new:session-b', createNote('session-b'), null)

    expect(readDraft(storage, 'new:session-a')?.note.id).toBe('session-a')
    expect(readDraft(storage, 'new:session-b')?.note.id).toBe('session-b')
    expect(draftStorageKey('new:session-a')).not.toBe(draftStorageKey('new:session-b'))
  })

  it('удаляет только выбранный черновик', () => {
    const storage = new MemoryStorage()
    writeDraft(storage, 'new:session-a', createNote('session-a'), null)
    writeDraft(storage, 'new:session-b', createNote('session-b'), null)

    removeDraft(storage, 'new:session-a')

    expect(readDraft(storage, 'new:session-a')).toBeNull()
    expect(readDraft(storage, 'new:session-b')).not.toBeNull()
  })
})
