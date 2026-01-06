import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Image as ImageIcon,
  LocalOffer as TagIcon,
  Star as StarIcon,
  HelpOutline as HelpIcon,
  Search as SearchIcon,
  Article as ArticleIcon,
  Folder as MediaIcon,
  Description as PageIcon,
  Menu as MenuIcon,
  Visibility as EyeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';

interface CMSStats {
  totalPages?: number;
  totalBlogs?: number;
  totalMedia?: number;
  totalTestimonials?: number;
  totalFAQs?: number;
  recentActivity?: number;
}

interface Module {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  color: string;
  stat: number | null;
}

export default function CMSDashboard() {
  const theme = useTheme();
  const [stats, setStats] = useState<CMSStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [pages, blogs, testimonials, faqs] = await Promise.allSettled([
        CMSService.getPages({ limit: 1 }),
        CMSService.getBlogPosts({ limit: 1 }),
        CMSService.getTestimonials({ limit: 1 }),
        CMSService.getFAQs({ limit: 1 }),
      ]);

      setStats({
        totalPages: pages.status === 'fulfilled' ? pages.value.pagination?.total || 0 : 0,
        totalBlogs: blogs.status === 'fulfilled' ? blogs.value.pagination?.total || 0 : 0,
        totalTestimonials: testimonials.status === 'fulfilled' ? testimonials.value.pagination?.total || 0 : 0,
        totalFAQs: faqs.status === 'fulfilled' ? faqs.value.pagination?.total || 0 : 0,
      });
    } catch (error) {
      console.error('Error loading CMS stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules: Module[] = [
    {
      title: 'Homepage Management',
      description: 'Manage hero sections, featured content, and homepage layout',
      icon: HomeIcon,
      link: '/cms/homepage',
      color: theme.palette.primary.main,
      stat: null,
    },
    {
      title: 'Banner Management',
      description: 'Create and schedule promotional banners',
      icon: ImageIcon,
      link: '/cms/banners',
      color: theme.palette.secondary.main,
      stat: null,
    },
    {
      title: 'Promotions & Offers',
      description: 'Manage discount codes and promotional campaigns',
      link: '/cms/promotions',
      icon: TagIcon,
      color: theme.palette.success.main,
      stat: null,
    },
    {
      title: 'Testimonials',
      description: 'Manage customer reviews and testimonials',
      icon: StarIcon,
      link: '/cms/testimonials',
      color: theme.palette.warning.main,
      stat: stats.totalTestimonials || null,
    },
    {
      title: 'FAQs',
      description: 'Manage frequently asked questions',
      icon: HelpIcon,
      link: '/cms/faqs',
      color: theme.palette.info.main,
      stat: stats.totalFAQs || null,
    },
    {
      title: 'SEO Management',
      description: 'Manage meta tags and SEO settings',
      icon: SearchIcon,
      link: '/cms/seo',
      color: theme.palette.error.main,
      stat: null,
    },
    {
      title: 'Blog Management',
      description: 'Create and manage blog posts',
      icon: ArticleIcon,
      link: '/cms/blogs',
      color: '#00BCD4',
      stat: stats.totalBlogs || null,
    },
    {
      title: 'Media Library',
      description: 'Manage images, videos, and files',
      icon: MediaIcon,
      link: '/cms/media',
      color: '#009688',
      stat: null,
    },
    {
      title: 'Pages',
      description: 'Create and manage static pages',
      icon: PageIcon,
      link: '/cms/pages',
      color: '#FF9800',
      stat: stats.totalPages || null,
    },
    {
      title: 'Menus',
      description: 'Manage navigation menus',
      icon: MenuIcon,
      link: '/cms/menus',
      color: '#8BC34A',
      stat: null,
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Content Management System"
        subtitle="Manage your website content, promotions, and SEO"
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Total Pages
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {stats.totalPages || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <PageIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${alpha('#00BCD4', 0.1)} 0%, ${alpha('#00BCD4', 0.05)} 100%)`,
              border: `1px solid ${alpha('#00BCD4', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Blog Posts
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#00BCD4' }}>
                    {stats.totalBlogs || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha('#00BCD4', 0.1),
                    color: '#00BCD4',
                  }}
                >
                  <ArticleIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Testimonials
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {stats.totalTestimonials || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <StarIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    FAQs
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                    {stats.totalFAQs || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <HelpIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modules Grid */}
      <Grid container spacing={3}>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={module.link}>
              <Card
                component={Link}
                to={module.link}
                sx={{
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: `1px solid ${alpha(module.color, 0.2)}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                    borderColor: module.color,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(module.color, 0.1),
                        color: module.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: 32 }} />
                    </Box>
                    {module.stat !== null && (
                      <Chip
                        label={module.stat}
                        size="small"
                        sx={{
                          bgcolor: alpha(module.color, 0.1),
                          color: module.color,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {module.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
