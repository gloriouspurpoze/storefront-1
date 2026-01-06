import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Language as WebIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  contentType: 'banner' | 'testimonial' | 'faq' | 'blog' | 'page' | 'homepage' | 'promotion';
  data: any;
}

/**
 * Unified Preview Modal Component
 * Shows how CMS content will appear on the customer website
 * 
 * @param contentType - Type of content to preview
 * @param data - Content data to display
 * 
 * Design Decision: Modal/Dialog vs Separate Page
 * - ✅ Modal chosen for better UX
 * - Admin stays in context
 * - Quick preview without navigation
 * - Can compare multiple items quickly
 * - Industry standard (WordPress, Shopify, etc.)
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  contentType,
  data,
}) => {
  const [fullscreen, setFullscreen] = React.useState(false);

  if (!data) return null;

  const renderPreviewContent = () => {
    switch (contentType) {
      case 'banner':
        return (
          <Box>
            {/* Desktop View */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Desktop View (1920x600px)
            </Typography>
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardMedia
                component="img"
                height="300"
                image={data.imageUrl || 'https://via.placeholder.com/1920x600?text=Banner+Preview'}
                alt={data.title}
                sx={{ objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  width: '80%',
                }}
              >
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  {data.title}
                </Typography>
                {data.subtitle && (
                  <Typography variant="h6" gutterBottom>
                    {data.subtitle}
                  </Typography>
                )}
                {data.ctaText && (
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ mt: 2, px: 4, py: 1.5 }}
                  >
                    {data.ctaText}
                  </Button>
                )}
              </Box>
            </Card>

            {/* Mobile View */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mobile View (375x667px)
            </Typography>
            <Box sx={{ maxWidth: 375, mx: 'auto', boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
              <CardMedia
                component="img"
                height="200"
                image={data.imageUrl || 'https://via.placeholder.com/375x667?text=Mobile+Banner'}
                alt={data.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {data.title}
                </Typography>
                {data.subtitle && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {data.subtitle}
                  </Typography>
                )}
                {data.ctaText && (
                  <Button variant="contained" size="small" sx={{ mt: 1 }}>
                    {data.ctaText}
                  </Button>
                )}
              </CardContent>
            </Box>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Location:</strong> {data.location || 'Homepage Hero'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Active Period:</strong> {data.startDate ? format(new Date(data.startDate), 'MMM dd, yyyy') : 'N/A'} - {data.endDate ? format(new Date(data.endDate), 'MMM dd, yyyy') : 'N/A'}
              </Typography>
              {data.ctaUrl && (
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>CTA Link:</strong> {data.ctaUrl}
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'testimonial':
        return (
          <Box>
            {/* Card Style Preview */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Card Style (Common on Homepage)
            </Typography>
            <Card sx={{ mb: 3, p: 3, boxShadow: 3 }}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={data.customerAvatar}
                    sx={{ width: 60, height: 60 }}
                  >
                    {data.customerName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {data.customerName}
                    </Typography>
                    {data.customerTitle && (
                      <Typography variant="body2" color="text.secondary">
                        {data.customerTitle}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Rating value={data.rating || 5} readOnly precision={0.5} size="large" />
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  "{data.comment}"
                </Typography>
                {data.service && (
                  <Chip label={data.service} size="small" color="primary" variant="outlined" />
                )}
              </Stack>
            </Card>

            {/* Slider Style Preview */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Slider/Carousel Style
            </Typography>
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <StarIcon sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontStyle: 'italic' }}>
                "{data.comment}"
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={2} mt={3}>
                <Avatar src={data.customerAvatar} sx={{ width: 50, height: 50 }}>
                  {data.customerName?.charAt(0)}
                </Avatar>
                <Box textAlign="left">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {data.customerName}
                  </Typography>
                  {data.customerTitle && (
                    <Typography variant="caption">
                      {data.customerTitle}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Rating value={data.rating || 5} readOnly precision={0.5} sx={{ mt: 2 }} />
            </Paper>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Status:</strong> {data.isApproved ? '✅ Approved (Will show on website)' : '⏳ Pending Approval'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Featured:</strong> {data.isFeatured ? '🌟 Yes (Priority display)' : 'No'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Display Order:</strong> {data.displayOrder || 0}
              </Typography>
            </Paper>
          </Box>
        );

      case 'faq':
        return (
          <Box>
            {/* Accordion Style (Most Common) */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Accordion Style (Default on FAQ Page)
            </Typography>
            <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Chip label={data.category} size="small" color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {data.question}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                  {data.answer}
                </Typography>
                {(data.views > 0 || data.helpfulCount > 0) && (
                  <Box mt={2} pt={2} borderTop="1px solid #eee">
                    <Typography variant="caption" color="text.secondary">
                      👁️ {data.views || 0} views • 👍 {data.helpfulCount || 0} found helpful
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Card Style Alternative */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
              Card Style (Alternative Layout)
            </Typography>
            <Card sx={{ p: 3, boxShadow: 2 }}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={data.category} size="small" color="primary" />
                  {data.isActive && (
                    <Chip label="Active" size="small" color="success" />
                  )}
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  Q: {data.question}
                </Typography>
                <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                  A: {data.answer}
                </Typography>
              </Stack>
            </Card>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Category:</strong> {data.category}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Status:</strong> {data.isActive ? '✅ Active (Visible to customers)' : '❌ Inactive (Hidden)'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Display Order:</strong> {data.order || 0}
              </Typography>
            </Paper>
          </Box>
        );

      case 'blog':
        return (
          <Box>
            {/* Blog Post Preview */}
            <Card sx={{ boxShadow: 3 }}>
              {data.featuredImage && (
                <CardMedia
                  component="img"
                  height="400"
                  image={data.featuredImage}
                  alt={data.title}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={2}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {data.category && (
                      <Chip label={data.category} size="small" color="primary" />
                    )}
                    {data.tags?.map((tag: string, index: number) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {data.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} color="text.secondary">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="caption">{data.author || 'Admin'}</Typography>
                    </Box>
                    {data.publishedAt && (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarIcon fontSize="small" />
                        <Typography variant="caption">
                          {format(new Date(data.publishedAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  {data.excerpt && (
                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {data.excerpt}
                    </Typography>
                  )}
                  <Divider />
                  <Typography variant="body1" whiteSpace="pre-wrap" lineHeight={1.8}>
                    {data.content || 'Content will appear here...'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Status:</strong> {data.status === 'published' ? '✅ Published' : `📝 ${data.status}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Slug/URL:</strong> /blog/{data.slug}
              </Typography>
              {data.isFeatured && (
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Featured:</strong> 🌟 Yes (Will show on homepage)
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'page':
        return (
          <Box>
            {/* Page Preview */}
            <Paper sx={{ p: 4, boxShadow: 3, minHeight: 400 }}>
              {data.showTitle !== false && (
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  {data.title}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" whiteSpace="pre-wrap" lineHeight={1.8}>
                {data.content || 'Page content will appear here...'}
              </Typography>
            </Paper>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Template:</strong> {data.template || 'default'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Status:</strong> {data.status}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>URL:</strong> /{data.slug}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Show in Menu:</strong> {data.showInMenu ? 'Yes' : 'No'}
              </Typography>
              {data.seoTitle && (
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>SEO Title:</strong> {data.seoTitle}
                </Typography>
              )}
            </Paper>
          </Box>
        );

      case 'promotion':
        return (
          <Box>
            {/* Promotion Banner Preview */}
            <Card sx={{ boxShadow: 3, bgcolor: 'success.light', color: 'success.contrastText', p: 3, mb: 3 }}>
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Typography variant="h4" fontWeight="bold">
                  {data.title}
                </Typography>
                <Typography variant="h2" fontWeight="bold" color="warning.main">
                  {data.discountType === 'percentage' ? `${data.discountValue}% OFF` : `$${data.discountValue} OFF`}
                </Typography>
                <Typography variant="body1">
                  {data.description}
                </Typography>
                <Chip
                  label={`Code: ${data.code}`}
                  size="medium"
                  sx={{ fontSize: '1.2rem', px: 3, py: 2 }}
                />
                {data.validUntil && (
                  <Typography variant="caption">
                    Valid until {format(new Date(data.validUntil), 'MMM dd, yyyy')}
                  </Typography>
                )}
              </Stack>
            </Card>

            {/* Meta Info */}
            <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Promotion Code:</strong> {data.code}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Discount:</strong> {data.discountType === 'percentage' ? `${data.discountValue}%` : `$${data.discountValue}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Usage Limit:</strong> {data.maxUses || 'Unlimited'} | <strong>Used:</strong> {data.usageCount || 0} times
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              Preview not available for this content type
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={fullscreen ? false : 'md'}
      fullScreen={fullscreen}
      fullWidth
      PaperProps={{
        sx: {
          height: fullscreen ? '100vh' : '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WebIcon />
          <Typography variant="h6">
            Customer Website Preview
          </Typography>
          <Chip label={contentType.toUpperCase()} size="small" color="primary" />
        </Box>
        <Box>
          <IconButton onClick={() => setFullscreen(!fullscreen)} size="small">
            <FullscreenIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3, overflow: 'auto' }}>
        {renderPreviewContent()}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" flexGrow={1}>
          This is how it will look on the customer website
        </Typography>
        <Button onClick={onClose} variant="contained">
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

