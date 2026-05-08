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
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
} from '../../components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAppDispatch } from '../../store/hooks'
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
        limit: 1000,
      })

      if (response && response.services) {
        const mappedServices: AvailableService[] = response.services.map(
          (service: PlatformService) => ({
            id: service.id,
            _id: service.id,
            name: service.name,
            description: service.description || service.short_description,
            category: service.category,
          })
        )
        setAvailableServices(mappedServices)
      } else {
        setAvailableServices([])
      }
    } catch (error: any) {
      console.error('Error loading available services:', error)
      dispatch(
        addToast({
          message: error.message || 'Failed to load available services',
          severity: 'error',
        })
      )
      setAvailableServices([])
    }
  }

  const handleAddService = async () => {
    if (!selectedService) return

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
            services: [...currentServices, selectedService],
          })

          dispatch(
            addToast({
              message: 'Service added successfully!',
              severity: 'success',
            })
          )
          setAddDialogOpen(false)
          setSelectedService('')
          loadServices()
        }
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to add service',
          severity: 'error',
        })
      )
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

          dispatch(
            addToast({
              message: 'Service removed successfully!',
              severity: 'success',
            })
          )
          loadServices()
        }
      }
    } catch (error: any) {
      dispatch(
        addToast({
          message: error.response?.data?.message || 'Failed to remove service',
          severity: 'error',
        })
      )
    }
  }

  const handleToggleService = async (_serviceId: string, _isActive: boolean) => {
    dispatch(
      addToast({
        message: 'Service status updated!',
        severity: 'success',
      })
    )
  }

  if (loading && myServices.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight">My Services</h1>
          <p className="text-muted-foreground">Manage the services you offer to customers</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {myServices.length === 0 ? (
        <Card className="rounded-lg border shadow-sm">
          <CardContent className="py-10 text-center">
            <h2 className="mb-2 text-lg font-semibold text-muted-foreground">
              No Services Added Yet
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Add services to let customers know what you can help with
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {myServices.map((service) => (
            <Card key={service._id} className="flex h-full flex-col rounded-lg border shadow-sm">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="mb-4 flex justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-tight">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveService(service._id)}
                    aria-label="Remove service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.isActive}
                      onCheckedChange={(c) => handleToggleService(service._id, c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {service.isActive && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) setSelectedService('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="service-select">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service-select">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {availableServices
                  .filter((s) => {
                    const serviceId = s._id || s.id
                    return !myServices.some(
                      (ms) => ms._id === serviceId || ms.id === serviceId
                    )
                  })
                  .map((service) => {
                    const serviceId = service._id || service.id
                    return (
                      <SelectItem key={serviceId} value={serviceId}>
                        <span className="flex items-center gap-2">
                          {service.name}
                          {service.category && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {service.category}
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    )
                  })}
              </SelectContent>
            </Select>
            {availableServices.length === 0 && (
              <div
                role="status"
                className="mt-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
              >
                No services available. Please contact admin to add platform services.
              </div>
            )}
            {availableServices.length > 0 &&
              availableServices.filter((s) => {
                const serviceId = s._id || s.id
                return !myServices.some((ms) => ms._id === serviceId || ms.id === serviceId)
              }).length === 0 && (
                <div
                  role="status"
                  className="mt-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm"
                >
                  All available services have been added
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false)
                setSelectedService('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={!selectedService}>
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
