import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { NotificationManager } from '../../components/notifications/NotificationManager';

export function Notifications() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage push notifications, templates, and user preferences
        </Typography>
      </Box>

      <Paper sx={{ p: 0 }}>
        <NotificationManager />
      </Paper>
    </Container>
  );
}
