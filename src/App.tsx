import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ThemeProvider } from './contexts/theme-context'
import { DataProvider } from './contexts/data-context'
import { SidebarProvider } from './contexts/sidebar-context'
import { store } from './store'
import { MainLayout } from './components/layout/main-layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleBasedRoute } from './components/auth/RoleBasedRoute'
import { ToastProvider } from './components/providers/ToastProvider'
import { LoadingProvider } from './components/providers/LoadingProvider'
// Dashboard
import { Dashboard } from './pages/dashboard/dashboard'
import { SmartDashboard } from './pages/dashboard/smart-dashboard'
import { Analytics } from './pages/dashboard/analytics'

// Auth
import { Auth } from './pages/auth/auth'
import { Signup } from './pages/auth/signup'
import Unauthorized from './pages/auth/unauthorized'

// Users
import { Users } from './pages/users/users'

// Products
import { Products } from './pages/products/products'
import { AddProduct } from './pages/products/add-product'

// Categories
import CategoriesList from './pages/categories/categories-list'
import CreateCategory from './pages/categories/create-category'

// Services
import { Services } from './pages/services/services'
import { CreateService } from './pages/services/create-service'
import { PlatformServicesEnhanced as PlatformServices } from './pages/services/platform-services-enhanced'

// Providers
import { Providers } from './pages/providers/providers'
import { CreateProvider } from './pages/providers/create-provider'
import { EditProvider } from './pages/providers/edit-provider'
import { ProviderDashboard } from './pages/providers/provider-dashboard'
import { ProviderBookings } from './pages/bookings/provider-bookings'
import { ProviderProfile } from './pages/providers/provider-profile'
import { ProviderEarnings } from './pages/providers/provider-earnings'

// Professionals
import { Professionals } from './pages/professionals/professionals'
import { CreateProfessional } from './pages/professionals/create-professional'
import { ProfessionalDashboard } from './pages/professionals/professional-dashboard'
import { ProfessionalBookings } from './pages/bookings/professional-bookings'
import { ProfessionalProfile } from './pages/professionals/professional-profile'
import { ProfessionalEarningsWallet } from './pages/professionals/professional-earnings-wallet'
import { ProfessionalReviews } from './pages/professionals/professional-reviews'
import { ProfessionalDocuments } from './pages/professionals/professional-documents'
import { ProfessionalServices } from './pages/professionals/professional-services'
import { ProfessionalSettings } from './pages/professionals/professional-settings'

// Bookings
import { Bookings } from './pages/bookings/bookings'
import { BookingDetails } from './pages/bookings/booking-details'

// Orders
import { Orders } from './pages/orders/orders'
import { Quotes } from './pages/orders/quotes'
import { ServiceRequests } from './pages/orders/service-requests'

// Payments
import { Payments } from './pages/payments/payments'
import { Invoices } from './pages/payments/invoices'
import { AdminEarningsOverview } from './pages/dashboard/admin-earnings-overview'

// Communication
import { Messages } from './pages/communication/messages'
import ChatPage from './pages/communication/chat'
import { Notifications } from './pages/communication/notifications'

// Settings
import { Settings } from './pages/settings/settings'
import { Sliders } from './pages/settings/sliders'
import SystemStatus from './pages/settings/system-status'

// Marketing
import Coupons from './pages/marketing/coupons'
import Referrals from './pages/marketing/referrals'

// Support
import Support from './pages/support/support'
import Reports from './pages/support/reports'

// CMS
import CMSDashboard from './pages/cms/CMSDashboard'
import BannerManagement from './pages/cms/BannerManagement'
import PromotionManagement from './pages/cms/PromotionManagement'
import TestimonialManagement from './pages/cms/TestimonialManagement'
import FAQManagement from './pages/cms/FAQManagement'
import SEOManagement from './pages/cms/SEOManagement'
import HomepageManagement from './pages/cms/HomepageManagement'
import BlogManagement from './pages/cms/BlogManagement'
import BlogCategoryManagement from './pages/cms/BlogCategoryManagement'
import MediaLibrary from './pages/cms/MediaLibrary'
import PageManagement from './pages/cms/PageManagement'
import MenuManagement from './pages/cms/MenuManagement'

import { Toaster } from './components/ui'

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <DataProvider>
          <Router>
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
                    </Routes>
                    </MainLayout>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
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