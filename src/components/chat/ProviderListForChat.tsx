/**
 * Provider List for Chat (Admin)
 * Allows admins to browse and start conversations with service providers
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { Search, MessageCircle, Star, CheckCircle, Building2, Loader2 } from 'lucide-react'
import { ProvidersService } from '../../services/api/providers.service'
import { ChatService, ConversationType, normalizeConversationList } from '../../services/api/chat.service'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Separator } from '../ui/separator'

interface Provider {
  id: string
  businessName: string
  email: string
  phone: string
  rating?: number
  totalJobs?: number
  verificationStatus?: string
  avatar?: string
  user_id?: string
  business_name?: string
  verification_status?: string
}

interface ProviderListForChatProps {
  onProviderSelect: (providerId: string, conversationId: string) => void
  onClose: () => void
}

export const ProviderListForChat: React.FC<ProviderListForChatProps> = ({
  onProviderSelect,
  onClose,
}) => {
  const authUser = useSelector((s: RootState) => s.auth.user)
  const adminUserId = useMemo(() => {
    if (authUser?.id) return String(authUser.id)
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u?.id || u?._id) return String(u.id || u._id)
    } catch {
      /* ignore */
    }
    const legacy = localStorage.getItem('userId')
    return legacy || ''
  }, [authUser?.id])

  const [providers, setProviders] = useState<Provider[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null)

  useEffect(() => {
    void fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const response = await ProvidersService.getProviders({
        page: 1,
        limit: 200,
      })

      const payload = response.data as Record<string, unknown> | unknown[] | undefined
      let providersList: unknown[] = []
      if (Array.isArray(payload)) {
        providersList = payload
      } else if (payload && typeof payload === 'object') {
        const o = payload as Record<string, unknown>
        const raw = o.serviceProviders || o.providers || o.items || o.data
        providersList = Array.isArray(raw) ? raw : []
      }

      const transformedProviders: Provider[] = (providersList as Record<string, unknown>[]).map((p) => ({
        id: String(p.id || p._id || ''),
        businessName: (p.business_name as string) || (p.businessName as string) || 'Unknown Business',
        email: ((p.user as { email?: string })?.email as string) || (p.email as string) || 'N/A',
        phone: ((p.user as { phone?: string })?.phone as string) || (p.phone as string) || 'N/A',
        rating: (p.rating as number) || 0,
        totalJobs: (p.totalBookings as number) || (p.completed_bookings as number) || (p.totalJobs as number) || 0,
        verificationStatus: (p.verification_status as string) || (p.verificationStatus as string) || 'pending',
        avatar: ((p.user as { avatar?: string })?.avatar as string) || (p.avatar as string),
        user_id: (p.user_id as string) || (p.userId as string) || (p.user as { id?: string })?.id,
      }))

      setProviders(transformedProviders.filter((p) => p.id))
    } catch (err: unknown) {
      console.error('Error fetching providers:', err)
      setError('Failed to load providers. Please try again.')
    } finally {
      setLoading(false)
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

  const handleStartChat = async (provider: Provider) => {
    setCreatingConversation(provider.id)
    try {
      if (!adminUserId) {
        setError('Admin user not authenticated. Please log in again.')
        return
      }

      const targetUserId = String(provider.user_id || provider.id || '')
      if (!targetUserId) {
        setError('This provider has no linked user account.')
        return
      }

      const existingConversationsResponse = await ChatService.getConversations()
      if (existingConversationsResponse.success && existingConversationsResponse.data !== undefined) {
        const convs = normalizeConversationList(existingConversationsResponse.data)
        const existingConversation = convs.find(
          (conv) =>
            conv.type === ConversationType.DIRECT &&
            conv.participants.some((p) => String(p.userId._id) === adminUserId) &&
            conv.participants.some((p) => String(p.userId._id) === targetUserId),
        )

        if (existingConversation) {
          onProviderSelect(provider.id, existingConversation._id)
          return
        }
      }

      const response = await ChatService.createConversation({
        type: ConversationType.DIRECT,
        participants: [
          { userId: adminUserId, role: 'admin' },
          { userId: targetUserId, role: 'provider' },
        ],
        metadata: {
          subject: `Admin Chat with ${provider.businessName}`,
        },
      })

      if (response.success && response.data) {
        onProviderSelect(provider.id, response.data._id)
      }
    } catch (err: unknown) {
      console.error('Error starting chat:', err)
      const e = err as { message?: string }
      setError(e.message || 'Failed to start chat with provider')
    } finally {
      setCreatingConversation(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading providers...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5" />
          Chat with Service Providers
        </h2>
        <p className="text-sm text-muted-foreground">Select a provider to start a conversation</p>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search providers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div
          className="m-4 flex items-center justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredProviders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>
              {searchTerm ? 'No providers found matching your search' : 'No providers available'}
            </p>
          </div>
        ) : (
          <ul className="p-0">
            {filteredProviders.map((provider, index) => (
              <li key={provider.id} className="list-none">
                {index > 0 && <Separator />}
                <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <Avatar className="h-12 w-12">
                    {provider.avatar && <AvatarImage src={provider.avatar} alt="" />}
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {provider.businessName?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{provider.businessName}</span>
                      {provider.verificationStatus === 'verified' && (
                        <CheckCircle className="h-4 w-4 text-emerald-600" aria-label="Verified" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{provider.email}</p>
                    {provider.rating != null && provider.rating > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {provider.rating.toFixed(1)} ({provider.totalJobs || 0} jobs)
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="ml-2 shrink-0"
                    onClick={() => void handleStartChat(provider)}
                    disabled={creatingConversation !== null}
                  >
                    {creatingConversation === provider.id ? (
                      <>
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-1 h-3.5 w-3.5" />
                        Chat
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border p-4 text-right">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

export default ProviderListForChat
