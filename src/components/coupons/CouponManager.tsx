import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CardGiftcard as GiftIcon,
  AttachMoney as DollarIcon,
} from '@mui/icons-material';

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

const CouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'first_order';
    value: number;
    minimum_amount: number;
    maximum_discount: number;
    usage_limit: number;
    user_limit: number;
    is_active: boolean;
    starts_at: string;
    expires_at: string;
    applicable_to: 'all' | 'services' | 'products' | 'bookings';
  }>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimum_amount: 0,
    maximum_discount: 0,
    usage_limit: 0,
    user_limit: 1,
    is_active: true,
    starts_at: '',
    expires_at: '',
    applicable_to: 'all',
  });

  // Mock data for demonstration
  useEffect(() => {
    let isMounted = true
    
    const loadCoupons = () => {
      if (isMounted) {
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
          {
            id: '2',
            code: 'SAVE20',
            name: 'Save ₹20',
            description: '₹20 off orders over ₹100',
            type: 'fixed_amount',
            value: 20,
            minimum_amount: 100,
            usage_limit: 50,
            usage_count: 12,
            user_limit: 1,
            is_active: true,
            starts_at: '2024-01-01',
            expires_at: '2024-06-30',
            applicable_to: 'services',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];
        setCoupons(mockCoupons);
        setLoading(false);
      }
    }
    
    loadCoupons()
    
    return () => {
      isMounted = false
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        minimum_amount: coupon.minimum_amount,
        maximum_discount: coupon.maximum_discount || 0,
        usage_limit: coupon.usage_limit || 0,
        user_limit: coupon.user_limit,
        is_active: coupon.is_active,
        starts_at: coupon.starts_at,
        expires_at: coupon.expires_at || '',
        applicable_to: coupon.applicable_to,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: 0,
        minimum_amount: 0,
        maximum_discount: 0,
        usage_limit: 0,
        user_limit: 1,
        is_active: true,
        starts_at: '',
        expires_at: '',
        applicable_to: 'all',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCoupon(null);
  };

  const handleSaveCoupon = () => {
    // Here you would typically make an API call to save the coupon
    console.log('Saving coupon:', formData);
    handleCloseDialog();
  };

  const handleDeleteCoupon = (id: string) => {
    // Here you would typically make an API call to delete the coupon
    console.log('Deleting coupon:', id);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage': return 'primary';
      case 'fixed_amount': return 'secondary';
      case 'free_shipping': return 'success';
      case 'bogo': return 'warning';
      case 'first_order': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Coupon Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Coupon Statistics"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Coupon
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {coupons.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Coupons
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {coupons.filter(c => c.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Coupons
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {coupons.reduce((sum, c) => sum + c.usage_count, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Usage
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expired
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Coupons" />
            <Tab label="Active" />
            <Tab label="Expired" />
            <Tab label="Usage Analytics" />
          </Tabs>
        </Box>

        <CardContent>
          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {coupon.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{coupon.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.type.replace('_', ' ').toUpperCase()}
                          color={getTypeColor(coupon.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </TableCell>
                      <TableCell>
                        {coupon.usage_count} / {coupon.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.is_active ? 'Active' : 'Inactive'}
                          color={getStatusColor(coupon.is_active)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(coupon)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCoupon(coupon.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.filter(c => c.is_active).map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {coupon.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{coupon.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.type.replace('_', ' ').toUpperCase()}
                          color={getTypeColor(coupon.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </TableCell>
                      <TableCell>
                        {coupon.usage_count} / {coupon.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(coupon)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCoupon(coupon.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Expired Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {coupon.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{coupon.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={coupon.type.replace('_', ' ').toUpperCase()}
                          color={getTypeColor(coupon.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </TableCell>
                      <TableCell>{coupon.expires_at}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(coupon)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCoupon(coupon.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Usage Analytics Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed analytics and reporting will be available here
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Coupon Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Coupon Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Coupon Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Minimum Amount"
                type="number"
                value={formData.minimum_amount}
                onChange={(e) => setFormData({ ...formData, minimum_amount: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Maximum Discount"
                type="number"
                value={formData.maximum_discount}
                onChange={(e) => setFormData({ ...formData, maximum_discount: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Usage Limit"
                type="number"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="User Limit"
                type="number"
                value={formData.user_limit}
                onChange={(e) => setFormData({ ...formData, user_limit: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Applicable To</InputLabel>
                <Select
                  value={formData.applicable_to}
                  onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="services">Services</MenuItem>
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="bookings">Bookings</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCoupon} variant="contained">
            {editingCoupon ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { CouponManager };
export default CouponManager;