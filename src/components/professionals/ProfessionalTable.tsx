/**
 * ============================================================================
 * PROFESSIONAL TABLE
 * ============================================================================
 * Data table component for displaying professionals
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  CheckCircle as VerifiedIcon,
  AccessTime as PendingIcon,
  Cancel as RejectedIcon,
  Circle as CircleIcon,
} from '@mui/icons-material'
import { Professional } from '../../types/professional.types'

interface ProfessionalTableProps {
  professionals: Professional[]
  loading: boolean
  onMenuClick: (event: React.MouseEvent<HTMLElement>, professional: Professional) => void
}

export function ProfessionalTable({ professionals, loading, onMenuClick }: ProfessionalTableProps) {
  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <VerifiedIcon sx={{ fontSize: 16, mr: 0.5 }} />
      case 'pending':
        return <PendingIcon sx={{ fontSize: 16, mr: 0.5 }} />
      case 'rejected':
        return <RejectedIcon sx={{ fontSize: 16, mr: 0.5 }} />
    default:
      return undefined
    }
  }

  const getVerificationColor = (status: string) => {
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return '#16a34a'
      case 'busy':
        return '#ea580c'
      case 'offline':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const getExpertiseColor = (level: string) => {
    switch (level) {
      case 'expert':
        return 'error'
      case 'intermediate':
        return 'primary'
      case 'beginner':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading professionals...</Typography>
      </Paper>
    )
  }

  if (professionals.length === 0) {
    return (
      <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No professionals found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try adjusting your filters or create a new professional
        </Typography>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 600 }}>Professional</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Skills</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Expertise</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Experience</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Availability</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {professionals.map((professional) => {
            const ratingValue = professional.rating != null && !Number.isNaN(Number(professional.rating))
              ? Number(professional.rating).toFixed(1)
              : '—'

            const totalReviews = professional.totalReviews ?? 0

            return (
              <TableRow
                key={professional._id}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {/* Professional */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={professional.profileImage}
                      alt={`${professional.firstName} ${professional.lastName}`}
                      sx={{ width: 40, height: 40 }}
                    >
                      {professional.firstName?.[0]}{professional.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {professional.firstName} {professional.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {professional.professionalId}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Contact */}
                <TableCell>
                  <Typography variant="body2">{professional.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {professional.phoneNumber}
                  </Typography>
                </TableCell>

                {/* Company */}
                <TableCell>
                  {professional.isIndependent ? (
                    <Chip label="Independent" size="small" color="info" />
                  ) : professional.serviceProviderId ? (
                    <Typography variant="body2">
                      {professional.serviceProviderId.businessName}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* Skills */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                    {professional.skills.slice(0, 2).map((skill, index) => (
                      <Chip key={index} label={skill} size="small" variant="outlined" />
                    ))}
                    {professional.skills.length > 2 && (
                      <Chip
                        label={`+${professional.skills.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>

                {/* Expertise */}
                <TableCell>
                  <Chip
                    label={professional.expertiseLevel}
                    size="small"
                    color={getExpertiseColor(professional.expertiseLevel)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>

                {/* Experience */}
                <TableCell>
                  <Typography variant="body2">{professional.experience} years</Typography>
                </TableCell>

                {/* Availability */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CircleIcon
                      sx={{
                        fontSize: 10,
                        color: getAvailabilityColor(professional.availability),
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        textTransform: 'capitalize',
                        color: getAvailabilityColor(professional.availability),
                        fontWeight: 500,
                      }}
                    >
                      {professional.availability}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    icon={getVerificationIcon(professional.verificationStatus)}
                    label={professional.verificationStatus}
                    size="small"
                    color={getVerificationColor(professional.verificationStatus) as any}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>

                {/* Rating */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      ⭐ {ratingValue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({totalReviews})
                    </Typography>
                  </Box>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      onClick={(e) => onMenuClick(e, professional)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

