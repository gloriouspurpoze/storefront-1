import React from 'react';
import { Box, Container, Paper, Stack, Chip } from '@mui/material';
import { PageHeader } from '../../components/common/PageHeader';
import { NotificationManager } from '../../components/notifications/NotificationManager';

export function Notifications() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title="Notifications"
        subtitle="In-app feed, optional broadcast sends, reusable templates, and channel preferences—aligned with typical SaaS notification operations."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label="In-app feed" variant="outlined" color="primary" />
            <Chip size="small" label="Broadcast API" variant="outlined" />
            <Chip size="small" label="Web push (device)" variant="outlined" />
          </Stack>
        }
      />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1.5, bgcolor: 'action.hover' }}>
          <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
            Restrict high-impact actions with server-side roles (for example <code>notification_send</code> /{' '}
            <code>notification_manage</code>). This UI assumes your API enforces the same rules.
          </Box>
        </Box>
        <NotificationManager />
      </Paper>
    </Container>
  );
}
