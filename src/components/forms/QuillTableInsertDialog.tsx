import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  DEFAULT_TABLE_COLS,
  DEFAULT_TABLE_ROWS,
  MAX_TABLE_COLS,
  MAX_TABLE_ROWS,
  MIN_TABLE_COLS,
  MIN_TABLE_ROWS,
} from '../../lib/quillTableSupport'
import {
  insertQuillTable,
  registerQuillTableInsertDialog,
  type QuillTableInsertRequest,
} from '../../lib/quillTableInsertDialog'

const PRESETS: { label: string; rows: number; cols: number }[] = [
  { label: '2 × 2', rows: 2, cols: 2 },
  { label: '3 × 3', rows: 3, cols: 3 },
  { label: '3 × 4', rows: 3, cols: 4 },
  { label: '4 × 5', rows: 4, cols: 5 },
  { label: '5 × 2', rows: 5, cols: 2 },
  { label: '6 × 3', rows: 6, cols: 3 },
]

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}

/** Global dialog — opened when any Quill editor clicks the ▦ table button. */
export function QuillTableInsertDialog() {
  const [open, setOpen] = useState(false)
  const [request, setRequest] = useState<QuillTableInsertRequest | null>(null)
  const [rows, setRows] = useState(DEFAULT_TABLE_ROWS)
  const [cols, setCols] = useState(DEFAULT_TABLE_COLS)

  useEffect(() => {
    return registerQuillTableInsertDialog((req) => {
      setRequest(req)
      setRows(DEFAULT_TABLE_ROWS)
      setCols(DEFAULT_TABLE_COLS)
      setOpen(true)
    })
  }, [])

  const close = () => {
    setOpen(false)
    setRequest(null)
  }

  const confirm = (r: number, c: number) => {
    if (!request) return
    const ok = insertQuillTable(request.quill, r, c, request.onError)
    if (ok) close()
  }

  if (!open) return null

  const safeRows = clamp(rows, MIN_TABLE_ROWS, MAX_TABLE_ROWS)
  const safeCols = clamp(cols, MIN_TABLE_COLS, MAX_TABLE_COLS)

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">Insert table</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose rows and columns before inserting. You can edit cell text after insert; use Tab in the last cell to
          add another row.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={() => confirm(p.rows, p.cols)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quill-table-rows">Rows</Label>
            <Input
              id="quill-table-rows"
              type="number"
              min={MIN_TABLE_ROWS}
              max={MAX_TABLE_ROWS}
              value={String(rows)}
              onChange={(e) => setRows(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quill-table-cols">Columns</Label>
            <Input
              id="quill-table-cols"
              type="number"
              min={MIN_TABLE_COLS}
              max={MAX_TABLE_COLS}
              value={String(cols)}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          Custom size: {safeRows} row{safeRows === 1 ? '' : 's'} × {safeCols} column{safeCols === 1 ? '' : 's'} (max{' '}
          {MAX_TABLE_ROWS}×{MAX_TABLE_COLS})
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="button" onClick={() => confirm(safeRows, safeCols)}>
            Insert {safeRows} × {safeCols}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuillTableInsertDialog
