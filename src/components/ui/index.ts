/**
 * UI Components Library
 * Single source of truth for all UI components
 * Based on shadcn/ui + Tailwind CSS
 */

// ============================================
// BUTTONS & ACTIONS
// ============================================
export { Button, buttonVariants } from './button'
export type { ButtonProps } from './button'

// ============================================
// LAYOUT & CONTAINERS
// ============================================
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card'

export { Stack, VStack, HStack, Spacer } from './spacing'

// ============================================
// FORM INPUTS
// ============================================
export { Input } from './input'
export { Label } from './label'
export { Textarea } from './textarea'
export { Checkbox } from './checkbox'
export { Switch } from './switch'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select'

// ============================================
// NAVIGATION
// ============================================
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

// ============================================
// DATA DISPLAY
// ============================================
export { Badge } from './badge'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table'

// ============================================
// OVERLAYS & MODALS
// ============================================
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet'

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './popover'

// ============================================
// FEEDBACK
// ============================================
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast'

export { Toaster } from './toaster'
export { useToast, toast } from './use-toast'

// ============================================
// DATE & TIME
// ============================================
export { Calendar } from './calendar'

// ============================================
// OTHER
// ============================================
export { Slider } from './slider'
export { Separator } from './separator'

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip'

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './accordion'

