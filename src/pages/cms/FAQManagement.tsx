import React, { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  HelpCircle,
  Search,
  TrendingUp,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from 'lucide-react'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'

interface FAQ {
  _id: string
  question: string
  answer: string
  category: string
  order: number
  isActive: boolean
  views: number
  helpfulCount: number
  notHelpfulCount: number
  createdAt: string
  updatedAt: string
}

export default function FAQManagement() {
  const confirm = useAppConfirm()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFAQ, setExpandedFAQ] = useState<string>('')

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchFAQs()
    fetchCategories()
  }, [selectedCategory, searchQuery])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      if (searchQuery) {
        params.search = searchQuery
      }

      const data = await CMSService.getFAQs(params)
      setFaqs(data.faqs || [])
    } catch (error: any) {
      console.error('Error fetching FAQs:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to load FAQs'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const cats = await CMSService.getFAQCategories()
      setCategories(cats || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
        appToast('Please fill in all required fields', 'warning')
        return
      }

      const payload = {
        ...formData,
        order: Number(formData.order),
      }

      if (editingFAQ) {
        await CMSService.updateFAQ(editingFAQ._id, payload)
      } else {
        await CMSService.createFAQ(payload)
      }

      fetchFAQs()
      fetchCategories()
      handleCloseForm()
    } catch (error: any) {
      console.error('Error saving FAQ:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save FAQ'), 'error')
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete FAQ?',
      message: 'Are you sure you want to delete this FAQ?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return
    try {
      await CMSService.deleteFAQ(id)
      fetchFAQs()
    } catch (error: any) {
      console.error('Error deleting FAQ:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to delete FAQ'), 'error')
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingFAQ(null)
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: 0,
      isActive: true,
    })
  }

  const handleToggleActive = async (faq: FAQ) => {
    try {
      await CMSService.updateFAQ(faq._id, {
        isActive: !faq.isActive,
      })
      fetchFAQs()
    } catch (error: any) {
      console.error('Error updating FAQ:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to update FAQ'), 'error')
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="FAQ Management"
          subtitle="Manage frequently asked questions"
          action={
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          }
        />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
              <div className="relative md:col-span-4">
                <Label htmlFor="faq-search" className="sr-only">
                  Search
                </Label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="faq-search"
                  className="pl-9"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="faq-category" className="sr-only">
                  Category
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="faq-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 md:col-span-4">
                <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
                <p className="text-sm font-semibold text-muted-foreground">
                  {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : faqs.length === 0 ? (
          <Card>
            <CardContent className="px-6 py-16 text-center">
              <HelpCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" aria-hidden />
              <h3 className="mb-2 text-lg font-semibold text-muted-foreground">No FAQs found</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first FAQ to help customers'}
              </p>
              <Button type="button" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={expandedFAQ}
            onValueChange={(v) => setExpandedFAQ(v ?? '')}
            className="space-y-2"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq._id}
                value={faq._id}
                className="rounded-lg border bg-card px-4 shadow-sm transition-shadow hover:shadow-md data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="items-start py-4 text-left hover:no-underline">
                  <div className="flex w-full min-w-0 items-start gap-3 pr-2 text-left">
                    <div className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-semibold leading-snug">{faq.question}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="font-medium">
                          {faq.category}
                        </Badge>
                        <Badge variant={faq.isActive ? 'success' : 'secondary'} className="gap-1 font-semibold">
                          {faq.isActive && <CheckCircle2 className="h-3 w-3" />}
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {faq.views > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Badge variant="outline" className="gap-1 font-medium">
                                  <TrendingUp className="h-3 w-3" />
                                  {faq.views} views
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Total views</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cnFaqBtn(faq.isActive)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(faq)
                            }}
                            aria-label={faq.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{faq.isActive ? 'Deactivate' : 'Activate'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(faq)
                            }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-destructive/10 text-destructive hover:bg-destructive/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(faq._id)
                            }}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Separator className="mb-4" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  {(faq.helpfulCount > 0 || faq.notHelpfulCount > 0) && (
                    <div className="mt-4 rounded-md border border-primary/10 bg-primary/5 p-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5">
                              <ThumbsUp className="h-4 w-4 text-storm-deep" aria-hidden />
                              <span className="font-semibold text-muted-foreground">{faq.helpfulCount}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Helpful</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5">
                              <ThumbsDown className="h-4 w-4 text-destructive" aria-hidden />
                              <span className="font-semibold text-muted-foreground">{faq.notHelpfulCount}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Not helpful</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <Dialog open={showForm} onOpenChange={(open) => !open && handleCloseForm()}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="faq-q">Question</Label>
                <Input
                  id="faq-q"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  placeholder="What would you like to know?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-a">Answer</Label>
                <Textarea
                  id="faq-a"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  required
                  placeholder="Provide a detailed answer..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-cat">Category</Label>
                <Input
                  id="faq-cat"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g., Booking, Payment, Services"
                />
                <p className="text-xs text-muted-foreground">Use existing categories or create a new one</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-order">Display Order</Label>
                <Input
                  id="faq-order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="faq-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="faq-active" className="cursor-pointer font-normal">
                  Active (visible to customers)
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleSubmit()}>
                {editingFAQ ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

function cnFaqBtn(isActive: boolean) {
  return isActive
    ? 'h-8 w-8 bg-storm-deep/10 text-storm-deep hover:bg-storm-deep/20'
    : 'h-8 w-8 bg-muted text-muted-foreground hover:bg-muted/80'
}
