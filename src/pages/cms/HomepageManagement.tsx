import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Home,
  Eye,
  EyeOff,
  ListOrdered,
  Pencil,
  MonitorPlay,
  Loader2,
  Image as ImageIconLucide,
  Type,
  Link,
  LayoutGrid,
  Quote,
  BarChart2,
} from 'lucide-react'
import { HomepageService, type HomepageSection, type CreateHomepageSectionRequest } from '../../services/api/homepage.service'
import { ImageUploadField, type ImageFile } from '../../components/forms'
import { PageHeader } from '../../components/common/PageHeader'
import { ConfirmDialog, EmptyState } from '../../components/common'
import { HomepageBlockLibraryAccordion } from '../../components/cms/HomepageBlockLibraryAccordion'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '../../components/ui'
import { cn } from '../../lib/utils'

type SectionTypeMeta = {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const SECTION_TYPES: SectionTypeMeta[] = [
  { value: 'hero', label: 'Hero Banner', icon: Home, description: 'Main banner section with CTA' },
  { value: 'features', label: 'Features Section', icon: Type, description: 'Highlight key features' },
  { value: 'services', label: 'Services Grid', icon: LayoutGrid, description: 'Display services in grid' },
  { value: 'testimonials', label: 'Testimonials', icon: Quote, description: 'Customer testimonials carousel' },
  { value: 'statistics', label: 'Statistics', icon: BarChart2, description: 'Numbers and stats display' },
  { value: 'cta', label: 'Call to Action', icon: Link, description: 'Prominent CTA section' },
  { value: 'partners', label: 'Partners/Brands', icon: ImageIconLucide, description: 'Partner logos and brands' },
  { value: 'howitworks', label: 'How It Works', icon: ListOrdered, description: 'Step-by-step process' },
]

export default function HomepageManagement() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const location = window.location.pathname
  const isFormPage = location.includes('/new') || (id && id !== 'homepage')
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [previewSection, setPreviewSection] = useState<HomepageSection | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [formData, setFormData] = useState<CreateHomepageSectionRequest>({
    sectionType: 'hero',
    title: '',
    subtitle: '',
    description: '',
    content: {
      description: '',
      cta: {
        text: '',
        link: '',
        style: 'primary',
      },
      backgroundImage: '',
    },
    displayOrder: 0,
    isActive: true,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [backgroundImages, setBackgroundImages] = useState<ImageFile[]>([])

  useEffect(() => {
    if (isFormPage) {
      if (id && id !== 'new') {
        loadSectionForEdit(id)
      } else {
        resetForm()
      }
    } else {
      fetchSections()
    }
  }, [id, isFormPage])

  const loadSectionForEdit = async (sectionId: string) => {
    try {
      setLoading(true)
      const response = await HomepageService.getHomepageSectionById(sectionId)
      const section = (response as any).section || response
      setEditingSection(section)

      setFormData({
        sectionType: section.sectionType || 'hero',
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || section.content?.description || '',
        content: {
          description: section.content?.description || '',
          cta: section.content?.cta || {
            text: '',
            link: '',
            style: 'primary',
          },
          backgroundImage: section.content?.backgroundImage || '',
          ...section.content,
        },
        displayOrder: section.displayOrder || section.order || 0,
        isActive: section.isActive !== undefined ? section.isActive : true,
        settings: section.settings,
      })

      if (section.content?.backgroundImage) {
        setBackgroundImages([
          {
            id: 'background',
            url: section.content.backgroundImage,
            alt: 'Background image',
            isPrimary: true,
            order: 0,
          },
        ])
      }
    } catch (error) {
      console.error('Error loading section:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await HomepageService.getHomepageSections({
        sectionType: filterType !== 'all' ? filterType : undefined,
        isActive: filterStatus !== 'all' ? filterStatus === 'active' : undefined,
      })
      const data = (response as any).sections || response.data?.sections || []
      setSections(data)
    } catch (error) {
      console.error('Error fetching sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    }

    if (!formData.sectionType) {
      errors.sectionType = 'Section type is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const payload: CreateHomepageSectionRequest = {
        ...formData,
        content: {
          ...formData.content,
          backgroundImage: backgroundImages[0]?.url || formData.content?.backgroundImage || '',
        },
      }

      if (editingSection) {
        const sectionId = editingSection._id || editingSection.id || ''
        await HomepageService.updateHomepageSection(sectionId, payload)
      } else {
        await HomepageService.createHomepageSection(payload)
      }

      navigate('/cms/homepage')
      resetForm()
    } catch (error) {
      console.error('Error saving section:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      await HomepageService.deleteHomepageSection(deleteConfirm.id)
      await fetchSections()
      setDeleteConfirm({ open: false })
    } catch (error) {
      console.error('Error deleting section:', error)
    }
  }

  const toggleActive = async (section: HomepageSection) => {
    try {
      const sectionId = section._id || section.id || ''
      await HomepageService.toggleSectionStatus(sectionId, !section.isActive)
      await fetchSections()
    } catch (error) {
      console.error('Error updating section:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      sectionType: 'hero',
      title: '',
      subtitle: '',
      description: '',
      content: {
        description: '',
        cta: {
          text: '',
          link: '',
          style: 'primary',
        },
        backgroundImage: '',
      },
      displayOrder: 0,
      isActive: true,
    })
    setBackgroundImages([])
    setFormErrors({})
    setEditingSection(null)
  }

  const filteredSections = useMemo(() => {
    return sections
      .filter((section) => {
        const matchesType = filterType === 'all' || section.sectionType === filterType
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'active' && section.isActive) ||
          (filterStatus === 'inactive' && !section.isActive)
        return matchesType && matchesStatus
      })
      .sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0))
  }, [sections, filterType, filterStatus])

  // Form View
  if (isFormPage) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title={editingSection ? 'Edit Homepage Section' : 'Add Homepage Section'}
          subtitle={editingSection ? 'Update section details' : 'Create a new homepage section'}
          action={
            <Button
              variant="outline"
              onClick={() => {
                navigate('/cms/homepage')
                resetForm()
              }}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to List
            </Button>
          }
        />

        <Card className="mt-6">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Separator className="my-2" />
                <h3 className="px-2 py-2 text-center text-lg font-semibold">Section Configuration</h3>
                <Separator className="my-2" />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Section Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.sectionType}
                    onValueChange={(v) => setFormData({ ...formData, sectionType: v as any })}
                  >
                    <SelectTrigger className={cn(formErrors.sectionType && 'border-destructive')}>
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value} textValue={type.label}>
                            <div className="flex items-start gap-3 py-1">
                              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {formErrors.sectionType && (
                    <p className="text-xs text-destructive">{formErrors.sectionType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                </div>
              </div>

              <div>
                <Separator className="my-2" />
                <h3 className="px-2 py-2 text-center text-lg font-semibold">Content</h3>
                <Separator className="my-2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Welcome to Our Service"
                  className={cn(formErrors.title && 'border-destructive')}
                />
                {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Your trusted home service partner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description || formData.content?.description || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                      content: { ...formData.content, description: e.target.value },
                    })
                  }
                  placeholder="Detailed description of the section"
                />
              </div>

              <Accordion type="single" collapsible className="rounded-md border px-4">
                <AccordionItem value="cta" className="border-0">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2 text-base font-semibold">
                      <Link className="h-5 w-5" />
                      Call to Action
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ctaText">CTA Button Text</Label>
                        <Input
                          id="ctaText"
                          value={formData.content?.cta?.text || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              content: {
                                ...formData.content,
                                cta: { ...formData.content?.cta, text: e.target.value } as any,
                              },
                            })
                          }
                          placeholder="Get Started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ctaLink">CTA Link</Label>
                        <Input
                          id="ctaLink"
                          value={formData.content?.cta?.link || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              content: {
                                ...formData.content,
                                cta: { ...formData.content?.cta, link: e.target.value } as any,
                              },
                            })
                          }
                          placeholder="/services"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>CTA Style</Label>
                        <Select
                          value={formData.content?.cta?.style || 'primary'}
                          onValueChange={(v) =>
                            setFormData({
                              ...formData,
                              content: {
                                ...formData.content,
                                cta: { ...formData.content?.cta, style: v } as any,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div>
                <Separator className="my-2" />
                <h3 className="px-2 py-2 text-center text-lg font-semibold">Media</h3>
                <Separator className="my-2" />
              </div>

              <ImageUploadField
                label="Background Image"
                value={backgroundImages}
                onChange={(images) => {
                  setBackgroundImages(images)
                  setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      backgroundImage: images[0]?.url || '',
                    },
                  })
                }}
                maxFiles={1}
                maxSize={5}
                helperText="Upload background image (Recommended: 1920x1080px, Max 5MB)"
                showPreview
                allowPrimary={false}
              />

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigate('/cms/homepage')
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingSection ? 'Update' : 'Create'} Section</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List View
  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Homepage Management"
          subtitle="Manage homepage sections and layout"
          action={
            <Button onClick={() => navigate('/cms/homepage/new')} leftIcon={<Plus className="h-4 w-4" />}>
              Add Section
            </Button>
          }
        />

        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            <div className="md:col-span-4 space-y-2">
              <Label>Section Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {SECTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4">
              <Button type="button" variant="outline" className="w-full" onClick={fetchSections}>
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        <HomepageBlockLibraryAccordion />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSections.length === 0 ? (
          <EmptyState
            title="No sections found"
            description={
              filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first homepage section to get started'
            }
            action={{
              label: 'Add Section',
              onClick: () => navigate('/cms/homepage/new'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredSections.map((section) => {
              const SectionIcon =
                SECTION_TYPES.find((t) => t.value === section.sectionType)?.icon || Home
              return (
                <Card
                  key={section._id || section.id}
                  className="border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <SectionIcon className="h-5 w-5 shrink-0 text-primary" />
                          <Badge variant="default">
                            {SECTION_TYPES.find((t) => t.value === section.sectionType)?.label ||
                              section.sectionType}
                          </Badge>
                          <Badge variant="outline" className="gap-1 capitalize">
                            <ListOrdered className="h-3 w-3" />
                            Order: {section.displayOrder || section.order || 0}
                          </Badge>
                          <Badge variant={section.isActive ? 'success' : 'secondary'}>
                            {section.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        {section.subtitle && (
                          <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                        )}
                        {(section.description || section.content?.description) && (
                          <p className="text-sm text-muted-foreground">
                            {section.description || section.content?.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-1 sm:justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                              onClick={() => setPreviewSection(section)}
                            >
                              <MonitorPlay className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="bg-primary/10 text-primary hover:bg-primary/20"
                              onClick={() => navigate(`/cms/homepage/${section._id || section.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className={
                                section.isActive
                                  ? 'bg-muted/80 hover:bg-muted'
                                  : 'bg-storm-deep/10 text-storm-deep hover:bg-storm-deep/20'
                              }
                              onClick={() => toggleActive(section)}
                            >
                              {section.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{section.isActive ? 'Deactivate' : 'Activate'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  id: section._id || section.id,
                                  name: section.title,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={!!previewSection} onOpenChange={(open) => !open && setPreviewSection(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MonitorPlay className="h-5 w-5" />
                Section Preview
              </DialogTitle>
            </DialogHeader>
            {previewSection && (
              <div className="space-y-4 pt-2">
                <h4 className="text-xl font-semibold">{previewSection.title}</h4>
                {previewSection.subtitle && (
                  <p className="text-muted-foreground">{previewSection.subtitle}</p>
                )}
                {(previewSection.description || previewSection.content?.description) && (
                  <p className="text-sm leading-relaxed">
                    {previewSection.description || previewSection.content?.description}
                  </p>
                )}
                {previewSection.content?.backgroundImage && (
                  <img
                    src={previewSection.content.backgroundImage}
                    alt={previewSection.title}
                    className="w-full rounded-lg border object-cover"
                  />
                )}
                {previewSection.content?.cta?.text && (
                  <Button asChild className="mt-2">
                    <a href={previewSection.content.cta.link || '#'}>
                      {previewSection.content.cta.text}
                    </a>
                  </Button>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewSection(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirm.open}
          onCancel={() => setDeleteConfirm({ open: false })}
          onConfirm={() => {
            void handleDelete()
          }}
          title="Delete Homepage Section?"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        />
      </div>
    </TooltipProvider>
  )
}
