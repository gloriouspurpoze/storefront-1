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
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  HelpOutline as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ActiveIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function FAQManagement() {
  const theme = useTheme();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchFAQs();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const data = await CMSService.getFAQs(params);
      setFaqs(data.faqs || []);
    } catch (error: any) {
      console.error('Error fetching FAQs:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to load FAQs'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await CMSService.getFAQCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const payload = {
        ...formData,
        order: Number(formData.order),
      };

      if (editingFAQ) {
        await CMSService.updateFAQ(editingFAQ._id, payload);
      } else {
        await CMSService.createFAQ(payload);
      }

      fetchFAQs();
      fetchCategories();
      handleCloseForm();
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to save FAQ'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await CMSService.deleteFAQ(id);
      fetchFAQs();
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to delete FAQ'));
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive,
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: 0,
      isActive: true,
    });
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      await CMSService.updateFAQ(faq._id, {
        isActive: !faq.isActive,
      });
      fetchFAQs();
    } catch (error: any) {
      console.error('Error updating FAQ:', error);
      alert('Error: ' + (error.response?.data?.error || 'Failed to update FAQ'));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="FAQ Management"
        subtitle="Manage frequently asked questions"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2 }}
          >
            Add FAQ
          </Button>
        }
      />

      {/* Filters and Search */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Select
                fullWidth
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <HelpIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <HelpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No FAQs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first FAQ to help customers'}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Add FAQ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {faqs.map((faq, index) => (
            <Accordion
              key={faq._id}
              expanded={expandedFAQ === faq._id}
              onChange={() => setExpandedFAQ(expandedFAQ === faq._id ? null : faq._id)}
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: theme.shadows[2],
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
                '&.Mui-expanded': {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    my: 2,
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Box
                    sx={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {faq.question}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={faq.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                      <Chip
                        label={faq.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={faq.isActive ? 'success' : 'default'}
                        icon={faq.isActive ? <ActiveIcon /> : undefined}
                        sx={{ fontWeight: 600 }}
                      />
                      {faq.views > 0 && (
                        <Tooltip title="Total views">
                          <Chip
                            icon={<TrendingUpIcon />}
                            label={`${faq.views} views`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ ml: 2 }}
                  >
                    <Tooltip title={faq.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        color={faq.isActive ? 'success' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(faq);
                        }}
                        sx={{
                          bgcolor: alpha(
                            faq.isActive ? theme.palette.success.main : theme.palette.grey[500],
                            0.1
                          ),
                          '&:hover': {
                            bgcolor: alpha(
                              faq.isActive ? theme.palette.success.main : theme.palette.grey[500],
                              0.2
                            ),
                          },
                        }}
                      >
                        <ActiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(faq);
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(faq._id);
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {faq.answer}
                </Typography>
                {(faq.helpfulCount > 0 || faq.notHelpfulCount > 0) && (
                  <Box
                    mt={2}
                    p={2}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Tooltip title="Helpful">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ThumbUpIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {faq.helpfulCount}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Not Helpful">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ThumbDownIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {faq.notHelpfulCount}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Form Dialog */}
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
            {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              fullWidth
              placeholder="What would you like to know?"
            />
            <TextField
              label="Answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              multiline
              rows={6}
              required
              fullWidth
              placeholder="Provide a detailed answer..."
            />
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              fullWidth
              placeholder="e.g., Booking, Payment, Services"
              helperText="Use existing categories or create a new one"
            />
            <TextField
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active (visible to customers)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingFAQ ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
