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
import { LiveOpsAdminGate } from './components/ops/LiveOpsAdminGate'
import { LoadingProvider } from './components/providers/LoadingProvider'
import { ToastProvider } from './components/providers/ToastProvider'
import { AppDialogsProvider } from './components/providers/AppDialogsProvider'
import { Toaster } from './components/ui'
import type { Permission } from './types/rbac.types'

// Route-level code splitting (industry standard for performance)
const Auth = lazy(() => import('./pages/auth/auth').then((m) => ({ default: m.Auth })))
const AcceptTeamInvite = lazy(() =>
  import('./pages/auth/accept-team-invite').then((m) => ({ default: m.AcceptTeamInvite })),
)
const Signup = lazy(() => import('./pages/auth/signup').then((m) => ({ default: m.Signup })))
const Unauthorized = lazy(() => import('./pages/auth/unauthorized'))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

const SmartDashboard = lazy(() => import('./pages/dashboard/smart-dashboard').then((m) => ({ default: m.SmartDashboard })))
const Analytics = lazy(() => import('./pages/dashboard/analytics').then((m) => ({ default: m.Analytics })))
const GrowthFunnelsPage = lazy(() =>
  import('./pages/analytics/GrowthFunnelsPage').then((m) => ({ default: m.GrowthFunnelsPage })),
)
const AdminEarningsOverview = lazy(() => import('./pages/payments/admin-earnings-overview').then((m) => ({ default: m.AdminEarningsOverview })))

const FinanceLayout = lazy(() =>
  import('./pages/finance/finance-layout').then((m) => ({ default: m.FinanceLayout })),
)
const FinanceIndexRedirect = lazy(() =>
  import('./pages/finance/finance-layout').then((m) => ({ default: m.FinanceIndexRedirect })),
)
const FinanceOverviewPage = lazy(() =>
  import('./pages/finance/finance-overview').then((m) => ({ default: m.FinanceOverviewPage })),
)
const FinanceOperatingHubPage = lazy(() =>
  import('./pages/finance/finance-operating-hub').then((m) => ({ default: m.FinanceOperatingHubPage })),
)
const AmcLayout = lazy(() => import('./pages/amc/amc-layout').then((m) => ({ default: m.AmcLayout })))
const AmcIndexRedirect = lazy(() => import('./pages/amc/amc-layout').then((m) => ({ default: m.AmcIndexRedirect })))
const AmcOverviewPage = lazy(() => import('./pages/amc/amc-overview').then((m) => ({ default: m.AmcOverviewPage })))
const AmcContractsPage = lazy(() => import('./pages/amc/amc-contracts').then((m) => ({ default: m.AmcContractsPage })))
const AmcPackagesPage = lazy(() => import('./pages/amc/amc-packages').then((m) => ({ default: m.AmcPackagesPage })))
const AmcContractDetailPage = lazy(() =>
  import('./pages/amc/amc-contract-detail').then((m) => ({ default: m.AmcContractDetailPage })),
)
const CompanyDocumentsLayout = lazy(() =>
  import('./pages/company-documents/company-documents-layout').then((m) => ({
    default: m.CompanyDocumentsLayout,
  })),
)
const CompanyDocumentsIndexRedirect = lazy(() =>
  import('./pages/company-documents/company-documents-layout').then((m) => ({
    default: m.CompanyDocumentsIndexRedirect,
  })),
)
const CompanyDocumentsOverviewPage = lazy(() =>
  import('./pages/company-documents/company-documents-overview').then((m) => ({
    default: m.CompanyDocumentsOverviewPage,
  })),
)
const CompanyDocumentsTemplatesPage = lazy(() =>
  import('./pages/company-documents/company-documents-templates').then((m) => ({
    default: m.CompanyDocumentsTemplatesPage,
  })),
)
const CompanyDocumentsTemplateEditorPage = lazy(() =>
  import('./pages/company-documents/company-documents-template-editor').then((m) => ({
    default: m.CompanyDocumentsTemplateEditorPage,
  })),
)
const CompanyDocumentsEnvelopesPage = lazy(() =>
  import('./pages/company-documents/company-documents-envelopes').then((m) => ({
    default: m.CompanyDocumentsEnvelopesPage,
  })),
)
const RateCardsLayout = lazy(() =>
  import('./pages/rate-cards/rate-cards-layout').then((m) => ({ default: m.RateCardsLayout })),
)
const RateCardsIndexRedirect = lazy(() =>
  import('./pages/rate-cards/rate-cards-layout').then((m) => ({ default: m.RateCardsIndexRedirect })),
)
const RateCardsOverviewPage = lazy(() =>
  import('./pages/rate-cards/rate-cards-overview').then((m) => ({ default: m.RateCardsOverviewPage })),
)
const RateCardsCustomerPage = lazy(() => import('./pages/rate-cards/rate-cards-customer'))
const RateCardsProviderPage = lazy(() => import('./pages/rate-cards/rate-cards-provider'))
const RateCardsCatalogPage = lazy(() => import('./pages/rate-cards/rate-cards-catalog'))
const FinanceExpensesPage = lazy(() =>
  import('./pages/finance/finance-expenses').then((m) => ({ default: m.FinanceExpensesPage })),
)
const FinanceBudgetsPage = lazy(() =>
  import('./pages/finance/finance-budgets').then((m) => ({ default: m.FinanceBudgetsPage })),
)
const FinanceDirectoryPage = lazy(() =>
  import('./pages/finance/finance-directory').then((m) => ({ default: m.FinanceDirectoryPage })),
)
const FinanceReconciliationPage = lazy(() =>
  import('./pages/finance/finance-reconciliation').then((m) => ({ default: m.FinanceReconciliationPage })),
)
const FinanceRecurringPage = lazy(() =>
  import('./pages/finance/finance-recurring').then((m) => ({ default: m.FinanceRecurringPage })),
)

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
const StoreCategoryPlpManagement = lazy(() => import('./pages/ecommerce/StoreCategoryPlpManagement'))
const BazaarMarketplaceHub = lazy(() => import('./pages/bazaar/BazaarMarketplaceHub'))
const BazaarListingModeration = lazy(() => import('./pages/bazaar/BazaarListingModeration'))
const BazaarListingReviewDetailPage = lazy(() => import('./pages/bazaar/BazaarListingReviewDetailPage'))
const BazaarModuleSettingsPage = lazy(() => import('./pages/bazaar/BazaarModuleSettingsPage'))
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
const ProfessionalAdminHub = lazy(() =>
  import('./pages/professionals/professional-admin-hub').then((m) => ({ default: m.ProfessionalAdminHub })),
)
const ProfessionalsOperationsDashboard = lazy(() =>
  import('./pages/professionals/professionals-operations-dashboard').then((m) => ({
    default: m.ProfessionalsOperationsDashboard,
  })),
)
const ProfessionalsLiveLocations = lazy(() =>
  import('./pages/professionals/professionals-live-locations').then((m) => ({
    default: m.ProfessionalsLiveLocations,
  })),
)
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
const IndustryOperationsHub = lazy(() =>
  import('./pages/operations/IndustryOperationsHub').then((m) => ({ default: m.IndustryOperationsHub })),
)
const OpsCommandCenterPage = lazy(() =>
  import('./pages/operations/OpsCommandCenterPage').then((m) => ({ default: m.OpsCommandCenterPage })),
)
const TrustDisputesHubPage = lazy(() =>
  import('./pages/operations/TrustDisputesHubPage').then((m) => ({ default: m.TrustDisputesHubPage })),
)
const SupplyQualityPage = lazy(() =>
  import('./pages/operations/SupplyQualityPage').then((m) => ({ default: m.SupplyQualityPage })),
)
const PayoutTransparencyPage = lazy(() =>
  import('./pages/operations/PayoutTransparencyPage').then((m) => ({ default: m.PayoutTransparencyPage })),
)
const DisputeCasesPage = lazy(() =>
  import('./pages/operations/DisputeCasesPage').then((m) => ({ default: m.DisputeCasesPage })),
)
const HomeServicePOSPage = lazy(() =>
  import('./pages/operations/HomeServicePOSPage').then((m) => ({ default: m.HomeServicePOSPage })),
)
const OperationsCommercialLayout = lazy(() =>
  import('./pages/operations/operations-commercial-layout').then((m) => ({ default: m.OperationsCommercialLayout })),
)
const OperationsCommercialIndexRedirect = lazy(() =>
  import('./pages/operations/operations-commercial-layout').then((m) => ({
    default: m.OperationsCommercialIndexRedirect,
  })),
)
const OperationsCommercialTermsPage = lazy(() =>
  import('./pages/operations/operations-commercial-terms').then((m) => ({ default: m.OperationsCommercialTermsPage })),
)
const OperationsCommercialCitiesPage = lazy(() =>
  import('./pages/operations/operations-commercial-cities').then((m) => ({
    default: m.OperationsCommercialCitiesPage,
  })),
)
const KnowledgeKitHub = lazy(() =>
  import('./pages/knowledge-kit/knowledge-kit-hub').then((m) => ({ default: m.KnowledgeKitHub })),
)
const OperationsCommercialTermsGuide = lazy(() =>
  import('./pages/knowledge-kit/operations-commercial-terms-guide').then((m) => ({
    default: m.OperationsCommercialTermsGuide,
  })),
)
const ContentMarketingGuide = lazy(() =>
  import('./pages/knowledge-kit/content-marketing-guide').then((m) => ({
    default: m.ContentMarketingGuide,
  })),
)
const OperationsProviderAssetsPage = lazy(() =>
  import('./pages/operations/operations-provider-assets').then((m) => ({
    default: m.OperationsProviderAssetsPage,
  })),
)
const OperationsProfessionalConductPage = lazy(() =>
  import('./pages/operations/operations-professional-conduct').then((m) => ({
    default: m.OperationsProfessionalConductPage,
  })),
)

const Payments = lazy(() => import('./pages/payments/payments').then((m) => ({ default: m.Payments })))
const Invoices = lazy(() => import('./pages/payments/invoices').then((m) => ({ default: m.Invoices })))
const InvoiceCreate = lazy(() =>
  import('./pages/payments/invoice-create').then((m) => ({ default: m.InvoiceCreate }))
)
const InvoiceBrandingPage = lazy(() =>
  import('./pages/payments/invoice-branding').then((m) => ({ default: m.InvoiceBrandingPage }))
)

const SubscriptionsHub = lazy(() =>
  import('./pages/subscriptions/SubscriptionsHub').then((m) => ({ default: m.SubscriptionsHub })),
)

const Messages = lazy(() => import('./pages/communication/messages').then((m) => ({ default: m.Messages })))
const ChatPage = lazy(() => import('./pages/communication/chat'))
const Notifications = lazy(() => import('./pages/communication/notifications').then((m) => ({ default: m.Notifications })))

const Settings = lazy(() => import('./pages/settings/settings').then((m) => ({ default: m.Settings })))
const SaasPlatformPage = lazy(() =>
  import('./pages/settings/SaasPlatformPage').then((m) => ({ default: m.SaasPlatformPage })),
)
const PlatformTenantsPage = lazy(() =>
  import('./pages/settings/PlatformTenantsPage').then((m) => ({ default: m.PlatformTenantsPage })),
)
const AccessLayout = lazy(() =>
  import('./pages/settings/access/AccessLayout').then((m) => ({ default: m.AccessLayout })),
)
const AccessOverviewPage = lazy(() =>
  import('./pages/settings/access/AccessOverviewPage').then((m) => ({ default: m.AccessOverviewPage })),
)
const RolesIndexPage = lazy(() =>
  import('./pages/settings/access/RolesIndexPage').then((m) => ({ default: m.RolesIndexPage })),
)
const RoleDetailPage = lazy(() =>
  import('./pages/settings/access/RoleDetailPage').then((m) => ({ default: m.RoleDetailPage })),
)
const PermissionsIndexPage = lazy(() =>
  import('./pages/settings/access/PermissionsIndexPage').then((m) => ({ default: m.PermissionsIndexPage })),
)
const PermissionDetailPage = lazy(() =>
  import('./pages/settings/access/PermissionDetailPage').then((m) => ({ default: m.PermissionDetailPage })),
)
const RoutesExplorerPage = lazy(() =>
  import('./pages/settings/access/RoutesExplorerPage').then((m) => ({ default: m.RoutesExplorerPage })),
)
const AssignTeamAccessPage = lazy(() =>
  import('./pages/settings/access/AssignTeamAccessPage').then((m) => ({ default: m.AssignTeamAccessPage })),
)
const Sliders = lazy(() => import('./pages/settings/sliders').then((m) => ({ default: m.Sliders })))
const SystemStatus = lazy(() => import('./pages/settings/system-status'))

const Coupons = lazy(() => import('./pages/marketing/coupons'))
const Referrals = lazy(() => import('./pages/marketing/referrals'))
const Support = lazy(() => import('./pages/support/support'))
const Reports = lazy(() => import('./pages/support/reports'))
const RefundRequestsPage = lazy(() => import('./pages/support/RefundRequestsPage'))
const SupportTicketsQueuePage = lazy(() => import('./pages/support/SupportTicketsQueuePage'))

const CMSDashboard = lazy(() => import('./pages/cms/CMSDashboard'))
const SiteAppearancePage = lazy(() => import('./pages/cms/SiteAppearancePage'))
// PromotionManagement was removed in favour of the unified `/coupons` module.
// `/cms/promotions` is now a permanent redirect (see route definition below).
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
const EmailTemplatesManagement = lazy(() => import('./pages/cms/EmailTemplatesManagement'))
const SocialLinksManagement = lazy(() => import('./pages/cms/SocialLinksManagement'))
const IndustryServicePagesHub = lazy(() => import('./pages/cms/IndustryServicePagesHub'))
const PricingCategoryMetaManagement = lazy(() => import('./pages/cms/PricingCategoryMetaManagement'))

const MarketingWorkspaceHub = lazy(() =>
  import('./pages/marketing-workspace/MarketingWorkspaceHub').then((m) => ({ default: m.MarketingWorkspaceHub })),
)
const MarketingCampaignsPage = lazy(() =>
  import('./pages/marketing-workspace/CampaignsPage').then((m) => ({ default: m.CampaignsPage })),
)
const MarketingContentCalendarPage = lazy(() =>
  import('./pages/marketing-workspace/ContentCalendarPage').then((m) => ({ default: m.ContentCalendarPage })),
)
const MarketingSocialPostsPage = lazy(() =>
  import('./pages/marketing-workspace/SocialPostsPage').then((m) => ({ default: m.SocialPostsPage })),
)
const MarketingLivePublishPage = lazy(() =>
  import('./pages/marketing-workspace/SocialPublishSettingsPage').then((m) => ({ default: m.SocialPublishSettingsPage })),
)
const MarketingPlanningIdeasPage = lazy(() =>
  import('./pages/marketing-workspace/PlanningIdeasPage').then((m) => ({ default: m.PlanningIdeasPage })),
)
const MarketingTasksPage = lazy(() =>
  import('./pages/marketing-workspace/MarketingTasksPage').then((m) => ({ default: m.MarketingTasksPage })),
)
const MarketingResearchBrainstormPage = lazy(() =>
  import('./pages/marketing-workspace/ResearchBrainstormPage').then((m) => ({ default: m.ResearchBrainstormPage })),
)

const BoardsHub = lazy(() => import('./pages/boards/BoardsHub').then((m) => ({ default: m.BoardsHub })))
const BoardRoom = lazy(() => import('./pages/boards/BoardRoomSync').then((m) => ({ default: m.BoardRoomSync })))
const BoardCanvasRoom = lazy(() =>
  import('./pages/boards/BoardRoomSync').then((m) => ({ default: m.BoardCanvasFullPage })),
)
const AcceptBoardInvite = lazy(() =>
  import('./pages/boards/AcceptBoardInvite').then((m) => ({ default: m.AcceptBoardInvite })),
)

/** Gate aligned with `routePermissions` `/marketing` entry in rbac.config. */
const MARKETING_WORKSPACE_PERMISSIONS: Permission[] = [
  'manage_system_settings',
  'manage_coupons',
  'manage_referrals',
  'edit_coupons',
  'edit_referrals',
  'create_coupons',
  'create_referrals',
]

const RouteFallback = (
  <div className="flex min-h-[280px] w-full items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
  </div>
)

function App() {
  return (
    <Provider store={store}>
      <OneSignalWeb />
      {/*
        Live-ops socket gate — connects to the backend default namespace and
        pipes professional `professional:presence` heartbeats into the
        in-memory presence store so the Professionals table, Live Locations
        page, and Admin Hub all show real-time online/busy/offline status
        without waiting on the 30s poll.
      */}
      <LiveOpsAdminGate />
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
              <Route path="/auth/accept-invite" element={<AcceptTeamInvite />} />
              <Route path="/boards/invites/:token" element={<AcceptBoardInvite />} />
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
                        path="/ecommerce/store-category-plp"
                        element={
                          <RoleBasedRoute
                            permissions={['manage_system_settings', 'view_categories', 'view_products']}
                          >
                            <StoreCategoryPlpManagement />
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
                        path="/bazaar/listing-review/:listingId"
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
                            <BazaarListingReviewDetailPage />
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
                        path="/bazaar/module-settings"
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
                            <BazaarModuleSettingsPage />
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

                      {/* Industry operations (service marketplace CEO spine) */}
                      <Route
                        path="/operations/command-center"
                        element={
                          <RoleBasedRoute permissions={['view_bookings', 'manage_bookings']}>
                            <OpsCommandCenterPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/trust"
                        element={
                          <RoleBasedRoute permissions={['view_bookings', 'manage_bookings']}>
                            <TrustDisputesHubPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/supply-quality"
                        element={
                          <RoleBasedRoute
                            permissions={['view_providers', 'edit_providers', 'approve_providers']}
                          >
                            <SupplyQualityPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/payouts-playbook"
                        element={
                          <RoleBasedRoute
                            permissions={['view_payments', 'create_payments', 'refund_payments']}
                          >
                            <PayoutTransparencyPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/dispute-cases"
                        element={
                          <RoleBasedRoute
                            permissions={['view_bookings', 'manage_bookings', 'edit_bookings']}
                          >
                            <DisputeCasesPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/pos"
                        element={
                          <RoleBasedRoute permissions={['create_bookings', 'manage_bookings']}>
                            <HomeServicePOSPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/commercial"
                        element={
                          <RoleBasedRoute permissions={['view_operating_terms']}>
                            <OperationsCommercialLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<OperationsCommercialIndexRedirect />} />
                        <Route path="terms" element={<OperationsCommercialTermsPage />} />
                        <Route path="cities" element={<OperationsCommercialCitiesPage />} />
                      </Route>
                      <Route
                        path="/knowledge-kit"
                        element={
                          <RoleBasedRoute permissions={['view_dashboard']}>
                            <KnowledgeKitHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/knowledge-kit/operations-commercial-terms"
                        element={
                          <RoleBasedRoute permissions={['view_operating_terms']}>
                            <OperationsCommercialTermsGuide />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/knowledge-kit/content-marketing"
                        element={
                          <RoleBasedRoute permissions={['view_dashboard']}>
                            <ContentMarketingGuide />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/provider-assets"
                        element={
                          <RoleBasedRoute permissions={['view_provider_assets']}>
                            <OperationsProviderAssetsPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations/professional-conduct"
                        element={
                          <RoleBasedRoute permissions={['view_professional_conduct']}>
                            <OperationsProfessionalConductPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/operations"
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'view_bookings',
                              'manage_bookings',
                              'view_providers',
                              'edit_providers',
                              'approve_providers',
                              'view_analytics',
                              'view_payments',
                              'create_payments',
                              'refund_payments',
                              'view_dashboard',
                            ]}
                          >
                            <IndustryOperationsHub />
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

                      {/* Boards (collaborative canvas) */}
                      <Route
                        path="/boards"
                        element={
                          <RoleBasedRoute permissions={['view_boards']}>
                            <BoardsHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/boards/:id/canvas"
                        element={
                          <RoleBasedRoute permissions={['view_boards']}>
                            <BoardCanvasRoom />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/boards/:id"
                        element={
                          <RoleBasedRoute permissions={['view_boards']}>
                            <BoardRoom />
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

                      <Route
                        path="/finance"
                        element={
                          <RoleBasedRoute permissions={['view_finance']}>
                            <FinanceLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<FinanceIndexRedirect />} />
                        <Route path="overview" element={<FinanceOverviewPage />} />
                        <Route path="operating" element={<FinanceOperatingHubPage />} />
                        <Route path="expenses" element={<FinanceExpensesPage />} />
                        <Route path="budgets" element={<FinanceBudgetsPage />} />
                        <Route path="reconciliation" element={<FinanceReconciliationPage />} />
                        <Route path="recurring" element={<FinanceRecurringPage />} />
                        <Route path="directory" element={<FinanceDirectoryPage />} />
                      </Route>

                      <Route
                        path="/amc"
                        element={
                          <RoleBasedRoute permissions={['view_amc']}>
                            <AmcLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<AmcIndexRedirect />} />
                        <Route path="overview" element={<AmcOverviewPage />} />
                        <Route path="packages" element={<AmcPackagesPage />} />
                        <Route path="contracts" element={<AmcContractsPage />} />
                        <Route path="contracts/:id" element={<AmcContractDetailPage />} />
                      </Route>

                      {/* Subscriptions — recurring revenue: plans + subscriber lifecycle */}
                      <Route
                        path="/subscriptions"
                        element={
                          <RoleBasedRoute permissions={['view_subscriptions']}>
                            <SubscriptionsHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/subscriptions/plans"
                        element={
                          <RoleBasedRoute permissions={['view_subscriptions']}>
                            <SubscriptionsHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/subscriptions/plans/new"
                        element={
                          <RoleBasedRoute permissions={['manage_subscriptions']}>
                            <SubscriptionsHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/subscriptions/plans/:id/edit"
                        element={
                          <RoleBasedRoute permissions={['manage_subscriptions']}>
                            <SubscriptionsHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/subscriptions/subscribers"
                        element={
                          <RoleBasedRoute permissions={['view_subscriptions']}>
                            <SubscriptionsHub />
                          </RoleBasedRoute>
                        }
                      />

                      <Route
                        path="/company-documents"
                        element={
                          <RoleBasedRoute permissions={['view_company_documents']}>
                            <CompanyDocumentsLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<CompanyDocumentsIndexRedirect />} />
                        <Route path="overview" element={<CompanyDocumentsOverviewPage />} />
                        <Route path="templates" element={<CompanyDocumentsTemplatesPage />} />
                        <Route path="templates/:id" element={<CompanyDocumentsTemplateEditorPage />} />
                        <Route path="envelopes" element={<CompanyDocumentsEnvelopesPage />} />
                      </Route>

                      <Route
                        path="/rate-cards"
                        element={
                          <RoleBasedRoute permissions={['view_rate_cards']}>
                            <RateCardsLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<RateCardsIndexRedirect />} />
                        <Route path="overview" element={<RateCardsOverviewPage />} />
                        <Route path="customer" element={<RateCardsCustomerPage />} />
                        <Route path="provider" element={<RateCardsProviderPage />} />
                        <Route path="catalog" element={<RateCardsCatalogPage />} />
                      </Route>

                      {/*
                        Users hub — split by audience for unambiguous URLs:
                        - `/users`            → permanent redirect to `/users/customers`
                                                (back-compat for old links / bookmarks)
                        - `/users/customers`  → consumer (customer-role) accounts
                        - `/users/members`    → dashboard / team accounts (admin-invited staff)
                        Same pattern as `/finance`, `/amc`, `/rate-cards`, etc.
                      */}
                      <Route path="/users" element={<Navigate to="/users/customers" replace />} />
                      <Route
                        path="/users/customers"
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
                      <Route
                        path="/professionals/operations"
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <ProfessionalsOperationsDashboard />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/professionals/live-locations"
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <ProfessionalsLiveLocations />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/professionals/:id"
                        element={
                          <RoleBasedRoute permissions={['view_providers']}>
                            <ProfessionalAdminHub />
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
                      
                      {/* Sliders + CMS banners (single hub) */}
                      <Route
                        path="/sliders"
                        element={
                          <RoleBasedRoute permissions={['view_settings', 'manage_system_settings']}>
                            <Sliders />
                          </RoleBasedRoute>
                        }
                      />
                      
                      {/* Coupons */}
                      <Route 
                        path="/coupons" 
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'manage_coupons',
                              'edit_coupons',
                              'create_coupons',
                              'view_coupons',
                            ]}
                          >
                            <Coupons />
                          </RoleBasedRoute>
                        } 
                      />
                      
                      {/* Referrals */}
                      <Route 
                        path="/referrals" 
                        element={
                          <RoleBasedRoute
                            permissions={[
                              'manage_referrals',
                              'edit_referrals',
                              'create_referrals',
                              'view_referrals',
                            ]}
                          >
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
                      <Route
                        path="/analytics/funnels"
                        element={
                          <RoleBasedRoute permissions={['view_analytics']}>
                            <GrowthFunnelsPage />
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
                      <Route
                        path="/settings/access"
                        element={
                          <RoleBasedRoute
                            permissions={['view_settings', 'manage_system_settings', 'manage_user_roles']}
                          >
                            <AccessLayout />
                          </RoleBasedRoute>
                        }
                      >
                        <Route index element={<AccessOverviewPage />} />
                        <Route path="roles" element={<RolesIndexPage />} />
                        <Route path="roles/:roleId" element={<RoleDetailPage />} />
                        <Route path="permissions" element={<PermissionsIndexPage />} />
                        <Route path="permissions/:permissionId" element={<PermissionDetailPage />} />
                        <Route path="routes" element={<RoutesExplorerPage />} />
                        <Route path="assign" element={<AssignTeamAccessPage />} />
                      </Route>
                      <Route
                        path="/settings/saas"
                        element={
                          <RoleBasedRoute permissions={['view_settings']}>
                            <SaasPlatformPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/settings/tenants"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <PlatformTenantsPage />
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
                      <Route
                        path="/support/refund-requests"
                        element={
                          <RoleBasedRoute permissions={['refund_payments']}>
                            <RefundRequestsPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/support/tickets"
                        element={
                          <RoleBasedRoute permissions={['view_dashboard']}>
                            <SupportTicketsQueuePage />
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
                        path="/cms/site-appearance"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <SiteAppearancePage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/cms/banners"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings', 'view_settings']}>
                            <Navigate to="/sliders?tab=banners" replace />
                          </RoleBasedRoute>
                        }
                      />
                      {/*
                        `/cms/promotions` is now unified with `/coupons` — a single discount-code
                        engine. We keep this route as a permanent redirect so old bookmarks /
                        external campaign links continue to land on the right place.
                      */}
                      <Route
                        path="/cms/promotions"
                        element={<Navigate to="/coupons" replace />}
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
                        path="/cms/email-templates"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <EmailTemplatesManagement />
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
                        element={<Navigate to="/cms/category-marketing?tab=rate-card" replace />}
                      />
                      <Route
                        path="/cms/category-marketing"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <IndustryServicePagesHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/cms/cross-linking"
                        element={<Navigate to="/cms/category-marketing?tab=cross-linking" replace />}
                      />
                      <Route
                        path="/cms/pricing-category-meta"
                        element={
                          <RoleBasedRoute permissions={['manage_system_settings']}>
                            <PricingCategoryMetaManagement />
                          </RoleBasedRoute>
                        }
                      />

                      <Route
                        path="/marketing"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingWorkspaceHub />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/campaigns"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingCampaignsPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/calendar"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingContentCalendarPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/social"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingSocialPostsPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/live-publish"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingLivePublishPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/planning"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingPlanningIdeasPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/tasks"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingTasksPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/marketing/lab"
                        element={
                          <RoleBasedRoute permissions={MARKETING_WORKSPACE_PERMISSIONS}>
                            <MarketingResearchBrainstormPage />
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