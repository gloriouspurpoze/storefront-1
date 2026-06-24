import React, { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import type { CrmActivityType, CrmDeal } from '../../types/crm.types'
import { crmService } from '../../services/api/crm.service'
import { ACTIVITY_TYPE_LABELS } from '../../lib/crmNiche'
import { followUpDueAt } from '../../lib/crmDealFollowUp'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

const QUICK_SLOTS = [
  { label: 'Today 4 PM', value: () => followUpDueAt(0, 16) },
  { label: 'Tomorrow 10 AM', value: () => followUpDueAt(1, 10) },
  { label: 'In 3 days', value: () => followUpDueAt(3, 10) },
  { label: 'Next week', value: () => followUpDueAt(7, 10) },
] as const

const FOLLOW_UP_TYPES: CrmActivityType[] = ['call', 'whatsapp', 'task']

type Props = {
  open: boolean
  deal: CrmDeal | null
  onClose: () => void
  onSaved: () => void
}

export function CrmDealFollowUpDialog({ open, deal, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    subject: '',
    type: 'call' as CrmActivityType,
    dueAt: followUpDueAt(1, 10),
    body: '',
  })

  useEffect(() => {
    if (!open || !deal) return
    setForm({
      subject: `Follow up — ${deal.name}`,
      type: 'call',
      dueAt: followUpDueAt(1, 10),
      body: '',
    })
  }, [open, deal])

  const save = async () => {
    if (!deal || !form.subject.trim()) return
    setSaving(true)
    try {
      await crmService.upsertActivity({
        subject: form.subject.trim(),
        type: form.type,
        status: 'open',
        priority: 'normal',
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        relatedType: 'deal',
        relatedId: deal.id,
        body: form.body.trim() || undefined,
      })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Schedule follow-up
          </DialogTitle>
          <DialogDescription>
            {deal ? (
              <>
                Reminder for <span className="font-medium text-foreground">{deal.name}</span>. Shows on the deal
                card and in Activities.
              </>
            ) : (
              'Pick a deal to schedule a follow-up.'
            )}
          </DialogDescription>
        </DialogHeader>

        {deal ? (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="follow-up-subject">Subject</Label>
              <Input
                id="follow-up-subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CrmActivityType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ACTIVITY_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="follow-up-due">Due</Label>
                <Input
                  id="follow-up-due"
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {QUICK_SLOTS.map((slot) => (
                <Button
                  key={slot.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn('h-7 text-xs', form.dueAt === slot.value() && 'border-primary bg-primary/5')}
                  onClick={() => setForm((f) => ({ ...f, dueAt: slot.value() }))}
                >
                  {slot.label}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="follow-up-notes">Notes (optional)</Label>
              <Textarea
                id="follow-up-notes"
                rows={3}
                placeholder="What to discuss on the call…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!deal || saving || !form.subject.trim()}>
            {saving ? 'Saving…' : 'Save reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
