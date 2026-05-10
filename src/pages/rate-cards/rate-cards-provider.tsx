import React from 'react'
import RateCardManagement from '../cms/RateCardManagement'

export default function RateCardsProviderPage() {
  return (
    <RateCardManagement
      dataset="provider"
      pageTitle="Provider & technician playbook"
      pageSubtitle="Visit economics, spare-margin guidance, and desk scripts — stored separately from the consumer rate card; not exposed on public APIs."
    />
  )
}
