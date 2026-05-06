import type {
  BrainstormCategory,
  IdeaStage,
  MarketingApprovalStepStatus,
  MarketingCalendarStatus,
  MarketingCampaignStatus,
  MarketingContentType,
  MarketingIdeaEffort,
  MarketingIdeaGoal,
  MarketingSocialStatus,
  MarketingTaskColumn,
  MarketingTaskType,
  SocialPlatform,
} from '../types/marketingWorkspace.types'

export const CAMPAIGN_STATUS_LABEL: Record<MarketingCampaignStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
}

export const CONTENT_TYPE_LABEL: Record<MarketingContentType, string> = {
  blog: 'Blog',
  newsletter: 'Newsletter',
  video: 'Video',
  whitepaper: 'Whitepaper',
  case_study: 'Case study',
  infographic: 'Infographic',
  social: 'Social',
  other: 'Other',
}

export const CONTENT_STATUS_LABEL: Record<MarketingCalendarStatus, string> = {
  idea: 'Idea',
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
}

export const APPROVAL_STEP_STATUS_LABEL: Record<MarketingApprovalStepStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  waived: 'Waived',
}

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  reddit: 'Reddit',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

export const SOCIAL_STATUS_LABEL: Record<MarketingSocialStatus, string> = CONTENT_STATUS_LABEL

export const IDEA_GOAL_LABEL: Record<MarketingIdeaGoal, string> = {
  awareness: 'Awareness',
  conversion: 'Conversion',
  retention: 'Retention',
  other: 'Other',
}

export const IDEA_STAGE_LABEL: Record<IdeaStage, string> = {
  new: 'New',
  under_review: 'Under review',
  approved: 'Approved',
  in_development: 'In development',
  completed: 'Completed',
  rejected: 'Rejected',
}

export const IDEA_EFFORT_LABEL: Record<MarketingIdeaEffort, string> = {
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
}

export const TASK_PRIORITY_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const TASK_COLUMN_LABEL: Record<MarketingTaskColumn, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
}

export const TASK_TYPE_LABEL: Record<MarketingTaskType, string> = {
  writing: 'Writing',
  design: 'Design',
  review: 'Review',
  approval: 'Approval',
  publishing: 'Publishing',
  reporting: 'Reporting',
  other: 'Other',
}

export const BRAINSTORM_CATEGORY_LABEL: Record<BrainstormCategory, string> = {
  hypothesis: 'Hypothesis',
  experiment: 'Experiment',
  insight: 'Insight',
  competitor: 'Competitor',
  session: 'Session',
  misc: 'Misc',
}
