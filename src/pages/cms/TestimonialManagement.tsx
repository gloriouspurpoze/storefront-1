import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Grid,
  IconButton,
  Rating,
  Stack,
  Switch,
  TextField,
  Typography,
  Avatar,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { format } from 'date-fns';
import { PageHeader } from '../../components/common/PageHeader';

interface Testimonial {
  _id: string;
  customerName: string;
  customerTitle?: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  service?: string;
  isApproved: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function TestimonialManagement() {
  const theme = useTheme();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'featured'>('all');

  const [formData, setFormData] = useState({
    customerName: '',
    customerTitle: '',
    customerAvatar: '',
    rating: 5,
    comment: '',
    service: '',
    isApproved: false,
    isFeatured: false,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'approved') params.isApproved = true;
      if (filter === 'pending') params.isApproved = false;
      if (filter === 'featured') params.isFeatured = true;

      const data = await CMSService.getTestimonials(params);
      setTestimonials(data.testimonials || []);
    } catch (error: any) {
      console.error('Error fetching testimonials:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to load testimonials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.customerName.trim() || !formData.comment.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const payload = {
        ...formData,
        rating: Number(formData.rating),
        displayOrder: Number(formData.displayOrder),
      };

      if (editingTestimonial) {
        await CMSService.updateTestimonial(editingTestimonial._id, payload);
      } else {
        await CMSService.createTestimonial(payload);
      }

      fetchTestimonials();
      handleCloseForm();
    } catch (error: any) {
      console.error('Error saving testimonial:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to save testimonial'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await CMSService.deleteTestimonial(id);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error deleting testimonial:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to delete testimonial'));
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      customerName: testimonial.customerName,
      customerTitle: testimonial.customerTitle || '',
      customerAvatar: testimonial.customerAvatar || '',
      rating: testimonial.rating,
      comment: testimonial.comment,
      service: testimonial.service || '',
      isApproved: testimonial.isApproved,
      isFeatured: testimonial.isFeatured,
      displayOrder: testimonial.displayOrder,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTestimonial(null);
    setFormData({
      customerName: '',
      customerTitle: '',
      customerAvatar: '',
      rating: 5,
      comment: '',
      service: '',
      isApproved: false,
      isFeatured: false,
      displayOrder: 0,
    });
  };

  const handleToggleApproval = async (testimonial: Testimonial) => {
    try {
      await CMSService.updateTestimonial(testimonial._id, {
        isApproved: !testimonial.isApproved,
      });
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error updating approval:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to update approval'));
    }
  };

  const handleToggleFeatured = async (testimonial: Testimonial) => {
    try {
      await CMSService.updateTestimonial(testimonial._id, {
        isFeatured: !testimonial.isFeatured,
      });
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error updating featured status:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to update featured status'));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Testimonial Management"
        subtitle="Manage customer reviews and testimonials"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Testimonial
          </Button>
        }
      />

      {/* Filter Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_, newValue) => setFilter(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label={`All (${testimonials.length})`} value="all" />
          <Tab
            label={`Approved (${testimonials.filter(t => t.isApproved).length})`}
            value="approved"
          />
          <Tab
            label={`Pending (${testimonials.filter(t => !t.isApproved).length})`}
            value="pending"
          />
          <Tab
            label={`Featured (${testimonials.filter(t => t.isFeatured).length})`}
            value="featured"
          />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : testimonials.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No testimonials found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first testimonial to showcase customer feedback
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Add Testimonial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {testimonials.map((testimonial) => (
            <Grid item xs={12} md={6} lg={4} key={testimonial._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: testimonial.isFeatured ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                {testimonial.isFeatured && (
                  <Chip
                    icon={<StarIcon />}
                    label="Featured"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontWeight: 600,
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Stack spacing={2}>
                    {/* Customer Info */}
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={testimonial.customerAvatar}
                        alt={testimonial.customerName}
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '1.5rem',
                        }}
                      >
                        {testimonial.customerName.charAt(0)}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {testimonial.customerName}
                        </Typography>
                        {testimonial.customerTitle && (
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.customerTitle}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Rating */}
                    <Rating
                      value={testimonial.rating}
                      readOnly
                      precision={0.5}
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: theme.palette.warning.main,
                        },
                      }}
                    />

                    {/* Comment */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        flexGrow: 1,
                      }}
                    >
                      "{testimonial.comment}"
                    </Typography>

                    {/* Service */}
                    {testimonial.service && (
                      <Chip
                        label={testimonial.service}
                        size="small"
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    )}

                    <Divider />

                    {/* Status and Actions */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        size="small"
                        label={testimonial.isApproved ? 'Approved' : 'Pending'}
                        color={testimonial.isApproved ? 'success' : 'warning'}
                        icon={testimonial.isApproved ? <ApprovedIcon /> : <RejectedIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={testimonial.isApproved ? 'Unapprove' : 'Approve'}>
                          <IconButton
                            size="small"
                            color={testimonial.isApproved ? 'success' : 'default'}
                            onClick={() => handleToggleApproval(testimonial)}
                            sx={{
                              bgcolor: alpha(
                                testimonial.isApproved ? theme.palette.success.main : theme.palette.grey[500],
                                0.1
                              ),
                              '&:hover': {
                                bgcolor: alpha(
                                  testimonial.isApproved ? theme.palette.success.main : theme.palette.grey[500],
                                  0.2
                                ),
                              },
                            }}
                          >
                            <ApprovedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={testimonial.isFeatured ? 'Unfeature' : 'Feature'}>
                          <IconButton
                            size="small"
                            color={testimonial.isFeatured ? 'primary' : 'default'}
                            onClick={() => handleToggleFeatured(testimonial)}
                            sx={{
                              bgcolor: alpha(
                                testimonial.isFeatured ? theme.palette.primary.main : theme.palette.grey[500],
                                0.1
                              ),
                              '&:hover': {
                                bgcolor: alpha(
                                  testimonial.isFeatured ? theme.palette.primary.main : theme.palette.grey[500],
                                  0.2
                                ),
                              },
                            }}
                          >
                            <StarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(testimonial)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(testimonial._id)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {/* Footer */}
                    <Typography variant="caption" color="text.secondary">
                      Added {format(new Date(testimonial.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Customer Title/Position"
              value={formData.customerTitle}
              onChange={(e) => setFormData({ ...formData, customerTitle: e.target.value })}
              placeholder="e.g., Homeowner, Business Owner"
              fullWidth
            />
            <TextField
              label="Customer Avatar URL"
              value={formData.customerAvatar}
              onChange={(e) => setFormData({ ...formData, customerAvatar: e.target.value })}
              placeholder="https://..."
              fullWidth
            />
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
                Rating *
              </Typography>
              <Rating
                value={formData.rating}
                onChange={(_, value) => setFormData({ ...formData, rating: value || 5 })}
                precision={0.5}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: theme.palette.warning.main,
                  },
                }}
              />
            </Box>
            <TextField
              label="Testimonial Comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              multiline
              rows={4}
              required
              fullWidth
              placeholder="Share your experience..."
            />
            <TextField
              label="Service"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder="e.g., Plumbing, Electrical"
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isApproved}
                  onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                />
              }
              label="Approved"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
              }
              label="Featured"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTestimonial ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
