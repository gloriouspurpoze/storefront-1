import React, { useEffect, useState } from 'react';
import { Box, Paper, Alert, Snackbar, Dialog, DialogContent, Button } from '@mui/material';
import { Business as BusinessIcon, Person as PersonIcon } from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { ChatService, ChatConversation, ChatMessage, ConversationType } from '../../services/api/chat.service';
import ConversationList from '../../components/chat/ConversationList';
import MessageThread from '../../components/chat/MessageThread';
import ProviderListForChat from '../../components/chat/ProviderListForChat';
import UserListForChat from '../../components/chat/UserListForChat';

const ChatPage: React.FC = () => {
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showProviderList, setShowProviderList] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  
  // Get current user ID from localStorage
  const currentUserId = localStorage.getItem('userId') || '';

  // Socket.IO connection
  const { socket, isConnected, error: socketError } = useSocket({
    autoConnect: true,
    onConnect: () => {
      console.log('✅ Connected to chat');
    },
    onError: (err) => {
      showSnackbar(err.message, 'error');
    },
  });

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await ChatService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await ChatService.getMessages(conversationId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to load messages', 'error');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation._id);

    // Join conversation via Socket.IO
    if (socket) {
      socket.emit('join:conversation', { conversationId: conversation._id });
    }

    // Mark as read
    try {
      await ChatService.markAsRead(conversation._id);
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversation._id
            ? {
                ...conv,
                participants: conv.participants.map(p =>
                  p.userId._id === currentUserId
                    ? { ...p, unreadCount: 0 }
                    : p
                )
              }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Send message
  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!selectedConversation || !socket) return;

    socket.emit('message:send', {
      conversationId: selectedConversation._id,
      content,
      type: 'text',
      attachments,
    });
  };

  // Upload file
  const handleUploadFile = async (file: File): Promise<any> => {
    try {
      const response = await ChatService.uploadFile(file);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to upload file');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to upload file', 'error');
      throw err;
    }
  };

  // Handle edit message
  const handleEditMessage = async (message: ChatMessage) => {
    const newContent = prompt('Edit message:', message.content);
    if (!newContent || newContent === message.content) return;

    try {
      await ChatService.editMessage(message._id, newContent);
      showSnackbar('Message edited successfully');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to edit message', 'error');
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await ChatService.deleteMessage(message._id);
      showSnackbar('Message deleted successfully');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete message', 'error');
    }
  };

  // Handle react to message
  const handleReactToMessage = async (message: ChatMessage) => {
    const emoji = prompt('Enter emoji (e.g., 👍, ❤️, 😊):');
    if (!emoji) return;

    try {
      await ChatService.addReaction(message._id, emoji);
      showSnackbar('Reaction added');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to add reaction', 'error');
    }
  };

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:received', (data: { message: ChatMessage }) => {
      setMessages(prev => [...prev, data.message]);
      
      // Update last message in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.message.conversationId
            ? {
                ...conv,
                lastMessage: {
                  text: data.message.content,
                  senderId: data.message.senderId._id,
                  sentAt: data.message.createdAt,
                  messageType: data.message.type,
                },
                participants: conv.participants.map(p =>
                  p.userId._id === currentUserId && data.message.senderId._id !== currentUserId
                    ? { ...p, unreadCount: p.unreadCount + 1 }
                    : p
                )
              }
            : conv
        )
      );
    });

    // Listen for message edits
    socket.on('message:edit', (data: any) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, content: data.content, isEdited: true, editedAt: data.editedAt }
            : msg
        )
      );
    });

    // Listen for message deletes
    socket.on('message:delete', (data: any) => {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    });

    // Listen for reactions
    socket.on('message:reaction', (data: any) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    });

    return () => {
      socket.off('message:received');
      socket.off('message:edit');
      socket.off('message:delete');
      socket.off('message:reaction');
    };
  }, [socket, currentUserId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const handleProviderSelect = (providerId: string, conversationId: string) => {
    setShowProviderList(false);
    showSnackbar('Conversation started successfully', 'success');
    // Reload conversations and select the new one
    loadConversations().then(() => {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    });
  };

  const handleUserSelect = (userId: string, conversationId: string) => {
    setShowUserList(false);
    showSnackbar('Conversation started successfully', 'success');
    // Reload conversations and select the new one
    loadConversations().then(() => {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    });
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', gap: 0 }}>
      {/* Conversations List */}
      <Paper
        elevation={2}
        sx={{
          width: 350,
          height: '100%',
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* New Chat Buttons */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<BusinessIcon />}
            onClick={() => setShowProviderList(true)}
            sx={{ textTransform: 'none' }}
          >
            Chat with Provider
          </Button>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<PersonIcon />}
            onClick={() => setShowUserList(true)}
            sx={{ textTransform: 'none' }}
          >
            Chat with Customer
          </Button>
        </Box>
        
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          loading={loading}
          currentUserId={currentUserId}
        />
      </Paper>

      {/* Message Thread */}
      <MessageThread
        conversation={selectedConversation}
        messages={messages}
        loading={messagesLoading}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onReactToMessage={handleReactToMessage}
      />

      {/* Connection Status */}
      {!isConnected && (
        <Alert
          severity="warning"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
          }}
        >
          Connecting to chat server...
        </Alert>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Provider List Modal */}
      <Dialog
        open={showProviderList}
        onClose={() => setShowProviderList(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <ProviderListForChat
            onProviderSelect={handleProviderSelect}
            onClose={() => setShowProviderList(false)}
          />
        </DialogContent>
      </Dialog>

      {/* User List Modal */}
      <Dialog
        open={showUserList}
        onClose={() => setShowUserList(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <UserListForChat
            onUserSelect={handleUserSelect}
            onClose={() => setShowUserList(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ChatPage;

