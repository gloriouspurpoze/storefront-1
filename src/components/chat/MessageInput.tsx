import React, { useState, useRef } from 'react'
import { Send, Paperclip, X, Smile, Loader2 } from 'lucide-react'
import { ChatMessage } from '../../services/api/chat.service'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
interface MessageInputProps {
  onSendMessage: (content: string, attachments?: unknown[]) => Promise<void>
  onUploadFile: (file: File) => Promise<unknown>
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  disabled?: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onUploadFile,
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<unknown[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  const QUICK_EMOJIS = ['😀', '😊', '👍', '🙏', '❤️', '🔥', '✅', '⚠️', '📎', '💬']

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    if (emojiOpen) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [emojiOpen])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadedFiles = await Promise.all(Array.from(files).map((file) => onUploadFile(file)))
      setAttachments([...attachments, ...uploadedFiles])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return

    setSending(true)
    try {
      await onSendMessage(message, attachments.length > 0 ? attachments : undefined)
      setMessage('')
      setAttachments([])
      onCancelReply?.()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="border-t border-border">
      {replyTo && (
        <div className="m-2 flex items-center justify-between rounded-md border-l-4 border-primary bg-muted/60 p-2 text-sm">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Replying to {replyTo.senderId.firstName}</div>
            <div className="truncate text-foreground">{replyTo.content}</div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2">
          {attachments.map((attachment: unknown, index) => {
            const a = attachment as { fileName?: string }
            return (
            <Badge key={index} variant="secondary" className="max-w-[200px] truncate">
              {a.fileName || 'File'}
              <button
                type="button"
                className="ml-1 rounded hover:bg-muted"
                onClick={() => handleRemoveAttachment(index)}
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
            )
          })}
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
        <div className="relative shrink-0" ref={emojiRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Insert emoji"
            disabled={disabled || sending}
            onClick={() => setEmojiOpen((o) => !o)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          {emojiOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-1 flex max-w-[220px] flex-wrap gap-0.5 rounded-md border bg-popover p-2 shadow-md">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="rounded p-1.5 text-xl hover:bg-muted"
                  onClick={() => {
                    setMessage((prev) => prev + em)
                    setEmojiOpen(false)
                  }}
                >
                  <span aria-hidden>{em}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Attach file"
          disabled={uploading || disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </Button>

        <Textarea
          className="min-h-[40px] flex-1 resize-none rounded-md border bg-background"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          rows={1}
        />

        <Button
          type="button"
          size="icon"
          className="shrink-0"
          onClick={() => void handleSend()}
          disabled={(!message.trim() && attachments.length === 0) || sending || disabled}
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}

export default MessageInput
