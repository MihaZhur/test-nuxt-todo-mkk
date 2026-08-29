import type { Note } from '~/types/note'

export function cloneNote(note: Note): Note {
  return {
    ...note,
    todos: note.todos.map(todo => ({ ...todo }))
  }
}
