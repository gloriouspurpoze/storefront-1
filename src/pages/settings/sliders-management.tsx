import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TablePagination,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Image as ImageIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { SlidersService } from '../../services/api/sliders.service';
import { Slider } from '../../types';
import { ImageUploadField, FormField, type ImageFile } from '../../components/forms';

interface SliderStats {
  total_sliders: number;
  active_sliders: number;
  inactive_sliders: number;
  scheduled_sliders: number;
}

export default function SlidersManagement() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SliderStats>({
    total_sliders: 0,
    active_sliders: 0,
    inactive_sliders: 0,
    scheduled_sliders: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Form state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedSlider, setSelectedSlider] = useState<Slider | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    image_alt: '',
    button_text: '',
    button_url: '',
    position: 1,
    is_active: true,
    start_date: '',
    end_date: '',
    target_audience: 'all' as 'all' | 'customers' | 'providers',
  });

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<ImageFile[]>([]);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSlider, setMenuSlider] = useState<Slider | null>(null);

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (viewMode === 'list') {
      fetchSliders();
      fetchStats();
    }
  }, [viewMode, page, limit, searchTerm, statusFilter, audienceFilter]);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const query: any = {
        page: page + 1,
        limit,
      };
      
      if (searchTerm) query.search = searchTerm;
      if (statusFilter !== 'all') {
        query.status = statusFilter === 'active' ? 'active' : 'inactive';
      }
      if (audienceFilter !== 'all') {
        query.audience = audienceFilter;
      }

      const response = await SlidersService.getSliders(query);
      
      if (response && response.data) {
        if (response.data.sliders) {
          setSliders(response.data.sliders);
          setTotal(response.data.pagination?.total || response.data.sliders.length);
        } else if (Array.isArray(response.data)) {
          // Handle case where response.data is directly an array
          setSliders(response.data);
          setTotal(response.data.length);
        } else {
          setSliders([]);
          setTotal(0);
        }
      } else {
        setSliders([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('Error fetching sliders:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to fetch sliders';
      showSnackbar(errorMessage, 'error');
      setSliders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await SlidersService.getSliders({ limit: 100 });
      
      if (response.data?.sliders) {
        const allSliders = response.data.sliders;
        const active = allSliders.filter((s: Slider) => s.is_active).length;
        const inactive = allSliders.filter((s: Slider) => !s.is_active).length;
        const scheduled = allSliders.filter((s: Slider) => 
          s.start_date && new Date(s.start_date) > new Date()
        ).length;

        setStats({
          total_sliders: allSliders.length,
          active_sliders: active,
          inactive_sliders: inactive,
          scheduled_sliders: scheduled,
        });
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreate = () => {
    setFormMode('create');
    setSelectedSlider(null);
    resetForm();
    setActiveTab(0);
    setFormErrors({});
    setShowPreview(false);
    setViewMode('form');
  };

  const handleEdit = (slider: Slider) => {
    setFormMode('edit');
    setSelectedSlider(slider);
    setFormData({
      title: slider.title || '',
      subtitle: slider.subtitle || '',
      description: slider.description || '',
      image_url: slider.image_url || '',
      image_alt: slider.image_alt || '',
      button_text: slider.button_text || '',
      button_url: slider.button_url || '',
      position: slider.position || 1,
      is_active: slider.is_active ?? true,
      start_date: slider.start_date ? slider.start_date.split('T')[0] : '',
      end_date: slider.end_date ? slider.end_date.split('T')[0] : '',
      target_audience: slider.target_audience || 'all',
    });
    // Set uploaded images if image_url exists
    if (slider.image_url) {
      setUploadedImages([{
        id: 'existing',
        url: slider.image_url,
        alt: slider.image_alt || slider.title,
        isPrimary: true,
        order: 0,
      }]);
    } else {
      setUploadedImages([]);
    }
    setActiveTab(0);
    setFormErrors({});
    setShowPreview(false);
    setViewMode('form');
    handleMenuClose();
  };

  const handleDelete = async (slider: Slider) => {
    if (!window.confirm(`Are you sure you want to delete "${slider.title}"?`)) return;
    
    try {
      await SlidersService.deleteSlider(slider.id);
      showSnackbar('Slider deleted successfully', 'success');
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting slider:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete slider';
      showSnackbar(errorMessage, 'error');
    }
    handleMenuClose();
  };

  const handleToggleStatus = async (slider: Slider) => {
    try {
      await SlidersService.toggleSliderStatus(slider.id, !slider.is_active);
      showSnackbar(`Slider ${!slider.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling slider status:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider status';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleMoveUp = async (slider: Slider) => {
    try {
      await SlidersService.updateSliderPosition(slider.id, slider.position - 1);
      showSnackbar('Slider position updated successfully', 'success');
      fetchSliders();
    } catch (error: any) {
      console.error('Error moving slider up:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider position';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleMoveDown = async (slider: Slider) => {
    try {
      await SlidersService.updateSliderPosition(slider.id, slider.position + 1);
      showSnackbar('Slider position updated successfully', 'success');
      fetchSliders();
    } catch (error: any) {
      console.error('Error moving slider down:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider position';
      showSnackbar(errorMessage, 'error');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    // Use uploaded image URL if available, otherwise use manual URL
    const imageUrl = uploadedImages.length > 0 
      ? uploadedImages[0].url 
      : formData.image_url;

    if (!imageUrl.trim()) {
      errors.image_url = 'Image is required. Please upload an image or provide an image URL';
    }

    if (formData.button_text && !formData.button_url) {
      errors.button_url = 'Button URL is required when button text is provided';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showSnackbar('Please fix the errors in the form', 'error');
      setActiveTab(0); // Go to first tab if there are errors
      return;
    }

    // Use uploaded image URL if available, otherwise use manual URL
    const imageUrl = uploadedImages.length > 0 
      ? uploadedImages[0].url 
      : formData.image_url;

    try {
      setFormLoading(true);
      const payload: any = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        image_url: imageUrl,
        image_alt: uploadedImages.length > 0 
          ? uploadedImages[0].alt 
          : (formData.image_alt || formData.title),
        button_text: formData.button_text || undefined,
        button_url: formData.button_url || undefined,
        position: formData.position,
        is_active: formData.is_active,
        target_audience: formData.target_audience,
      };

      if (formData.start_date) {
        payload.start_date = new Date(formData.start_date).toISOString();
      }
      if (formData.end_date) {
        payload.end_date = new Date(formData.end_date).toISOString();
      }

      if (formMode === 'create') {
        await SlidersService.createSlider(payload);
        showSnackbar('Slider created successfully', 'success');
      } else if (selectedSlider) {
        await SlidersService.updateSlider(selectedSlider.id, payload);
        showSnackbar('Slider updated successfully', 'success');
      }

      setViewMode('list');
      resetForm();
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error?.response?.data?.error || error?.message || `Failed to ${formMode} slider`;
      showSnackbar(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      image_alt: '',
      button_text: '',
      button_url: '',
      position: 1,
      is_active: true,
      start_date: '',
      end_date: '',
      target_audience: 'all',
    });
    setUploadedImages([]);
    setSelectedSlider(null);
    setActiveTab(0);
    setFormErrors({});
    setShowPreview(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, slider: Slider) => {
    setMenuAnchor(event.currentTarget);
    setMenuSlider(slider);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSlider(null);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAudienceFilter('all');
    setPage(0);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default';
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'all': return 'primary';
      case 'customers': return 'success';
      case 'providers': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Form View
  if (viewMode === 'form') {
    const tabs = [
      { label: 'Basic Info', icon: <InfoIcon />, value: 0 },
      { label: 'Image & Media', icon: <ImageIcon />, value: 1 },
      { label: 'Call to Action', icon: <CampaignIcon />, value: 2 },
      { label: 'Settings', icon: <SettingsIcon />, value: 3 },
      { label: 'Preview', icon: <PreviewIcon />, value: 4 },
    ];

    const imageUrl = uploadedImages.length > 0 
      ? uploadedImages[0].url 
      : formData.image_url;

    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <PageHeader
          title={formMode === 'edit' ? 'Edit Slider' : 'Create New Slider'}
          subtitle={formMode === 'edit' ? 'Update slider details and settings' : 'Add a new banner/slider to your website'}
          action={
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={() => setShowPreview(!showPreview)}
                sx={{ borderRadius: 2 }}
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setViewMode('list');
                  resetForm();
                }}
                sx={{ borderRadius: 2 }}
              >
                Back to List
              </Button>
            </Stack>
          }
        />

        {/* Progress Indicator */}
        <Card sx={{ mt: 3, mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ py: 2 }}>
            <Stepper activeStep={activeTab} alternativeLabel>
              {tabs.map((tab, index) => (
                <Step key={tab.value} completed={activeTab > index}>
                  <StepLabel 
                    icon={tab.icon}
                    onClick={() => setActiveTab(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {tab.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Form Errors Alert */}
        {Object.keys(formErrors).length > 0 && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setFormErrors({})}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Please fix the following errors:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {Object.values(formErrors).map((error, idx) => (
                <li key={idx}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </Box>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Main Form */}
          <Box sx={{ flex: { xs: 1, lg: showPreview ? 2 : 1 } }}>
            <Card 
              sx={{ 
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                overflow: 'hidden',
              }}
            >
              {/* Tab Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 72,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    },
                    '& .Mui-selected': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {tabs.map((tab) => (
                    <Tab 
                      key={tab.value}
                      icon={tab.icon}
                      iconPosition="start"
                      label={tab.label}
                      sx={{ gap: 1 }}
                    />
                  ))}
                </Tabs>
              </Box>

              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <form onSubmit={handleFormSubmit} id="slider-form">
                  {/* Tab 0: Basic Information */}
                  {activeTab === 0 && (
                    <Fade in={activeTab === 0}>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                          }}
                        >
                          <InfoIcon />
                          Basic Information
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 8 }}>
                            <FormField
                              label="Title"
                              value={formData.title}
                              onChange={(value) => {
                                setFormData({ ...formData, title: value });
                                if (formErrors.title) {
                                  setFormErrors({ ...formErrors, title: '' });
                                }
                              }}
                              required
                              error={formErrors.title || undefined}
                              helperText={formErrors.title || "The main heading displayed on the slider"}
                              placeholder="Summer Sale 2024"
                              maxLength={100}
                              showCharCount
                            />
                          </Grid>

                          <Grid size={{ xs: 12, sm: 4 }}>
                            <FormField
                              label="Position"
                              value={formData.position}
                              onChange={(value) =>
                                setFormData({ ...formData, position: Math.max(1, Number(value) || 1) })
                              }
                              type="number"
                              helperText="Lower numbers appear first"
                              placeholder="1"
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <FormField
                              label="Subtitle"
                              value={formData.subtitle}
                              onChange={(value) => setFormData({ ...formData, subtitle: value })}
                              placeholder="Get up to 50% off on all services"
                              helperText="A short tagline or secondary message (optional)"
                              maxLength={150}
                              showCharCount
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <FormField
                              label="Description"
                              value={formData.description}
                              onChange={(value) => setFormData({ ...formData, description: value })}
                              placeholder="Detailed description of the slider (optional)"
                              multiline
                              rows={4}
                              helperText="Additional details about the slider (optional)"
                              maxLength={500}
                              showCharCount
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Fade>
                  )}

                  {/* Tab 1: Image & Media */}
                  {activeTab === 1 && (
                    <Fade in={activeTab === 1}>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                          }}
                        >
                          <ImageIcon />
                          Image & Media
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12 }}>
                            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                              <Typography variant="body2">
                                <strong>Recommended size:</strong> 1920x600px for best results. Maximum file size: 5MB.
                              </Typography>
                            </Alert>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <ImageUploadField
                              label="Slider Image"
                              value={uploadedImages}
                              onChange={(images) => {
                                setUploadedImages(images);
                                if (images.length > 0) {
                                  setFormData({
                                    ...formData,
                                    image_url: images[0].url,
                                    image_alt: images[0].alt,
                                  });
                                  if (formErrors.image_url) {
                                    setFormErrors({ ...formErrors, image_url: '' });
                                  }
                                } else {
                                  setFormData({
                                    ...formData,
                                    image_url: '',
                                  });
                                }
                              }}
                              required
                              maxFiles={1}
                              maxSize={5}
                              folder="sliders"
                              helperText="Upload a high-quality image for your slider"
                              tooltip="Drag and drop or click to upload. Maximum 5MB. Supported formats: JPG, PNG, GIF, WebP"
                            />
                            {formErrors.image_url && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                {formErrors.image_url}
                              </Typography>
                            )}
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                OR
                              </Typography>
                            </Divider>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <FormField
                              label="Image URL"
                              value={formData.image_url}
                              onChange={(value) => {
                                setFormData({ ...formData, image_url: value });
                                if (formErrors.image_url) {
                                  setFormErrors({ ...formErrors, image_url: '' });
                                }
                              }}
                              placeholder="https://example.com/image.jpg"
                              helperText="Enter the full URL of the slider image if you prefer to use an external image"
                              type="url"
                              error={formErrors.image_url || undefined}
                            />
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <FormField
                              label="Image Alt Text"
                              value={formData.image_alt}
                              onChange={(value) => setFormData({ ...formData, image_alt: value })}
                              placeholder="Enter descriptive alt text for accessibility"
                              helperText="Alt text helps with SEO and accessibility for screen readers"
                            />
                          </Grid>

                          {/* Image Preview */}
                          {imageUrl && (
                            <Grid size={{ xs: 12 }}>
                              <Card
                                sx={{
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: { xs: 200, sm: 300 },
                                    position: 'relative',
                                    bgcolor: alpha(theme.palette.grey[500], 0.05),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={formData.image_alt || formData.title || 'Slider preview'}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </Box>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Fade>
                  )}

                  {/* Tab 2: Call to Action */}
                  {activeTab === 2 && (
                    <Fade in={activeTab === 2}>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                          }}
                        >
                          <CampaignIcon />
                          Call to Action
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12 }}>
                            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                              <Typography variant="body2">
                                Add a button to drive user engagement. Both button text and URL are optional, but if you provide text, URL is required.
                              </Typography>
                            </Alert>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormField
                              label="Button Text"
                              value={formData.button_text}
                              onChange={(value) => {
                                setFormData({ ...formData, button_text: value });
                                if (formErrors.button_url) {
                                  setFormErrors({ ...formErrors, button_url: '' });
                                }
                              }}
                              placeholder="Shop Now"
                              helperText="Text displayed on the action button (optional)"
                              maxLength={30}
                              showCharCount
                            />
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormField
                              label="Button URL"
                              value={formData.button_url}
                              onChange={(value) => {
                                setFormData({ ...formData, button_url: value });
                                if (formErrors.button_url) {
                                  setFormErrors({ ...formErrors, button_url: '' });
                                }
                              }}
                              placeholder="/services or https://example.com"
                              helperText={formData.button_text ? 'Required when button text is provided' : 'URL where the button should link to (optional)'}
                              type="url"
                              error={formErrors.button_url || undefined}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Fade>
                  )}

                  {/* Tab 3: Settings */}
                  {activeTab === 3 && (
                    <Fade in={activeTab === 3}>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                          }}
                        >
                          <SettingsIcon />
                          Settings & Schedule
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                              <InputLabel>Target Audience</InputLabel>
                              <Select
                                value={formData.target_audience}
                                label="Target Audience"
                                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                                sx={{ borderRadius: 2 }}
                              >
                                <SelectMenuItem value="all">All Users</SelectMenuItem>
                                <SelectMenuItem value="customers">Customers Only</SelectMenuItem>
                                <SelectMenuItem value="providers">Providers Only</SelectMenuItem>
                              </Select>
                              <FormHelperText>Select who should see this slider</FormHelperText>
                            </FormControl>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Card
                              sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: formData.is_active 
                                  ? alpha(theme.palette.success.main, 0.1)
                                  : alpha(theme.palette.grey[500], 0.1),
                                border: `2px solid ${
                                  formData.is_active
                                    ? alpha(theme.palette.success.main, 0.3)
                                    : alpha(theme.palette.grey[500], 0.3)
                                }`,
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    color="success"
                                    size="medium"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      Active Status
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formData.is_active ? 'Slider is visible to users' : 'Slider is hidden'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Card>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <ScheduleIcon />
                              Schedule (Optional)
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Set when the slider should be displayed. Leave empty for no scheduling.
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="Start Date"
                              type="date"
                              value={formData.start_date}
                              onChange={(e) => {
                                setFormData({ ...formData, start_date: e.target.value });
                                if (formErrors.end_date) {
                                  setFormErrors({ ...formErrors, end_date: '' });
                                }
                              }}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              helperText="When should the slider start appearing?"
                              sx={{ borderRadius: 2 }}
                            />
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                              fullWidth
                              label="End Date"
                              type="date"
                              value={formData.end_date}
                              onChange={(e) => {
                                setFormData({ ...formData, end_date: e.target.value });
                                if (formErrors.end_date) {
                                  setFormErrors({ ...formErrors, end_date: '' });
                                }
                              }}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              helperText="When should the slider stop appearing?"
                              error={!!formErrors.end_date}
                              sx={{ borderRadius: 2 }}
                            />
                            {formErrors.end_date && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                {formErrors.end_date}
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Fade>
                  )}

                  {/* Tab 4: Preview */}
                  {activeTab === 4 && (
                    <Fade in={activeTab === 4}>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            color: 'primary.main',
                          }}
                        >
                          <PreviewIcon />
                          Live Preview
                        </Typography>
                        {imageUrl ? (
                          <Card
                            sx={{
                              borderRadius: 3,
                              overflow: 'hidden',
                              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                            }}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                height: { xs: 300, sm: 400, md: 500 },
                                position: 'relative',
                                bgcolor: alpha(theme.palette.grey[500], 0.05),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                              }}
                            >
                              <img
                                src={imageUrl}
                                alt={formData.image_alt || formData.title || 'Slider preview'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              {(formData.title || formData.subtitle || formData.button_text) && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: `linear-gradient(to top, ${alpha('#000', 0.85)}, transparent)`,
                                    p: { xs: 2, sm: 3, md: 4 },
                                    color: 'white',
                                  }}
                                >
                                  {formData.title && (
                                    <Typography 
                                      variant="h4" 
                                      sx={{ 
                                        fontWeight: 700, 
                                        mb: 1,
                                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
                                      }}
                                    >
                                      {formData.title}
                                    </Typography>
                                  )}
                                  {formData.subtitle && (
                                    <Typography 
                                      variant="h6" 
                                      sx={{ 
                                        opacity: 0.95,
                                        mb: 2,
                                        fontSize: { xs: '1rem', sm: '1.25rem' }
                                      }}
                                    >
                                      {formData.subtitle}
                                    </Typography>
                                  )}
                                  {formData.button_text && (
                                    <Button
                                      variant="contained"
                                      size="large"
                                      sx={{ 
                                        mt: 1,
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                      }}
                                      disabled
                                    >
                                      {formData.button_text}
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Card>
                        ) : (
                          <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            <Typography variant="body2">
                              Please upload an image or provide an image URL to see the preview.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Fade>
                  )}

                  {/* Form Actions */}
                  <Box
                    sx={{
                      mt: 4,
                      pt: 3,
                      borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setViewMode('list');
                        resetForm();
                      }}
                      disabled={formLoading}
                      sx={{ 
                        borderRadius: 2,
                        minWidth: { xs: '100%', sm: 120 },
                        order: { xs: 2, sm: 1 },
                      }}
                    >
                      Cancel
                    </Button>
                    <Stack direction="row" spacing={2} sx={{ order: { xs: 1, sm: 2 } }}>
                      {activeTab > 0 && (
                        <Button
                          variant="outlined"
                          onClick={() => setActiveTab(activeTab - 1)}
                          disabled={formLoading}
                          sx={{ borderRadius: 2 }}
                        >
                          Previous
                        </Button>
                      )}
                      {activeTab < tabs.length - 1 ? (
                        <Button
                          variant="outlined"
                          onClick={() => setActiveTab(activeTab + 1)}
                          disabled={formLoading}
                          sx={{ borderRadius: 2 }}
                        >
                          Next
                        </Button>
                      ) : null}
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={formLoading}
                        startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ 
                          borderRadius: 2,
                          minWidth: { xs: '100%', sm: 180 },
                          py: 1.5,
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        {formLoading ? 'Processing...' : formMode === 'edit' ? 'Update Slider' : 'Create Slider'}
                      </Button>
                    </Stack>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>

          {/* Side Preview Panel */}
          {showPreview && imageUrl && (
            <Zoom in={showPreview}>
              <Box sx={{ flex: { xs: 1, lg: 1 }, position: { lg: 'sticky' }, top: 24, height: 'fit-content' }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      p: 2,
                      borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PreviewIcon fontSize="small" />
                      Live Preview
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: 250, sm: 350, lg: 400 },
                      position: 'relative',
                      bgcolor: alpha(theme.palette.grey[500], 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={formData.image_alt || formData.title || 'Slider preview'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {(formData.title || formData.subtitle || formData.button_text) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: `linear-gradient(to top, ${alpha('#000', 0.85)}, transparent)`,
                          p: 3,
                          color: 'white',
                        }}
                      >
                        {formData.title && (
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {formData.title}
                          </Typography>
                        )}
                        {formData.subtitle && (
                          <Typography variant="body1" sx={{ opacity: 0.95, mb: 1 }}>
                            {formData.subtitle}
                          </Typography>
                        )}
                        {formData.button_text && (
                          <Button
                            variant="contained"
                            size="medium"
                            sx={{ mt: 1 }}
                            disabled
                          >
                            {formData.button_text}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Card>
              </Box>
            </Zoom>
          )}
        </Box>
      </Box>
    );
  }

  // List View
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Slider Management"
        subtitle="Manage banners and sliders for the client-side website"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ borderRadius: 2 }}
          >
            Add Slider
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <ImageIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_sliders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sliders
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {stats.active_sliders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <ScheduleIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {stats.scheduled_sliders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <PublicIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {stats.inactive_sliders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, subtitle, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: 2,
                    }
                  }}
                >
                  <SelectMenuItem value="all">All Status</SelectMenuItem>
                  <SelectMenuItem value="active">Active</SelectMenuItem>
                  <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Audience</InputLabel>
                <Select
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  label="Audience"
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: 2,
                    }
                  }}
                >
                  <SelectMenuItem value="all">All Audiences</SelectMenuItem>
                  <SelectMenuItem value="customers">Customers Only</SelectMenuItem>
                  <SelectMenuItem value="providers">Providers Only</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                fullWidth
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sliders Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : sliders.length === 0 ? (
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 10 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ImageIcon sx={{ fontSize: 64, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
              No sliders found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              {searchTerm || statusFilter !== 'all' || audienceFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Create your first slider banner to get started with marketing campaigns'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleCreate} 
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Create Your First Slider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '& .MuiTableCell-head': {
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: 'primary.main',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                }}>
                  <TableCell sx={{ fontWeight: 600 }}>Preview</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Audience</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Menu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sliders.map((slider) => (
                  <TableRow 
                    key={slider.id} 
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                      '& .MuiTableCell-body': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      }
                    }}
                  >
                    <TableCell>
                      <Avatar
                        variant="rounded"
                        src={slider.image_url}
                        sx={{
                          width: 100,
                          height: 60,
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                          }
                        }}
                        onClick={() => {
                          if (slider.image_url) {
                            window.open(slider.image_url, '_blank');
                          }
                        }}
                      >
                        {!slider.image_url && <ImageIcon />}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {slider.title}
                        </Typography>
                        {slider.subtitle && (
                          <Typography variant="caption" color="text.secondary">
                            {slider.subtitle}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={slider.position} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={slider.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                        label={slider.is_active ? 'Active' : 'Inactive'}
                        color={getStatusColor(slider.is_active)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={slider.target_audience === 'all' ? <PublicIcon /> : <GroupIcon />}
                        label={slider.target_audience || 'all'}
                        color={getAudienceColor(slider.target_audience || 'all')}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {slider.start_date && (
                          <Typography variant="caption" color="text.secondary">
                            Start: {formatDate(slider.start_date)}
                          </Typography>
                        )}
                        {slider.end_date && (
                          <Typography variant="caption" color="text.secondary">
                            End: {formatDate(slider.end_date)}
                          </Typography>
                        )}
                        {!slider.start_date && !slider.end_date && (
                          <Typography variant="caption" color="text.secondary">
                            No schedule
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title={slider.is_active ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            color={slider.is_active ? 'success' : 'default'}
                            onClick={() => handleToggleStatus(slider)}
                            sx={{
                              bgcolor: alpha(
                                slider.is_active ? theme.palette.success.main : theme.palette.grey[500],
                                0.1
                              ),
                              '&:hover': {
                                bgcolor: alpha(
                                  slider.is_active ? theme.palette.success.main : theme.palette.grey[500],
                                  0.2
                                ),
                              },
                            }}
                          >
                            {slider.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Move Up">
                          <IconButton
                            size="small"
                            onClick={() => handleMoveUp(slider)}
                            disabled={slider.position <= 1}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <ArrowUpIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Move Down">
                          <IconButton
                            size="small"
                            onClick={() => handleMoveDown(slider)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, slider)}
                        sx={{
                          bgcolor: alpha(theme.palette.grey[500], 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.grey[500], 0.2),
                          },
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ 
              mt: 3,
              '& .MuiTablePagination-toolbar': {
                px: 0,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontWeight: 500,
              }
            }}
          />
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 160 }
        }}
      >
        <MenuItem onClick={() => menuSlider && handleEdit(menuSlider)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => menuSlider && handleDelete(menuSlider)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
