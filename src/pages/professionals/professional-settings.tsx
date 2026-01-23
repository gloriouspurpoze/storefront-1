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
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
} from '@mui/material'
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useAppDispatch } from '../../store/hooks'
import { apiClient } from '../../services/apiClient'
import { addToast } from '../../store/slices/uiSlice'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export function ProfessionalSettings() {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  
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
      const response = await apiClient.get('/professionals/settings') as any
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
      const response = await apiClient.put('/professionals/settings', {
        notifications,
        bankDetails,
        privacy,
      }) as any

      if (response?.success || response?.data?.success) {
        dispatch(addToast({ 
          message: 'Settings saved successfully!', 
          severity: 'success' 
        }))
      }
    } catch (error: any) {
      dispatch(addToast({ 
        message: error.response?.data?.message || 'Failed to save settings', 
        severity: 'error' 
      }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences and settings
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Bank Details" icon={<BankIcon />} iconPosition="start" />
          <Tab label="Privacy" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Notification Preferences
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.smsNotifications}
                    onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                  />
                }
                label="Push Notifications"
              />
              <Divider />
              <Typography variant="subtitle2" fontWeight={600} mt={1}>
                Alert Types
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.bookingAlerts}
                    onChange={(e) => setNotifications({ ...notifications, bookingAlerts: e.target.checked })}
                  />
                }
                label="New Booking Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.paymentAlerts}
                    onChange={(e) => setNotifications({ ...notifications, paymentAlerts: e.target.checked })}
                  />
                }
                label="Payment Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.reviewAlerts}
                    onChange={(e) => setNotifications({ ...notifications, reviewAlerts: e.target.checked })}
                  />
                }
                label="New Review Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.marketingEmails}
                    onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                  />
                }
                label="Marketing Emails"
              />
            </Stack>
          </CardContent>
        </TabPanel>

        {/* Bank Details Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Bank Account Details
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Your bank details are encrypted and secure. They are only used for processing payouts.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Account Number"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={bankDetails.ifscCode}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bank Name"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Branch Name"
                  value={bankDetails.branchName}
                  onChange={(e) => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Privacy Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Privacy Settings
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={privacy.showPhoneNumber}
                    onChange={(e) => setPrivacy({ ...privacy, showPhoneNumber: e.target.checked })}
                  />
                }
                label="Show Phone Number to Customers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={privacy.showEmail}
                    onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                  />
                }
                label="Show Email to Customers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={privacy.showLocation}
                    onChange={(e) => setPrivacy({ ...privacy, showLocation: e.target.checked })}
                  />
                }
                label="Show Location to Customers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={privacy.allowDirectContact}
                    onChange={(e) => setPrivacy({ ...privacy, allowDirectContact: e.target.checked })}
                  />
                }
                label="Allow Direct Contact from Customers"
              />
            </Stack>
          </CardContent>
        </TabPanel>
      </Paper>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  )
}
