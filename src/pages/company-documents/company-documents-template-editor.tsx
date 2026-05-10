import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { CompanyDocumentsService } from '../../services/api/company-documents.service'
import type {
  CompanyDocAudience,
  CompanyDocCategory,
  CompanyDocContentFormat,
} from '../../types/company-documents.types'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { RichTextField } from '../../components/forms/RichTextField'

/** Quill toolbar tuned for policies/terms (links + structure; no embedded media). */
const HTML_DOC_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
}

const HTML_DOC_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'indent',
  'link',
]

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

export function CompanyDocumentsTemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_company_documents')

  const [loading, setLoading] = useState(!isNew)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [audience, setAudience] = useState<CompanyDocAudience>('company_internal')
  const [docCategory, setDocCategory] = useState<CompanyDocCategory>('policy')
  const [contentFormat, setContentFormat] = useState<CompanyDocContentFormat>('markdown')
  const [body, setBody] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [version, setVersion] = useState('1')
  const [isPublished, setIsPublished] = useState(false)
  const [tagsText, setTagsText] = useState('')

  useEffect(() => {
    if (isNew || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await CompanyDocumentsService.getTemplate(id)
        if (cancelled) return
        const t = res.data
        setTitle(t.title)
        setSlug(t.slug)
        setSlugTouched(true)
        setAudience(t.audience)
        setDocCategory(t.docCategory)
        setContentFormat(t.contentFormat)
        setBody(t.body ?? '')
        setPdfUrl(t.pdfUrl ?? '')
        setVersion(String(t.version ?? 1))
        setIsPublished(Boolean(t.isPublished))
        setTagsText((t.tags ?? []).join(', '))
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load template')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  useEffect(() => {
    if (!isNew || slugTouched) return
    setSlug(slugify(title))
  }, [title, isNew, slugTouched])

  async function save() {
    if (!canManage) return
    setSaving(true)
    setErr(null)
    try {
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        audience,
        docCategory,
        contentFormat,
        body: contentFormat === 'pdf_only' ? undefined : body,
        pdfUrl: pdfUrl.trim() || undefined,
        version: Math.max(1, parseInt(version, 10) || 1),
        isPublished,
        tags,
      }
      if (isNew) {
        const res = await CompanyDocumentsService.createTemplate(payload)
        const createdId = res.data?.id ?? (res.data as { _id?: string })?._id
        if (createdId) navigate(`/company-documents/templates/${createdId}`, { replace: true })
        else navigate('/company-documents/templates')
      } else if (id) {
        await CompanyDocumentsService.patchTemplate(id, payload)
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No access</CardTitle>
          <CardDescription>You need manage permission for company documents.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading template…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/company-documents/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to list
          </Link>
        </Button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isNew ? 'New template' : 'Edit template'}</CardTitle>
          <CardDescription>
            Choose <strong className="text-foreground">HTML</strong> for a rich editor (headings, lists, links) — content
            is stored as HTML and rendered on the hosted signing page. Markdown stays plain text with preview; PDF-first
            uses <code className="rounded bg-muted px-1">pdfUrl</code> plus optional intro.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cd-title">Title</Label>
            <Input id="cd-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cd-slug">Slug</Label>
            <Input
              id="cd-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} inputMode="numeric" />
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as CompanyDocAudience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_internal">Company internal</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="professional">Professional / technician</SelectItem>
                <SelectItem value="all_staff">All staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Document category</Label>
            <Select value={docCategory} onValueChange={(v) => setDocCategory(v as CompanyDocCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="hiring">Hiring</SelectItem>
                <SelectItem value="termination">Termination / exit</SelectItem>
                <SelectItem value="nda">NDA</SelectItem>
                <SelectItem value="liability">Liability / indemnity</SelectItem>
                <SelectItem value="safety">Safety (field ops)</SelectItem>
                <SelectItem value="customer_terms">Customer terms</SelectItem>
                <SelectItem value="contractor_agreement">Contractor agreement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Content format</Label>
            <Select value={contentFormat} onValueChange={(v) => setContentFormat(v as CompanyDocContentFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown (preview as plain)</SelectItem>
                <SelectItem value="html">HTML (rendered on signing page)</SelectItem>
                <SelectItem value="pdf_only">PDF primary (minimal body)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contentFormat === 'html' ? (
            <div className="md:col-span-2">
              <RichTextField
                label="Body"
                value={body}
                onChange={setBody}
                height={320}
                placeholder="Headings, bullet clauses, links to schedules…"
                modules={HTML_DOC_MODULES}
                formats={HTML_DOC_FORMATS}
              />
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cd-body">Body</Label>
              <Textarea
                id="cd-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className="font-mono text-sm"
                disabled={contentFormat === 'pdf_only'}
                placeholder={
                  contentFormat === 'pdf_only'
                    ? 'Optional short notice (PDF is linked separately)'
                    : '# Technician code of conduct\n\n…'
                }
              />
            </div>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cd-pdf">PDF URL (optional)</Label>
            <Input
              id="cd-pdf"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cd-tags">Tags (comma-separated)</Label>
            <Input
              id="cd-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="ac servicing, liability, 2026"
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <Checkbox id="cd-pub" checked={isPublished} onCheckedChange={(v) => setIsPublished(v === true)} />
            <Label htmlFor="cd-pub" className="cursor-pointer font-normal">
              Published (visible for operational use — still enforce envelopes only when you send them)
            </Label>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <Button type="button" onClick={() => void save()} disabled={saving || !title.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save template'
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/company-documents/templates">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
