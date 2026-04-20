import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Link as LinkIcon } from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories';
import { appToast } from '../../lib/appToast';

export default function CrossLinkingManagement() {
  const theme = useTheme();
  const [data, setData] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ac');
  const [newProblem, setNewProblem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await CMSService.getCrossLinking();
      setData(typeof result === 'object' && result !== null ? result : {});
    } catch (error: any) {
      console.error('Error fetching cross-linking:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to load';
      appToast('Error: ' + msg, 'error');
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const problems = data[selectedCategory] ?? [];

  const handleSave = async () => {
    try {
      setSaving(true);
      await CMSService.updateCrossLinking(data);
      appToast('Cross-linking saved.', 'success');
      fetchData();
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const addProblem = () => {
    const text = newProblem.trim();
    if (!text) return;
    const next = [...problems, text];
    setData((prev) => ({ ...prev, [selectedCategory]: next }));
    setNewProblem('');
  };

  const removeProblem = (index: number) => {
    const next = problems.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [selectedCategory]: next }));
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Cross-Linking (Common Problems)"
        subtitle="Common problems per category for SEO and catalog cross-linking block"
        action={
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <LinkIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        }
      />

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {CMS_CATALOG_CATEGORIES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Common problems we fix — “{CMS_CATALOG_CATEGORIES.find((c) => c.value === selectedCategory)?.label ?? selectedCategory}”
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="New problem"
                value={newProblem}
                onChange={(e) => setNewProblem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProblem())}
                placeholder="e.g. AC Not Cooling properly"
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={addProblem} disabled={!newProblem.trim()}>
                Add
              </Button>
            </Stack>
            <List dense sx={{ bgcolor: alpha(theme.palette.background.paper, 0.5), borderRadius: 2 }}>
              {problems.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No problems added. Add items to show in catalog cross-linking block." primaryTypographyProps={{ color: 'text.secondary' }} />
                </ListItem>
              ) : (
                problems.map((text, index) => (
                  <ListItem key={index} divider={index < problems.length - 1}>
                    <ListItemText primary={text} />
                    <ListItemSecondaryAction>
                      <IconButton size="small" color="error" onClick={() => removeProblem(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
            <Button variant="outlined" startIcon={saving ? <CircularProgress size={18} /> : <LinkIcon />} onClick={handleSave} disabled={saving} sx={{ mt: 2 }}>
              Save
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
