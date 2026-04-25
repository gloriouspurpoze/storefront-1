import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react'
import axios from 'axios'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { FormField } from '../../components/common'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

interface SEOMeta {
  _id: string
  pagePath: string
  title: string
  description: string
  keywords: string[]
  ogImage?: string
  canonical?: string
  robots: string
  isActive: boolean
}

const emptyForm = {
  pagePath: '',
  title: '',
  description: '',
  keywords: '',
  ogImage: '',
  ogTitle: '',
  ogDescription: '',
  twitterCard: 'summary_large_image',
  canonical: '',
  robots: 'index, follow',
  isActive: true,
}

export default function SEOManagement() {
  const confirm = useAppConfirm()
  const [seoPages, setSeoPages] = useState<SEOMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPage, setEditingPage] = useState<SEOMeta | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    void fetchSEOPages()
  }, [])

  const fetchSEOPages = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE}/cms/admin/seo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSeoPages(res.data.data.seoMetas)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const payload = {
        pagePath: formData.pagePath,
        title: formData.title,
        description: formData.description,
        keywords: formData.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        ogImage: formData.ogImage || undefined,
        ogTitle: formData.ogTitle || formData.title,
        ogDescription: formData.ogDescription || formData.description,
        twitterCard: formData.twitterCard,
        canonical: formData.canonical || undefined,
        robots: formData.robots,
        structuredData: {},
        isActive: formData.isActive,
      }

      if (editingPage) {
        await axios.put(`${API_BASE}/cms/admin/seo/${editingPage._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_BASE}/cms/admin/seo`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      await fetchSEOPages()
      handleCloseForm()
      appToast('SEO metadata saved successfully!', 'success')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      appToast('Error: ' + (err.response?.data?.error || 'Failed to save'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete SEO configuration?',
      message: 'Delete this SEO configuration?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/cms/admin/seo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      void fetchSEOPages()
    } catch {
      appToast('Error deleting SEO configuration', 'error')
    }
  }

  const handleEdit = (page: SEOMeta) => {
    setEditingPage(page)
    setFormData({
      pagePath: page.pagePath,
      title: page.title,
      description: page.description,
      keywords: page.keywords.join(', '),
      ogImage: page.ogImage || '',
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
      canonical: page.canonical || '',
      robots: page.robots,
      isActive: page.isActive,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setFormData({ ...emptyForm })
    setEditingPage(null)
    setShowForm(false)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO management</h1>
          <p className="text-sm text-muted-foreground">Manage SEO metadata for your pages</p>
        </div>
        <Button
          type="button"
          className="gap-1.5 self-start sm:self-center"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Add SEO meta
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {seoPages.map((page) => (
            <Card key={page._id}>
              <CardContent className="p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <code className="text-sm font-semibold">{page.pagePath}</code>
                      <Badge variant={page.isActive ? 'default' : 'secondary'}>
                        {page.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {page.robots}
                      </Badge>
                    </div>
                    <p className="font-semibold text-foreground">{page.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{page.description}</p>
                    {page.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {page.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 sm:shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => void handleDelete(page._id)}
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

      <Dialog open={showForm} onOpenChange={(o) => !o && handleCloseForm()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <form onSubmit={(e) => void handleSubmit(e)}>
            <DialogHeader>
              <DialogTitle>{editingPage ? 'Edit SEO meta' : 'Add SEO meta'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <FormField id="seo-page-path" label="Page path">
                <Input
                  id="seo-page-path"
                  className="font-mono"
                  value={formData.pagePath}
                  onChange={(e) => setFormData({ ...formData, pagePath: e.target.value })}
                  placeholder="/services/ac-repair"
                  required
                />
              </FormField>
              <FormField
                id="seo-title"
                label="Page title"
                description={`${formData.title.length}/60 characters`}
              >
                <Input
                  id="seo-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={60}
                />
              </FormField>
              <FormField
                id="seo-desc"
                label="Meta description"
                description={`${formData.description.length}/160 characters`}
              >
                <Textarea
                  id="seo-desc"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={160}
                />
              </FormField>
              <FormField id="seo-kw" label="Keywords (comma-separated)">
                <Input
                  id="seo-kw"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="ac repair, home service, mumbai"
                />
              </FormField>
              <FormField id="seo-og" label="OG image URL">
                <Input
                  id="seo-og"
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  placeholder="https://…"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="seo-canonical" label="Canonical URL">
                  <Input
                    id="seo-canonical"
                    value={formData.canonical}
                    onChange={(e) => setFormData({ ...formData, canonical: e.target.value })}
                    placeholder="https://…"
                  />
                </FormField>
                <FormField label="Robots">
                  <Select
                    value={formData.robots}
                    onValueChange={(v) => setFormData({ ...formData, robots: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Robots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="index, follow">Index, follow</SelectItem>
                      <SelectItem value="noindex, follow">No index, follow</SelectItem>
                      <SelectItem value="index, nofollow">Index, no follow</SelectItem>
                      <SelectItem value="noindex, nofollow">No index, no follow</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="seo-active"
                  checked={formData.isActive}
                  onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                />
                <Label htmlFor="seo-active" className="font-normal">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPage ? 'Update' : 'Create'} SEO meta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
