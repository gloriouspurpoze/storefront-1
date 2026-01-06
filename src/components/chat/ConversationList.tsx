import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Support as SupportIcon,
  BookOnline as BookingIcon,
  Person as PersonIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { formatDistance } from 'date-fns';
import { ChatConversation, ConversationType } from '../../services/api/chat.service';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedConversation: ChatConversation | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  loading?: boolean;
  currentUserId: string;
  onSearchChange?: (search: string) => void;
  onTypeChange?: (type: ConversationType | 'all') => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading = false,
  currentUserId,
  onSearchChange,
  onTypeChange,
}) => {
  const [search, setSearch] = React.useState('');
  const [tabValue, setTabValue] = React.useState<ConversationType | 'all'>('all');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);
    onSearchChange?.(value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: ConversationType | 'all') => {
    setTabValue(newValue);
    onTypeChange?.(newValue);
  };

  const getConversationIcon = (type: ConversationType) => {
    switch (type) {
      case ConversationType.SUPPORT:
        return <SupportIcon />;
      case ConversationType.BOOKING:
        return <BookingIcon />;
      case ConversationType.DIRECT:
        return <PersonIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getConversationTitle = (conversation: ChatConversation): string => {
    if (conversation.title) {
      return conversation.title;
    }

    // Get other participants (not current user)
    const otherParticipants = conversation.participants.filter(
      (p) => p.userId._id !== currentUserId
    );

    if (otherParticipants.length > 0) {
      return otherParticipants
        .map((p) => `${p.userId.firstName} ${p.userId.lastName}`)
        .join(', ');
    }

    return 'Conversation';
  };

  const getUnreadCount = (conversation: ChatConversation): number => {
    const currentParticipant = conversation.participants.find(
      (p) => p.userId._id === currentUserId
    );
    return currentParticipant?.unreadCount || 0;
  };

  const getLastMessageTime = (conversation: ChatConversation): string => {
    if (conversation.lastMessage?.sentAt) {
      return formatDistance(new Date(conversation.lastMessage.sentAt), new Date(), {
        addSuffix: true,
      });
    }
    return '';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Conversations
        </Typography>
        
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
      >
        <Tab label="All" value="all" />
        <Tab label="Direct" value={ConversationType.DIRECT} />
        <Tab label="Booking" value={ConversationType.BOOKING} />
        <Tab label="Support" value={ConversationType.SUPPORT} />
      </Tabs>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography color="text.secondary">No conversations found</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {conversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversation?._id === conversation._id;
              const isArchived = conversation.participants.some(
                (p) => p.userId._id === currentUserId && p.isArchived
              );

              return (
                <ListItem
                  key={conversation._id}
                  disablePadding
                  secondaryAction={
                    isArchived && (
                      <IconButton edge="end" size="small">
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => onSelectConversation(conversation)}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={unreadCount} color="error">
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getConversationIcon(conversation.type)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: unreadCount > 0 ? 600 : 400 }}
                          >
                            {getConversationTitle(conversation)}
                          </Typography>
                          {conversation.metadata?.priority && (
                            <Chip
                              label={conversation.metadata.priority}
                              size="small"
                              color={getPriorityColor(conversation.metadata.priority)}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ fontWeight: unreadCount > 0 ? 500 : 400 }}
                          >
                            {conversation.lastMessage?.text || 'No messages yet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getLastMessageTime(conversation)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationList;

