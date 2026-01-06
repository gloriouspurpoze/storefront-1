import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Menu,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as DollarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material'
import staticData from '../../data/staticData.json'
import { Quote, ServiceRequest } from '../../types'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'

const statusColors = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'default',
} as const

const statusIcons = {
  pending: PendingIcon,
  accepted: CheckCircleIcon,
  rejected: CancelIcon,
  expired: ScheduleIcon,
}

export function Quotes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const theme = useTheme()

  const quotes = staticData.quotes

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.amount.toString().includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const quoteStats = {
    pending: quotes.filter(q => q.status === 'pending').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    expired: quotes.filter(q => q.status === 'expired').length,
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setAnchorEl(event.currentTarget)
    setSelectedQuote(quote)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedQuote(null)
  }

  const StatCard = ({ title, value, color = 'primary' }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: `${color}.main`,
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const QuoteCard = ({ quote }: { quote: Quote }) => {
    const StatusIcon = statusIcons[quote.status]
    const statusColor = statusColors[quote.status]

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Quote #{quote.id}
                </Typography>
                <Chip
                  icon={<StatusIcon />}
                  label={quote.status}
                  size="small"
                  color={statusColor}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {quote.notes}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
              >
                View
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, quote)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(quote.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Quote amount
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Request #{quote.service_request_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Service request
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Provider #{quote.provider_id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Service provider
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(quote.valid_until)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Valid until
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {getInitials('Provider Name')}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Provider Name
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  provider@email.com
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Chip
                label={formatDate(quote.created_at)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Quotes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage service quotes and pricing
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<DollarIcon />}>
            New Quote
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Pending" value={quoteStats.pending} color="warning" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Accepted" value={quoteStats.accepted} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Rejected" value={quoteStats.rejected} color="error" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Expired" value={quoteStats.expired} color="default" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
                sx={{ height: 56 }}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quotes List */}
      {filteredQuotes.length > 0 ? (
        <Stack spacing={2}>
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </Stack>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <DollarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No quotes found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Quotes will appear here when providers submit them.'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quote Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Quote
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Quote
        </MenuItem>
      </Menu>
    </Box>
  )
}
