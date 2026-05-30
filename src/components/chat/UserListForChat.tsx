/**
 * User/Customer List for Chat (Admin)
 * Allows admins to browse and start conversations with customers
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { Search, MessageCircle, User as UserIcon, CheckCircle, Loader2 } from 'lucide-react'
import { usersService, User } from '../../services/api/users.service'
import { ChatService, ConversationType, normalizeConversationList } from '../../services/api/chat.service'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'

interface UserListForChatProps {
  onUserSelect: (userId: string, conversationId: string) => void
  onClose: () => void
}

export const UserListForChat: React.FC<UserListForChatProps> = ({ onUserSelect, onClose }) => {
  const authUser = useSelector((s: RootState) => s.auth.user)
  const adminUserId = useMemo(() => {
    if (authUser?.id) return String(authUser.id)
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      if (u?.id || u?._id) return String(u.id || u._id)
    } catch {
      /* ignore */
    }
    return localStorage.getItem('userId') || ''
  }, [authUser?.id])

  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null)

  useEffect(() => {
    void fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await usersService.getUsers({
        page: 1,
        limit: 100,
        scope: 'directory',
        user_type: 'customer',
        is_active: true,
      })

      if (response.users) {
        setUsers(response.users)
      }
    } catch (err: unknown) {
      console.error('Error fetching users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.phone && user.phone.includes(searchTerm))
    )
  })

  const handleStartChat = async (user: User) => {
    setCreatingConversation(user.id)
    try {
      if (!adminUserId) {
        setError('Admin user not authenticated. Please log in again.')
        return
      }

      const existingConversationsResponse = await ChatService.getConversations()
      if (existingConversationsResponse.success && existingConversationsResponse.data !== undefined) {
        const convs = normalizeConversationList(existingConversationsResponse.data)
        const existingConversation = convs.find(
          (conv) =>
            conv.type === ConversationType.DIRECT &&
            conv.participants.some((p) => String(p.userId._id) === adminUserId) &&
            conv.participants.some((p) => String(p.userId._id) === String(user.id)),
        )

        if (existingConversation) {
          onUserSelect(user.id, existingConversation._id)
          return
        }
      }

      const response = await ChatService.createConversation({
        type: ConversationType.DIRECT,
        participants: [
          { userId: adminUserId, role: 'admin' },
          { userId: user.id, role: 'customer' },
        ],
        metadata: {
          subject: `Admin Chat with ${user.firstName || ''} ${user.lastName || ''}`,
        },
      })

      if (response.success && response.data) {
        onUserSelect(user.id, response.data._id)
      }
    } catch (err: unknown) {
      console.error('Error starting chat:', err)
      const e = err as { message?: string }
      setError(e.message || 'Failed to start chat with user')
    } finally {
      setCreatingConversation(null)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading customers...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <UserIcon className="h-5 w-5" />
          Chat with Customers
        </h2>
        <p className="text-sm text-muted-foreground">Select a customer to start a conversation</p>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search customers by name, email, or phone..."
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
        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <UserIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>
              {searchTerm ? 'No customers found matching your search' : 'No customers available'}
            </p>
          </div>
        ) : (
          <ul className="p-0">
            {filteredUsers.map((user, index) => (
              <li key={user.id} className="list-none">
                {index > 0 && <Separator />}
                <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <Avatar className="h-12 w-12">
                    {user.profilePicture && <AvatarImage src={user.profilePicture} alt="" />}
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">
                        {user.firstName || ''} {user.lastName || ''}
                      </span>
                      {user.isVerified && <CheckCircle className="h-4 w-4 text-storm-deep" aria-label="Verified" />}
                      <Badge variant="secondary" className="h-5 text-[0.7rem]">
                        Customer
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground">📱 {user.phone}</p>}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="ml-2 shrink-0"
                    onClick={() => void handleStartChat(user)}
                    disabled={creatingConversation !== null}
                  >
                    {creatingConversation === user.id ? (
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

export default UserListForChat
