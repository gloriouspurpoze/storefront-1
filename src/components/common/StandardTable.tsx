/**
 * StandardTable – Single reusable data table (shadcn + Tailwind, no MUI).
 */
import React, { useState, useMemo } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '../../lib/utils'
import { EmptyState } from './EmptyState'

export interface StandardTableColumn<T = any> {
  id: string
  label: string
  minWidth?: number
  width?: number | string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  valueGetter?: (row: T) => string | number | null | undefined
  render?: (value: any, row: T) => React.ReactNode
}

export type SortOrder = 'asc' | 'desc'

export interface StandardTableProps<T = any> {
  columns: StandardTableColumn<T>[]
  data: T[]
  getRowId?: (row: T, index: number) => string
  title?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchControlled?: boolean
  sortBy?: string
  sortOrder?: SortOrder
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void
  sortControlled?: boolean
  page?: number
  rowsPerPage?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  rowsPerPageOptions?: number[]
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  error?: string | null
  toolbarLeft?: React.ReactNode
  toolbarRight?: React.ReactNode
  renderActions?: (row: T, index: number) => React.ReactNode
  size?: 'small' | 'medium'
  stickyHeader?: boolean
  elevation?: number
  minHeight?: number
  showSearch?: boolean
}

const defaultRowsPerPageOptions = [10, 25, 50, 100]

export function StandardTable<T = any>({
  columns,
  data,
  getRowId = (row: any, index: number) => row?.id ?? row?._id ?? String(index),
  title,
  searchPlaceholder = 'Search…',
  searchValue: searchValueProp,
  onSearchChange,
  searchControlled = false,
  sortBy: sortByProp,
  sortOrder: sortOrderProp,
  onSortChange,
  sortControlled = false,
  page: pageProp = 0,
  rowsPerPage: rowsPerPageProp = 10,
  totalCount: totalCountProp,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = defaultRowsPerPageOptions,
  selectable = false,
  selectedIds: selectedIdsProp = [],
  onSelectionChange,
  loading = false,
  emptyMessage = 'No data',
  emptyDescription,
  error = null,
  toolbarLeft,
  toolbarRight,
  renderActions,
  size: _size = 'medium',
  stickyHeader = false,
  elevation: _elevation = 0,
  minHeight = 280,
  showSearch = true,
}: StandardTableProps<T>) {
  const [searchInternal, setSearchInternal] = useState('')
  const searchValue = searchControlled ? (searchValueProp ?? '') : searchInternal
  const setSearchValue = searchControlled ? (onSearchChange ?? (() => {})) : setSearchInternal
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchValue(v)
    if (searchControlled && onSearchChange) onSearchChange(v)
  }
  const clearSearch = () => {
    setSearchValue('')
    if (searchControlled && onSearchChange) onSearchChange('')
  }

  const [sortByInternal, setSortByInternal] = useState('')
  const [sortOrderInternal, setSortOrderInternal] = useState<SortOrder>('asc')
  const sortBy = sortControlled ? (sortByProp ?? '') : sortByInternal
  const sortOrder = sortControlled ? (sortOrderProp ?? 'asc') : sortOrderInternal

  const handleSortClick = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId)
    if (!col?.sortable) return
    const nextOrder: SortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc'
    if (sortControlled && onSortChange) {
      onSortChange(columnId, nextOrder)
    } else {
      setSortByInternal(columnId)
      setSortOrderInternal(nextOrder)
    }
  }

  const sortedData = useMemo(() => {
    if (sortControlled || !sortBy) return data
    const col = columns.find((c) => c.id === sortBy)
    if (!col?.sortable) return data
    const getVal = col.valueGetter ?? ((row: any) => row[col.id])
    return [...data].sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      const aNum = typeof va === 'number' ? va : String(va ?? '').toLowerCase()
      const bNum = typeof vb === 'number' ? vb : String(vb ?? '').toLowerCase()
      if (aNum < bNum) return sortOrder === 'asc' ? -1 : 1
      if (aNum > bNum) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortBy, sortOrder, sortControlled, columns])

  const [pageInternal, setPageInternal] = useState(0)
  const [rowsPerPageInternal, setRowsPerPageInternal] = useState(rowsPerPageProp)
  const page = pageProp ?? pageInternal
  const rowsPerPage = rowsPerPageProp ?? rowsPerPageInternal
  const totalCount = totalCountProp ?? sortedData.length
  const isPaginationControlled = totalCountProp !== undefined && onPageChange != null

  const paginatedData = useMemo(() => {
    if (isPaginationControlled) return sortedData
    const start = page * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, page, rowsPerPage, isPaginationControlled])

  const goToPage = (newPage: number) => {
    if (isPaginationControlled && onPageChange) onPageChange(newPage)
    else setPageInternal(newPage)
  }

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = parseInt(e.target.value, 10)
    if (isPaginationControlled && onRowsPerPageChange) onRowsPerPageChange(v)
    else setRowsPerPageInternal(v)
    if (!isPaginationControlled) setPageInternal(0)
    if (onPageChange && isPaginationControlled) onPageChange(0)
  }

  const selectedIds = selectedIdsProp ?? []
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const handleSelectAll = (value: boolean | 'indeterminate') => {
    if (!onSelectionChange) return
    if (value === true) {
      onSelectionChange(paginatedData.map((row, i) => getRowId(row, i)))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (row: T, index: number) => {
    if (!onSelectionChange) return
    const id = getRowId(row, index)
    if (selectedSet.has(id)) onSelectionChange(selectedIds.filter((x) => x !== id))
    else onSelectionChange([...selectedIds, id])
  }

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, i) => selectedSet.has(getRowId(row, i)))
  const someSelected = selectedIds.length > 0
  const colCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)
  const lastPage = Math.max(0, Math.ceil(totalCount / rowsPerPage) - 1)
  const from = totalCount === 0 ? 0 : page * rowsPerPage + 1
  const to = Math.min((page + 1) * rowsPerPage, totalCount)

  const headerClass = cn(stickyHeader && 'sticky top-0 z-20 bg-card shadow-sm')

  return (
    <div className="w-full">
      {title && <h2 className="mb-2 text-lg font-semibold leading-none tracking-tight">{title}</h2>}
      {(toolbarLeft || showSearch || toolbarRight) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {toolbarLeft}
          {showSearch && (
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                className="h-9 pl-8 pr-8"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )}
          <div className="min-w-0 flex-1" />
          {toolbarRight}
        </div>
      )}

      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

      <div
        className="overflow-x-auto rounded-md border border-border bg-card"
        style={{ minHeight: loading || paginatedData.length === 0 ? minHeight : undefined }}
      >
        <Table>
          <TableHeader className={headerClass}>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10 p-2">
                  <Checkbox
                    checked={allSelected ? true : !someSelected ? false : 'indeterminate'}
                    onCheckedChange={handleSelectAll}
                    disabled={loading || paginatedData.length === 0}
                    aria-label="Select all on page"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    'p-2 font-semibold',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.minWidth != null && `min-w-[${col.minWidth}px]`,
                    typeof col.width === 'number' && `w-[${col.width}px]`,
                    typeof col.width === 'string' && col.width,
                  )}
                >
                  {col.sortable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 -ml-2 gap-0.5 font-semibold text-foreground hover:bg-transparent"
                      onClick={() => handleSortClick(col.id)}
                    >
                      {col.label}
                      {sortBy === col.id ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        )
                      ) : null}
                    </Button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
              {renderActions && <TableHead className="p-2 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: Math.min(5, rowsPerPage) }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {selectable && (
                      <TableCell className="p-2">
                        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} className="p-2">
                        <div className="h-4 max-w-[200px] w-[80%] animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                    {renderActions && <TableCell className="p-2">&nbsp;</TableCell>}
                  </TableRow>
                ))
              : paginatedData.length === 0
                ? [
                    <TableRow key="empty">
                      <TableCell colSpan={colCount} className="p-0 align-top">
                        <div className="p-2">
                          <EmptyState
                            title={emptyMessage}
                            description={emptyDescription ?? (searchValue ? 'Try a different search' : '')}
                            size="small"
                          />
                        </div>
                      </TableCell>
                    </TableRow>,
                  ]
                : paginatedData.map((row, index) => {
                    const id = getRowId(row, index)
                    const isSelected = selectedSet.has(id)
                    return (
                      <TableRow
                        key={id}
                        className={cn(isSelected && 'bg-muted/50')}
                        data-state={isSelected ? 'selected' : undefined}
                      >
                        {selectable && (
                          <TableCell className="p-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectRow(row, index)}
                              aria-label="Select row"
                            />
                          </TableCell>
                        )}
                        {columns.map((col) => {
                          const value = (row as any)[col.id]
                          const cellContent = col.render
                            ? col.render(value, row)
                            : value != null
                              ? String(value)
                              : '—'
                          return (
                            <TableCell
                              key={col.id}
                              className={cn(
                                'p-2',
                                col.align === 'right' && 'text-right',
                                col.align === 'center' && 'text-center',
                              )}
                            >
                              {cellContent}
                            </TableCell>
                          )
                        })}
                        {renderActions && (
                          <TableCell
                            className="p-2 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderActions(row, index)}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
          </TableBody>
        </Table>
      </div>

      {!loading && paginatedData.length > 0 && (
        <div className="mt-0 flex flex-wrap items-center justify-end gap-2 border-t border-border px-1 py-2 text-sm text-muted-foreground sm:gap-4">
          <span>Rows</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
            aria-label="Rows per page"
          >
            {rowsPerPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>
            {from}–{to} of {totalCount}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= lastPage}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
