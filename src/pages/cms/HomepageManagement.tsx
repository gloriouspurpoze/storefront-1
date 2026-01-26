import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem as MuiMenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FormatListNumbered as OrderIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
  Preview as PreviewIcon,
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  TextFields as TextFieldsIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { HomepageService, type HomepageSection, type CreateHomepageSectionRequest } from '../../services/api/homepage.service'
import { ImageUploadField, type ImageFile } from '../../components/forms'
import { PageHeader } from '../../components/common/PageHeader'
import { ConfirmDialog, EmptyState } from '../../components/common'

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner', icon: HomeIcon, description: 'Main banner section with CTA' },
  { value: 'features', label: 'Features Section', icon: TextFieldsIcon, description: 'Highlight key features' },
  { value: 'services', label: 'Services Grid', icon: HomeIcon, description: 'Display services in grid' },
  { value: 'testimonials', label: 'Testimonials', icon: TextFieldsIcon, description: 'Customer testimonials carousel' },
  { value: 'statistics', label: 'Statistics', icon: TextFieldsIcon, description: 'Numbers and stats display' },
  { value: 'cta', label: 'Call to Action', icon: LinkIcon, description: 'Prominent CTA section' },
  { value: 'partners', label: 'Partners/Brands', icon: ImageIcon, description: 'Partner logos and brands' },
  { value: 'howitworks', label: 'How It Works', icon: TextFieldsIcon, description: 'Step-by-step process' },
]

export default function HomepageManagement() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const location = window.location.pathname
  const isFormPage = location.includes('/new') || (id && id !== 'homepage')
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id?: string; name?: string }>({ open: false })
  const [previewSection, setPreviewSection] = useState<HomepageSection | null>(null)
  const [tabValue, setTabValue] = useState(0)
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
    return sections.filter((section) => {
      const matchesType = filterType === 'all' || section.sectionType === filterType
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && section.isActive) ||
        (filterStatus === 'inactive' && !section.isActive)
      return matchesType && matchesStatus
    }).sort((a, b) => (a.displayOrder || a.order || 0) - (b.displayOrder || b.order || 0))
  }, [sections, filterType, filterStatus])

  // Form View
  if (isFormPage) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <PageHeader
          title={editingSection ? 'Edit Homepage Section' : 'Add Homepage Section'}
          subtitle={editingSection ? 'Update section details' : 'Create a new homepage section'}
          action={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                navigate('/cms/homepage')
                resetForm()
              }}
            >
              Back to List
            </Button>
          }
        />

        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Section Type */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Section Configuration
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.sectionType} required>
                    <InputLabel>Section Type</InputLabel>
                    <Select
                      value={formData.sectionType}
                      label="Section Type"
                      onChange={(e) => setFormData({ ...formData, sectionType: e.target.value as any })}
                    >
                      {SECTION_TYPES.map((type) => (
                        <MuiMenuItem key={type.value} value={type.value}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <type.icon />
                            <Box>
                              <Typography variant="body1">{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </MuiMenuItem>
                      ))}
                    </Select>
                    {formErrors.sectionType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {formErrors.sectionType}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Display Order"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                    helperText="Lower numbers appear first"
                  />
                </Grid>

                {/* Content */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Content
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Welcome to Our Service"
                    required
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subtitle"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Your trusted home service partner"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description || formData.content?.description || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      description: e.target.value,
                      content: { ...formData.content, description: e.target.value },
                    })}
                    placeholder="Detailed description of the section"
                  />
                </Grid>

                {/* CTA */}
                <Grid item xs={12}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <LinkIcon />
                        <Typography variant="h6">Call to Action</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="CTA Button Text"
                            value={formData.content?.cta?.text || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              content: {
                                ...formData.content,
                                cta: { ...formData.content?.cta, text: e.target.value } as any,
                              },
                            })}
                            placeholder="Get Started"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="CTA Link"
                            value={formData.content?.cta?.link || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              content: {
                                ...formData.content,
                                cta: { ...formData.content?.cta, link: e.target.value } as any,
                              },
                            })}
                            placeholder="/services"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>CTA Style</InputLabel>
                            <Select
                              value={formData.content?.cta?.style || 'primary'}
                              label="CTA Style"
                              onChange={(e) => setFormData({
                                ...formData,
                                content: {
                                  ...formData.content,
                                  cta: { ...formData.content?.cta, style: e.target.value } as any,
                                },
                              })}
                            >
                              <MuiMenuItem value="primary">Primary</MuiMenuItem>
                              <MuiMenuItem value="secondary">Secondary</MuiMenuItem>
                              <MuiMenuItem value="outline">Outline</MuiMenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Media */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Media
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
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
                </Grid>

                {/* Settings */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>

                {/* Actions */}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        navigate('/cms/homepage')
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained">
                      {editingSection ? 'Update' : 'Create'} Section
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // List View
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Homepage Management"
        subtitle="Manage homepage sections and layout"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cms/homepage/new')}
          >
            Add Section
          </Button>
        }
      />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Section Type</InputLabel>
              <Select
                value={filterType}
                label="Section Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MuiMenuItem value="all">All Types</MuiMenuItem>
                {SECTION_TYPES.map((type) => (
                  <MuiMenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MuiMenuItem value="all">All Status</MuiMenuItem>
                <MuiMenuItem value="active">Active</MuiMenuItem>
                <MuiMenuItem value="inactive">Inactive</MuiMenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchSections}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
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
        <Grid container spacing={3}>
          {filteredSections.map((section) => {
            const SectionIcon = SECTION_TYPES.find(t => t.value === section.sectionType)?.icon || HomeIcon
            return (
              <Grid item xs={12} key={section._id || section.id}>
                <Card
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
                          <SectionIcon sx={{ color: theme.palette.primary.main }} />
                          <Chip
                            label={SECTION_TYPES.find(t => t.value === section.sectionType)?.label || section.sectionType}
                            color="primary"
                            size="small"
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                          <Chip
                            icon={<OrderIcon />}
                            label={`Order: ${section.displayOrder || section.order || 0}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={section.isActive ? 'Active' : 'Inactive'}
                            color={section.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {section.title}
                        </Typography>
                        {section.subtitle && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {section.subtitle}
                          </Typography>
                        )}
                        {(section.description || section.content?.description) && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {section.description || section.content?.description}
                          </Typography>
                        )}
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => setPreviewSection(section)}
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) },
                            }}
                          >
                            <PreviewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/cms/homepage/${section._id || section.id}`)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={section.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            color={section.isActive ? 'default' : 'success'}
                            onClick={() => toggleActive(section)}
                            sx={{
                              bgcolor: alpha(
                                section.isActive ? theme.palette.grey[500] : theme.palette.success.main,
                                0.1
                              ),
                              '&:hover': {
                                bgcolor: alpha(
                                  section.isActive ? theme.palette.grey[500] : theme.palette.success.main,
                                  0.2
                                ),
                              },
                            }}
                          >
                            {section.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({
                              open: true,
                              id: section._id || section.id,
                              name: section.title,
                            })}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewSection}
        onClose={() => setPreviewSection(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <PreviewIcon />
            <Typography variant="h6">Section Preview</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {previewSection && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {previewSection.title}
              </Typography>
              {previewSection.subtitle && (
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {previewSection.subtitle}
                </Typography>
              )}
              {(previewSection.description || previewSection.content?.description) && (
                <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                  {previewSection.description || previewSection.content?.description}
                </Typography>
              )}
              {previewSection.content?.backgroundImage && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <img
                    src={previewSection.content.backgroundImage}
                    alt={previewSection.title}
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </Box>
              )}
              {previewSection.content?.cta?.text && (
                <Button
                  variant="contained"
                  href={previewSection.content.cta.link}
                  sx={{ mt: 2 }}
                >
                  {previewSection.content.cta.text}
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewSection(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onCancel={() => setDeleteConfirm({ open: false })}
        onConfirm={() => {
          void handleDelete()
        }}
        title="Delete Homepage Section?"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
      />
    </Box>
  )
}
