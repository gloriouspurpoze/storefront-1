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
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
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
  Share as ShareIcon,
} from '@mui/icons-material';

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

const ReferralManager: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [formData, setFormData] = useState({
    referral_code: '',
    reward_type: 'discount' as const,
    referrer_reward: 0,
    referee_reward: 0,
    referrer_reward_currency: 'USD',
    referee_reward_currency: 'USD',
    completion_requirement: 'first_purchase',
    minimum_spend: 0,
    expires_at: '',
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockReferrals: Referral[] = [
      {
        id: '1',
        referrer_id: 'user1',
        referee_id: 'user2',
        referral_code: 'REF123',
        status: 'completed',
        reward_type: 'discount',
        referrer_reward: 10,
        referee_reward: 5,
        referrer_reward_currency: 'USD',
        referee_reward_currency: 'USD',
        completion_requirement: 'first_purchase',
        minimum_spend: 50,
        expires_at: '2024-12-31',
        completed_at: '2024-01-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        referrer_id: 'user3',
        referee_id: 'user4',
        referral_code: 'REF456',
        status: 'pending',
        reward_type: 'credit',
        referrer_reward: 15,
        referee_reward: 10,
        referrer_reward_currency: 'USD',
        referee_reward_currency: 'USD',
        completion_requirement: 'first_purchase',
        minimum_spend: 100,
        expires_at: '2024-06-30',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    setReferrals(mockReferrals);
    setLoading(false);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (referral?: Referral) => {
    if (referral) {
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
    } else {
      setEditingReferral(null);
      setFormData({
        referral_code: '',
        reward_type: 'discount',
        referrer_reward: 0,
        referee_reward: 0,
        referrer_reward_currency: 'USD',
        referee_reward_currency: 'USD',
        completion_requirement: 'first_purchase',
        minimum_spend: 0,
        expires_at: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReferral(null);
  };

  const handleSaveReferral = () => {
    // Here you would typically make an API call to save the referral
    console.log('Saving referral:', formData);
    handleCloseDialog();
  };

  const handleDeleteReferral = (id: string) => {
    // Here you would typically make an API call to delete the referral
    console.log('Deleting referral:', id);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Referral Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Referral Statistics"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Referral Program
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {referrals.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Referrals
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {referrals.filter(r => r.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {referrals.filter(r => r.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  ${referrals.reduce((sum, r) => sum + r.referrer_reward + r.referee_reward, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rewards
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Referrals" />
            <Tab label="Completed" />
            <Tab label="Pending" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <CardContent>
          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Referral Code</TableCell>
                    <TableCell>Referrer</TableCell>
                    <TableCell>Referee</TableCell>
                    <TableCell>Reward Type</TableCell>
                    <TableCell>Rewards</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {referral.referral_code}
                        </Typography>
                      </TableCell>
                      <TableCell>User {referral.referrer_id}</TableCell>
                      <TableCell>User {referral.referee_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={referral.reward_type.replace('_', ' ').toUpperCase()}
                          color={getRewardTypeColor(referral.reward_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Referrer: ${referral.referrer_reward}
                        </Typography>
                        <Typography variant="body2">
                          Referee: ${referral.referee_reward}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={referral.status.toUpperCase()}
                          color={getStatusColor(referral.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(referral)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteReferral(referral.id)}>
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
                    <TableCell>Referral Code</TableCell>
                    <TableCell>Referrer</TableCell>
                    <TableCell>Referee</TableCell>
                    <TableCell>Reward Type</TableCell>
                    <TableCell>Rewards</TableCell>
                    <TableCell>Completed Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.filter(r => r.status === 'completed').map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {referral.referral_code}
                        </Typography>
                      </TableCell>
                      <TableCell>User {referral.referrer_id}</TableCell>
                      <TableCell>User {referral.referee_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={referral.reward_type.replace('_', ' ').toUpperCase()}
                          color={getRewardTypeColor(referral.reward_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Referrer: ${referral.referrer_reward}
                        </Typography>
                        <Typography variant="body2">
                          Referee: ${referral.referee_reward}
                        </Typography>
                      </TableCell>
                      <TableCell>{referral.completed_at}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(referral)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteReferral(referral.id)}>
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
                    <TableCell>Referral Code</TableCell>
                    <TableCell>Referrer</TableCell>
                    <TableCell>Referee</TableCell>
                    <TableCell>Reward Type</TableCell>
                    <TableCell>Rewards</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referrals.filter(r => r.status === 'pending').map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {referral.referral_code}
                        </Typography>
                      </TableCell>
                      <TableCell>User {referral.referrer_id}</TableCell>
                      <TableCell>User {referral.referee_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={referral.reward_type.replace('_', ' ').toUpperCase()}
                          color={getRewardTypeColor(referral.reward_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          Referrer: ${referral.referrer_reward}
                        </Typography>
                        <Typography variant="body2">
                          Referee: ${referral.referee_reward}
                        </Typography>
                      </TableCell>
                      <TableCell>{referral.expires_at}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(referral)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteReferral(referral.id)}>
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
                Referral Analytics Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed analytics and reporting will be available here
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Referral Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReferral ? 'Edit Referral Program' : 'Create New Referral Program'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referral Code"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Reward Type</InputLabel>
                <Select
                  value={formData.reward_type}
                  onChange={(e) => setFormData({ ...formData, reward_type: e.target.value as any })}
                >
                  <MenuItem value="discount">Discount</MenuItem>
                  <MenuItem value="credit">Credit</MenuItem>
                  <MenuItem value="cashback">Cashback</MenuItem>
                  <MenuItem value="free_service">Free Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referrer Reward"
                type="number"
                value={formData.referrer_reward}
                onChange={(e) => setFormData({ ...formData, referrer_reward: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Referee Reward"
                type="number"
                value={formData.referee_reward}
                onChange={(e) => setFormData({ ...formData, referee_reward: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Referrer Currency</InputLabel>
                <Select
                  value={formData.referrer_reward_currency}
                  onChange={(e) => setFormData({ ...formData, referrer_reward_currency: e.target.value })}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Referee Currency</InputLabel>
                <Select
                  value={formData.referee_reward_currency}
                  onChange={(e) => setFormData({ ...formData, referee_reward_currency: e.target.value })}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Completion Requirement</InputLabel>
                <Select
                  value={formData.completion_requirement}
                  onChange={(e) => setFormData({ ...formData, completion_requirement: e.target.value })}
                >
                  <MenuItem value="first_purchase">First Purchase</MenuItem>
                  <MenuItem value="minimum_spend">Minimum Spend</MenuItem>
                  <MenuItem value="service_completion">Service Completion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Spend"
                type="number"
                value={formData.minimum_spend}
                onChange={(e) => setFormData({ ...formData, minimum_spend: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveReferral} variant="contained">
            {editingReferral ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { ReferralManager };
export default ReferralManager;