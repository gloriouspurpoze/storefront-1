import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface SEOMeta {
  _id: string;
  pagePath: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
  robots: string;
  isActive: boolean;
}

export default function SEOManagement() {
  const [seoPages, setSeoPages] = useState<SEOMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOMeta | null>(null);

  const [formData, setFormData] = useState({
    pagePath: '',
    title: '',
    description: '',
    keywords: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    twitterCard: 'summary_large_image',
    canonical: '',
    robots: 'index, follow',
    isActive: true,
  });

  useEffect(() => {
    fetchSEOPages();
  }, []);

  const fetchSEOPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/seo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeoPages(res.data.data.seoMetas);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        pagePath: formData.pagePath,
        title: formData.title,
        description: formData.description,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        ogImage: formData.ogImage || undefined,
        ogTitle: formData.ogTitle || formData.title,
        ogDescription: formData.ogDescription || formData.description,
        twitterCard: formData.twitterCard,
        canonical: formData.canonical || undefined,
        robots: formData.robots,
        structuredData: {},
        isActive: formData.isActive,
      };

      if (editingPage) {
        await axios.put(`${API_BASE}/cms/admin/seo/${editingPage._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/cms/admin/seo`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchSEOPages();
      handleCloseForm();
      alert('SEO metadata saved successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this SEO configuration?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/seo/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSEOPages();
    } catch (error) {
      alert('Error deleting SEO configuration');
    }
  };

  const handleEdit = (page: SEOMeta) => {
    setEditingPage(page);
    setFormData({
      pagePath: page.pagePath,
      title: page.title,
      description: page.description,
      keywords: page.keywords.join(', '),
      ogImage: page.ogImage || '',
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
      canonical: page.canonical || '',
      robots: page.robots,
      isActive: page.isActive,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setFormData({
      pagePath: '',
      title: '',
      description: '',
      keywords: '',
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
      canonical: '',
      robots: 'index, follow',
      isActive: true,
    });
    setEditingPage(null);
    setShowForm(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">SEO Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage SEO metadata for your pages
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Add SEO Meta
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={2}>
          {seoPages.map((page) => (
            <Grid item xs={12} key={page._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <SearchIcon color="action" />
                        <Typography variant="h6" fontWeight="600">
                          <code>{page.pagePath}</code>
                        </Typography>
                        <Chip
                          label={page.isActive ? 'Active' : 'Inactive'}
                          color={page.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip label={page.robots} size="small" variant="outlined" />
                      </Stack>

                      <Typography variant="body1" fontWeight="600" sx={{ mb: 0.5 }}>
                        {page.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {page.description}
                      </Typography>

                      {page.keywords.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {page.keywords.map((keyword, idx) => (
                            <Chip key={idx} label={keyword} size="small" />
                          ))}
                        </Stack>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(page)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(page._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPage ? 'Edit SEO Meta' : 'Add SEO Meta'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Path"
                value={formData.pagePath}
                onChange={(e) => setFormData({ ...formData, pagePath: e.target.value })}
                placeholder="/services/ac-repair"
                required
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Page Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                helperText={`${formData.title.length}/60 characters`}
                inputProps={{ maxLength: 60 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meta Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                helperText={`${formData.description.length}/160 characters`}
                inputProps={{ maxLength: 160 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Keywords (comma-separated)"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="ac repair, home service, mumbai"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="OG Image URL"
                value={formData.ogImage}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                placeholder="https://..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Canonical URL"
                value={formData.canonical}
                onChange={(e) => setFormData({ ...formData, canonical: e.target.value })}
                placeholder="https://..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Robots</InputLabel>
                <Select
                  value={formData.robots}
                  label="Robots"
                  onChange={(e) => setFormData({ ...formData, robots: e.target.value })}
                >
                  <MenuItem value="index, follow">Index, Follow</MenuItem>
                  <MenuItem value="noindex, follow">No Index, Follow</MenuItem>
                  <MenuItem value="index, nofollow">Index, No Follow</MenuItem>
                  <MenuItem value="noindex, nofollow">No Index, No Follow</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingPage ? 'Update' : 'Create'} SEO Meta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
