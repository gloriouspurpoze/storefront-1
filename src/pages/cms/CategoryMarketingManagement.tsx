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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Divider,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon, Add as AddIcon, Campaign as CampaignIcon, Image as ImageIcon } from '@mui/icons-material';
import { CMSService } from '../../services/api';
import { PageHeader } from '../../components/common/PageHeader';
import ImageUploadField from '../../components/forms/ImageUploadField';
import type { ImageFile } from '../../components/forms/ImageUploadField';
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories';

interface ServiceTypeBlock {
  title: string;
  description: string;
  bullets: string[];
}

interface CategoryMarketingConfig {
  mainHeading: string;
  intro: string;
  image1?: string;
  image2?: string;
  serviceTypes: ServiceTypeBlock[];
  waysHeading: string;
  waysBullets: string[];
}

const emptyConfig = (): CategoryMarketingConfig => ({
  mainHeading: '',
  intro: '',
  serviceTypes: [],
  waysHeading: '',
  waysBullets: [],
});

export default function CategoryMarketingManagement() {
  const theme = useTheme();
  const [data, setData] = useState<Record<string, CategoryMarketingConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ac');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await CMSService.getCategoryMarketing();
      setData(typeof result === 'object' && result !== null ? result : {});
    } catch (error: any) {
      console.error('Error fetching category marketing:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to load';
      alert('Error: ' + msg);
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const config = data[selectedCategory] ?? emptyConfig();

  const updateConfig = (updates: Partial<CategoryMarketingConfig>) => {
    setData((prev) => ({
      ...prev,
      [selectedCategory]: { ...emptyConfig(), ...(prev[selectedCategory] ?? {}), ...config, ...updates },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...data, [selectedCategory]: config };
      await CMSService.updateCategoryMarketing(payload);
      alert('Category marketing saved.');
      fetchData();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const addServiceType = () => {
    updateConfig({
      serviceTypes: [...config.serviceTypes, { title: '', description: '', bullets: [''] }],
    });
  };

  const updateServiceType = (index: number, field: keyof ServiceTypeBlock, value: any) => {
    const next = [...config.serviceTypes];
    next[index] = { ...next[index], [field]: value };
    updateConfig({ serviceTypes: next });
  };

  const removeServiceType = (index: number) => {
    updateConfig({ serviceTypes: config.serviceTypes.filter((_, i) => i !== index) });
  };

  const updateBullet = (typeIndex: number, bulletIndex: number, value: string) => {
    const next = [...config.serviceTypes];
    const bullets = [...(next[typeIndex].bullets || [])];
    bullets[bulletIndex] = value;
    next[typeIndex] = { ...next[typeIndex], bullets };
    updateConfig({ serviceTypes: next });
  };

  const addBullet = (typeIndex: number) => {
    const next = [...config.serviceTypes];
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: [...(next[typeIndex].bullets || []), ''],
    };
    updateConfig({ serviceTypes: next });
  };

  const removeBullet = (typeIndex: number, bulletIndex: number) => {
    const next = [...config.serviceTypes];
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: next[typeIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
    updateConfig({ serviceTypes: next });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Category Marketing"
        subtitle="#1 [Category] services blocks, service types & 4 ways section for catalog"
        action={
          <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <CampaignIcon />} onClick={handleSave} disabled={saving} sx={{ borderRadius: 2 }}>
            Save
          </Button>
        }
      />

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Category</InputLabel>
            <Select value={selectedCategory} label="Category" onChange={(e) => setSelectedCategory(e.target.value)} sx={{ borderRadius: 2 }}>
              {CMS_CATALOG_CATEGORIES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Main heading & intro
              </Typography>
              <TextField
                fullWidth
                label="Main heading"
                value={config.mainHeading}
                onChange={(e) => updateConfig({ mainHeading: e.target.value })}
                placeholder="#1 AC cleaning & repair services by ProFixer"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Intro"
                multiline
                rows={4}
                value={config.intro}
                onChange={(e) => updateConfig({ intro: e.target.value })}
                placeholder="Explore our comprehensive range of AC cleaning and repair services..."
              />
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <ImageIcon color="action" />
                <Typography variant="subtitle1" fontWeight={600}>
                  Images
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add images for this category’s marketing block. Upload to Cloudinary or choose from your existing library.
              </Typography>
              <Stack spacing={3}>
                <ImageUploadField
                  label="Image 1 (Hero / main)"
                  value={config.image1 ? [{ id: 'img1', url: config.image1, alt: 'Image 1', isPrimary: true, order: 0 }] : []}
                  onChange={(images: ImageFile[]) => updateConfig({ image1: images[0]?.url })}
                  maxFiles={1}
                  maxSize={5}
                  folder="homeservice"
                  allowFromCloudinary
                  helperText="Hero or main category image. Recommended: 1200×630px or similar. Max 5MB."
                />
                <ImageUploadField
                  label="Image 2 (Secondary)"
                  value={config.image2 ? [{ id: 'img2', url: config.image2, alt: 'Image 2', isPrimary: true, order: 0 }] : []}
                  onChange={(images: ImageFile[]) => updateConfig({ image2: images[0]?.url })}
                  maxFiles={1}
                  maxSize={5}
                  folder="homeservice"
                  allowFromCloudinary
                  helperText="Secondary or supporting image. Max 5MB."
                />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Service type blocks
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addServiceType}>
                  Add block
                </Button>
              </Box>
              {config.serviceTypes.map((block, typeIndex) => (
                <Accordion key={typeIndex} defaultExpanded sx={{ borderRadius: 1, mb: 1, '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{block.title || `Block ${typeIndex + 1}`}</Typography>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); removeServiceType(typeIndex); }} sx={{ ml: 1 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={block.title}
                        onChange={(e) => updateServiceType(typeIndex, 'title', e.target.value)}
                        placeholder="Foam & power jet AC service in Mumbai"
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={2}
                        value={block.description}
                        onChange={(e) => updateServiceType(typeIndex, 'description', e.target.value)}
                      />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Bullets</Typography>
                        {(block.bullets || []).map((b, bi) => (
                          <Stack key={bi} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={b}
                              onChange={(e) => updateBullet(typeIndex, bi, e.target.value)}
                              placeholder="Bullet point"
                            />
                            <IconButton size="small" color="error" onClick={() => removeBullet(typeIndex, bi)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}
                        <Button size="small" onClick={() => addBullet(typeIndex)} sx={{ mt: 1 }}>+ Bullet</Button>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                4 ways section
              </Typography>
              <TextField
                fullWidth
                label="Ways heading"
                value={config.waysHeading}
                onChange={(e) => updateConfig({ waysHeading: e.target.value })}
                placeholder="Here are 4 ways in which ProFixer provides the best AC service near you"
                sx={{ mb: 2 }}
              />
              {(config.waysBullets || []).map((b, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={b}
                    onChange={(e) => {
                      const next = [...(config.waysBullets || [])];
                      next[i] = e.target.value;
                      updateConfig({ waysBullets: next });
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => updateConfig({ waysBullets: (config.waysBullets || []).filter((_, j) => j !== i) })}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => updateConfig({ waysBullets: [...(config.waysBullets || []), ''] })}
              >
                Add way
              </Button>
            </CardContent>
          </Card>

          <Button variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <CampaignIcon />} onClick={handleSave} disabled={saving}>
            Save all
          </Button>
        </Stack>
      )}
    </Box>
  );
}
