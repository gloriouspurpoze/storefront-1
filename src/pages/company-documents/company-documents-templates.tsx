import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus, Archive } from 'lucide-react'
import { CompanyDocumentsService } from '../../services/api/company-documents.service'
import type { CompanyDocumentTemplate } from '../../types/company-documents.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

function audienceLabel(a: string): string {
  return a.replace(/_/g, ' ')
}

function categoryLabel(c: string): string {
  return c.replace(/_/g, ' ')
}

export function CompanyDocumentsTemplatesPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_company_documents')

  const [rows, setRows] = useState<CompanyDocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await CompanyDocumentsService.listTemplates({
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        audience: audience || undefined,
        docCategory: category || undefined,
        includeArchived,
      })
      setRows(res.data?.templates ?? [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [search, audience, category, includeArchived])

  useEffect(() => {
    void load()
  }, [load])

  async function archive(id: string) {
    if (!window.confirm('Archive this template? It will be hidden from new envelopes unless restored via backend.')) return
    try {
      await CompanyDocumentsService.archiveTemplate(id)
      void load()
    } catch {
      /* toast from api */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Template library</CardTitle>
            <CardDescription>
              Versioned documents — publish when ready, attach PDFs for download alongside hosted HTML/Markdown.
            </CardDescription>
          </div>
          {canManage && (
            <Button asChild>
              <Link to="/company-documents/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New template
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="cd-search">Search</Label>
                <Input
                  id="cd-search"
                  placeholder="Title, slug, tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void load()}
                />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience || '__all'} onValueChange={(v) => setAudience(v === '__all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All audiences</SelectItem>
                    <SelectItem value="company_internal">Company internal</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="all_staff">All staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category || '__all'} onValueChange={(v) => setCategory(v === '__all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All categories</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="hiring">Hiring</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="customer_terms">Customer terms</SelectItem>
                    <SelectItem value="contractor_agreement">Contractor agreement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="cd-arch"
                  checked={includeArchived}
                  onCheckedChange={(v) => setIncludeArchived(v === true)}
                />
                <Label htmlFor="cd-arch" className="cursor-pointer font-normal">
                  Show archived
                </Label>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Apply filters
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
              Loading templates…
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No templates yet. Create one to send onboarding or policy acknowledgements.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-medium">{t.title}</div>
                          <div className="font-mono text-xs text-muted-foreground">{t.slug}</div>
                        </TableCell>
                        <TableCell className="capitalize">{audienceLabel(t.audience)}</TableCell>
                        <TableCell className="capitalize">{categoryLabel(t.docCategory)}</TableCell>
                        <TableCell>{t.contentFormat}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {t.isArchived ? (
                              <Badge variant="outline">Archived</Badge>
                            ) : t.isPublished ? (
                              <Badge>Published</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                            <Badge variant="outline">v{t.version}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/company-documents/templates/${t.id}`}>Edit</Link>
                            </Button>
                            {canManage && !t.isArchived && (
                              <Button variant="ghost" size="sm" onClick={() => archive(t.id)} title="Archive">
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
