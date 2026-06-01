import { z } from 'zod'
import type { VerticalKey } from './types'

export const homeServicesIndustrySettingsSchema = z.object({
  defaultServiceRadiusKm: z.number().min(1).max(200).optional(),
  emergencySurchargePercent: z.number().min(0).max(100).optional(),
  requireProfessionalLicense: z.boolean().optional(),
})

export const restaurantIndustrySettingsSchema = z.object({
  defaultCoversPerSlot: z.number().min(1).max(50).optional(),
  fssaiLicenseNo: z.string().max(64).optional(),
  serviceChargePercent: z.number().min(0).max(30).optional(),
})

export const salonIndustrySettingsSchema = z.object({
  defaultAppointmentMinutes: z.number().min(15).max(480).optional(),
  allowWalkIns: z.boolean().optional(),
  retailCommissionPercent: z.number().min(0).max(50).optional(),
})

export type HomeServicesIndustrySettings = z.infer<typeof homeServicesIndustrySettingsSchema>
export type RestaurantIndustrySettings = z.infer<typeof restaurantIndustrySettingsSchema>
export type SalonIndustrySettings = z.infer<typeof salonIndustrySettingsSchema>

const SCHEMAS: Partial<Record<VerticalKey, z.ZodTypeAny>> = {
  home_services: homeServicesIndustrySettingsSchema,
  restaurant: restaurantIndustrySettingsSchema,
  salon: salonIndustrySettingsSchema,
}

export function getIndustrySettingsSchema(verticalKey: VerticalKey): z.ZodTypeAny | null {
  return SCHEMAS[verticalKey] ?? null
}

export function parseIndustrySettings(verticalKey: VerticalKey, raw: unknown): Record<string, unknown> | null {
  const schema = getIndustrySettingsSchema(verticalKey)
  if (!schema) return null
  const r = schema.safeParse(raw ?? {})
  return r.success ? (r.data as Record<string, unknown>) : null
}
