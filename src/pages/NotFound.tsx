import React from 'react'
import { Box, Button, Typography, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'

/**
 * 404 Not Found page for unmatched routes.
 * Industry standard: always have a catch-all route so users see a clear message instead of a blank layout.
 */
export function NotFound() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper elevation={0} sx={{ maxWidth: 420, p: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
          404
        </Typography>
        <Typography variant="h6" gutterBottom>
          Page not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button variant="outlined" startIcon={<HomeIcon />} onClick={() => navigate('/')}>
            Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default NotFound
