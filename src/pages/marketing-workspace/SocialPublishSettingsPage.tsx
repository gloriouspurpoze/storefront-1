import React from 'react'
import { Rocket } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { MarketingWorkspaceSubnav } from '../../components/marketing-workspace/MarketingWorkspaceSubnav'
import { SocialPublishSettingsForm } from '../../components/marketing-workspace/SocialPublishSettingsForm'

export function SocialPublishSettingsPage() {
  return (
    <div className="container max-w-5xl py-6">
      <PageHeader
        title="Live publish"
        subtitle="Store API credentials for LinkedIn, Meta (Facebook + Instagram), Reddit, and WhatsApp. Social posts can push live when at least one channel is ready."
        icon={<Rocket className="h-8 w-8 text-primary" />}
      />
      <MarketingWorkspaceSubnav />
      <SocialPublishSettingsForm />
    </div>
  )
}
