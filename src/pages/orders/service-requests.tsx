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
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  AttachMoney as DollarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material'
import staticData from '../../data/staticData.json'
import { ServiceRequest } from '../../types'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'

const urgencyColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  emergency: 'error',
} as const

const statusColors = {
  open: 'default',
  quoted: 'info',
  booked: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
} as const

export function ServiceRequests() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [serviceRequests] = useState<ServiceRequest[]>(staticData.serviceRequests)

  const theme = useTheme()

  const filteredRequests = serviceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.location.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus
    const matchesUrgency = selectedUrgency === 'all' || request.urgency === selectedUrgency
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const requestStats = {
    open: serviceRequests.filter(r => r.status === 'open').length,
    quoted: serviceRequests.filter(r => r.status === 'quoted').length,
    booked: serviceRequests.filter(r => r.status === 'booked').length,
    in_progress: serviceRequests.filter(r => r.status === 'in_progress').length,
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

  const RequestCard = ({ request }: { request: ServiceRequest }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {request.title}
              </Typography>
              <Chip
                label={request.urgency}
                size="small"
                color={urgencyColors[request.urgency]}
                sx={{ textTransform: 'capitalize' }}
              />
              <Chip
                label={request.status.replace('_', ' ')}
                size="small"
                color={statusColors[request.status]}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {request.description}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
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
              startIcon={<MessageIcon />}
            >
              Quote
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {request.location.city}, {request.location.state}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {request.location.address}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DollarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCurrency(request.budget_min)} - {formatCurrency(request.budget_max)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Budget range
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(request.preferred_date)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Preferred date
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(request.created_at)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {getInitials('Customer Name')}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Customer Name
              </Typography>
              <Typography variant="caption" color="text.secondary">
                customer@email.com
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${request.quotes_count} quotes`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={request.service_type}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Service Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track customer service requests
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<CalendarIcon />}>
            Schedule
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Open Requests" value={requestStats.open} color="default" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Quoted" value={requestStats.quoted} color="info" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Booked" value={requestStats.booked} color="success" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="In Progress" value={requestStats.in_progress} color="warning" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search requests..."
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
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="quoted">Quoted</MenuItem>
                  <MenuItem value="booked">Booked</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={selectedUrgency}
                  label="Urgency"
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                >
                  <MenuItem value="all">All Urgency</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
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

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <Stack spacing={2}>
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </Stack>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No service requests found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || selectedStatus !== 'all' || selectedUrgency !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Service requests will appear here when customers submit them.'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}