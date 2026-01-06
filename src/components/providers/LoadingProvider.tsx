import React from 'react'
import { Backdrop, CircularProgress, Box, Typography } from '@mui/material'
import { useAppSelector } from '../../store/hooks'

export function LoadingProvider() {
  const { isLoading, loadingMessage } = useAppSelector((state) => state.ui)

  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      open={isLoading}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2
      }}>
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ color: 'white' }}>
          {loadingMessage}
        </Typography>
      </Box>
    </Backdrop>
  )
}
