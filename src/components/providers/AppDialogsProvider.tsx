import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'

export type AppConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Use error styling for destructive actions */
  danger?: boolean
}

export type AppPromptOptions = {
  title: string
  message?: string
  label?: string
  defaultValue?: string
  multiline?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

type AppDialogsContextValue = {
  confirm: (options: AppConfirmOptions) => Promise<boolean>
  prompt: (options: AppPromptOptions) => Promise<string | null>
}

const AppDialogsContext = createContext<AppDialogsContextValue | null>(null)

export function AppDialogsProvider({ children }: { children: React.ReactNode }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmOpts, setConfirmOpts] = useState<AppConfirmOptions>({
    title: '',
    message: '',
  })
  const confirmResolve = useRef<(v: boolean) => void>(() => {})

  const [promptOpen, setPromptOpen] = useState(false)
  const [promptOpts, setPromptOpts] = useState<AppPromptOptions>({ title: '' })
  const [promptValue, setPromptValue] = useState('')
  const promptResolve = useRef<(v: string | null) => void>(() => {})

  const confirm = useCallback((options: AppConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmOpts(options)
      confirmResolve.current = resolve
      setConfirmOpen(true)
    })
  }, [])

  const finishConfirm = useCallback((value: boolean) => {
    setConfirmOpen(false)
    confirmResolve.current(value)
  }, [])

  const prompt = useCallback((options: AppPromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setPromptOpts(options)
      setPromptValue(options.defaultValue ?? '')
      promptResolve.current = resolve
      setPromptOpen(true)
    })
  }, [])

  const finishPrompt = useCallback((value: string | null) => {
    setPromptOpen(false)
    promptResolve.current(value)
  }, [])

  const value = useMemo(
    () => ({ confirm, prompt }),
    [confirm, prompt]
  )

  return (
    <AppDialogsContext.Provider value={value}>
      {children}

      <Dialog
        open={confirmOpen}
        onClose={() => finishConfirm(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="app-confirm-title"
      >
        <DialogTitle id="app-confirm-title">{confirmOpts.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {confirmOpts.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => finishConfirm(false)} variant="outlined">
            {confirmOpts.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            onClick={() => finishConfirm(true)}
            variant="contained"
            color={confirmOpts.danger ? 'error' : 'primary'}
            autoFocus
          >
            {confirmOpts.confirmLabel ?? 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promptOpen}
        onClose={() => finishPrompt(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="app-prompt-title"
      >
        <DialogTitle id="app-prompt-title">{promptOpts.title}</DialogTitle>
        <DialogContent>
          {promptOpts.message ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {promptOpts.message}
            </Typography>
          ) : null}
          <TextField
            autoFocus
            margin="dense"
            label={promptOpts.label ?? 'Value'}
            fullWidth
            multiline={promptOpts.multiline}
            minRows={promptOpts.multiline ? 3 : 1}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !promptOpts.multiline && !e.shiftKey) {
                e.preventDefault()
                finishPrompt(promptValue)
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => finishPrompt(null)} variant="outlined">
            {promptOpts.cancelLabel ?? 'Cancel'}
          </Button>
          <Button onClick={() => finishPrompt(promptValue)} variant="contained">
            {promptOpts.confirmLabel ?? 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppDialogsContext.Provider>
  )
}

export function useAppDialogs(): AppDialogsContextValue {
  const ctx = useContext(AppDialogsContext)
  if (!ctx) {
    throw new Error('useAppDialogs must be used within AppDialogsProvider')
  }
  return ctx
}

/** Convenience: confirm only */
export function useAppConfirm() {
  return useAppDialogs().confirm
}

export function useAppPrompt() {
  return useAppDialogs().prompt
}
