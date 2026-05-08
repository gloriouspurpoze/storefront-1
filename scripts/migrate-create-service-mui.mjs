/**
 * One-off migration: MUI → shadcn/Tailwind for create-service.tsx
 * Run: node scripts/migrate-create-service-mui.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(__dirname, '../src/pages/services/create-service.tsx')
let s = fs.readFileSync(file, 'utf8')

if (!s.includes("@mui/material")) {
  console.log('Already migrated or no MUI imports.')
  process.exit(0)
}

const newImports = `import React, { useState, useEffect } from 'react'
import {
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Upload,
  Star,
  Clock,
  IndianRupee,
  Layers,
  FileText,
  Tag,
  Info,
  Calendar,
  MapPin,
  Wrench,
  ArrowUp,
  ArrowDown,
  CircleCheck,
  CircleX,
  Lightbulb,
  ShieldCheck,
  CircleHelp,
  ListOrdered,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Separator } from '../../components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'
import { appToast } from '../../lib/appToast'
import { platformServicesService, PlatformService } from '../../services/api/platformServices.service'
import { CategoriesService } from '../../services/api/categories.service'
import { SubcategoriesService } from '../../services/api/subcategories.service'
import { ProvidersService } from '../../services/api/providers.service'
import { ProductsService } from '../../services/api/products.service'
import {
  RichTextField,
  ImageUploadField,
  type ImageFile,
} from '../../components/forms'
`

// 1) Replace import block through forms import
s = s.replace(
  /^import React[\s\S]*?from '\.\.\/\.\.\/components\/forms'\n/m,
  newImports
)

// 2) Remove snackbar state
s = s.replace(
  /\n  \/\/ Snackbar\n  const \[snackbar, setSnackbar\] = useState\(\{\n    open: false,\n    message: '',\n    severity: 'success' as 'success' \| 'error',\n  }\)\n/,
  '\n'
)

// 3) showSnackbar → appToast, remove wrapper fn
s = s.replace(/showSnackbar\(/g, 'appToast(')
s = s.replace(
  /\n  const showSnackbar = \(message: string, severity: 'success' \| 'error'\) => \{\n    setSnackbar\(\{ open: true, message, severity \}\)\n  \}\n/,
  '\n'
)

// 4) Remove Snackbar block at end
s = s.replace(
  /\n        \{\/\* Snackbar \*\/\}\n        <Snackbar[\s\S]*?<\/Snackbar>\n/,
  '\n'
)

fs.writeFileSync(file, s)
console.log('Pass 1 done: imports, toast, snackbar removed')
