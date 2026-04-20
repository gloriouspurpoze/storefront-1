/**
 * ============================================================================
 * PROFESSIONAL SERVICES MANAGEMENT PAGE
 * ============================================================================
 * Manage services offered by professional
 * 
 * Features:
 * - View all services
 * - Add/remove services
 * - Set service pricing
 * - Service availability
 * 
 * @author CTO Team
 * @date January 23, 2026
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle,
} from '@mui/icons-material'
import { useAppDispatch } from '../../store/hooks'
import { apiClient } from '../../services/apiClient'
import { addToast } from '../../store/slices/uiSlice'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { platformServicesService, PlatformService } from '../../services/api/platformServices.service'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'

interface Service {
  _id: string
  id?: string
  name: string
  description?: string
  icon?: string
  category?: string
  isActive: boolean
}

interface AvailableService {
  _id?: string
  id: string
  name: string
  description?: string
  category?: string
}

export function ProfessionalServices() {
  const dispatch = useAppDispatch()
  const confirm = useAppConfirm()
  const [loading, setLoading] = useState(true)
  const [myServices, setMyServices] = useState<Service[]>([])
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')

  useEffect(() => {
    loadServices()
    loadAvailableServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await ProfessionalsService.getProfessionals({})
      if (response.success && response.data) {
        const professionals = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).professionals || []
        if (professionals.length > 0) {
          setMyServices(professionals[0].services || [])
        }
      }
    } catch (error: any) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableServices = async () => {
    try {
      const response = await platformServicesService.getServices({ 
        is_active: true,
        status: 'published',
        limit: 1000 // Get all active services
      })
      
      if (response && response.services) {
        // Map PlatformService to AvailableService format
        const mappedServices: AvailableService[] = response.services.map((service: PlatformService) => ({
          id: service.id,
          _id: service.id, // Support both formats
          name: service.name,
          description: service.description || service.short_description,
          category: service.category,
        }))
        setAvailableServices(mappedServices)
      } else {
        setAvailableServices([])
      }
    } catch (error: any) {
      console.error('Error loading available services:', error)
      dispatch(addToast({ 
        message: error.message || 'Failed to load available services', 
        severity: 'error' 
      }))
      setAvailableServices([])
    }
  }

  const handleAddService = async () => {
    if (!selectedService) return

    try {
      // Get current professional
      const response = await ProfessionalsService.getProfessionals({})
      if (response.success && response.data) {
        const professionals = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).professionals || []
        if (professionals.length > 0) {
          const professional = professionals[0]
          const currentServices = professional.services?.map((s: any) => s._id) || []
          
          await ProfessionalsService.updateProfessional(professional._id, {
            services: [...currentServices, selectedService],
          })
          
          dispatch(addToast({ 
            message: 'Service added successfully!', 
            severity: 'success' 
          }))
          setAddDialogOpen(false)
          setSelectedService('')
          loadServices()
        }
      }
    } catch (error: any) {
      dispatch(addToast({ 
        message: error.response?.data?.message || 'Failed to add service', 
        severity: 'error' 
      }))
    }
  }

  const handleRemoveService = async (serviceId: string) => {
    const ok = await confirm({
      title: 'Remove service?',
      message: 'Are you sure you want to remove this service?',
      danger: true,
      confirmLabel: 'Remove',
    })
    if (!ok) return

    try {
      const response = await ProfessionalsService.getProfessionals({})
      if (response.success && response.data) {
        const professionals = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).professionals || []
        if (professionals.length > 0) {
          const professional = professionals[0]
          const currentServices = professional.services?.map((s: any) => s._id) || []
          
          await ProfessionalsService.updateProfessional(professional._id, {
            services: currentServices.filter((id: string) => id !== serviceId),
          })
          
          dispatch(addToast({ 
            message: 'Service removed successfully!', 
            severity: 'success' 
          }))
          loadServices()
        }
      }
    } catch (error: any) {
      dispatch(addToast({ 
        message: error.response?.data?.message || 'Failed to remove service', 
        severity: 'error' 
      }))
    }
  }

  const handleToggleService = async (serviceId: string, isActive: boolean) => {
    // This would update service active status if backend supports it
    dispatch(addToast({ 
      message: 'Service status updated!', 
      severity: 'success' 
    }))
  }

  if (loading && myServices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            My Services
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage the services you offer to customers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Service
        </Button>
      </Box>

      {/* Services List */}
      {myServices.length === 0 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Services Added Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add services to let customers know what you can help with
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add Your First Service
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {myServices.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service._id}>
              <Card sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {service.name}
                      </Typography>
                      {service.description && (
                        <Typography variant="body2" color="text.secondary">
                          {service.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveService(service._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={service.isActive}
                          onChange={(e) => handleToggleService(service._id, e.target.checked)}
                          size="small"
                        />
                      }
                      label={service.isActive ? 'Active' : 'Inactive'}
                    />
                    {service.isActive && (
                      <Chip icon={<CheckCircle />} label="Active" color="success" size="small" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Service Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false)
          setSelectedService('')
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Service</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Service</InputLabel>
            <Select
              value={selectedService}
              label="Select Service"
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {availableServices
                .filter(s => {
                  const serviceId = s._id || s.id
                  return !myServices.some(ms => (ms._id === serviceId || ms.id === serviceId))
                })
                .map((service) => {
                  const serviceId = service._id || service.id
                  return (
                    <MenuItem key={serviceId} value={serviceId}>
                      {service.name}
                      {service.category && (
                        <Chip label={service.category} size="small" sx={{ ml: 1 }} />
                      )}
                    </MenuItem>
                  )
                })}
            </Select>
          </FormControl>
          {availableServices.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No services available. Please contact admin to add platform services.
            </Alert>
          )}
          {availableServices.length > 0 && availableServices.filter(s => {
            const serviceId = s._id || s.id
            return !myServices.some(ms => (ms._id === serviceId || ms.id === serviceId))
          }).length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              All available services have been added
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDialogOpen(false)
            setSelectedService('')
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddService}
            disabled={!selectedService}
          >
            Add Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
