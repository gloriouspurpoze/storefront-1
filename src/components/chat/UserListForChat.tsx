/**
 * User/Customer List for Chat (Admin)
 * Allows admins to browse and start conversations with customers
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { usersService, User } from '../../services/api/users.service';
import { ChatService, ConversationType } from '../../services/api/chat.service';

interface UserListForChatProps {
  onUserSelect: (userId: string, conversationId: string) => void;
  onClose: () => void;
}

export const UserListForChat: React.FC<UserListForChatProps> = ({
  onUserSelect,
  onClose,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersService.getUsers({
        page: 1,
        limit: 100,
        user_type: 'customer', // Only fetch customers
        is_active: true,
      });

      if (response.users) {
        setUsers(response.users);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.phone && user.phone.includes(searchTerm))
    );
  });

  const handleStartChat = async (user: User) => {
    setCreatingConversation(user.id);
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setError('Admin user not authenticated.');
        return;
      }

      // Check if a conversation already exists
      const existingConversationsResponse = await ChatService.getConversations();
      if (existingConversationsResponse.success && existingConversationsResponse.data) {
        const existingConversation = existingConversationsResponse.data.conversations.find(conv =>
          conv.type === ConversationType.DIRECT &&
          conv.participants.some(p => p.userId._id === currentUserId) &&
          conv.participants.some(p => p.userId._id === user.id)
        );

        if (existingConversation) {
          onUserSelect(user.id, existingConversation._id);
          return;
        }
      }

      // Create new conversation
      const response = await ChatService.createConversation({
        type: ConversationType.DIRECT,
        participants: [
          { userId: currentUserId, role: 'admin' },
          { userId: user.id, role: 'customer' }
        ],
        metadata: {
          subject: `Admin Chat with ${user.firstName || ''} ${user.lastName || ''}`,
        },
      });

      if (response.success && response.data) {
        onUserSelect(user.id, response.data._id);
      }
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Failed to start chat with user');
    } finally {
      setCreatingConversation(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading customers...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Chat with Customers
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a customer to start a conversation
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mt: 2 }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* User List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredUsers.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <PersonIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography>
              {searchTerm ? 'No customers found matching your search' : 'No customers available'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredUsers.map((user, index) => (
              <React.Fragment key={user.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profilePicture} sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                      {(user.firstName?.charAt(0) || '')}{(user.lastName?.charAt(0) || '') || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {user.firstName || ''} {user.lastName || ''}
                        </Typography>
                        {user.isVerified && (
                          <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                        )}
                        <Chip 
                          label="Customer" 
                          size="small" 
                          sx={{ height: 20, fontSize: '0.7rem' }}
                          color="default"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary">
                            📱 {user.phone}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      creatingConversation === user.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <MessageIcon />
                      )
                    }
                    onClick={() => handleStartChat(user)}
                    disabled={creatingConversation !== null}
                    sx={{ ml: 2 }}
                  >
                    {creatingConversation === user.id ? 'Starting...' : 'Chat'}
                  </Button>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </Box>
    </Box>
  );
};

export default UserListForChat;

