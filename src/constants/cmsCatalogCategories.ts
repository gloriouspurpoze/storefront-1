/**
 * Industry-level catalog categories for CMS: Rate Card, Category Marketing, Cross-Linking.
 * Must match slugs used on client (e.g. getCategoryParts, getCategoryMarketing, getCommonProblems).
 */

export const CMS_CATALOG_CATEGORIES = [
  { value: 'ac', label: 'AC' },
  { value: 'plumb', label: 'Plumbing' },
  { value: 'electric', label: 'Electrical' },
  { value: 'appliance', label: 'Appliances' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'pest-control', label: 'Pest Control' },
  { value: 'default', label: 'Default (other categories)' },
] as const;

export type CMSCatalogCategoryValue = (typeof CMS_CATALOG_CATEGORIES)[number]['value'];
