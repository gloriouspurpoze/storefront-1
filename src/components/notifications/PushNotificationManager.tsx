import React, { useEffect, useState } from 'react';
import { Box, Alert, Button, Typography, Card, CardContent, Stack } from '@mui/material';
import { Notifications as NotificationsIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface PushNotificationManagerProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function PushNotificationManager({ 
  onPermissionGranted, 
  onPermissionDenied 
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const { registerDevice, unregisterDevice } = useNotifications();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkRegistrationStatus();
    }
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsRegistered(!!subscription);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await enablePushNotifications();
        onPermissionGranted?.();
        dispatch(addToast({
          message: 'Push notifications enabled successfully',
          severity: 'success'
        }));
      } else {
        onPermissionDenied?.();
        dispatch(addToast({
          message: 'Push notifications permission denied',
          severity: 'warning'
        }));
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      dispatch(addToast({
        message: 'Failed to request notification permission',
        severity: 'error'
      }));
    }
  };

  const enablePushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: await getVAPIDKey()
        });

        // Register device with backend
        await registerDevice();

        setIsRegistered(true);
        console.log('Push subscription created:', subscription);
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      throw error;
    }
  };

  const disablePushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          await unregisterDevice();
        }

        setIsRegistered(false);
        dispatch(addToast({
          message: 'Push notifications disabled',
          severity: 'info'
        }));
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      dispatch(addToast({
        message: 'Failed to disable push notifications',
        severity: 'error'
      }));
    }
  };

  const getVAPIDKey = async (): Promise<string> => {
    try {
      const response = await fetch('/api/notifications/vapid-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      throw new Error('Failed to get VAPID key');
    }
  };

  if (!isSupported) {
    return (
      <Alert severity="warning">
        Push notifications are not supported in this browser.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsIcon color="primary" />
            <Typography variant="h6">
              Push Notifications
            </Typography>
            {isRegistered && (
              <CheckIcon color="success" />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            Receive real-time notifications about orders, messages, and important updates.
          </Typography>

          {permission === 'default' && (
            <Alert severity="info">
              <Typography variant="body2" gutterBottom>
                Click the button below to enable push notifications for this application.
              </Typography>
              <Button
                variant="contained"
                onClick={requestPermission}
                sx={{ mt: 1 }}
              >
                Enable Push Notifications
              </Button>
            </Alert>
          )}

          {permission === 'denied' && (
            <Alert severity="warning">
              <Typography variant="body2" gutterBottom>
                Push notifications are blocked. Please enable them in your browser settings.
              </Typography>
              <Typography variant="caption" display="block">
                Go to your browser settings → Privacy and security → Site settings → Notifications
              </Typography>
            </Alert>
          )}

          {permission === 'granted' && (
            <Box>
              {isRegistered ? (
                <Alert severity="success">
                  <Typography variant="body2" gutterBottom>
                    Push notifications are enabled and working.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={disablePushNotifications}
                    sx={{ mt: 1 }}
                  >
                    Disable Push Notifications
                  </Button>
                </Alert>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2" gutterBottom>
                    Permission granted. Setting up push notifications...
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={enablePushNotifications}
                    sx={{ mt: 1 }}
                  >
                    Complete Setup
                  </Button>
                </Alert>
              )}
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              What you'll receive:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
              <li>New order notifications</li>
              <li>Message alerts</li>
              <li>Service updates</li>
              <li>System announcements</li>
              <li>Payment confirmations</li>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
