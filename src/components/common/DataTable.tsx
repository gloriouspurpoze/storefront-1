import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

interface Column {
  id: string
  label: string
  minWidth?: number
  align?: 'right' | 'left' | 'center'
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  page: number
  rowsPerPage: number
  totalCount: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  selectedRows?: number[]
  onSelectAll?: (selected: boolean) => void
  onSelectRow?: (id: number) => void
  loading?: boolean
  emptyMessage?: string
}

const rowsPerPageOptions = [5, 10, 25, 50]

export function DataTable({
  columns,
  data,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  loading: _loading = false,
  emptyMessage = 'No data available',
}: DataTableProps) {
  const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / rowsPerPage)) : 0
  const pageClamped = totalPages > 0 ? Math.max(0, Math.min(page, totalPages - 1)) : 0
  const from = totalCount === 0 ? 0 : pageClamped * rowsPerPage + 1
  const to = Math.min((pageClamped + 1) * rowsPerPage, totalCount)

  const allSelected = data.length > 0 && selectedRows.length === data.length
  const someSelected = selectedRows.length > 0 && !allSelected
  const headerSelectChecked = allSelected
    ? true
    : someSelected
      ? 'indeterminate'
      : false

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked)
  }

  const handleSelectRow = (id: number) => {
    onSelectRow?.(id)
  }

  const isSelected = (id: number) => selectedRows.includes(id)

  return (
    <div className="w-full overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectAll && (
                <TableHead className="w-10 p-2 pr-0">
                  <Checkbox
                    aria-label="select all"
                    checked={headerSelectChecked}
                    onCheckedChange={(v) => handleSelectAll(!!v)}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    'whitespace-nowrap',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                  )}
                  style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onSelectAll ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const itemSelected = isSelected(row.id)
                return (
                  <TableRow
                    key={row.id ?? index}
                    data-state={itemSelected ? 'selected' : undefined}
                    className={itemSelected ? 'bg-muted/50' : undefined}
                  >
                    {onSelectRow && (
                      <TableCell className="p-2 pr-0">
                        <Checkbox
                          aria-label="select row"
                          checked={itemSelected}
                          onCheckedChange={() => handleSelectRow(row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.align === 'right' && 'text-right',
                          column.align === 'center' && 'text-center',
                        )}
                      >
                        {column.render
                          ? column.render(row[column.id], row)
                          : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

      <div className="flex flex-col items-stretch gap-3 border-t p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(v) => onRowsPerPageChange(parseInt(v, 10))}
          >
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rowsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="whitespace-nowrap text-center text-sm text-muted-foreground sm:text-left">
          {totalCount === 0
            ? '0 of 0'
            : `${from}–${to} of ${totalCount}`}
        </p>
        <div className="flex items-center justify-center gap-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onPageChange(pageClamped - 1)}
            disabled={pageClamped < 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-0.5">Previous</span>
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            Page {totalCount === 0 ? 0 : pageClamped + 1} of {totalCount === 0 ? 0 : totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => onPageChange(pageClamped + 1)}
            disabled={pageClamped >= totalPages - 1 || totalCount === 0}
          >
            <span className="mr-0.5">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
