'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '../../components/ui'
import type { Order, OrderCarrier } from '../../services/api/orders.service'
import { OrdersService } from '../../services/api/orders.service'
import { ORDER_CARRIER_OPTIONS } from '../../lib/carrierTracking'
import { appToast } from '../../lib/appToast'

export interface BulkShipDialogProps {
  open: boolean
  orders: Order[]
  onClose: () => void
  onDone: () => void
}

export function BulkShipDialog({ open, orders, onClose, onDone }: BulkShipDialogProps) {
  const [carrier, setCarrier] = useState<OrderCarrier | ''>('delhivery')
  const [trackingById, setTrackingById] = useState<Record<string, string>>({})
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [acting, setActing] = useState(false)

  const shippable = orders.filter((o) => o.status === 'processing')

  const submit = async () => {
    if (!shippable.length) {
      appToast('No processing orders selected', 'warning')
      return
    }

    const missing = shippable.filter((o) => !(trackingById[o.id]?.trim() || o.trackingNumber?.trim()))
    if (missing.length) {
      appToast(`Enter tracking for ${missing.length} order(s) before shipping`, 'error')
      return
    }

    setActing(true)
    try {
      const res = await OrdersService.bulkShipOrders({
        notifyCustomer,
        items: shippable.map((o) => ({
          orderId: o.id,
          carrier: carrier || undefined,
          trackingNumber: (trackingById[o.id] || o.trackingNumber || '').trim(),
        })),
      })

      if (res.success && res.data) {
        const { updated, failed } = res.data
        if (updated.length) appToast(`Shipped ${updated.length} order(s)`, 'success')
        if (failed.length) {
          appToast(`${failed.length} failed: ${failed[0]?.reason}`, 'warning')
        }
        onDone()
        onClose()
      } else {
        appToast('Bulk ship failed', 'error')
      }
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Bulk ship failed', 'error')
    } finally {
      setActing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !acting && !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk ship orders</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Mark {shippable.length} processing order(s) as shipped. Customers can receive email when
          notified.
        </p>

        <div>
          <Label className="mb-1">Carrier (all)</Label>
          <Select value={carrier || undefined} onValueChange={(v) => setCarrier(v as OrderCarrier)}>
            <SelectTrigger>
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_CARRIER_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ul className="max-h-48 space-y-3 overflow-y-auto rounded-md border border-border p-3">
          {shippable.map((o) => (
            <li key={o.id}>
              <p className="text-xs font-semibold">{o.orderNumber}</p>
              <Input
                className="mt-1 font-mono text-sm"
                placeholder="AWB / tracking number"
                value={trackingById[o.id] ?? o.trackingNumber ?? ''}
                onChange={(e) =>
                  setTrackingById((prev) => ({ ...prev, [o.id]: e.target.value }))
                }
              />
            </li>
          ))}
        </ul>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={notifyCustomer} onCheckedChange={(v) => setNotifyCustomer(v === true)} />
          Email customers tracking info
        </label>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={acting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={acting || !shippable.length}>
            Ship {shippable.length} order(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
