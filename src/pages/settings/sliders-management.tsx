import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  TrendingUp as TrendingUpIcon,
  CalendarClock as ScheduleIcon,
  Globe as PublicIcon,
  ChevronUp as ArrowUpIcon,
  ChevronDown as ArrowDownIcon,
  Users as GroupIcon,
  CheckCircle2 as CheckCircleIcon,
  XCircle as CancelIcon,
  Info as InfoIcon,
  Megaphone as CampaignIcon,
  Settings as SettingsIcon,
  Eye as PreviewIcon,
  Save as SaveIcon,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { appToast } from '../../lib/appToast';
import { cn } from '../../lib/utils';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Separator,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { SlidersService } from '../../services/api/sliders.service';
import { CategoriesService } from '../../services/api/categories.service';
import { Slider, SliderPlacement, SLIDER_PLACEMENT_LABELS } from '../../types';
import type { Category } from '../../types';
import { FormField, type ImageFile } from '../../components/forms';
import { useAppConfirm } from '../../components/providers/AppDialogsProvider';
import { SliderMediaFormSection } from '../../components/sliders/SliderMediaFormSection';
import { SliderResponsivePreview } from '../../components/sliders/SliderResponsivePreview';
import {
  DEFAULT_SLIDER_PLAYBACK,
  normalizeSliderMediaType,
  sliderFromApi,
  sliderThumbnailUrl,
  buildSliderPreviewSources,
  SLIDER_MEDIA_TYPE_LABELS,
} from '../../lib/sliderMedia';
import type { SliderMediaType } from '../../types';

interface SliderStats {
  total_sliders: number;
  active_sliders: number;
  inactive_sliders: number;
  scheduled_sliders: number;
}

export type SlidersManagementProps = {
  /** When true, omit outer page padding and list PageHeader (used inside Sliders & banners hub). */
  embedded?: boolean
}

export default function SlidersManagement({ embedded = false }: SlidersManagementProps) {
  const confirm = useAppConfirm();
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
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Categories for slider-by-category (e.g. AC, Electrician)
  const [categories, setCategories] = useState<Category[]>([]);

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
    image_url_mobile: '',
    image_alt: '',
    media_type: 'image' as SliderMediaType,
    video_url: '',
    video_url_mobile: '',
    poster_url: '',
    lottie_url: '',
    playback: { ...DEFAULT_SLIDER_PLAYBACK },
    button_text: '',
    button_url: '',
    position: 1,
    is_active: true,
    placement: 'home_page_hero' as SliderPlacement,
    category_id: '' as string,
    start_date: '',
    end_date: '',
    target_audience: 'all' as 'all' | 'customers' | 'providers',
  });

  const [uploadedImages, setUploadedImages] = useState<ImageFile[]>([]);
  const [uploadedPoster, setUploadedPoster] = useState<ImageFile[]>([]);


  useEffect(() => {
    if (viewMode === 'list') {
      fetchSliders();
      fetchStats();
    }
  }, [viewMode, page, limit, searchTerm, statusFilter, audienceFilter, placementFilter, categoryFilter]);

  // Load categories for slider-by-category (e.g. AC, Electrician) when showing form or list filters
  useEffect(() => {
    if (viewMode === 'form' || viewMode === 'list') {
      CategoriesService.getCategories({ limit: 500, is_active: true })
        .then((res) => {
          const list = res?.data?.categories ?? (Array.isArray(res?.data) ? res.data : []);
          setCategories(Array.isArray(list) ? list : []);
        })
        .catch(() => setCategories([]));
    }
  }, [viewMode]);

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
      if (audienceFilter !== 'all') query.audience = audienceFilter;
      if (placementFilter !== 'all') query.placement = placementFilter;
      if (categoryFilter !== 'all') query.category_id = categoryFilter;

      const response = await SlidersService.getSliders(query);
      
      if (response && response.data) {
        if (response.data.sliders) {
          setSliders(response.data.sliders.map((s: Slider) => sliderFromApi(s)));
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
      appToast(errorMessage, 'error');
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
    const s = sliderFromApi(slider);
    setFormMode('edit');
    setSelectedSlider(s);
    setFormData({
      title: s.title || '',
      subtitle: s.subtitle || '',
      description: s.description || '',
      image_url: s.image_url || '',
      image_url_mobile: s.image_url_mobile || '',
      image_alt: s.image_alt || '',
      media_type: normalizeSliderMediaType(s.media_type),
      video_url: s.video_url || '',
      video_url_mobile: s.video_url_mobile || '',
      poster_url: s.poster_url || '',
      lottie_url: s.lottie_url || '',
      playback: { ...DEFAULT_SLIDER_PLAYBACK, ...(s.playback || {}) },
      button_text: s.button_text || '',
      button_url: s.button_url || '',
      position: s.position || 1,
      is_active: s.is_active ?? true,
      placement: (s.placement as SliderPlacement) || 'home_page_hero',
      category_id: s.category_id || '',
      start_date: s.start_date ? s.start_date.split('T')[0] : '',
      end_date: s.end_date ? s.end_date.split('T')[0] : '',
      target_audience: s.target_audience || 'all',
    });
    const thumb = sliderThumbnailUrl(s);
    if (thumb && normalizeSliderMediaType(s.media_type) !== 'video') {
      setUploadedImages([{
        id: 'existing',
        url: thumb,
        alt: s.image_alt || s.title,
        isPrimary: true,
        order: 0,
      }]);
    } else {
      setUploadedImages([]);
    }
    const poster = s.poster_url || (normalizeSliderMediaType(s.media_type) === 'video' ? s.image_url : '');
    if (poster) {
      setUploadedPoster([{
        id: 'existing-poster',
        url: poster,
        alt: (s.image_alt || s.title) + ' poster',
        isPrimary: true,
        order: 0,
      }]);
    } else {
      setUploadedPoster([]);
    }
    setActiveTab(0);
    setFormErrors({});
    setShowPreview(false);
    setViewMode('form');
  };

  const handleDelete = async (slider: Slider) => {
    const ok = await confirm({
      title: 'Delete slider?',
      message: `Are you sure you want to delete "${slider.title}"?`,
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      await SlidersService.deleteSlider(slider.id);
      appToast('Slider deleted successfully', 'success');
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting slider:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to delete slider';
      appToast(errorMessage, 'error');
    }
  };

  const handleToggleStatus = async (slider: Slider) => {
    try {
      await SlidersService.toggleSliderStatus(slider.id, !slider.is_active);
      appToast(`Slider ${!slider.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling slider status:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider status';
      appToast(errorMessage, 'error');
    }
  };

  const handleMoveUp = async (slider: Slider) => {
    try {
      await SlidersService.updateSliderPosition(slider.id, slider.position - 1);
      appToast('Slider position updated successfully', 'success');
      fetchSliders();
    } catch (error: any) {
      console.error('Error moving slider up:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider position';
      appToast(errorMessage, 'error');
    }
  };

  const handleMoveDown = async (slider: Slider) => {
    try {
      await SlidersService.updateSliderPosition(slider.id, slider.position + 1);
      appToast('Slider position updated successfully', 'success');
      fetchSliders();
    } catch (error: any) {
      console.error('Error moving slider down:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update slider position';
      appToast(errorMessage, 'error');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    const imageUrl = uploadedImages.length > 0 ? uploadedImages[0].url : formData.image_url;
    const posterUrl = uploadedPoster.length > 0 ? uploadedPoster[0].url : formData.poster_url;
    const mediaType = formData.media_type;

    if (mediaType === 'image' || mediaType === 'gif') {
      if (!imageUrl.trim()) {
        errors.image_url =
          mediaType === 'gif'
            ? 'GIF is required. Upload or paste a GIF URL'
            : 'Image is required. Upload or paste an image URL';
      }
    } else if (mediaType === 'video') {
      if (!formData.video_url.trim()) {
        errors.video_url = 'Video URL is required. Upload a video or paste a URL';
      }
    } else if (mediaType === 'lottie') {
      if (!formData.lottie_url.trim()) {
        errors.lottie_url = 'Lottie JSON URL is required';
      }
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
      appToast('Please fix the errors in the form', 'error');
      setActiveTab(0); // Go to first tab if there are errors
      return;
    }

    // Use uploaded image URL if available, otherwise use manual URL
    const imageUrl = uploadedImages.length > 0 ? uploadedImages[0].url : formData.image_url;
    const posterUrl = uploadedPoster.length > 0 ? uploadedPoster[0].url : formData.poster_url;
    const mediaType = formData.media_type;

    let resolvedImageUrl = imageUrl;
    if (mediaType === 'video') {
      resolvedImageUrl = posterUrl || imageUrl || formData.video_url;
    } else if (mediaType === 'lottie') {
      resolvedImageUrl = posterUrl || imageUrl;
    }

    try {
      setFormLoading(true);
      const payload: any = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        image_url: resolvedImageUrl,
        image_url_mobile: resolvedImageUrl,
        image_alt: uploadedImages.length > 0
          ? uploadedImages[0].alt
          : (formData.image_alt || formData.title),
        media_type: mediaType,
        video_url: mediaType === 'video' ? formData.video_url : undefined,
        video_url_mobile: mediaType === 'video' ? formData.video_url : undefined,
        poster_url: posterUrl || undefined,
        lottie_url: mediaType === 'lottie' ? formData.lottie_url : undefined,
        playback: formData.playback,
        button_text: formData.button_text || undefined,
        button_url: formData.button_url || undefined,
        position: formData.position,
        is_active: formData.is_active,
        placement: formData.placement,
        target_audience: formData.target_audience,
      };

      if (formData.start_date) {
        payload.start_date = new Date(formData.start_date).toISOString();
      }
      if (formData.end_date) {
        payload.end_date = new Date(formData.end_date).toISOString();
      }
      if (formData.category_id) {
        payload.category_id = formData.category_id;
        const cat = categories.find((c) => c.id === formData.category_id);
        if (cat?.slug) payload.category_slug = cat.slug;
      } else {
        payload.category_id = undefined;
        payload.category_slug = undefined;
      }

      if (formMode === 'create') {
        await SlidersService.createSlider(payload);
        appToast('Slider created successfully', 'success');
      } else if (selectedSlider) {
        await SlidersService.updateSlider(selectedSlider.id, payload);
        appToast('Slider updated successfully', 'success');
      }

      setViewMode('list');
      resetForm();
      fetchSliders();
      fetchStats();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error?.response?.data?.error || error?.message || `Failed to ${formMode} slider`;
      appToast(errorMessage, 'error');
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
      image_url_mobile: '',
      image_alt: '',
      media_type: 'image',
      video_url: '',
      video_url_mobile: '',
      poster_url: '',
      lottie_url: '',
      playback: { ...DEFAULT_SLIDER_PLAYBACK },
      button_text: '',
      button_url: '',
      position: 1,
      is_active: true,
      placement: 'home_page_hero',
      category_id: '',
      start_date: '',
      end_date: '',
      target_audience: 'all',
    });
    setUploadedImages([]);
    setUploadedPoster([]);
    setSelectedSlider(null);
    setActiveTab(0);
    setFormErrors({});
    setShowPreview(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAudienceFilter('all');
    setPlacementFilter('all');
    setCategoryFilter('all');
    setPage(0);
  };

  const getStatusBadgeVariant = (isActive: boolean): 'success' | 'secondary' =>
    isActive ? 'success' : 'secondary';

  const getAudienceBadgeVariant = (
    audience: string,
  ): 'default' | 'success' | 'secondary' | 'outline' => {
    switch (audience) {
      case 'all':
        return 'default';
      case 'customers':
        return 'success';
      case 'providers':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPlacementLabel = (placement?: string) =>
    placement && SLIDER_PLACEMENT_LABELS[placement as SliderPlacement]
      ? SLIDER_PLACEMENT_LABELS[placement as SliderPlacement]
      : placement || 'Home';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Form View
  if (viewMode === 'form') {
    const tabs = [
      { label: 'Basic Info', icon: <InfoIcon />, value: 0 },
      { label: 'Media', icon: <ImageIcon />, value: 1 },
      { label: 'Call to Action', icon: <CampaignIcon />, value: 2 },
      { label: 'Settings', icon: <SettingsIcon />, value: 3 },
      { label: 'Preview', icon: <PreviewIcon />, value: 4 },
    ];

    const previewSources = buildSliderPreviewSources({
      media_type: formData.media_type,
      image_url: uploadedImages[0]?.url || formData.image_url,
      video_url: formData.video_url,
      poster_url: uploadedPoster[0]?.url || formData.poster_url,
      lottie_url: formData.lottie_url,
      playback: formData.playback,
    });

    return (
      <TooltipProvider>
      <div className={cn(!embedded && 'p-4 sm:p-6 md:p-8')}>
        <PageHeader
          title={formMode === 'edit' ? 'Edit Slider' : 'Create New Slider'}
          subtitle={formMode === 'edit' ? 'Update slider details and settings' : 'Add a new banner/slider to your website'}
          action={
            <div className="flex flex-row gap-2">
              {activeTab !== 1 && (
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <PreviewIcon className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setViewMode('list');
                  resetForm();
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          }
        />

        {/* Progress Indicator */}
        <Card className="mt-6 mb-6 overflow-hidden rounded-2xl">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              {tabs.map((tab, index) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    'flex min-w-[120px] flex-col items-center gap-1 rounded-lg border p-3 text-center text-sm font-semibold transition-colors',
                    activeTab === index
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted',
                    activeTab > index && 'border-emerald-500/50',
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Errors Alert */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">Please fix the following errors:</p>
              <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => setFormErrors({})}>
                Dismiss
              </Button>
            </div>
            <ul className="list-inside list-disc space-y-1 pl-1">
              {Object.values(formErrors).map((error, idx) => (
                <li key={idx} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Form */}
          <div className="flex-1 lg:max-w-none" style={{ flex: showPreview && activeTab !== 1 ? '2 1 0%' : '1 1 0%' }}>
            <Card className="overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              {/* Tab Navigation */}
              <div className="border-b border-border bg-card">
                <Tabs value={String(activeTab)} onValueChange={(v) => setActiveTab(Number(v))}>
                  <TabsList className="h-auto min-h-16 w-full flex-wrap justify-start gap-1 rounded-none border-0 bg-transparent p-2">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={String(tab.value)}
                        className="gap-2 rounded-md data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                      >
                        {tab.icon}
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <CardContent className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleFormSubmit} id="slider-form">
                  {/* Tab 0: Basic Information */}
                  {activeTab === 0 && (
                    <div>
                        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-primary">
                          <InfoIcon className="h-6 w-6" />
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                          <div className="col-span-12 md:col-span-8">
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
                          </div>

                          <div className="col-span-12 md:col-span-4">
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
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <div className="space-y-2">
                              <Label>Placement</Label>
                              <Select
                                value={formData.placement}
                                onValueChange={(v) =>
                                  setFormData({ ...formData, placement: v as SliderPlacement })
                                }
                              >
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.entries(SLIDER_PLACEMENT_LABELS) as [SliderPlacement, string][]).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Where this banner appears (Home, Offers, Mobile App, etc.)
                              </p>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <div className="space-y-2">
                              <Label>Category (optional)</Label>
                              <Select
                                value={formData.category_id || '__all__'}
                                onValueChange={(v) =>
                                  setFormData({
                                    ...formData,
                                    category_id: v === '__all__' ? '' : v,
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__all__">All categories</SelectItem>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.name}
                                      {cat.slug ? ` (${cat.slug})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Show this slider only on this category (e.g. AC, Electrician)
                              </p>
                            </div>
                          </div>

                          <div className="col-span-12">
                            <FormField
                              label="Subtitle"
                              value={formData.subtitle}
                              onChange={(value) => setFormData({ ...formData, subtitle: value })}
                              placeholder="Get up to 50% off on all services"
                              helperText="A short tagline or secondary message (optional)"
                              maxLength={150}
                              showCharCount
                            />
                          </div>

                          <div className="col-span-12">
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
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Tab 1: Media — single asset + responsive preview */}
                  {activeTab === 1 && (
                    <SliderMediaFormSection
                      values={{
                        media_type: formData.media_type,
                        image_url: formData.image_url,
                        video_url: formData.video_url,
                        poster_url: formData.poster_url,
                        lottie_url: formData.lottie_url,
                        playback: formData.playback,
                      }}
                      onChange={(patch) =>
                        setFormData((prev) => ({
                          ...prev,
                          ...patch,
                          playback: patch.playback ? { ...prev.playback, ...patch.playback } : prev.playback,
                        }))
                      }
                      uploadedImages={uploadedImages}
                      onUploadedImagesChange={setUploadedImages}
                      uploadedPoster={uploadedPoster}
                      onUploadedPosterChange={setUploadedPoster}
                      imageAlt={formData.image_alt}
                      onImageAltChange={(value) => setFormData({ ...formData, image_alt: value })}
                      errors={formErrors}
                      onClearError={(key) =>
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next[key];
                          return next;
                        })
                      }
                      previewTitle={formData.title}
                      previewSubtitle={formData.subtitle}
                      previewButton={formData.button_text}
                    />
                  )}

                  {/* Tab 2: Call to Action */}
                  {activeTab === 2 && (
                    <div>
                        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-primary">
                          <CampaignIcon className="h-6 w-6" />
                          Call to Action
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                          <div className="col-span-12">
                            <div className="mb-6 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm">
                              <p>
                                Add a button to drive user engagement. Both button text and URL are optional, but if you
                                provide text, URL is required.
                              </p>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
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
                          </div>

                          <div className="col-span-12 md:col-span-6">
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
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Tab 3: Settings */}
                  {activeTab === 3 && (
                    <div>
                        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-primary">
                          <SettingsIcon className="h-6 w-6" />
                          Settings & Schedule
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                          <div className="col-span-12 md:col-span-6">
                            <div className="space-y-2">
                              <Label>Target Audience</Label>
                              <Select
                                value={formData.target_audience}
                                onValueChange={(v) =>
                                  setFormData({
                                    ...formData,
                                    target_audience: v as 'all' | 'customers' | 'providers',
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Users</SelectItem>
                                  <SelectItem value="customers">Customers Only</SelectItem>
                                  <SelectItem value="providers">Providers Only</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Select who should see this slider</p>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <Card
                              className={cn(
                                'rounded-lg border-2 p-4',
                                formData.is_active
                                  ? 'border-emerald-500/40 bg-emerald-500/10'
                                  : 'border-muted bg-muted/40',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Switch
                                  id="slider-active"
                                  checked={formData.is_active}
                                  onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_active: checked })
                                  }
                                />
                                <div>
                                  <Label htmlFor="slider-active" className="text-base font-semibold">
                                    Active Status
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    {formData.is_active
                                      ? 'Slider is visible to users'
                                      : 'Slider is hidden'}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>

                          <div className="col-span-12">
                            <Separator className="my-4" />
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                              <ScheduleIcon className="h-5 w-5" />
                              Schedule (Optional)
                            </h4>
                            <p className="mb-6 text-sm text-muted-foreground">
                              Set when the slider should be displayed. Leave empty for no scheduling.
                            </p>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <div className="space-y-2">
                              <Label htmlFor="start-date">Start Date</Label>
                              <Input
                                id="start-date"
                                type="date"
                                className="rounded-lg"
                                value={formData.start_date}
                                onChange={(e) => {
                                  setFormData({ ...formData, start_date: e.target.value });
                                  if (formErrors.end_date) {
                                    setFormErrors({ ...formErrors, end_date: '' });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                When should the slider start appearing?
                              </p>
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-6">
                            <div className="space-y-2">
                              <Label htmlFor="end-date">End Date</Label>
                              <Input
                                id="end-date"
                                type="date"
                                className={cn('rounded-lg', formErrors.end_date && 'border-destructive')}
                                value={formData.end_date}
                                onChange={(e) => {
                                  setFormData({ ...formData, end_date: e.target.value });
                                  if (formErrors.end_date) {
                                    setFormErrors({ ...formErrors, end_date: '' });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                When should the slider stop appearing?
                              </p>
                              {formErrors.end_date && (
                                <p className="block text-xs text-destructive">{formErrors.end_date}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Tab 4: Preview */}
                  {activeTab === 4 && (
                    <div>
                        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-primary">
                          <PreviewIcon className="h-6 w-6" />
                          Live Preview
                        </h3>
                        <SliderResponsivePreview
                          sources={previewSources}
                          title={formData.title}
                          subtitle={formData.subtitle}
                          buttonText={formData.button_text}
                        />
                      </div>
                  )}

                  {/* Form Actions */}
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                    <Button
                      variant="outline"
                      className="order-2 w-full rounded-lg sm:order-1 sm:w-auto"
                      onClick={() => {
                        setViewMode('list');
                        resetForm();
                      }}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                    <div className="order-1 flex w-full flex-col gap-2 sm:order-2 sm:w-auto sm:flex-row">
                      {activeTab > 0 && (
                        <Button
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setActiveTab(activeTab - 1)}
                          disabled={formLoading}
                        >
                          Previous
                        </Button>
                      )}
                      {activeTab < tabs.length - 1 ? (
                        <Button
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setActiveTab(activeTab + 1)}
                          disabled={formLoading}
                        >
                          Next
                        </Button>
                      ) : null}
                      <Button
                        type="submit"
                        className="min-h-11 min-w-[180px] rounded-lg text-base font-semibold"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <SaveIcon className="mr-2 h-4 w-4" />
                            {formMode === 'edit' ? 'Update Slider' : 'Create Slider'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Side preview (Media tab has built-in preview) */}
          {showPreview && activeTab !== 1 && (
            <div className="h-fit flex-1 lg:sticky lg:top-6">
              <SliderResponsivePreview
                sources={previewSources}
                title={formData.title}
                subtitle={formData.subtitle}
                buttonText={formData.button_text}
              />
            </div>
          )}
        </div>
      </div>
      </TooltipProvider>
    );
  }

  // List View
  return (
    <TooltipProvider>
      <div className={cn(!embedded && 'p-4 sm:p-6 md:p-8')}>
        {!embedded ? (
          <PageHeader
            title="Slider Management"
            subtitle="Manage banners and sliders for the client-side website"
            action={
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Slider
              </Button>
            }
          />
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add slider
            </Button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          <Card className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_sliders}</p>
                  <p className="text-sm text-muted-foreground">Total Sliders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-600">
                  <TrendingUpIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active_sliders}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3 text-amber-600">
                  <ScheduleIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.scheduled_sliders}</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-row items-center gap-4">
                <div className="rounded-lg bg-sky-500/10 p-3 text-sky-600">
                  <PublicIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-sky-600">{stats.inactive_sliders}</p>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 rounded-2xl shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
              <div className="col-span-12 md:col-span-3">
                <Input
                  placeholder="Search by title, subtitle, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="col-span-12 sm:col-span-6 md:col-span-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 sm:col-span-6 md:col-span-2">
                <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="customers">Customers Only</SelectItem>
                    <SelectItem value="providers">Providers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 sm:col-span-6 md:col-span-2">
                <Select value={placementFilter} onValueChange={setPlacementFilter}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Placements</SelectItem>
                    {(Object.entries(SLIDER_PLACEMENT_LABELS) as [SliderPlacement, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 sm:col-span-6 md:col-span-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12 md:col-span-2">
                <Button variant="outline" className="w-full rounded-lg font-semibold" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : sliders.length === 0 ? (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImageIcon className="h-14 w-14" />
              </div>
              <p className="mb-2 text-xl font-semibold">No sliders found</p>
              <p className="mb-8 max-w-md text-muted-foreground mx-auto">
                {searchTerm ||
                statusFilter !== 'all' ||
                audienceFilter !== 'all' ||
                placementFilter !== 'all' ||
                categoryFilter !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Create your first slider banner to get started with marketing campaigns'}
              </p>
              <Button onClick={handleCreate} className="rounded-lg px-8 py-6 text-base font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Slider
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-hidden rounded-3xl border bg-card shadow-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-primary/20 bg-primary/10 hover:bg-primary/10">
                    <TableHead className="font-bold text-primary">Preview</TableHead>
                    <TableHead className="font-bold text-primary">Title</TableHead>
                    <TableHead className="font-bold text-primary">Placement</TableHead>
                    <TableHead className="font-bold text-primary">Category</TableHead>
                    <TableHead className="font-bold text-primary">Position</TableHead>
                    <TableHead className="font-bold text-primary">Status</TableHead>
                    <TableHead className="font-bold text-primary">Audience</TableHead>
                    <TableHead className="font-bold text-primary">Schedule</TableHead>
                    <TableHead className="text-center font-bold text-primary">Actions</TableHead>
                    <TableHead className="text-right font-bold text-primary">Menu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sliders.map((slider) => (
                    <TableRow key={slider.id} className="border-border/60 hover:bg-muted/30">
                      <TableCell>
                        <Avatar
                          className="h-[60px] w-[100px] cursor-pointer rounded-md border-2 border-border transition-transform hover:scale-105"
                          onClick={() => {
                            if (slider.image_url) window.open(slider.image_url, '_blank');
                          }}
                        >
                          <AvatarImage src={sliderThumbnailUrl(slider) || undefined} className="object-cover" />
                          <AvatarFallback className="rounded-md">
                            <ImageIcon className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold">{slider.title}</p>
                          {slider.subtitle && (
                            <p className="text-xs text-muted-foreground">{slider.subtitle}</p>
                          )}
                          {slider.media_type && slider.media_type !== 'image' ? (
                            <Badge variant="outline" className="mt-1 text-[10px]">
                              {SLIDER_MEDIA_TYPE_LABELS[slider.media_type]}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {getPlacementLabel(slider.placement)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {slider.category_id || slider.category_name || slider.category_slug ? (
                          <Badge variant="outline" className="font-medium">
                            {slider.category_name || slider.category_slug || slider.category_id}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{slider.position}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(slider.is_active)} className="gap-1 font-semibold capitalize">
                          {slider.is_active ? (
                            <CheckCircleIcon className="h-3 w-3" />
                          ) : (
                            <CancelIcon className="h-3 w-3" />
                          )}
                          {slider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getAudienceBadgeVariant(slider.target_audience || 'all')}
                          className="gap-1 capitalize"
                        >
                          {slider.target_audience === 'all' ? (
                            <PublicIcon className="h-3 w-3" />
                          ) : (
                            <GroupIcon className="h-3 w-3" />
                          )}
                          {slider.target_audience || 'all'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {slider.start_date && <span>Start: {formatDate(slider.start_date)}</span>}
                          {slider.end_date && <span>End: {formatDate(slider.end_date)}</span>}
                          {!slider.start_date && !slider.end_date && <span>No schedule</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-row justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8',
                                  slider.is_active
                                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                )}
                                onClick={() => handleToggleStatus(slider)}
                              >
                                {slider.is_active ? (
                                  <CheckCircleIcon className="h-4 w-4" />
                                ) : (
                                  <CancelIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{slider.is_active ? 'Deactivate' : 'Activate'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
                                onClick={() => handleMoveUp(slider)}
                                disabled={slider.position <= 1}
                              >
                                <ArrowUpIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move Up</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20"
                                onClick={() => handleMoveDown(slider)}
                              >
                                <ArrowDownIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Move Down</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-muted/80">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(slider)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(slider)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
