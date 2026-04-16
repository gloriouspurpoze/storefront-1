import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Public as PublicIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { Slider } from '../../types'

interface SliderDetailsDialogProps {
  open: boolean
  onClose: () => void
  slider: Slider | null
}

export function SliderDetailsDialog({ open, onClose, slider }: SliderDetailsDialogProps) {
  if (!slider) return null

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
        return <PublicIcon />
      case 'customers':
        return <GroupIcon />
      case 'providers':
        return <GroupIcon />
      default:
        return <PublicIcon />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpired = (endDate?: string) => {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  }

  const isScheduled = (startDate?: string) => {
    if (!startDate) return false
    return new Date(startDate) > new Date()
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
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <ImageIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {slider.title}
            </Typography>
            {slider.subtitle && (
              <Typography variant="body2" color="text.secondary">
                {slider.subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Status and Audience */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={slider.is_active ? 'Active' : 'Inactive'}
                color={slider.is_active ? 'success' : 'default'}
                sx={{ fontWeight: 500 }}
              />
              <Chip
                icon={getAudienceIcon(slider.target_audience || 'all')}
                label={
                  slider.target_audience
                    ? slider.target_audience.charAt(0).toUpperCase() + slider.target_audience.slice(1)
                    : 'All Users'
                }
                color={getAudienceColor(slider.target_audience || 'all') as any}
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={`Position ${slider.position}`}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Box>
          </Grid>

          {/* Image Preview */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              Image Preview
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  position: 'relative'
                }}
              >
                {slider.image_url ? (
                  <img
                    src={slider.image_url}
                    alt={slider.image_alt || slider.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">No image available</Typography>
                  </Box>
                )}
              </Box>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {slider.image_alt || 'No alt text provided'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Content Information */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Content Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="500" gutterBottom>
                Description:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {slider.description || 'No description provided'}
              </Typography>
            </Paper>
          </Grid>

          {/* Call to Action */}
          {slider.button_text && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                  Call to Action
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {slider.button_url ? (
                      <Button
                        variant="contained"
                        startIcon={<LinkIcon />}
                        component="a"
                        href={slider.button_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ borderRadius: 2 }}
                      >
                        {slider.button_text}
                      </Button>
                    ) : (
                      <Button variant="contained" startIcon={<LinkIcon />} disabled sx={{ borderRadius: 2 }}>
                        {slider.button_text}
                      </Button>
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        Button Text: {slider.button_text}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        URL: {slider.button_url}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </>
          )}

          {/* Schedule Information */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Schedule Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  Start Date
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {slider.start_date ? formatDate(slider.start_date) : 'No start date set'}
              </Typography>
              {slider.start_date && isScheduled(slider.start_date) && (
                <Chip
                  label="Scheduled"
                  color="info"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  End Date
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {slider.end_date ? formatDate(slider.end_date) : 'No end date set'}
              </Typography>
              {slider.end_date && isExpired(slider.end_date) && (
                <Chip
                  label="Expired"
                  color="error"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          </Grid>

          {/* Timestamps */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="500" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(slider.created_at)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="500" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(slider.updated_at)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: 'grey.50',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
