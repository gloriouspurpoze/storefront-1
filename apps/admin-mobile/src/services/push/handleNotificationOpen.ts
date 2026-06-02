import {
  navigateToApprovalsInbox,
  navigateToBookingDetail,
  navigateToChatThread,
} from '@/lib/deepNavigation'

/** Maps push / deep-link paths to in-app navigation. */
export function handleNotificationOpen(urlOrPath: string) {
  const raw = urlOrPath.trim()
  const path = raw
    .replace(/^https?:\/\/[^/]+\/?/, '')
    .replace(/^profixer:\/\//, '')
    .replace(/^\//, '')

  if (path.startsWith('booking/')) {
    const id = path.split('/')[1]
    if (id) navigateToBookingDetail(id)
    return
  }
  if (path.startsWith('chat/')) {
    const threadId = path.split('/')[1]
    if (threadId) navigateToChatThread(threadId)
    return
  }
  if (path === 'refunds' || path.startsWith('support/refund')) {
    navigateToApprovalsInbox()
    return
  }
  if (path === 'applications' || path.startsWith('provider-applications')) {
    navigateToApprovalsInbox()
    return
  }
  if (path === 'approvals' || path.startsWith('inbox')) {
    navigateToApprovalsInbox()
  }
}
