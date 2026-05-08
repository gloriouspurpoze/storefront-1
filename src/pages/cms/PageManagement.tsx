import React, { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
  FilePlus2,
} from 'lucide-react'
import axios from 'axios'
import { RichTextField } from '../../components/forms'
import { PAGE_TEMPLATES, PAGE_TEMPLATE_KEYS } from './pageTemplates'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Textarea,
} from '../../components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

interface Page {
  _id: string
  title: string
  slug: string
  template?: string
  content?: string
  excerpt?: string
  status: 'draft' | 'published' | 'private' | 'archived'
  publishedAt?: string
  displayOrder: number
  author?: { name?: string; id?: string }
  analytics?: { views?: number }
  settings?: { showInMenu?: boolean; showTitle?: boolean }
  seo?: { title?: string; description?: string; keywords?: string[] }
  createdAt: string
}

function statusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'secondary'
    case 'private':
      return 'warning'
    case 'archived':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default function PageManagement() {
  const confirm = useAppConfirm()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [showSEO, setShowSEO] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    template: 'default',
    status: 'draft',
    showInMenu: true,
    showTitle: true,
    displayOrder: 0,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE}/cms/admin/pages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const raw = res?.data?.data?.pages ?? res?.data?.pages
      setPages(Array.isArray(raw) ? raw : [])
    } catch (error) {
      console.error('Error:', error)
      setPages([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        title: formData.title,
        slug: formData.slug || undefined,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        template: formData.template,
        status: formData.status,
        displayOrder: formData.displayOrder,
        settings: {
          showInMenu: formData.showInMenu,
          showTitle: formData.showTitle,
          showSidebar: true,
          allowComments: false,
        },
        seo: {
          title: formData.seoTitle || formData.title,
          description: formData.seoDescription || formData.excerpt,
          keywords: formData.seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        },
      }

      if (editingPage) {
        await axios.put(`${API_BASE}/cms/admin/pages/${editingPage._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_BASE}/cms/admin/pages`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      fetchPages()
      handleCloseForm()
      appToast('Page saved successfully!', 'success')
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete page?',
      message: 'Delete this page?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/cms/admin/pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchPages()
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to delete'), 'error')
    }
  }

  const handleEdit = (page: Page) => {
    setEditingPage(page)
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content ?? '',
      excerpt: page.excerpt ?? '',
      template: page.template || 'default',
      status: page.status || 'draft',
      showInMenu: page.settings?.showInMenu ?? true,
      showTitle: page.settings?.showTitle ?? true,
      displayOrder: page.displayOrder ?? 0,
      seoTitle: page.seo?.title ?? '',
      seoDescription: page.seo?.description ?? '',
      seoKeywords: page.seo && Array.isArray(page.seo.keywords) ? page.seo.keywords.join(', ') : '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      template: 'default',
      status: 'draft',
      showInMenu: true,
      showTitle: true,
      displayOrder: 0,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    })
    setEditingPage(null)
    setShowForm(false)
    setShowSEO(false)
  }

  const applyTemplate = (key: string) => {
    const t = PAGE_TEMPLATES[key]
    setEditingPage(null)
    setFormData({
      title: t.title,
      slug: t.slug,
      content: t.content,
      excerpt: t.excerpt,
      template: 'default',
      status: 'draft',
      showInMenu: true,
      showTitle: true,
      displayOrder: 0,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      seoKeywords: t.seoKeywords,
    })
    setShowSEO(true)
    setShowForm(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Page Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage static pages (About, Contact, Refund Policy, Cookie Policy, etc.)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <FilePlus2 className="mr-2 h-4 w-4" />
                Create from template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
              {PAGE_TEMPLATE_KEYS.map((key) => {
                const t = PAGE_TEMPLATES[key]
                return (
                  <DropdownMenuItem key={key} onSelect={() => applyTemplate(key)}>
                    {t.title}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingPage(null)
              setFormData({
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                template: 'default',
                status: 'draft',
                showInMenu: true,
                showTitle: true,
                displayOrder: 0,
                seoTitle: '',
                seoDescription: '',
                seoKeywords: '',
              })
              setShowSEO(false)
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pages.map((page) => (
            <Card key={page._id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="text-lg font-semibold">{page.title}</span>
                      <Badge variant={statusBadgeVariant(page.status)}>{page.status}</Badge>
                      {page.settings?.showInMenu && <Badge variant="outline">In Menu</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        <strong className="text-foreground">Slug:</strong>{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">/{page.slug}</code>
                      </span>
                      <span>
                        <strong className="text-foreground">Template:</strong> {page.template || 'default'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        {page.analytics?.views ?? 0} views
                      </span>
                      <span>
                        By {page.author?.name ?? '—'} • {new Date(page.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(page)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(page._id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b px-6 py-4 text-left">
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(70vh,calc(90vh-8rem))] overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="space-y-2 sm:col-span-8">
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor="page-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger id="page-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-12">
                <Label htmlFor="page-slug">Slug (optional)</Label>
                <Input
                  id="page-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Auto-generated from title if empty</p>
              </div>

              <div className="space-y-2 sm:col-span-6">
                <Label htmlFor="page-template">Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(v) => setFormData({ ...formData, template: v })}
                >
                  <SelectTrigger id="page-template">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="full-width">Full Width</SelectItem>
                    <SelectItem value="landing">Landing Page</SelectItem>
                    <SelectItem value="contact">Contact Page</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-6">
                <Label htmlFor="page-order">Display Order</Label>
                <Input
                  id="page-order"
                  type="number"
                  min={0}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2 sm:col-span-12">
                <Label htmlFor="page-excerpt">Excerpt</Label>
                <Textarea
                  id="page-excerpt"
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground">{formData.excerpt.length}/300 characters</p>
              </div>

              <div className="sm:col-span-12">
                <RichTextField
                  label="Content"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Write your page content here..."
                  fullWidth
                  height={320}
                  helperText="Use the toolbar for headings, lists, links, and formatting."
                />
              </div>

              <div className="flex flex-col gap-4 sm:col-span-12 sm:flex-row">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-menu"
                    checked={formData.showInMenu}
                    onCheckedChange={(checked) => setFormData({ ...formData, showInMenu: checked })}
                  />
                  <Label htmlFor="show-menu" className="cursor-pointer font-normal">
                    Show in Menu
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-title"
                    checked={formData.showTitle}
                    onCheckedChange={(checked) => setFormData({ ...formData, showTitle: checked })}
                  />
                  <Label htmlFor="show-title" className="cursor-pointer font-normal">
                    Show Title
                  </Label>
                </div>
              </div>

              <div className="space-y-3 sm:col-span-12">
                <Separator />
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 px-0 hover:bg-transparent"
                  onClick={() => setShowSEO(!showSEO)}
                >
                  {showSEO ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  SEO Settings
                </Button>
                {showSEO && (
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="seo-title">SEO Title</Label>
                      <Input
                        id="seo-title"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo-desc">SEO Description</Label>
                      <Textarea
                        id="seo-desc"
                        rows={2}
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo-kw">SEO Keywords</Label>
                      <Input
                        id="seo-kw"
                        value={formData.seoKeywords}
                        onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 border-t px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()}>
              {editingPage ? 'Update' : 'Create'} Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
