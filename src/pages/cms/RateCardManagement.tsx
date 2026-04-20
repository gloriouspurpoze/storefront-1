import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, AttachMoney as RateIcon } from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories';
import { appToast } from '../../lib/appToast';
import { useAppConfirm } from '../../components/providers/AppDialogsProvider';

interface RateCardPart {
  name: string;
  price: string;
}

export default function RateCardManagement() {
  const theme = useTheme();
  const confirm = useAppConfirm();
  const [data, setData] = useState<Record<string, RateCardPart[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ac');
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formPart, setFormPart] = useState<RateCardPart>({ name: '', price: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await CMSService.getRateCards();
      setData(typeof result === 'object' && result !== null ? result : {});
    } catch (error: any) {
      console.error('Error fetching rate cards:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to load rate cards';
      appToast('Error: ' + msg, 'error');
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const parts = data[selectedCategory] ?? [];

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await CMSService.updateRateCards(data);
      appToast('Rate cards saved successfully.', 'success');
      fetchData();
    } catch (error: any) {
      console.error('Error saving rate cards:', error);
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPart = () => {
    if (!formPart.name.trim()) {
      appToast('Part name is required.', 'warning');
      return;
    }
    const next = [...parts, { name: formPart.name.trim(), price: formPart.price.trim() || 'As per rate card' }];
    setData((prev) => ({ ...prev, [selectedCategory]: next }));
    setFormPart({ name: '', price: '' });
    setShowForm(false);
  };

  const handleEditPart = (index: number) => {
    setEditingIndex(index);
    setFormPart(parts[index]);
    setShowForm(true);
  };

  const handleUpdatePart = () => {
    if (editingIndex === null || !formPart.name.trim()) return;
    const next = [...parts];
    next[editingIndex] = { name: formPart.name.trim(), price: formPart.price.trim() || 'As per rate card' };
    setData((prev) => ({ ...prev, [selectedCategory]: next }));
    setFormPart({ name: '', price: '' });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleDeletePart = async (index: number) => {
    const ok = await confirm({
      title: 'Remove line?',
      message: 'Remove this rate card line?',
      danger: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const next = parts.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, [selectedCategory]: next.length ? next : [] }));
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingIndex(null);
    setFormPart({ name: '', price: '' });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Rate Card (Pricing Parts)"
        subtitle="Category-wise spare parts & pricing for catalog PricingTable"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingIndex(null);
              setFormPart({ name: '', price: '' });
              setShowForm(true);
            }}
            sx={{ borderRadius: 2 }}
          >
            Add line
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
            <Button
              variant="outlined"
              onClick={handleSaveAll}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} /> : <RateIcon />}
            >
              {saving ? 'Saving…' : 'Save all'}
            </Button>
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Parts for “{CMS_CATALOG_CATEGORIES.find((c) => c.value === selectedCategory)?.label ?? selectedCategory}”
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Part / Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        No lines. Add one to show in catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleEditPart(index)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeletePart(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle>{editingIndex !== null ? 'Edit line' : 'Add line'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Part / Service name"
              value={formPart.name}
              onChange={(e) => setFormPart((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              required
              placeholder="e.g. Gas charging (R32/R410A)"
            />
            <TextField
              label="Price"
              value={formPart.price}
              onChange={(e) => setFormPart((p) => ({ ...p, price: e.target.value }))}
              fullWidth
              placeholder="e.g. ₹2,499 onwards or As per capacity"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingIndex !== null ? handleUpdatePart : handleAddPart}
            disabled={!formPart.name.trim()}
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
