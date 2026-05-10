import React from 'react'
import { PageHeader } from '../../components/common'
import { ProfessionalConductPanel } from '../../components/professionals/ProfessionalConductPanel'

export function OperationsProfessionalConductPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Conduct &amp; incentives"
        subtitle="Tenant-wide ledger of warnings, penalties, fines, and rewards — aligned with workforce governance."
      />
      <ProfessionalConductPanel />
    </div>
  )
}
