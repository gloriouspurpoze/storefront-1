import React from 'react'
import {
  MoreVertical,
  Building2,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { ServiceProvider } from '../../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Eye, Pencil, ShieldCheck, Trash2 } from 'lucide-react'

interface ProviderTableProps {
  providers: ServiceProvider[]
  loading?: boolean
  onView: (provider: ServiceProvider) => void
  onEdit: (provider: ServiceProvider) => void
  onVerification: (provider: ServiceProvider) => void
  onDelete: (provider: ServiceProvider) => void
}

function statusBadge(verification: string) {
  const v = (verification || '').toLowerCase()
  if (v === 'verified') {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle className="h-3.5 w-3.5" />
        Verified
      </Badge>
    )
  }
  if (v === 'pending') {
    return (
      <Badge className="gap-1" variant="secondary">
        <Clock className="h-3.5 w-3.5" />
        Pending
      </Badge>
    )
  }
  if (v === 'rejected') {
    return (
      <Badge className="gap-1" variant="destructive">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </Badge>
    )
  }
  return <Badge variant="outline">Unknown</Badge>
}

export function ProviderTable({
  providers,
  loading,
  onView,
  onEdit,
  onVerification,
  onDelete,
}: ProviderTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Loading providers...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Provider</TableHead>
            <TableHead className="font-semibold">Business</TableHead>
            <TableHead className="font-semibold">Services</TableHead>
            <TableHead className="font-semibold">Rating</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Experience</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                No providers found
              </TableCell>
            </TableRow>
          ) : (
            providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 bg-primary text-primary-foreground">
                      <AvatarFallback>
                        <Building2 className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{provider.business_name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">ID: {provider.user_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <p className="text-sm font-medium">{provider.business_name || 'N/A'}</p>
                  {provider.business_license && (
                    <p className="text-xs text-muted-foreground">License: {provider.business_license}</p>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {provider.services_offered?.slice(0, 2).map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {provider.services_offered && provider.services_offered.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{provider.services_offered.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-bloom-coral" aria-hidden />
                    <span className="text-sm tabular-nums">{(provider.rating ?? 0).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({provider.total_reviews || 0})
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  {statusBadge(provider.verification_status)}
                </TableCell>
                <TableCell className="py-3">
                  <p className="text-sm">{provider.years_experience || 0} years</p>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-2">{provider.service_areas?.join(', ') || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Open row actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onView(provider)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(provider)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onVerification(provider)} className="cursor-pointer">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Update verification
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(provider)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
