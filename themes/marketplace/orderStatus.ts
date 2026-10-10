/** Sub-order status → buyer-facing label and badge tone. */
export function subOrderStatusView(status: string): { label: string; tone: 'good' | 'bad' | 'active' | 'neutral' } {
  switch (status) {
    case 'delivered':
    case 'completed':
      return { label: status === 'delivered' ? 'Delivered' : 'Completed', tone: 'good' }
    case 'shipped':
      return { label: 'Shipped', tone: 'active' }
    case 'processing':
    case 'confirmed':
    case 'pending':
      return { label: 'Preparing', tone: 'neutral' }
    case 'scheduled':
    case 'in_progress':
      return { label: status === 'scheduled' ? 'Scheduled' : 'In progress', tone: 'active' }
    case 'awaiting_handoff':
      return { label: 'Awaiting handoff', tone: 'neutral' }
    case 'cancelled':
    case 'refunded':
    case 'disputed':
      return { label: status.charAt(0).toUpperCase() + status.slice(1), tone: 'bad' }
    default:
      return { label: status.replace(/_/g, ' '), tone: 'neutral' }
  }
}
