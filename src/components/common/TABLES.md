# Tables — when to use what

> All tables in the admin must use one of the three patterns below. Do **not**
> roll yet another `<table>` from scratch. If none of these fit, extend
> `StandardTable` (or open a PR) — don't fork.

## 1. `StandardTable` — the canonical paginated list table

Use for any "list of entities" page: services, payments, invoices, categories,
plans, etc. Handles search, sort, pagination, row selection, bulk actions,
empty/error states, and sticky headers.

```tsx
import { StandardTable, type StandardTableColumn } from '../components/common'

const columns: StandardTableColumn<Booking>[] = [
  { id: 'id', label: 'Booking #', sortable: true },
  { id: 'customer', label: 'Customer', sortable: true, valueGetter: r => r.customer.name },
  { id: 'amount', label: 'Amount', align: 'right',
    render: (_, r) => formatCurrency(r.amount) },
]

<StandardTable<Booking>
  columns={columns}
  data={bookings}
  page={page}
  rowsPerPage={pageSize}
  totalCount={total}
  onPageChange={setPage}
  onRowsPerPageChange={setPageSize}
  renderActions={row => <RowActions row={row} />}
/>
```

Lives in `src/components/common/StandardTable.tsx`. ✔ Already DESIGN.md-aligned.

## 2. `CrmDataTable` — CRM-specific superset

Same shape as `StandardTable` plus column filters, density toggles, and saved
views. Use **only** inside CRM pages (`pages/crm/*`). Outside CRM, prefer
`StandardTable`.

Lives in `src/components/crm/CrmDataTable.tsx`.

## 3. Raw `<Table>` primitives — for tiny, non-list tables

Use only when the table is small (< ~5 rows, no pagination/search/sort) and
purely presentational — comparison tables, spec sheets, inline editors.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'

<Table>
  <TableHeader>
    <TableRow><TableHead>Plan</TableHead><TableHead>Price</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Basic</TableCell><TableCell>₹499</TableCell></TableRow>
  </TableBody>
</Table>
```

Lives in `src/components/ui/table.tsx` (shadcn).

## What was removed

- `DataTable` (`src/components/common/DataTable.tsx`) — dead, zero inbound
  imports. Deleted in the DESIGN.md cleanup. If you see old documentation
  pointing at it, migrate to `StandardTable`.
