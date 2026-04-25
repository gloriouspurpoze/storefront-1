import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

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

  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt])

  return (
    <AppDialogsContext.Provider value={value}>
      {children}

      <Dialog open={confirmOpen} onOpenChange={(o) => !o && finishConfirm(false)}>
        <DialogContent
          className="max-w-md"
          aria-describedby="app-confirm-message"
        >
          <DialogHeader>
            <DialogTitle id="app-confirm-title">{confirmOpts.title}</DialogTitle>
            <DialogDescription id="app-confirm-message" className="whitespace-pre-wrap">
              {confirmOpts.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => finishConfirm(false)}>
              {confirmOpts.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              type="button"
              variant={confirmOpts.danger ? 'destructive' : 'default'}
              autoFocus
              onClick={() => finishConfirm(true)}
            >
              {confirmOpts.confirmLabel ?? 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={promptOpen} onOpenChange={(o) => !o && finishPrompt(null)}>
        <DialogContent
          className="max-w-md"
          aria-describedby={promptOpts.message ? 'app-prompt-message' : undefined}
        >
          <DialogHeader>
            <DialogTitle id="app-prompt-title">{promptOpts.title}</DialogTitle>
            {promptOpts.message ? (
              <DialogDescription id="app-prompt-message">{promptOpts.message}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="app-prompt-input">{promptOpts.label ?? 'Value'}</Label>
            {promptOpts.multiline ? (
              <Textarea
                id="app-prompt-input"
                className="min-h-[100px] resize-y"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                autoFocus
                rows={3}
              />
            ) : (
              <Input
                id="app-prompt-input"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    finishPrompt(promptValue)
                  }
                }}
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => finishPrompt(null)}>
              {promptOpts.cancelLabel ?? 'Cancel'}
            </Button>
            <Button type="button" onClick={() => finishPrompt(promptValue)}>
              {promptOpts.confirmLabel ?? 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
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

export function useAppConfirm() {
  return useAppDialogs().confirm
}

export function useAppPrompt() {
  return useAppDialogs().prompt
}
