import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Archive as ArchiveIcon,
  VolumeOff as MuteIcon,
} from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { ChatMessage, ChatConversation } from '../../services/api/chat.service';

interface MessageThreadProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  currentUserId: string;
  onSendMessage: (content: string, attachments?: any[]) => Promise<void>;
  onUploadFile: (file: File) => Promise<any>;
  onEditMessage?: (message: ChatMessage) => void;
  onDeleteMessage?: (message: ChatMessage) => void;
  onReactToMessage?: (message: ChatMessage) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!conversation) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No conversation selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a conversation from the list to start chatting
          </Typography>
        </Box>
      </Box>
    );
  }

  const getConversationTitle = (): string => {
    if (conversation.title) {
      return conversation.title;
    }

    const otherParticipants = conversation.participants.filter(
      (p) => p.userId._id !== currentUserId
    );

    if (otherParticipants.length > 0) {
      return otherParticipants
        .map((p) => `${p.userId.firstName || ''} ${p.userId.lastName || ''}`.trim() || 'User')
        .join(', ');
    }

    return 'Conversation';
  };

  const getParticipantRole = (role: string): string => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleSendWithReply = async (content: string, attachments?: any[]) => {
    // If there's a reply, add it to metadata
    if (replyTo) {
      await onSendMessage(content, attachments);
      // TODO: Add replyTo to the message metadata
      setReplyTo(null);
    } else {
      await onSendMessage(content, attachments);
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {(getConversationTitle() || 'C').charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{getConversationTitle()}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {conversation.participants.map((participant, index) => (
                <Chip
                  key={index}
                  label={`${participant.userId.firstName} (${getParticipantRole(participant.role)})`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {conversation.metadata?.status && (
            <Chip
              label={conversation.metadata.status}
              size="small"
              color={conversation.metadata.status === 'open' ? 'success' : 'default'}
            />
          )}
          <IconButton size="small">
            <ArchiveIcon />
          </IconButton>
          <IconButton size="small">
            <MuteIcon />
          </IconButton>
          <IconButton size="small">
            <MoreIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">No messages yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Start the conversation by sending a message
            </Typography>
          </Box>
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
      </Box>

      {/* Input Area */}
      <MessageInput
        onSendMessage={handleSendWithReply}
        onUploadFile={onUploadFile}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </Box>
  );
};

export default MessageThread;

