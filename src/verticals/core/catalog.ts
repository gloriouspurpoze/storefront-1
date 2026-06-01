/** Catalog kinds (services, menu items, treatments, …) per vertical pack. */

export interface CatalogCustomFieldDef {
  key: string
  label: string
  type: 'string' | 'number' | 'enum' | 'date' | 'boolean'
  required?: boolean
  options?: string[]
}

export interface CatalogKindDef {
  key: string
  label: string
  supportsDuration?: boolean
  supportsModifiers?: boolean
  supportsAllergens?: boolean
  supportsSkillRequired?: boolean
  customFields?: CatalogCustomFieldDef[]
}
