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
import { Link, useParams, useNavigate } from 'react-router-dom'
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
  TableHeader as ShTableHeader,
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
import { CHART_PALETTE } from '../../lib/chartPalette'

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
        severity === 'warning' && 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral dark:text-bloom-deep',
        severity === 'success' && 'border-storm-deep/40 bg-storm-deep/10 text-storm-deep dark:text-on-ink',
        (severity === 'info' || !severity) && 'border-primary/40 bg-primary/10',
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

// DESIGN.md tokens via chartPalette — no Material Design hexes.
const statusConfig: Record<string, { color: string; bg: string; label: string; gradient: string }> = {
  pending: {
    color: CHART_PALETTE.bloomCoral,
    bg: CHART_PALETTE.bloomRose,
    label: 'Pending',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.bloomCoral} 0%, ${CHART_PALETTE.bloomDeep} 100%)`,
  },
  confirmed: {
    color: CHART_PALETTE.primary,
    bg: CHART_PALETTE.primarySoft,
    label: 'Confirmed',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.primary} 0%, ${CHART_PALETTE.primaryDeep} 100%)`,
  },
  scheduled: {
    color: CHART_PALETTE.primaryBright,
    bg: CHART_PALETTE.primarySoft,
    label: 'Scheduled',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.primaryBright} 0%, ${CHART_PALETTE.primary} 100%)`,
  },
  in_progress: {
    color: CHART_PALETTE.primaryDeep,
    bg: CHART_PALETTE.primarySoft,
    label: 'In Progress',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.primaryBright} 0%, ${CHART_PALETTE.primaryDeep} 100%)`,
  },
  completed: {
    color: CHART_PALETTE.stormDeep,
    bg: CHART_PALETTE.stormMist,
    label: 'Completed',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.stormSea} 0%, ${CHART_PALETTE.stormDeep} 100%)`,
  },
  cancelled: {
    color: CHART_PALETTE.bloomDeep,
    bg: CHART_PALETTE.bloomRose,
    label: 'Cancelled',
    gradient: `linear-gradient(135deg, ${CHART_PALETTE.bloomDeep} 0%, ${CHART_PALETTE.bloomWine} 100%)`,
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

  // DESIGN.md: map booking status -> shadcn Badge variant so the pill respects the design system.
  const statusBadgeVariant: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    pending: 'warning',
    confirmed: 'info',
    scheduled: 'info',
    accepted: 'info',
    in_progress: 'default',
    completed: 'success',
    cancelled: 'destructive',
  }
  const badgeVariant = statusBadgeVariant[booking.status] ?? 'secondary'

  const paymentSettled = (status?: string) => {
    const s = (status ?? '').toLowerCase()
    return ['paid', 'completed', 'success', 'received', 'customer_paid', 'verified'].includes(s)
  }

  const formatPaymentLabel = (value?: string) =>
    value ? String(value).replace(/_/g, ' ') : '—'

  const paymentStatusBadgeVariant = (status?: string): React.ComponentProps<typeof Badge>['variant'] =>
    paymentSettled(status) ? 'success' : 'warning'

  return (
    <div className="min-h-screen bg-cloud">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8 md:py-8">
        {/* Clean header: breadcrumb + title + status pill */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShadcnButton
              variant="ghost"
              size="icon"
              onClick={() => navigate('/bookings')}
              aria-label="Back to bookings"
              className="mt-0.5 h-9 w-9 shrink-0 text-graphite hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </ShadcnButton>
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-caption-md text-graphite">
                <Link to="/dashboard" className="hover:text-ink">Dashboard</Link>
                <span aria-hidden>/</span>
                <Link to="/bookings" className="hover:text-ink">Bookings</Link>
                <span aria-hidden>/</span>
                <span className="text-charcoal">Booking details</span>
              </nav>
              <h1 className="text-display-md font-bold text-ink">{booking.bookingId}</h1>
              <p className="mt-0.5 text-body-md text-charcoal">{booking.service.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="break-all font-mono text-[11px] leading-snug text-graphite">
                  ID {booking._id}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(booking._id)
                      appToast('Booking ID copied', 'success', 2500)
                    } catch {
                      appToast('Could not copy', 'error')
                    }
                  }}
                  aria-label="Copy full booking ID"
                  className="rounded p-0.5 text-graphite transition hover:bg-fog hover:text-ink"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          <Badge variant={badgeVariant} className="shrink-0 self-start">
            {config.label}
          </Badge>
        </div>

        {/* Action toolbar — flat, no surrounding card elevation. DESIGN.md: actions are not metrics. */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
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
        </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Customer card — clean, single elevation, no nested tinted tiles. */}
          <ShCard>
            <ShCardContent className="p-6">
              <div className="flex items-center gap-4">
                <ShAvatar className="h-14 w-14 shrink-0 bg-primary text-on-primary">
                  <AvatarFallback className="bg-primary text-base font-semibold text-on-primary">
                    {([booking.customer.firstName, booking.customer.lastName]
                      .filter(Boolean)
                      .join(' ')
                      .trim()
                      .slice(0, 2) || 'C').toUpperCase()}
                  </AvatarFallback>
                </ShAvatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-display-sm font-semibold text-ink">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </h2>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-storm-deep" aria-label="Verified" />
                  </div>
                  {booking.customer.totalBookings != null && booking.customer.totalBookings > 0 && (
                    <p className="mt-1 inline-flex items-center gap-1 text-caption-md text-graphite">
                      <User className="h-3.5 w-3.5" />
                      {booking.customer.totalBookings} previous bookings
                    </p>
                  )}
                </div>
              </div>

              <Separator className="my-5" />

              <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-caption-md text-graphite">Phone</dt>
                    <dd className="text-body-md font-medium text-ink">{booking.customer.phone || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-caption-md text-graphite">Email</dt>
                    <dd className="truncate text-body-md font-medium text-ink">{booking.customer.email || '—'}</dd>
                  </div>
                </div>
              </dl>
            </ShCardContent>
          </ShCard>

          {/* Service & Order Items — single card, no nested elevations or tinted tiles. */}
          <ShCard>
            <ShCardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-display-sm font-semibold text-ink">Service &amp; order items</h3>
                  <p className="mt-1 text-body-md font-semibold text-primary">{booking.service.name}</p>
                </div>
                {booking.service.category && (
                  <Badge variant="secondary" className="shrink-0">
                    {booking.service.category}
                  </Badge>
                )}
              </div>

              {booking.services && booking.services.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-lg border border-hairline">
                  <ShTable>
                    <ShTableHeader>
                      <ShTableRow className="bg-cloud hover:bg-cloud">
                        <TableHead className="text-charcoal">Service</TableHead>
                        <TableHead className="text-center text-charcoal">Qty</TableHead>
                        <TableHead className="text-right text-charcoal">Unit Price</TableHead>
                        <TableHead className="text-right text-charcoal">Total</TableHead>
                      </ShTableRow>
                    </ShTableHeader>
                    <TableBody>
                      {booking.services.map((item, idx) => {
                        const lineTotal = item.quantity * item.price
                        return (
                          <ShTableRow key={idx}>
                            <ShTableCell>
                              <div className="text-body-md font-medium text-ink">{item.serviceName}</div>
                              {item.variantName && (
                                <div className="text-caption-md text-graphite">{item.variantName}</div>
                              )}
                            </ShTableCell>
                            <ShTableCell className="text-center">{item.quantity}</ShTableCell>
                            <ShTableCell className="text-right">₹{item.price}</ShTableCell>
                            <ShTableCell className="text-right font-semibold text-ink">₹{lineTotal}</ShTableCell>
                          </ShTableRow>
                        )
                      })}
                    </TableBody>
                  </ShTable>
                </div>
              )}

              <dl className="mt-5 grid grid-cols-1 gap-y-4 border-t border-hairline pt-5 sm:grid-cols-3 sm:gap-x-6">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-caption-md text-graphite">Date</dt>
                    <dd className="text-body-md font-medium text-ink">{booking.scheduledDate || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-caption-md text-graphite">Time</dt>
                    <dd className="text-body-md font-medium text-ink">{booking.scheduledTime || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-caption-md text-graphite">Duration</dt>
                    <dd className="text-body-md font-medium text-ink">{booking.service.duration} min</dd>
                  </div>
                </div>
              </dl>
            </ShCardContent>
          </ShCard>

          {/* Service Location — quiet card, no inline tinted tile. */}
          <ShCard>
            <ShCardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-graphite" aria-hidden />
                  <h3 className="text-display-sm font-semibold text-ink">Service location</h3>
                </div>
                <ShadcnButton variant="outline" size="sm" onClick={handleNavigate}>
                  <Navigation className="mr-2 h-4 w-4" />
                  Navigate
                </ShadcnButton>
              </div>

              <div className="mt-4 space-y-1 text-body-md text-ink">
                {(booking.address.firstName || booking.address.lastName) && (
                  <p className="text-caption-md text-graphite">
                    {[booking.address.firstName, booking.address.lastName].filter(Boolean).join(' ')}
                  </p>
                )}
                <p className="font-medium">{displayAddress}</p>
                <p className="text-charcoal">
                  {[booking.address.city, booking.address.state].filter(Boolean).join(', ')}
                  {displayPincode ? ` - ${displayPincode}` : ''}
                </p>
                {booking.address.country && <p className="text-charcoal">{booking.address.country}</p>}
                {booking.address.phone && (
                  <p className="inline-flex items-center gap-1.5 text-charcoal">
                    <Phone className="h-3.5 w-3.5 text-graphite" />
                    {booking.address.phone}
                  </p>
                )}
                {booking.address.landmark && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-hairline bg-cloud px-2.5 py-1 text-caption-md text-charcoal">
                    <MapPin className="h-3.5 w-3.5 text-graphite" aria-hidden />
                    <span className="font-medium">Landmark:</span> {booking.address.landmark}
                  </p>
                )}
              </div>
            </ShCardContent>
          </ShCard>

          {/* Notes & context */}
          {(booking.customerNotes || professionalNotesForAdminDisplay(booking.notes || '')) && (
            <ShCard>
              <ShCardContent className="p-6">
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-display-sm font-semibold text-ink">Notes &amp; context</h3>
                    <p className="mt-1 max-w-2xl text-caption-md text-graphite">
                      Booking log and professional comments. After-service and pre-start photos are de-duplicated here
                      and shown in <span className="font-medium text-charcoal">Professional photo evidence</span> below.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {professionalNotesForAdminDisplay(booking.notes || '') ? (
                    <div className="rounded-lg border border-hairline bg-cloud p-4">
                      <p className="text-caption-md font-medium uppercase tracking-wide text-graphite">
                        Booking &amp; professional
                      </p>
                      <div className="mt-3">
                        <AdminNotesRichBody text={professionalNotesForAdminDisplay(booking.notes || '')} />
                      </div>
                    </div>
                  ) : null}
                  {booking.customerNotes ? (
                    <div className="rounded-lg border border-hairline p-4">
                      <p className="mb-2 inline-flex items-center gap-1.5 text-caption-md font-medium text-graphite">
                        <User className="h-3.5 w-3.5" aria-hidden />
                        Customer instructions
                      </p>
                      <p className="whitespace-pre-wrap text-body-md leading-relaxed text-ink">{booking.customerNotes}</p>
                    </div>
                  ) : null}
                </div>
              </ShCardContent>
            </ShCard>
          )}

          {/* Professional photo evidence */}
          {((booking.completionPhotoUrls?.length ?? 0) > 0 ||
            Boolean(booking.preStartSelfieUrl) ||
            (booking.preStartSitePhotoUrls?.length ?? 0) > 0) && (
            <ShCard>
              <ShCardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Camera className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                  <div>
                    <h3 className="text-display-sm font-semibold text-ink">Professional photo evidence</h3>
                    <p className="mt-1 text-caption-md text-graphite">
                      Images from start-of-job and completion flows (opens in new tab).
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  {booking.preStartSelfieUrl ? (
                    <section>
                      <p className="mb-2 text-caption-md font-medium text-graphite">Pre-start — on-site selfie</p>
                      <a
                        href={booking.preStartSelfieUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block overflow-hidden rounded-lg border border-hairline"
                      >
                        <img
                          src={booking.preStartSelfieUrl}
                          alt="Professional pre-start selfie"
                          className="block h-40 w-40 object-cover"
                        />
                      </a>
                    </section>
                  ) : null}
                  {(booking.preStartSitePhotoUrls?.length ?? 0) > 0 ? (
                    <section>
                      <p className="mb-2 text-caption-md font-medium text-graphite">Pre-start — site photos</p>
                      <div className="flex flex-wrap gap-2">
                        {(booking.preStartSitePhotoUrls ?? []).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="overflow-hidden rounded-lg border border-hairline"
                          >
                            <img src={url} alt="Pre-start site" className="block h-28 w-28 object-cover" />
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {(booking.completionPhotoUrls?.length ?? 0) > 0 ? (
                    <section>
                      <p className="mb-2 text-caption-md font-medium text-graphite">After-service / completion photos</p>
                      <div className="flex flex-wrap gap-2">
                        {(booking.completionPhotoUrls ?? []).map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="overflow-hidden rounded-lg border border-hairline"
                          >
                            <img src={url} alt="Completion evidence" className="block h-28 w-28 object-cover" />
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </ShCardContent>
            </ShCard>
          )}

          {/* Activity timeline */}
          {booking.activity && booking.activity.length > 0 && (
            <ShCard>
              <ShCardContent className="p-6">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-graphite" aria-hidden />
                  <h3 className="text-display-sm font-semibold text-ink">Activity timeline</h3>
                </div>
                <ul className="mt-5 space-y-4 border-l border-hairline pl-5">
                  {booking.activity.map((activity, index) => (
                    <li key={index} className="relative">
                      <span
                        className="absolute -left-[22px] top-2 h-2 w-2 rounded-full bg-primary ring-4 ring-paper"
                        aria-hidden
                      />
                      <div className="rounded-lg border border-hairline bg-cloud px-4 py-3">
                        <p className="text-body-md font-semibold text-ink">{activity.action}</p>
                        <p className="mt-0.5 text-caption-md text-graphite">
                          {activity.user} · {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.details ? (
                          <p className="mt-2 text-body-md italic text-charcoal">{activity.details}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </ShCardContent>
            </ShCard>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-4">
          {/* Assigned Professional — clean, no nested tinted tiles. */}
          <ShCard>
            <ShCardContent className="p-6">
              <h3 className="text-display-sm font-semibold text-ink">Assigned professional</h3>

              {booking.professional ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <ShAvatar className="h-12 w-12 shrink-0">
                      {booking.professional.avatar ? (
                        <AvatarImage src={booking.professional.avatar} alt={professionalDisplayName} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-on-primary">
                        {professionalDisplayName ? professionalDisplayName.slice(0, 2).toUpperCase() : 'P'}
                      </AvatarFallback>
                    </ShAvatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md font-semibold text-ink">{professionalDisplayName}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-caption-md text-graphite">
                        <Star className="h-3.5 w-3.5 fill-bloom-coral text-bloom-coral" />
                        <span className="font-medium text-ink">{Number(booking.professional.rating || 0).toFixed(1)}</span>
                        <span>rating</span>
                      </p>
                    </div>
                  </div>

                  {(booking.professional.phone || booking.professional.email) && (
                    <dl className="mt-5 space-y-3">
                      {booking.professional.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                          <div className="min-w-0">
                            <dt className="text-caption-md text-graphite">Phone</dt>
                            <dd className="text-body-md font-medium text-ink">{booking.professional.phone}</dd>
                          </div>
                        </div>
                      )}
                      {booking.professional.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                          <div className="min-w-0">
                            <dt className="text-caption-md text-graphite">Email</dt>
                            <dd className="truncate text-body-md font-medium text-ink">{booking.professional.email}</dd>
                          </div>
                        </div>
                      )}
                    </dl>
                  )}

                  {booking.professional.categories && booking.professional.categories.length > 0 && (
                    <div className="mt-5 border-t border-hairline pt-4">
                      <p className="mb-2 text-caption-md font-medium text-graphite">Specializations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {booking.professional.categories.map((cat) => (
                          <Badge key={cat} variant="secondary">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-4 rounded-md border border-hairline bg-cloud px-3 py-2 text-body-md text-graphite">
                  No professional assigned yet.
                </p>
              )}
            </ShCardContent>
          </ShCard>

          {isAdmin && (
            <ShCard>
              <ShCardContent className="p-6">
                <h3 className="text-display-sm font-semibold text-ink">Support and ledger</h3>
                <p className="mt-1 text-caption-md text-graphite">
                  Partial refunds are recorded on the booking for accounting; they do not call a payment gateway.
                </p>

                {booking.status === 'pending' && booking.acceptDeadlineAt && (
                  <div className="mt-4 rounded-md border border-hairline bg-cloud px-3 py-2 text-body-md text-charcoal">
                    <span className="font-medium text-ink">Accept-by (assign SLA):</span>{' '}
                    {new Date(booking.acceptDeadlineAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                )}

                {booking.preJobDamagePhotoUrls && booking.preJobDamagePhotoUrls.length > 0 && (
                  <section className="mt-5">
                    <p className="mb-2 text-caption-md font-medium text-graphite">Pre-job condition photos</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.preJobDamagePhotoUrls.map((u) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="overflow-hidden rounded-lg border border-hairline"
                        >
                          <img src={u} alt="" className="block h-20 w-20 object-cover" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {booking.partialRefundRecords && booking.partialRefundRecords.length > 0 && (
                  <section className="mt-5">
                    <p className="mb-2 text-caption-md font-medium text-graphite">Recorded partial refunds</p>
                    <div className="overflow-hidden rounded-lg border border-hairline">
                      <ShTable>
                        <ShTableHeader>
                          <ShTableRow className="bg-cloud hover:bg-cloud">
                            <TableHead className="text-charcoal">Amount</TableHead>
                            <TableHead className="text-charcoal">Reason</TableHead>
                            <TableHead className="text-charcoal">When</TableHead>
                          </ShTableRow>
                        </ShTableHeader>
                        <TableBody>
                          {booking.partialRefundRecords.map((r, idx) => (
                            <ShTableRow key={`${r.recordedAt || idx}-${r.amount}`}>
                              <ShTableCell className="font-medium">₹{Number(r.amount).toLocaleString()}</ShTableCell>
                              <ShTableCell>{r.reason}</ShTableCell>
                              <ShTableCell className="text-graphite">
                                {r.recordedAt
                                  ? new Date(r.recordedAt).toLocaleString(undefined, {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })
                                  : '—'}
                              </ShTableCell>
                            </ShTableRow>
                          ))}
                        </TableBody>
                      </ShTable>
                    </div>
                  </section>
                )}

                <div className="mt-5 space-y-3 border-t border-hairline pt-5">
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
                  <ShadcnButton
                    variant="default"
                    disabled={adminRefundBusy}
                    onClick={() => void handleRecordAdminPartialRefund()}
                    className="w-full sm:w-auto"
                  >
                    Record partial refund
                  </ShadcnButton>
                </div>
              </ShCardContent>
            </ShCard>
          )}

          {/* Payment details */}
          <ShCard>
            <ShCardContent className="p-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-graphite" aria-hidden />
                <h3 className="text-display-sm font-semibold text-ink">Payment details</h3>
              </div>
              <dl className="mt-5 divide-y divide-hairline">
                <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <dt className="text-caption-md text-graphite">Total amount</dt>
                  <dd className="text-body-md font-semibold text-ink">₹{booking.totalAmount.toLocaleString()}</dd>
                </div>
                {booking.paidAmount != null && Number(booking.paidAmount) > 0 && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-caption-md text-graphite">Paid amount</dt>
                    <dd className="text-body-md font-semibold text-storm-deep">
                      ₹{Number(booking.paidAmount).toLocaleString()}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-caption-md text-graphite">Payment status</dt>
                  <dd>
                    <Badge variant={paymentStatusBadgeVariant(booking.paymentStatus)} className="capitalize">
                      {formatPaymentLabel(booking.paymentStatus)}
                    </Badge>
                  </dd>
                </div>
                {booking.paymentMethod && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-caption-md text-graphite">Payment method</dt>
                    <dd>
                      <Badge variant="secondary" className="capitalize">
                        {formatPaymentLabel(booking.paymentMethod)}
                      </Badge>
                    </dd>
                  </div>
                )}
                {booking.bookingType && (
                  <div className="flex items-center justify-between gap-3 py-3">
                    <dt className="text-caption-md text-graphite">Booking type</dt>
                    <dd>
                      <Badge variant="outline" className="capitalize">
                        {formatPaymentLabel(booking.bookingType)}
                      </Badge>
                    </dd>
                  </div>
                )}
              </dl>
            </ShCardContent>
          </ShCard>

          {/* Booking meta */}
          <ShCard>
            <ShCardContent className="p-6">
              <h3 className="text-display-sm font-semibold text-ink">Booking info</h3>
              <ul className="mt-4 space-y-3 text-body-md text-charcoal">
                {booking.assignedAt && (
                  <li className="flex items-start gap-2">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-graphite" aria-hidden />
                    <span>
                      Assigned on{' '}
                      {new Date(booking.assignedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </li>
                )}
                {booking.completedDate && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-storm-deep" aria-hidden />
                    <span>
                      Completed on{' '}
                      {new Date(booking.completedDate).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </li>
                )}
                {booking.status === 'cancelled' && booking.cancellationReason && (
                  <li className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <span>
                      <span className="font-medium text-ink">Reason:</span> {booking.cancellationReason}
                    </span>
                  </li>
                )}
                {!booking.assignedAt && !booking.completedDate && booking.status !== 'cancelled' && (
                  <li>
                    Created{' '}
                    {new Date(booking.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </li>
                )}
                {(booking as { source?: string }).source && (
                  <li>
                    <span className="font-medium text-ink">Source:</span>{' '}
                    {(booking as { source?: string }).source === 'web' ? 'Website' : 'Mobile app'}
                  </li>
                )}
              </ul>
            </ShCardContent>
          </ShCard>

          {/* Invoice */}
          {booking.invoice && booking.invoice.id && (
            <ShCard>
              <ShCardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-graphite" aria-hidden />
                  <h3 className="text-display-sm font-semibold text-ink">Invoice</h3>
                </div>
                <dl className="mt-5 divide-y divide-hairline">
                  {booking.invoice.invoiceNumber && (
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <dt className="text-caption-md text-graphite">Invoice #</dt>
                      <dd className="text-body-md font-medium text-ink">{booking.invoice.invoiceNumber}</dd>
                    </div>
                  )}
                  {booking.invoice.invoiceDate && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <dt className="text-caption-md text-graphite">Date</dt>
                      <dd className="text-body-md text-ink">
                        {new Date(booking.invoice.invoiceDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {booking.invoice.status && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <dt className="text-caption-md text-graphite">Status</dt>
                      <dd>
                        <Badge variant="secondary" className="capitalize">
                          {String(booking.invoice.status)}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  {booking.invoice.total != null && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <dt className="text-caption-md text-graphite">Total</dt>
                      <dd className="text-body-md font-semibold text-ink">
                        ₹{Number(booking.invoice.total).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
                {booking.invoice.pdfUrl && (
                  <ShadcnButton variant="outline" size="sm" className="mt-4 w-full" asChild>
                    <a href={booking.invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Receipt className="mr-2 h-4 w-4" />
                      Download PDF
                    </a>
                  </ShadcnButton>
                )}
              </ShCardContent>
            </ShCard>
          )}

          {/* Admin: Payment & earnings */}
          {isAdmin && booking.status === 'completed' && (
            <ShCard>
              <ShCardContent className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Wallet className="h-4 w-4 text-graphite" aria-hidden />
                  <h3 className="text-display-sm font-semibold text-ink">Payment &amp; earnings</h3>
                  <Badge variant="outline">Admin view</Badge>
                </div>

                {earningData?.earning ? (
                  <>
                    <dl className="mt-5 divide-y divide-hairline">
                      <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                        <dt className="text-caption-md text-graphite">Booking amount</dt>
                        <dd className="text-body-md font-semibold text-ink">
                          ₹{Number(earningData.earning.bookingAmount || 0).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3">
                        <dt className="text-caption-md text-graphite">Platform commission</dt>
                        <dd className="text-body-md font-semibold text-storm-deep">
                          ₹{Number(earningData.earning.platformCommission || 0).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3">
                        <dt className="text-caption-md text-graphite">Professional earnings</dt>
                        <dd className="text-body-md font-semibold text-ink">
                          ₹{Number(earningData.earning.professionalEarnings || 0).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3">
                        <dt className="text-caption-md text-graphite">Customer payment</dt>
                        <dd>
                          <Badge
                            variant={paymentStatusBadgeVariant(earningData.earning.paymentStatus)}
                            className="capitalize"
                          >
                            {formatPaymentLabel(earningData.earning.paymentStatus || 'pending')}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 py-3">
                        <dt className="text-caption-md text-graphite">Payout status</dt>
                        <dd>
                          <Badge
                            variant={
                              earningData.earning.payoutStatus === 'paid' ? 'success' : 'secondary'
                            }
                            className="capitalize"
                          >
                            {formatPaymentLabel(earningData.earning.payoutStatus || 'pending')}
                          </Badge>
                        </dd>
                      </div>
                    </dl>

                    {earningData.earning.disputeOpen === true && (
                      <p className="mt-4 rounded-md border border-bloom-coral/30 bg-bloom-rose px-3 py-2 text-body-md text-charcoal">
                        Dispute is open for this earning — professional payout pool should treat it as on hold until
                        cleared.
                      </p>
                    )}

                    {earningData.earning.paymentStatus !== 'verified' &&
                      earningData.earning.paymentStatus !== 'customer_paid' && (
                        <ShadcnButton
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => void handleVerifyEarningPayment()}
                        >
                          Verify payment
                        </ShadcnButton>
                      )}

                    <p className="mt-4 text-caption-md text-graphite">
                      Disputes freeze payout eligibility until cleared (backend).
                    </p>

                    <div className="mt-4 space-y-3 border-t border-hairline pt-4">
                      <TextField
                        size="small"
                        label="Dispute note (required to open)"
                        value={disputeReason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDisputeReason(e.target.value)}
                        fullWidth
                        disabled={disputeBusy}
                        multiline
                        minRows={2}
                      />
                      <div className="flex flex-wrap gap-2">
                        <ShadcnButton
                          variant="default"
                          size="sm"
                          disabled={disputeBusy}
                          onClick={() => void handleEarningDispute(true)}
                        >
                          Open dispute
                        </ShadcnButton>
                        <ShadcnButton
                          variant="outline"
                          size="sm"
                          disabled={disputeBusy}
                          onClick={() => void handleEarningDispute(false)}
                        >
                          Clear dispute
                        </ShadcnButton>
                      </div>
                    </div>

                    {earningData.payout?.status === 'completed' && earningData.payout.completedAt && (
                      <p className="mt-4 rounded-md border border-storm-deep/30 bg-storm-mist/30 px-3 py-2 text-body-md text-charcoal">
                        Professional received payment on{' '}
                        {new Date(earningData.payout.completedAt).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                        .{earningData.payout.payoutReference && ` Ref: ${earningData.payout.payoutReference}`}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-body-md text-graphite">
                    Earning record is created when the booking is marked completed. If you just completed this booking,
                    refresh the page in a moment.
                  </p>
                )}
              </ShCardContent>
            </ShCard>
          )}

          {/* Professional: payment received summary */}
          {(() => {
            const isCompleted = (booking.status?.toLowerCase() || '') === 'completed'
            const isPaymentReceived = paymentSettled(booking.paymentStatus)

            if (isCompleted && isPaymentReceived && isProfessional) {
              const paymentDate = booking.completedDate
                ? new Date(booking.completedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })

              return (
                <ShCard className="border-storm-deep/30 bg-storm-mist/20">
                  <ShCardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-storm-deep" aria-hidden />
                      <h3 className="text-display-sm font-semibold text-ink">Payment review</h3>
                    </div>
                    <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-caption-md text-graphite">Payment status</dt>
                        <dd className="mt-1">
                          <Badge variant="success">Payment received</Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption-md text-graphite">Payment method</dt>
                        <dd className="mt-1 text-body-md font-medium capitalize text-ink">
                          {booking.paymentMethod || 'Cash'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption-md text-graphite">Amount received</dt>
                        <dd className="mt-1 text-display-sm font-bold text-storm-deep">₹{booking.totalAmount}</dd>
                      </div>
                      <div>
                        <dt className="text-caption-md text-graphite">Payment date</dt>
                        <dd className="mt-1 text-body-md font-medium text-ink">{paymentDate}</dd>
                      </div>
                    </dl>
                  </ShCardContent>
                </ShCard>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Dialogs */}
      <AssignProfessionalDialog
        open={assignProfessionalOpen}
        onClose={() => setAssignProfessionalOpen(false)}
        bookingId={id || ''}
        scheduledDateIso={booking?.scheduledDateIso}
        bookingCategory={booking?.service?.category}
        bookingSkills={(() => {
          const out = new Set<string>()
          if (booking?.service?.name) out.add(booking.service.name.toLowerCase())
          if (booking?.service?.category) out.add(booking.service.category.toLowerCase())
          ;(booking?.services || []).forEach((s) => {
            if (s.serviceName) out.add(s.serviceName.toLowerCase())
            if (s.serviceDetails?.category) out.add(s.serviceDetails.category.toLowerCase())
          })
          return Array.from(out)
        })()}
        bookingCity={booking?.address?.city}
        bookingPincode={booking?.address?.pincode || booking?.address?.zipCode}
        bookingLatitude={(() => {
          const c = (booking?.address as unknown as { coordinates?: { lat?: number; latitude?: number } })?.coordinates
          if (typeof c?.lat === 'number') return c.lat
          if (typeof c?.latitude === 'number') return c.latitude
          return undefined
        })()}
        bookingLongitude={(() => {
          const c = (booking?.address as unknown as { coordinates?: { lng?: number; longitude?: number } })?.coordinates
          if (typeof c?.lng === 'number') return c.lng
          if (typeof c?.longitude === 'number') return c.longitude
          return undefined
        })()}
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
              <Wallet className="h-5 w-5 text-storm-deep" />
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
              <CreditCard className="h-5 w-5 text-storm-deep" />
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

      </div>
    </div>
  )
}
