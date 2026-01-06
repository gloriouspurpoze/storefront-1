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
  Rating,
  Tooltip,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material'
import { ServiceProvider } from '../../types'

interface ProviderTableProps {
  providers: ServiceProvider[]
  loading?: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, provider: ServiceProvider) => void
}

export function ProviderTable({ providers, loading, onMenuClick }: ProviderTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <VerifiedIcon fontSize="small" />
      case 'pending':
        return <PendingIcon fontSize="small" />
      case 'rejected':
        return <RejectedIcon fontSize="small" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">Loading providers...</Typography>
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
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Provider</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Business</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Services</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Rating</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Experience</TableCell>
            <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Location</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {providers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No providers found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            providers.map((provider) => (
              <TableRow key={provider.id} hover>
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BusinessIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="600">
                        {provider.business_name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {provider.user_id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight="500">
                    {provider.business_name || 'N/A'}
                  </Typography>
                  {provider.business_license && (
                    <Typography variant="caption" color="text.secondary">
                      License: {provider.business_license}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {provider.services_offered?.slice(0, 2).map((service, index) => (
                      <Chip
                        key={index}
                        label={service}
                        size="small"
                        sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                      />
                    ))}
                    {provider.services_offered && provider.services_offered.length > 2 && (
                      <Chip
                        label={`+${provider.services_offered.length - 2}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating
                      value={provider.rating || 0}
                      readOnly
                      size="small"
                      precision={0.1}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({provider.total_reviews || 0})
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Chip
                    icon={getStatusIcon(provider.verification_status)}
                    label={provider.verification_status?.charAt(0).toUpperCase() + provider.verification_status?.slice(1) || 'Unknown'}
                    color={getStatusColor(provider.verification_status) as any}
                    size="small"
                    sx={{ borderRadius: 2, fontWeight: 500 }}
                  />
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2">
                    {provider.years_experience || 0} years
                  </Typography>
                </TableCell>
                
                <TableCell sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {provider.service_areas?.join(', ') || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="right" sx={{ py: 2 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => onMenuClick(e, provider)}
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
