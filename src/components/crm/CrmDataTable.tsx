import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'
import type { GridColDef, GridRowId, GridRowSelectionModel } from './crm-data-grid-types'

export type { GridColDef, GridRowId, GridRowSelectionModel } from './crm-data-grid-types'

/** Drop-in for MUI `GridActionsCellItem` in column definitions. */
export function GridActionsCellItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {icon}
    </Button>
  )
}

type CrmDataTableProps<Row> = {
  rows: Row[]
  columns: GridColDef<Row>[]
  getRowId: (row: Row) => GridRowId
  pageSizeOptions?: number[]
  /** Initial rows per page (default: first of pageSizeOptions or 10). */
  initialPageSize?: number
  checkboxSelection?: boolean
  rowSelectionModel: GridRowSelectionModel
  onRowSelectionModelChange: (m: GridRowSelectionModel) => void
  className?: string
  minHeight?: number
}

function getCellValue<Row>(row: Row, field: string): unknown {
  if (row == null || typeof row !== 'object') return undefined
  return (row as Record<string, unknown>)[field]
}

export function CrmDataTable<Row>({
  rows,
  columns,
  getRowId,
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  className,
  minHeight = 360,
}: CrmDataTableProps<Row>) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(
    pageSizeOptions.includes(initialPageSize) ? initialPageSize : pageSizeOptions[0] ?? 10
  )

  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(page, pageCount - 1)

  const pagedRows = useMemo(() => {
    const start = safePage * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, safePage, pageSize])

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, Math.ceil(total / pageSize) - 1 || 0)))
  }, [total, pageSize])

  const hasId = (set: Set<GridRowId>, raw: GridRowId) => {
    const a = String(raw)
    return Array.from(set).some((x) => String(x) === a)
  }

  const delId = (set: Set<GridRowId>, raw: GridRowId) => {
    const a = String(raw)
    for (const x of Array.from(set)) {
      if (String(x) === a) {
        set.delete(x)
        return
      }
    }
  }

  const pageIds = useMemo(() => pagedRows.map((r) => getRowId(r)), [pagedRows, getRowId])
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => hasId(rowSelectionModel.ids, id))
  const toggleId = useCallback(
    (id: GridRowId) => {
      const next = new Set(rowSelectionModel.ids)
      if (hasId(next, id)) delId(next, id)
      else next.add(id)
      onRowSelectionModelChange({ type: 'include', ids: next })
    },
    [onRowSelectionModelChange, rowSelectionModel.ids]
  )

  const toggleAllPage = useCallback(() => {
    const next = new Set(rowSelectionModel.ids)
    if (allPageSelected) {
      for (const r of pagedRows) {
        delId(next, getRowId(r))
      }
    } else {
      for (const r of pagedRows) {
        const id = getRowId(r)
        if (!hasId(next, id)) next.add(id)
      }
    }
    onRowSelectionModelChange({ type: 'include', ids: next })
  }, [allPageSelected, onRowSelectionModelChange, pagedRows, getRowId, rowSelectionModel.ids])

  const thStyle = (c: GridColDef<Row>): React.CSSProperties => {
    const w = c.width
    const m = c.minWidth
    return {
      width: w,
      minWidth: m ?? (c.flex != null ? Math.round(100 + c.flex * 50) : undefined),
    }
  }

  return (
    <div className={cn('w-full', className)} style={{ minHeight }}>
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {checkboxSelection ? (
                <TableHead className="w-10 pr-0">
                  <div className="inline-flex">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={() => toggleAllPage()}
                      aria-label="Select all on page"
                    />
                  </div>
                </TableHead>
              ) : null}
              {columns.map((c) => (
                <TableHead
                  key={c.field}
                  className="whitespace-nowrap text-xs font-medium uppercase text-muted-foreground"
                  style={thStyle(c)}
                >
                  {c.headerName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No rows
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row) => {
                const id = getRowId(row)
                const idStr = String(id)
                const checked = hasId(rowSelectionModel.ids, id)

                return (
                  <TableRow key={idStr}>
                    {checkboxSelection ? (
                      <TableCell className="w-10 pr-0">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleId(id)}
                          aria-label="Select row"
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((c) => {
                      if (c.type === 'actions' && c.getActions) {
                        return (
                          <TableCell
                            key={c.field}
                            className="align-middle"
                            style={thStyle(c)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-0.5">
                              {c.getActions({ row })}
                            </div>
                          </TableCell>
                        )
                      }
                      const value = getCellValue(row, c.field)
                      const content = c.renderCell
                        ? c.renderCell({ value, row, field: c.field })
                        : (value as React.ReactNode) ?? '—'
                      return (
                        <TableCell
                          key={c.field + idStr}
                          className="align-middle text-sm"
                          style={thStyle(c)}
                        >
                          {content as React.ReactNode}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-2 flex flex-col items-stretch gap-2 border-t p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? '0–0 of 0'
            : `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, total)} of ${total}`}
        </p>
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * MUI DataGrid name — same component for easier file-wide migration.
 * @see CrmDataTable
 */
export const DataGrid = CrmDataTable
