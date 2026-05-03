import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Loader2 } from 'lucide-react'
import { ThemeProvider } from './contexts/theme-context'
import { CommandPaletteProvider } from './contexts/command-palette-context'
import { AppMuiThemeProvider } from './components/providers/AppMuiThemeProvider'
import { CommandPalette } from './components/command-palette/CommandPalette'
import { DataProvider } from './contexts/data-context'
import { SidebarProvider } from './contexts/sidebar-context'
import { store } from './store'
import { MainLayout } from './components/layout/main-layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'
import { OneSignalWeb } from './components/push/OneSignalWeb'
import { LoadingProvider } from './components/providers/LoadingProvider'
import { ToastProvider } from './components/providers/ToastProvider'
import { AppDialogsProvider } from './components/providers/AppDialogsProvider'
import { Toaster } from './components/ui'

// Route-level code splitting (industry standard for performance)
const Auth = lazy(() => import('./pages/auth/auth').then((m) => ({ default: m.Auth })))
const Signup = lazy(() => import('./pages/auth/signup').then((m) => ({ default: m.Signup })))
const Unauthorized = lazy(() => import('./pages/auth/unauthorized'))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

const SmartDashboard = lazy(() => import('./pages/dashboard/smart-dashboard').then((m) => ({ default: m.SmartDashboard })))
const Analytics = lazy(() => import('./pages/dashboard/analytics').then((m) => ({ default: m.Analytics })))
const AdminEarningsOverview = lazy(() => import('./pages/payments/admin-earnings-overview').then((m) => ({ default: m.AdminEarningsOverview })))

const CrmDashboard = lazy(() => import('./pages/crm/crm-dashboard').then((m) => ({ default: m.CrmDashboard })))
const CrmLeads = lazy(() => import('./pages/crm/crm-leads').then((m) => ({ default: m.CrmLeads })))
const CrmContacts = lazy(() => import('./pages/crm/crm-contacts').then((m) => ({ default: m.CrmContacts })))
const CrmCompanies = lazy(() => import('./pages/crm/crm-companies').then((m) => ({ default: m.CrmCompanies })))
const CrmDeals = lazy(() => import('./pages/crm/crm-deals').then((m) => ({ default: m.CrmDeals })))
const CrmActivities = lazy(() => import('./pages/crm/crm-activities').then((m) => ({ default: m.CrmActivities })))
const CrmSettings = lazy(() => import('./pages/crm/crm-settings').then((m) => ({ default: m.CrmSettings })))

const TeamWorkHub = lazy(() => import('./pages/team-work/team-work-hub').then((m) => ({ default: m.TeamWorkHub })))
const TeamWorkCalendarPage = lazy(() =>
  import('./pages/team-work/team-work-calendar').then((m) => ({ default: m.TeamWorkCalendarPage })),
)

const Users = lazy(() => import('./pages/users/users').then((m) => ({ default: m.Users })))
const TeamMembers = lazy(() => import('./pages/users/users').then((m) => ({ default: m.TeamMembers })))
const Products = lazy(() => import('./pages/products/products').then((m) => ({ default: m.Products })))
const AddProduct = lazy(() => import('./pages/products/add-product').then((m) => ({ default: m.AddProduct })))
const CategoryHub = lazy(() => import('./pages/categories/category-hub'))
const CategoriesList = lazy(() => import('./pages/categories/categories-list'))
const CreateCategory = lazy(() => import('./pages/categories/create-category'))

const Services = lazy(() => import('./pages/services/services').then((m) => ({ default: m.Services })))
const CreateService = lazy(() => import('./pages/services/create-service').then((m) => ({ default: m.CreateService })))
const PlatformServices = lazy(() => import('./pages/services/platform-services-enhanced').then((m) => ({ default: m.PlatformServicesEnhanced })))
const Marketplace = lazy(() => import('./pages/marketplace/Marketplace'))
const EcommerceHub = lazy(() => import('./pages/ecommerce/EcommerceHub'))
const BazaarMarketplaceHub = lazy(() => import('./pages/bazaar/BazaarMarketplaceHub'))
const BazaarListingModeration = lazy(() => import('./pages/bazaar/BazaarListingModeration'))
const BazaarProVerifyModeration = lazy(() => import('./pages/bazaar/BazaarProVerifyModeration'))
const InventoryManagement = lazy(() => import('./pages/inventory/InventoryManagement'))

const Providers = lazy(() => import('./pages/providers/providers').then((m) => ({ default: m.Providers })))
const CreateProvider = lazy(() => import('./pages/providers/create-provider').then((m) => ({ default: m.CreateProvider })))
const EditProvider = lazy(() => import('./pages/providers/edit-provider').then((m) => ({ default: m.EditProvider })))
const ProviderDashboard = lazy(() => import('./pages/providers/provider-dashboard').then((m) => ({ default: m.ProviderDashboard })))
const ProviderBookings = lazy(() => import('./pages/bookings/provider-bookings').then((m) => ({ default: m.ProviderBookings })))
const ProviderProfile = lazy(() => import('./pages/providers/provider-profile').then((m) => ({ default: m.ProviderProfile })))
const ProviderEarnings = lazy(() => import('./pages/providers/provider-earnings').then((m) => ({ default: m.ProviderEarnings })))

const Professionals = lazy(() => import('./pages/professionals/professionals').then((m) => ({ default: m.Professionals })))
const CreateProfessional = lazy(() => import('./pages/professionals/create-professional').then((m) => ({ default: m.CreateProfessional })))
const EditProfessional = lazy(() => import('./pages/professionals/edit-professional').then((m) => ({ default: m.EditProfessional })))
const ProfessionalDashboard = lazy(() => import('./pages/professionals/professional-dashboard').then((m) => ({ default: m.ProfessionalDashboard })))
const ProfessionalBookings = lazy(() => import('./pages/bookings/professional-bookings').then((m) => ({ default: m.ProfessionalBookings })))
const ProfessionalProfile = lazy(() => import('./pages/professionals/professional-profile').then((m) => ({ default: m.ProfessionalProfile })))
const ProfessionalEarningsWallet = lazy(() => import('./pages/professionals/professional-earnings-wallet').then((m) => ({ default: m.ProfessionalEarningsWallet })))
const ProfessionalReviews = lazy(() => import('./pages/professionals/professional-reviews').then((m) => ({ default: m.ProfessionalReviews })))
const ProfessionalDocuments = lazy(() => import('./pages/professionals/professional-documents').then((m) => ({ default: m.ProfessionalDocuments })))
const ProfessionalServices = lazy(() => import('./pages/professionals/professional-services').then((m) => ({ default: m.ProfessionalServices })))
const ProfessionalSettings = lazy(() => import('./pages/professionals/professional-settings').then((m) => ({ default: m.ProfessionalSettings })))
const ProviderApplications = lazy(() => import('./pages/professionals/provider-applications').then((m) => ({ default: m.ProviderApplications })))

const Bookings = lazy(() => import('./pages/bookings/bookings').then((m) => ({ default: m.Bookings })))
const BookingDetails = lazy(() => import('./pages/bookings/booking-details').then((m) => ({ default: m.BookingDetails })))
const Orders = lazy(() => import('./pages/orders/orders').then((m) => ({ default: m.Orders })))
const Quotes = lazy(() => import('./pages/operations/quotes').then((m) => ({ default: m.Quotes })))
const ServiceRequests = lazy(() => import('./pages/operations/service-requests').then((m) => ({ default: m.ServiceRequests })))

const Payments = lazy(() => import('./pages/payments/payments').then((m) => ({ default: m.Payments })))
const Invoices = lazy(() => import('./pages/payments/invoices').then((m) => ({ default: m.Invoices })))
const InvoiceCreate = lazy(() =>
  import('./pages/payments/invoice-create').then((m) => ({ default: m.InvoiceCreate }))
)
const InvoiceBrandingPage = lazy(() =>
  import('./pages/payments/invoice-branding').then((m) => ({ default: m.InvoiceBrandingPage }))
)

const Messages = lazy(() => import('./pages/communication/messages').then((m) => ({ default: m.Messages })))
const ChatPage = lazy(() => import('./pages/communication/chat'))
const Notifications = lazy(() => import('./pages/communication/notifications').then((m) => ({ default: m.Notifications })))

const Settings = lazy(() => import('./pages/settings/settings').then((m) => ({ default: m.Settings })))
const Sliders = lazy(() => import('./pages/settings/sliders').then((m) => ({ default: m.Sliders })))
const SystemStatus = lazy(() => import('./pages/settings/system-status'))

const Coupons = lazy(() => import('./pages/marketing/coupons'))
const Referrals = lazy(() => import('./pages/marketing/referrals'))
const Support = lazy(() => import('./pages/support/support'))
const Reports = lazy(() => import('./pages/support/reports'))

const CMSDashboard = lazy(() => import('./pages/cms/CMSDashboard'))
const BannerManagement = lazy(() => import('./pages/cms/BannerManagement'))
const PromotionManagement = lazy(() => import('./pages/cms/PromotionManagement'))
const TestimonialManagement = lazy(() => import('./pages/cms/TestimonialManagement'))
const ReviewsManagement = lazy(() => import('./pages/cms/ReviewsManagement'))
const FAQManagement = lazy(() => import('./pages/cms/FAQManagement'))
const SEOManagement = lazy(() => import('./pages/cms/SEOManagement'))
const HomepageManagement = lazy(() => import('./pages/cms/HomepageManagement'))
const BlogManagement = lazy(() => import('./pages/cms/BlogManagement'))
const BlogEditorPage = lazy(() => import('./pages/cms/BlogEditorPage'))
const BlogCategoryManagement = lazy(() => import('./pages/cms/BlogCategoryManagement'))
const MediaLibrary = lazy(() => import('./pages/cms/MediaLibrary'))
const PageManagement = lazy(() => import('./pages/cms/PageManagement'))
const MenuManagement = lazy(() => import('./pages/cms/MenuManagement'))
const NewsletterManagement = lazy(() => import('./pages/cms/NewsletterManagement'))
const SocialLinksManagement = lazy(() => import('./pages/cms/SocialLinksManagement'))
const RateCardManagement = lazy(() => import('./pages/cms/RateCardManagement'))
const CategoryMarketingManagement = lazy(() => import('./pages/cms/CategoryMarketingManagement'))
const CrossLinkingManagement = lazy(() => import('./pages/cms/CrossLinkingManagement'))

const RouteFallback = (
  <div className="flex min-h-[280px] w-full items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
  </div>
)

function App() {
  return (
    <Provider store={store}>
      <OneSignalWeb />
      <ThemeProvider>
        <AppMuiThemeProvider>
        <AppDialogsProvider>
        <DataProvider>
          <Router>
          <CommandPaletteProvider>
            <Suspense fallback={RouteFallback}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes with RBAC */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <MainLayout>
                    <Routes>
                      {/* Dashboard - accessible by most roles, redirects based on role */}
                      <Route 
                        path="/" 
                        element={
                          <RoleBasedRoute permissions={['view_dashboard']}>
                            <SmartDashboard />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Products */}
                      <Route 
                        path="/products" 
                        element={
                          <RoleBasedRoute permissions={['view_products']}>
                            <Products />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/products/add" 
                        element={
                          <RoleBasedRoute permissions={['create_products']}>
                            <AddProduct />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/products/edit/:id" 
                        element={
                          <RoleBasedRoute permissions={['edit_products']}>
                            <AddProduct />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/products/view/:id" 
                        element={
                          <RoleBasedRoute permissions={['view_products']}>
                            <AddProduct />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Categories — hub + separate product / service lists and forms */}
                      <Route
                        path="/categories"
                        element={
                          <RoleBasedRoute permissions={['view_categories']}>
                            <CategoryHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/create"
                        element={<Navigate to="/categories/products/create" replace />}
                      />
                      <Route
                        path="/categories/:scope/create"
                        element={
                          <RoleBasedRoute permissions={['create_categories']}>
                            <CreateCategory />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/:scope/edit/:id"
                        element={
                          <RoleBasedRoute permissions={['edit_categories']}>
                            <CreateCategory />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/:scope/view/:id"
                        element={
                          <RoleBasedRoute permissions={['view_categories']}>
                            <CreateCategory />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/edit/:id"
                        element={
                          <RoleBasedRoute permissions={['edit_categories']}>
                            <CreateCategory />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/view/:id"
                        element={
                          <RoleBasedRoute permissions={['view_categories']}>
                            <CreateCategory />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/categories/:scope"
                        element={
                          <RoleBasedRoute permissions={['view_categories']}>
                            <CategoriesList />
                          </RoleBasedRoute>
                        }
                      />
                      
                      {/* Services */}
                      <Route 
                        path="/services" 
                        element={
                          <RoleBasedRoute permissions={['view_services']}>
                            <Services />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Platform Services */}
                      <Route 
                        path="/platform-services" 
                        element={
                          <RoleBasedRoute permissions={['view_services']}>
                            <PlatformServices />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route
                        path="/marketplace"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_services',
                              'view_categories',
                              'view_bookings',
                              'view_providers',
                              'view_payments',
                              'manage_coupons',
                              'manage_system_settings',
                            ]}
                          >
                            <Marketplace />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/ecommerce"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_products',
                              'create_products',
                              'view_categories',
                              'view_orders',
                              'manage_coupons',
                              'manage_system_settings',
                              'view_settings',
                            ]}
                          >
                            <EcommerceHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/bazaar"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_products',
                              'create_products',
                              'view_categories',
                              'view_orders',
                              'manage_coupons',
                              'manage_system_settings',
                              'view_settings',
                            ]}
                          >
                            <BazaarMarketplaceHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/bazaar/listing-review"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_products',
                              'create_products',
                              'view_categories',
                              'view_orders',
                              'manage_coupons',
                              'manage_system_settings',
                              'view_settings',
                            ]}
                          >
                            <BazaarListingModeration />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/bazaar/pro-verify"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_products',
                              'create_products',
                              'view_categories',
                              'view_orders',
                              'manage_coupons',
                              'manage_system_settings',
                              'view_settings',
                            ]}
                          >
                            <BazaarProVerifyModeration />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/inventory"
                        element={
                          <RoleBasedRoute
                            permissions={['view_products', 'edit_products', 'manage_product_inventory']}
                          >
                            <InventoryManagement />
                          </RoleBasedRoute>
                        }
                      />
                      <Route 
                        path="/platform-services/create" 
                        element={
                          <RoleBasedRoute permissions={['create_services']}>
                            <CreateService />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/platform-services/edit/:id" 
                        element={
                          <RoleBasedRoute permissions={['edit_services']}>
                            <CreateService />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Service Requests */}
                      <Route 
                        path="/requests" 
                        element={
                          <RoleBasedRoute permissions={['view_services']}>
                            <ServiceRequests />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Quotes */}
                      <Route 
                        path="/quotes" 
                        element={
                          <RoleBasedRoute permissions={['view_quotes']}>
                            <Quotes />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Bookings */}
                      <Route 
                        path="/bookings" 
                        element={
                          <RoleBasedRoute permissions={['view_bookings']}>
                            <Bookings />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/bookings/:id" 
                        element={
                          <RoleBasedRoute permissions={['view_bookings']}>
                            <BookingDetails />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Payments */}
                      <Route 
                        path="/payments" 
                        element={
                          <RoleBasedRoute permissions={['view_payments']}>
                            <Payments />
                          </RoleBasedRoute>
                        } 
                      />

                      {/* Invoices */}
                      <Route 
                        path="/invoices/create" 
                        element={
                          <RoleBasedRoute permissions={['view_payments']}>
                            <InvoiceCreate />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route
                        path="/invoices/branding"
                        element={
                          <RoleBasedRoute permissions={['view_payments']}>
                            <InvoiceBrandingPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route 
                        path="/invoices" 
                        element={
                          <RoleBasedRoute permissions={['view_payments']}>
                            <Invoices />
                          </RoleBasedRoute>
                        } 
                      />

                      {/* Earnings & Payouts */}
                      <Route 
                        path="/payouts" 
                        element={
                          <RoleBasedRoute permissions={['view_payments']}>
                            <AdminEarningsOverview />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Users - Admin only */}
                      <Route 
                        path="/users" 
                        element={
                          <RoleBasedRoute permissions={['view_users']}>
                            <Users />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route
                        path="/users/members"
                        element={
                          <RoleBasedRoute permissions={['view_users']}>
                            <TeamMembers />
                          </RoleBasedRoute>
                        }
                      />

                      {/* Providers */}
                      <Route 
                        path="/providers" 
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <Providers />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/providers/create" 
                        element={
                          <RoleBasedRoute permissions={['create_providers']}>
                            <CreateProvider />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route
                        path="/providers/edit/:id" 
                        element={
                          <RoleBasedRoute permissions={['edit_providers']}>
                            <EditProvider />
                          </RoleBasedRoute>
                        } 
                      />

                      {/* Professionals */}
                      <Route 
                        path="/professionals" 
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <Professionals />
                          </RoleBasedRoute>
                        }
                      />
                      <Route 
                        path="/provider-applications" 
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <ProviderApplications />
                          </RoleBasedRoute>
                        }
                      />
                      <Route 
                        path="/professionals/create" 
                        element={
                          <RoleBasedRoute permissions={['create_providers']}>
                            <CreateProfessional />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/professionals/edit/:id"
                        element={
                          <RoleBasedRoute permissions={['edit_providers']}>
                            <EditProfessional />
                          </RoleBasedRoute>
                        }
                      />

                      {/* Professional Portal Routes */}
                      <Route 
                        path="/professional/dashboard" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/bookings" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalBookings />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/earnings" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalEarningsWallet />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/profile" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/reviews" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalReviews />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/documents" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalDocuments />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/services" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalServices />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/settings" 
                        element={
                          <ProtectedRoute requiredRole="professional">
                            <ProfessionalSettings />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Sliders */}
                      <Route 
                        path="/sliders" 
                        element={
                          <RoleBasedRoute permissions={['view_settings']}>
                            <Sliders />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Coupons */}
                      <Route 
                        path="/coupons" 
                        element={
                          <RoleBasedRoute permissions={['manage_coupons']}>
                            <Coupons />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Referrals */}
                      <Route 
                        path="/referrals" 
                        element={
                          <RoleBasedRoute permissions={['manage_referrals']}>
                            <Referrals />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Analytics - Manager and above */}
                      <Route 
                        path="/analytics" 
                        element={
                          <RoleBasedRoute permissions={['view_analytics']}>
                            <Analytics />
                          </RoleBasedRoute>
                        } 
                      />

                      {/* CRM */}
                      <Route
                        path="/crm"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmDashboard />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/leads"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmLeads />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/contacts"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmContacts />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/companies"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmCompanies />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/deals"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmDeals />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/activities"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmActivities />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/crm/settings"
                        element={
                          <RoleBasedRoute permissions={['view_crm']}>
                            <CrmSettings />
                          </RoleBasedRoute>
                        }
                      />

                      <Route
                        path="/team-work"
                        element={
                          <RoleBasedRoute permissions={['view_team_tasks']}>
                            <TeamWorkHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/team-work/calendar"
                        element={
                          <RoleBasedRoute permissions={['view_team_tasks']}>
                            <TeamWorkCalendarPage />
                          </RoleBasedRoute>
                        }
                      />
                      
                      {/* Messages */}
                      <Route 
                        path="/messages" 
                        element={
                          <RoleBasedRoute permissions={['view_messages']}>
                            <Messages />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Chat */}
                      <Route 
                        path="/chat" 
                        element={
                          <RoleBasedRoute permissions={['view_messages']}>
                            <ChatPage />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Orders */}
                      <Route 
                        path="/orders" 
                        element={
                          <RoleBasedRoute permissions={['view_orders']}>
                            <Orders />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Settings */}
                      <Route 
                        path="/settings" 
                        element={
                          <RoleBasedRoute permissions={['view_settings']}>
                            <Settings />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Notifications */}
                      <Route 
                        path="/notifications" 
                        element={
                          <RoleBasedRoute permissions={['view_notifications']}>
                            <Notifications />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      
                      {/* Support - All authenticated users */}
                      <Route 
                        path="/support" 
                        element={
                          <RoleBasedRoute permissions={['view_dashboard']}>
                            <Support />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Reports - Manager and above */}
                      <Route 
                        path="/reports" 
                        element={
                          <RoleBasedRoute permissions={['view_reports']}>
                            <Reports />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* System Status - Admin only */}
                      <Route 
                        path="/system-status" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <SystemStatus />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* CMS - Content Management System - Admin only */}
                      <Route 
                        path="/cms" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <CMSDashboard />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/homepage" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <HomepageManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/homepage/new" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <HomepageManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/homepage/:id" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <HomepageManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/banners" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <BannerManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/promotions" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <PromotionManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/testimonials" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <TestimonialManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/reviews" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <ReviewsManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/faqs" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <FAQManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/seo" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <SEOManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route
                        path="/cms/blogs/new"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <BlogEditorPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/cms/blogs/:postId/edit"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <BlogEditorPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route 
                        path="/cms/blogs" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <BlogManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/blog-categories" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <BlogCategoryManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/media" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <MediaLibrary />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/pages" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <PageManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/menus" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <MenuManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/newsletter" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <NewsletterManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/social-links" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <SocialLinksManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/rate-card" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <RateCardManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/category-marketing" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <CategoryMarketingManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/cms/cross-linking" 
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <CrossLinkingManagement />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Provider Routes - For Service Providers */}
                      <Route 
                        path="/provider/dashboard" 
                        element={
                          <ProtectedRoute requiredRole="provider">
                            <ProviderDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/bookings" 
                        element={
                          <ProtectedRoute requiredRole="provider">
                            <ProviderBookings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/earnings" 
                        element={
                          <ProtectedRoute requiredRole="provider">
                            <ProviderEarnings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/profile" 
                        element={
                          <ProtectedRoute requiredRole="provider">
                            <ProviderProfile />
                          </ProtectedRoute>
                        } 
                      />

                      {/* 404 - catch-all: must be last */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </MainLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
            </Suspense>
            <CommandPalette />
          {/* shadcn/ui Toaster */}
          <Toaster />
          <ToastProvider />
          <LoadingProvider />
          </CommandPaletteProvider>
          </Router>
        </DataProvider>
        </AppDialogsProvider>
        </AppMuiThemeProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App