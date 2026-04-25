import React from 'react'
import { Search, Headphones, Calendar, User, Archive, Loader2 } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { ChatConversation, ConversationType } from '../../services/api/chat.service'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '../../lib/utils'

interface ConversationListProps {
  conversations: ChatConversation[]
  selectedConversation: ChatConversation | null
  onSelectConversation: (conversation: ChatConversation) => void
  loading?: boolean
  currentUserId: string
  onSearchChange?: (search: string) => void
  onTypeChange?: (type: ConversationType | 'all') => void
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading = false,
  currentUserId,
  onSearchChange,
  onTypeChange,
}) => {
  const [search, setSearch] = React.useState('')
  const [tabValue, setTabValue] = React.useState<string>('all')

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearch(value)
    onSearchChange?.(value)
  }

  const getConversationIcon = (type: ConversationType) => {
    const c = 'h-4 w-4'
    switch (type) {
      case ConversationType.SUPPORT:
        return <Headphones className={c} />
      case ConversationType.BOOKING:
        return <Calendar className={c} />
      case ConversationType.DIRECT:
        return <User className={c} />
      default:
        return <User className={c} />
    }
  }

  const getConversationTitle = (conversation: ChatConversation): string => {
    if (conversation.title) {
      return conversation.title
    }

    const otherParticipants = conversation.participants.filter(
      (p) => p.userId._id !== currentUserId,
    )

    if (otherParticipants.length > 0) {
      return otherParticipants.map((p) => `${p.userId.firstName} ${p.userId.lastName}`).join(', ')
    }

    return 'Conversation'
  }

  const getUnreadCount = (conversation: ChatConversation): number => {
    const currentParticipant = conversation.participants.find(
      (p) => p.userId._id === currentUserId,
    )
    return currentParticipant?.unreadCount || 0
  }

  const getLastMessageTime = (conversation: ChatConversation): string => {
    if (conversation.lastMessage?.sentAt) {
      return formatDistance(new Date(conversation.lastMessage.sentAt), new Date(), {
        addSuffix: true,
      })
    }
    return ''
  }

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-destructive/50 bg-destructive/10 text-destructive'
      case 'high':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100'
      case 'medium':
        return 'border-sky-500/50 bg-sky-500/10 text-sky-900 dark:text-sky-100'
      case 'low':
        return 'border-border bg-muted text-foreground'
      default:
        return 'border-border bg-background'
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search conversations..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <Tabs
        value={tabValue}
        onValueChange={(v) => {
          setTabValue(v)
          onTypeChange?.(v as ConversationType | 'all')
        }}
        className="border-b border-border px-2"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-2">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value={ConversationType.DIRECT} className="text-xs sm:text-sm">
            Direct
          </TabsTrigger>
          <TabsTrigger value={ConversationType.BOOKING} className="text-xs sm:text-sm">
            Booking
          </TabsTrigger>
          <TabsTrigger value={ConversationType.SUPPORT} className="text-xs sm:text-sm">
            Support
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No conversations found</div>
        ) : (
          <ul className="divide-y divide-border p-0">
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation)
              const isSelected = selectedConversation?._id === conversation._id
              const isArchived = conversation.participants.some(
                (p) => p.userId._id === currentUserId && p.isArchived,
              )

              return (
                <li key={conversation._id} className="relative list-none">
                  {isArchived && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
                      aria-label="Archived"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation)}
                    className={cn(
                      'flex w-full gap-3 py-3 pl-3 pr-10 text-left transition-colors hover:bg-muted/80',
                      isSelected && 'bg-muted',
                    )}
                  >
                    <div className="relative shrink-0">
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getConversationIcon(conversation.type)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'truncate text-sm',
                            unreadCount > 0 ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {getConversationTitle(conversation)}
                        </span>
                        {conversation.metadata?.priority && (
                          <Badge
                            variant="outline"
                            className={cn('h-5 shrink-0 text-[0.65rem]', getPriorityClass(conversation.metadata.priority))}
                          >
                            {conversation.metadata.priority}
                          </Badge>
                        )}
                      </div>
                      <p
                        className={cn(
                          'truncate text-sm text-muted-foreground',
                          unreadCount > 0 && 'font-medium',
                        )}
                      >
                        {conversation.lastMessage?.text || 'No messages yet'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLastMessageTime(conversation)}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ConversationList
