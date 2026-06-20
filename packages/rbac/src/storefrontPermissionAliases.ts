import type { Permission } from '../../types/src/rbac.types'

/** Granular storefront permissions (Storefront Studio). */
export const STOREFRONT_GRANULAR_PERMISSIONS = [
  'view_storefront',
  'edit_storefront_branding',
  'edit_storefront_theme',
  'edit_storefront_sections',
  'edit_storefront_seo',
  'edit_storefront_content',
  'manage_storefront_domains',
  'manage_storefront_addons',
] as const satisfies readonly Permission[]

export type StorefrontGranularPermission = (typeof STOREFRONT_GRANULAR_PERMISSIONS)[number]

/**
 * Umbrella keys that satisfy a granular storefront requirement (backward compatible with view_cms / manage_cms).
 * Used by hasPermission (frontend) and expandPermissionRequirement (backend).
 */
export const STOREFRONT_PERMISSION_SATISFIERS: Record<string, readonly string[]> = {
  view_storefront: ['view_cms', 'manage_cms', 'view_settings', 'edit_settings'],
  edit_storefront_branding: ['manage_cms', 'edit_settings'],
  edit_storefront_theme: ['manage_cms', 'edit_settings'],
  edit_storefront_sections: ['manage_cms', 'edit_settings'],
  edit_storefront_seo: ['manage_cms', 'edit_settings'],
  edit_storefront_content: ['manage_cms', 'edit_settings'],
  manage_storefront_domains: ['manage_cms', 'edit_settings'],
  manage_storefront_addons: ['manage_cms', 'edit_settings'],
}

/** Expand a required permission to all keys that satisfy it (requirement + umbrellas + granular key). */
export function expandStorefrontRequirement(requirement: string): string[] {
  const satisfiers = STOREFRONT_PERMISSION_SATISFIERS[requirement]
  if (!satisfiers?.length) return [requirement]
  return Array.from(new Set([requirement, ...satisfiers]))
}

/** True if `held` satisfies `required` (direct match or umbrella alias). */
export function storefrontPermissionSatisfied(held: string, required: string): boolean {
  if (held === required) return true
  const satisfiers = STOREFRONT_PERMISSION_SATISFIERS[required]
  return satisfiers?.includes(held) ?? false
}
