import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Grid,
  Chip,
  Divider,
  IconButton,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material'
import { formatDate, getInitials } from '../../lib/utils'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  userType: 'customer' | 'provider' | 'admin'
  isVerified: boolean
  profilePicture?: string
  createdAt: string
  updatedAt?: string
  isActive?: boolean
}

interface UserDetailsDialogProps {
  open: boolean
  onClose: () => void
  user: User | null
  onEdit?: () => void
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onClose,
  user,
  onEdit,
}) => {
  if (!user) return null

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'admin':
        return 'error'
      case 'provider':
        return 'info'
      case 'customer':
        return 'success'
      default:
        return 'default'
    }
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <SecurityIcon />
      case 'provider':
        return <PersonIcon />
      case 'customer':
        return <PersonIcon />
      default:
        return <PersonIcon />
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          User Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={user.profilePicture}
            sx={{ width: 100, height: 100, mb: 2 }}
          >
            {getInitials(`${user.firstName} ${user.lastName}`)}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip
              icon={getUserTypeIcon(user.userType)}
              label={user.userType}
              color={getUserTypeColor(user.userType) as any}
              sx={{ textTransform: 'capitalize' }}
            />
            {user.isVerified && (
              <Chip
                icon={<VerifiedIcon />}
                label="Verified"
                color="success"
              />
            )}
            {user.isActive === false ? (
              <Chip
                icon={<BlockIcon />}
                label="Inactive"
                color="error"
              />
            ) : (
              <Chip
                icon={<ActiveIcon />}
                label="Active"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Contact Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmailIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {user.phone && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhoneIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {user.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Account Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        User ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {user.id}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SecurityIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Account Type
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {user.userType}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Joined
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {user.updatedAt && (
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(user.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Status Summary */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Status Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: user.isVerified ? 'success.lighter' : 'warning.lighter', borderRadius: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: user.isVerified ? 'success.main' : 'warning.main' }}>
                  {user.isVerified ? '✓' : '!'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email {user.isVerified ? 'Verified' : 'Not Verified'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: user.isActive !== false ? 'success.lighter' : 'error.lighter', borderRadius: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: user.isActive !== false ? 'success.main' : 'error.main' }}>
                  {user.isActive !== false ? '✓' : '✗'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Account {user.isActive !== false ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {onEdit && (
          <Button onClick={onEdit} variant="contained">
            Edit User
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

