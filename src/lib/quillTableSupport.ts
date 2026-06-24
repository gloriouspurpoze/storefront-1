/**
 * Quill 2 table module — shared across RichTextField, CMS editors, and blog.
 */
import type Quill from 'quill'
import TableModule from 'quill/modules/table.js'
import { insertQuillTable, openQuillTableInsertDialog } from './quillTableInsertDialog'

let registered = false

export function registerQuillTableFormats(): void {
  if (registered) return
  TableModule.register()
  registered = true
}

/** Eager register when this module loads. */
registerQuillTableFormats()

export const QUILL_TABLE_FORMAT = 'table' as const
export const QUILL_INSERT_TABLE_TOOLBAR = 'insertTable' as const

export const DEFAULT_TABLE_ROWS = 3
export const DEFAULT_TABLE_COLS = 3
export const MIN_TABLE_ROWS = 1
export const MIN_TABLE_COLS = 1
export const MAX_TABLE_ROWS = 20
export const MAX_TABLE_COLS = 10

export type InsertTableHandlerOptions = {
  /** Fixed size — skips the picker dialog when both are set. */
  rows?: number
  cols?: number
  onError?: (message: string) => void
}

export function createInsertTableHandler(options: InsertTableHandlerOptions = {}) {
  const fixedRows = options.rows
  const fixedCols = options.cols
  return function (this: { quill: Quill }) {
    if (fixedRows != null && fixedCols != null) {
      insertQuillTable(this.quill, fixedRows, fixedCols, options.onError)
      return
    }
    openQuillTableInsertDialog({ quill: this.quill, onError: options.onError })
  }
}

function containerHasInsertTable(container: unknown[][]): boolean {
  return container.some((row) => Array.isArray(row) && row.includes(QUILL_INSERT_TABLE_TOOLBAR))
}

/** Append ▦ insert-table control to a toolbar row (before clean when present). */
export function appendInsertTableToToolbarContainer(container: unknown[][]): unknown[][] {
  if (containerHasInsertTable(container)) return container
  const next = container.map((row) => (Array.isArray(row) ? [...row] : row)) as unknown[][]
  const lastRow = next[next.length - 1]
  if (Array.isArray(lastRow) && lastRow.includes('clean')) {
    const cleanIdx = lastRow.indexOf('clean')
    if (cleanIdx <= 0 && lastRow.length === 1) {
      next.splice(next.length - 1, 0, [QUILL_INSERT_TABLE_TOOLBAR])
    } else {
      lastRow.splice(cleanIdx, 0, QUILL_INSERT_TABLE_TOOLBAR)
    }
  } else if (Array.isArray(lastRow)) {
    lastRow.push(QUILL_INSERT_TABLE_TOOLBAR)
  } else {
    next.push([QUILL_INSERT_TABLE_TOOLBAR])
  }
  return next
}

type ToolbarConfig = { container: unknown[][]; handlers?: Record<string, unknown> }

function normalizeToolbar(toolbar: unknown): ToolbarConfig {
  if (Array.isArray(toolbar)) {
    return {
      container: appendInsertTableToToolbarContainer(toolbar as unknown[][]),
      handlers: {},
    }
  }
  if (toolbar && typeof toolbar === 'object' && Array.isArray((toolbar as ToolbarConfig).container)) {
    const tb = toolbar as ToolbarConfig
    return {
      ...tb,
      container: appendInsertTableToToolbarContainer(tb.container),
      handlers: { ...tb.handlers },
    }
  }
  return { container: [[QUILL_INSERT_TABLE_TOOLBAR]], handlers: {} }
}

/** Adds `table: true`, insertTable handler, and toolbar button unless already present. */
export function mergeModulesWithTableSupport(
  modules: Record<string, unknown>,
  handlerOptions?: InsertTableHandlerOptions,
): Record<string, unknown> {
  registerQuillTableFormats()
  const toolbar = normalizeToolbar(modules.toolbar)
  return {
    ...modules,
    table: true,
    toolbar: {
      ...toolbar,
      handlers: {
        ...toolbar.handlers,
        [QUILL_INSERT_TABLE_TOOLBAR]: createInsertTableHandler(handlerOptions),
      },
    },
  }
}

export function mergeFormatsWithTableSupport(formats: readonly string[]): string[] {
  const list = [...formats]
  if (!list.includes(QUILL_TABLE_FORMAT)) list.push(QUILL_TABLE_FORMAT)
  return list
}

/** Scoped CSS for table button + editor table cells (pass wrapper class, e.g. `.rich-text-field`). */
export function quillTableEditorCss(scopeClass: string): string {
  const s = scopeClass.startsWith('.') ? scopeClass : `.${scopeClass}`
  return `
    ${s} .ql-toolbar button.ql-insertTable::before {
      content: '▦';
      font-size: 1rem;
      line-height: 0;
    }
    ${s} .ql-editor table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.75rem 0;
    }
    ${s} .ql-editor td,
    ${s} .ql-editor th {
      border: 1px solid hsl(var(--border));
      padding: 0.5rem 0.6rem;
      min-width: 3rem;
      vertical-align: top;
    }
    ${s} .ql-editor th {
      background: hsl(var(--muted));
      font-weight: 600;
    }
  `
}
