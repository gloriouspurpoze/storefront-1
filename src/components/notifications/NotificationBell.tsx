import React, { useState } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';

export function NotificationBell() {
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleClick = () => {
    setNotificationCenterOpen(true);
  };

  const handleClose = () => {
    setNotificationCenterOpen(false);
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ position: 'relative' }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                height: '18px',
                minWidth: '18px',
                padding: '0 6px'
              }
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationCenter
        open={notificationCenterOpen}
        onClose={handleClose}
      />
    </>
  );
}
