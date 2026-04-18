import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, Tab, Tabs } from '@mui/material'

const CRM_TABS = [
  { label: 'Overview', path: '/crm' },
  { label: 'Leads', path: '/crm/leads' },
  { label: 'Contacts', path: '/crm/contacts' },
  { label: 'Companies', path: '/crm/companies' },
  { label: 'Deals', path: '/crm/deals' },
  { label: 'Activities', path: '/crm/activities' },
  { label: 'Settings', path: '/crm/settings' },
] as const

export function CrmSubnav() {
  const { pathname } = useLocation()
  const value = CRM_TABS.findIndex((t) =>
    t.path === '/crm' ? pathname === '/crm' : pathname.startsWith(t.path)
  )
  const safe = value >= 0 ? value : 0

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs
        value={safe}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ minHeight: 44 }}
      >
        {CRM_TABS.map((t) => (
          <Tab
            key={t.path}
            label={t.label}
            component={Link}
            to={t.path}
            sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
          />
        ))}
      </Tabs>
    </Box>
  )
}
