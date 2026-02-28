# StandardTable – Project-wide data table

Use **StandardTable** from `@/components/common` for all list/table UIs so the app has one consistent table: sorting, search, pagination, selection, loading, and empty state.

**Migrated pages:** Invoices, Payments, Categories (categories-list), Service Requests (services).

## Features

- **Sorting** – Client-side (default) or server-side (controlled via `onSortChange`). Set `sortable: true` on columns.
- **Search** – Toolbar search; controlled (`searchValue` + `onSearchChange`) or internal state. Set `showSearch={true}` (default).
- **Pagination** – Client-side (default, when `totalCount`/`onPageChange` not provided) or server-side.
- **Selection** – Optional checkboxes with `selectable` and `onSelectionChange`.
- **Loading** – Skeleton rows when `loading={true}`.
- **Empty state** – Uses `EmptyState` when there are no rows; `emptyMessage` and `emptyDescription` configurable.
- **Row actions** – `renderActions={(row, index) => <IconButton ... />}` for menus or buttons per row.

## Minimal example

```tsx
import { StandardTable, type StandardTableColumn } from '../../components/common'

const columns: StandardTableColumn<MyType>[] = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
  { id: 'role', label: 'Role', align: 'center' },
]

<StandardTable
  columns={columns}
  data={items}
  loading={loading}
  emptyMessage="No users found"
  showSearch
  getRowId={(row) => row.id}
/>
```

## With search + sort + pagination (client-side)

Search and sort are applied to `data`; pagination slices the result. No need to pass `onSearchChange` / `onSortChange` / `onPageChange` unless you want server-side behaviour.

```tsx
<StandardTable
  columns={columns}
  data={filteredList}
  loading={loading}
  searchPlaceholder="Search by name or email…"
  showSearch
  rowsPerPage={25}
  emptyMessage="No results"
  getRowId={(row) => row.id}
/>
```

## Server-side pagination / sort / search

Pass `totalCount`, `onPageChange`, `onRowsPerPageChange` and (optional) `onSortChange` / `onSearchChange`. The parent fetches the current page and updates `data` and `totalCount`.

```tsx
<StandardTable
  columns={columns}
  data={pageOfItems}
  totalCount={totalFromApi}
  page={page}
  rowsPerPage={rowsPerPage}
  onPageChange={setPage}
  onRowsPerPageChange={setRowsPerPage}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); refetch(); }}
  searchValue={search}
  onSearchChange={setSearch}
  searchControlled
  sortControlled
  loading={loading}
  getRowId={(row) => row.id}
/>
```

## With row actions and selection

```tsx
<StandardTable
  columns={columns}
  data={items}
  selectable
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  renderActions={(row) => (
    <IconButton size="small" onClick={() => handleMenu(row)}>
      <MoreIcon />
    </IconButton>
  )}
  toolbarLeft={<Button startIcon={<AddIcon />}>Add</Button>}
  getRowId={(row) => row.id}
/>
```

## Column options

| Prop         | Type     | Description |
|-------------|----------|-------------|
| `id`        | string   | Field key in row (or use only `render`) |
| `label`     | string   | Header text |
| `align`     | 'left' \| 'right' \| 'center' | Cell alignment |
| `minWidth`  | number   | Min column width (px) |
| `width`     | number \| string | Column width |
| `sortable`  | boolean  | Show sort control; uses `valueGetter` or `row[id]` for sort |
| `valueGetter` | (row) => string \| number | Value used for sorting |
| `render`    | (value, row) => ReactNode | Custom cell content |

## Props summary

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | StandardTableColumn[] | required | Column definitions |
| `data` | T[] | required | Rows |
| `getRowId` | (row, index) => string | id \|\| _id \|\| index | Row key |
| `searchPlaceholder` | string | "Search…" | Search input placeholder |
| `searchValue` / `onSearchChange` | string / (v) => void | - | Controlled search |
| `searchControlled` | boolean | false | Use parent for search |
| `sortBy` / `sortOrder` / `onSortChange` | - | - | Controlled sort |
| `sortControlled` | boolean | false | Use parent for sort |
| `page` / `rowsPerPage` / `totalCount` | number | - | Pagination; omit for client-side |
| `onPageChange` / `onRowsPerPageChange` | - | - | Pagination callbacks |
| `selectable` / `selectedIds` / `onSelectionChange` | - | - | Row selection |
| `loading` | boolean | false | Show skeleton rows |
| `emptyMessage` / `emptyDescription` | string | - | Empty state text |
| `error` | string \| null | - | Error message above table |
| `toolbarLeft` / `toolbarRight` | ReactNode | - | Toolbar content |
| `renderActions` | (row, index) => ReactNode | - | Actions column |
| `size` | 'small' \| 'medium' | 'medium' | Row density |
| `stickyHeader` | boolean | false | Sticky header |
| `showSearch` | boolean | true | Show search field |
