import type { Note } from '~/types/note'

export type ExternalNoteChange = 'none' | 'deleted' | 'refresh' | 'conflict'

export function classifyExternalNoteChange(
  existedAtStart: boolean,
  current: Note | undefined,
  baselineUpdatedAt: string,
  isDirty: boolean
): ExternalNoteChange {
  if (!existedAtStart) return 'none'
  if (!current) return 'deleted'
  if (current.updatedAt === baselineUpdatedAt) return 'none'
  return isDirty ? 'conflict' : 'refresh'
}

export function isDraftStale(baseUpdatedAt: string | null, current: Note | undefined): boolean {
  return Boolean(current && baseUpdatedAt !== current.updatedAt)
}
