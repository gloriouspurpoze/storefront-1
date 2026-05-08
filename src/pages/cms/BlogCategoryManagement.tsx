import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Tag, ArrowLeft, FileText } from 'lucide-react'
import axios from 'axios'
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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '../../components/ui'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

interface BlogCategory {
  _id: string
  name: string
  slug: string
  description?: string
  displayOrder: number
  postCount: number
  isActive: boolean
  createdAt: string
}

export default function BlogCategoryManagement() {
  const confirm = useAppConfirm()
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`${API_BASE}/cms/admin/blog-categories`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setCategories(res.data.data.categories)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      }

      if (editingCategory) {
        await axios.put(`${API_BASE}/cms/admin/blog-categories/${editingCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(`${API_BASE}/cms/admin/blog-categories`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      fetchCategories()
      handleCloseForm()
      appToast('Category saved successfully!', 'success')
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete category?',
      message: 'Delete this category?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/cms/admin/blog-categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchCategories()
    } catch (error) {
      appToast('Error deleting category', 'error')
    }
  }

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" className="mb-3" asChild>
            <Link to="/cms/blogs" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Blog Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your blog posts into categories</p>
        </div>
        <Button type="button" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <div>
                          <p className="text-sm font-semibold">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{category.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1 font-normal">
                        <FileText className="h-3 w-3" />
                        {category.postCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{category.displayOrder}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={category.isActive ? 'success' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(category._id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bc-name">Category Name</Label>
              <Input
                id="bc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bc-slug">Slug (optional)</Label>
              <Input
                id="bc-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Auto-generated from name if empty</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bc-desc">Description</Label>
              <Textarea
                id="bc-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bc-order">Display Order</Label>
              <Input
                id="bc-order"
                type="number"
                min={0}
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="bc-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="bc-active" className="cursor-pointer font-normal">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()}>
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
