import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  alpha,
  useTheme,
  Alert,
  Divider,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Email as EmailIcon,
  IntegrationInstructions as IntegrationIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';

export default function NewsletterManagement() {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Newsletter & Email Marketing"
        subtitle="Manage subscribers and email campaigns for your client website"
      />

      <Stack spacing={3}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Connect your email service provider (ESP) to collect subscribers and send campaigns. 
          Common integrations: Mailchimp, Sendinblue, ConvertKit, or your backend API.
        </Alert>

        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={3} alignItems="flex-start" flexWrap="wrap">
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                }}
              >
                <CampaignIcon sx={{ fontSize: 48 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 280 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Market-standard checklist
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your client site can offer:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
                  <li>Signup form (footer / pop-up / inline)</li>
                  <li>Double opt-in (confirm email)</li>
                  <li>Segments (e.g. by interest or category)</li>
                  <li>Campaigns (promos, product updates, blog digest)</li>
                  <li>Unsubscribe and preference center</li>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <EmailIcon color="action" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Integration options
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a backend endpoint (e.g. <code>POST /api/newsletter/subscribe</code>) that forwards to your ESP, 
              or embed your ESP’s signup form on the client site. Use webhooks from your ESP to keep subscriber counts in sync.
            </Typography>
            <Button
              variant="outlined"
              href="https://www.mailchimp.com/developers/"
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<IntegrationIcon />}
              endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              View Mailchimp API docs
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
