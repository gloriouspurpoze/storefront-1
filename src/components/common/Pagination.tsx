import React from 'react'
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material'

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
  itemsPerPageOptions = [10, 25, 50, 100]
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = isMobile ? 3 : 5
    
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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' },
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderTop: `1px solid ${theme.palette.divider}`
    }}>
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            sx={{ height: 32 }}
          >
            {itemsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Page info */}
      <Typography variant="body2" color="text.secondary">
        {startItem}-{endItem} of {totalItems} items
      </Typography>

      {/* Pagination controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ChevronLeftIcon />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          size="small"
          sx={{ minWidth: 'auto', px: 1 }}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? 'contained' : 'outlined'}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              size="small"
              sx={{ 
                minWidth: 32, 
                height: 32,
                px: 1
              }}
            >
              {page}
            </Button>
          ))}
        </Box>

        <Button
          variant="outlined"
          endIcon={<ChevronRightIcon />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          size="small"
          sx={{ minWidth: 'auto', px: 1 }}
        >
          Next
        </Button>
      </Box>
    </Box>
  )
}
