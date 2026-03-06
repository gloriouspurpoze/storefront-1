import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Link as LinkIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { settingsService } from '../../services/api/settings.service';

export interface SocialLinksData {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  website?: string;
}

const defaultLinks: SocialLinksData = {
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  website: '',
};

export default function SocialLinksManagement() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [formData, setFormData] = useState<SocialLinksData>(defaultLinks);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getClientControls();
      const data = (res as any)?.data ?? res;
      const controls = data?.clientControls ?? data;
      const links = (controls?.socialLinks ?? controls?.social_links) || {};
      if (controls && typeof controls === 'object') {
        setFormData({ ...defaultLinks, ...links });
      }
    } catch (e) {
      console.error('Error loading client controls:', e);
      setSnackbar({ open: true, message: 'Could not load settings.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SocialLinksData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value.trim() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateClientControls({ socialLinks: formData } as any);
      setSnackbar({ open: true, message: 'Social links saved successfully.', severity: 'success' });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.error || err?.message || 'Failed to save social links.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof SocialLinksData; label: string; placeholder: string; icon: React.ReactNode }[] = [
    { key: 'website', label: 'Website', placeholder: 'https://yourwebsite.com', icon: <LanguageIcon /> },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage', icon: <FacebookIcon /> },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle', icon: <TwitterIcon /> },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', icon: <InstagramIcon /> },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourpage', icon: <LinkedInIcon /> },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel', icon: <YouTubeIcon /> },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Social Links"
        subtitle="Manage social and website links shown on your client site (footer, header, contact)"
      />

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        These URLs are typically displayed in the client website footer or contact section. 
        Backend must persist <code>socialLinks</code> in client settings for them to appear on the site.
      </Alert>

      <Card sx={{ borderRadius: 3, maxWidth: 640, overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {fields.map(({ key, label, placeholder, icon }) => (
                  <TextField
                    key={key}
                    fullWidth
                    label={label}
                    placeholder={placeholder}
                    value={formData[key] || ''}
                    onChange={handleChange(key)}
                    type="url"
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1.5, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                          {icon}
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    }}
                  />
                ))}
                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    {saving ? 'Saving…' : 'Save social links'}
                  </Button>
                  <Button type="button" variant="outlined" onClick={loadSettings} sx={{ borderRadius: 2 }}>
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
