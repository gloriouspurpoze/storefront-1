
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Badge,
  Chip,
  Divider,
  Button,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Circle as UnreadIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  ShoppingCart as OrderIcon,
  Message as MessageIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Build as ServiceIcon,
  RateReview as ReviewIcon,
  Campaign as MarketingIcon,
  Schedule as ReminderIcon
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { PushNotification, NotificationPreferences } from '../../services/api/notifications.service';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const notificationIcons: Record<PushNotification['type'], React.ReactElement> = {
  quote_received: <StarIcon color="primary" />,
  quote_accepted: <CheckIcon color="success" />,
  booking_confirmed: <CalendarIcon color="info" />,
  booking_created: <CalendarIcon color="primary" />,
  booking_cancelled: <CancelIcon color="error" />,
  booking_completed: <CheckIcon color="success" />,
  booking_assigned: <CalendarIcon color="info" />,
  status_changed: <InfoIcon color="info" />,
  message_received: <MessageIcon color="primary" />,
  order_placed: <OrderIcon color="primary" />,
  order_updated: <OrderIcon color="warning" />,
  payment_received: <PaymentIcon color="success" />,
  review_received: <ReviewIcon color="success" />,
  service_completed: <ServiceIcon color="success" />,
  review_requested: <ReviewIcon color="warning" />,
  system_alert: <WarningIcon color="error" />,
  system: <WarningIcon color="error" />,
  general: <InfoIcon color="info" />,
  marketing: <MarketingIcon color="secondary" />,
  reminder: <ReminderIcon color="info" />
};

const notificationColors: Record<PushNotification['type'], 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  quote_received: 'primary',
  quote_accepted: 'success',
  booking_confirmed: 'info',
  booking_created: 'primary',
  booking_cancelled: 'error',
  booking_completed: 'success',
  booking_assigned: 'info',
  status_changed: 'info',
  message_received: 'primary',
  order_placed: 'primary',
  order_updated: 'warning',
  payment_received: 'success',
  review_received: 'success',
  service_completed: 'success',
  review_requested: 'warning',
  system_alert: 'error',
  system: 'error',
  general: 'info',
  marketing: 'secondary',
  reminder: 'info'
};

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const {
    notifications,
    preferences,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    updatePreferences
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | PushNotification['type']>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<PushNotification | null>(null);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const handleNotificationClick = async (notification: PushNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    
    setSelectedNotification(notification);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setAnchorEl(null);
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    setAnchorEl(null);
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (preferences) {
      await updatePreferences({ [key]: value });
    }
  };

  const getNotificationIcon = (type: PushNotification['type']) => {
    return notificationIcons[type] || <InfoIcon />;
  };

  const getNotificationColor = (type: PushNotification['type']) => {
    return notificationColors[type] || 'default';
  };

  const formatNotificationTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            maxWidth: '90vw'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="div">
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton onClick={handleSettingsOpen}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Filter and Actions */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All"
                onClick={() => handleFilterChange('all')}
                color={filter === 'all' ? 'primary' : 'default'}
                size="small"
              />
              <Chip
                label="Unread"
                onClick={() => handleFilterChange('unread')}
                color={filter === 'unread' ? 'primary' : 'default'}
                size="small"
              />
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                size="small"
              >
                <MoreIcon />
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleMarkAllAsRead}>
                <MarkReadIcon sx={{ mr: 1 }} />
                Mark all as read
              </MenuItem>
              <MenuItem onClick={handleSettingsOpen}>
                <SettingsIcon sx={{ mr: 1 }} />
                Settings
              </MenuItem>
            </Menu>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Notifications List */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Alert severity="info">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Alert>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  disablePadding
                  sx={{
                    borderLeft: notification.isRead ? 'none' : '3px solid',
                    borderLeftColor: 'primary.main',
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: `${getNotificationColor(notification.type)}.light`,
                          color: `${getNotificationColor(notification.type)}.contrastText`
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.isRead ? 400 : 600,
                              flex: 1
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.isRead && (
                            <UnreadIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 0.5
                            }}
                          >
                            {notification.body}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          {preferences && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.smsNotifications}
                    onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                  />
                }
                label="SMS Notifications"
              />
              <Divider />
              <Typography variant="subtitle2" color="text.secondary">
                Notification Types
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.orderNotifications}
                    onChange={(e) => handlePreferenceChange('orderNotifications', e.target.checked)}
                  />
                }
                label="Order Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.userNotifications}
                    onChange={(e) => handlePreferenceChange('userNotifications', e.target.checked)}
                  />
                }
                label="User Management Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.systemNotifications}
                    onChange={(e) => handlePreferenceChange('systemNotifications', e.target.checked)}
                  />
                }
                label="System Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.marketingNotifications}
                    onChange={(e) => handlePreferenceChange('marketingNotifications', e.target.checked)}
                  />
                }
                label="Marketing Notifications"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
