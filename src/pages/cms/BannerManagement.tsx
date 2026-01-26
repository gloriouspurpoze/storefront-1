import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Tooltip,
  Paper,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchAppIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { ImageUploadField, type ImageFile } from '../../components/forms';
import { PageHeader } from '../../components/common/PageHeader';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Banner {
  _id: string;
  title: string;
  bannerType: string;
  position: string;
  images: { desktop: string; mobile?: string };
  schedule: { startDate: string; endDate: string };
  isActive: boolean;
  analytics: { impressions: number; clicks: number; conversions: number };
}

export default function BannerManagement() {
  const theme = useTheme();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerType: 'hero',
    position: 'top',
    desktopImages: [] as ImageFile[],
    mobileImages: [] as ImageFile[],
    ctaText: '',
    ctaLink: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(res.data.data.banners || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        description: formData.description,
        bannerType: formData.bannerType,
        position: formData.position,
        images: {
          desktop: formData.desktopImages[0]?.url || '',
          mobile: formData.mobileImages[0]?.url || formData.desktopImages[0]?.url || '',
        },
        cta: formData.ctaText ? {
          text: formData.ctaText,
          link: formData.ctaLink,
          openInNewTab: false,
        } : undefined,
        schedule: {
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          timezone: 'Asia/Kolkata',
        },
        priority: 1,
        isActive: formData.isActive,
        targetAudience: { userType: 'all' },
      };

      if (editingBanner) {
        await axios.put(`${API_BASE}/cms/admin/banners/${editingBanner._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/cms/admin/banners`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchBanners();
      handleCloseForm();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save banner'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBanners();
    } catch (error) {
      alert('Error deleting banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: '',
      bannerType: banner.bannerType,
      position: banner.position,
      desktopImages: banner.images.desktop ? [{
        id: '1',
        url: banner.images.desktop,
        alt: banner.title,
        isPrimary: true,
        order: 0
      }] : [],
      mobileImages: banner.images.mobile ? [{
        id: '2',
        url: banner.images.mobile,
        alt: banner.title,
        isPrimary: true,
        order: 0
      }] : [],
      ctaText: '',
      ctaLink: '',
      startDate: banner.schedule.startDate.split('T')[0],
      endDate: banner.schedule.endDate.split('T')[0],
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setFormData({
      title: '',
      description: '',
      bannerType: 'hero',
      position: 'top',
      desktopImages: [],
      mobileImages: [],
      ctaText: '',
      ctaLink: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const getBannerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      hero: theme.palette.primary.main,
      popup: theme.palette.error.main,
      announcement: theme.palette.warning.main,
      sidebar: theme.palette.info.main,
      inline: theme.palette.success.main,
    };
    return colors[type] || theme.palette.grey[500];
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Banner Management"
        subtitle="Create and schedule promotional banners for your website"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2 }}
          >
            Create Banner
          </Button>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No banners found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first banner to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Create Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {banners.map((banner) => (
            <Grid item xs={12} key={banner._id}>
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
                  <Grid container spacing={3} alignItems="center">
                    {/* Banner Image */}
                    <Grid item xs={12} md={3}>
                      {banner.images.desktop ? (
                        <CardMedia
                          component="img"
                          sx={{
                            width: '100%',
                            height: 150,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          }}
                          image={banner.images.desktop}
                          alt={banner.title}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 150,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                        </Box>
                      )}
                    </Grid>

                    {/* Banner Details */}
                    <Grid item xs={12} md={7}>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {banner.title}
                          </Typography>
                          <Chip
                            icon={banner.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                            label={banner.isActive ? 'Active' : 'Inactive'}
                            color={banner.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={banner.bannerType}
                            size="small"
                            sx={{
                              bgcolor: alpha(getBannerTypeColor(banner.bannerType), 0.1),
                              color: getBannerTypeColor(banner.bannerType),
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        </Box>

                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(banner.schedule.startDate).toLocaleDateString()} - {new Date(banner.schedule.endDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Position:</strong> {banner.position}
                          </Typography>
                        </Stack>

                        <Divider />

                        <Stack direction="row" spacing={3} flexWrap="wrap">
                          <Tooltip title="Impressions">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {banner.analytics.impressions || 0} views
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Clicks">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TouchAppIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {banner.analytics.clicks || 0} clicks
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Conversions">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TrendingUpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {banner.analytics.conversions || 0} conversions
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} md={2}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(banner)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(banner._id)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Banner Type</InputLabel>
                  <Select
                    value={formData.bannerType}
                    label="Banner Type"
                    onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}
                  >
                    <MenuItem value="hero">Hero Banner</MenuItem>
                    <MenuItem value="popup">Pop-up</MenuItem>
                    <MenuItem value="announcement">Announcement Bar</MenuItem>
                    <MenuItem value="sidebar">Sidebar</MenuItem>
                    <MenuItem value="inline">Inline</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={formData.position}
                    label="Position"
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  >
                    <MenuItem value="top">Top</MenuItem>
                    <MenuItem value="middle">Middle</MenuItem>
                    <MenuItem value="bottom">Bottom</MenuItem>
                    <MenuItem value="floating">Floating</MenuItem>
                    <MenuItem value="header">Header</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Banner Images
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <ImageUploadField
                  label="Desktop Banner Image"
                  value={formData.desktopImages}
                  onChange={(images) => setFormData({ ...formData, desktopImages: images })}
                  maxFiles={1}
                  maxSize={5}
                  helperText="Upload desktop banner image (Recommended: 1920x600px, Max 5MB)"
                  required
                  showPreview
                  allowPrimary={false}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ImageUploadField
                  label="Mobile Banner Image (Optional)"
                  value={formData.mobileImages}
                  onChange={(images) => setFormData({ ...formData, mobileImages: images })}
                  maxFiles={1}
                  maxSize={5}
                  helperText="Upload mobile banner image (Recommended: 768x400px, Max 5MB)"
                  showPreview
                  allowPrimary={false}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Call to Action
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CTA Button Text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="Shop Now"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CTA Link"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="/offers"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Schedule
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingBanner ? 'Update' : 'Create'} Banner
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
