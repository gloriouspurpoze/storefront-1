import type { ReactNode } from 'react'

/** CRM table column/selection shapes (include-only row selection). */
export type GridRowId = string | number

export type GridRowSelectionModel = {
  type: 'include'
  ids: Set<GridRowId>
}

export type GridRenderCellParams<Row> = {
  value: unknown
  row: Row
  field: string
}

export type GridColDef<Row> = {
  field: string
  headerName: string
  width?: number
  minWidth?: number
  flex?: number
  sortable?: boolean
  type?: 'actions'
  getActions?: (p: { row: Row }) => ReactNode[]
  renderCell?: (p: GridRenderCellParams<Row>) => ReactNode
}
