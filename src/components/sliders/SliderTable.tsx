import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Avatar,
  Tooltip,
  Switch,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
  Group as GroupIcon,
} from '@mui/icons-material'
import { Slider } from '../../types'

interface SliderTableProps {
  sliders: Slider[]
  loading?: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, slider: Slider) => void
  onToggleStatus?: (slider: Slider) => void
  onMoveUp?: (slider: Slider) => void
  onMoveDown?: (slider: Slider) => void
}

export function SliderTable({ 
  sliders, 
  loading, 
  onMenuClick, 
  onToggleStatus,
  onMoveUp,
  onMoveDown 
}: SliderTableProps) {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default'
  }

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'primary'
      case 'customers':
        return 'success'
      case 'providers':
        return 'info'
      default:
        return 'default'
    }
  }

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all':
        return <PublicIcon fontSize="small" />
      case 'customers':
        return <GroupIcon fontSize="small" />
      case 'providers':
        return <GroupIcon fontSize="small" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (endDate?: string) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Loading sliders...</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Preview</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Position</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Audience</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Schedule</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Menu</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sliders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No sliders found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            sliders.map((slider, index) => (
              <TableRow key={slider.id} hover>
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      variant="rounded"
                      sx={{ 
                        width: 60, 
                        height: 40, 
                        bgcolor: 'grey.100',
                        border: '1px solid',
                        borderColor: 'grey.300'
                      }}
                    >
                      {slider.image_url ? (
                        <img
                          src={slider.image_url}
                          alt={slider.image_alt || slider.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <ImageIcon color="action" />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="500" noWrap>
                        {slider.title}
                      </Typography>
                      {slider.subtitle && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {slider.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {slider.title}
                    </Typography>
                    {slider.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {slider.subtitle}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="500">
                      {slider.position}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {onMoveUp && index > 0 && (
                        <Tooltip title="Move up">
                          <IconButton
                            size="small"
                            onClick={() => onMoveUp(slider)}
                            sx={{ p: 0.5 }}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onMoveDown && index < sliders.length - 1 && (
                        <Tooltip title="Move down">
                          <IconButton
                            size="small"
                            onClick={() => onMoveDown(slider)}
                            sx={{ p: 0.5 }}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={slider.is_active}
                      onChange={() => onToggleStatus?.(slider)}
                      size="small"
                      color="success"
                    />
                    <Chip
                      label={slider.is_active ? 'Active' : 'Inactive'}
                      color={getStatusColor(slider.is_active) as any}
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 500 }}
                    />
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Chip
                    icon={getAudienceIcon(slider.target_audience || 'all')}
                    label={slider.target_audience?.charAt(0).toUpperCase() + slider.target_audience?.slice(1) || 'All'}
                    color={getAudienceColor(slider.target_audience || 'all') as any}
                    size="small"
                    sx={{ borderRadius: 2, fontWeight: 500 }}
                  />
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box>
                    {slider.start_date && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Start: {formatDate(slider.start_date)}
                      </Typography>
                    )}
                    {slider.end_date && (
                      <Typography 
                        variant="caption" 
                        color={isExpired(slider.end_date) ? 'error.main' : 'text.secondary'} 
                        display="block"
                      >
                        End: {formatDate(slider.end_date)}
                        {isExpired(slider.end_date) && ' (Expired)'}
                      </Typography>
                    )}
                    {!slider.start_date && !slider.end_date && (
                      <Typography variant="caption" color="text.secondary">
                        No schedule
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={(e) => onMenuClick(e, slider)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'primary.100',
                            color: 'primary.main'
                          }
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => onMenuClick(e, slider)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'warning.100',
                            color: 'warning.main'
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => onMenuClick(e, slider)}
                        sx={{
                          '&:hover': {
                            bgcolor: 'error.100',
                            color: 'error.main'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                
                <TableCell align="right" sx={{ py: 2 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => onMenuClick(e, slider)}
                    sx={{
                      '&:hover': {
                        bgcolor: 'primary.100',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
