import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as PageIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface Page {
  _id: string;
  title: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'private' | 'archived';
  publishedAt?: string;
  displayOrder: number;
  author: { name: string };
  analytics: { views: number };
  settings: { showInMenu: boolean };
  createdAt: string;
}

export default function PageManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showSEO, setShowSEO] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    template: 'default',
    status: 'draft',
    showInMenu: true,
    showTitle: true,
    displayOrder: 0,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(res.data.data.pages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        slug: formData.slug || undefined,
        content: formData.content,
        excerpt: formData.excerpt || undefined,
        template: formData.template,
        status: formData.status,
        displayOrder: formData.displayOrder,
        settings: {
          showInMenu: formData.showInMenu,
          showTitle: formData.showTitle,
          showSidebar: true,
          allowComments: false,
        },
        seo: {
          title: formData.seoTitle || formData.title,
          description: formData.seoDescription || formData.excerpt,
          keywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
        },
      };

      if (editingPage) {
        await axios.put(`${API_BASE}/cms/admin/pages/${editingPage._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/cms/admin/pages`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchPages();
      handleCloseForm();
      alert('Page saved successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/pages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPages();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to delete'));
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: '',
      excerpt: '',
      template: page.template,
      status: page.status,
      showInMenu: page.settings.showInMenu,
      showTitle: true,
      displayOrder: page.displayOrder,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      template: 'default',
      status: 'draft',
      showInMenu: true,
      showTitle: true,
      displayOrder: 0,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setEditingPage(null);
    setShowForm(false);
    setShowSEO(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'private': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Page Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage static pages (About, Contact, etc.)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          New Page
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={2}>
          {pages.map((page) => (
            <Grid item xs={12} key={page._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <PageIcon color="action" />
                        <Typography variant="h6" fontWeight="600">{page.title}</Typography>
                        <Chip
                          label={page.status}
                          color={getStatusColor(page.status)}
                          size="small"
                        />
                        {page.settings.showInMenu && (
                          <Chip label="In Menu" color="primary" size="small" variant="outlined" />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Slug:</strong> <code>/{page.slug}</code>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Template:</strong> {page.template}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption">
                          <VisibilityIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          {page.analytics.views} views
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          By {page.author.name} • {new Date(page.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
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
          {editingPage ? 'Edit Page' : 'Create New Page'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug (optional)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="Auto-generated from title if empty"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={formData.template}
                  label="Template"
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="full-width">Full Width</MenuItem>
                  <MenuItem value="landing">Landing Page</MenuItem>
                  <MenuItem value="contact">Contact Page</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                inputProps={{ maxLength: 300 }}
                helperText={`${formData.excerpt.length}/300 characters`}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                placeholder="Write your page content here..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showInMenu}
                    onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
                  />
                }
                label="Show in Menu"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showTitle}
                    onChange={(e) => setFormData({ ...formData, showTitle: e.target.checked })}
                  />
                }
                label="Show Title"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Button
                startIcon={showSEO ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowSEO(!showSEO)}
                sx={{ mt: 1 }}
              >
                SEO Settings
              </Button>
              <Collapse in={showSEO}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SEO Title"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SEO Description"
                      multiline
                      rows={2}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SEO Keywords"
                      value={formData.seoKeywords}
                      onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingPage ? 'Update' : 'Create'} Page
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
