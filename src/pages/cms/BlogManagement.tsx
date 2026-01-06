import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Divider,
  Collapse,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { ImageUploadField, type ImageFile } from '../../components/forms';
import { PageHeader } from '../../components/common/PageHeader';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: { name: string };
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  isFeatured: boolean;
  publishedAt?: string;
  viewCount: number;
  readTime: number;
  author: { name: string };
  createdAt: string;
  featuredImage?: string;
}

export default function BlogManagement() {
  const theme = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showSEO, setShowSEO] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    status: 'draft',
    isFeatured: false,
    allowComments: true,
    featuredImages: [] as ImageFile[],
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoOgImages: [] as ImageFile[],
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/cms/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.data.posts || []);
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
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: formData.status,
        featuredImage: formData.featuredImages[0]?.url || undefined,
        isFeatured: formData.isFeatured,
        allowComments: formData.allowComments,
        seo: {
          title: formData.seoTitle || formData.title,
          description: formData.seoDescription || formData.excerpt,
          keywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
          ogImage: formData.seoOgImages[0]?.url || undefined,
        },
      };

      if (editingPost) {
        await axios.put(`${API_BASE}/cms/admin/blogs/${editingPost._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/cms/admin/blogs`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchPosts();
      handleCloseForm();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (error) {
      alert('Error deleting post');
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: '',
      category: '',
      tags: post.tags.join(', '),
      status: post.status,
      isFeatured: post.isFeatured,
      allowComments: true,
      featuredImages: post.featuredImage ? [{
        id: '1',
        url: post.featuredImage,
        alt: post.title,
        isPrimary: true,
        order: 0
      }] : [],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      seoOgImages: [],
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      tags: '',
      status: 'draft',
      isFeatured: false,
      allowComments: true,
      featuredImages: [],
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      seoOgImages: [],
    });
    setEditingPost(null);
    setShowForm(false);
    setShowSEO(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'scheduled': return 'info';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Blog Management"
        subtitle="Create and manage blog posts for content marketing"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2 }}
          >
            New Post
          </Button>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No blog posts found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first blog post to get started
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} key={post._id}>
              <Card
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Grid container spacing={3} alignItems="center">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <Grid item xs={12} sm={3}>
                        <CardMedia
                          component="img"
                          sx={{
                            width: '100%',
                            height: 150,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          }}
                          image={post.featuredImage}
                          alt={post.title}
                        />
                      </Grid>
                    )}

                    {/* Post Details */}
                    <Grid item xs={12} sm={post.featuredImage ? 7 : 10}>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <ArticleIcon sx={{ color: theme.palette.primary.main }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {post.title}
                          </Typography>
                          <Chip
                            label={post.status}
                            color={getStatusColor(post.status)}
                            size="small"
                            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                          />
                          {post.isFeatured && (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Featured"
                              color="warning"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {post.excerpt}
                        </Typography>

                        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Tooltip title="Category">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.category?.name || 'Uncategorized'}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Views">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.viewCount} views
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Read Time">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.readTime} min read
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Author">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.author.name}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>

                        {post.tags.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                            {post.tags.map((tag, idx) => (
                              <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  fontWeight: 500,
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Stack>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} sm={post.featuredImage ? 2 : 2}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(post)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(post._id)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
          </Typography>
        </DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <DialogContent dividers sx={{ pt: 2 }}>
            <Grid container spacing={3}>
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
                    <MenuItem value="scheduled">Scheduled</MenuItem>
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
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  placeholder="Write your blog content here..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category ID"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  helperText="Enter MongoDB ObjectId of category"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="seo, marketing, tutorial"
                  helperText="Comma-separated tags"
                />
              </Grid>

              <Grid item xs={12}>
                <ImageUploadField
                  label="Featured Image"
                  value={formData.featuredImages}
                  onChange={(images) => setFormData({ ...formData, featuredImages: images })}
                  maxFiles={1}
                  maxSize={5}
                  helperText="Upload featured image for blog post (Recommended: 1200x630px, Max 5MB)"
                  showPreview
                  allowPrimary={false}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                  }
                  label="Featured Post"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.allowComments}
                      onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                    />
                  }
                  label="Allow Comments"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Button
                  startIcon={showSEO ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowSEO(!showSEO)}
                  sx={{ mb: 2 }}
                >
                  SEO Settings
                </Button>
                <Collapse in={showSEO}>
                  <Grid container spacing={2}>
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
                    <Grid item xs={12}>
                      <ImageUploadField
                        label="Open Graph Image"
                        value={formData.seoOgImages}
                        onChange={(images) => setFormData({ ...formData, seoOgImages: images })}
                        maxFiles={1}
                        maxSize={3}
                        helperText="Upload OG image for social media sharing (Recommended: 1200x630px, Max 3MB)"
                        showPreview
                        allowPrimary={false}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingPost ? 'Update' : 'Create'} Post
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
