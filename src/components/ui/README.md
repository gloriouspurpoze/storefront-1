# UI Components Library

**Single source of truth for all UI components.**

> **Design tokens (color, type, radius, spacing, elevation) come from
> [`/DESIGN.md`](../../../DESIGN.md).** Never hardcode a hex value or an
> off-palette Tailwind color (`bg-blue-500`, `text-gray-600`, etc.) — use the
> tokens projected into Tailwind in `tailwind.config.js` and the CSS variables
> in `src/index.css`. Both files are mechanical mirrors of `DESIGN.md`.

## 📁 Structure

```
src/components/ui/
├── index.ts              # Main exports - import from here
├── button.tsx            # Button with loading states
├── card.tsx              # Card layouts
├── input.tsx             # Text inputs
├── label.tsx             # Form labels
├── select.tsx            # Dropdowns
├── checkbox.tsx          # Checkboxes
├── switch.tsx            # Toggle switches
├── textarea.tsx          # Multi-line text
├── tabs.tsx              # Tab navigation
├── badge.tsx             # Status badges
├── avatar.tsx            # User avatars
├── dialog.tsx            # Modals
├── popover.tsx           # Popovers
├── toast.tsx             # Toast notifications
├── toaster.tsx           # Toast provider
├── use-toast.ts          # Toast hook
├── spacing.tsx           # VStack, HStack, Spacer
├── table.tsx             # Data tables
├── calendar.tsx          # Date picker
└── slider.tsx            # Range slider
```

## ✅ Usage

### Import Everything from One Place

```typescript
import {
  // Actions
  Button,
  
  // Layout
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  VStack, HStack, Spacer,
  
  // Forms
  Input, Label, Textarea, Select, Checkbox, Switch,
  
  // Navigation
  Tabs, TabsList, TabsTrigger, TabsContent,
  
  // Display
  Badge, Avatar, Table,
  
  // Overlays
  Dialog, DialogContent, DialogHeader, DialogTitle,
  
  // Feedback
  useToast, Toaster
} from '../components/ui'
```

## 🎨 Component Examples

### Button
```tsx
// Basic
<Button>Click Me</Button>

// With loading
<Button loading={isLoading}>Save</Button>

// With icons
<Button leftIcon={<Save className="h-4 w-4" />}>
  Save Changes
</Button>

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Close</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Layout
```tsx
// Vertical stack with spacing
<VStack spacing={4}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</VStack>

// Horizontal stack
<HStack spacing={3}>
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</HStack>
```

### Forms
```tsx
<VStack spacing={4}>
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter name" />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="bio">Bio</Label>
    <Textarea id="bio" rows={4} />
  </div>
  
  <Button type="submit">Submit</Button>
</VStack>
```

### Toast
```tsx
const { toast } = useToast()

// Success
toast({
  title: "Success!",
  description: "Your changes have been saved.",
})

// Error
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
})
```

## 🎯 Design Principles

1. **Single Import** — All components from `../components/ui`
2. **Type Safe** — Full TypeScript support
3. **Accessible** — ARIA attributes built-in
4. **DESIGN.md is the only source of design truth** — colors, radii, font sizes,
   spacing, elevation. The Tailwind config and `src/index.css` are mechanical
   mirrors; **never** introduce a new color/radius here without first updating
   `/DESIGN.md` and re-syncing both files.
5. **Flexible** — Customizable with Tailwind (semantic classes only:
   `bg-primary`, `text-ink`, `bg-cloud`, `border-hairline`, `bg-bloom-coral`,
   `text-storm-deep`, …).
6. **Performant** — Optimized bundle size

## 📦 Technology Stack

- **shadcn/ui** - Base components
- **Tailwind CSS** - Styling
- **Radix UI** - Headless primitives
- **lucide-react** - Icons
- **TypeScript** - Type safety

## 🚫 What NOT to Do

```tsx
// ❌ Don't import from subdirectories
import { Button } from '../components/ui/button'

// ✅ Always import from index
import { Button } from '../components/ui'
```

```tsx
// ✅ Use our standardized components (shadcn-style under components/ui)
import { Button } from '../components/ui'
```

## 🔄 Migration from Old Code

If you see old imports like:
```tsx
// ❌ Don't import from old paths (deleted)
import { Button } from '../components/ui-standard'
```

Replace with:
```tsx
import { Button } from '../components/ui'
```

## 📚 More Information

- **Design tokens (source of truth):** [`/DESIGN.md`](../../../DESIGN.md)
- Component source: `src/components/ui/`
- Utility functions: `src/lib/utils.ts`
- Tailwind config (mirrors DESIGN.md): `tailwind.config.js`
- CSS variables (mirrors DESIGN.md): `src/index.css`

---

**Need help?** Check individual component files for detailed prop definitions and usage examples.

