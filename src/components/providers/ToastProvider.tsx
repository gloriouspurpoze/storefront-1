import React from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { removeToast } from '../../store/slices/uiSlice'

export function ToastProvider() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector((state) => state.ui.toasts)

  const handleClose = (id: string) => {
    dispatch(removeToast(id))
  }

  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration || 6000}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            top: `${80 + (index * 70)}px !important`,
            zIndex: 9999
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}
