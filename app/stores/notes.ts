import { defineStore } from 'pinia'
import type { Note } from '~/types/note'
import { cloneNote } from '~/shared/lib/clone'
import { parseNotesStorage, readNotes, writeNotes } from '~/shared/lib/notes-storage'

interface NotesState {
  notes: Note[]
  initialized: boolean
}

export const useNotesStore = defineStore('notes', {
  state: (): NotesState => ({
    notes: [],
    initialized: false
  }),

  getters: {
    sortedNotes: state => [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getById: state => (id: string) => state.notes.find(note => note.id === id)
  },

  actions: {
    initialize(storage?: Storage) {
      if (this.initialized) return
      if (storage) this.notes = readNotes(storage)
      this.initialized = true
    },

    syncFromStorage(raw: string | null) {
      this.notes = parseNotesStorage(raw)
      this.initialized = true
    },

    saveNote(note: Note, storage?: Storage): Note {
      const now = new Date().toISOString()
      const saved: Note = {
        ...cloneNote(note),
        title: note.title.trim(),
        todos: note.todos.map(todo => ({ ...todo, text: todo.text.trim() })),
        updatedAt: now
      }
      const index = this.notes.findIndex(item => item.id === saved.id)

      if (index === -1) this.notes.push(saved)
      else this.notes.splice(index, 1, saved)

      if (storage) writeNotes(storage, this.notes)
      return cloneNote(saved)
    },

    removeNote(id: string, storage?: Storage): boolean {
      const index = this.notes.findIndex(note => note.id === id)
      if (index === -1) return false

      this.notes.splice(index, 1)
      if (storage) writeNotes(storage, this.notes)
      return true
    }
  }
})
