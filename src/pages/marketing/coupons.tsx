import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  LocalOffer as CouponIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { CouponsService } from '../../services/api';
import { appToast } from '../../lib/appToast';
import { useAppConfirm } from '../../components/providers/AppDialogsProvider';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'first_order';
  value: number;
  minimum_amount: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_count: number;
  user_limit: number;
  is_active: boolean;
  starts_at: string;
  expires_at?: string;
  applicable_to: 'all' | 'services' | 'products' | 'bookings';
  created_at: string;
  updated_at: string;
}

type CouponFormData = Pick<
  Coupon,
  | 'code'
  | 'name'
  | 'description'
  | 'type'
  | 'value'
  | 'minimum_amount'
  | 'user_limit'
  | 'is_active'
  | 'starts_at'
  | 'applicable_to'
> & {
  maximum_discount: number
  usage_limit: number
  expires_at: string
}

export default function Coupons() {
  const theme = useTheme();
  const confirm = useAppConfirm();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState('');

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: 1000,
    user_limit: 1,
    is_active: true,
    starts_at: '',
    expires_at: '',
    applicable_to: 'all',
  });

  useEffect(() => {
    if (viewMode === 'list') {
      fetchCoupons();
    }
  }, [viewMode]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await CouponsService.getCoupons();
      // setCoupons(response.data);
      
      // Mock data for now
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          code: 'WELCOME10',
          name: 'Welcome Discount',
          description: '10% off for new customers',
          type: 'percentage',
          value: 10,
          minimum_amount: 50,
          usage_limit: 100,
          usage_count: 25,
          user_limit: 1,
          is_active: true,
          starts_at: '2024-01-01',
          expires_at: '2024-12-31',
          applicable_to: 'all',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      setCoupons(mockCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Replace with actual API call
      // if (editingCoupon) {
      //   await CouponsService.updateCoupon(editingCoupon.id, formData);
      // } else {
      //   await CouponsService.createCoupon(formData);
      // }
      
      fetchCoupons();
      setViewMode('list');
      resetForm();
    } catch (error: any) {
      appToast(
        'Error: ' + (error.response?.data?.error || 'Failed to save coupon'),
        'error'
      );
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete coupon?',
      message: 'Delete this coupon?',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      // await CouponsService.deleteCoupon(id);
      fetchCoupons();
    } catch (error) {
      appToast('Error deleting coupon', 'error');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minimum_amount: coupon.minimum_amount,
      maximum_discount: coupon.maximum_discount || 0,
      usage_limit: coupon.usage_limit || 1000,
      user_limit: coupon.user_limit,
      is_active: coupon.is_active,
      starts_at: coupon.starts_at,
      expires_at: coupon.expires_at || '',
      applicable_to: coupon.applicable_to,
    });
    setViewMode('form');
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimum_amount: 0,
      maximum_discount: 0,
      usage_limit: 1000,
      user_limit: 1,
      is_active: true,
      starts_at: '',
      expires_at: '',
      applicable_to: 'all',
    });
    setEditingCoupon(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.usage_limit) return 0;
    return (coupon.usage_count / coupon.usage_limit) * 100;
  };

  const filteredCoupons = () => {
    switch (tabValue) {
      case 1:
        return coupons.filter(c => c.is_active);
      case 2:
        return coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date());
      default:
        return coupons;
    }
  };

  // Form View
  if (viewMode === 'form') {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <PageHeader
          title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          subtitle={editingCoupon ? 'Update coupon details' : 'Add a new discount coupon'}
          action={
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
          }
        />

        <Card sx={{ mt: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Divider sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Basic Information
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Coupon Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME10"
                    required
                    InputProps={{
                      sx: { fontFamily: 'monospace', fontWeight: 600 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <CouponIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Coupon Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Discount"
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
                    placeholder="10% off for new customers"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Discount Details
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Discount Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Discount Type"
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                      <MenuItem value="free_shipping">Free Shipping</MenuItem>
                      <MenuItem value="bogo">Buy One Get One</MenuItem>
                      <MenuItem value="first_order">First Order</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Discount Value ${formData.type === 'percentage' ? '(%)' : '(₹)'}`}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Order Value (₹)"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_amount: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Discount (₹)"
                    value={formData.maximum_discount}
                    onChange={(e) => setFormData({ ...formData, maximum_discount: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Usage Limits
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total Usage Limit"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                    helperText="Leave empty for unlimited"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Per User Limit"
                    value={formData.user_limit}
                    onChange={(e) => setFormData({ ...formData, user_limit: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Applicable To</InputLabel>
                    <Select
                      value={formData.applicable_to}
                      label="Applicable To"
                      onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="services">Services</MenuItem>
                      <MenuItem value="products">Products</MenuItem>
                      <MenuItem value="bookings">Bookings</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Schedule
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setViewMode('list');
                        resetForm();
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ borderRadius: 2 }}
                    >
                      {editingCoupon ? 'Update' : 'Create'} Coupon
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // List View
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Coupon Management"
        subtitle="Create and manage discount coupons"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setViewMode('form');
            }}
            sx={{ borderRadius: 2 }}
          >
            Create Coupon
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
                  <CouponIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {coupons.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Coupons
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                    {coupons.filter(c => c.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Coupons
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {coupons.reduce((sum, c) => sum + c.usage_count, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Usage
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
                  <CalendarIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expired
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`All (${coupons.length})`} />
            <Tab label={`Active (${coupons.filter(c => c.is_active).length})`} />
            <Tab label={`Expired (${coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length})`} />
          </Tabs>
        </Box>

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : filteredCoupons().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CouponIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No coupons found
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setViewMode('form');
                }}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Create Coupon
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredCoupons().map((coupon) => (
                <Grid item xs={12} md={6} key={coupon.id}>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                              <CouponIcon sx={{ color: theme.palette.primary.main }} />
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {coupon.name}
                              </Typography>
                              <Chip
                                label={coupon.is_active ? 'Active' : 'Inactive'}
                                color={coupon.is_active ? 'success' : 'default'}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {coupon.description}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(coupon)}
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
                                size="small"
                                color="error"
                                onClick={() => handleDelete(coupon.id)}
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
                        </Box>

                        {/* Coupon Code */}
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
                                Coupon Code
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {coupon.code}
                              </Typography>
                            </Box>
                            <Tooltip title={copiedCode === coupon.code ? 'Copied!' : 'Copy code'}>
                              <IconButton
                                size="small"
                                onClick={() => copyCode(coupon.code)}
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  },
                                }}
                              >
                                {copiedCode === coupon.code ? (
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
                            label={`${coupon.value}${coupon.type === 'percentage' ? '%' : '₹'} OFF`}
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                          {coupon.minimum_amount > 0 && (
                            <Chip
                              label={`Min: ₹${coupon.minimum_amount}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {coupon.maximum_discount && (
                            <Chip
                              label={`Max: ₹${coupon.maximum_discount}`}
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
                              {coupon.usage_count} / {coupon.usage_limit || '∞'}
                            </Typography>
                          </Stack>
                          {coupon.usage_limit && (
                            <LinearProgress
                              variant="determinate"
                              value={getUsagePercentage(coupon)}
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
                            {new Date(coupon.starts_at).toLocaleDateString()} - {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
