import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  InsertEmoticon as EmojiIcon,
} from '@mui/icons-material';
import { ChatMessage } from '../../services/api/chat.service';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any[]) => Promise<void>;
  onUploadFile: (file: File) => Promise<any>;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onUploadFile,
  replyTo,
  onCancelReply,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        Array.from(files).map((file) => onUploadFile(file))
      );
      setAttachments([...attachments, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    try {
      await onSendMessage(message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      onCancelReply?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
      {/* Reply To */}
      {replyTo && (
        <Paper
          sx={{
            p: 1,
            m: 1,
            bgcolor: 'action.hover',
            borderLeft: 2,
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Replying to {replyTo.senderId.firstName}
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
              {replyTo.content}
            </Box>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {attachments.map((attachment, index) => (
            <Chip
              key={index}
              label={attachment.fileName || 'File'}
              onDelete={() => handleRemoveAttachment(index)}
              size="small"
              sx={{ maxWidth: 200 }}
            />
          ))}
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {/* Emoji Button (placeholder) */}
        <Tooltip title="Coming soon">
          <span>
            <IconButton size="small" disabled>
              <EmojiIcon />
            </IconButton>
          </span>
        </Tooltip>

        {/* File Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        />
        <Tooltip title="Attach file">
          <span>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
            >
              {uploading ? <CircularProgress size={20} /> : <AttachFileIcon />}
            </IconButton>
          </span>
        </Tooltip>

        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || sending}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Send Button */}
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={(!message.trim() && attachments.length === 0) || sending || disabled}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
            },
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;

