/**
 * ============================================================================
 * BOOKING DETAILS PAGE - MODERN & USER-FRIENDLY DESIGN
 * ============================================================================
 * Beautiful, intuitive booking view for administrators
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button as ShadcnButton,
  Card as ShCard,
  CardContent as ShCardContent,
  Input,
  Label,
  Textarea,
  Badge,
  Avatar as ShAvatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  Dialog as ShDialog,
  DialogContent as ShDialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle as ShDialogTitle,
  Table as ShTable,
  TableBody,
  TableCell as ShTableCell,
  TableHead,
  TableRow as ShTableRow,
  Tooltip as ShTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  UserCheck,
  Star,
  BadgeCheck,
  CalendarClock,
  Play,
  Wallet,
  Info,
  CreditCard,
  User,
  Receipt,
  History,
  Camera,
  StickyNote,
  Loader2,
  Copy,
} from 'lucide-react'
import { AssignProfessionalDialog } from '../../components/bookings/AssignProfessionalDialog'
import { BookingsService } from '../../services/api/bookings.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PaymentsService } from '../../services/api/payments.service'
import { apiClient } from '../../services/apiClient'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { resolveBookingIdLabel } from '../../lib/bookingDisplay'
import { isLikelyImageUrl, parseBookingNotesContent } from '../../lib/parseBookingNotesContent'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'

/** rgba() from #RRGGBB + opacity (replaces legacy alpha helper) */
function muiAlpha(hex: string, opacity: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return `rgba(0,0,0,${opacity})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

const DialogActions = DialogFooter

function Card(props: any) {
  const { sx: _s, ...r } = props
  return <ShCard {...r} />
}

function CardContent(props: any) {
  const { sx: _s, ...r } = props
  return <ShCardContent {...r} />
}

function Table(props: any) {
  const { size: _z, sx: _s, ...r } = props
  return <ShTable {...r} />
}

function TableRow(props: any) {
  const { sx: _s, ...r } = props
  return <ShTableRow {...r} />
}

function TableCell(props: any) {
  const { sx: _s, ...r } = props
  return <ShTableCell {...r} />
}

function Box(props: any) {
  const {
    sx: _s,
    component: C = 'div',
    children,
    bgcolor,
    display,
    flexDirection,
    alignItems,
    justifyContent,
    alignContent,
    flexWrap,
    gap,
    p,
    px,
    py,
    pt,
    pb,
    pl,
    pr,
    m,
    mb,
    mt,
    ml,
    mr,
    mx,
    my,
    flex,
    flexShrink,
    minWidth,
    maxWidth,
    borderRadius,
    overflow,
    border,
    borderColor,
    borderWidth,
    width,
    height,
    position,
    zIndex,
    top,
    right,
    bottom,
    left,
    ...rest
  } = props
  const sp = (n: any) => (typeof n === 'number' ? `${n * 8}px` : n)
  const style: React.CSSProperties = {
    ...(bgcolor != null ? { backgroundColor: bgcolor as string } : {}),
    ...(display ? { display } : {}),
    ...(flexDirection ? { flexDirection } : {}),
    ...(alignItems ? { alignItems } : {}),
    ...(justifyContent ? { justifyContent } : {}),
    ...(alignContent ? { alignContent } : {}),
    ...(flexWrap ? { flexWrap } : {}),
    ...(gap != null ? { gap: sp(gap) as any } : {}),
    ...(p != null ? { padding: sp(p) as any } : {}),
    ...(px != null ? { paddingLeft: sp(px) as any, paddingRight: sp(px) as any } : {}),
    ...(py != null ? { paddingTop: sp(py) as any, paddingBottom: sp(py) as any } : {}),
    ...(pt != null ? { paddingTop: sp(pt) as any } : {}),
    ...(pb != null ? { paddingBottom: sp(pb) as any } : {}),
    ...(pl != null ? { paddingLeft: sp(pl) as any } : {}),
    ...(pr != null ? { paddingRight: sp(pr) as any } : {}),
    ...(m != null ? { margin: sp(m) as any } : {}),
    ...(mb != null ? { marginBottom: sp(mb) as any } : {}),
    ...(mt != null ? { marginTop: sp(mt) as any } : {}),
    ...(ml != null ? { marginLeft: sp(ml) as any } : {}),
    ...(mr != null ? { marginRight: sp(mr) as any } : {}),
    ...(mx != null ? { marginLeft: sp(mx) as any, marginRight: sp(mx) as any } : {}),
    ...(my != null ? { marginTop: sp(my) as any, marginBottom: sp(my) as any } : {}),
    ...(flex != null ? { flex } : {}),
    ...(flexShrink != null ? { flexShrink } : {}),
    ...(minWidth != null ? { minWidth: minWidth as any } : {}),
    ...(maxWidth != null ? { maxWidth: maxWidth as any } : {}),
    ...(borderRadius != null
      ? { borderRadius: typeof borderRadius === 'number' ? `${borderRadius * 8}px` : (borderRadius as any) }
      : {}),
    ...(overflow ? { overflow } : {}),
    ...(border ? { border: border as any } : {}),
    ...(borderColor ? { borderColor: borderColor as any } : {}),
    ...(borderWidth ? { borderWidth: borderWidth as any } : {}),
    ...(width ? { width: width as any } : {}),
    ...(height ? { height: height as any } : {}),
    ...(position ? { position } : {}),
    ...(zIndex != null ? { zIndex } : {}),
    ...(top != null ? { top: sp(top) as any } : {}),
    ...(right != null ? { right: sp(right) as any } : {}),
    ...(bottom != null ? { bottom: sp(bottom) as any } : {}),
    ...(left != null ? { left: sp(left) as any } : {}),
  }
  return (
    <C style={style} {...rest}>
      {children}
    </C>
  )
}

function Typography({ sx: _s, variant: _v, color: _c, gutterBottom: _g, component: C = 'p', children, ...props }: any) {
  return <C {...props}>{children}</C>
}

function Stack({
  sx: _s,
  direction = 'column',
  spacing = 2,
  alignItems,
  flexWrap,
  children,
  ...rest
}: any) {
  const gapPx = typeof spacing === 'number' ? spacing * 8 : 16
  const dir: 'row' | 'column' =
    direction === 'row' || direction === 'row-reverse' ? (direction === 'row-reverse' ? 'row' : 'row') : 'column'
  return (
    <div
      {...rest}
      style={{
        display: 'flex',
        flexDirection: dir,
        alignItems,
        flexWrap,
        gap: gapPx,
      }}
    >
      {children}
    </div>
  )
}

function Grid({ container, item, spacing = 3, children, xs, sm, md, ...rest }: any) {
  if (container) {
    const gap = spacing === 3 ? 'gap-6' : spacing === 2.5 ? 'gap-5' : 'gap-4'
    return (
      <div className={cn('grid grid-cols-12', gap)} {...rest}>
        {children}
      </div>
    )
  }
  if (item) {
    return (
      <div
        className={cn(
          'min-w-0',
          xs === 12 && 'col-span-12',
          sm === 6 && 'col-span-12 sm:col-span-6',
          sm === 4 && 'col-span-12 sm:col-span-4',
          md === 8 && 'col-span-12 lg:col-span-8',
          md === 4 && 'col-span-12 lg:col-span-4',
        )}
        {...rest}
      >
        {children}
      </div>
    )
  }
  return <div {...rest}>{children}</div>
}

function Paper({ sx: _s, variant: _v, children, ...rest }: any) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground" {...rest}>
      {children}
    </div>
  )
}

function Chip({ label, icon, children, sx: _s, size: _z, color, variant, ...rest }: any) {
  const text = label ?? children
  const variantBadge: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' =
    color === 'success'
      ? 'success'
      : color === 'warning'
        ? 'warning'
        : color === 'error'
          ? 'destructive'
          : color === 'primary' && variant === 'outlined'
            ? 'outline'
            : color === 'primary'
              ? 'default'
              : 'secondary'
  return (
    <Badge variant={variantBadge} {...rest}>
      {icon ? <span className="mr-1 inline-flex [&>svg]:h-3 [&>svg]:w-3">{icon}</span> : null}
      {text}
    </Badge>
  )
}

function Alert({ severity, children, sx: _s, icon, ...rest }: any) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border p-3 text-sm',
        severity === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        severity === 'warning' && 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100',
        severity === 'success' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
        (severity === 'info' || !severity) && 'border-sky-500/40 bg-sky-500/10',
      )}
      {...rest}
    >
      {icon ? <span className="mr-2 inline-flex">{icon}</span> : null}
      {children}
    </div>
  )
}

function TextField({
  label,
  multiline,
  rows,
  minRows,
  value,
  onChange,
  fullWidth,
  sx: _s,
  size: _sz,
  helperText,
  InputProps,
  inputProps,
  disabled,
  type,
  id,
  placeholder,
  ...rest
}: any) {
  const fid = id ?? (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : 'field')
  const startAdornment = InputProps?.startAdornment
  if (multiline) {
    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label ? <Label htmlFor={fid}>{label}</Label> : null}
        <Textarea
          id={fid}
          rows={rows ?? minRows ?? 3}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full"
          {...rest}
        />
        {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      </div>
    )
  }
  return (
    <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
      {label ? <Label htmlFor={fid}>{label}</Label> : null}
      <div className="relative">
        {startAdornment ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{startAdornment}</span>
        ) : null}
        <Input
          id={fid}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn('w-full', startAdornment && 'pl-8')}
          {...inputProps}
          {...rest}
        />
      </div>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
    </div>
  )
}

function IconButton({ sx: _s, children, ...rest }: any) {
  return (
    <ShadcnButton type="button" variant="ghost" size="icon" {...rest}>
      {children}
    </ShadcnButton>
  )
}

function CircularProgress({ size = 40, thickness: _thickness }: { size?: number; thickness?: number }) {
  return (
    <Loader2
      className="animate-spin text-muted-foreground"
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}

function TableContainer({ component: _c, sx: _s, variant: _v, children, ...rest }: any) {
  return (
    <div className="overflow-x-auto rounded-md border border-border" {...rest}>
      {children}
    </div>
  )
}

function TooltipMui({ title, children }: any) {
  return (
    <TooltipProvider>
      <ShTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </ShTooltip>
    </TooltipProvider>
  )
}
const Tooltip = TooltipMui

function Avatar({ children, src, sx: _s, ...rest }: any) {
  return (
    <ShAvatar {...rest}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback>{children}</AvatarFallback>
    </ShAvatar>
  )
}

function Button({
  variant,
  color,
  startIcon,
  children,
  sx: _s,
  component,
  href,
  target,
  rel,
  fullWidth,
  size,
  disabled,
  onClick,
  type,
  ...rest
}: any) {
  let v: 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary' = 'default'
  if (variant === 'outlined') v = 'outline'
  else if (variant === 'text') v = 'ghost'
  else if (variant === 'contained') v = color === 'error' ? 'destructive' : 'default'
  const inner = (
    <>
      {startIcon ? <span className="mr-2 inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">{startIcon}</span> : null}
      {children}
    </>
  )
  if (component === 'a' && href) {
    return (
      <ShadcnButton variant={v} disabled={disabled} className={cn(fullWidth && 'w-full', size === 'small' && 'h-8')} asChild {...rest}>
        <a href={href} target={target} rel={rel}>
          {inner}
        </a>
      </ShadcnButton>
    )
  }
  return (
    <ShadcnButton
      type={type ?? 'button'}
      variant={v}
      disabled={disabled}
      onClick={onClick}
      className={cn(fullWidth && 'w-full', size === 'small' && 'h-8')}
      {...rest}
    >
      {inner}
    </ShadcnButton>
  )
}

function DialogTitle({ children, ...rest }: any) {
  return (
    <DialogHeader>
      <ShDialogTitle className="text-left" {...rest}>
        {children}
      </ShDialogTitle>
    </DialogHeader>
  )
}

function DialogContent({ children, sx: _s, ...rest }: any) {
  return (
    <div className="grid gap-4 py-2" {...rest}>
      {children}
    </div>
  )
}

function Dialog({
  open,
  onClose,
  children,
  maxWidth,
  fullWidth,
}: {
  open: boolean
  onClose?: () => void
  children?: React.ReactNode
  maxWidth?: string
  fullWidth?: boolean
}) {
  return (
    <ShDialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <ShDialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          maxWidth === 'sm' && 'max-w-md',
          fullWidth && 'w-[min(95vw,32rem)]',
        )}
      >
        {children}
      </ShDialogContent>
    </ShDialog>
  )
}

// Line item from API (services[] or items[])
interface BookingServiceItem {
  serviceId: string
  serviceName: string
  variantName?: string | null
  quantity: number
  price: number
  serviceDetails?: {
    id: string
    name: string
    slug?: string
    description?: string
    category?: string
    image?: string
    price: number
  }
}

interface BookingDetails {
  _id: string
  bookingId: string
  customer: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    totalBookings?: number
  }
  service: {
    _id: string
    name: string
    category: string
    duration: number
  }
  // Line items (from API services or items)
  services?: BookingServiceItem[]
  address: {
    firstName?: string
    lastName?: string
    street: string
    area?: string
    address?: string
    city: string
    state: string
    pincode?: string
    zipCode?: string
    country?: string
    phone?: string
    landmark?: string
  }
  provider?: {
    _id: string
    businessName: string
    email: string
    phone: string
  }
  professional?: {
    _id: string
    id?: string
    firstName: string
    lastName: string
    email: string
    phone: string
    rating: number
    avatar?: string
    categories: string[]
  }
  scheduledDate: string
  /** Raw ISO from API — used for ops checks (e.g. vs professional weekly hours) */
  scheduledDateIso?: string
  scheduledTime: string
  status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  totalAmount: number
  baseAmount: number
  taxAmount: number
  discountAmount: number
  paidAmount?: number
  paymentStatus: string
  paymentMethod?: string
  bookingType?: string
  notes?: string
  customerNotes?: string
  /** After-job photos from professional (API field or parsed from notes). */
  completionPhotoUrls?: string[]
  preStartSelfieUrl?: string | null
  preStartSitePhotoUrls?: string[]
  cancellationReason?: string | null
  assignedAt?: string | null
  completedDate?: string | null
  /** ISO — professional must accept before this time when assign SLA is enforced */
  acceptDeadlineAt?: string | null
  preJobDamagePhotoUrls?: string[]
  partialRefundRecords?: Array<{
    amount: number
    reason: string
    recordedAt?: string
  }>
  invoice?: {
    id: string
    invoiceNumber?: string
    invoiceDate?: string | null
    status?: string
    total?: number
    pdfUrl?: string
  } | null
  activity: Array<{
    action: string
    user: string
    timestamp: string
    details?: string
  }>
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { color: string; bg: string; label: string; gradient: string }> = {
  pending: { 
    color: '#FF9800', 
    bg: '#FFF3E0', 
    label: 'Pending',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  },
  confirmed: { 
    color: '#2196F3', 
    bg: '#E3F2FD', 
    label: 'Confirmed',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
  },
  scheduled: { 
    color: '#00ACC1', 
    bg: '#E0F7FA', 
    label: 'Scheduled',
    gradient: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)'
  },
  in_progress: { 
    color: '#9C27B0', 
    bg: '#F3E5F5', 
    label: 'In Progress',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
  },
  completed: { 
    color: '#4CAF50', 
    bg: '#E8F5E9', 
    label: 'Completed',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
  },
  cancelled: { 
    color: '#F44336', 
    bg: '#FFEBEE', 
    label: 'Cancelled',
    gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
  },
}

/** URLs embedded in legacy `notes` when the app merges completion photos into text. */
function parseCompletionPhotoUrlsFromNotes(notes: string): string[] {
  const m = notes.match(/\[After-service photos\]/i)
  if (!m || m.index === undefined) return []
  const rest = notes.slice(m.index + m[0].length).trim()
  return rest
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l))
}

function parsePreStartSelfieFromNotes(notes: string): string | null {
  const m = notes.match(/Pre-start selfie:\s*(https?:\/\/\S+)/i)
  return m ? m[1].replace(/[,)\]}]+$/, '') : null
}

function parsePreStartSiteUrlsFromNotes(notes: string): string[] {
  const marker = 'Pre-start site photos:'
  const idx = notes.indexOf(marker)
  if (idx === -1) return []
  const after = notes.slice(idx + marker.length).trim().split('\n')
  const urls: string[] = []
  for (const line of after) {
    const t = line.trim()
    if (!t) break
    if (/^https?:\/\//i.test(t)) urls.push(t.replace(/[,)\]}]+$/, ''))
    else break
  }
  return urls
}

function normalizeUrlList(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map(String).filter((u) => /^https?:\/\//i.test(u.trim()))
  }
  return []
}

/** Remove after-service evidence block from notes shown as prose (thumbnails live in "Professional photo evidence"). */
function stripAfterServicePhotoEvidenceFromNotes(text: string): string {
  const lines = text.split(/\r?\n/)
  const out: string[] = []
  let skipping = false
  for (const line of lines) {
    const t = line.trim()
    if (/^\[After-service photos\]/i.test(t)) {
      const after = t.replace(/^\[After-service photos\]\s*/i, '').trim()
      if (after && /^https?:\/\//i.test(after)) {
        continue
      }
      skipping = true
      continue
    }
    if (skipping) {
      if (isLikelyImageUrl(t)) continue
      if (!t) continue
      skipping = false
    }
    if (!skipping) out.push(line)
  }
  return out.join('\n').trimEnd()
}

/** Remove pre-start lines duplicated under the structured photo evidence card. */
function stripPreStartEvidenceLinesFromNotes(text: string): string {
  const lines = text.split(/\r?\n/)
  const out: string[] = []
  let skippingSite = false
  for (const line of lines) {
    const t = line.trim()
    if (/^Pre-start selfie:/i.test(t)) continue
    if (/^Pre-start site photos:/i.test(t)) {
      skippingSite = true
      continue
    }
    if (skippingSite) {
      if (/^https?:\/\//i.test(t)) continue
      if (!t) continue
      skippingSite = false
    }
    out.push(line)
  }
  return out.join('\n').trimEnd()
}

function professionalNotesForAdminDisplay(notes: string): string {
  return stripPreStartEvidenceLinesFromNotes(stripAfterServicePhotoEvidenceFromNotes(notes)).trim()
}

/** Renders bracket headings, paragraphs, and inline image URLs as thumbnails (admin). */
function AdminNotesRichBody({ text }: { text: string }) {
  const blocks = parseBookingNotesContent(text)
  if (!blocks.length) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No additional written notes. Structured photo evidence is listed below.
      </Typography>
    )
  }
  return (
    <Stack spacing={2}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Typography key={`nh-${index}`} variant="subtitle2" fontWeight={700} color="text.primary">
              {block.title}
            </Typography>
          )
        }
        if (block.type === 'text') {
          return (
            <Typography key={`nt-${index}`} variant="body2" color="text.primary" sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {block.content}
            </Typography>
          )
        }
        return (
          <Box key={`ni-${index}`} display="flex" flexWrap="wrap" gap={1.5}>
            {block.urls.map((url) => (
              <Box
                key={url}
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'block',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 2 },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt=""
                  sx={{ width: 128, height: 128, objectFit: 'cover', display: 'block', bgcolor: 'grey.100' }}
                />
              </Box>
            ))}
          </Box>
        )
      })}
    </Stack>
  )
}

export function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const user = authState?.user ?? null
  const userType = (user as any)?.userType || user?.userType
  const isAdmin = userType === 'admin' || userType === 'super_admin'
  const isProfessional = userType === 'professional'
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignProfessionalOpen, setAssignProfessionalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionDialog, setActionDialog] = useState(false)
  const [action, setAction] = useState<'accept' | 'start' | 'complete' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [earningsDialog, setEarningsDialog] = useState(false)
  const [earningsInfo, setEarningsInfo] = useState<{
    bookingAmount: number
    platformCommission: number
    professionalEarnings: number
  } | null>(null)
  const [paymentReceivedDialog, setPaymentReceivedDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [earningData, setEarningData] = useState<{ earning: any; payout: any } | null>(null)
  const [adminRefundAmount, setAdminRefundAmount] = useState('')
  const [adminRefundReason, setAdminRefundReason] = useState('')
  const [adminRefundBusy, setAdminRefundBusy] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeBusy, setDisputeBusy] = useState(false)

  // Check if current professional is assigned to this booking
  const isAssignedProfessional = booking && isProfessional && booking.professional && (
    booking.professional._id === user?.id || 
    booking.professional._id === (user as any)?._id ||
    (booking as any).professionalId === user?.id ||
    (booking as any).professionalId === (user as any)?._id
  )

  useEffect(() => {
    loadBooking()
  }, [id])

  // Admin: fetch earning by booking when booking is completed (for Payment & earnings section)
  useEffect(() => {
    if (!id || !booking || booking.status !== 'completed') {
      setEarningData(null)
      return
    }
    const isAdminUser = userType === 'admin' || userType === 'super_admin'
    if (!isAdminUser) return

    let cancelled = false
    const fetchEarning = async () => {
      try {
        const res = await apiClient.get(`/earnings/admin/earning-by-booking/${id}`, {
          showLoading: false,
          showSuccessToast: false,
          showErrorToast: false,
        }) as any
        const data = res?.data ?? res
        if (!cancelled && data?.success && data?.data) {
          setEarningData(data.data)
        } else {
          setEarningData(null)
        }
      } catch {
        if (!cancelled) setEarningData(null)
      }
    }
    fetchEarning()
    return () => { cancelled = true }
  }, [id, booking?.status, userType])

  const loadBooking = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await BookingsService.getBookingDetails(id)

      if (response.success && response.data) {
        const apiBooking = response.data.booking || response.data
        
        // Line items: prefer services, fallback to items
        const lineItems: BookingServiceItem[] = (apiBooking.services || apiBooking.items || []).map((s: any) => ({
          serviceId: s.serviceId || s.serviceDetails?.id || '',
          serviceName: s.serviceName || s.serviceDetails?.name || 'Service',
          variantName: s.variantName || null,
          quantity: Number(s.quantity) || 1,
          price: Number(s.price) || 0,
          serviceDetails: s.serviceDetails,
        }))
        
        const firstService = lineItems[0]
        const primaryService = apiBooking.service || (firstService && {
          id: firstService.serviceId,
          name: firstService.serviceName,
          category: firstService.serviceDetails?.category || 'General',
          duration: 60,
        })
        
        const transformed: BookingDetails = {
          _id: apiBooking._id || apiBooking.id,
          bookingId: resolveBookingIdLabel(apiBooking),
          
          customer: {
            _id: apiBooking.customer?.id || apiBooking.customer?._id || apiBooking.customerId || apiBooking.customer_id || 'unknown',
            firstName: apiBooking.customer?.firstName || apiBooking.address?.firstName || 'Unknown',
            lastName: apiBooking.customer?.lastName || apiBooking.address?.lastName || 'Customer',
            email: apiBooking.customer?.email || 'N/A',
            phone: apiBooking.customer?.phone || apiBooking.address?.phone || 'N/A',
            totalBookings: apiBooking.customer?.totalBookings || 0,
          },
          
          service: primaryService ? {
            _id: primaryService.id || primaryService._id || firstService?.serviceId || 'unknown',
            name: primaryService.name || firstService?.serviceName || 'Service',
            category: primaryService.category || firstService?.serviceDetails?.category || 'General',
            duration: primaryService.duration || 60,
          } : {
            _id: 'unknown',
            name: 'Service',
            category: 'General',
            duration: 60,
          },
          
          services: lineItems.length > 0 ? lineItems : undefined,
          
          address: apiBooking.address ? {
            firstName: apiBooking.address.firstName,
            lastName: apiBooking.address.lastName,
            street: apiBooking.address.address || apiBooking.address.street || 'N/A',
            area: apiBooking.address.area,
            address: apiBooking.address.address,
            city: apiBooking.address.city || 'N/A',
            state: apiBooking.address.state || 'N/A',
            pincode: apiBooking.address.zipCode || apiBooking.address.pincode,
            zipCode: apiBooking.address.zipCode || apiBooking.address.pincode,
            country: apiBooking.address.country,
            phone: apiBooking.address.phone,
            landmark: apiBooking.address.landmark,
          } : {
            street: 'N/A',
            city: 'N/A',
            state: 'N/A',
          },
          
          provider: apiBooking.provider && (apiBooking.providerId || apiBooking.provider_id) ? {
            _id: apiBooking.provider.id || apiBooking.provider._id || apiBooking.providerId || 'unknown',
            businessName: (apiBooking.provider as any).businessName || 'N/A',
            email: (apiBooking.provider as any).email || (apiBooking.provider as any).businessEmail || 'N/A',
            phone: (apiBooking.provider as any).phone || (apiBooking.provider as any).businessPhone || 'N/A',
          } : undefined,
          
          professional: undefined,
          
          scheduledDate: apiBooking.scheduledDate || apiBooking.scheduled_date
            ? new Date(apiBooking.scheduledDate || apiBooking.scheduled_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : 'N/A',
          scheduledDateIso: (() => {
            const raw = apiBooking.scheduledDate || apiBooking.scheduled_date
            if (!raw) return undefined
            const d = new Date(raw as string)
            return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
          })(),
          scheduledTime: apiBooking.scheduledTime || apiBooking.scheduled_time || 'N/A',
          
          status: (apiBooking.status || 'pending') as BookingDetails['status'],
          totalAmount: Number(apiBooking.totalAmount ?? apiBooking.total_amount ?? apiBooking.totalPrice ?? 0),
          baseAmount: Number(apiBooking.baseAmount ?? apiBooking.totalAmount ?? apiBooking.total_amount ?? 0),
          taxAmount: Number(apiBooking.taxAmount ?? 0),
          discountAmount: Number(apiBooking.discountAmount ?? 0),
          paidAmount: apiBooking.paidAmount ?? apiBooking.paid_amount,
          paymentStatus: apiBooking.paymentStatus ?? apiBooking.payment_status ?? 'pending',
          paymentMethod: apiBooking.paymentMethod ?? apiBooking.payment_method,
          bookingType: apiBooking.bookingType ?? apiBooking.booking_type,
          notes: apiBooking.notes || '',
          customerNotes:
            apiBooking.customerNotes ||
            apiBooking.specialInstructions ||
            apiBooking.instructions ||
            apiBooking.customerInstruction ||
            '',
          completionPhotoUrls: (() => {
            const fromApi = normalizeUrlList(apiBooking.completionPhotoUrls)
            const fromNotes = parseCompletionPhotoUrlsFromNotes(String(apiBooking.notes || ''))
            return Array.from(new Set([...fromApi, ...fromNotes]))
          })(),
          preStartSelfieUrl:
            apiBooking.preStartAttestation?.photoEvidence?.selfieUrl ||
            parsePreStartSelfieFromNotes(String(apiBooking.notes || '')) ||
            null,
          preStartSitePhotoUrls: (() => {
            const fromApi = normalizeUrlList(
              apiBooking.preStartAttestation?.photoEvidence?.preStartSitePhotoUrls
            )
            const fromNotes = parsePreStartSiteUrlsFromNotes(String(apiBooking.notes || ''))
            return Array.from(new Set([...fromApi, ...fromNotes]))
          })(),
          cancellationReason: apiBooking.cancellationReason ?? apiBooking.cancellation_reason ?? null,
          assignedAt: apiBooking.assignedAt ?? apiBooking.assigned_at ?? null,
          completedDate: apiBooking.completedDate ?? apiBooking.completed_date ?? null,
          acceptDeadlineAt: apiBooking.acceptDeadlineAt ?? apiBooking.accept_deadline_at ?? null,
          preJobDamagePhotoUrls: normalizeUrlList(
            apiBooking.preJobDamagePhotoUrls ?? apiBooking.pre_job_damage_photo_urls
          ),
          partialRefundRecords: Array.isArray(apiBooking.partialRefundRecords)
            ? apiBooking.partialRefundRecords.map((r: any) => ({
                amount: Number(r?.amount) || 0,
                reason: String(r?.reason || ''),
                recordedAt: r?.recordedAt || r?.recorded_at,
              }))
            : [],
          invoice: apiBooking.invoice ? {
            id: apiBooking.invoice.id || apiBooking.invoice_id,
            invoiceNumber: apiBooking.invoice.invoiceNumber,
            invoiceDate: apiBooking.invoice.invoiceDate,
            status: apiBooking.invoice.status,
            total: apiBooking.invoice.total,
            pdfUrl: apiBooking.invoice.pdfUrl,
          } : null,
          activity: apiBooking.activity || [],
          createdAt: apiBooking.createdAt || apiBooking.created_at || new Date().toISOString(),
          updatedAt: apiBooking.updatedAt || apiBooking.updated_at || new Date().toISOString(),
        }
        
        console.log('✅ Transformed Booking:', transformed)
        setBooking(transformed)
        
        // Handle professional: use populated object from API or fetch by ID
        const professionalData = apiBooking.professional ?? apiBooking.professionalId ?? apiBooking.professional_id
        if (professionalData) {
          if (typeof professionalData === 'string') {
            try {
              const professionalResponse = await ProfessionalsService.getProfessional(professionalData)
              if (professionalResponse.success && professionalResponse.data) {
                const profData = professionalResponse.data as any
                const professionalDetails = {
                  _id: profData._id || profData.id || professionalData,
                  firstName: profData.firstName || profData.user?.firstName || '',
                  lastName: profData.lastName || profData.user?.lastName || '',
                  email: profData.email || profData.user?.email || 'N/A',
                  phone: profData.phoneNumber || profData.phone || profData.user?.phone || 'N/A',
                  rating: Number(profData.averageRating ?? profData.rating ?? 0),
                  categories: Array.isArray(profData.categories) ? profData.categories : (profData.services?.map((s: any) => s.name || s) || []),
                }
                setBooking(prev => prev ? { ...prev, professional: professionalDetails } : prev)
              }
            } catch (profErr: any) {
              console.warn('⚠️ Failed to fetch professional details:', profErr.message)
            }
          } else {
            const p = professionalData as any
            const professionalDetails = {
              _id: p._id || p.id || 'unknown',
              firstName: p.firstName || p.user?.firstName || '',
              lastName: p.lastName || p.user?.lastName || '',
              email: p.email || p.user?.email || 'N/A',
              phone: p.phoneNumber || p.phone || p.user?.phone || 'N/A',
              rating: Number(p.averageRating ?? p.rating ?? 0),
              avatar: p.avatar,
              categories: Array.isArray(p.categories) ? p.categories : [],
            }
            setBooking(prev => prev ? { ...prev, professional: professionalDetails } : prev)
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load booking')
      }
    } catch (err: any) {
      console.error('❌ Error loading booking:', err)
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = () => {
    if (booking) {
      const addr = booking.address
      const line1 = addr.address || addr.street || ''
      const line2 = [addr.city, addr.state].filter(Boolean).join(', ')
      const line3 = addr.zipCode || addr.pincode || ''
      const query = [line1, line2, line3, addr.country].filter(Boolean).join(' ')
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      appToast('Please provide a cancellation reason', 'error')
      return
    }
    
    try {
      if (id) {
        const response = await BookingsService.cancelBooking(id, cancelReason)
        if (response.success) {
          appToast('Booking cancelled successfully', 'success')
          setCancelDialogOpen(false)
          setTimeout(() => loadBooking(), 1000)
        } else {
          throw new Error(response.message || 'Failed to cancel booking')
        }
      }
    } catch (err: any) {
      appToast(err.message || 'Failed to cancel booking', 'error')
    }
  }

  const handleDeleteBooking = async () => {
    try {
      if (id) {
        const response = await BookingsService.deleteBooking(id)
        if (response.success) {
          appToast('Booking deleted successfully', 'success')
          setDeleteDialogOpen(false)
          setTimeout(() => navigate('/bookings'), 1500)
        } else {
          throw new Error(response.message || 'Failed to delete booking')
        }
      }
    } catch (err: any) {
      appToast(err.message || 'Failed to delete booking', 'error')
    }
  }

  const refreshAdminEarningByBooking = async () => {
    if (!id) return
    try {
      const res = await apiClient.get(`/earnings/admin/earning-by-booking/${id}`, {
        showLoading: false,
        showSuccessToast: false,
        showErrorToast: false,
      }) as any
      const data = res?.data ?? res
      if (data?.success && data?.data) {
        setEarningData(data.data)
      }
    } catch {
      /* keep existing earningData */
    }
  }

  const handleRecordAdminPartialRefund = async () => {
    if (!id || !booking) return
    const amt = Number(adminRefundAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      appToast('Enter a valid refund amount', 'error')
      return
    }
    if (!adminRefundReason.trim()) {
      appToast('Reason is required', 'error')
      return
    }
    setAdminRefundBusy(true)
    try {
      await BookingsService.recordAdminPartialRefund(id, amt, adminRefundReason.trim())
      setAdminRefundAmount('')
      setAdminRefundReason('')
      appToast('Partial refund recorded on booking', 'success')
      await loadBooking()
    } catch (err: any) {
      appToast(err?.message || 'Failed to record refund', 'error')
    } finally {
      setAdminRefundBusy(false)
    }
  }

  const handleVerifyEarningPayment = async () => {
    const eid = earningData?.earning?._id || earningData?.earning?.id
    if (!eid) return
    try {
      await apiClient.post(`/earnings/admin/${eid}/verify-payment`, {}, {
        showLoading: true,
        loadingMessage: 'Verifying payment…',
        successMessage: 'Payment marked verified',
        showErrorToast: true,
      })
      await refreshAdminEarningByBooking()
      await loadBooking()
    } catch (err: any) {
      appToast(err?.message || 'Verify failed', 'error')
    }
  }

  const handleEarningDispute = async (open: boolean) => {
    const eid = earningData?.earning?._id || earningData?.earning?.id
    if (!eid) return
    if (open && !disputeReason.trim()) {
      appToast('Enter a short reason to open a dispute', 'error')
      return
    }
    setDisputeBusy(true)
    try {
      await apiClient.post(`/earnings/admin/${eid}/dispute`, {
        open,
        reason: open ? disputeReason.trim() : undefined,
      }, {
        showLoading: true,
        loadingMessage: open ? 'Opening dispute…' : 'Clearing dispute…',
        successMessage: open ? 'Dispute opened — earning on hold' : 'Dispute cleared',
      })
      if (!open) setDisputeReason('')
      await refreshAdminEarningByBooking()
      await loadBooking()
    } catch (err: any) {
      appToast(err?.message || 'Dispute update failed', 'error')
    } finally {
      setDisputeBusy(false)
    }
  }

  // Professional actions
  const handleProfessionalAction = async () => {
    if (!booking || !action || !id) return

    try {
      let response
      
      switch (action) {
        case 'accept':
          // Accept booking - try professional endpoint first, fallback to regular endpoint
          try {
            response = await BookingsService.updateProfessionalBookingStatus(id, {
              status: 'scheduled' as any, // Type assertion needed as backend accepts 'confirmed'
              notes: actionNotes || undefined,
            })
          } catch (err: any) {
            // Fallback to regular endpoint if professional endpoint doesn't exist
            if (err.response?.status === 404) {
              response = await BookingsService.updateBookingStatus(id, {
                status: 'scheduled' as any,
                notes: actionNotes || undefined,
              })
            } else {
              throw err
            }
          }
          break
          
        case 'start':
          // Start work - use dedicated start method that tries multiple endpoints
          response = await BookingsService.startBooking(id, actionNotes || undefined)
          break
          
        case 'complete':
          // Step 1: Check payment method and status
          const paymentCompleted = booking.paymentStatus === 'paid' || 
                                   booking.paymentStatus === 'completed' ||
                                   booking.paymentStatus === 'customer_paid' ||
                                   booking.paymentStatus === 'verified'
          
          const isCashPayment = (() => {
            const method = booking.paymentMethod?.toLowerCase() || ''
            return method === 'cash' || 
                   method === 'pay_after_service' ||
                   method === 'pay_later' ||
                   method.includes('pay_later') ||
                   method.includes('pay after') ||
                   method === 'cash_on_delivery' ||
                   method.includes('cash') ||
                   method === 'pay_after' ||
                   method === 'cod'
          })()
          
          // For cash/pay_after_service payments, always allow completion (backend will handle payment marking)
          if (isCashPayment) {
            console.log('💵 Cash/Pay After Service payment detected - allowing completion (backend will mark payment)')
          } 
          // For online payments, verify payment status
          else if (!paymentCompleted) {
            // Try to verify payment status from API
            try {
              console.log('💳 Checking payment status before completion...')
              const paymentsResponse = await PaymentsService.getPaymentsByBooking(id)
              
              if (paymentsResponse.success && paymentsResponse.data) {
                const payments = Array.isArray(paymentsResponse.data) 
                  ? paymentsResponse.data 
                  : (paymentsResponse.data as any)?.payments || []
                
                // Check if there's a completed payment
                const completedPayment = payments.find((p: any) => 
                  p.status === 'completed' || 
                  p.status === 'paid' || 
                  p.status === 'success' ||
                  p.status === 'customer_paid' ||
                  p.status === 'verified'
                )
                
                if (!completedPayment) {
                  // No completed payment found - but allow with warning for professionals
                  console.warn('⚠️ No completed payment found, but allowing professional to complete booking')
                  // Don't block - let backend handle payment verification
                } else {
                  console.log('✅ Payment verified:', completedPayment)
                }
              } else {
                // If we can't verify payment, allow with warning (backend will handle)
                console.warn('⚠️ Unable to verify payment status, but allowing completion (backend will verify)')
              }
            } catch (paymentErr: any) {
              // Don't block completion if payment verification fails - backend will handle
              console.warn('⚠️ Payment verification failed, but allowing completion:', paymentErr.message)
              // Allow professional to complete - backend will verify and handle payment status
            }
          }
          
          // Step 2: Complete the booking with admin notification
          // Backend will:
          // - Mark payment as completed (if cash/pay_after_service)
          // - Send notification to admin
          // - Calculate and add earnings to professional wallet
          response = await BookingsService.completeBooking(id, actionNotes || undefined, {
            notifyAdmin: true, // ✅ Notify admin when service is completed
            notifyCustomer: true, // Notify customer
          })
          
          // Step 3: Calculate and show earnings (for professionals)
          if (response.success && isProfessional && booking) {
            // Calculate earnings (assuming 10% platform commission)
            // Note: Backend should return actual commission rate, but we'll use 10% as default
            const platformCommissionRate = 0.10 // 10% commission
            const bookingAmount = booking.totalAmount || 0
            const platformCommission = bookingAmount * platformCommissionRate
            const professionalEarnings = bookingAmount - platformCommission
            
            setEarningsInfo({
              bookingAmount,
              platformCommission,
              professionalEarnings,
            })
            setEarningsDialog(true)
            
            // Show success message
            dispatch(addToast({
              message: 'Booking completed! Admin has been notified. Your earnings have been added to your wallet.',
              severity: 'success'
            }))
            
            console.log('✅ Booking completed successfully')
            console.log('📧 Admin notification sent by backend')
            console.log('💰 Earnings calculated:', { bookingAmount, platformCommission, professionalEarnings })
          }
          break
          
        default:
          throw new Error('Invalid action')
      }
      
      if (response.success) {
        appToast(
          action === 'accept'
            ? 'Booking accepted successfully!'
            : action === 'start'
              ? 'Work started successfully!'
              : 'Booking completed successfully!',
          'success',
        )
        await loadBooking()
        setActionDialog(false)
        setAction(null)
        setActionNotes('')
      } else {
        throw new Error(response.message || 'Failed to update booking')
      }
    } catch (error: any) {
      console.error('Action failed:', error)
      appToast(error.message || 'Failed to update booking', 'error')
      setActionDialog(false)
      setAction(null)
      setActionNotes('')
    }
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={3} color="text.secondary">
          Loading booking details...
        </Typography>
      </Box>
    )
  }

  if (error || !booking) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Booking not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
      </Box>
    )
  }

  const config = statusConfig[booking.status] || statusConfig.pending

  const displayAddress = booking.address.address || booking.address.street
  const displayPincode = booking.address.zipCode || booking.address.pincode
  const professionalDisplayName = booking.professional
    ? [booking.professional.firstName, booking.professional.lastName].filter(Boolean).join(' ').trim() || `Professional #${(booking.professional._id || booking.professional.id || '').slice(-6)}`
    : ''

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 },
      bgcolor: '#f5f7fa',
      minHeight: '100vh',
    }}>
      {/* Premium Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 50%, ${config.color}cc 100%)`,
          borderRadius: 4,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 4 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={3}>
              <Tooltip title="Back to Bookings">
                <IconButton 
                  onClick={() => navigate('/bookings')}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    color: 'white',
                    width: 48,
                    height: 48,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.35)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowLeft />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight="800"
                  sx={{ 
                    color: 'white',
                    mb: 0.5,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  {booking.bookingId}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)',
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  {booking.service.name}
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      color: 'rgba(255,255,255,0.82)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      letterSpacing: 0.2,
                      wordBreak: 'break-all',
                      maxWidth: { xs: '100%', sm: 'min(100%, 28rem)' },
                    }}
                  >
                    ID {booking._id}
                  </Typography>
                  <Tooltip title="Copy full booking ID">
                    <IconButton
                      size="small"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(booking._id)
                          appToast('Booking ID copied', 'success', 2500)
                        } catch {
                          appToast('Could not copy', 'error')
                        }
                      }}
                      sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        width: 28,
                        height: 28,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
                      }}
                      aria-label="Copy booking ID"
                    >
                      <Copy size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
            <Chip
              label={config.label}
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: 13, md: 15 },
                px: 2.5,
                py: 1,
                height: 'auto',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Premium Action Buttons Section */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1.5}>
          {isAdmin ? (
            // Admin buttons
            <>
              <Button
                variant="contained"
                startIcon={<Pencil />}
                onClick={() => navigate(`/bookings/${id}/edit`)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Edit Booking
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<UserCheck />}
                onClick={() => setAssignProfessionalOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {booking.professional ? 'Reassign' : 'Assign'} Professional
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<XCircle />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Cancel Booking
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Delete
              </Button>
              {/* Admin: same lifecycle as assigned professional (support / oversight); backend allows admin on these routes */}
              {booking.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => {
                      setAction('accept')
                      setActionDialog(true)
                    }}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                    }}
                  >
                    Accept Booking
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<XCircle />}
                    onClick={() => setCancelDialogOpen(true)}
                    sx={{ borderRadius: 2, px: 3, py: 1.2, fontWeight: 600, textTransform: 'none', borderWidth: 2 }}
                  >
                    Reject
                  </Button>
                </>
              )}
              {(booking.status === 'confirmed' || booking.status === 'scheduled') && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Play />}
                  onClick={() => {
                    setAction('start')
                    setActionDialog(true)
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  }}
                >
                  Start Work
                </Button>
              )}
              {booking.status === 'in_progress' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => {
                    setAction('complete')
                    setActionDialog(true)
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  }}
                >
                  Mark Complete
                </Button>
              )}
              {(() => {
                const statusLower = booking.status?.toLowerCase() || ''
                const isCompleted = statusLower === 'completed'
                const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
                const isPayAfterService =
                  paymentMethodLower.includes('pay_after') ||
                  paymentMethodLower.includes('pay after') ||
                  paymentMethodLower === 'pay_after_service' ||
                  paymentMethodLower === 'pay_later' ||
                  paymentMethodLower.includes('pay_later') ||
                  paymentMethodLower.includes('pay later')
                const isCash =
                  paymentMethodLower === 'cash' ||
                  paymentMethodLower === 'cash_on_delivery' ||
                  paymentMethodLower.includes('cash')
                const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
                const paymentNotPaid =
                  paymentStatusLower !== 'paid' &&
                  paymentStatusLower !== 'completed' &&
                  paymentStatusLower !== 'success' &&
                  paymentStatusLower !== 'received' &&
                  paymentStatusLower !== 'customer_paid' &&
                  paymentStatusLower !== 'verified'
                const showAdminPayment =
                  isCompleted &&
                  (isPayAfterService || isCash) &&
                  paymentNotPaid
                if (!showAdminPayment) return null
                return (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CreditCard />}
                    onClick={() => {
                      setPaymentAmount(booking.totalAmount.toString())
                      setPaymentReceivedDialog(true)
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    Mark Payment Received
                  </Button>
                )
              })()}
            </>
          ) : isProfessional ? (
            // Professional buttons - only show if this booking is assigned to them
            isAssignedProfessional ? (
              <>
                {booking.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        setAction('accept')
                        setActionDialog(true)
                      }}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Accept Booking
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<XCircle />}
                      onClick={() => setCancelDialogOpen(true)}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Play />}
                    onClick={() => {
                      setAction('start')
                      setActionDialog(true)
                    }}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Start Work
                  </Button>
                )}
                {booking.status === 'in_progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => {
                      setAction('complete')
                      setActionDialog(true)
                    }}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
                {(() => {
                  // Debug logging and flexible condition checking
                  const statusLower = booking.status?.toLowerCase() || ''
                  const isCompleted = statusLower === 'completed'
                  
                  const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
                  const isPayAfterService = paymentMethodLower.includes('pay_after') || 
                                           paymentMethodLower.includes('pay after') ||
                                           paymentMethodLower === 'pay_after_service' ||
                                           paymentMethodLower === 'pay_later' ||
                                           paymentMethodLower.includes('pay_later') ||
                                           paymentMethodLower.includes('pay later')
                  const isCash = paymentMethodLower === 'cash' || 
                                paymentMethodLower === 'cash_on_delivery' ||
                                paymentMethodLower.includes('cash')
                  
            const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
            const paymentNotPaid = paymentStatusLower !== 'paid' && 
                                  paymentStatusLower !== 'completed' &&
                                  paymentStatusLower !== 'success' &&
                                  paymentStatusLower !== 'received' &&
                                  paymentStatusLower !== 'customer_paid' &&
                                  paymentStatusLower !== 'verified'
                  
                  const shouldShowButton =
                    isCompleted &&
                    (isPayAfterService || isCash) &&
                    paymentNotPaid &&
                    (isAssignedProfessional || isAdmin)
                  
                  // Disable button if payment is already marked as received
                  const isPaymentReceived = !paymentNotPaid
                  
                  // Debug log for all completed bookings when professional
                  if (isCompleted && isProfessional) {
                    console.log('🔍 Payment Button Debug (Details Page):', {
                      bookingId: booking._id,
                      status: booking.status,
                      statusLower,
                      paymentMethod: booking.paymentMethod,
                      paymentMethodLower,
                      paymentStatus: booking.paymentStatus,
                      paymentStatusLower,
                      isCompleted,
                      isPayAfterService,
                      isCash,
                      paymentNotPaid,
                      shouldShowButton,
                      isProfessional,
                      isAssignedProfessional
                    })
                  }
                  
                  return shouldShowButton ? (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CreditCard />}
                      onClick={() => {
                        setPaymentAmount(booking.totalAmount.toString())
                        setPaymentReceivedDialog(true)
                      }}
                      disabled={isPaymentReceived}
                      sx={{ borderRadius: 2 }}
                    >
                      {isPaymentReceived ? 'Payment Already Received' : 'Mark Payment Received'}
                    </Button>
                  ) : isCompleted && (isPayAfterService || isCash) && isPaymentReceived ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Payment Received"
                      color="success"
                      sx={{ borderRadius: 2 }}
                    />
                  ) : null
                })()}
                {(() => {
                  const statusLower = booking.status?.toLowerCase() || ''
                  const isCompleted = statusLower === 'completed'
                  const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
                  const isPayAfterService = paymentMethodLower.includes('pay_after') || 
                                           paymentMethodLower.includes('pay after') ||
                                           paymentMethodLower === 'pay_later' ||
                                           paymentMethodLower.includes('pay_later') ||
                                           paymentMethodLower.includes('pay later')
                  const isCash = paymentMethodLower === 'cash' || 
                                paymentMethodLower === 'cash_on_delivery' ||
                                paymentMethodLower.includes('cash')
                  const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
                  const paymentNotPaid = paymentStatusLower !== 'paid' && paymentStatusLower !== 'completed' && paymentStatusLower !== 'success'
                  const shouldShowPaymentButton =
                    isCompleted &&
                    (isPayAfterService || isCash) &&
                    paymentNotPaid &&
                    (isAssignedProfessional || isAdmin)
                  
                  return (isCompleted || booking.status === 'cancelled') && !shouldShowPaymentButton ? (
                    <Typography variant="body2" color="text.secondary">
                      {isCompleted ? 'This booking has been completed.' : 'This booking has been cancelled.'}
                    </Typography>
                  ) : null
                })()}
              </>
            ) : (
              <Alert severity="info">
                This booking is not assigned to you.
              </Alert>
            )
          ) : null}
        </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Premium Customer Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: 28,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {([booking.customer.firstName, booking.customer.lastName].filter(Boolean).join(' ').trim().slice(0, 2) || 'C').toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                    <Typography variant="h5" fontWeight="700" color="text.primary">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </Typography>
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                  </Box>
                  {(booking.customer.totalBookings != null && booking.customer.totalBookings > 0) && (
                    <Chip
                      icon={<User className="h-4 w-4" />}
                      label={`${booking.customer.totalBookings} Previous Bookings`}
                      size="small"
                      sx={{
                        bgcolor: muiAlpha('#4CAF50', 0.1),
                        color: 'success.dark',
                        fontWeight: 600,
                        height: 24,
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Separator className="mb-3" />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2} 
                    p={2} 
                    bgcolor={muiAlpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: muiAlpha('#2196F3', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: muiAlpha('#2196F3', 0.12),
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone className="h-[22px] w-[22px]" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
                        {booking.customer.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2} 
                    p={2} 
                    bgcolor={muiAlpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: muiAlpha('#2196F3', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: muiAlpha('#2196F3', 0.12),
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail className="h-[22px] w-[22px]" />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="600" noWrap sx={{ mt: 0.5 }}>
                        {booking.customer.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Service Details & Order Items */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarClock className="h-6 w-6" />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Service & Order Items
                </Typography>
              </Box>
              <Separator className="mb-3" />
              
              <Box mb={3}>
                <Typography variant="h5" color="primary.main" fontWeight="700" gutterBottom>
                  {booking.service.name}
                </Typography>
                <Chip 
                  label={booking.service.category} 
                  size="medium" 
                  sx={{ 
                    bgcolor: muiAlpha('#2196F3', 0.1),
                    color: 'primary.dark',
                    fontWeight: 600,
                    height: 28,
                    px: 1,
                  }} 
                />
              </Box>

              {booking.services && booking.services.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: muiAlpha('#2196F3', 0.08) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {booking.services.map((item, idx) => {
                        const lineTotal = item.quantity * item.price
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {item.serviceName}
                              </Typography>
                              {item.variantName && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.variantName}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.price}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>₹{lineTotal}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : null}

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={muiAlpha('#FF9800', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: muiAlpha('#FF9800', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: muiAlpha('#FF9800', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Calendar className="h-6 w-6 text-orange-500" />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Date
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.scheduledDate}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={muiAlpha('#9C27B0', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: muiAlpha('#9C27B0', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: muiAlpha('#9C27B0', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Clock className="h-6 w-6 text-purple-600" />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Time
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.scheduledTime}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={muiAlpha('#4CAF50', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: muiAlpha('#4CAF50', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: muiAlpha('#4CAF50', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <CalendarClock className="h-6 w-6 text-green-600" />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Duration
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.service.duration} min
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Premium Address Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MapPin className="h-6 w-6" />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Service Location
                  </Typography>
                </Box>
                <Button
                  startIcon={<Navigation />}
                  onClick={handleNavigate}
                  variant="contained"
                  sx={{ 
                    borderRadius: 2,
                    px: 2.5,
                    py: 1,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Navigate
                </Button>
              </Box>
              <Separator className="mb-3" />
              
              <Box 
                display="flex" 
                gap={3}
                p={2.5}
                bgcolor={muiAlpha('#F44336', 0.05)}
                borderRadius={2.5}
                sx={{
                  border: '1px solid',
                  borderColor: muiAlpha('#F44336', 0.15),
                }}
              >
                <MapPin className="h-10 w-10 shrink-0 text-destructive" />
                <Box flex={1}>
                  {(booking.address.firstName || booking.address.lastName) && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {[booking.address.firstName, booking.address.lastName].filter(Boolean).join(' ')}
                    </Typography>
                  )}
                  <Typography variant="body1" fontWeight="700" color="text.primary" mb={1}>
                    {displayAddress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    {[booking.address.city, booking.address.state].filter(Boolean).join(', ')}
                    {displayPincode ? ` - ${displayPincode}` : ''}
                  </Typography>
                  {booking.address.country && (
                    <Typography variant="body2" color="text.secondary" mb={0.5}>
                      {booking.address.country}
                    </Typography>
                  )}
                  {booking.address.phone && (
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5} mt={1}>
                      <Phone className="h-4 w-4" />{booking.address.phone}
                    </Typography>
                  )}
                  {booking.address.landmark && (
                    <Box 
                      mt={1.5}
                      p={1.5}
                      bgcolor={muiAlpha('#FF9800', 0.1)}
                      borderRadius={1.5}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                    >
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        Landmark: {booking.address.landmark}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Notes & context — professional log strips duplicated evidence; rich render for any remaining URLs */}
          {(booking.customerNotes || professionalNotesForAdminDisplay(booking.notes || '')) && (
            <ShCard className="mt-6 rounded-lg border border-border shadow-sm">
              <ShCardContent className="p-4 sm:p-6">
                <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={2}>
                  <StickyNote className="mt-1 h-7 w-7 shrink-0 text-primary" />
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight={700}>
                      Notes & context
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, maxWidth: 720 }}>
                      Booking log and professional comments. After-service and pre-start photos are de-duplicated here
                      and shown in <strong>Professional photo evidence</strong> below.
                    </Typography>
                  </Box>
                </Stack>
                <Separator className="mb-2" />
                <Stack spacing={2.5}>
                  {professionalNotesForAdminDisplay(booking.notes || '') ? (
                    <Paper className="rounded-lg border border-border bg-muted/30 p-4">
                      <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={0.8}>
                        Booking & professional
                      </Typography>
                      <Box sx={{ mt: 1.5 }}>
                        <AdminNotesRichBody text={professionalNotesForAdminDisplay(booking.notes || '')} />
                      </Box>
                    </Paper>
                  ) : null}
                  {booking.customerNotes ? (
                    <Paper className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <User className="h-5 w-5 text-amber-700" />
                        <Typography variant="overline" color="warning.dark" fontWeight={700} letterSpacing={0.8}>
                          Customer instructions
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ lineHeight: 1.75, whiteSpace: 'pre-wrap' }}
                      >
                        {booking.customerNotes}
                      </Typography>
                    </Paper>
                  ) : null}
                </Stack>
              </ShCardContent>
            </ShCard>
          )}

          {/* Professional-submitted photo evidence (pre-start + completion) — surfaced for admin oversight */}
          {((booking.completionPhotoUrls?.length ?? 0) > 0 ||
            Boolean(booking.preStartSelfieUrl) ||
            (booking.preStartSitePhotoUrls?.length ?? 0) > 0) && (
            <Card
              sx={{
                mt: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#00897B',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera className="h-6 w-6" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="700" color="text.primary">
                      Professional photo evidence
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Images from start-of-job and completion flows (opens in new tab).
                    </Typography>
                  </Box>
                </Box>
                <Separator className="mb-2" />
                {booking.preStartSelfieUrl ? (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="600" mb={1}>
                      Pre-start — on-site selfie
                    </Typography>
                    <Box
                      component="a"
                      href={booking.preStartSelfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      display="inline-block"
                      borderRadius={2}
                      overflow="hidden"
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    >
                      <Box
                        component="img"
                        src={booking.preStartSelfieUrl}
                        alt="Professional pre-start selfie"
                        sx={{ width: 160, height: 160, objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                  </Box>
                ) : null}
                {(booking.preStartSitePhotoUrls?.length ?? 0) > 0 ? (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="600" mb={1}>
                      Pre-start — site photos
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                      {(booking.preStartSitePhotoUrls ?? []).map((url) => (
                        <Box
                          key={url}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          borderRadius={2}
                          overflow="hidden"
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt="Pre-start site"
                            sx={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null}
                {(booking.completionPhotoUrls?.length ?? 0) > 0 ? (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="600" mb={1}>
                      After-service / completion photos
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1.5}>
                      {(booking.completionPhotoUrls ?? []).map((url) => (
                        <Box
                          key={url}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          borderRadius={2}
                          overflow="hidden"
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt="Completion evidence"
                            sx={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          {booking.activity && booking.activity.length > 0 && (
            <Card 
              sx={{ 
                mt: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#9C27B0',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <History className="h-6 w-6" />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Activity Timeline
                  </Typography>
                </Box>
                <Separator className="mb-3" />
                
                <Stack spacing={2}>
                  {booking.activity.map((activity, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        pl: 4,
                        pb: index < booking.activity.length - 1 ? 2 : 0,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 7,
                          top: 8,
                          bottom: index < booking.activity.length - 1 ? -16 : 0,
                          width: 2,
                          bgcolor: muiAlpha('#9C27B0', 0.2),
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: 4,
                          top: 4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#9C27B0',
                          border: '2px solid white',
                          boxShadow: '0 0 0 2px rgba(156, 39, 176, 0.2)',
                        }
                      }}
                    >
                      <Box
                        p={2}
                        bgcolor={muiAlpha('#9C27B0', 0.05)}
                        borderRadius={2}
                        sx={{
                          border: '1px solid',
                          borderColor: muiAlpha('#9C27B0', 0.15),
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={0.5}>
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                        {activity.details && (
                          <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontStyle: 'italic' }}>
                            {activity.details}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Premium Professional Assignment Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck className="h-6 w-6" />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Assigned Professional
                </Typography>
              </Box>
              <Separator className="mb-3" />
              
              {booking.professional ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2.5} mb={3}>
                    <Avatar 
                      src={booking.professional.avatar}
                      sx={{ 
                        width: 72, 
                        height: 72,
                        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: 28,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      {professionalDisplayName ? professionalDisplayName.slice(0, 2).toUpperCase() : 'P'}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="700" color="text.primary" mb={0.5}>
                        {professionalDisplayName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Star className="h-5 w-5 text-amber-500" />
                        <Typography variant="body1" fontWeight="700" color="text.primary">
                          {Number(booking.professional.rating).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" ml={0.5}>
                          Rating
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {(booking.professional.phone || booking.professional.email) && (
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={2} 
                      mb={2.5} 
                      p={2} 
                      bgcolor={muiAlpha('#2196F3', 0.08)} 
                      borderRadius={2.5}
                      sx={{
                        border: '1px solid',
                        borderColor: muiAlpha('#2196F3', 0.2),
                      }}
                    >
                      {booking.professional.phone ? (
                        <>
                          <Phone className="h-[22px] w-[22px] text-primary" />
                          <Typography variant="body1" fontWeight="600">
                            {booking.professional.phone}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Mail className="h-[22px] w-[22px] text-primary" />
                          <Typography variant="body1" fontWeight="600">
                            {booking.professional.email}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}

                  {booking.professional.categories && booking.professional.categories.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                        Specializations
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {booking.professional.categories.map(cat => (
                          <Chip 
                            key={cat} 
                            label={cat} 
                            size="small"
                            sx={{
                              bgcolor: muiAlpha('#2196F3', 0.1),
                              color: 'primary.dark',
                              fontWeight: 600,
                              height: 28,
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Alert 
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    bgcolor: muiAlpha('#2196F3', 0.05),
                  }}
                >
                  No professional assigned yet
                </Alert>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card
              sx={{
                mb: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="700" color="text.primary" gutterBottom>
                  Support and ledger
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Partial refunds are recorded on the booking for accounting; they do not call a payment gateway.
                </Typography>
                <Separator className="mb-2" />
                {booking.status === 'pending' && booking.acceptDeadlineAt && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Accept-by (assign SLA)</strong>
                    <br />
                    {new Date(booking.acceptDeadlineAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Alert>
                )}
                {booking.preJobDamagePhotoUrls && booking.preJobDamagePhotoUrls.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                      Pre-job condition photos
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {booking.preJobDamagePhotoUrls.map((u) => (
                        <Box
                          key={u}
                          component="a"
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block' }}
                        >
                          <Box
                            component="img"
                            src={u}
                            alt=""
                            sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                {booking.partialRefundRecords && booking.partialRefundRecords.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                      Recorded partial refunds
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Amount</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>When</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {booking.partialRefundRecords.map((r, idx) => (
                            <TableRow key={`${r.recordedAt || idx}-${r.amount}`}>
                              <TableCell>₹{Number(r.amount).toLocaleString()}</TableCell>
                              <TableCell>{r.reason}</TableCell>
                              <TableCell>
                                {r.recordedAt
                                  ? new Date(r.recordedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
                <Stack spacing={1.5}>
                  <TextField
                    label="Partial refund amount (₹)"
                    type="number"
                    size="small"
                    value={adminRefundAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminRefundAmount(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    label="Reason (required)"
                    size="small"
                    value={adminRefundReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdminRefundReason(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    disabled={adminRefundBusy}
                    onClick={() => void handleRecordAdminPartialRefund()}
                  >
                    Record partial refund
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Premium Payment Card */}
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: '#4CAF50',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt className="h-6 w-6" />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Payment Details
                </Typography>
              </Box>
              <Separator className="mb-3" />
              
              <Stack spacing={2.5}>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1.5}
                  bgcolor={muiAlpha('#2196F3', 0.05)}
                  borderRadius={1.5}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="700" color="text.primary">
                    ₹{booking.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                {(booking.paidAmount != null && Number(booking.paidAmount) > 0) && (
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    p={1.5}
                    bgcolor={muiAlpha('#4CAF50', 0.08)}
                    borderRadius={1.5}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Paid Amount
                    </Typography>
                    <Typography variant="body1" fontWeight="700" color="success.main">
                      ₹{Number(booking.paidAmount).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={2}
                  bgcolor={muiAlpha('#FF9800', 0.05)}
                  borderRadius={2}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    Payment Status
                  </Typography>
                  <Chip
                    label={String(booking.paymentStatus).replace(/_/g, ' ')}
                    size="medium"
                    color={['paid', 'completed', 'customer_paid', 'verified'].includes(String(booking.paymentStatus).toLowerCase()) ? 'success' : 'warning'}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  />
                </Box>
                {booking.paymentMethod && (
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    p={2}
                    bgcolor={muiAlpha('#9C27B0', 0.05)}
                    borderRadius={2}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Payment Method
                    </Typography>
                    <Chip
                      label={String(booking.paymentMethod).replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        bgcolor: muiAlpha('#9C27B0', 0.1),
                        color: '#9C27B0',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                )}
                {booking.bookingType && (
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    p={2}
                    bgcolor={muiAlpha('#2196F3', 0.05)}
                    borderRadius={2}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Booking Type
                    </Typography>
                    <Chip
                      label={String(booking.bookingType).replace(/_/g, ' ')}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Booking meta: assigned at, completed at, cancellation reason */}
          <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Booking Info
              </Typography>
              <Stack spacing={1.5}>
                {booking.assignedAt && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <UserCheck className="h-[18px] w-[18px] text-muted-foreground" />
                    <Typography variant="body2">
                      Assigned on {new Date(booking.assignedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                  </Box>
                )}
                {booking.completedDate && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle className="h-[18px] w-[18px] text-green-600" />
                    <Typography variant="body2">
                      Completed on {new Date(booking.completedDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                  </Box>
                )}
                {booking.status === 'cancelled' && booking.cancellationReason && (
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <XCircle className="mt-0.5 h-[18px] w-[18px] text-destructive" />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Reason:</strong> {booking.cancellationReason}
                    </Typography>
                  </Box>
                )}
                {!booking.assignedAt && !booking.completedDate && booking.status !== 'cancelled' && (
                  <Typography variant="body2" color="text.secondary">
                    Created {new Date(booking.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </Typography>
                )}
                {(booking as any).source && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Source:</strong> {(booking as any).source === 'web' ? 'Website' : 'Mobile app'}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Invoice card */}
          {booking.invoice && booking.invoice.id && (
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#4CAF50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt className="h-6 w-6" />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Invoice
                  </Typography>
                </Box>
                <Separator className="mb-3" />
                <Stack spacing={1.5}>
                  {booking.invoice.invoiceNumber && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Invoice #</Typography>
                      <Typography variant="body2" fontWeight={600}>{booking.invoice.invoiceNumber}</Typography>
                    </Box>
                  )}
                  {booking.invoice.invoiceDate && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body2">{new Date(booking.invoice.invoiceDate).toLocaleDateString()}</Typography>
                    </Box>
                  )}
                  {booking.invoice.status && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip label={String(booking.invoice.status)} size="small" sx={{ textTransform: 'capitalize' }} />
                    </Box>
                  )}
                  {booking.invoice.total != null && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Total</Typography>
                      <Typography variant="body1" fontWeight={700}>₹{Number(booking.invoice.total).toLocaleString()}</Typography>
                    </Box>
                  )}
                  {booking.invoice.pdfUrl && (
                    <Button
                      component="a"
                      href={booking.invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<Receipt />}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Download PDF
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Admin: Payment & earnings — pending receivable, professional payout status */}
          {isAdmin && booking.status === 'completed' && (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'primary.200',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Wallet className="h-6 w-6" />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Payment & earnings
                  </Typography>
                  <Chip label="Admin view" size="small" color="primary" variant="outlined" />
                </Box>
                <Separator className="mb-3" />
                {earningData?.earning ? (
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5} bgcolor={muiAlpha('#2196F3', 0.06)} borderRadius={1.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">Booking amount</Typography>
                      <Typography variant="body1" fontWeight="700">₹{Number(earningData.earning.bookingAmount || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5} bgcolor={muiAlpha('#4CAF50', 0.08)} borderRadius={1.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">Platform commission (pending receivable)</Typography>
                      <Typography variant="body1" fontWeight="700" color="success.main">₹{Number(earningData.earning.platformCommission || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5} bgcolor={muiAlpha('#FF9800', 0.08)} borderRadius={1.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">Professional earnings</Typography>
                      <Typography variant="body1" fontWeight="700">₹{Number(earningData.earning.professionalEarnings || 0).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5} borderRadius={1.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">Customer payment</Typography>
                      <Chip
                        label={String(earningData.earning.paymentStatus || 'pending').replace('_', ' ')}
                        size="small"
                        color={earningData.earning.paymentStatus === 'verified' || earningData.earning.paymentStatus === 'customer_paid' ? 'success' : 'warning'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" p={1.5} borderRadius={1.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight="600">Payout status</Typography>
                      <Chip
                        label={String(earningData.earning.payoutStatus || 'pending')}
                        size="small"
                        color={earningData.earning.payoutStatus === 'paid' ? 'success' : 'default'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                    {earningData.earning.disputeOpen === true && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Dispute is open for this earning — professional payout pool should treat it as on hold until
                        cleared.
                      </Alert>
                    )}
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      {earningData.earning.paymentStatus !== 'verified' &&
                        earningData.earning.paymentStatus !== 'customer_paid' && (
                          <Button variant="outlined" size="small" onClick={() => void handleVerifyEarningPayment()}>
                            Verify payment
                          </Button>
                        )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Disputes freeze payout eligibility until cleared (backend).
                    </Typography>
                    <TextField
                      size="small"
                      label="Dispute note (required to open)"
                      value={disputeReason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDisputeReason(e.target.value)}
                      fullWidth
                      sx={{ mt: 1 }}
                      disabled={disputeBusy}
                      multiline
                      minRows={2}
                    />
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        disabled={disputeBusy}
                        onClick={() => void handleEarningDispute(true)}
                      >
                        Open dispute
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={disputeBusy}
                        onClick={() => void handleEarningDispute(false)}
                      >
                        Clear dispute
                      </Button>
                    </Stack>
                    {earningData.payout?.status === 'completed' && earningData.payout.completedAt && (
                      <Alert severity="success" sx={{ mt: 1 }}>
                        Professional received payment on {new Date(earningData.payout.completedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}.
                        {earningData.payout.payoutReference && ` Ref: ${earningData.payout.payoutReference}`}
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Earning record is created when the booking is marked completed. If you just completed this booking, refresh the page in a moment.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Review Section - Show when booking is completed and payment is received */}
          {(() => {
            const statusLower = booking.status?.toLowerCase() || ''
            const isCompleted = statusLower === 'completed'
            const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
            const isPaymentReceived = paymentStatusLower === 'paid' || 
                                     paymentStatusLower === 'completed' ||
                                     paymentStatusLower === 'success' ||
                                     paymentStatusLower === 'received' ||
                                     paymentStatusLower === 'customer_paid' ||
                                     paymentStatusLower === 'verified'
            
            if (isCompleted && isPaymentReceived && isProfessional) {
              return (
                <Card sx={{ borderRadius: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <Typography variant="h6" fontWeight="600" color="success.dark">
                        Payment Review
                      </Typography>
                    </Box>
                    <Separator className="mb-2" />
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Status
                          </Typography>
                          <Chip
                            label="Payment Received"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Method
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ textTransform: 'capitalize', mt: 0.5 }}>
                            {booking.paymentMethod || 'Cash'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Amount Received
                          </Typography>
                          <Typography variant="h6" fontWeight="700" color="success.main">
                            ₹{booking.totalAmount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Date
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                            {booking.completedDate 
                              ? new Date(booking.completedDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date().toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )
            }
            return null
          })()}
        </Grid>
      </Grid>

      {/* Dialogs */}
      <AssignProfessionalDialog
        open={assignProfessionalOpen}
        onClose={() => setAssignProfessionalOpen(false)}
        bookingId={id || ''}
        scheduledDateIso={booking?.scheduledDateIso}
        onAssigned={() => {
          loadBooking()
          setAssignProfessionalOpen(false)
        }}
      />

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to cancel this booking?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking}>
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Booking</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete this booking?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteBooking}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking lifecycle (professional or admin) */}
      {(isProfessional || isAdmin) && (
        <Dialog open={actionDialog} onClose={() => {
          setActionDialog(false)
          setAction(null)
          setActionNotes('')
        }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {action === 'accept' && 'Accept Booking'}
            {action === 'start' && 'Start Work'}
            {action === 'complete' && 'Complete Booking'}
          </DialogTitle>
          <DialogContent>
            {booking && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Service:</strong> {booking.service.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Customer:</strong> {booking.customer.firstName} {booking.customer.lastName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Amount:</strong> ₹{booking.totalAmount}
                </Typography>
                
                {action === 'complete' && (
                  <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Payment Status:</strong> {(booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed')
                        ? '✅ Payment Completed' 
                        : (() => {
                            const method = booking.paymentMethod?.toLowerCase() || ''
                            return method === 'cash' || 
                                   method === 'pay_after_service' ||
                                   method === 'pay_later' ||
                                   method.includes('pay_later') ||
                                   method.includes('pay after') ||
                                   method === 'cash_on_delivery' ||
                                   method === 'pay_after' ||
                                   method === 'cod'
                          })()
                        ? '💵 Cash/Pay After Service - You can complete this booking'
                        : 'ℹ️ Payment verification will be handled by backend when you complete the booking'}
                    </Typography>
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (Optional)"
                  value={actionNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionNotes(e.target.value)}
                  sx={{ mt: 2 }}
                  placeholder={action === 'complete' ? 'Add completion notes...' : 'Add any notes...'}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setActionDialog(false)
              setAction(null)
              setActionNotes('')
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProfessionalAction}
              color={action === 'complete' ? 'success' : 'primary'}
              disabled={
                action === 'complete' &&
                !isAdmin &&
                !(() => {
                  const method = booking.paymentMethod?.toLowerCase() || ''
                  const isCashOrPayLater =
                    method === 'cash' ||
                    method === 'pay_after_service' ||
                    method === 'pay_later' ||
                    method.includes('pay_later') ||
                    method.includes('pay after') ||
                    method.includes('cash')
                  return (
                    booking.paymentStatus === 'paid' ||
                    booking.paymentStatus === 'completed' ||
                    isCashOrPayLater
                  )
                })()
              }
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Earnings Dialog - Shows after completion */}
      {isProfessional && earningsInfo && (
        <Dialog 
          open={earningsDialog} 
          onClose={() => {
            setEarningsDialog(false)
            setEarningsInfo(null)
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Wallet className="h-5 w-5 text-green-600" />
              <Typography variant="h6">Booking Completed!</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="600">
                Service completed successfully! Admin has been notified.
              </Typography>
            </Alert>
            
            <Typography variant="h6" gutterBottom color="primary.main">
              Your Earnings Breakdown
            </Typography>
            
            <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">Booking Amount</Typography>
                    <Typography variant="h6" fontWeight="600">₹{earningsInfo.bookingAmount}</Typography>
                  </Box>
                  
                  <Separator />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">Platform Commission (10%)</Typography>
                    <Typography variant="body1" color="error.main">-₹{earningsInfo.platformCommission.toFixed(2)}</Typography>
                  </Box>
                  
                  <Separator />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                    <Typography variant="h6" fontWeight="700">Your Earnings</Typography>
                    <Typography variant="h5" fontWeight="700" color="success.main">
                      ₹{earningsInfo.professionalEarnings.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                Your earnings will be added to your wallet and available for withdrawal after admin verification.
                You can view your earnings in the Earnings & Wallet section.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setEarningsDialog(false)
                setEarningsInfo(null)
                navigate('/professional/earnings')
              }}
              variant="outlined"
            >
              View Earnings
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setEarningsDialog(false)
                setEarningsInfo(null)
              }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Payment Received Dialog - For pay after service */}
      {(isProfessional || isAdmin) && paymentReceivedDialog && booking && (
        <Dialog 
          open={paymentReceivedDialog} 
          onClose={() => {
            setPaymentReceivedDialog(false)
            setPaymentAmount('')
            setPaymentNotes('')
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <CreditCard className="h-5 w-5 text-green-600" />
              <Typography variant="h6">Mark Payment Received</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Confirm that you have received payment from the customer. This will update the payment status and notify both the customer and admin.
              </Typography>
            </Alert>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Booking Amount
              </Typography>
              <Typography variant="h5" fontWeight="600" color="primary.main">
                ₹{booking.totalAmount}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Amount Received"
              type="number"
              value={paymentAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Enter the amount you received from the customer"
              InputProps={{
                startAdornment: <span className="mr-1 text-muted-foreground">₹</span>,
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Payment Notes (Optional)"
              value={paymentNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPaymentNotes(e.target.value)}
              placeholder="Add any notes about the payment (e.g., payment method, transaction reference, etc.)"
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setPaymentReceivedDialog(false)
                setPaymentAmount('')
                setPaymentNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                try {
                  const amount = parseFloat(paymentAmount) || booking.totalAmount
                  
                  const response = await PaymentsService.markPaymentReceived(booking._id, {
                    amount,
                    paymentMethod: booking.paymentMethod || 'cash',
                    notes: paymentNotes || undefined,
                    notifyCustomer: true,
                    notifyAdmin: true,
                  })

                  if (response.success) {
                    dispatch(addToast({
                      message: 'Payment marked as received! Customer and admin have been notified.',
                      severity: 'success'
                    }))
                    appToast('Payment marked as received successfully!', 'success')
                    setPaymentReceivedDialog(false)
                    setPaymentAmount('')
                    setPaymentNotes('')
                    await loadBooking() // Reload booking to show updated payment status
                  } else {
                    throw new Error(response.message || 'Failed to mark payment as received')
                  }
                } catch (error: any) {
                  console.error('Failed to mark payment as received:', error)
                  appToast(error.message || 'Failed to mark payment as received', 'error')
                }
              }}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Confirm Payment Received
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Box>
  )
}
