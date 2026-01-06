# 🏗️ Project Structure

Complete guide to folder organization and architecture.

## 📂 Root Structure

```
fixer-admin/
├── src/                    # Source code
├── public/                 # Static assets (favicon, manifest)
├── docs/                   # Documentation
├── build/                  # Production build (auto-generated)
│
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind CSS config
├── craco.config.js         # CRA customization
└── README.md               # Main documentation
```

## 📁 Source Code (`src/`)

### Core Structure
```
src/
├── components/             # UI Components
├── pages/                  # Application Pages
├── services/               # API Integration
├── store/                  # State Management
├── hooks/                  # Custom Hooks
├── lib/                    # Utilities
├── types/                  # TypeScript Types
├── config/                 # Configuration
├── contexts/               # React Contexts
├── theme/                  # Theme Configuration
│
├── App.tsx                 # Root component
├── index.tsx               # Entry point
└── index.css               # Global styles
```

---

## 🎨 Components (`src/components/`)

### Organization by Feature

```
components/
│
├── ui/                     ⭐ CORE UI LIBRARY
│   ├── index.ts           # Main exports
│   ├── README.md          # Documentation
│   ├── button.tsx         # Button component
│   ├── card.tsx           # Card component
│   ├── input.tsx          # Input component
│   ├── spacing.tsx        # VStack, HStack, Spacer
│   └── ... (20 files)
│
├── auth/                   # Authentication
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleBasedRoute.tsx
│
├── common/                 # Shared Components
│   ├── PageHeader.tsx
│   ├── EmptyState.tsx
│   ├── DataTable.tsx
│   ├── Pagination.tsx
│   └── StatusBadge.tsx
│
├── forms/                  # Form Utilities
│   ├── FormField.tsx
│   ├── DateField.tsx
│   ├── ImageUploadField.tsx
│   └── RichTextField.tsx
│
├── layout/                 # Layout Components
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── main-layout.tsx
│
├── notifications/          # Notification System
│   ├── NotificationBell.tsx
│   ├── NotificationCenter.tsx
│   └── PushNotificationManager.tsx
│
└── [feature]/             # Feature-specific
    ├── categories/
    ├── products/
    ├── orders/
    ├── users/
    └── ...
```

### Import Pattern

```typescript
// ✅ Core UI components
import { Button, Card, Input } from './components/ui'

// ✅ Common components
import { PageHeader, DataTable } from './components/common'

// ✅ Feature components
import { ProductTable } from './components/products'
```

---

## 📄 Pages (`src/pages/`)

### Route-based Organization

```
pages/
├── dashboard.tsx           # Main dashboard
├── settings.tsx            # Settings page
├── unauthorized.tsx        # 403 page
│
├── auth.tsx                # Login page
├── signup.tsx              # Signup page
│
├── products.tsx            # Product listing
├── add-product.tsx         # Add product
│
├── orders.tsx              # Order management
├── bookings.tsx            # Booking management
├── users.tsx               # User management
│
├── analytics.tsx           # Analytics dashboard
├── reports.tsx             # Reports
│
└── cms/                    # CMS Pages
    ├── CMSDashboard.tsx
    ├── BlogManagement.tsx
    ├── PageManagement.tsx
    └── ...
```

### Page Template

```typescript
import { Button, Card, VStack } from '../components/ui'
import { PageHeader } from '../components/common'

export function MyPage() {
  return (
    <div className="p-6">
      <VStack spacing={6}>
        <PageHeader
          title="Page Title"
          subtitle="Page description"
        />
        
        <Card>
          <CardContent>
            {/* Page content */}
          </CardContent>
        </Card>
      </VStack>
    </div>
  )
}
```

---

## 🔌 Services (`src/services/`)

### API Integration

```
services/
├── apiClient.ts            # Base API client
│
└── api/                    # API Services
    ├── auth.service.ts
    ├── users.service.ts
    ├── products.service.ts
    ├── orders.service.ts
    ├── categories.service.ts
    └── ... (23 services)
```

### Service Pattern

```typescript
// Example: products.service.ts
export class ProductsService {
  static async getProducts(params) {
    return apiClient.get('/products', { params })
  }
  
  static async createProduct(data) {
    return apiClient.post('/products', data)
  }
}
```

---

## 🗄️ Store (`src/store/`)

### Redux Toolkit Setup

```
store/
├── index.ts                # Store configuration
├── hooks.ts                # Typed hooks
├── selectors.ts            # Reusable selectors
│
└── slices/                 # Redux slices
    ├── authSlice.ts        # Authentication state
    ├── uiSlice.ts          # UI state (toasts, loading)
    └── dataSlice.ts        # Data caching
```

### Usage Pattern

```typescript
import { useAppDispatch, useAppSelector } from './store/hooks'

function MyComponent() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(state => state.auth.user)
  
  return <div>{user.name}</div>
}
```

---

## 🪝 Hooks (`src/hooks/`)

### Custom React Hooks

```
hooks/
├── usePermissions.ts       # RBAC permissions
└── useNotifications.ts     # Notification system
```

### Hook Pattern

```typescript
// usePermissions.ts
export function usePermissions() {
  const user = useAppSelector(state => state.auth.user)
  
  return {
    hasPermission: (permission: string) => {
      return user.permissions.includes(permission)
    },
    userRole: user.role
  }
}
```

---

## 🛠️ Lib (`src/lib/`)

### Utility Functions

```
lib/
└── utils.ts                # Utility functions
    ├── cn()               # Class name merger
    ├── formatCurrency()   # Format money
    ├── formatDate()       # Format dates
    └── getInitials()      # Get user initials
```

### Usage

```typescript
import { cn, formatCurrency } from './lib/utils'

// Merge classes
<div className={cn('base-class', isActive && 'active-class')} />

// Format currency
formatCurrency(1000, 'INR') // ₹1,000
```

---

## 📝 Types (`src/types/`)

### TypeScript Definitions

```
types/
├── index.ts                # Shared types
└── rbac.types.ts           # RBAC types
```

### Type Pattern

```typescript
// index.ts
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export type UserRole = 'admin' | 'provider' | 'customer'
```

---

## ⚙️ Config (`src/config/`)

### Configuration Files

```
config/
└── rbac.config.ts          # Role-based access control
```

---

## 🎨 Contexts (`src/contexts/`)

### React Context Providers

```
contexts/
├── theme-context.tsx       # Theme provider
├── sidebar-context.tsx     # Sidebar state
└── data-context.tsx        # Data caching
```

---

## 📚 Docs (`docs/`)

### Documentation

```
docs/
├── README.md               # Documentation index
├── PROJECT_STRUCTURE.md    # This file
├── TOKEN_REFRESH_FIX.md    # Auth documentation
└── README_UI_COMPLETE.md   # UI system docs
```

---

## 🎯 Key Principles

### 1. Single Responsibility
Each folder has one clear purpose.

### 2. Feature-based Organization
Components organized by feature when possible.

### 3. Clear Naming
Files named clearly: `UserTable.tsx`, not `table.tsx`.

### 4. Consistent Patterns
Follow established patterns for new code.

### 5. Documentation
Every major component/service documented.

---

## ✅ Best Practices

### File Naming
```
✅ PascalCase for components:  UserTable.tsx
✅ camelCase for utilities:    utils.ts
✅ kebab-case for styles:      main-layout.tsx
✅ lowercase for config:       rbac.config.ts
```

### Imports
```typescript
// ✅ Group imports logically
import React from 'react'                    // External
import { Button } from './components/ui'     // Internal
import { usePermissions } from './hooks'     // Hooks
import type { User } from './types'          // Types
```

### Folder Structure
```
✅ Group by feature, not by type
✅ Keep related files together
✅ Use index.ts for clean exports
✅ Document complex structures
```

---

## 📖 Quick Reference

| Need | Location |
|------|----------|
| UI Component | `src/components/ui/` |
| Page | `src/pages/` |
| API Call | `src/services/api/` |
| State | `src/store/slices/` |
| Hook | `src/hooks/` |
| Type | `src/types/` |
| Utility | `src/lib/` |

---

**Last Updated**: Today  
**Maintained By**: Engineering Team
