import React, { useEffect, useState, useMemo } from 'react';
import { Box, Paper, Alert, Snackbar, Dialog, DialogContent, Button } from '@mui/material';
import { Business as BusinessIcon, Person as PersonIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useSocket } from '../../hooks/useSocket';
import {
  ChatService,
  ChatConversation,
  ChatMessage,
  ConversationType,
  normalizeConversationList,
  normalizeMessageList,
} from '../../services/api/chat.service';
import ConversationList from '../../components/chat/ConversationList';
import MessageThread from '../../components/chat/MessageThread';
import ProviderListForChat from '../../components/chat/ProviderListForChat';
import UserListForChat from '../../components/chat/UserListForChat';
import { useAppConfirm, useAppPrompt } from '../../components/providers/AppDialogsProvider';

const ChatPage: React.FC = () => {
  const confirm = useAppConfirm();
  const prompt = useAppPrompt();
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
  
  const authUser = useSelector((s: RootState) => s.auth.user);
  const currentUserId = useMemo(() => {
    if (authUser?.id) return String(authUser.id);
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const id = u?.id || u?._id;
      if (id) return String(id);
    } catch {
      /* ignore */
    }
    return localStorage.getItem('userId') || '';
  }, [authUser?.id]);

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

  // Load conversations (API returns conversation array in `data`, not `data.conversations`)
  const loadConversations = async (): Promise<ChatConversation[]> => {
    try {
      setLoading(true);
      const response = await ChatService.getConversations();
      if (response.success && response.data !== undefined) {
        const list = normalizeConversationList(response.data);
        setConversations(list);
        return list;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
    return [];
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await ChatService.getMessages(conversationId);
      if (response.success && response.data !== undefined) {
        setMessages(normalizeMessageList(response.data));
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
    const newContent = await prompt({
      title: 'Edit message',
      label: 'Message',
      defaultValue: message.content,
      multiline: true,
      confirmLabel: 'Save',
    });
    if (newContent == null || newContent === message.content) return;

    try {
      await ChatService.editMessage(message._id, newContent);
      showSnackbar('Message edited successfully');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to edit message', 'error');
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (message: ChatMessage) => {
    const ok = await confirm({
      title: 'Delete message?',
      message: 'Are you sure you want to delete this message?',
      danger: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    try {
      await ChatService.deleteMessage(message._id);
      showSnackbar('Message deleted successfully');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete message', 'error');
    }
  };

  // Handle react to message
  const handleReactToMessage = async (message: ChatMessage) => {
    const emoji = await prompt({
      title: 'Add reaction',
      message: 'Enter an emoji (e.g. 👍, ❤️, 😊)',
      label: 'Emoji',
      defaultValue: '',
    });
    if (emoji == null || !emoji.trim()) return;

    try {
      await ChatService.addReaction(message._id, emoji.trim());
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
      const msg = data.message;
      const senderRaw = msg.senderId as unknown;
      const senderIdStr =
        typeof senderRaw === 'object' && senderRaw !== null && '_id' in senderRaw
          ? String((senderRaw as { _id: string })._id)
          : String(senderRaw ?? '');

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === msg.conversationId
            ? {
                ...conv,
                lastMessage: {
                  text: msg.content,
                  senderId: senderIdStr,
                  sentAt: msg.createdAt,
                  messageType: msg.type,
                },
                participants: conv.participants.map((p) =>
                  p.userId._id === currentUserId && senderIdStr !== currentUserId
                    ? { ...p, unreadCount: p.unreadCount + 1 }
                    : p
                ),
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

  const handleProviderSelect = async (_providerId: string, conversationId: string) => {
    setShowProviderList(false);
    showSnackbar('Conversation started successfully', 'success');
    const list = await loadConversations();
    const conversation = list.find((c) => c._id === conversationId);
    if (conversation) {
      await handleSelectConversation(conversation);
    }
  };

  const handleUserSelect = async (_userId: string, conversationId: string) => {
    setShowUserList(false);
    showSnackbar('Conversation started successfully', 'success');
    const list = await loadConversations();
    const conversation = list.find((c) => c._id === conversationId);
    if (conversation) {
      await handleSelectConversation(conversation);
    }
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

