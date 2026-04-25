import React from 'react'
import { Pencil, X } from 'lucide-react'
import type { CrmActivity, CrmCompany, CrmContact, CrmDeal, CrmDealStage } from '../../types/crm.types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'

function formatActivityWhen(a: CrmActivity) {
  const t = a.dueAt ?? a.completedAt ?? a.createdAt
  try {
    return new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return t
  }
}

type ContactDrawerProps = {
  open: boolean
  onClose: () => void
  contact: CrmContact | null
  companyName?: string
  activities: CrmActivity[]
  onEdit: () => void
}

export function CrmContactDetailDrawer({
  open,
  onClose,
  contact,
  companyName,
  activities,
  onEdit,
}: ContactDrawerProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[150] bg-black/50"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-[160] flex h-full w-full max-w-md flex-col border-l bg-background shadow-lg',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        {contact ? (
          <div className="flex h-full flex-col p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-tight">
                  {contact.firstName} {contact.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{contact.email}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              {contact.phone ? (
                <p>
                  <span className="font-medium">Phone:</span> {contact.phone}
                </p>
              ) : null}
              {companyName ? (
                <p>
                  <span className="font-medium">Company:</span> {companyName}
                </p>
              ) : null}
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Lifecycle:</span>
                <Badge variant="outline" className="font-normal">
                  {contact.lifecycle}
                </Badge>
              </p>
              {contact.leadSource ? (
                <p>
                  <span className="font-medium">Source:</span> {contact.leadSource}
                </p>
              ) : null}
              {contact.notes ? <p className="text-muted-foreground">{contact.notes}</p> : null}
            </div>
            <Separator className="mb-3" />
            <h3 className="mb-2 text-sm font-medium">Activity timeline</h3>
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
              {sorted.length === 0 ? (
                <li className="text-muted-foreground">No activities linked to this contact yet.</li>
              ) : (
                sorted.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium leading-snug">{a.subject}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[0.7rem] font-normal">
                        {a.type}
                      </Badge>
                      <span>
                        {formatActivityWhen(a)} · {a.status}
                      </span>
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  )
}

const STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

type DealDrawerProps = {
  open: boolean
  onClose: () => void
  deal: CrmDeal | null
  formatMoney: (amount: number, currency: string) => string
  companyName?: string
  contactName?: string
  activities: CrmActivity[]
  onEdit: () => void
}

export function CrmDealDetailDrawer({
  open,
  onClose,
  deal,
  formatMoney,
  companyName,
  contactName,
  activities,
  onEdit,
}: DealDrawerProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[150] bg-black/50"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-[160] flex h-full w-full max-w-md flex-col border-l bg-background shadow-lg',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        {deal ? (
          <div className="flex h-full flex-col p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-tight">{deal.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(deal.amount, deal.currency)} · {deal.probability}% · {STAGE_LABELS[deal.stage]}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              {deal.expectedCloseDate ? (
                <p>
                  <span className="font-medium">Expected close:</span> {String(deal.expectedCloseDate).slice(0, 10)}
                </p>
              ) : null}
              {companyName ? (
                <p>
                  <span className="font-medium">Company:</span> {companyName}
                </p>
              ) : null}
              {contactName ? (
                <p>
                  <span className="font-medium">Primary contact:</span> {contactName}
                </p>
              ) : null}
              {deal.notes ? <p className="text-muted-foreground">{deal.notes}</p> : null}
            </div>
            <Separator className="mb-3" />
            <h3 className="mb-2 text-sm font-medium">Activity timeline</h3>
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
              {sorted.length === 0 ? (
                <li className="text-muted-foreground">No activities linked to this deal yet.</li>
              ) : (
                sorted.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium leading-snug">{a.subject}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[0.7rem] font-normal">
                        {a.type}
                      </Badge>
                      <span>
                        {formatActivityWhen(a)} · {a.status}
                      </span>
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  )
}
