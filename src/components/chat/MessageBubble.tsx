import React from 'react'
import { MoreVertical, Pencil, Trash2, Reply, Smile } from 'lucide-react'
import { format } from 'date-fns'
import { ChatMessage } from '../../services/api/chat.service'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'

interface MessageBubbleProps {
  message: ChatMessage
  isOwnMessage: boolean
  onEdit?: (message: ChatMessage) => void
  onDelete?: (message: ChatMessage) => void
  onReply?: (message: ChatMessage) => void
  onReact?: (message: ChatMessage) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onReply,
  onReact,
}) => {
  const renderAttachment = (attachment: { type?: string; url?: string; fileName?: string; fileSize?: number }, index: number) => {
    if (attachment.type === 'image' && attachment.url) {
      return (
        <button
          key={index}
          type="button"
          className="max-h-[300px] max-w-full cursor-pointer overflow-hidden rounded"
          onClick={() => window.open(attachment.url, '_blank')}
        >
          <img
            src={attachment.url}
            alt={attachment.fileName || ''}
            className="max-h-[300px] w-full object-contain"
          />
        </button>
      )
    }

    return (
      <button
        key={index}
        type="button"
        className="flex w-full items-center gap-2 rounded bg-muted/80 p-2 text-left text-sm"
        onClick={() => attachment.url && window.open(attachment.url, '_blank')}
      >
        <span className="truncate">📎 {attachment.fileName}</span>
        {attachment.fileSize != null && (
          <span className="shrink-0 text-xs text-muted-foreground">
            ({(attachment.fileSize / 1024).toFixed(1)} KB)
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={cn('mb-4 flex gap-2', isOwnMessage ? 'justify-end' : 'justify-start')}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 shrink-0">
          {message.senderId.avatar && <AvatarImage src={message.senderId.avatar} alt="" />}
          <AvatarFallback>{message.senderId.firstName?.[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[70%]">
        {message.replyTo && (
          <div className="mb-1 border-l-4 border-primary bg-muted/50 p-1.5 text-xs text-muted-foreground">
            Replying to: {message.replyTo.content}
          </div>
        )}

        <div
          className={cn(
            'group relative rounded-lg p-3',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
          )}
        >
          {!isOwnMessage && (
            <span className="mb-1 block text-xs font-semibold">
              {message.senderId.firstName} {message.senderId.lastName}
            </span>
          )}

          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {message.attachments.map((attachment, index) => renderAttachment(attachment, index))}
            </div>
          )}

          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.reactions.map((reaction, index) => (
                <Badge key={index} variant="secondary" className="h-5 text-[0.7rem]">
                  {reaction.emoji}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-[0.7rem] opacity-80',
                isOwnMessage ? 'text-primary-foreground/90' : 'text-muted-foreground',
              )}
            >
              {format(new Date(message.createdAt), 'h:mm a')}
              {message.isEdited && ' (edited)'}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100',
                    isOwnMessage && 'text-primary-foreground hover:bg-primary-foreground/10',
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReply?.(message)}>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReact?.(message)}>
                  <Smile className="mr-2 h-4 w-4" />
                  React
                </DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(message)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(message)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {message.readReceipts && message.readReceipts.length > 0 && isOwnMessage && (
          <p className="ml-1 mt-0.5 text-[0.65rem] text-muted-foreground">
            Read by {message.readReceipts.length}
          </p>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
