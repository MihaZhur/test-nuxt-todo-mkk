import type { Note, TodoItem } from '~/types/note'

export type EditOperation =
  | { type: 'title'; before: string; after: string }
  | { type: 'todo-text'; todoId: string; before: string; after: string }
  | { type: 'todo-toggle'; todoId: string; before: boolean; after: boolean }
  | { type: 'todo-add'; item: TodoItem; index: number }
  | { type: 'todo-remove'; item: TodoItem; index: number }

export type HistoryDirection = 'undo' | 'redo'

function cloneOperation(operation: EditOperation): EditOperation {
  if (operation.type === 'todo-add' || operation.type === 'todo-remove') {
    return { ...operation, item: { ...operation.item } }
  }
  return { ...operation }
}

export function applyOperation(
  note: Note,
  operation: EditOperation,
  direction: HistoryDirection
): void {
  const isUndo = direction === 'undo'

  if (operation.type === 'title') {
    note.title = isUndo ? operation.before : operation.after
    return
  }

  if (operation.type === 'todo-text') {
    const todo = note.todos.find(item => item.id === operation.todoId)
    if (todo) todo.text = isUndo ? operation.before : operation.after
    return
  }

  if (operation.type === 'todo-toggle') {
    const todo = note.todos.find(item => item.id === operation.todoId)
    if (todo) todo.completed = isUndo ? operation.before : operation.after
    return
  }

  const shouldInsert = (operation.type === 'todo-add' && !isUndo)
    || (operation.type === 'todo-remove' && isUndo)

  if (shouldInsert) {
    const index = Math.min(operation.index, note.todos.length)
    note.todos.splice(index, 0, { ...operation.item })
  }
  else {
    const index = note.todos.findIndex(item => item.id === operation.item.id)
    if (index !== -1) note.todos.splice(index, 1)
  }
}

export class EditHistory {
  readonly limit: number
  private undoStack: EditOperation[] = []
  private redoStack: EditOperation[] = []

  constructor(limit = 50) {
    this.limit = limit
  }

  get canUndo(): boolean { return this.undoStack.length > 0 }
  get canRedo(): boolean { return this.redoStack.length > 0 }
  get undoCount(): number { return this.undoStack.length }
  get redoCount(): number { return this.redoStack.length }

  record(operation: EditOperation): void {
    this.undoStack.push(cloneOperation(operation))
    if (this.undoStack.length > this.limit) this.undoStack.shift()
    this.redoStack = []
  }

  undo(note: Note): boolean {
    const operation = this.undoStack.pop()
    if (!operation) return false
    applyOperation(note, operation, 'undo')
    this.redoStack.push(operation)
    return true
  }

  redo(note: Note): boolean {
    const operation = this.redoStack.pop()
    if (!operation) return false
    applyOperation(note, operation, 'redo')
    this.undoStack.push(operation)
    return true
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}
