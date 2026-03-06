import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Box, CircularProgress } from '@mui/material'
import { ThemeProvider } from './contexts/theme-context'
import { DataProvider } from './contexts/data-context'
import { SidebarProvider } from './contexts/sidebar-context'
import { store } from './store'
import { MainLayout } from './components/layout/main-layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'
import { LoadingProvider } from './components/providers/LoadingProvider'
import { Toaster } from './components/ui'

// Route-level code splitting (industry standard for performance)
const Auth = lazy(() => import('./pages/auth/auth').then((m) => ({ default: m.Auth })))
const Signup = lazy(() => import('./pages/auth/signup').then((m) => ({ default: m.Signup })))
const Unauthorized = lazy(() => import('./pages/auth/unauthorized'))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

const SmartDashboard = lazy(() => import('./pages/dashboard/smart-dashboard').then((m) => ({ default: m.SmartDashboard })))
const Dashboard = lazy(() => import('./pages/dashboard/dashboard').then((m) => ({ default: m.Dashboard })))
const Analytics = lazy(() => import('./pages/dashboard/analytics').then((m) => ({ default: m.Analytics })))
const AdminEarningsOverview = lazy(() => import('./pages/dashboard/admin-earnings-overview').then((m) => ({ default: m.AdminEarningsOverview })))

const Users = lazy(() => import('./pages/users/users').then((m) => ({ default: m.Users })))
const Products = lazy(() => import('./pages/products/products').then((m) => ({ default: m.Products })))
const AddProduct = lazy(() => import('./pages/products/add-product').then((m) => ({ default: m.AddProduct })))
const CategoriesList = lazy(() => import('./pages/categories/categories-list'))
const CreateCategory = lazy(() => import('./pages/categories/create-category'))

const Services = lazy(() => import('./pages/services/services').then((m) => ({ default: m.Services })))
const CreateService = lazy(() => import('./pages/services/create-service').then((m) => ({ default: m.CreateService })))
const PlatformServices = lazy(() => import('./pages/services/platform-services-enhanced').then((m) => ({ default: m.PlatformServicesEnhanced })))

const Providers = lazy(() => import('./pages/providers/providers').then((m) => ({ default: m.Providers })))
const CreateProvider = lazy(() => import('./pages/providers/create-provider').then((m) => ({ default: m.CreateProvider })))
const EditProvider = lazy(() => import('./pages/providers/edit-provider').then((m) => ({ default: m.EditProvider })))
const ProviderDashboard = lazy(() => import('./pages/providers/provider-dashboard').then((m) => ({ default: m.ProviderDashboard })))
const ProviderBookings = lazy(() => import('./pages/bookings/provider-bookings').then((m) => ({ default: m.ProviderBookings })))
const ProviderProfile = lazy(() => import('./pages/providers/provider-profile').then((m) => ({ default: m.ProviderProfile })))
const ProviderEarnings = lazy(() => import('./pages/providers/provider-earnings').then((m) => ({ default: m.ProviderEarnings })))

const Professionals = lazy(() => import('./pages/professionals/professionals').then((m) => ({ default: m.Professionals })))
const CreateProfessional = lazy(() => import('./pages/professionals/create-professional').then((m) => ({ default: m.CreateProfessional })))
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
const Quotes = lazy(() => import('./pages/orders/quotes').then((m) => ({ default: m.Quotes })))
const ServiceRequests = lazy(() => import('./pages/orders/service-requests').then((m) => ({ default: m.ServiceRequests })))

const Payments = lazy(() => import('./pages/payments/payments').then((m) => ({ default: m.Payments })))
const Invoices = lazy(() => import('./pages/payments/invoices').then((m) => ({ default: m.Invoices })))

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
const FAQManagement = lazy(() => import('./pages/cms/FAQManagement'))
const SEOManagement = lazy(() => import('./pages/cms/SEOManagement'))
const HomepageManagement = lazy(() => import('./pages/cms/HomepageManagement'))
const BlogManagement = lazy(() => import('./pages/cms/BlogManagement'))
const BlogCategoryManagement = lazy(() => import('./pages/cms/BlogCategoryManagement'))
const MediaLibrary = lazy(() => import('./pages/cms/MediaLibrary'))
const PageManagement = lazy(() => import('./pages/cms/PageManagement'))
const MenuManagement = lazy(() => import('./pages/cms/MenuManagement'))
const NewsletterManagement = lazy(() => import('./pages/cms/NewsletterManagement'))
const SocialLinksManagement = lazy(() => import('./pages/cms/SocialLinksManagement'))

const RouteFallback = (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, width: '100%' }}>
    <CircularProgress size={40} />
  </Box>
)

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <DataProvider>
          <Router>
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
                      
                      {/* Categories */}
                      <Route 
                        path="/categories" 
                        element={
                          <RoleBasedRoute permissions={['view_categories']}>
                            <CategoriesList />
                          </RoleBasedRoute>
                        } 
                      />
                      <Route 
                        path="/categories/create" 
                        element={
                          <RoleBasedRoute permissions={['create_categories']}>
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
                          <RoleBasedRoute permissions={['view_dashboard']}>
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

                      {/* Professional Portal Routes */}
                      <Route 
                        path="/professional/dashboard" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/bookings" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalBookings />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/earnings" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalEarningsWallet />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/profile" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalProfile />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/reviews" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalReviews />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/documents" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalDocuments />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/services" 
                        element={
                          <ProtectedRoute>
                            <ProfessionalServices />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/professional/settings" 
                        element={
                          <ProtectedRoute>
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
                      
                      {/* Provider Routes - For Service Providers */}
                      <Route 
                        path="/provider/dashboard" 
                        element={
                          <ProtectedRoute>
                            <ProviderDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/bookings" 
                        element={
                          <ProtectedRoute>
                            <ProviderBookings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/earnings" 
                        element={
                          <ProtectedRoute>
                            <ProviderEarnings />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/provider/profile" 
                        element={
                          <ProtectedRoute>
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
          </Router>
          {/* shadcn/ui Toaster */}
          <Toaster />
          {/* <ToastProvider /> */}
          <LoadingProvider />
        </DataProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App