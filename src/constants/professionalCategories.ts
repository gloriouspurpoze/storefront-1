/**
 * Trade / service category values used for professionals (list filter, create/edit, display).
 * Keep in sync with backend `category` query and professional `categories` field.
 */
export const PROFESSIONAL_TRADE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'cleaner', label: 'Cleaner' },
  { value: 'ac_technician', label: 'AC Technician' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'pest_control', label: 'Pest Control' },
]

export function getProfessionalCategoryLabel(value: string): string {
  return PROFESSIONAL_TRADE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
