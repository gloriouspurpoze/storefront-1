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
  Grid,
  IconButton,
  InputLabel,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Search as SearchIcon,
  GridView as GridIcon,
  ViewList as ListIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface MediaFile {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  size: number;
  folder: string;
  metadata: {
    alt?: string;
    caption?: string;
    description?: string;
  };
  tags: string[];
  usageCount: number;
  uploadedBy: { name: string };
  createdAt: string;
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [uploadData, setUploadData] = useState({
    url: '',
    filename: '',
    mimeType: 'image/jpeg',
    size: 0,
    folder: 'uploads',
    alt: '',
    caption: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    fetchFiles();
  }, [searchTerm, selectedType]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedType) params.type = selectedType;

      const res = await axios.get(`${API_BASE}/cms/admin/media`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setFiles(res.data.data.files);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        filename: uploadData.filename || uploadData.url.split('/').pop(),
        originalName: uploadData.filename || 'uploaded-file',
        url: uploadData.url,
        mimeType: uploadData.mimeType,
        size: uploadData.size || 1024,
        folder: uploadData.folder,
        metadata: {
          alt: uploadData.alt || undefined,
          caption: uploadData.caption || undefined,
          description: uploadData.description || undefined,
        },
        tags: uploadData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await axios.post(`${API_BASE}/cms/admin/media`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchFiles();
      setShowUploadForm(false);
      resetUploadForm();
      alert('File uploaded successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to upload'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/cms/admin/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFiles();
      setSelectedFile(null);
    } catch (error) {
      alert('Error deleting file');
    }
  };

  const resetUploadForm = () => {
    setUploadData({
      url: '',
      filename: '',
      mimeType: 'image/jpeg',
      size: 0,
      folder: 'uploads',
      alt: '',
      caption: '',
      description: '',
      tags: '',
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
      case 'video': return <VideoIcon sx={{ fontSize: 48, color: 'secondary.main' }} />;
      case 'audio': return <AudioIcon sx={{ fontSize: 48, color: 'success.main' }} />;
      case 'document': return <DocumentIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      default: return <FileIcon sx={{ fontSize: 48, color: 'text.disabled' }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Media Library</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your images, videos, and files
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setShowUploadForm(true)}
        >
          Upload File
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              label="Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid">
              <GridIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  height: '100%',
                }}
                onClick={() => setSelectedFile(file)}
              >
                <Box
                  sx={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    overflow: 'hidden',
                  }}
                >
                  {file.type === 'image' && file.url ? (
                    <img
                      src={file.url}
                      alt={file.metadata.alt || file.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </Box>
                <CardContent>
                  <Typography variant="body2" fontWeight="600" noWrap>
                    {file.originalName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ minWidth: 40 }}>
                        {file.type === 'image' && file.thumbnailUrl ? (
                          <img
                            src={file.thumbnailUrl}
                            alt=""
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          getFileIcon(file.type)
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {file.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {file.folder}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={file.type} size="small" />
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => setSelectedFile(file)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(file._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadForm} onClose={() => setShowUploadForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New File</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is metadata-only upload. For actual file uploads, integrate with Cloudinary or similar service.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="File URL"
                value={uploadData.url}
                onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Filename"
                value={uploadData.filename}
                onChange={(e) => setUploadData({ ...uploadData, filename: e.target.value })}
                placeholder="image.jpg"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>MIME Type</InputLabel>
                <Select
                  value={uploadData.mimeType}
                  label="MIME Type"
                  onChange={(e) => setUploadData({ ...uploadData, mimeType: e.target.value })}
                >
                  <MenuItem value="image/jpeg">Image (JPEG)</MenuItem>
                  <MenuItem value="image/png">Image (PNG)</MenuItem>
                  <MenuItem value="image/gif">Image (GIF)</MenuItem>
                  <MenuItem value="video/mp4">Video (MP4)</MenuItem>
                  <MenuItem value="application/pdf">Document (PDF)</MenuItem>
                  <MenuItem value="audio/mpeg">Audio (MP3)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Folder"
                value={uploadData.folder}
                onChange={(e) => setUploadData({ ...uploadData, folder: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Size (bytes)"
                value={uploadData.size}
                onChange={(e) => setUploadData({ ...uploadData, size: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alt Text"
                value={uploadData.alt}
                onChange={(e) => setUploadData({ ...uploadData, alt: e.target.value })}
                placeholder="Descriptive alt text for images"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Caption"
                value={uploadData.caption}
                onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={uploadData.tags}
                onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                placeholder="banner, hero, homepage"
                helperText="Comma-separated tags"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload}>
            Add to Library
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Details Dialog */}
      <Dialog
        open={!!selectedFile}
        onClose={() => setSelectedFile(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedFile && (
          <>
            <DialogTitle>File Details</DialogTitle>
            <DialogContent dividers>
              {selectedFile.type === 'image' && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.metadata.alt || ''}
                    style={{ maxWidth: '100%', borderRadius: 8 }}
                  />
                </Box>
              )}
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Filename</Typography>
                  <Typography variant="body2">{selectedFile.originalName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Chip label={selectedFile.type} size="small" />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Size</Typography>
                  <Typography variant="body2">{formatFileSize(selectedFile.size)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">URL</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                    <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                      {selectedFile.url}
                    </a>
                  </Typography>
                </Box>
                {selectedFile.metadata.alt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Alt Text</Typography>
                    <Typography variant="body2">{selectedFile.metadata.alt}</Typography>
                  </Box>
                )}
                {selectedFile.metadata.caption && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Caption</Typography>
                    <Typography variant="body2">{selectedFile.metadata.caption}</Typography>
                  </Box>
                )}
                {selectedFile.tags.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tags</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedFile.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Usage</Typography>
                  <Typography variant="body2">{selectedFile.usageCount} times</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Uploaded by</Typography>
                  <Typography variant="body2">{selectedFile.uploadedBy.name}</Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedFile(null)}>Close</Button>
              <Button color="error" onClick={() => handleDelete(selectedFile._id)}>
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
