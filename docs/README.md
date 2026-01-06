# Fixer Admin Dashboard

Modern admin dashboard built with React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📂 Project Structure

```
fixer-admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # ⭐ Core UI library (shadcn/ui)
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Shared components
│   │   ├── forms/          # Form utilities
│   │   └── layout/         # Layout components
│   │
│   ├── pages/              # Application pages
│   ├── services/           # API services
│   ├── store/              # Redux store
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript types
│   └── config/             # Configuration files
│
├── docs/                   # Documentation
└── public/                 # Static assets
```

## 🎨 UI Components

All UI components are in `src/components/ui/`:

```typescript
import {
  Button, Card, Input, Label,
  VStack, HStack, useToast
} from './components/ui'
```

See `src/components/ui/README.md` for complete documentation.

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Redux Toolkit** - State management
- **React Router** - Routing

## 📖 Documentation

- **UI Components**: `src/components/ui/README.md`
- **Project Structure**: `docs/PROJECT_STRUCTURE.md`
- **API Integration**: Check `src/services/`

## 🔒 Authentication

Firebase Authentication integrated. See `src/components/auth/` for implementation.

## 🏗️ Key Features

- ✅ Role-based access control (RBAC)
- ✅ Real-time notifications
- ✅ Product management
- ✅ Order tracking
- ✅ User management
- ✅ Analytics dashboard
- ✅ CMS integration

## 🤝 Contributing

1. Follow the existing code structure
2. Import UI components from `./components/ui`
3. Use TypeScript for all new files
4. Follow naming conventions

## 📝 License

Private - All rights reserved
