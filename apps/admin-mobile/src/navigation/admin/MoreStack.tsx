import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { CatalogHubScreen } from '@/features/catalog/screens/CatalogHubScreen'
import { CategoriesListScreen } from '@/features/catalog/screens/CategoriesListScreen'
import { CreateCategoryScreen } from '@/features/catalog/screens/CreateCategoryScreen'
import { CreateProductScreen } from '@/features/catalog/screens/CreateProductScreen'
import { CreateServiceScreen } from '@/features/catalog/screens/CreateServiceScreen'
import { ProductsListScreen } from '@/features/catalog/screens/ProductsListScreen'
import { ServicesListScreen } from '@/features/catalog/screens/ServicesListScreen'
import { CrmContactFormScreen } from '@/features/crm/screens/CrmContactFormScreen'
import { CrmHubScreen } from '@/features/crm/screens/CrmHubScreen'
import { EarningsOverviewScreen } from '@/features/earnings/screens/EarningsOverviewScreen'
import { InvoiceDetailScreen } from '@/features/finance/screens/InvoiceDetailScreen'
import { InvoicesListScreen } from '@/features/finance/screens/InvoicesListScreen'
import { PaymentDetailScreen } from '@/features/finance/screens/PaymentDetailScreen'
import { PaymentsListScreen } from '@/features/finance/screens/PaymentsListScreen'
import { OrderDetailScreen } from '@/features/orders/screens/OrderDetailScreen'
import { OrdersListScreen } from '@/features/orders/screens/OrdersListScreen'
import { UserDetailScreen } from '@/features/users/screens/UserDetailScreen'
import { UsersListScreen } from '@/features/users/screens/UsersListScreen'
import { MoreHubScreen } from '@/features/settings/screens/MoreHubScreen'
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen'
import type { MoreStackParamList } from '@/navigation/types'
import { palette } from '@/theme'

const Stack = createNativeStackNavigator<MoreStackParamList>()

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.canvasSoft },
      }}
    >
      <Stack.Screen name="MoreHub" component={MoreHubScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="CatalogHub" component={CatalogHubScreen} options={{ title: 'Catalog' }} />
      <Stack.Screen name="ServicesList" component={ServicesListScreen} options={{ title: 'Services' }} />
      <Stack.Screen name="ProductsList" component={ProductsListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="CategoriesList" component={CategoriesListScreen} options={{ title: 'Categories' }} />
      <Stack.Screen name="CreateService" component={CreateServiceScreen} options={{ title: 'New service' }} />
      <Stack.Screen name="CreateCategory" component={CreateCategoryScreen} options={{ title: 'New category' }} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} options={{ title: 'New product' }} />
      <Stack.Screen name="CrmHub" component={CrmHubScreen} options={{ title: 'CRM' }} />
      <Stack.Screen name="CrmContactForm" component={CrmContactFormScreen} options={{ title: 'New contact' }} />
      <Stack.Screen name="EarningsOverview" component={EarningsOverviewScreen} options={{ title: 'Earnings' }} />
      <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: 'Invoices' }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice' }} />
      <Stack.Screen name="PaymentsList" component={PaymentsListScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="UsersList" component={UsersListScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'User' }} />
      <Stack.Screen name="OrdersList" component={OrdersListScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
    </Stack.Navigator>
  )
}
