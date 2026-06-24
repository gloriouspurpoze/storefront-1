import type Quill from 'quill'

export type QuillTableInsertRequest = {
  quill: Quill
  onError?: (message: string) => void
}

type Listener = (request: QuillTableInsertRequest) => void

let listener: Listener | null = null

export function registerQuillTableInsertDialog(fn: Listener): () => void {
  listener = fn
  return () => {
    if (listener === fn) listener = null
  }
}

export function openQuillTableInsertDialog(request: QuillTableInsertRequest): void {
  listener?.(request)
}

export function insertQuillTable(
  quill: Quill,
  rows: number,
  cols: number,
  onError?: (message: string) => void,
): boolean {
  const mod = quill.getModule('table') as { insertTable?: (r: number, c: number) => void }
  if (!mod?.insertTable) {
    onError?.('Table tool unavailable — refresh the page and try again.')
    return false
  }
  mod.insertTable(rows, cols)
  return true
}
