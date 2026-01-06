import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Description as TemplateIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { NotificationTemplates } from './NotificationTemplates';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationsService, CreateNotificationRequest } from '../../services/api/notifications.service';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface NotificationManagerProps {
  onClose?: () => void;
}

export function NotificationManager({ onClose }: NotificationManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'send'>('overview');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  const {
    notifications,
    preferences,
    unreadCount,
    refreshNotifications
  } = useNotifications();

  const [sendForm, setSendForm] = useState<CreateNotificationRequest>({
    title: '',
    body: '',
    type: 'system_alert',
    iconUrl: '',
    actionUrl: '',
    data: {},
    userIds: []
  });

  const notificationTypes = [
    { value: 'quote_received', label: 'Quote Received' },
    { value: 'quote_accepted', label: 'Quote Accepted' },
    { value: 'booking_confirmed', label: 'Booking Confirmed' },
    { value: 'message_received', label: 'Message Received' },
    { value: 'order_placed', label: 'Order Placed' },
    { value: 'order_updated', label: 'Order Updated' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'service_completed', label: 'Service Completed' },
    { value: 'review_requested', label: 'Review Requested' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'reminder', label: 'Reminder' }
  ];

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      const result = await notificationsService.sendNotification(sendForm);
      
      dispatch(addToast({
        message: `Notification sent successfully. ${result.success} delivered, ${result.failed} failed.`,
        severity: 'success'
      }));

      setSendDialogOpen(false);
      setSendForm({
        title: '',
        body: '',
        type: 'system_alert',
        iconUrl: '',
        actionUrl: '',
        data: {},
        userIds: []
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplate = (templateId: string) => {
    setTemplateDialogOpen(true);
  };

  const recentNotifications = notifications.slice(0, 5);
  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    readRate: notifications.length > 0 ? ((notifications.length - unreadCount) / notifications.length * 100).toFixed(1) : '0'
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Notifications
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.unread}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <CheckIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.read}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.readRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setSendDialogOpen(true)}
                fullWidth
              >
                Send Notification
              </Button>
              <Button
                variant="outlined"
                startIcon={<TemplateIcon />}
                onClick={() => setActiveTab('templates')}
                fullWidth
              >
                Manage Templates
              </Button>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => setNotificationCenterOpen(true)}
                fullWidth
              >
                View All Notifications
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Notifications */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Notifications
              </Typography>
              <IconButton onClick={refreshNotifications} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>
            <List dense>
              {recentNotifications.map((notification) => (
                <ListItem key={notification.id} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <Badge
                        color="error"
                        variant="dot"
                        invisible={notification.isRead}
                      >
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <NotificationsIcon />
                        </Avatar>
                      </Badge>
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={notification.body}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: notification.isRead ? 400 : 600
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        sx: {
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }
                      }}
                    />
                    <Chip
                      label={notification.type.replace('_', ' ')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
          <Button
            onClick={() => setActiveTab('overview')}
            variant={activeTab === 'overview' ? 'contained' : 'text'}
            sx={{ borderRadius: 0 }}
          >
            Overview
          </Button>
          <Button
            onClick={() => setActiveTab('templates')}
            variant={activeTab === 'templates' ? 'contained' : 'text'}
            sx={{ borderRadius: 0 }}
          >
            Templates
          </Button>
          <Button
            onClick={() => setActiveTab('send')}
            variant={activeTab === 'send' ? 'contained' : 'text'}
            sx={{ borderRadius: 0 }}
          >
            Send Notification
          </Button>
        </Box>
      </Paper>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'templates' && (
        <NotificationTemplates onSendNotification={handleSendTemplate} />
      )}
      {activeTab === 'send' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Send Notification
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Use the form below to send a custom notification to users.
            </Alert>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setSendDialogOpen(true)}
            >
              Open Send Form
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Send Notification Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={sendForm.title}
              onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Message"
              value={sendForm.body}
              onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={sendForm.type}
                onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
                label="Type"
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Icon URL"
              value={sendForm.iconUrl}
              onChange={(e) => setSendForm({ ...sendForm, iconUrl: e.target.value })}
              fullWidth
            />

            <TextField
              label="Action URL"
              value={sendForm.actionUrl}
              onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            disabled={loading || !sendForm.title || !sendForm.body}
          >
            {loading ? <CircularProgress size={20} /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </Box>
  );
}
