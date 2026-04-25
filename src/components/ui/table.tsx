import React from 'react';
import { cn } from '../../lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={cn('[&_tr]:border-b', className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function TableFooter({ children, className }: TableFooterProps) {
  return (
    <tfoot className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}>
      {children}
    </tfoot>
  );
}

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ children, className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
)
TableHead.displayName = 'TableHead'

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    >
      {children}
    </td>
  )
)
TableCell.displayName = 'TableCell'

interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCaption({ children, className }: TableCaptionProps) {
  return (
    <caption className={cn('mt-4 text-sm text-muted-foreground', className)}>
      {children}
    </caption>
  );
}
