import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  const isNarrow = useMediaQuery('(max-width: 639px)')

  const getPageNumbers = () => {
    const pages: (number | '...')[] = []
    const maxVisiblePages = isNarrow ? 3 : 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }

    return pages
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div
      className={cn(
        'flex flex-col items-stretch gap-3 border-t p-2 sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-1">
        <span className="whitespace-nowrap text-sm text-muted-foreground">Rows per page</span>
        <Select
          value={String(itemsPerPage)}
          onValueChange={(v) => onItemsPerPageChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="whitespace-nowrap text-center text-sm text-muted-foreground sm:text-left">
        {startItem}–{endItem} of {totalItems} items
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-0.5">Previous</span>
        </Button>

        <div className="flex items-center gap-0.5">
          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              className="h-8 min-w-8 px-0"
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="mr-0.5">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
