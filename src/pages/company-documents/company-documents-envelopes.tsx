import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Mail, Link2, CheckCircle, MoreHorizontal } from 'lucide-react'
import {
  CompanyDocumentsService,
  publicDocumentSignUrl,
} from '../../services/api/company-documents.service'
import type {
  CompanyDocumentTemplate,
  DocumentSignatureEnvelope,
  EnvelopeRecipientRole,
  EnvelopeTemplateSummary,
} from '../../types/company-documents.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'

const NONE_TEMPLATE = '__none'

function isTerminalEnvelopeStatus(status: string): boolean {
  return ['signed', 'declined', 'cancelled'].includes(status)
}

function tplTitle(ref: string | EnvelopeTemplateSummary): string {
  if (typeof ref === 'string') return ref
  return ref.title || ref.slug || 'Template'
}

function envId(row: DocumentSignatureEnvelope & { _id?: string }): string {
  return row.id || row._id || ''
}

export function CompanyDocumentsEnvelopesPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_company_documents')

  const [rows, setRows] = useState<DocumentSignatureEnvelope[]>([])
  const [tplOptions, setTplOptions] = useState<CompanyDocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const [createOpen, setCreateOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>(NONE_TEMPLATE)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState<EnvelopeRecipientRole>('customer')
  const [adminNotes, setAdminNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const [sendOpen, setSendOpen] = useState(false)
  const [sendTarget, setSendTarget] = useState<DocumentSignatureEnvelope | null>(null)
  const [sendMessage, setSendMessage] = useState('')

  const [signOpen, setSignOpen] = useState(false)
  const [signTarget, setSignTarget] = useState<DocumentSignatureEnvelope | null>(null)
  const [signAck, setSignAck] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await CompanyDocumentsService.listEnvelopes({
        page: 1,
        limit: 100,
        status: statusFilter || undefined,
      })
      setRows(res.data?.envelopes ?? [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load envelopes')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const loadTemplates = useCallback(async () => {
    try {
      const res = await CompanyDocumentsService.listTemplates({ page: 1, limit: 20 })
      const list = res.data?.templates ?? []
      setTplOptions(list.filter((t) => !t.isArchived))
    } catch {
      setTplOptions([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (createOpen) void loadTemplates()
  }, [createOpen, loadTemplates])

  async function createEnvelope() {
    if (!templateId || templateId === NONE_TEMPLATE || !recipientEmail.trim()) return
    setCreating(true)
    try {
      await CompanyDocumentsService.createEnvelope({
        templateId: templateId === NONE_TEMPLATE ? '' : templateId,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        recipientRole,
        adminNotes: adminNotes.trim() || undefined,
      })
      setCreateOpen(false)
      setTemplateId(NONE_TEMPLATE)
      setRecipientEmail('')
      setRecipientName('')
      setAdminNotes('')
      void load()
    } catch {
      /* handled by api */
    } finally {
      setCreating(false)
    }
  }

  function copySignLink(row: DocumentSignatureEnvelope) {
    const url = publicDocumentSignUrl(row.signToken)
    void navigator.clipboard.writeText(url)
  }

  async function sendEmail() {
    if (!sendTarget) return
    const id = envId(sendTarget as DocumentSignatureEnvelope & { _id?: string })
    if (!id) return
    try {
      await CompanyDocumentsService.sendEnvelopeEmail(id, {
        message: sendMessage.trim() || undefined,
      })
      setSendOpen(false)
      setSendMessage('')
      setSendTarget(null)
      void load()
    } catch {
      /* toast */
    }
  }

  async function setEnvelopeDeclinedOrCancelled(row: DocumentSignatureEnvelope, status: 'declined' | 'cancelled') {
    const eid = envId(row as DocumentSignatureEnvelope & { _id?: string })
    if (!eid) return
    const verb = status === 'declined' ? 'Decline' : 'Cancel'
    if (
      !window.confirm(
        `${verb} this envelope? The recipient will no longer be able to sign using this link.`,
      )
    )
      return
    try {
      await CompanyDocumentsService.patchEnvelope(
        eid,
        { status },
        {
          successMessage: status === 'declined' ? 'Envelope marked as declined.' : 'Envelope cancelled.',
        },
      )
      void load()
    } catch {
      /* toast via api */
    }
  }

  async function markSigned() {
    if (!signTarget) return
    const id = envId(signTarget as DocumentSignatureEnvelope & { _id?: string })
    if (!id) return
    try {
      await CompanyDocumentsService.markEnvelopeSigned(id, {
        acknowledgement: signAck.trim() || undefined,
      })
      setSignOpen(false)
      setSignAck('')
      setSignTarget(null)
      void load()
    } catch {
      /* toast */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Signature envelopes</CardTitle>
            <CardDescription>
              One envelope per recipient email; send from the dashboard or share the hosted link. Status moves draft →
              sent → viewed → signed.
            </CardDescription>
          </div>
          {canManage && (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New envelope
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter || '__all'} onValueChange={(v) => setStatusFilter(v === '__all' ? '' : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
          </div>

          {err && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading envelopes…
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No envelopes match this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const id = envId(row as DocumentSignatureEnvelope & { _id?: string })
                      return (
                        <TableRow key={id || row.signToken}>
                          <TableCell>
                            <div className="font-medium">{row.recipientEmail}</div>
                            {row.recipientName && (
                              <div className="text-xs text-muted-foreground">{row.recipientName}</div>
                            )}
                          </TableCell>
                          <TableCell>{tplTitle(row.templateId)}</TableCell>
                          <TableCell className="capitalize">{row.recipientRole}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'signed'
                                  ? 'default'
                                  : row.status === 'declined' || row.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                            {row.sentAt && <div>Sent: {new Date(row.sentAt).toLocaleString()}</div>}
                            {row.viewedAt && <div>Viewed: {new Date(row.viewedAt).toLocaleString()}</div>}
                            {row.signedAt && <div>Signed: {new Date(row.signedAt).toLocaleString()}</div>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" type="button" onClick={() => copySignLink(row)}>
                                <Link2 className="mr-1 h-3.5 w-3.5" />
                                Copy link
                              </Button>
                              {canManage && !isTerminalEnvelopeStatus(row.status) && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setSendTarget(row)
                                      setSendOpen(true)
                                    }}
                                  >
                                    <Mail className="mr-1 h-3.5 w-3.5" />
                                    Email
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setSignTarget(row)
                                      setSignOpen(true)
                                    }}
                                  >
                                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                    Mark signed
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" type="button" className="px-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">More actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={() => void setEnvelopeDeclinedOrCancelled(row, 'declined')}
                                      >
                                        Decline (recipient refused)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer"
                                        onClick={() => void setEnvelopeDeclinedOrCancelled(row, 'cancelled')}
                                      >
                                        Cancel envelope
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New envelope</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_TEMPLATE}>Choose template…</SelectItem>
                  {tplOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-email">Recipient email</Label>
              <Input
                id="env-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-name">Recipient name (optional)</Label>
              <Input id="env-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Recipient role</Label>
              <Select value={recipientRole} onValueChange={(v) => setRecipientRole(v as EnvelopeRecipientRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-notes">Admin notes (optional)</Label>
              <Textarea id="env-notes" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={creating || templateId === NONE_TEMPLATE || !recipientEmail.trim()}
              onClick={() => void createEnvelope()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send signing email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Sends via API SMTP to {sendTarget?.recipientEmail}. Recipients open a hosted page on your API domain.
          </p>
          <div className="space-y-2">
            <Label htmlFor="send-msg">Optional message</Label>
            <Textarea
              id="send-msg"
              rows={4}
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              placeholder="Short note above the sign button…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSendOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void sendEmail()}>
              Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record offline signature</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Use when someone signed on paper or in another system — stores acknowledgement text if provided.
          </p>
          <div className="space-y-2">
            <Label htmlFor="sign-ack">Acknowledgement (optional)</Label>
            <Input
              id="sign-ack"
              value={signAck}
              onChange={(e) => setSignAck(e.target.value)}
              placeholder="Signer name or reference"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSignOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void markSigned()}>
              Mark signed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
