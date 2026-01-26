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
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';

interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  reward_type: 'discount' | 'credit' | 'cashback' | 'free_service';
  referrer_reward: number;
  referee_reward: number;
  referrer_reward_currency: string;
  referee_reward_currency: string;
  completion_requirement: string;
  minimum_spend: number;
  expires_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

type ReferralFormData = Pick<
  Referral,
  | 'referral_code'
  | 'reward_type'
  | 'referrer_reward'
  | 'referee_reward'
  | 'referrer_reward_currency'
  | 'referee_reward_currency'
  | 'completion_requirement'
  | 'minimum_spend'
> & { expires_at: string }

export default function Referrals() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);

  const [formData, setFormData] = useState<ReferralFormData>({
    referral_code: '',
    reward_type: 'discount',
    referrer_reward: 0,
    referee_reward: 0,
    referrer_reward_currency: 'INR',
    referee_reward_currency: 'INR',
    completion_requirement: 'first_purchase',
    minimum_spend: 0,
    expires_at: '',
  });

  useEffect(() => {
    if (viewMode === 'list') {
      fetchReferrals();
    }
  }, [viewMode]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await ReferralsService.getReferrals();
      // setReferrals(response.data);
      
      // Mock data for now
      const mockReferrals: Referral[] = [
        {
          id: '1',
          referrer_id: 'user1',
          referee_id: 'user2',
          referral_code: 'REF123',
          status: 'completed',
          reward_type: 'discount',
          referrer_reward: 100,
          referee_reward: 50,
          referrer_reward_currency: 'INR',
          referee_reward_currency: 'INR',
          completion_requirement: 'first_purchase',
          minimum_spend: 500,
          expires_at: '2024-12-31',
          completed_at: '2024-01-15',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];
      setReferrals(mockReferrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Replace with actual API call
      // if (editingReferral) {
      //   await ReferralsService.updateReferral(editingReferral.id, formData);
      // } else {
      //   await ReferralsService.createReferral(formData);
      // }
      
      fetchReferrals();
      setViewMode('list');
      resetForm();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save referral'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this referral program?')) return;
    try {
      // await ReferralsService.deleteReferral(id);
      fetchReferrals();
    } catch (error) {
      alert('Error deleting referral');
    }
  };

  const handleEdit = (referral: Referral) => {
    setEditingReferral(referral);
    setFormData({
      referral_code: referral.referral_code,
      reward_type: referral.reward_type,
      referrer_reward: referral.referrer_reward,
      referee_reward: referral.referee_reward,
      referrer_reward_currency: referral.referrer_reward_currency,
      referee_reward_currency: referral.referee_reward_currency,
      completion_requirement: referral.completion_requirement,
      minimum_spend: referral.minimum_spend,
      expires_at: referral.expires_at || '',
    });
    setViewMode('form');
  };

  const resetForm = () => {
    setFormData({
      referral_code: '',
      reward_type: 'discount',
      referrer_reward: 0,
      referee_reward: 0,
      referrer_reward_currency: 'INR',
      referee_reward_currency: 'INR',
      completion_requirement: 'first_purchase',
      minimum_spend: 0,
      expires_at: '',
    });
    setEditingReferral(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'primary';
      case 'credit': return 'secondary';
      case 'cashback': return 'success';
      case 'free_service': return 'info';
      default: return 'default';
    }
  };

  const filteredReferrals = () => {
    switch (tabValue) {
      case 1:
        return referrals.filter(r => r.status === 'completed');
      case 2:
        return referrals.filter(r => r.status === 'pending');
      default:
        return referrals;
    }
  };

  // Form View
  if (viewMode === 'form') {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <PageHeader
          title={editingReferral ? 'Edit Referral Program' : 'Create Referral Program'}
          subtitle={editingReferral ? 'Update referral program details' : 'Set up a new referral program'}
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
                      Program Details
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Referral Code"
                    value={formData.referral_code}
                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                    placeholder="REF123"
                    required
                    InputProps={{
                      sx: { fontFamily: 'monospace', fontWeight: 600 },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Reward Type</InputLabel>
                    <Select
                      value={formData.reward_type}
                      label="Reward Type"
                      onChange={(e) => setFormData({ ...formData, reward_type: e.target.value as any })}
                    >
                      <MenuItem value="discount">Discount</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                      <MenuItem value="cashback">Cashback</MenuItem>
                      <MenuItem value="free_service">Free Service</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Rewards
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Referrer Reward"
                    value={formData.referrer_reward}
                    onChange={(e) => setFormData({ ...formData, referrer_reward: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                    required
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>₹</Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Referee Reward"
                    value={formData.referee_reward}
                    onChange={(e) => setFormData({ ...formData, referee_reward: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                    required
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>₹</Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Requirements
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Completion Requirement</InputLabel>
                    <Select
                      value={formData.completion_requirement}
                      label="Completion Requirement"
                      onChange={(e) => setFormData({ ...formData, completion_requirement: e.target.value })}
                    >
                      <MenuItem value="first_purchase">First Purchase</MenuItem>
                      <MenuItem value="minimum_spend">Minimum Spend</MenuItem>
                      <MenuItem value="service_booking">Service Booking</MenuItem>
                      <MenuItem value="account_signup">Account Signup</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Spend (₹)"
                    value={formData.minimum_spend}
                    onChange={(e) => setFormData({ ...formData, minimum_spend: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expires At"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    InputLabelProps={{ shrink: true }}
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
                      {editingReferral ? 'Update' : 'Create'} Program
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
        title="Referral Management"
        subtitle="Manage referral programs and track referrals"
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
            Create Program
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
                  <ShareIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {referrals.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Referrals
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
                  <CheckIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {referrals.filter(r => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
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
                  <ScheduleIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {referrals.filter(r => r.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
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
                  <MoneyIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    ₹{referrals.reduce((sum, r) => sum + r.referrer_reward + r.referee_reward, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Rewards
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
            <Tab label={`All (${referrals.length})`} />
            <Tab label={`Completed (${referrals.filter(r => r.status === 'completed').length})`} />
            <Tab label={`Pending (${referrals.filter(r => r.status === 'pending').length})`} />
          </Tabs>
        </Box>

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : filteredReferrals().length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShareIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No referrals found
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
                Create Program
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredReferrals().map((referral) => (
                <Grid item xs={12} md={6} key={referral.id}>
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
                              <ShareIcon sx={{ color: theme.palette.primary.main }} />
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {referral.referral_code}
                              </Typography>
                              <Chip
                                label={referral.status}
                                color={getStatusColor(referral.status)}
                                size="small"
                                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(referral)}
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
                                onClick={() => handleDelete(referral.id)}
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

                        <Divider />

                        {/* Rewards */}
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Rewards
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Referrer
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                  ₹{referral.referrer_reward}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  bgcolor: alpha(theme.palette.success.main, 0.05),
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary">
                                  Referee
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                  ₹{referral.referee_reward}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={referral.reward_type.replace('_', ' ')}
                            color={getRewardTypeColor(referral.reward_type)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                          {referral.minimum_spend > 0 && (
                            <Chip
                              label={`Min: ₹${referral.minimum_spend}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {referral.expires_at && (
                          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                            <ScheduleIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">
                              Expires: {new Date(referral.expires_at).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}

                        {referral.completed_at && (
                          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                            <CheckIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                            <Typography variant="body2">
                              Completed: {new Date(referral.completed_at).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
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
