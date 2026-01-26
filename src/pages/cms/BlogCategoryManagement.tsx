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
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  ArrowBack as ArrowBackIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  postCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function BlogCategoryManagement() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/blog-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.data.categories);
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
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await axios.put(`${API_BASE}/cms/admin/blog-categories/${editingCategory._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/cms/admin/blog-categories`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchCategories();
      handleCloseForm();
      alert('Category saved successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/blog-categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      alert('Error deleting category');
    }
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Button
              component={Link}
              to="/cms/blogs"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              size="small"
            >
              Back to Posts
            </Button>
          </Stack>
          <Typography variant="h4" fontWeight="bold">Blog Categories</Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your blog posts into categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          New Category
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell align="center">Posts</TableCell>
                <TableCell align="center">Order</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CategoryIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {category.name}
                        </Typography>
                        {category.description && (
                          <Typography variant="caption" color="text.secondary">
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {category.slug}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<ArticleIcon />}
                      label={category.postCount}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={category.displayOrder} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleEdit(category)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(category._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug (optional)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="Auto-generated from name if empty"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
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
            {editingCategory ? 'Update' : 'Create'} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
