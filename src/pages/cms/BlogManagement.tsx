import React, { useState, useEffect, useCallback } from 'react';
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
import Grid from '@mui/material/GridLegacy';
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
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ImageUploadField, RichTextField, type ImageFile } from '../../components/forms';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../components/ui';
import { BlogService } from '../../services/api/blog.service';
import type { BlogPost, BlogCategory, BlogPostStatus } from '../../types/cms.types';

const EXCERPT_MAX_LENGTH = 300;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';
}

const initialFormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  status: 'draft' as BlogPostStatus,
  isFeatured: false,
  allowComments: true,
  featuredImages: [] as ImageFile[],
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  seoOgImages: [] as ImageFile[],
  scheduledPublishAt: null as Date | null,
};

export default function BlogManagement() {
  const theme = useTheme();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSEO, setShowSEO] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'casual' | 'informative'>('informative');
  const [aiLength, setAiLength] = useState<'short' | 'medium' | 'long'>('medium');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { posts: list } = await BlogService.getPosts();
      setPosts(list ?? []);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load posts';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const list = await BlogService.getCategories();
      setCategories(list ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || slugify(title),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Validation', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: 'Validation', description: 'Content is required', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug?.trim() || slugify(formData.title),
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        category: formData.category || undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: formData.status,
        isFeatured: formData.isFeatured,
        allowComments: formData.allowComments,
        featuredImage: formData.featuredImages[0]?.url || undefined,
        scheduledPublishAt:
          formData.status === 'scheduled' && formData.scheduledPublishAt
            ? formData.scheduledPublishAt.toISOString()
            : undefined,
        seo: {
          title: formData.seoTitle || formData.title,
          description: formData.seoDescription || formData.excerpt,
          keywords: formData.seoKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          ogImage: formData.seoOgImages[0]?.url || undefined,
        },
      };

      if (editingPost) {
        await BlogService.updatePost(editingPost._id, payload);
        toast({ title: 'Success', description: 'Blog post updated successfully' });
      } else {
        await BlogService.createPost(payload);
        toast({ title: 'Success', description: 'Blog post created successfully' });
      }
      await fetchPosts();
      handleCloseForm();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to save post';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await BlogService.deletePost(deleteTarget._id);
      toast({ title: 'Success', description: 'Blog post deleted' });
      setDeleteTarget(null);
      await fetchPosts();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to delete';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleEdit = async (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      ...initialFormState,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags?.join(', ') ?? '',
      status: post.status,
      isFeatured: post.isFeatured ?? false,
      allowComments: post.allowComments ?? true,
      featuredImages: post.featuredImage
        ? [
            {
              id: '1',
              url: post.featuredImage,
              alt: post.title,
              isPrimary: true,
              order: 0,
            },
          ]
        : [],
      seoTitle: post.seo?.title ?? '',
      seoDescription: post.seo?.description ?? '',
      seoKeywords: (post.seo?.keywords ?? []).join(', '),
      seoOgImages: post.seo?.ogImage
        ? [{ id: '1', url: post.seo.ogImage, alt: 'OG', isPrimary: true, order: 0 }]
        : [],
      scheduledPublishAt: post.scheduledPublishAt ? new Date(post.scheduledPublishAt) : null,
    });
    setShowForm(true);
    setLoadingPost(true);
    try {
      const full = await BlogService.getPostById(post._id);
      setFormData((prev) => ({
        ...prev,
        content: full.content ?? prev.content,
        category: typeof full.category === 'object' && full.category?._id ? full.category._id : (full as any).category ?? prev.category,
      }));
    } catch {
      setFormData((prev) => ({ ...prev, content: (post as any).content ?? '' }));
    } finally {
      setLoadingPost(false);
    }
  };

  const handleCloseForm = () => {
    setFormData(initialFormState);
    setEditingPost(null);
    setShowForm(false);
    setShowSEO(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'scheduled':
        return 'info';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleOpenAIDialog = () => {
    setAiTopic(formData.title || '');
    setShowAIDialog(true);
  };

  const handleAIGenerate = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      toast({ title: 'Topic required', description: 'Enter a topic or title to generate content.', variant: 'destructive' });
      return;
    }
    setAiGenerating(true);
    try {
      const result = await BlogService.generateWithAI({ topic, tone: aiTone, length: aiLength });
      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        slug: result.title ? slugify(result.title) : prev.slug,
        excerpt: result.excerpt.slice(0, EXCERPT_MAX_LENGTH),
        content: result.content,
        tags: result.suggestedTags.join(', '),
        seoTitle: result.title || prev.seoTitle,
        seoDescription: result.excerpt.slice(0, EXCERPT_MAX_LENGTH) || prev.seoDescription,
      }));
      setShowAIDialog(false);
      setAiTopic('');
      toast({ title: 'Content generated', description: 'Review and edit the draft as needed.' });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'AI generation failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setAiGenerating(false);
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
            onClick={() => {
              setFormData(initialFormState);
              setEditingPost(null);
              setShowForm(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            New Post
          </Button>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
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
                          {post.excerpt || 'No excerpt'}
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Tooltip title="Category">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.category && typeof post.category === 'object'
                                  ? (post.category as { name?: string }).name
                                  : 'Uncategorized'}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Views">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.viewCount ?? 0} views
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Read time">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.readTime ?? 0} min read
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Tooltip title="Author">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {post.author?.name ?? '—'}
                              </Typography>
                            </Box>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                        {Array.isArray(post.tags) && post.tags.length > 0 && (
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
                    <Grid item xs={12} sm={post.featuredImage ? 2 : 2}>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                      >
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(post)}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => setDeleteTarget(post)}
                            sx={{
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
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
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
          </Typography>
        </DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogContent dividers sx={{ pt: 2 }}>
            {loadingPost ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    placeholder="Enter post title"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as BlogPostStatus })
                      }
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
                    helperText="Auto-generated from title if empty. Used in URL."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Excerpt"
                    multiline
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value.slice(0, EXCERPT_MAX_LENGTH) })
                    }
                    inputProps={{ maxLength: EXCERPT_MAX_LENGTH }}
                    helperText={`${formData.excerpt.length}/${EXCERPT_MAX_LENGTH} characters`}
                    placeholder="Short summary for listings and SEO"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                      Content
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={aiGenerating ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                      onClick={handleOpenAIDialog}
                      disabled={aiGenerating}
                      sx={{ borderRadius: 2 }}
                    >
                      Generate with AI
                    </Button>
                  </Box>
                  <RichTextField
                    label=""
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    required
                    height={280}
                    placeholder="Write your blog content with rich formatting..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      displayEmpty
                    >
                      <MenuItem value="">Uncategorized</MenuItem>
                      {categories
                        .filter((c) => c.isActive !== false)
                        .map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {c.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
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

                {formData.status === 'scheduled' && (
                  <Grid item xs={12}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="Publish at"
                        value={formData.scheduledPublishAt}
                        onChange={(date) =>
                          setFormData({ ...formData, scheduledPublishAt: date ?? null })
                        }
                        minDateTime={new Date()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            helperText: 'Schedule when this post should go live',
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <ImageUploadField
                    label="Featured Image"
                    value={formData.featuredImages}
                    onChange={(images) => setFormData({ ...formData, featuredImages: images })}
                    maxFiles={1}
                    maxSize={5}
                    helperText="Recommended: 1200×630px, max 5MB"
                    showPreview
                    allowPrimary={false}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isFeatured}
                        onChange={(e) =>
                          setFormData({ ...formData, isFeatured: e.target.checked })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, allowComments: e.target.checked })
                        }
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
                          onChange={(e) =>
                            setFormData({ ...formData, seoDescription: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="SEO Keywords"
                          value={formData.seoKeywords}
                          onChange={(e) =>
                            setFormData({ ...formData, seoKeywords: e.target.value })
                          }
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ImageUploadField
                          label="Open Graph Image"
                          value={formData.seoOgImages}
                          onChange={(images) =>
                            setFormData({ ...formData, seoOgImages: images })
                          }
                          maxFiles={1}
                          maxSize={3}
                          helperText="1200×630px for social sharing, max 3MB"
                          showPreview
                          allowPrimary={false}
                        />
                      </Grid>
                    </Grid>
                  </Collapse>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseForm} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? (
                <CircularProgress size={24} />
              ) : editingPost ? (
                'Update Post'
              ) : (
                'Create Post'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* AI Generate dialog */}
      <Dialog
        open={showAIDialog}
        onClose={() => !aiGenerating && setShowAIDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          Generate blog with AI
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Topic or title"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. How to fix a leaky faucet, AC maintenance tips"
              required
              disabled={aiGenerating}
            />
            <FormControl fullWidth disabled={aiGenerating}>
              <InputLabel>Tone</InputLabel>
              <Select
                value={aiTone}
                label="Tone"
                onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
              >
                <MenuItem value="informative">Informative</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={aiGenerating}>
              <InputLabel>Length</InputLabel>
              <Select
                value={aiLength}
                label="Length"
                onChange={(e) => setAiLength(e.target.value as typeof aiLength)}
              >
                <MenuItem value="short">Short (2–3 paragraphs)</MenuItem>
                <MenuItem value="medium">Medium (4–6 paragraphs)</MenuItem>
                <MenuItem value="long">Long (6–10 paragraphs)</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              AI will generate title, excerpt, content (HTML), and suggested tags. You can edit everything before saving.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAIDialog(false)} disabled={aiGenerating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAIGenerate}
            disabled={aiGenerating || !aiTopic.trim()}
            startIcon={aiGenerating ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
          >
            {aiGenerating ? 'Generating…' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Delete blog post?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete &quot;{deleteTarget?.title}&quot;. This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
