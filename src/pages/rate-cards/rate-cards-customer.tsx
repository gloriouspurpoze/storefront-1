import React from 'react'
import RateCardManagement from '../cms/RateCardManagement'

export default function RateCardsCustomerPage() {
  return (
    <RateCardManagement
      dataset="customer"
      pageTitle="Customer published rates"
      pageSubtitle="Spare parts and indicative job pricing shown on profixer.in — keyed like industry landing pages."
    />
  )
}
