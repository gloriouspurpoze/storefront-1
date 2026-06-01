import { z } from 'zod'
import type { VerticalPackDefinition } from './core/types'

const statusSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  color: z.string().optional(),
  terminal: z.boolean().optional(),
  next: z.array(z.string()).optional(),
})

const engagementTypeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  statuses: z.array(statusSchema).min(1),
  defaultSortField: z.string().optional(),
  defaultColumns: z.array(z.string()).optional(),
})

const catalogKindSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  supportsDuration: z.boolean().optional(),
  supportsSkillRequired: z.boolean().optional(),
  customFields: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
})

const planSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  priceInrMonthly: z.number().optional(),
  recommended: z.boolean().optional(),
  modules: z.array(z.string()).optional(),
})

const sidebarSubItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  href: z.string().min(1),
  icon: z.string().min(1),
  permissions: z.array(z.string()).optional(),
  module: z.string().optional(),
  platformOnly: z.boolean().optional(),
})

const sidebarItemSchema: z.ZodType<{
  id: string
  name: string
  icon: string
  href?: string
  permissions?: string[]
  module?: string
  platformOnly?: boolean
  hasSubmenu?: boolean
  subItems?: z.infer<typeof sidebarSubItemSchema>[]
  badge?: string | number | null
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    href: z.string().optional(),
    icon: z.string().min(1),
    permissions: z.array(z.string()).optional(),
    module: z.string().optional(),
    platformOnly: z.boolean().optional(),
    hasSubmenu: z.boolean().optional(),
    subItems: z.array(sidebarSubItemSchema).optional(),
    badge: z.optional(z.any()),
  }),
)

export const verticalPackSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  version: z.string().min(1),
  defaultModules: z.array(z.string()),
  sidebarGroups: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      icon: z.string().optional(),
      order: z.number().optional(),
      items: z.array(sidebarItemSchema),
    }),
  ),
  engagementTypes: z.array(engagementTypeSchema).optional(),
  marketingSlug: z.string().min(1).optional(),
  billingPlans: z.array(planSchema).optional(),
  catalogKinds: z.array(catalogKindSchema).optional(),
  workforceRoles: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        requiresLicense: z.boolean().optional(),
        commissionModel: z.string().optional(),
      }),
    )
    .optional(),
  taxStrategy: z
    .object({
      key: z.string(),
      label: z.string(),
      rates: z.array(z.object({ key: z.string(), label: z.string(), rate: z.number() })).optional(),
      requiredFields: z.array(z.string()).optional(),
    })
    .optional(),
  compliance: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        required: z.boolean().optional(),
        validatePattern: z.string().optional(),
      }),
    )
    .optional(),
  integrations: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        scope: z.string(),
        auth: z.string().optional(),
      }),
    )
    .optional(),
  reports: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        path: z.string(),
        permissions: z.array(z.string()).optional(),
      }),
    )
    .optional(),
})

export function validateVerticalPack(pack: VerticalPackDefinition): void {
  verticalPackSchema.parse(pack)
}
