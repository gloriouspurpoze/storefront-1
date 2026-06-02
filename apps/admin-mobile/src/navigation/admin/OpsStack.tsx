import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { BookingsListScreen } from '@/features/bookings/screens/BookingsListScreen'
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen'
import { CreateBookingWizardScreen } from '@/features/bookings/screens/CreateBookingWizardScreen'
import { ProviderApplicationsScreen } from '@/features/approvals/screens/ProviderApplicationsScreen'
import { DisputeCasesScreen } from '@/features/approvals/screens/DisputeCasesScreen'
import { OpsHubScreen } from '@/features/ops/screens/OpsHubScreen'
import { ProfessionalsListScreen } from '@/features/professionals/screens/ProfessionalsListScreen'
import { ProfessionalDetailScreen } from '@/features/professionals/screens/ProfessionalDetailScreen'
import { LiveMapScreen } from '@/features/professionals/screens/LiveMapScreen'
import { ServiceRequestsListScreen } from '@/features/service-requests/screens/ServiceRequestsListScreen'
import { ServiceRequestDetailScreen } from '@/features/service-requests/screens/ServiceRequestDetailScreen'
import type { OpsStackParamList } from '@/navigation/types'
import { palette } from '@/theme'

const Stack = createNativeStackNavigator<OpsStackParamList>()

export function OpsStack() {
  return (
    <Stack.Navigator
      initialRouteName="OpsHub"
      screenOptions={{
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.canvasSoft },
      }}
    >
      <Stack.Screen name="OpsHub" component={OpsHubScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreateBookingWizard"
        component={CreateBookingWizardScreen}
        options={{ title: 'New booking' }}
      />
      <Stack.Screen name="BookingsList" component={BookingsListScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <Stack.Screen
        name="ProviderApplications"
        component={ProviderApplicationsScreen}
        options={{ title: 'Applications' }}
      />
      <Stack.Screen name="LiveMap" component={LiveMapScreen} options={{ title: 'Live map', headerShown: false }} />
      <Stack.Screen
        name="ProfessionalsList"
        component={ProfessionalsListScreen}
        options={{ title: 'Professionals' }}
      />
      <Stack.Screen
        name="ProfessionalDetail"
        component={ProfessionalDetailScreen}
        options={{ title: 'Professional' }}
      />
      <Stack.Screen name="DisputeCases" component={DisputeCasesScreen} options={{ title: 'Disputes' }} />
      <Stack.Screen
        name="ServiceRequestsList"
        component={ServiceRequestsListScreen}
        options={{ title: 'Requests' }}
      />
      <Stack.Screen
        name="ServiceRequestDetail"
        component={ServiceRequestDetailScreen}
        options={{ title: 'Request' }}
      />
    </Stack.Navigator>
  )
}
