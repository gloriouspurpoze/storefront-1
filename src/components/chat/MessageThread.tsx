import React, { useEffect, useRef, useState } from 'react'
import { Archive, VolumeX, MoreVertical, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { ChatMessage, ChatConversation } from '../../services/api/chat.service'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface MessageThreadProps {
  conversation: ChatConversation | null
  messages: ChatMessage[]
  loading: boolean
  currentUserId: string
  onSendMessage: (content: string, attachments?: unknown[]) => Promise<void>
  onUploadFile: (file: File) => Promise<unknown>
  onEditMessage?: (message: ChatMessage) => void
  onDeleteMessage?: (message: ChatMessage) => void
  onReactToMessage?: (message: ChatMessage) => void
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onUploadFile,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">No conversation selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select a conversation from the list to start chatting</p>
        </div>
      </div>
    )
  }

  const getConversationTitle = (): string => {
    if (conversation.title) {
      return conversation.title
    }

    const otherParticipants = conversation.participants.filter(
      (p) => p.userId._id !== currentUserId,
    )

    if (otherParticipants.length > 0) {
      return otherParticipants
        .map((p) => `${p.userId.firstName || ''} ${p.userId.lastName || ''}`.trim() || 'User')
        .join(', ')
    }

    return 'Conversation'
  }

  const getParticipantRole = (role: string): string => {
    if (!role) return ''
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const handleSendWithReply = async (content: string, attachments?: unknown[]) => {
    if (replyTo) {
      await onSendMessage(content, attachments)
      setReplyTo(null)
    } else {
      await onSendMessage(content, attachments)
    }
  }

  const title = getConversationTitle()

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border p-4 shadow-sm">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
            <AvatarFallback>{(title || 'C').charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{title}</h2>
            <div className="mt-1 flex flex-wrap gap-1">
              {conversation.participants.map((participant, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal">
                  {participant.userId.firstName} ({getParticipantRole(participant.role)})
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1">
          {conversation.metadata?.status && (
            <Badge variant={conversation.metadata.status === 'open' ? 'default' : 'secondary'}>
              {conversation.metadata.status}
            </Badge>
          )}
          <Button type="button" variant="ghost" size="icon" aria-label="Archive">
            <Archive className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Mute">
            <VolumeX className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="More">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start the conversation by sending a message</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.senderId._id === currentUserId}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReply={setReplyTo}
                onReact={onReactToMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput
        onSendMessage={handleSendWithReply}
        onUploadFile={onUploadFile}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}

export default MessageThread
