import { describe, expect, it } from 'vitest'
import type { Note } from '../app/types/note'
import { classifyExternalNoteChange, isDraftStale } from '../app/shared/lib/note-conflict'

function createNote(updatedAt = '2026-01-01T00:00:00.000Z'): Note {
  return {
    id: 'note-1',
    title: 'Заметка',
    todos: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt
  }
}

describe('конфликты редактора', () => {
  const baseline = '2026-01-01T00:00:00.000Z'
  const external = createNote('2026-01-02T00:00:00.000Z')

  it('обновляет чистый редактор при изменении заметки в другой вкладке', () => {
    expect(classifyExternalNoteChange(true, external, baseline, false)).toBe('refresh')
  })

  it('не перезаписывает внешнюю версию при наличии локальных изменений', () => {
    expect(classifyExternalNoteChange(true, external, baseline, true)).toBe('conflict')
  })

  it('отличает внешнее удаление от изменения', () => {
    expect(classifyExternalNoteChange(true, undefined, baseline, true)).toBe('deleted')
  })

  it('не считает вновь создаваемую заметку внешне удалённой', () => {
    expect(classifyExternalNoteChange(false, undefined, baseline, true)).toBe('none')
  })

  it('обнаруживает черновик, основанный на старой версии заметки', () => {
    expect(isDraftStale(baseline, external)).toBe(true)
    expect(isDraftStale(external.updatedAt, external)).toBe(false)
  })
})
