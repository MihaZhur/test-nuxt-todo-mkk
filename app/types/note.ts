export interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export interface Note {
  id: string
  title: string
  todos: TodoItem[]
  createdAt: string
  updatedAt: string
}

export interface NotesStorageSchema {
  version: 1
  notes: Note[]
}

export interface NoteDraftSchema {
  version: 1
  routeId: string
  baseUpdatedAt: string | null
  savedAt: string
  note: Note
}
