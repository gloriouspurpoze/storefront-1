# 🔌 Backend API Integration Guide

## Overview
This document provides a comprehensive guide for connecting all frontend components to backend APIs and removing all mock data from the fixer-admin application.

---

## ✅ Completed Integration

### 1. **API Services Updated**

#### bookings.service.ts ✅
**New Methods Added:**
```typescript
// Provider-specific endpoints
BookingsService.getProviderBookings(query)           // GET /bookings/provider/my-bookings
BookingsService.getProviderUpcomingBookings()        // GET /bookings/provider/upcoming  
BookingsService.getProviderBookingStats()            // GET /bookings/provider/stats
```

#### payments.service.ts ✅
**New Methods Added:**
```typescript
// Provider earnings endpoints
PaymentsService.getProviderPayments(query)           // GET /payments/provider/my-payments
PaymentsService.getProviderPaymentStats()            // GET /payments/provider/stats
PaymentsService.getProviderEarningsSummary()         // Alias for stats
PaymentsService.getProviderTransactions(query)       // Alias for payments
```

#### providers.service.ts ✅
**Already Complete** - Has all necessary endpoints:
- `getServiceProviders()` - List all providers
- `getServiceProviderById()` - Get provider details
- `getServiceProviderByUserId()` - Get by user ID
- `createServiceProvider()` - Create profile
- `updateServiceProvider()` - Update profile
- `updateVerificationStatus()` - Admin only
- `getProviderStats()` - Statistics

---

### 2. **Pages Updated**

#### Provider Dashboard ✅ **COMPLETED**
**File:** `/Users/faizan/Desktop/Homeservice/fixer-admin/src/pages/provider-dashboard.tsx`

**Changes:**
- ✅ Removed all mock data
- ✅ Added `useState` for loading and error states
- ✅ Added `useEffect` to fetch data on mount
- ✅ Created `fetchDashboardData()` async function
- ✅ Integrated `BookingsService.getProviderBookingStats()`
- ✅ Integrated `BookingsService.getProviderBookings({ limit: 3 })`
- ✅ Added loading spinner (CircularProgress)
- ✅ Added error alert display
- ✅ Updated table to use real `Booking` type
- ✅ Fixed field mappings (customer_name, scheduled_date, etc.)
- ✅ Added empty state for no bookings

**API Calls:**
```typescript
const statsData = await BookingsService.getProviderBookingStats()
const bookingsData = await BookingsService.getProviderBookings({ limit: 3, page: 1 })
```

#### Provider Bookings ✅ **IN PROGRESS**
**File:** `/Users/faizan/Desktop/Homeservice/fixer-admin/src/pages/provider-bookings.tsx`

**Changes:**
- ✅ Removed mock bookings array
- ✅ Added loading and error states
- ✅ Added pagination state
- ✅ Created `fetchBookings()` async function
- ✅ Integrated `BookingsService.getProviderBookings(query)`
- ✅ Added useEffect with dependencies [currentTab, searchQuery]
- ✅ Status filtering by tab
- ✅ Search functionality

**Remaining:**
- Update table rendering to use real Booking fields
- Update action handlers (accept, start, complete)
- Update details dialog with real data

---

## 📋 Remaining Pages to Update

### 3. Provider Earnings Page
**File:** `src/pages/provider-earnings.tsx`

**Mock Data to Replace:**
```typescript
// Line 61-68: Mock earnings state
const [earnings, setEarnings] = useState({
  totalEarnings: 15750.00,
  pendingPayouts: 1250.00,
  // ...
})

// Line 71-105: Mock transactions array
const [transactions, setTransactions] = useState<Transaction[]>([...])
```

**API Integration:**
```typescript
useEffect(() => {
  fetchEarningsData()
}, [])

const fetchEarningsData = async () => {
  try {
    setLoading(true)
    
    // Get earnings summary
    const statsData = await PaymentsService.getProviderPaymentStats()
    setEarnings(statsData)
    
    // Get transactions
    const transactionsData = await PaymentsService.getProviderTransactions({ 
      page: 1, 
      limit: 10 
    })
    setTransactions(transactionsData.payments || [])
    
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

### 4. Provider Profile Page  
**File:** `src/pages/provider-profile.tsx`

**Mock Data to Replace:**
```typescript
// Line 17-34: Mock form data
const [formData, setFormData] = useState({
  firstName: user?.firstName || '',
  businessName: 'Pro Fix Services',
  // ...
})
```

**API Integration:**
```typescript
useEffect(() => {
  fetchProviderProfile()
}, [user?.id])

const fetchProviderProfile = async () => {
  try {
    setLoading(true)
    
    if (user?.id) {
      const profile = await ProvidersService.getServiceProviderByUserId(user.id)
      setFormData({
        firstName: profile.user?.firstName || '',
        lastName: profile.user?.lastName || '',
        email: profile.user?.email || '',
        phone: profile.user?.phone || '',
        businessName: profile.business_name || '',
        businessAddress: profile.business_address || '',
        yearsExperience: profile.years_experience?.toString() || '',
        bio: profile.bio || '',
        services: profile.services_offered || [],
        serviceAreas: profile.service_areas || [],
        hourlyRate: profile.hourly_rate || '',
        // ...
      })
    }
    
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

const handleSave = async () => {
  try {
    setLoading(true)
    
    await ProvidersService.updateServiceProvider(providerId, {
      business_name: formData.businessName,
      business_address: formData.businessAddress,
      years_experience: parseInt(formData.yearsExperience),
      bio: formData.bio,
      services_offered: formData.services,
      service_areas: formData.serviceAreas,
      hourly_rate: formData.hourlyRate,
      // ...
    })
    
    setIsEditing(false)
    toast.success('Profile updated successfully!')
    
  } catch (err) {
    toast.error(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

### 5. Admin Payments Page
**File:** `src/pages/payments.tsx`

**Mock Data to Replace:**
```typescript
// Line 84-126: Mock payments array
const [payments, setPayments] = useState<Payment[]>([...])

// Line 128-133: Mock stats
const stats = {
  totalRevenue: 12450.00,
  // ...
}
```

**API Integration:**
```typescript
useEffect(() => {
  fetchPaymentsData()
}, [currentTab, searchQuery])

const fetchPaymentsData = async () => {
  try {
    setLoading(true)
    
    // Get payment stats
    const statsData = await PaymentsService.getPaymentStats()
    setStats({
      totalRevenue: statsData.totalRevenue,
      pendingPayments: statsData.byStatus.pending || 0,
      completedPayments: statsData.byStatus.completed || 0,
      refundedAmount: statsData.totalRefunds,
    })
    
    // Get payments list
    const status = tabs[currentTab].value
    const query: any = { page: 1, limit: 10 }
    if (status !== 'all') query.status = status
    if (searchQuery) query.search = searchQuery
    
    const paymentsData = await PaymentsService.getPayments(query)
    setPayments(paymentsData.payments || [])
    setPagination(paymentsData.pagination)
    
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

## 🔗 Backend API Endpoints Reference

### Bookings Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/bookings` | GET | Get all bookings (Admin) | Admin |
| `/bookings/stats` | GET | Get booking statistics | Admin |
| `/bookings/:id` | GET | Get booking by ID | Any (participants) |
| `/bookings/provider/my-bookings` | GET | Get provider's bookings | Provider |
| `/bookings/provider/upcoming` | GET | Get upcoming bookings | Provider |
| `/bookings/provider/stats` | GET | Get provider stats | Provider |
| `/bookings/:id/status` | PATCH | Update booking status | Provider |
| `/bookings/:id/cancel` | PATCH | Cancel booking | Any |
| `/bookings/:id/assign-provider` | POST | Assign provider (Admin) | Admin |

### Payments Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/payments` | GET | Get all payments (Admin) | Admin |
| `/payments/stats` | GET | Get payment statistics | Admin |
| `/payments/:id` | GET | Get payment by ID | Any (participants) |
| `/payments/provider/my-payments` | GET | Get provider's payments | Provider |
| `/payments/provider/stats` | GET | Get provider payment stats | Provider |
| `/payments/refund` | POST | Refund payment | Admin |
| `/payments/process` | POST | Process payment | Authenticated |

### Providers Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/service-providers` | GET | Get all providers | Public |
| `/service-providers/stats` | GET | Get provider statistics | Admin |
| `/service-providers/:id` | GET | Get provider by ID | Public |
| `/service-providers/user/:userId` | GET | Get provider by user ID | Public |
| `/service-providers` | POST | Create provider profile | Authenticated |
| `/service-providers/:id` | PUT | Update provider profile | Provider (own) |
| `/service-providers/:id/verification-status` | PATCH | Update verification | Admin |

---

## 🛠️ Implementation Steps

### Step 1: Update Service Files ✅ DONE
- [x] bookings.service.ts
- [x] payments.service.ts  
- [x] providers.service.ts (already complete)

### Step 2: Update Provider Pages
- [x] provider-dashboard.tsx ✅ DONE
- [ ] provider-bookings.tsx (in progress)
- [ ] provider-earnings.tsx
- [ ] provider-profile.tsx

### Step 3: Update Admin Pages
- [ ] payments.tsx

### Step 4: Test All Pages
- [ ] Test provider login flow
- [ ] Test all provider pages
- [ ] Test admin payments page
- [ ] Verify error handling
- [ ] Verify loading states

---

## 📝 Code Patterns to Follow

### 1. State Management
```typescript
const [data, setData] = useState<Type[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
```

### 2. Data Fetching
```typescript
useEffect(() => {
  fetchData()
}, [dependencies])

const fetchData = async () => {
  try {
    setLoading(true)
    setError(null)
    
    const response = await Service.method(params)
    setData(response.data)
    if (response.pagination) setPagination(response.pagination)
    
  } catch (err: any) {
    console.error('Error:', err)
    setError(err?.message || 'Failed to load data')
  } finally {
    setLoading(false)
  }
}
```

### 3. Loading UI
```typescript
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
)}
```

### 4. Error UI
```typescript
{error && (
  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### 5. Empty State
```typescript
{!loading && data.length === 0 && (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="body1" color="text.secondary">
      No data found
    </Typography>
  </Box>
)}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Field Name Mismatches
**Problem:** Backend uses `customer_name`, frontend expects `customer.name`

**Solution:** Map fields during data transformation
```typescript
const mappedBookings = bookings.map(b => ({
  ...b,
  customer: {
    name: b.customer_name,
    phone: b.customer_phone,
    email: b.customer_email
  }
}))
```

### Issue 2: Missing Nested Data
**Problem:** Backend doesn't always include nested objects

**Solution:** Use optional chaining and defaults
```typescript
<Typography>{booking.service_name || booking.service_request?.service_name || 'N/A'}</Typography>
```

### Issue 3: Date Formatting
**Problem:** Backend returns dates in different formats

**Solution:** Format dates consistently
```typescript
const formattedDate = new Date(booking.scheduled_date).toLocaleDateString()
const formattedTime = booking.scheduled_time || 'TBD'
```

---

## ✅ Testing Checklist

### Provider Dashboard
- [ ] Loads stats from API
- [ ] Shows loading spinner
- [ ] Displays error messages
- [ ] Shows recent bookings
- [ ] All numbers accurate
- [ ] Links work correctly

### Provider Bookings
- [ ] Lists all bookings from API
- [ ] Tab filtering works
- [ ] Search works
- [ ] Status updates work
- [ ] Details dialog shows correct data
- [ ] Action buttons functional

### Provider Earnings
- [ ] Shows earnings stats from API
- [ ] Lists transactions
- [ ] Progress bars accurate
- [ ] Bank info displayed
- [ ] Download button ready

### Provider Profile
- [ ] Loads profile data
- [ ] Edit mode works
- [ ] Save updates API
- [ ] Validation works
- [ ] Success/error messages

### Admin Payments
- [ ] Shows all payments
- [ ] Stats accurate
- [ ] Filtering works
- [ ] Details dialog complete
- [ ] Refund process works

---

## 🚀 Next Steps

1. **Complete Remaining Pages:**
   - Finish provider-bookings.tsx table rendering
   - Update provider-earnings.tsx with API
   - Update provider-profile.tsx with API
   - Update payments.tsx with API

2. **Add Error Handling:**
   - Toast notifications for success/error
   - Retry mechanisms
   - Fallback UI

3. **Add Optimizations:**
   - Debounce search inputs
   - Cache API responses
   - Implement pagination controls
   - Add refresh buttons

4. **Test Everything:**
   - Unit tests for services
   - Integration tests for pages
   - E2E tests for user flows
   - Load testing

---

## 📄 Summary

### What's Been Done ✅
- Updated 3 API service files
- Removed mock data from provider-dashboard.tsx
- Started removing mock data from provider-bookings.tsx
- Added loading states
- Added error handling
- Added proper TypeScript types

### What's Remaining 🔄
- Finish provider-bookings.tsx
- Update provider-earnings.tsx
- Update provider-profile.tsx  
- Update payments.tsx
- Test all pages
- Fix any field mapping issues

### Estimated Time Remaining
- 30-45 minutes to complete all remaining pages
- 15-30 minutes for testing
- **Total:** 45-75 minutes

---

**Last Updated:** November 5, 2025  
**Status:** 60% Complete  
**Next:** Finish provider-bookings.tsx and continue with other pages


