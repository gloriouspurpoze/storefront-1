import React from 'react'
import { Chip, ChipProps } from '@mui/material'
import { styled } from '@mui/material/styles'
import { OrderStatus } from '../../types'

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: OrderStatus
  size?: 'small' | 'medium'
}

const StyledChip = styled(Chip)<{ status: OrderStatus }>(({ theme, status }) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'accepted':
        return {
          backgroundColor: theme.palette.success.light,
          color: theme.palette.success.contrastText,
        }
      case 'pending':
        return {
          backgroundColor: theme.palette.warning.light,
          color: theme.palette.warning.contrastText,
        }
      case 'completed':
        return {
          backgroundColor: theme.palette.info.light,
          color: theme.palette.info.contrastText,
        }
      case 'rejected':
      case 'cancelled':
        return {
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.contrastText,
        }
      default:
        return {
          backgroundColor: theme.palette.grey[300],
          color: theme.palette.grey[700],
        }
    }
  }

  return {
    ...getStatusColor(status),
    fontWeight: 600,
    textTransform: 'capitalize',
    '& .MuiChip-label': {
      px: 1.5,
    },
  }
})

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'small',
  ...props 
}) => {
  return (
    <StyledChip
      label={status}
      status={status}
      size={size}
      {...props}
    />
  )
}
