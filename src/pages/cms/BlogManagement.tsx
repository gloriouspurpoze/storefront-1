import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { useToast } from '../../components/ui'
import { BlogService } from '../../services/api/blog.service'
import type { BlogPost } from '../../types/cms.types'

export default function BlogManagement() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const { posts: list } = await BlogService.getPosts()
      setPosts(list ?? [])
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        'Failed to load posts'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await BlogService.deletePost(deleteTarget._id)
      toast({ title: 'Success', description: 'Blog post deleted' })
      setDeleteTarget(null)
      await fetchPosts()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err as Error)?.message ??
        'Failed to delete'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'default'
      case 'scheduled':
        return 'info'
      case 'archived':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Blog Management"
        subtitle="Create and manage blog posts — editor includes SEO and readability analysis"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/cms/blogs/new')}
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/cms/blogs/new')}>
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
                            onClick={() => navigate(`/cms/blogs/${post._id}/edit`)}
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
            This will permanently delete &quot;{deleteTarget?.title}&quot;. This action cannot be undone.
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
  )
}
