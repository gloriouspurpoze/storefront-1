import type { LinkingOptions } from '@react-navigation/native'
import type { RootStackParamList } from '@/navigation/types'

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['profixer://', 'https://admin.profixer.in'],
  config: {
    screens: {
      Main: {
        screens: {
          OpsTab: {
            screens: {
              OpsHub: 'ops',
              BookingsList: 'bookings',
              BookingDetail: 'booking/:id',
              ProfessionalDetail: 'professional/:id',
              LiveMap: 'live-map',
              ProviderApplications: 'applications',
              DisputeCases: 'disputes',
            },
          },
          ChatTab: {
            screens: {
              ChatInbox: 'chat',
              ChatThread: 'chat/:threadId',
            },
          },
          InboxTab: {
            screens: {
              ApprovalsInbox: 'approvals',
              Notifications: 'notifications',
              RefundRequests: 'refunds',
              SupportTickets: 'tickets',
            },
          },
        },
      },
    },
  },
}
