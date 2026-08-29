import type { Note, NoteDraftSchema, NotesStorageSchema } from '~/types/note'
import { cloneNote } from './clone'

export const NOTES_STORAGE_KEY = 'notes-app:data'
export const DRAFT_STORAGE_PREFIX = 'notes-app:draft:'
export const STORAGE_VERSION = 1 as const

function isTodo(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const todo = value as Record<string, unknown>
  return typeof todo.id === 'string'
    && typeof todo.text === 'string'
    && typeof todo.completed === 'boolean'
}

function isNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false
  const note = value as Record<string, unknown>
  return typeof note.id === 'string'
    && typeof note.title === 'string'
    && typeof note.createdAt === 'string'
    && typeof note.updatedAt === 'string'
    && Array.isArray(note.todos)
    && note.todos.every(isTodo)
}

export function parseNotesStorage(raw: string | null): Note[] {
  if (!raw) return []

  try {
    const data = JSON.parse(raw) as Partial<NotesStorageSchema>
    if (data.version !== STORAGE_VERSION || !Array.isArray(data.notes)) return []
    return data.notes.filter(isNote).map(cloneNote)
  }
  catch {
    return []
  }
}

export function readNotes(storage: Storage): Note[] {
  return parseNotesStorage(storage.getItem(NOTES_STORAGE_KEY))
}

export function writeNotes(storage: Storage, notes: Note[]): void {
  const data: NotesStorageSchema = {
    version: STORAGE_VERSION,
    notes: notes.map(cloneNote)
  }
  storage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data))
}

export function draftStorageKey(routeId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${routeId}`
}

export function readDraft(storage: Storage, routeId: string): NoteDraftSchema | null {
  const raw = storage.getItem(draftStorageKey(routeId))
  if (!raw) return null

  try {
    const draft = JSON.parse(raw) as Partial<NoteDraftSchema>
    if (
      draft.version !== STORAGE_VERSION
      || draft.routeId !== routeId
      || typeof draft.savedAt !== 'string'
      || !(draft.baseUpdatedAt === null || typeof draft.baseUpdatedAt === 'string')
      || !isNote(draft.note)
    ) return null

    return { ...draft, note: cloneNote(draft.note) } as NoteDraftSchema
  }
  catch {
    return null
  }
}

export function writeDraft(
  storage: Storage,
  routeId: string,
  note: Note,
  baseUpdatedAt: string | null
): void {
  const draft: NoteDraftSchema = {
    version: STORAGE_VERSION,
    routeId,
    baseUpdatedAt,
    savedAt: new Date().toISOString(),
    note: cloneNote(note)
  }
  storage.setItem(draftStorageKey(routeId), JSON.stringify(draft))
}

export function removeDraft(storage: Storage, routeId: string): void {
  storage.removeItem(draftStorageKey(routeId))
}
