import React from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import type {
  CrmActivity,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmDealStage,
} from '../../types/crm.types'

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

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0 } }}>
      {contact ? (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">
                {contact.firstName} {contact.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contact.email}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={onEdit}>
              Edit
            </Button>
          </Stack>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {contact.phone ? (
              <Typography variant="body2">
                <strong>Phone:</strong> {contact.phone}
              </Typography>
            ) : null}
            {companyName ? (
              <Typography variant="body2">
                <strong>Company:</strong> {companyName}
              </Typography>
            ) : null}
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <strong>Lifecycle:</strong> <Chip size="small" label={contact.lifecycle} variant="outlined" />
            </Typography>
            {contact.leadSource ? (
              <Typography variant="body2">
                <strong>Source:</strong> {contact.leadSource}
              </Typography>
            ) : null}
            {contact.notes ? (
              <Typography variant="body2" color="text.secondary">
                {contact.notes}
              </Typography>
            ) : null}
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Activity timeline
          </Typography>
          <List dense sx={{ flex: 1, overflow: 'auto', py: 0 }}>
            {sorted.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activities linked to this contact yet.
              </Typography>
            ) : (
              sorted.map((a) => (
                <ListItem key={a.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemText
                    primary={a.subject}
                    secondary={
                      <>
                        <Chip size="small" label={a.type} sx={{ mr: 0.5 }} />
                        {formatActivityWhen(a)} · {a.status}
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      ) : null}
    </Drawer>
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

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 0 } }}>
      {deal ? (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6">{deal.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatMoney(deal.amount, deal.currency)} · {deal.probability}% · {STAGE_LABELS[deal.stage]}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" onClick={onEdit}>
              Edit
            </Button>
          </Stack>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {deal.expectedCloseDate ? (
              <Typography variant="body2">
                <strong>Expected close:</strong> {String(deal.expectedCloseDate).slice(0, 10)}
              </Typography>
            ) : null}
            {companyName ? (
              <Typography variant="body2">
                <strong>Company:</strong> {companyName}
              </Typography>
            ) : null}
            {contactName ? (
              <Typography variant="body2">
                <strong>Primary contact:</strong> {contactName}
              </Typography>
            ) : null}
            {deal.notes ? (
              <Typography variant="body2" color="text.secondary">
                {deal.notes}
              </Typography>
            ) : null}
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Activity timeline
          </Typography>
          <List dense sx={{ flex: 1, overflow: 'auto', py: 0 }}>
            {sorted.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No activities linked to this deal yet.
              </Typography>
            ) : (
              sorted.map((a) => (
                <ListItem key={a.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemText
                    primary={a.subject}
                    secondary={
                      <>
                        <Chip size="small" label={a.type} sx={{ mr: 0.5 }} />
                        {formatActivityWhen(a)} · {a.status}
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      ) : null}
    </Drawer>
  )
}
