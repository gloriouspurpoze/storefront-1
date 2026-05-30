import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Building2, User } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent } from '../../components/ui/dialog'
import { cn } from '../../lib/utils'
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useAppDispatch } from '../../store/hooks';
import { setChatUnreadMessages } from '../../store/slices/chatInboxSlice';
import { useSocket } from '../../hooks/useSocket';
import {
  ChatService,
  ChatConversation,
  ChatMessage,
  ConversationType,
  MessageType,
  normalizeConversationList,
  normalizeMessageList,
  sortConversationsForInbox,
} from '../../services/api/chat.service';
import ConversationList from '../../components/chat/ConversationList';
import MessageThread from '../../components/chat/MessageThread';
import ProviderListForChat from '../../components/chat/ProviderListForChat';
import UserListForChat from '../../components/chat/UserListForChat';
import { useAppConfirm, useAppPrompt } from '../../components/providers/AppDialogsProvider';

function extractIncomingMessage(raw: unknown): ChatMessage | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.message && typeof o.message === 'object') return o.message as unknown as ChatMessage
  if ('_id' in o && 'conversationId' in o) return o as unknown as ChatMessage
  return null
}

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
  const [conversationTypeFilter, setConversationTypeFilter] = useState<ConversationType | 'all'>('all');
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!snackbar.open) return undefined;
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 3000);
    return () => window.clearTimeout(t);
  }, [snackbar.open, snackbar.message]);
  
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdminUser = useMemo(() => {
    const t = (authUser as any)?.userType || (authUser as any)?.role || (authUser as any)?.type;
    return t === 'admin' || t === 'super_admin';
  }, [authUser]);
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

  const refreshChatUnread = useCallback(async () => {
    try {
      const r = await ChatService.getUnreadCount();
      if (r.success && r.data != null) {
        const d = r.data as { messages?: number };
        dispatch(setChatUnreadMessages(d.messages ?? 0));
      }
    } catch {
      /* non-fatal */
    }
  }, [dispatch]);

  const applyConversations = useCallback(
    (updater: ChatConversation[] | ((prev: ChatConversation[]) => ChatConversation[])) => {
      setConversations((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (p: ChatConversation[]) => ChatConversation[])(prev) : updater;
        return sortConversationsForInbox(next);
      });
    },
    [],
  );

  const displayedConversations = useMemo(() => {
    const sorted = sortConversationsForInbox(conversations);
    if (conversationTypeFilter === 'all') return sorted;
    return sorted.filter((c) => c.type === conversationTypeFilter);
  }, [conversations, conversationTypeFilter]);

  useEffect(() => {
    if (!selectedConversation) return;
    if (!displayedConversations.some((c) => c._id === selectedConversation._id)) {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [displayedConversations, selectedConversation]);

  const selectedConversationIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?._id ?? null
  }, [selectedConversation?._id])

  // Socket.IO connection
  const { socket, isConnected } = useSocket({
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
  const loadConversations = useCallback(async (): Promise<ChatConversation[]> => {
    try {
      setLoading(true);
      const [baseRes, supportRes] = await Promise.all([
        ChatService.getConversations(),
        isAdminUser ? ChatService.getSupportConversations({ limit: 100 }) : Promise.resolve(null),
      ]);

      const baseList =
        baseRes && baseRes.success && baseRes.data !== undefined ? normalizeConversationList(baseRes.data) : [];

      const supportList =
        supportRes && (supportRes as any).success && (supportRes as any).data !== undefined
          ? normalizeConversationList((supportRes as any).data)
          : [];

      const merged = [...baseList, ...supportList].reduce<ChatConversation[]>((acc, c) => {
        if (!acc.some((x) => x._id === c._id)) acc.push(c);
        return acc;
      }, []);

      applyConversations(merged);
      void refreshChatUnread();
      return merged;
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
    return [];
  }, [isAdminUser, applyConversations, refreshChatUnread]);

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
    let activeConversation = conversation;

    // Support queue: support conversations may not include any admin until assigned.
    // Take ownership on open so the admin can load/join/send immediately.
    if (
      isAdminUser &&
      conversation.type === ConversationType.SUPPORT &&
      !conversation.participants.some((p) => String(p.userId?._id) === String(currentUserId))
    ) {
      try {
        const assigned = await ChatService.assignAdminToSupport(conversation._id, currentUserId);
        if (assigned.success && assigned.data) {
          activeConversation = assigned.data;
          await loadConversations();
        }
      } catch (e: any) {
        showSnackbar(e?.message || 'Failed to take support conversation', 'error');
      }
    }

    setSelectedConversation(activeConversation);
    await loadMessages(activeConversation._id);

    // Join conversation via Socket.IO (also re-runs when socket connects — see effect below)
    if (socket?.connected) {
      socket.emit('join:conversation', { conversationId: activeConversation._id });
    }

    // Mark as read
    try {
      await ChatService.markAsRead(activeConversation._id);
      // Update unread count in conversations list
      applyConversations((prev) =>
        prev.map((conv) =>
          conv._id === activeConversation._id
            ? {
                ...conv,
                participants: conv.participants.map((p) =>
                  p.userId && String(p.userId._id) === currentUserId ? { ...p, unreadCount: 0 } : p,
                ),
              }
            : conv,
        ),
      );
      void refreshChatUnread();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  /**
   * Prefer socket (broadcasts to other participants).
   * Fall back to REST when socket is unavailable.
   */
  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!selectedConversation) return;

    const payload = {
      conversationId: selectedConversation._id,
      content,
      type: MessageType.TEXT,
      attachments: attachments?.length ? attachments : undefined,
      clientTempId: `admin-${Date.now()}`,
    };

    try {
      // Socket path (best UX: broadcast + ack)
      if (socket?.connected) {
        const msg = await new Promise<ChatMessage>((resolve, reject) => {
          socket.emit('message:send', payload, (err: any, resp?: any) => {
            if (err) return reject(new Error(err?.message || 'Failed to send message'));
            const m = extractIncomingMessage(resp);
            if (!m) return reject(new Error('Invalid message response'));
            resolve(m);
          });
        });

        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        applyConversations((prev) =>
          prev.map((conv) =>
            conv._id === msg.conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    text: msg.content,
                    senderId: currentUserId,
                    sentAt: msg.createdAt,
                    messageType: msg.type,
                  },
                }
              : conv,
          ),
        );
        return;
      }

      // REST fallback (delivery works, but realtime broadcast depends on recipients polling)
      const response = await ChatService.sendMessage(payload);
      if (response.success && response.data) {
        const msg = response.data;
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        applyConversations((prev) =>
          prev.map((conv) =>
            conv._id === msg.conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    text: msg.content,
                    senderId: currentUserId,
                    sentAt: msg.createdAt,
                    messageType: msg.type,
                  },
                }
              : conv,
          ),
        );
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to send message', 'error');
      throw err;
    }
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

  // Re-join the active conversation when the socket (re)connects
  useEffect(() => {
    if (!socket || !isConnected || !selectedConversation) return;
    socket.emit('join:conversation', { conversationId: selectedConversation._id });
  }, [socket, isConnected, selectedConversation?._id]);

  // Refresh inbox when the operator returns to the tab (customer may have opened support on the app)
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadConversations();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [loadConversations]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:received', (data: unknown) => {
      const msg = extractIncomingMessage(data);
      if (!msg) return;

      const senderRaw = msg.senderId as unknown;
      const senderIdStr =
        typeof senderRaw === 'object' && senderRaw !== null && '_id' in senderRaw
          ? String((senderRaw as { _id: string })._id)
          : String(senderRaw ?? '');

      const openId = selectedConversationIdRef.current;
      if (openId === msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      applyConversations((prev) => {
        const exists = prev.some((c) => c._id === msg.conversationId);
        if (!exists) {
          void loadConversations();
          return prev;
        }
        return prev.map((conv) =>
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
                  p.userId && String(p.userId._id) === currentUserId && senderIdStr !== currentUserId
                    ? { ...p, unreadCount: p.unreadCount + 1 }
                    : p,
                ),
              }
            : conv,
        );
      });
      void refreshChatUnread();
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
  }, [socket, currentUserId, loadConversations, applyConversations, refreshChatUnread]);

  // Load conversations on mount
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

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
    <div className="flex h-[calc(100vh-100px)] gap-0">
      {/* Conversations List */}
      <div className="flex h-full w-[350px] flex-col border-r bg-card shadow-sm">
        <div className="flex gap-1 border-b p-2">
          <Button
            size="sm"
            className="h-8 flex-1 gap-1.5 text-xs font-normal"
            onClick={() => setShowProviderList(true)}
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            Chat with Provider
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 gap-1.5 text-xs font-normal"
            onClick={() => setShowUserList(true)}
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            Chat with Customer
          </Button>
        </div>
        
        <ConversationList
          conversations={displayedConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onTypeChange={setConversationTypeFilter}
          loading={loading}
          currentUserId={currentUserId}
        />
      </div>

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
        <div
          className="fixed bottom-4 right-4 z-[9999] max-w-sm rounded-md border border-bloom-coral/40 bg-bloom-rose px-3 py-2 text-sm text-bloom-coral shadow-md dark:border-bloom-coral dark:bg-bloom-coral/90 dark:text-bloom-deep"
          role="status"
        >
          Connecting for live updates… You can still load threads and send messages via the API.
        </div>
      )}

      {snackbar.open && (
        <div
          className={cn(
            'fixed bottom-4 left-1/2 z-[9999] max-w-md -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md sm:left-auto sm:right-4 sm:translate-x-0',
            snackbar.severity === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-card text-foreground',
          )}
        >
          {snackbar.message}
        </div>
      )}

      <Dialog open={showProviderList} onOpenChange={setShowProviderList}>
        <DialogContent className="h-[80vh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <ProviderListForChat
            onProviderSelect={handleProviderSelect}
            onClose={() => setShowProviderList(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showUserList} onOpenChange={setShowUserList}>
        <DialogContent className="h-[80vh] max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <UserListForChat
            onUserSelect={handleUserSelect}
            onClose={() => setShowUserList(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatPage

