/**
 * StandardTable – Single reusable data table for the project.
 * Features: sorting (client or server), search, pagination, selection, loading, empty state.
 * Use this component everywhere for consistent UX.
 */
import React, { useState, useMemo } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Checkbox,
  TextField,
  InputAdornment,
  Typography,
  Skeleton,
  alpha,
  useTheme,
} from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import { EmptyState } from './EmptyState'

export interface StandardTableColumn<T = any> {
  id: string
  label: string
  minWidth?: number
  width?: number | string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  /** Value used for sorting when column is sortable. Defaults to row[column.id]. */
  valueGetter?: (row: T) => string | number | null | undefined
  /** Custom cell render. Receives (value, row). */
  render?: (value: any, row: T) => React.ReactNode
}

export type SortOrder = 'asc' | 'desc'

export interface StandardTableProps<T = any> {
  /** Column definitions */
  columns: StandardTableColumn<T>[]
  /** Data rows */
  data: T[]
  /** Unique row id. Default: row => row.id ?? row._id ?? index */
  getRowId?: (row: T, index: number) => string
  /** Table title (optional, shown above toolbar) */
  title?: string

  // —— Search ——
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** When true, search is controlled by parent (searchValue + onSearchChange). Otherwise internal state. */
  searchControlled?: boolean

  // —— Sort ——
  sortBy?: string
  sortOrder?: SortOrder
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void
  /** When true, sort is controlled by parent. When false and columns have sortable, client-side sort. */
  sortControlled?: boolean

  // —— Pagination ——
  page?: number
  rowsPerPage?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  rowsPerPageOptions?: number[]

  // —— Selection ——
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void

  // —— State ——
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  error?: string | null

  // —— UI ——
  /** Toolbar left content (e.g. "Add" button). Search sits next to it. */
  toolbarLeft?: React.ReactNode
  /** Toolbar right content */
  toolbarRight?: React.ReactNode
  /** Render extra column for row actions (e.g. IconButton menu) */
  renderActions?: (row: T, index: number) => React.ReactNode
  /** Table size */
  size?: 'small' | 'medium'
  /** Sticky table header */
  stickyHeader?: boolean
  /** Hide table border / paper */
  elevation?: number
  /** Min height for table body (avoids layout shift when empty) */
  minHeight?: number
  /** Show search bar */
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
  size = 'medium',
  stickyHeader = false,
  elevation = 0,
  minHeight = 280,
  showSearch = true,
}: StandardTableProps<T>) {
  const theme = useTheme()

  // Uncontrolled search
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

  // Uncontrolled sort (client-side)
  const [sortByInternal, setSortByInternal] = useState('')
  const [sortOrderInternal, setSortOrderInternal] = useState<SortOrder>('asc')
  const sortBy = sortControlled ? (sortByProp ?? '') : sortByInternal
  const sortOrder = sortControlled ? (sortOrderProp ?? 'asc') : sortOrderInternal

  const handleSortClick = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId)
    if (!col?.sortable) return
    const nextOrder: SortOrder =
      sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc'
    if (sortControlled && onSortChange) {
      onSortChange(columnId, nextOrder)
    } else {
      setSortByInternal(columnId)
      setSortOrderInternal(nextOrder)
    }
  }

  // Client-side sorted data when sort not controlled
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

  // Pagination: when uncontrolled, use client-side slice
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

  const handlePageChange = (_: unknown, newPage: number) => {
    if (isPaginationControlled && onPageChange) onPageChange(newPage)
    else setPageInternal(newPage)
  }
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    if (isPaginationControlled && onRowsPerPageChange) onRowsPerPageChange(v)
    else setRowsPerPageInternal(v)
    if (!isPaginationControlled) setPageInternal(0)
    if (onPageChange && isPaginationControlled) onPageChange(0)
  }

  // Selection
  const selectedIds = selectedIdsProp ?? []
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return
    if (e.target.checked) {
      onSelectionChange(paginatedData.map((row, i) => getRowId(row, i)))
    } else {
      onSelectionChange([])
    }
  }
  const handleSelectRow = (row: T, index: number) => {
    if (!onSelectionChange) return
    const id = getRowId(row, index)
    if (selectedSet.has(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }
  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, i) => selectedSet.has(getRowId(row, i)))
  const someSelected = selectedIds.length > 0

  const colCount = columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)

  return (
    <Box sx={{ width: '100%' }}>
      {/* Toolbar: left content + search + right content */}
      {(toolbarLeft || showSearch || toolbarRight) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          {toolbarLeft}
          {showSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <ClearIcon
                      fontSize="small"
                      sx={{ cursor: 'pointer' }}
                      onClick={clearSearch}
                    />
                  </InputAdornment>
                ) : null,
              }}
              sx={{ minWidth: 220 }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }} />
          {toolbarRight}
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        elevation={elevation}
        sx={{
          overflow: 'auto',
          minHeight: loading || paginatedData.length === 0 ? minHeight : undefined,
        }}
      >
        <Table size={size} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected && !allSelected}
                    checked={allSelected}
                    onChange={handleSelectAll}
                    disabled={loading || paginatedData.length === 0}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  style={{
                    minWidth: col.minWidth,
                    width: col.width,
                    fontWeight: 600,
                  }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => handleSortClick(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {renderActions && <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(5, rowsPerPage) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {selectable && <TableCell padding="checkbox" />}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                  {renderActions && <TableCell />}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} sx={{ border: 0, py: 0, verticalAlign: 'top' }}>
                  <EmptyState
                    title={emptyMessage}
                    description={emptyDescription ?? (searchValue ? 'Try a different search' : '')}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const id = getRowId(row, index)
                const isSelected = selectedSet.has(id)
                return (
                  <TableRow
                    key={id}
                    hover
                    selected={isSelected}
                    sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(row, index)}
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
                        <TableCell key={col.id} align={col.align}>
                          {cellContent}
                        </TableCell>
                      )
                    })}
                    {renderActions && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {renderActions(row, index)}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && paginatedData.length > 0 && (
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Rows:"
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      )}
    </Box>
  )
}
