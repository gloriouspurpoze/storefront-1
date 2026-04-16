import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  Tooltip,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Divider,
  Link,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  Add as AddIcon,
  Send as SendIcon,
  Description as TemplateIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Campaign as CampaignIcon,
  Tune as TuneIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { NotificationTemplates } from './NotificationTemplates';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import {
  notificationsService,
  CreateNotificationRequest,
  NotificationStats,
  NotificationTemplate,
} from '../../services/api/notifications.service';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface NotificationManagerProps {
  onClose?: () => void;
}

function a11yProps(index: number) {
  return {
    id: `notifications-tab-${index}`,
    'aria-controls': `notifications-tabpanel-${index}`,
  };
}

export function NotificationManager({ onClose: _onClose }: NotificationManagerProps) {
  const [tab, setTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [broadcastStats, setBroadcastStats] = useState<NotificationStats | null>(null);
  const [recipientIdsCsv, setRecipientIdsCsv] = useState('');
  const dispatch = useAppDispatch();

  const {
    notifications,
    preferences,
    unreadCount,
    refreshNotifications,
    updatePreferences,
    registerDevice,
    unregisterDevice,
    isLoading,
  } = useNotifications();

  const [sendForm, setSendForm] = useState<CreateNotificationRequest>({
    title: '',
    body: '',
    type: 'system_alert',
    iconUrl: '',
    actionUrl: '',
    data: {},
    userIds: [],
  });

  const [localPrefs, setLocalPrefs] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    userNotifications: true,
    systemNotifications: true,
    marketingNotifications: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        pushNotifications: preferences.pushNotifications,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        orderNotifications: preferences.orderNotifications,
        userNotifications: preferences.userNotifications,
        systemNotifications: preferences.systemNotifications,
        marketingNotifications: preferences.marketingNotifications,
      });
    }
  }, [preferences]);

  const loadBroadcastStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const s = await notificationsService.getNotificationStats();
      const hasData =
        s.totalSent > 0 ||
        s.totalRead > 0 ||
        s.totalUnread > 0 ||
        Object.keys(s.byType || {}).length > 0;
      setBroadcastStats(hasData ? s : null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcastStats();
  }, [loadBroadcastStats]);

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
    { value: 'reminder', label: 'Reminder' },
  ];

  const parseRecipientIds = (csv: string): string[] =>
    csv
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSendNotification = async () => {
    const userIds = parseRecipientIds(recipientIdsCsv);
    const payload: CreateNotificationRequest = {
      ...sendForm,
      iconUrl: sendForm.iconUrl?.trim() || undefined,
      actionUrl: sendForm.actionUrl?.trim() || undefined,
      userIds: userIds.length > 0 ? userIds : [],
    };

    try {
      setLoading(true);
      const result = await notificationsService.sendNotification(payload);

      const delivered = Number(result.success ?? 0);
      const failed = Number(result.failed ?? 0);
      dispatch(
        addToast({
          message:
            delivered === 0 && failed === 0
              ? 'Send completed. If nothing was delivered, confirm recipient user IDs and server configuration.'
              : `Delivered: ${delivered}${failed ? `, failed: ${failed}` : ''}.`,
          severity: delivered > 0 ? 'success' : 'warning',
        })
      );

      setSendDialogOpen(false);
      setRecipientIdsCsv('');
      setSendForm({
        title: '',
        body: '',
        type: 'system_alert',
        iconUrl: '',
        actionUrl: '',
        data: {},
        userIds: [],
      });
      await Promise.all([refreshNotifications(), loadBroadcastStats()]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendFromTemplate = (template: NotificationTemplate) => {
    const stripPlaceholders = (s: string) =>
      s.replace(/\{\{[^}]+\}\}/g, (m) => m.replace(/[{}]/g, '').replace(/_/g, ' '));

    setSendForm({
      title: stripPlaceholders(template.titleTemplate).slice(0, 120) || template.name,
      body: stripPlaceholders(template.bodyTemplate),
      type: template.type,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      data: { templateId: template.id },
      userIds: [],
    });
    setRecipientIdsCsv('');
    setTab(1);
    setSendDialogOpen(true);
  };

  const recentNotifications = notifications.slice(0, 5);
  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    read: Math.max(0, notifications.length - unreadCount),
    readRate:
      notifications.length > 0
        ? (((notifications.length - unreadCount) / notifications.length) * 100).toFixed(1)
        : '0',
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(localPrefs);
    } catch {
      /* toast in hook */
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" icon={false}>
          <Typography variant="subtitle2" gutterBottom>
            Operational scope
          </Typography>
          <Typography variant="body2" color="text.secondary">
            In-app items below reflect this admin session&apos;s feed. Broadcast metrics (if your API exposes them)
            appear when the stats endpoint returns data. Marketing sends should respect consent flags under
            Preferences.
          </Typography>
        </Alert>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  In-app (loaded)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card variant="outlined">
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
        <Card variant="outlined">
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
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{notificationStats.readRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read rate (in-app)
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {broadcastStats && (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600}>
              Broadcast pipeline (API)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Totals from <code>/notifications/stats</code> when available.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{broadcastStats.totalSent}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{broadcastStats.totalRead}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{broadcastStats.totalUnread}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{broadcastStats.readRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Read rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {statsLoading && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Checking broadcast stats…
            </Typography>
          </Box>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick actions
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => {
                  setTab(1);
                  setSendDialogOpen(true);
                }}
                fullWidth
              >
                Compose broadcast
              </Button>
              <Button
                variant="outlined"
                startIcon={<TemplateIcon />}
                onClick={() => setTab(2)}
                fullWidth
              >
                Templates
              </Button>
              <Button
                variant="outlined"
                startIcon={<TuneIcon />}
                onClick={() => setTab(3)}
                fullWidth
              >
                Preferences &amp; channels
              </Button>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => setNotificationCenterOpen(true)}
                fullWidth
              >
                Open notification center
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent in-app</Typography>
              <Tooltip title="Refresh">
                <span>
                  <IconButton onClick={() => void refreshNotifications()} size="small" disabled={isLoading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            {recentNotifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No notifications in the current window. Use Refresh after new activity.
              </Typography>
            ) : (
              <List dense disablePadding>
                {recentNotifications.map((notification) => (
                  <ListItem key={notification.id} disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        <Badge color="error" variant="dot" invisible={notification.isRead}>
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
                          fontWeight: notification.isRead ? 400 : 600,
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: {
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          },
                        }}
                      />
                      <Chip
                        label={notification.type.replace(/_/g, ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBroadcast = () => (
    <Stack spacing={3}>
      <Alert severity="warning">
        <Typography variant="body2">
          Broadcasts may reach real users. Confirm copy, audience, and compliance (especially for{' '}
          <strong>marketing</strong>) before sending. Recipient IDs must match your backend&apos;s user identifiers.
        </Typography>
      </Alert>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Compose
            </Typography>
            <Button variant="contained" startIcon={<SendIcon />} onClick={() => setSendDialogOpen(true)}>
              Open send dialog
            </Button>
            <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => setTab(2)}>
              Pick a template first
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );

  const renderPreferences = () => (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        Channel toggles are stored per user via <code>PUT /notifications/preferences</code>. Web push also requires a
        subscribed browser endpoint.
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Web push (this browser)
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button variant="outlined" onClick={() => void registerDevice()}>
              Enable push on this device
            </Button>
            <Button color="warning" variant="outlined" onClick={() => void unregisterDevice()}>
              Disable push on this device
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Categories
          </Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.pushNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, pushNotifications: e.target.checked }))}
                />
              }
              label="Push notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.emailNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
                />
              }
              label="Email"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.smsNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, smsNotifications: e.target.checked }))}
                />
              }
              label="SMS"
            />
            <Divider sx={{ my: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.orderNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, orderNotifications: e.target.checked }))}
                />
              }
              label="Orders & bookings"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.userNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, userNotifications: e.target.checked }))}
                />
              }
              label="Account & messages"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.systemNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, systemNotifications: e.target.checked }))}
                />
              }
              label="System & security"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPrefs.marketingNotifications}
                  onChange={(e) => setLocalPrefs((p) => ({ ...p, marketingNotifications: e.target.checked }))}
                />
              }
              label="Marketing (opt-in)"
            />
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => void handleSavePreferences()}>
              Save preferences
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Product documentation: keep an audit trail of high-impact sends in your backend.{' '}
        <Link href="https://web.dev/articles/push-notifications-overview" target="_blank" rel="noopener noreferrer">
          Web Push overview
        </Link>
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: 'transparent' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Notification management sections"
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Broadcast" icon={<CampaignIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Templates" icon={<TemplateIcon />} iconPosition="start" {...a11yProps(2)} />
          <Tab label="Preferences" icon={<TuneIcon />} iconPosition="start" {...a11yProps(3)} />
        </Tabs>
      </Paper>

      <Box role="tabpanel" hidden={tab !== 0} id="notifications-tabpanel-0" aria-labelledby="notifications-tab-0">
        {tab === 0 && renderOverview()}
      </Box>
      <Box role="tabpanel" hidden={tab !== 1} id="notifications-tabpanel-1" aria-labelledby="notifications-tab-1">
        {tab === 1 && renderBroadcast()}
      </Box>
      <Box role="tabpanel" hidden={tab !== 2} id="notifications-tabpanel-2" aria-labelledby="notifications-tab-2">
        {tab === 2 && (
          <NotificationTemplates onSendFromTemplate={handleSendFromTemplate} />
        )}
      </Box>
      <Box role="tabpanel" hidden={tab !== 3} id="notifications-tabpanel-3" aria-labelledby="notifications-tab-3">
        {tab === 3 && renderPreferences()}
      </Box>

      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send notification</DialogTitle>
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
                onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
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
              label="Recipient user IDs"
              value={recipientIdsCsv}
              onChange={(e) => setRecipientIdsCsv(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. 507f1f77bcf86cd799439011, 507f191e810c19729de860ea"
              helperText="Comma, space, or newline separated. If your API targets everyone when empty, you may leave this blank—confirm in your backend contract."
            />
            <TextField
              label="Icon URL (https only)"
              value={sendForm.iconUrl}
              onChange={(e) => setSendForm({ ...sendForm, iconUrl: e.target.value })}
              fullWidth
            />
            <TextField
              label="Action URL (https only)"
              value={sendForm.actionUrl}
              onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => void handleSendNotification()}
            variant="contained"
            disabled={loading || !sendForm.title?.trim() || !sendForm.body?.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationCenter open={notificationCenterOpen} onClose={() => setNotificationCenterOpen(false)} />
    </Box>
  );
}
