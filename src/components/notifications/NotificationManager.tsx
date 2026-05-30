/**
 * Notifications hub — industry layout:
 *   Inbox (default) → Compose → Templates → Settings
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Send,
  FileText,
  Inbox,
  SlidersHorizontal,
  Loader2,
  Megaphone,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { NotificationTemplates } from './NotificationTemplates'
import { NotificationInbox } from './NotificationInbox'
import { useNotifications } from '../../hooks/useNotifications'
import {
  notificationsService,
  CreateNotificationRequest,
  NotificationStats,
  NotificationTemplate,
} from '../../services/api/notifications.service'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import {
  NOTIFICATION_TYPE_OPTIONS,
  parseRecipientIds,
  formatNotificationType,
} from '../../lib/notificationUi'
import {
  Button,
  Card,
  CardContent,
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
  Badge,
  Textarea,
} from '../ui'
import { cn } from '../../lib/utils'

type HubTab = 'inbox' | 'compose' | 'templates' | 'settings'

interface NotificationManagerProps {
  /** Controlled tab (optional). */
  activeTab?: HubTab
  onTabChange?: (tab: HubTab) => void
}

export function NotificationManager({ activeTab: controlledTab, onTabChange }: NotificationManagerProps) {
  const [internalTab, setInternalTab] = useState<HubTab>('inbox')
  const tab = controlledTab ?? internalTab
  const setTab = (t: HubTab) => {
    if (onTabChange) onTabChange(t)
    else setInternalTab(t)
  }

  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [broadcastStats, setBroadcastStats] = useState<NotificationStats | null>(null)
  const [recipientIdsCsv, setRecipientIdsCsv] = useState('')
  const [audienceMode, setAudienceMode] = useState<'specific' | 'broadcast'>('specific')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dispatch = useAppDispatch()

  const {
    notifications,
    preferences,
    unreadCount,
    refreshNotifications,
    updatePreferences,
    registerDevice,
    unregisterDevice,
  } = useNotifications()

  const [sendForm, setSendForm] = useState<CreateNotificationRequest>({
    title: '',
    body: '',
    type: 'system_alert',
    iconUrl: '',
    actionUrl: '',
    data: {},
    userIds: [],
  })

  const [localPrefs, setLocalPrefs] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    userNotifications: true,
    systemNotifications: true,
    marketingNotifications: false,
  })

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
      })
    }
  }, [preferences])

  const loadBroadcastStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const s = await notificationsService.getNotificationStats()
      const hasData =
        s.totalSent > 0 ||
        s.totalRead > 0 ||
        s.totalUnread > 0 ||
        Object.keys(s.byType || {}).length > 0
      setBroadcastStats(hasData ? s : null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBroadcastStats()
  }, [loadBroadcastStats])

  const readCount = Math.max(0, notifications.length - unreadCount)
  const readRate =
    notifications.length > 0
      ? (((notifications.length - unreadCount) / notifications.length) * 100).toFixed(0)
      : '0'

  const handleSendNotification = async () => {
    const userIds =
      audienceMode === 'specific' ? parseRecipientIds(recipientIdsCsv) : []

    if (audienceMode === 'specific' && userIds.length === 0) {
      dispatch(addToast({ message: 'Add at least one recipient user ID, or switch to broadcast mode.', severity: 'error' }))
      return
    }

    if (sendForm.type === 'marketing' && !localPrefs.marketingNotifications) {
      dispatch(
        addToast({
          message: 'Marketing is disabled in your preferences. Enable it under Settings before sending.',
          severity: 'warning',
        }),
      )
    }

    const payload: CreateNotificationRequest = {
      ...sendForm,
      iconUrl: sendForm.iconUrl?.trim() || undefined,
      actionUrl: sendForm.actionUrl?.trim() || undefined,
      userIds,
    }

    try {
      setLoading(true)
      const result = await notificationsService.sendNotification(payload)
      const delivered = Number(result.success ?? 0)
      const failed = Number(result.failed ?? 0)
      dispatch(
        addToast({
          message:
            delivered === 0 && failed === 0
              ? 'Send completed. Confirm recipient IDs and server configuration if nothing was delivered.'
              : `Delivered: ${delivered}${failed ? `, failed: ${failed}` : ''}.`,
          severity: delivered > 0 ? 'success' : 'warning',
        }),
      )
      setRecipientIdsCsv('')
      setSendForm({
        title: '',
        body: '',
        type: 'system_alert',
        iconUrl: '',
        actionUrl: '',
        data: {},
        userIds: [],
      })
      setTab('inbox')
      await Promise.all([refreshNotifications(), loadBroadcastStats()])
    } catch (error) {
      dispatch(
        addToast({
          message: error instanceof Error ? error.message : 'Failed to send notification',
          severity: 'error',
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSendFromTemplate = (template: NotificationTemplate) => {
    const stripPlaceholders = (s: string) =>
      s.replace(/\{\{[^}]+\}\}/g, (m) => m.replace(/[{}]/g, '').replace(/_/g, ' '))

    setSendForm({
      title: stripPlaceholders(template.titleTemplate).slice(0, 120) || template.name,
      body: stripPlaceholders(template.bodyTemplate),
      type: template.type,
      iconUrl: template.iconUrl || '',
      actionUrl: template.actionUrl || '',
      data: { templateId: template.id },
      userIds: [],
    })
    setRecipientIdsCsv('')
    setTab('compose')
  }

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(localPrefs)
    } catch {
      /* toast in hook */
    }
  }

  return (
    <div className="w-full">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 border-b border-border bg-muted/20 px-4 py-4 sm:grid-cols-4 md:px-6">
        {[
          { label: 'Unread', value: unreadCount, accent: unreadCount > 0 ? 'text-bloom-coral' : '' },
          { label: 'Loaded', value: notifications.length, accent: '' },
          { label: 'Read', value: readCount, accent: '' },
          { label: 'Read rate', value: `${readRate}%`, accent: '' },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border/80 bg-card px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className={cn('text-xl font-bold tabular-nums', k.accent)}>{k.value}</p>
          </div>
        ))}
      </div>

      {broadcastStats && (
        <div className="flex flex-wrap gap-4 border-b border-border bg-muted/10 px-4 py-2 text-xs text-muted-foreground md:px-6">
          <span>
            <strong className="text-foreground">Broadcast API:</strong> {broadcastStats.totalSent} sent ·{' '}
            {broadcastStats.totalRead} read · {broadcastStats.readRate}% rate
          </span>
        </div>
      )}
      {statsLoading && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground md:px-6">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading broadcast stats…
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as HubTab)} className="w-full">
        <div className="border-b border-border px-4 md:px-6">
          <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="inbox"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Inbox className="h-4 w-4" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="compose"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Send className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* INBOX */}
        <TabsContent value="inbox" className="mt-0">
          <Card className="m-4 overflow-hidden border-0 shadow-none md:m-6">
            <NotificationInbox variant="page" />
          </Card>
        </TabsContent>

        {/* COMPOSE */}
        <TabsContent value="compose" className="mt-0 p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {sendForm.type === 'marketing' && (
                <div className="flex gap-2 rounded-md border border-bloom-coral/60 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral dark:border-bloom-coral dark:bg-bloom-coral/40 dark:text-bloom-deep">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Marketing sends require user consent. Confirm compliance before broadcasting.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="compose-title">Title</Label>
                <Input
                  id="compose-title"
                  placeholder="e.g. Your booking is confirmed"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-body">Message</Label>
                <Textarea
                  id="compose-body"
                  rows={4}
                  placeholder="Short, actionable copy works best on mobile."
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">{sendForm.body.length} characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compose-type">Category</Label>
                <Select value={sendForm.type} onValueChange={(v) => setSendForm({ ...sendForm, type: v })}>
                  <SelectTrigger id="compose-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audience</Label>
                <div className="inline-flex rounded-lg border border-border p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={audienceMode === 'specific' ? 'default' : 'ghost'}
                    className="rounded-md"
                    onClick={() => setAudienceMode('specific')}
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    Specific users
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={audienceMode === 'broadcast' ? 'default' : 'ghost'}
                    className="rounded-md"
                    onClick={() => setAudienceMode('broadcast')}
                  >
                    <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                    Broadcast
                  </Button>
                </div>
                {audienceMode === 'specific' ? (
                  <Textarea
                    id="compose-recipients"
                    value={recipientIdsCsv}
                    onChange={(e) => setRecipientIdsCsv(e.target.value)}
                    placeholder="Mongo user IDs — comma, space, or newline separated"
                    rows={3}
                  />
                ) : (
                  <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Sends with an empty recipient list when your API supports platform-wide broadcast.
                    Confirm behaviour in your backend contract before using in production.
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </Button>
              {showAdvanced && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="compose-icon">Icon URL (https)</Label>
                    <Input
                      id="compose-icon"
                      value={sendForm.iconUrl}
                      onChange={(e) => setSendForm({ ...sendForm, iconUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compose-action">Deep link / action URL</Label>
                    <Input
                      id="compose-action"
                      placeholder="/bookings/… or https://…"
                      value={sendForm.actionUrl}
                      onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => void handleSendNotification()}
                  disabled={loading || !sendForm.title?.trim() || !sendForm.body?.trim()}
                  loading={loading}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send notification
                </Button>
                <Button type="button" variant="outline" onClick={() => setTab('templates')}>
                  Use a template
                </Button>
              </div>
            </div>

            {/* Live preview */}
            <div className="lg:col-span-2">
              <Card className="sticky top-4 overflow-hidden">
                <div className="border-b border-border bg-muted/40 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Push preview
                  </p>
                </div>
                <CardContent className="space-y-4 p-4">
                  <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Profixer · now</p>
                        <p className="font-semibold leading-tight">
                          {sendForm.title.trim() || 'Notification title'}
                        </p>
                        <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">
                          {sendForm.body.trim() || 'Your message will appear here.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <dl className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <dt>Type</dt>
                      <dd className="font-medium text-foreground">{formatNotificationType(sendForm.type)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Audience</dt>
                      <dd className="font-medium text-foreground">
                        {audienceMode === 'broadcast'
                          ? 'Broadcast'
                          : `${parseRecipientIds(recipientIdsCsv).length} user(s)`}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-0 p-4 md:p-6">
          <NotificationTemplates onSendFromTemplate={handleSendFromTemplate} />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="mt-0 p-4 md:p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h3 className="font-semibold">Channels</h3>
                  <p className="text-sm text-muted-foreground">
                    How this admin account receives alerts. Stored via{' '}
                    <code className="rounded bg-muted px-1 text-xs">PUT /notifications/preferences</code>.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ['pushNotifications', 'Push', 'Browser & mobile push'],
                      ['emailNotifications', 'Email', 'Transactional email'],
                      ['smsNotifications', 'SMS', 'Text messages'],
                    ] as const
                  ).map(([key, title, hint]) => (
                    <div
                      key={key}
                      className="flex flex-col justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{hint}</p>
                      </div>
                      <Switch
                        className="mt-3"
                        checked={localPrefs[key]}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h3 className="font-semibold">Categories</h3>
                  <p className="text-sm text-muted-foreground">Fine-grained control by notification type.</p>
                </div>
                <div className="space-y-3">
                  {(
                    [
                      ['orderNotifications', 'Orders & bookings'],
                      ['userNotifications', 'Account & messages'],
                      ['systemNotifications', 'System & security'],
                      ['marketingNotifications', 'Marketing (opt-in)'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-2">
                      <Label className="font-normal">{label}</Label>
                      <Switch
                        checked={localPrefs[key]}
                        onCheckedChange={(v) => setLocalPrefs((p) => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={() => void handleSavePreferences()}>Save preferences</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 pt-6">
                <h3 className="font-semibold">Web push on this device</h3>
                <p className="text-sm text-muted-foreground">
                  Subscribe this browser to receive push when the API exposes a VAPID key.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void registerDevice()}>
                    Enable push
                  </Button>
                  <Button variant="outline" onClick={() => void unregisterDevice()}>
                    Disable push
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
