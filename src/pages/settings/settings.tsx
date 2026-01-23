import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Switch,
  VStack,
  HStack,
  useToast,
} from '../../components/ui'
import {
  Save as SaveIcon,
  Camera as CameraIcon,
  Shield as SecurityIcon,
  Bell as NotificationsIcon,
  Palette as PaletteIcon,
  Globe as LanguageIcon,
  Upload as UploadIcon,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  Plus as AddIcon,
  Settings as SettingsIcon,
} from 'lucide-react'
import { PushNotificationManager } from '../../components/notifications/PushNotificationManager'
import { settingsService, type Settings, type SettingsUpdateRequest } from '../../services/api/settings.service'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <div className="p-6">{children}</div>}
    </div>
  )
}

export function Settings() {
  const [tabValue, setTabValue] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<Settings>({
    general: {
      businessName: 'Fixer Admin',
      businessEmail: 'admin@fixer.com',
      businessPhone: '+1-555-0123',
      businessAddress: '123 Business St, City, State 12345',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      orderNotifications: true,
      userNotifications: true,
      systemNotifications: true,
    },
    appearance: {
      theme: 'light',
      primaryColor: '#1976d2',
      sidebarCollapsed: false,
      compactMode: false,
    },
    clientControls: {
      signupEnabled: true,
      maintenanceMode: false,
      bookingEnabled: true,
      paymentGateway: 'stripe',
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await settingsService.getSettings()
      if (response.success && response.data) {
        setSettings(response.data)
      } else {
        // If API fails or returns no data, keep default settings
        console.warn('Settings API returned no data, using defaults')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await settingsService.updateSettings(settings)
      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { label: 'General', icon: <SettingsIcon className="h-4 w-4" /> },
    { label: 'Security', icon: <SecurityIcon className="h-4 w-4" /> },
    { label: 'Notifications', icon: <NotificationsIcon className="h-4 w-4" /> },
    { label: 'Appearance', icon: <PaletteIcon className="h-4 w-4" /> },
    { label: 'Client Controls', icon: <LanguageIcon className="h-4 w-4" /> },
  ]

  return (
    <div className="p-6">
      <VStack spacing={6}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your application settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <div className="border-b">
            <div className="flex gap-1 p-2">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setTabValue(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    tabValue === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* General Settings */}
          <TabPanel value={tabValue} index={0}>
            <VStack spacing={6}>
              <div>
                <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                <VStack spacing={4}>
                  <div className="w-full space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={settings.general?.businessName || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...(settings.general || {}), businessName: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={settings.general?.businessEmail || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...(settings.general || {}), businessEmail: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={settings.general?.businessPhone || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...(settings.general || {}), businessPhone: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={settings.general?.businessAddress || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          general: { ...(settings.general || {}), businessAddress: e.target.value },
                        })
                      }
                    />
                  </div>
                </VStack>
              </div>
            </VStack>
          </TabPanel>

          {/* Security Settings */}
          <TabPanel value={tabValue} index={1}>
            <VStack spacing={6}>
              <div>
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                <VStack spacing={4}>
                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.security?.twoFactorAuth || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          security: { ...(settings.security || {}), twoFactorAuth: checked },
                        })
                      }
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security?.sessionTimeout || 30}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...(settings.security || {}), sessionTimeout: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>

                  <div className="w-full space-y-2">
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      value={settings.security?.passwordExpiry || 90}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: { ...(settings.security || {}), passwordExpiry: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                </VStack>
              </div>
            </VStack>
          </TabPanel>

          {/* Notification Settings */}
          <TabPanel value={tabValue} index={2}>
            <VStack spacing={6}>
              <div>
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                <VStack spacing={3}>
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in browser' },
                    { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
                    { key: 'orderNotifications', label: 'Order Notifications', description: 'Get notified about new orders' },
                    { key: 'userNotifications', label: 'User Notifications', description: 'Get notified about user activities' },
                    { key: 'systemNotifications', label: 'System Notifications', description: 'Get notified about system updates' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between w-full p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={(settings.notifications?.[item.key as keyof typeof settings.notifications] as boolean) || false}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...(settings.notifications || {}), [item.key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </VStack>
              </div>

              <div className="border-t pt-6">
                <PushNotificationManager />
              </div>
            </VStack>
          </TabPanel>

          {/* Appearance Settings */}
          <TabPanel value={tabValue} index={3}>
            <VStack spacing={6}>
              <div>
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                <VStack spacing={4}>
                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use dark theme for the interface
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance?.theme === 'dark'}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          appearance: { ...(settings.appearance || {}), theme: checked ? 'dark' : 'light' },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Use compact layout for more content density
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance?.compactMode || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          appearance: { ...(settings.appearance || {}), compactMode: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Collapsed Sidebar</p>
                      <p className="text-sm text-muted-foreground">
                        Keep sidebar collapsed by default
                      </p>
                    </div>
                    <Switch
                      checked={settings.appearance?.sidebarCollapsed || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          appearance: { ...(settings.appearance || {}), sidebarCollapsed: checked },
                        })
                      }
                    />
                  </div>
                </VStack>
              </div>
            </VStack>
          </TabPanel>

          {/* Client Controls */}
          <TabPanel value={tabValue} index={4}>
            <VStack spacing={6}>
              <div>
                <h2 className="text-xl font-semibold mb-4">Client Controls</h2>
                <VStack spacing={3}>
                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">User Signup</p>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to sign up
                      </p>
                    </div>
                    <Switch
                      checked={settings.clientControls?.signupEnabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          clientControls: { ...(settings.clientControls || {}), signupEnabled: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between w-full p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Booking System</p>
                      <p className="text-sm text-muted-foreground">
                        Enable online booking functionality
                      </p>
                    </div>
                    <Switch
                      checked={settings.clientControls?.bookingEnabled || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          clientControls: { ...(settings.clientControls || {}), bookingEnabled: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between w-full p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-800">Maintenance Mode</p>
                      <p className="text-sm text-yellow-600">
                        Put the site in maintenance mode
                      </p>
                    </div>
                    <Switch
                      checked={settings.clientControls?.maintenanceMode || false}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          clientControls: { ...(settings.clientControls || {}), maintenanceMode: checked },
                        })
                      }
                    />
                  </div>
                </VStack>
              </div>
            </VStack>
          </TabPanel>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSave}
            loading={isSaving}
            leftIcon={<SaveIcon className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </VStack>
    </div>
  )
}
