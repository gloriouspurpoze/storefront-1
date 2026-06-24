import React, { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Smartphone, UserRound, Mail } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { useToast } from '../ui'
import { usersService } from '../../services/api/users.service'
import type { User } from '../../types'
import {
  generatePosCustomerPassword,
  POS_CUSTOMER_REGISTER_MODES,
  type PosCustomerRegisterMode,
} from '../../lib/posCustomer'
import { cn } from '../../lib/utils'

export type PosCustomerDialogPrefill = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mode?: PosCustomerRegisterMode
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelected: (user: User) => void
  prefill?: PosCustomerDialogPrefill
}

export function PosCustomerDialog({ open, onOpenChange, onSelected, prefill }: Props) {
  const { toast } = useToast()
  const [mode, setMode] = useState<PosCustomerRegisterMode>('walk_in')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode(prefill?.mode ?? 'walk_in')
    setFirstName(prefill?.firstName ?? '')
    setLastName(prefill?.lastName ?? '')
    setEmail(prefill?.email ?? '')
    setPhone(prefill?.phone ?? '')
    setPassword(generatePosCustomerPassword())
  }, [open, prefill])

  const modeInfo = POS_CUSTOMER_REGISTER_MODES[mode]

  const canSubmit = useMemo(() => {
    const fn = firstName.trim()
    const ln = lastName.trim()
    const ph = phone.trim()
    if (fn.length < 2 || ln.length < 2 || ph.length < 10) return false
    if (mode === 'full_account') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false
    return true
  }, [firstName, lastName, phone, email, mode])

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password)
      toast({ title: 'Password copied', description: 'Share with the customer securely.' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Select and copy the password manually.',
      })
    }
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const result = await usersService.findOrCreateDirectoryCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        mode,
        password: mode === 'full_account' ? password : undefined,
      })

      onSelected(result.user)
      onOpenChange(false)

      if (result.matchedExisting) {
        toast({
          title: 'Existing customer linked',
          description: `${result.user.firstName} ${result.user.lastName} was already in the directory (matched by phone).`,
        })
        return
      }

      if (mode === 'walk_in') {
        toast({
          title: result.created ? 'Walk-in profile ready' : 'Customer selected',
          description:
            result.password == null
              ? 'No password needed at the counter. After commit, share the booking ID; they can sign in later with OTP on the same phone.'
              : modeInfo.afterCreate,
        })
        return
      }

      toast({
        title: 'Full account created',
        description: result.password
          ? `${result.user.email} — temporary password generated. Copy it before closing.`
          : modeInfo.afterCreate,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not add customer'
      toast({ variant: 'destructive', title: 'Customer not added', description: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add customer to ticket</DialogTitle>
          <DialogDescription>
            Choose how this booking should be attached. Search the directory first when the customer may
            already exist — this dialog only runs when you need a new profile.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(POS_CUSTOMER_REGISTER_MODES) as PosCustomerRegisterMode[]).map((key) => {
              const info = POS_CUSTOMER_REGISTER_MODES[key]
              const selected = mode === key
              const Icon = key === 'walk_in' ? Smartphone : Mail
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={cn(
                    'flex flex-col rounded-lg border p-3 text-left transition',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'hover:border-primary/40 hover:bg-muted/40',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-sm font-semibold">{info.label}</span>
                    <Badge variant={key === 'walk_in' ? 'default' : 'secondary'} className="text-[10px]">
                      {info.badge}
                    </Badge>
                  </span>
                  <span className="mt-1.5 text-xs text-muted-foreground">{info.summary}</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">When to use {modeInfo.label}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {modeInfo.whenToUse.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-2 border-t border-border/60 pt-2">{modeInfo.afterCreate}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="pos-add-fn">First name</Label>
              <Input
                id="pos-add-fn"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pos-add-ln">Last name</Label>
              <Input
                id="pos-add-ln"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pos-add-phone">Phone (required)</Label>
            <Input
              id="pos-add-phone"
              placeholder="9876543210 or +919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              India 10-digit numbers get +91 automatically. We match existing customers by phone before
              creating anyone new.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pos-add-email">
              Email {mode === 'full_account' ? '(required)' : '(optional)'}
            </Label>
            <Input
              id="pos-add-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'walk_in' ? 'Leave blank for walk-in' : 'customer@example.com'}
            />
          </div>

          {mode === 'full_account' ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="pos-add-pw">Temporary password</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setPassword(generatePosCustomerPassword())}
                  >
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => void copyPassword()}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy
                  </Button>
                </div>
              </div>
              <Input id="pos-add-pw" readOnly value={password} className="font-mono text-xs" />
            </div>
          ) : (
            <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <UserRound className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              No password at the counter. A secure internal profile is created; the customer can claim it
              with OTP on the same phone later.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit || submitting} onClick={() => void submit()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : mode === 'walk_in' ? (
              'Add walk-in & select'
            ) : (
              'Create account & select'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
