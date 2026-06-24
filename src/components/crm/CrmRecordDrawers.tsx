import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Check, Pencil, X } from 'lucide-react'
import type { CrmActivity, CrmCompany, CrmContact, CrmDeal } from '../../types/crm.types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'
import {
  ACTIVITY_TYPE_LABELS,
  CONTACT_LIFECYCLE_LABELS,
  DEAL_STAGE_LABELS,
  RECORD_TYPE_LABELS,
  adminPathToBooking,
  adminPathToOrder,
  adminPathToUser,
} from '../../lib/crmNiche'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import {
  FOLLOW_UP_STATUS_LABEL,
  FOLLOW_UP_STATUS_STYLES,
  formatFollowUpWhen,
  type DealFollowUpSummary,
} from '../../lib/crmDealFollowUp'

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
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Record type:</span>
                <Badge variant="secondary" className="font-normal">
                  {RECORD_TYPE_LABELS[contact.recordType ?? 'customer']}
                </Badge>
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Stage:</span>
                <Badge variant="outline" className="font-normal">
                  {CONTACT_LIFECYCLE_LABELS[contact.lifecycle]}
                </Badge>
              </p>
              {contact.locality ? (
                <p>
                  <span className="font-medium">Locality:</span> {contact.locality}
                </p>
              ) : null}
              {contact.addressLine ? (
                <p>
                  <span className="font-medium">Address:</span> {contact.addressLine}
                </p>
              ) : null}
              {contact.serviceCategory ? (
                <p>
                  <span className="font-medium">Service:</span> {contact.serviceCategory}
                </p>
              ) : null}
              {companyName ? (
                <p>
                  <span className="font-medium">B2B account:</span> {companyName}
                </p>
              ) : null}
              {contact.leadSource ? (
                <p>
                  <span className="font-medium">Source:</span> {contact.leadSource}
                </p>
              ) : null}
              {(contact.platformUserId || contact.platformBookingId || contact.platformOrderId) && (
                <div className="rounded-md border border-border bg-muted/40 p-2">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Platform links</p>
                  <div className="flex flex-col gap-1.5">
                    {contact.platformUserId?.trim() ? (
                      <Button variant="outline" size="sm" className="h-8 justify-start" asChild>
                        <Link to={adminPathToUser(contact.platformUserId.trim())}>Open user</Link>
                      </Button>
                    ) : null}
                    {contact.platformBookingId?.trim() ? (
                      <Button variant="outline" size="sm" className="h-8 justify-start" asChild>
                        <Link to={adminPathToBooking(contact.platformBookingId.trim())}>Open booking</Link>
                      </Button>
                    ) : null}
                    {contact.platformOrderId?.trim() ? (
                      <Button variant="outline" size="sm" className="h-8 justify-start" asChild>
                        <Link to={adminPathToOrder(contact.platformOrderId.trim())}>Open order</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
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
                        {ACTIVITY_TYPE_LABELS[a.type]}
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

type DealDrawerProps = {
  open: boolean
  onClose: () => void
  deal: CrmDeal | null
  formatMoney: (amount: number, currency: string) => string
  companyName?: string
  contactName?: string
  activities: CrmActivity[]
  followUp?: DealFollowUpSummary | null
  onScheduleFollowUp?: () => void
  onMarkFollowUpDone?: (activityId: string) => void
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
  followUp,
  onScheduleFollowUp,
  onMarkFollowUpDone,
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
                  {formatMoney(deal.amount, deal.currency)} · {deal.probability}% · {DEAL_STAGE_LABELS[deal.stage]}
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
              {deal.locality ? (
                <p>
                  <span className="font-medium">Locality:</span> {deal.locality}
                </p>
              ) : null}
              {deal.phone ? (
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${deal.phone}`} className="text-primary underline-offset-2 hover:underline">
                    {deal.phone}
                  </a>
                </p>
              ) : null}
              {deal.serviceCategory ? (
                <p>
                  <span className="font-medium">Service:</span>{' '}
                  {getProfessionalCategoryLabel(deal.serviceCategory)}
                </p>
              ) : null}
              {companyName ? (
                <p>
                  <span className="font-medium">B2B account:</span> {companyName}
                </p>
              ) : null}
              {contactName ? (
                <p>
                  <span className="font-medium">Primary contact:</span> {contactName}
                </p>
              ) : null}
              {(deal.platformBookingId || deal.platformOrderId) && (
                <div className="rounded-md border border-border bg-muted/40 p-2">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Platform links</p>
                  <div className="flex flex-col gap-1.5">
                    {deal.platformBookingId?.trim() ? (
                      <Button variant="outline" size="sm" className="h-8 justify-start" asChild>
                        <Link to={adminPathToBooking(deal.platformBookingId.trim())}>Open booking</Link>
                      </Button>
                    ) : null}
                    {deal.platformOrderId?.trim() ? (
                      <Button variant="outline" size="sm" className="h-8 justify-start" asChild>
                        <Link to={adminPathToOrder(deal.platformOrderId.trim())}>Open order</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
              {deal.notes ? <p className="text-muted-foreground">{deal.notes}</p> : null}
            </div>

            {followUp ? (
              <div
                className={cn(
                  'mb-4 rounded-lg border p-3 text-sm',
                  FOLLOW_UP_STATUS_STYLES[followUp.status].strip
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">Next follow-up</p>
                  <Badge variant="outline" className={cn('border text-[0.65rem]', FOLLOW_UP_STATUS_STYLES[followUp.status].badge)}>
                    {FOLLOW_UP_STATUS_LABEL[followUp.status]}
                  </Badge>
                </div>
                {followUp.nextActivity ? (
                  <>
                    <p className="font-medium leading-snug">{followUp.nextActivity.subject}</p>
                    <p className="mt-1 text-xs opacity-90">
                      {followUp.nextActivity.dueAt
                        ? formatFollowUpWhen(followUp.nextActivity.dueAt)
                        : 'Open task — no due date'}
                      {followUp.openCount > 1 ? ` · ${followUp.openCount} open tasks` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {onMarkFollowUpDone ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1"
                          onClick={() => onMarkFollowUpDone(followUp.nextActivity!.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark done
                        </Button>
                      ) : null}
                      {onScheduleFollowUp ? (
                        <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={onScheduleFollowUp}>
                          <CalendarClock className="h-3.5 w-3.5" />
                          Schedule another
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-xs opacity-90">No open follow-ups on this deal.</p>
                    {onScheduleFollowUp ? (
                      <Button type="button" size="sm" className="mt-2 h-7 gap-1" onClick={onScheduleFollowUp}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        Schedule follow-up
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

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
                        {ACTIVITY_TYPE_LABELS[a.type]}
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
