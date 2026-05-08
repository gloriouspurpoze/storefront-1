import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { NotificationTemplates } from './NotificationTemplates';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import {
  notificationsService,
  CreateNotificationRequest,
  NotificationStats,
  NotificationTemplate,
} from '../../services/api/notifications.service';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';
import {
  Button,
  Card,
  CardContent,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Separator,
  Badge,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Avatar,
  AvatarFallback,
} from '../ui';

interface NotificationManagerProps {
  onClose?: () => void;
}

export function NotificationManager({ onClose: _onClose }: NotificationManagerProps) {
  const [tab, setTab] = useState('0');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [broadcastStats, setBroadcastStats] = useState<NotificationStats | null>(null);
  const [recipientIdsCsv, setRecipientIdsCsv] = useState('');
  const dispatch = useAppDispatch();

  const {
    notifications,
    preferences,
    unreadCount,
    refreshNotifications,
    updatePreferences,
    registerDevice,
    unregisterDevice,
    isLoading,
  } = useNotifications();

  const [sendForm, setSendForm] = useState<CreateNotificationRequest>({
    title: '',
    body: '',
    type: 'system_alert',
    iconUrl: '',
    actionUrl: '',
    data: {},
    userIds: [],
  });

  const [localPrefs, setLocalPrefs] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    userNotifications: true,
    systemNotifications: true,
    marketingNotifications: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        pushNotifications: preferences.pushNotifications,
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        orderNotifications: preferences.orderNotifications,
        userNotifications: preferences.userNotifications,
        systemNotifications: preferences.systemNotifications,
        marketingNotifications: preferences.marketingNotifications,
      });
    }
  }, [preferences]);

  const loadBroadcastStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const s = await notificationsService.getNotificationStats();
      const hasData =
        s.totalSent > 0 ||
        s.totalRead > 0 ||
        s.totalUnread > 0 ||
        Object.keys(s.byType || {}).length > 0;
      setBroadcastStats(hasData ? s : null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcastStats();
  }, [loadBroadcastStats]);

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

  const parseRecipientIds = (csv: string): string[] =>
    csv
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSendNotification = async () => {
    const userIds = parseRecipientIds(recipientIdsCsv);
    const payload: CreateNotificationRequest = {
      ...sendForm,
      iconUrl: sendForm.iconUrl?.trim() || undefined,
      actionUrl: sendForm.actionUrl?.trim() || undefined,
      userIds: userIds.length > 0 ? userIds : [],
    };

    try {
      setLoading(true);
      const result = await notificationsService.sendNotification(payload);

      const delivered = Number(result.success ?? 0);
      const failed = Number(result.failed ?? 0);
      dispatch(
        addToast({
          message:
            delivered === 0 && failed === 0
              ? 'Send completed. If nothing was delivered, confirm recipient user IDs and server configuration.'
              : `Delivered: ${delivered}${failed ? `, failed: ${failed}` : ''}.`,
          severity: delivered > 0 ? 'success' : 'warning',
        })
      );

      setSendDialogOpen(false);
      setRecipientIdsCsv('');
      setSendForm({
        title: '',
        body: '',
        type: 'system_alert',
        iconUrl: '',
        actionUrl: '',
        data: {},
        userIds: [],
      });
      await Promise.all([refreshNotifications(), loadBroadcastStats()]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      dispatch(
        addToast({
          message: errorMessage,
          severity: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendFromTemplate = (template: NotificationTemplate) => {
    const stripPlaceholders = (s: string) =>
      s.replace(/\{\{[^}]+\}\}/g, (m) => m.replace(/[{}]/g, '').replace(/_/g, ' '));

    setSendForm({
      title: stripPlaceholders(template.titleTemplate).slice(0, 120) || template.name,
      body: stripPlaceholders(template.bodyTemplate),
      type: template.type,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      data: { templateId: template.id },
      userIds: [],
    });
    setRecipientIdsCsv('');
    setTab('1');
    setSendDialogOpen(true);
  };

  const recentNotifications = notifications.slice(0, 5);
  const notificationStats = {
    total: notifications.length,
    unread: unreadCount,
    read: Math.max(0, notifications.length - unreadCount),
    readRate:
      notifications.length > 0
        ? (((notifications.length - unreadCount) / notifications.length) * 100).toFixed(1)
        : '0',
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(localPrefs);
    } catch {
      /* toast in hook */
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-12">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900/50 dark:bg-blue-950/40">
          <p className="font-medium text-foreground">Operational scope</p>
          <p className="mt-1 text-muted-foreground">
            In-app items below reflect this admin session&apos;s feed. Broadcast metrics (if your API exposes them)
            appear when the stats endpoint returns data. Marketing sends should respect consent flags under
            Preferences.
          </p>
        </div>
      </div>

      <div className="md:col-span-6 lg:col-span-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bell className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold leading-none">{notificationStats.total}</p>
                <p className="text-sm text-muted-foreground">In-app (loaded)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-6 lg:col-span-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-amber-500 text-white">
                <AvatarFallback className="bg-amber-500 text-white">
                  <TrendingUp className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold leading-none">{notificationStats.unread}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-6 lg:col-span-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-green-600 text-white">
                <AvatarFallback className="bg-green-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold leading-none">{notificationStats.read}</p>
                <p className="text-sm text-muted-foreground">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-6 lg:col-span-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-sky-600 text-white">
                <AvatarFallback className="bg-sky-600 text-white">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold leading-none">{notificationStats.readRate}%</p>
                <p className="text-sm text-muted-foreground">Read rate (in-app)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {broadcastStats && (
        <>
          <div className="md:col-span-12">
            <p className="text-base font-semibold">Broadcast pipeline (API)</p>
            <p className="text-xs text-muted-foreground">
              Totals from <code className="rounded bg-muted px-1 py-0.5">/notifications/stats</code> when available.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:col-span-12">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{broadcastStats.totalSent}</p>
                <p className="text-sm text-muted-foreground">Sent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{broadcastStats.totalRead}</p>
                <p className="text-sm text-muted-foreground">Read</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{broadcastStats.totalUnread}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-semibold">{broadcastStats.readRate}%</p>
                <p className="text-sm text-muted-foreground">Read rate</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {statsLoading && (
        <div className="flex items-center gap-2 md:col-span-12">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking broadcast stats…</p>
        </div>
      )}

      <div className="md:col-span-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold leading-none">Quick actions</h3>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                leftIcon={<Send className="h-4 w-4" />}
                onClick={() => {
                  setTab('1');
                  setSendDialogOpen(true);
                }}
              >
                Compose broadcast
              </Button>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<FileText className="h-4 w-4" />}
                onClick={() => setTab('2')}
              >
                Templates
              </Button>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                onClick={() => setTab('3')}
              >
                Preferences &amp; channels
              </Button>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<Bell className="h-4 w-4" />}
                onClick={() => setNotificationCenterOpen(true)}
              >
                Open notification center
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-6">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-none">Recent in-app</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => void refreshNotifications()}
                      disabled={isLoading}
                      aria-label="Refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notifications in the current window. Use Refresh after new activity.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border">
                {recentNotifications.map((notification) => (
                  <li key={notification.id}>
                    <div className="flex cursor-default items-start gap-3 px-3 py-2.5 hover:bg-muted/50">
                      <div className="relative shrink-0 pt-0.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            <Bell className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        {!notification.isRead && (
                          <span
                            className="absolute right-0 top-0 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${notification.isRead ? 'font-normal' : 'font-semibold'}`}
                        >
                          {notification.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{notification.body}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {notification.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div className="space-y-6">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/40">
        <p>
          Broadcasts may reach real users. Confirm copy, audience, and compliance (especially for{' '}
          <strong>marketing</strong>) before sending. Recipient IDs must match your backend&apos;s user identifiers.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <h3 className="flex-1 text-lg font-semibold">Compose</h3>
            <Button leftIcon={<Send className="h-4 w-4" />} onClick={() => setSendDialogOpen(true)}>
              Open send dialog
            </Button>
            <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />} onClick={() => setTab('2')}>
              Pick a template first
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Channel toggles are stored per user via <code className="rounded bg-muted px-1 py-0.5">PUT /notifications/preferences</code>.
        Web push also requires a subscribed browser endpoint.
      </p>
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-base font-semibold">Web push (this browser)</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void registerDevice()}>
              Enable push on this device
            </Button>
            <Button variant="outline" onClick={() => void unregisterDevice()}>
              Disable push on this device
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-base font-semibold">Categories</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="pref-push"
                checked={localPrefs.pushNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, pushNotifications: v }))}
              />
              <Label htmlFor="pref-push">Push notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pref-email"
                checked={localPrefs.emailNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, emailNotifications: v }))}
              />
              <Label htmlFor="pref-email">Email</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pref-sms"
                checked={localPrefs.smsNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, smsNotifications: v }))}
              />
              <Label htmlFor="pref-sms">SMS</Label>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center gap-3">
              <Switch
                id="pref-order"
                checked={localPrefs.orderNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, orderNotifications: v }))}
              />
              <Label htmlFor="pref-order">Orders & bookings</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pref-user"
                checked={localPrefs.userNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, userNotifications: v }))}
              />
              <Label htmlFor="pref-user">Account & messages</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pref-system"
                checked={localPrefs.systemNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, systemNotifications: v }))}
              />
              <Label htmlFor="pref-system">System & security</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="pref-marketing"
                checked={localPrefs.marketingNotifications}
                onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, marketingNotifications: v }))}
              />
              <Label htmlFor="pref-marketing">Marketing (opt-in)</Label>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => void handleSavePreferences()}>Save preferences</Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Product documentation: keep an audit trail of high-impact sends in your backend.{' '}
        <a
          href="https://web.dev/articles/push-notifications-overview"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Web Push overview
        </a>
      </p>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger value="0" className="data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="1" className="gap-1.5 data-[state=active]:shadow-sm">
              <Megaphone className="h-4 w-4" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="2" className="gap-1.5 data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="3" className="gap-1.5 data-[state=active]:shadow-sm">
              <SlidersHorizontal className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="0" className="mt-0">
            {renderOverview()}
          </TabsContent>
          <TabsContent value="1" className="mt-0">
            {renderBroadcast()}
          </TabsContent>
          <TabsContent value="2" className="mt-0">
            <NotificationTemplates onSendFromTemplate={handleSendFromTemplate} />
          </TabsContent>
          <TabsContent value="3" className="mt-0">
            {renderPreferences()}
          </TabsContent>
        </Tabs>

        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send notification</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="send-title">Title</Label>
                <Input
                  id="send-title"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-body">Message</Label>
                <Textarea
                  id="send-body"
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-type">Type</Label>
                <Select
                  value={sendForm.type}
                  onValueChange={(v) => setSendForm({ ...sendForm, type: v })}
                >
                  <SelectTrigger id="send-type">
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
                <Label htmlFor="send-recipients">Recipient user IDs</Label>
                <Textarea
                  id="send-recipients"
                  value={recipientIdsCsv}
                  onChange={(e) => setRecipientIdsCsv(e.target.value)}
                  placeholder="e.g. 507f1f77bcf86cd799439011, 507f191e810c19729de860ea"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Comma, space, or newline separated. If your API targets everyone when empty, you may leave this
                  blank—confirm in your backend contract.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-icon">Icon URL (https only)</Label>
                <Input
                  id="send-icon"
                  value={sendForm.iconUrl}
                  onChange={(e) => setSendForm({ ...sendForm, iconUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-action">Action URL (https only)</Label>
                <Input
                  id="send-action"
                  value={sendForm.actionUrl}
                  onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSendNotification()}
                disabled={loading || !sendForm.title?.trim() || !sendForm.body?.trim()}
                loading={loading}
              >
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <NotificationCenter open={notificationCenterOpen} onClose={() => setNotificationCenterOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
