import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { notificationsService, NotificationTemplate, CreateTemplateRequest } from '../../services/api/notifications.service';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

interface NotificationTemplatesProps {
  /** Opens broadcast flow with fields prefilled from the template. */
  onSendFromTemplate?: (template: NotificationTemplate) => void;
}

function applySamplePlaceholders(text: string): string {
  const pairs: [RegExp, string][] = [
    [/\{\{\s*customerName\s*\}\}/gi, 'Priya Sharma'],
    [/\{\{\s*userName\s*\}\}/gi, 'Alex Kim'],
    [/\{\{\s*bookingId\s*\}\}/gi, 'BK-24091'],
    [/\{\{\s*orderId\s*\}\}/gi, 'ORD-8831'],
    [/\{\{\s*amount\s*\}\}/gi, '₹4,250'],
    [/\{\{\s*serviceName\s*\}\}/gi, 'Deep cleaning'],
    [/\{\{\s*date\s*\}\}/gi, '16 Apr 2026'],
  ];
  let out = text;
  for (const [re, val] of pairs) {
    out = out.replace(re, val);
  }
  return out.replace(/\{\{[^}]+\}\}/g, '…');
}

export function NotificationTemplates({ onSendFromTemplate }: NotificationTemplatesProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<CreateTemplateRequest>({
    name: '',
    type: 'system_alert',
    titleTemplate: '',
    bodyTemplate: '',
    iconUrl: '',
    actionUrl: '',
    isActive: true
  });

  const notificationTypes = [
    { value: 'quote_received', label: 'Quote Received' },
    { value: 'quote_accepted', label: 'Quote Accepted' },
    { value: 'booking_confirmed', label: 'Booking Confirmed' },
    { value: 'message_received', label: 'Message Received' },
    { value: 'order_placed', label: 'Order Placed' },
    { value: 'order_updated', label: 'Order Updated' },
    { value: 'payment_received', label: 'Payment Received' },
    { value: 'service_completed', label: 'Service Completed' },
    { value: 'review_requested', label: 'Review Requested' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'reminder', label: 'Reminder' }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'system_alert',
      titleTemplate: '',
      bodyTemplate: '',
      iconUrl: '',
      actionUrl: '',
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      isActive: template.isActive
    });
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        const duplicateName =
          formData.name.trim() === editingTemplate.name.trim()
            ? `${editingTemplate.name} (revised)`
            : formData.name.trim();
        await notificationsService.createTemplate({ ...formData, name: duplicateName });
        dispatch(
          addToast({
            message:
              'Saved as a new template. In-place updates require a PATCH endpoint on the API.',
            severity: 'success',
          })
        );
        loadTemplates();
      } else {
        await notificationsService.createTemplate(formData);
        dispatch(addToast({
          message: 'Template created successfully',
          severity: 'success'
        }));
        loadTemplates();
      }
      setDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      dispatch(addToast({
        message: errorMessage,
        severity: 'error'
      }));
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    dispatch(
      addToast({
        message: `Delete for "${template.name}" is not wired to the API yet. Remove via backend admin if needed.`,
        severity: 'info',
      })
    );
    setAnchorEl(null);
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
    setAnchorEl(null);
  };

  const handleSendTemplate = (template: NotificationTemplate) => {
    if (onSendFromTemplate) {
      onSendFromTemplate(template);
    } else {
      dispatch(
        addToast({
          message: 'Broadcast flow is unavailable from this screen.',
          severity: 'warning',
        })
      );
    }
    setAnchorEl(null);
  };

  const handleCopyTemplate = (template: NotificationTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      type: template.type,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      isActive: template.isActive
    });
    setEditingTemplate(null);
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: NotificationTemplate) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      quote_received: 'primary',
      quote_accepted: 'success',
      booking_confirmed: 'info',
      message_received: 'primary',
      order_placed: 'primary',
      order_updated: 'warning',
      payment_received: 'success',
      service_completed: 'success',
      review_requested: 'warning',
      system_alert: 'error',
      marketing: 'secondary',
      reminder: 'info'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Notification Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {templates.length === 0 && !loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                No templates yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create reusable copy for operational and lifecycle messages. If the list stays empty, check API
                permissions for <code>GET /notifications/templates</code>.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTemplate}>
                Create template
              </Button>
            </Box>
          ) : null}
          <TableContainer sx={{ display: templates.length === 0 ? 'none' : undefined }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {template.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notificationTypes.find(t => t.value === template.type)?.label || template.type}
                        color={getTypeColor(template.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {template.titleTemplate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={template.isActive ? <ActiveIcon /> : <InactiveIcon />}
                        label={template.isActive ? 'Active' : 'Inactive'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, template)}
                        size="small"
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit template (saves as new)' : 'Create template'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Type"
              >
                {notificationTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Title Template"
              value={formData.titleTemplate}
              onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              helperText="Use {{variable}} for dynamic content"
            />

            <TextField
              label="Body Template"
              value={formData.bodyTemplate}
              onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
              fullWidth
              required
              multiline
              rows={4}
              helperText="Use {{variable}} for dynamic content"
            />

            <TextField
              label="Icon URL"
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              fullWidth
            />

            <TextField
              label="Action URL"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained">
            {editingTemplate ? 'Save as new template' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Preview (sample data)</DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Placeholders are filled with sample values. Final rendering happens on the server when sending.
              </Typography>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                }}
              >
                <Typography variant="caption" color="grey.500" display="block" gutterBottom>
                  Push / in-app
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {applySamplePlaceholders(previewTemplate.titleTemplate)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {applySamplePlaceholders(previewTemplate.bodyTemplate)}
                </Typography>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTemplate && handleEditTemplate(selectedTemplate)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedTemplate && handlePreviewTemplate(selectedTemplate)}>
          <ListItemIcon>
            <PreviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedTemplate && handleCopyTemplate(selectedTemplate)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedTemplate && handleSendTemplate(selectedTemplate)}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Send Notification</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedTemplate && handleDeleteTemplate(selectedTemplate)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
