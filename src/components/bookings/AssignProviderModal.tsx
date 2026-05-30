/**
 * Assign Provider Modal — assign a provider to a booking (admin).
 */

import React, { useState, useEffect } from 'react'
import { Search, CheckCircle2, Star, Phone, Mail, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { ProvidersService } from '../../services/api/providers.service'
import { cn } from '../../lib/utils'

interface Provider {
  id: string
  businessName: string
  email: string
  phone: string
  rating?: number
  totalJobs?: number
  verificationStatus?: string
  avatar?: string
}

interface AssignProviderModalProps {
  open: boolean
  onClose: () => void
  bookingId: string
  onAssign: (providerId: string, options: { notifyProvider: boolean; notifyCustomer: boolean }) => Promise<void>
  availableProviders?: Provider[]
}

export function AssignProviderModal({
  open,
  onClose,
  bookingId,
  onAssign,
  availableProviders: propProviders,
}: AssignProviderModalProps) {
  const [providers, setProviders] = useState<Provider[]>(propProviders || [])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [notifyProvider, setNotifyProvider] = useState(true)
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchingProviders, setFetchingProviders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && (!propProviders || propProviders.length === 0)) {
      void fetchProviders()
    } else if (propProviders) {
      setProviders(propProviders)
    }
  }, [open, propProviders])

  const fetchProviders = async () => {
    try {
      setFetchingProviders(true)
      const response = await ProvidersService.getAvailableProviders({
        page: 1,
        limit: 100,
      })

      if (response.data?.serviceProviders || response.data?.providers) {
        const providersList = response.data?.serviceProviders || response.data?.providers || []
        const transformedProviders: Provider[] = (providersList as unknown[]).map((raw) => {
          const p = raw as Record<string, unknown>
          const user = p.user as { email?: string; phone?: string; avatar?: string } | undefined
          return {
            id: String(p.id ?? ''),
            businessName: (p.business_name as string) || (p.businessName as string) || 'Unknown Business',
            email: user?.email || 'N/A',
            phone: user?.phone || 'N/A',
            rating: (p.rating as number) || 0,
            totalJobs: (p.totalBookings as number) || (p.completed_bookings as number) || 0,
            verificationStatus: (p.verification_status as string) || (p.verificationStatus as string) || 'pending',
            avatar: user?.avatar || (p.avatar as string | undefined),
          }
        })
        setProviders(transformedProviders)
      }
    } catch (err: unknown) {
      console.error('Error fetching providers:', err)
      setError('Failed to load providers. Please try again.')
    } finally {
      setFetchingProviders(false)
    }
  }

  const filteredProviders = providers.filter((provider) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      provider.businessName.toLowerCase().includes(searchLower) ||
      provider.email.toLowerCase().includes(searchLower) ||
      provider.phone.includes(searchTerm)
    )
  })

  const selectedProviderData = providers.find((p) => p.id === selectedProvider)

  const handleAssign = async () => {
    if (!selectedProvider) {
      setError('Please select a provider')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await onAssign(selectedProvider, { notifyProvider, notifyCustomer })
      setSelectedProvider('')
      setSearchTerm('')
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign provider')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedProvider('')
      setSearchTerm('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign provider to booking</DialogTitle>
          <DialogDescription>Select a provider to handle booking {bookingId}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <div className="flex items-center justify-between gap-2">
                {error}
                <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {fetchingProviders ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading providers...</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No providers match your search' : 'No providers available'}
            </p>
          ) : (
            <div className="max-h-[min(300px,40vh)] overflow-y-auto pr-1">
              <ul className="space-y-2">
                {filteredProviders.map((provider) => {
                  const sel = selectedProvider === provider.id
                  return (
                    <li key={provider.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedProvider(provider.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                          sel
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50',
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          {provider.avatar ? <AvatarImage src={provider.avatar} alt="" /> : null}
                          <AvatarFallback>{provider.businessName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-medium">{provider.businessName}</span>
                            {provider.verificationStatus === 'verified' && (
                              <Badge variant="secondary" className="h-5 gap-0.5 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            {provider.email}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {provider.phone}
                          </div>
                          {!!provider.rating && (
                            <div className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 text-bloom-coral" />
                              {provider.rating} ({provider.totalJobs || 0} jobs)
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {selectedProviderData && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">Selected provider</p>
              <p className="font-medium">{selectedProviderData.businessName}</p>
              <p className="text-sm text-muted-foreground">{selectedProviderData.email}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium">Notification options</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-p"
                checked={notifyProvider}
                onCheckedChange={(c) => setNotifyProvider(c === true)}
              />
              <Label htmlFor="notify-p" className="text-sm font-normal leading-snug">
                Notify provider about this assignment
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-c"
                checked={notifyCustomer}
                onCheckedChange={(c) => setNotifyCustomer(c === true)}
              />
              <Label htmlFor="notify-c" className="text-sm font-normal leading-snug">
                Notify customer about provider assignment
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAssign} disabled={!selectedProvider || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              'Assign provider'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
