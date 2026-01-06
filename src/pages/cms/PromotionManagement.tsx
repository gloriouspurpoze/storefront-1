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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Tooltip,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as TagIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { PageHeader } from '../../components/common/PageHeader';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Promotion {
  _id: string;
  code: string;
  title: string;
  description: string;
  promotionType: string;
  discountValue: number;
  schedule: { startDate: string; endDate: string };
  isActive: boolean;
  isFeatured: boolean;
  usage: { currentUsage: number; totalLimit?: number };
  conditions: { minOrderValue?: number; maxDiscount?: number };
}

export default function PromotionManagement() {
  const theme = useTheme();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    promotionType: 'percentage',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    totalLimit: 1000,
    perUserLimit: 1,
    startDate: '',
    endDate: '',
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/promotions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(res.data.data.promotions || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        code: formData.code.toUpperCase(),
        title: formData.title,
        description: formData.description,
        promotionType: formData.promotionType,
        discountValue: formData.discountValue,
        applicableTo: { type: 'all' },
        conditions: {
          minOrderValue: formData.minOrderValue || undefined,
          maxDiscount: formData.maxDiscount || undefined,
          userType: 'all',
        },
        usage: {
          totalLimit: formData.totalLimit,
          perUserLimit: formData.perUserLimit,
        },
        schedule: {
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        },
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        priority: formData.isFeatured ? 1 : 0,
      };

      await axios.post(`${API_BASE}/cms/admin/promotions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchPromotions();
      handleCloseForm();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPromotions();
    } catch (error) {
      alert('Error deleting promotion');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleCloseForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      promotionType: 'percentage',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      totalLimit: 1000,
      perUserLimit: 1,
      startDate: '',
      endDate: '',
      isActive: true,
      isFeatured: false,
    });
    setShowForm(false);
  };

  const getUsagePercentage = (promo: Promotion) => {
    if (!promo.usage.totalLimit) return 0;
    return (promo.usage.currentUsage / promo.usage.totalLimit) * 100;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Promotion Management"
        subtitle="Create and manage discount codes & promotional offers"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2 }}
            color="success"
          >
            Create Promotion
          </Button>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : promotions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <TagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No promotions found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first promotion to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Create Promotion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {promotions.map((promo) => (
            <Grid item xs={12} md={6} key={promo._id}>
              <Card
                sx={{
                  height: '100%',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                          <TagIcon sx={{ color: theme.palette.success.main }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {promo.title}
                          </Typography>
                          <Chip
                            icon={promo.isActive ? <CheckIcon /> : undefined}
                            label={promo.isActive ? 'Active' : 'Inactive'}
                            color={promo.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          {promo.isFeatured && (
                            <Chip
                              label="Featured"
                              color="warning"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {promo.description}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(promo._id)}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                          },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    {/* Promo Code */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Promo Code
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {promo.code}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedCode === promo.code ? 'Copied!' : 'Copy code'}>
                          <IconButton
                            size="small"
                            onClick={() => copyCode(promo.code)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            {copiedCode === promo.code ? (
                              <CheckIcon sx={{ color: theme.palette.success.main }} />
                            ) : (
                              <CopyIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {/* Discount Info */}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        icon={<MoneyIcon />}
                        label={`${promo.discountValue}${promo.promotionType === 'percentage' ? '%' : '₹'} OFF`}
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                      {promo.conditions.minOrderValue && (
                        <Chip
                          label={`Min: ₹${promo.conditions.minOrderValue}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {promo.conditions.maxDiscount && (
                        <Chip
                          label={`Max: ₹${promo.conditions.maxDiscount}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    <Divider />

                    {/* Usage Stats */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Usage
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {promo.usage.currentUsage} / {promo.usage.totalLimit || '∞'}
                        </Typography>
                      </Stack>
                      {promo.usage.totalLimit && (
                        <LinearProgress
                          variant="determinate"
                          value={getUsagePercentage(promo)}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1,
                            },
                          }}
                        />
                      )}
                    </Box>

                    {/* Schedule */}
                    <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                      <CalendarIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        {new Date(promo.schedule.startDate).toLocaleDateString()} - {new Date(promo.schedule.endDate).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
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
            Create New Promotion
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Promo Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME30"
                  required
                  InputProps={{ sx: { fontFamily: 'monospace', fontWeight: 600 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Welcome Offer"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get 30% off on your first booking"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Discount Details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    value={formData.promotionType}
                    label="Discount Type"
                    onChange={(e) => setFormData({ ...formData, promotionType: e.target.value })}
                  >
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                    <MenuItem value="free_shipping">Free Shipping</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label={`Discount Value ${formData.promotionType === 'percentage' ? '(%)' : '(₹)'}`}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Min Order Value (₹)"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Discount (₹)"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Usage Limits
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Usage Limit"
                  value={formData.totalLimit}
                  onChange={(e) => setFormData({ ...formData, totalLimit: Number(e.target.value) })}
                  inputProps={{ min: 1 }}
                  helperText="Leave empty for unlimited"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Per User Limit"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                  inputProps={{ min: 1 }}
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

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                  }
                  label="Featured"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              Create Promotion
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
