import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Eye,
  Send,
  Copy,
  CheckCircle2,
  CircleOff,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Badge,
  Textarea,
} from '../ui';
import type { BadgeProps } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  notificationsService,
  NotificationTemplate,
  CreateTemplateRequest,
} from '../../services/api/notifications.service';
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

function getTypeBadgeVariant(type: string): NonNullable<BadgeProps['variant']> {
  const map: Record<string, NonNullable<BadgeProps['variant']>> = {
    quote_received: 'default',
    quote_accepted: 'success',
    booking_confirmed: 'secondary',
    message_received: 'default',
    order_placed: 'default',
    order_updated: 'warning',
    payment_received: 'success',
    service_completed: 'success',
    review_requested: 'warning',
    system_alert: 'destructive',
    marketing: 'secondary',
    reminder: 'secondary',
  };
  return map[type] || 'outline';
}

export function NotificationTemplates({ onSendFromTemplate }: NotificationTemplatesProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
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
    isActive: true,
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
    { value: 'reminder', label: 'Reminder' },
  ];

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'system_alert',
      titleTemplate: '',
      bodyTemplate: '',
      iconUrl: '',
      actionUrl: '',
      isActive: true,
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
      isActive: template.isActive,
    });
    setDialogOpen(true);
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
          }),
        );
        void loadTemplates();
      } else {
        await notificationsService.createTemplate(formData);
        dispatch(
          addToast({
            message: 'Template created successfully',
            severity: 'success',
          }),
        );
        void loadTemplates();
      }
      setDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        }),
      );
    }
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    dispatch(
      addToast({
        message: `Delete for "${template.name}" is not wired to the API yet. Remove via backend admin if needed.`,
        severity: 'info',
      }),
    );
  };

  const handlePreviewTemplate = (template: NotificationTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleSendTemplate = (template: NotificationTemplate) => {
    if (onSendFromTemplate) {
      onSendFromTemplate(template);
    } else {
      dispatch(
        addToast({
          message: 'Broadcast flow is unavailable from this screen.',
          severity: 'warning',
        }),
      );
    }
  };

  const handleCopyTemplate = (template: NotificationTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      type: template.type,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      isActive: template.isActive,
    });
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="m-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        role="alert"
      >
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Notification Templates</h2>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateTemplate}>
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {templates.length === 0 && !loading ? (
            <div className="p-8 text-center">
              <p className="text-base font-medium">No templates yet</p>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Create reusable copy for operational and lifecycle messages. If the list stays empty, check API
                permissions for <code className="rounded bg-muted px-1 py-0.5">GET /notifications/templates</code>.
              </p>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateTemplate}>
                Create template
              </Button>
            </div>
          ) : null}
          <div className={templates.length === 0 ? 'hidden' : 'overflow-x-auto'}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(template.type)}>
                        {notificationTypes.find((t) => t.value === template.type)?.label || template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-[200px] truncate text-sm"
                        title={template.titleTemplate}
                      >
                        {template.titleTemplate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.isActive ? 'success' : 'outline'}
                        className="inline-flex items-center gap-1"
                      >
                        {template.isActive ? (
                          <CheckCircle2 className="h-3 w-3" aria-hidden />
                        ) : (
                          <CircleOff className="h-3 w-3" aria-hidden />
                        )}
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEditTemplate(template)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePreviewTemplate(template)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCopyTemplate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSendTemplate(template)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Notification
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void handleDeleteTemplate(template)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit template (saves as new)' : 'Create template'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="tmpl-name">Template Name</Label>
              <Input
                id="tmpl-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmpl-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger id="tmpl-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmpl-title">Title Template</Label>
              <Textarea
                id="tmpl-title"
                value={formData.titleTemplate}
                onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                required
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Use {'{{variable}}'} for dynamic content</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmpl-body">Body Template</Label>
              <Textarea
                id="tmpl-body"
                value={formData.bodyTemplate}
                onChange={(e) => setFormData({ ...formData, bodyTemplate: e.target.value })}
                required
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Use {'{{variable}}'} for dynamic content</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmpl-icon">Icon URL</Label>
              <Input
                id="tmpl-icon"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tmpl-action">Action URL</Label>
              <Input
                id="tmpl-action"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="tmpl-active"
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
              <Label htmlFor="tmpl-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveTemplate()}>
              {editingTemplate ? 'Save as new template' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview (sample data)</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Placeholders are filled with sample values. Final rendering happens on the server when sending.
              </p>
              <div className="rounded-lg border bg-zinc-900 p-4 text-zinc-100 shadow-md dark:bg-zinc-950">
                <span className="mb-2 block text-xs text-zinc-500">Push / in-app</span>
                <p className="text-base font-bold leading-tight">
                  {applySamplePlaceholders(previewTemplate.titleTemplate)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-200">
                  {applySamplePlaceholders(previewTemplate.bodyTemplate)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
