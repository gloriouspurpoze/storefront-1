/**
 * ============================================================================
 * PROFESSIONAL SETTINGS PAGE
 * ============================================================================
 * Complete settings management for professionals
 *
 * Features:
 * - Notification preferences
 * - Bank account details for payouts
 * - Privacy settings
 * - Account preferences
 *
 * @author CTO Team
 * @date January 23, 2026
 */

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  Save,
  Bell,
  Landmark,
  Shield,
} from 'lucide-react'
import {
  Button,
  CardContent,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { useAppDispatch } from '../../store/hooks'
import { apiClient } from '../../services/apiClient'
import { addToast } from '../../store/slices/uiSlice'

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-foreground"
    >
      {children}
    </div>
  )
}

export function ProfessionalSettings() {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    reviewAlerts: true,
    marketingEmails: false,
  })

  // Bank Details
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
  })

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    showPhoneNumber: true,
    showEmail: false,
    showLocation: true,
    allowDirectContact: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = (await apiClient.get('/professionals/settings')) as any
      if (response?.success || response?.data?.success) {
        const data = response.data?.settings || response.data || response
        if (data.notifications) setNotifications(data.notifications)
        if (data.bankDetails) setBankDetails(data.bankDetails)
        if (data.privacy) setPrivacy(data.privacy)
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = (await apiClient.put('/professionals/settings', {
        notifications,
        bankDetails,
        privacy,
      })) as any

      if (response?.success || response?.data?.success) {
        dispatch(
          addToast({
            message: 'Settings saved successfully!',
            severity: 'success',
          })
        )
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to save settings',
          severity: 'error',
        })
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-muted/40 p-2">
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:shadow-sm">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2 data-[state=active]:shadow-sm">
              <Landmark className="h-4 w-4" />
              Bank Details
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2 data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-0 border-0 p-0">
            <CardContent className="p-6 pt-6">
              <h2 className="mb-4 text-lg font-semibold">Notification Preferences</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="emailNotifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, emailNotifications: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="smsNotifications" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                  <Switch
                    id="smsNotifications"
                    checked={notifications.smsNotifications}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, smsNotifications: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="pushNotifications" className="cursor-pointer">
                    Push Notifications
                  </Label>
                  <Switch
                    id="pushNotifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, pushNotifications: c })
                    }
                  />
                </div>
                <div className="my-2 border-t" />
                <p className="text-sm font-semibold text-foreground">Alert Types</p>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="bookingAlerts" className="cursor-pointer">
                    New Booking Alerts
                  </Label>
                  <Switch
                    id="bookingAlerts"
                    checked={notifications.bookingAlerts}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, bookingAlerts: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="paymentAlerts" className="cursor-pointer">
                    Payment Alerts
                  </Label>
                  <Switch
                    id="paymentAlerts"
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, paymentAlerts: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="reviewAlerts" className="cursor-pointer">
                    New Review Alerts
                  </Label>
                  <Switch
                    id="reviewAlerts"
                    checked={notifications.reviewAlerts}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, reviewAlerts: c })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="marketingEmails" className="cursor-pointer">
                    Marketing Emails
                  </Label>
                  <Switch
                    id="marketingEmails"
                    checked={notifications.marketingEmails}
                    onCheckedChange={(c) =>
                      setNotifications({ ...notifications, marketingEmails: c })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="bank" className="mt-0 border-0 p-0">
            <CardContent className="p-6 pt-6">
              <h2 className="mb-4 text-lg font-semibold">Bank Account Details</h2>
              <InfoBanner>
                Your bank details are encrypted and secure. They are only used for processing payouts.
              </InfoBanner>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    className="mt-1.5"
                    value={bankDetails.accountHolderName}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountHolderName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    className="mt-1.5"
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    className="mt-1.5"
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    className="mt-1.5"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    className="mt-1.5"
                    value={bankDetails.branchName}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, branchName: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="privacy" className="mt-0 border-0 p-0">
            <CardContent className="p-6 pt-6">
              <h2 className="mb-4 text-lg font-semibold">Privacy Settings</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="showPhoneNumber" className="cursor-pointer">
                    Show Phone Number to Customers
                  </Label>
                  <Switch
                    id="showPhoneNumber"
                    checked={privacy.showPhoneNumber}
                    onCheckedChange={(c) => setPrivacy({ ...privacy, showPhoneNumber: c })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="showEmail" className="cursor-pointer">
                    Show Email to Customers
                  </Label>
                  <Switch
                    id="showEmail"
                    checked={privacy.showEmail}
                    onCheckedChange={(c) => setPrivacy({ ...privacy, showEmail: c })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="showLocation" className="cursor-pointer">
                    Show Location to Customers
                  </Label>
                  <Switch
                    id="showLocation"
                    checked={privacy.showLocation}
                    onCheckedChange={(c) => setPrivacy({ ...privacy, showLocation: c })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="allowDirectContact" className="cursor-pointer">
                    Allow Direct Contact from Customers
                  </Label>
                  <Switch
                    id="allowDirectContact"
                    checked={privacy.allowDirectContact}
                    onCheckedChange={(c) =>
                      setPrivacy({ ...privacy, allowDirectContact: c })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
