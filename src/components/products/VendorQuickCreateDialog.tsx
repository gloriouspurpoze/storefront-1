import React, { useState } from 'react'
import { Loader2, Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { FormField, SwitchField } from '../forms'
import { FinanceService } from '../../services/api/finance.service'

export interface VendorQuickCreateResult {
  id: string
  name: string
  legal_name?: string
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called with the newly-created vendor so the parent can auto-select it. */
  onCreated: (vendor: VendorQuickCreateResult) => void
}

const EMPTY = {
  name: '',
  legalName: '',
  email: '',
  phone: '',
  taxId: '',
  billingAddress: '',
  paymentTermsDays: '',
  notes: '',
  isActive: true,
}

export function VendorQuickCreateDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameErr, setNameErr] = useState('')

  const set = (field: keyof typeof EMPTY) => (val: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: val }))

  const handleClose = () => {
    if (busy) return
    setForm(EMPTY)
    setError(null)
    setNameErr('')
    onClose()
  }

  const handleSave = async () => {
    setNameErr('')
    setError(null)

    if (!form.name.trim()) {
      setNameErr('Vendor name is required')
      return
    }

    const terms = parseInt(form.paymentTermsDays, 10)

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      legalName: form.legalName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      taxId: form.taxId.trim() || undefined,
      billingAddress: form.billingAddress.trim() || undefined,
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
    }
    if (form.paymentTermsDays.trim() && !Number.isNaN(terms) && terms >= 0) {
      body.paymentTermsDays = terms
    }

    try {
      setBusy(true)
      const res = await FinanceService.createVendor(body)
      const vendor = (res as unknown as { data?: unknown }).data ?? res
      const created = vendor as { id: string; name: string; legalName?: string; legal_name?: string }
      onCreated({
        id: created.id,
        name: created.name,
        legal_name: created.legalName ?? created.legal_name,
      })
      setForm(EMPTY)
      setError(null)
      setNameErr('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create vendor')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Add New Vendor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <FormField
            label="Vendor name"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Reliance Retail"
            required
            error={nameErr}
            disabled={busy}
          />

          <div className="flex flex-wrap gap-4">
            <div className="min-w-[180px] flex-1">
              <FormField
                label="Legal name"
                value={form.legalName}
                onChange={set('legalName')}
                placeholder="e.g. Reliance Retail Ltd."
                disabled={busy}
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <FormField
                label="Tax ID / GST"
                value={form.taxId}
                onChange={set('taxId')}
                placeholder="27AABCR1234C1Z5"
                disabled={busy}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-[180px] flex-1">
              <FormField
                label="Email"
                value={form.email}
                onChange={set('email')}
                type="email"
                placeholder="vendor@example.com"
                disabled={busy}
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <FormField
                label="Phone"
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                placeholder="+91 98765 43210"
                disabled={busy}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-[180px] flex-1">
              <FormField
                label="Billing address"
                value={form.billingAddress}
                onChange={set('billingAddress')}
                placeholder="Street, city, state, PIN"
                disabled={busy}
              />
            </div>
            <div className="w-[140px] shrink-0">
              <FormField
                label="Payment terms (days)"
                value={form.paymentTermsDays}
                onChange={set('paymentTermsDays')}
                type="number"
                placeholder="30"
                disabled={busy}
              />
            </div>
          </div>

          <FormField
            label="Internal notes"
            value={form.notes}
            onChange={set('notes')}
            placeholder="Any procurement notes…"
            multiline
            rows={2}
            disabled={busy}
          />

          <SwitchField
            label="Active (visible in vendor pickers)"
            value={form.isActive}
            onChange={set('isActive') as (v: boolean) => void}
            disabled={busy}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy ? 'Creating…' : 'Create vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
