import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  InsertEmoticon as EmojiIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ChatMessage } from '../../services/api/chat.service';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReply?: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onReply,
  onReact,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit?.(message);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(message);
    handleMenuClose();
  };

  const handleReply = () => {
    onReply?.(message);
    handleMenuClose();
  };

  const handleReact = () => {
    onReact?.(message);
    handleMenuClose();
  };

  const renderAttachment = (attachment: any, index: number) => {
    if (attachment.type === 'image') {
      return (
        <Box
          key={index}
          component="img"
          src={attachment.url}
          alt={attachment.fileName}
          sx={{
            maxWidth: '100%',
            maxHeight: 300,
            borderRadius: 1,
            cursor: 'pointer',
          }}
          onClick={() => window.open(attachment.url, '_blank')}
        />
      );
    }

    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'action.hover',
          borderRadius: 1,
          cursor: 'pointer',
        }}
        onClick={() => window.open(attachment.url, '_blank')}
      >
        <Typography variant="body2" noWrap>
          📎 {attachment.fileName}
        </Typography>
        {attachment.fileSize && (
          <Typography variant="caption" color="text.secondary">
            ({(attachment.fileSize / 1024).toFixed(1)} KB)
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
        gap: 1,
      }}
    >
      {!isOwnMessage && (
        <Avatar
          src={message.senderId.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {message.senderId.firstName?.[0]}
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%' }}>
        {/* Reply To */}
        {message.replyTo && (
          <Paper
            sx={{
              p: 0.5,
              mb: 0.5,
              bgcolor: 'action.hover',
              borderLeft: 2,
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Replying to: {message.replyTo.content}
            </Typography>
          </Paper>
        )}

        {/* Message Content */}
        <Paper
          sx={{
            p: 1.5,
            bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
            color: isOwnMessage ? 'white' : 'text.primary',
            position: 'relative',
            '&:hover .message-actions': {
              opacity: 1,
            },
          }}
        >
          {/* Sender Name */}
          {!isOwnMessage && (
            <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
              {message.senderId.firstName} {message.senderId.lastName}
            </Typography>
          )}

          {/* Message Text */}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {message.attachments.map((attachment, index) => renderAttachment(attachment, index))}
            </Box>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {message.reactions.map((reaction, index) => (
                <Chip
                  key={index}
                  label={`${reaction.emoji} 1`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}

          {/* Time & Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                fontSize: '0.7rem',
              }}
            >
              {format(new Date(message.createdAt), 'h:mm a')}
              {message.isEdited && ' (edited)'}
            </Typography>

            {/* Message Actions */}
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              className="message-actions"
              sx={{
                opacity: 0,
                transition: 'opacity 0.2s',
                color: isOwnMessage ? 'white' : 'inherit',
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

        {/* Read Receipts */}
        {message.readReceipts && message.readReceipts.length > 0 && isOwnMessage && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: '0.65rem' }}>
            Read by {message.readReceipts.length}
          </Typography>
        )}
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleReply}>
          <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={handleReact}>
          <EmojiIcon fontSize="small" sx={{ mr: 1 }} />
          React
        </MenuItem>
        {isOwnMessage && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default MessageBubble;

