/** Human label for a permission key (view_bookings → View bookings). */
export function formatPermissionLabel(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
