import { navigationRef } from '@/navigation/navigationRef'

function go(name: string, params?: object) {
  if (!navigationRef.isReady()) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigationRef.navigate(name as any, params as any)
}

export function navigateToBookingDetail(bookingId: string) {
  go('Main', {
    screen: 'OpsTab',
    params: {
      screen: 'BookingDetail',
      params: { id: bookingId },
    },
  })
}

export function navigateToChatThread(threadId: string) {
  go('Main', {
    screen: 'ChatTab',
    params: {
      screen: 'ChatThread',
      params: { threadId },
    },
  })
}

export function navigateToApprovalsInbox() {
  go('Main', {
    screen: 'InboxTab',
    params: { screen: 'ApprovalsInbox' },
  })
}

export function navigateToProfessionalDetail(professionalId: string) {
  go('Main', {
    screen: 'OpsTab',
    params: {
      screen: 'ProfessionalDetail',
      params: { id: professionalId },
    },
  })
}

export function navigateToOrderDetail(orderId: string) {
  go('Main', {
    screen: 'MoreTab',
    params: {
      screen: 'OrderDetail',
      params: { id: orderId },
    },
  })
}
