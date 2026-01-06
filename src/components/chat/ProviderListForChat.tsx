/**
 * Provider List for Chat (Admin)
 * Allows admins to browse and start conversations with service providers
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
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { ProvidersService } from '../../services/api/providers.service';
import { ChatService, ConversationType } from '../../services/api/chat.service';

interface Provider {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  rating?: number;
  totalJobs?: number;
  verificationStatus?: string;
  avatar?: string;
  user_id?: string;
  business_name?: string;
  verification_status?: string;
}

interface ProviderListForChatProps {
  onProviderSelect: (providerId: string, conversationId: string) => void;
  onClose: () => void;
}

export const ProviderListForChat: React.FC<ProviderListForChatProps> = ({
  onProviderSelect,
  onClose,
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await ProvidersService.getAvailableProviders({
        page: 1,
        limit: 100,
      });

      if (response.data) {
        // Handle both possible response formats
        const providersList = response.data.serviceProviders || response.data.providers || [];
        
        // Transform data to ensure consistent format
        const transformedProviders: Provider[] = providersList.map((p: any) => ({
          id: p.id || p._id,
          businessName: p.business_name || p.businessName || 'Unknown Business',
          email: p.user?.email || p.email || 'N/A',
          phone: p.user?.phone || p.phone || 'N/A',
          rating: p.rating || 0,
          totalJobs: p.totalBookings || p.completed_bookings || p.totalJobs || 0,
          verificationStatus: p.verification_status || p.verificationStatus || 'pending',
          avatar: p.user?.avatar || p.avatar,
          user_id: p.user_id || p.userId,
        }));

        setProviders(transformedProviders);
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      provider.businessName.toLowerCase().includes(searchLower) ||
      provider.email.toLowerCase().includes(searchLower) ||
      provider.phone.includes(searchTerm)
    );
  });

  const handleStartChat = async (provider: Provider) => {
    setCreatingConversation(provider.id);
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        setError('Admin user not authenticated.');
        return;
      }

      const targetUserId = provider.user_id || provider.id;

      // Check if a conversation already exists
      const existingConversationsResponse = await ChatService.getConversations();
      if (existingConversationsResponse.success && existingConversationsResponse.data) {
        const existingConversation = existingConversationsResponse.data.conversations.find(conv =>
          conv.type === ConversationType.DIRECT &&
          conv.participants.some(p => p.userId._id === currentUserId) &&
          conv.participants.some(p => p.userId._id === targetUserId)
        );

        if (existingConversation) {
          onProviderSelect(provider.id, existingConversation._id);
          return;
        }
      }

      // Create new conversation
      const response = await ChatService.createConversation({
        type: ConversationType.DIRECT,
        participants: [
          { userId: currentUserId, role: 'admin' },
          { userId: targetUserId, role: 'provider' }
        ],
        metadata: {
          subject: `Admin Chat with ${provider.businessName}`,
        },
      });

      if (response.success && response.data) {
        onProviderSelect(provider.id, response.data._id);
      }
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Failed to start chat with provider');
    } finally {
      setCreatingConversation(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading providers...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          Chat with Service Providers
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a provider to start a conversation
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search providers by name, email, or phone..."
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

      {/* Provider List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredProviders.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <BusinessIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography>
              {searchTerm ? 'No providers found matching your search' : 'No providers available'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredProviders.map((provider, index) => (
              <React.Fragment key={provider.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={provider.avatar} sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {provider.businessName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {provider.businessName}
                        </Typography>
                        {provider.verificationStatus === 'verified' && (
                          <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {provider.email}
                        </Typography>
                        {provider.rating && provider.rating > 0 && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                            <Typography variant="caption">
                              {provider.rating.toFixed(1)} ({provider.totalJobs || 0} jobs)
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      creatingConversation === provider.id ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <MessageIcon />
                      )
                    }
                    onClick={() => handleStartChat(provider)}
                    disabled={creatingConversation !== null}
                    sx={{ ml: 2 }}
                  >
                    {creatingConversation === provider.id ? 'Starting...' : 'Chat'}
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

export default ProviderListForChat;

