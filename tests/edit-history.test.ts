import { describe, expect, it } from 'vitest'
import type { Note } from '../app/types/note'
import { EditHistory } from '../app/shared/lib/edit-history'

function createNote(): Note {
  return {
    id: 'note-1',
    title: 'Начальное название',
    todos: [{ id: 'todo-1', text: 'Первый пункт', completed: false }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('EditHistory', () => {
  it('отменяет и повторяет изменение текста', () => {
    const note = createNote()
    const history = new EditHistory()

    note.title = 'Новое название'
    history.record({ type: 'title', before: 'Начальное название', after: 'Новое название' })

    expect(history.undo(note)).toBe(true)
    expect(note.title).toBe('Начальное название')
    expect(history.canRedo).toBe(true)

    expect(history.redo(note)).toBe(true)
    expect(note.title).toBe('Новое название')
  })

  it('обрабатывает добавление, удаление и переключение как атомарные операции', () => {
    const note = createNote()
    const history = new EditHistory()
    const added = { id: 'todo-2', text: 'Второй пункт', completed: false }

    note.todos.push(added)
    history.record({ type: 'todo-add', item: added, index: 1 })
    note.todos[0]!.completed = true
    history.record({ type: 'todo-toggle', todoId: 'todo-1', before: false, after: true })
    const [removed] = note.todos.splice(0, 1)
    history.record({ type: 'todo-remove', item: removed!, index: 0 })

    history.undo(note)
    expect(note.todos.map(todo => todo.id)).toEqual(['todo-1', 'todo-2'])
    history.undo(note)
    expect(note.todos[0]!.completed).toBe(false)
    history.undo(note)
    expect(note.todos.map(todo => todo.id)).toEqual(['todo-1'])
  })

  it('очищает redo-ветку после нового изменения', () => {
    const note = createNote()
    const history = new EditHistory()

    note.title = 'A'
    history.record({ type: 'title', before: 'Начальное название', after: 'A' })
    history.undo(note)
    expect(history.canRedo).toBe(true)

    note.title = 'B'
    history.record({ type: 'title', before: 'Начальное название', after: 'B' })
    expect(history.canRedo).toBe(false)
    expect(history.redo(note)).toBe(false)
  })

  it('хранит не больше 50 операций', () => {
    const note = createNote()
    const history = new EditHistory(50)

    for (let index = 0; index < 60; index += 1) {
      history.record({ type: 'title', before: `${index}`, after: `${index + 1}` })
    }

    expect(history.undoCount).toBe(50)
    for (let index = 0; index < 50; index += 1) history.undo(note)
    expect(history.canUndo).toBe(false)
  })

  it('полностью сбрасывает историю сессии', () => {
    const history = new EditHistory()
    history.record({ type: 'title', before: 'A', after: 'B' })
    history.clear()

    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })
})
