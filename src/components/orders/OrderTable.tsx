import React from 'react'
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Printer,
} from 'lucide-react'
import { formatCurrency, cn } from '../../lib/utils'
import { useMediaQuery, muiMdUp } from '../../hooks/useMediaQuery'
import { Order, OrderStatus } from '../../types'
import { StatusBadge } from '../common/StatusBadge'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface OrderTableProps {
  orders: Order[]
  onViewOrder: (order: Order) => void
  onEditOrder: (order: Order) => void
  onDeleteOrder: (order: Order) => void
  onPrintOrder: (order: Order) => void
  loading?: boolean
}

function getCustomerTypeClass(type: string) {
  switch (type) {
    case 'Pro Customer':
      return 'text-storm-deep'
    case 'VIP Customer':
      return 'text-bloom-coral'
    default:
      return 'text-muted-foreground'
  }
}

function OrderRowMenu({ order, onViewOrder, onEditOrder, onDeleteOrder, onPrintOrder }: {
  order: Order
  onViewOrder: (order: Order) => void
  onEditOrder: (order: Order) => void
  onDeleteOrder: (order: Order) => void
  onPrintOrder: (order: Order) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewOrder(order)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditOrder(order)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Order
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPrintOrder(order)}>
          <Printer className="mr-2 h-4 w-4" />
          Print Order
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDeleteOrder(order)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onPrintOrder,
  loading: _loading = false,
}) => {
  void _loading
  const isMobile = !useMediaQuery(muiMdUp)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="rounded-lg">
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    {order.product.image && <AvatarImage src={order.product.image} alt="" />}
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{order.product.name}</p>
                    <p className="text-xs text-muted-foreground">{order.product.type}</p>
                  </div>
                </div>
                <StatusBadge status={order.status as OrderStatus} />
              </div>
              <div className="mb-3 flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="text-sm font-semibold">{order.order_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">{formatCurrency(order.amount)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {order.customer.avatar && <AvatarImage src={order.customer.avatar} alt="" />}
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{order.customer.name}</p>
                    <p className={cn('text-xs', getCustomerTypeClass(order.customer.type))}>
                      {order.customer.type}
                    </p>
                  </div>
                </div>
                <OrderRowMenu
                  order={order}
                  onViewOrder={onViewOrder}
                  onEditOrder={onEditOrder}
                  onDeleteOrder={onDeleteOrder}
                  onPrintOrder={onPrintOrder}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Product Name</TableHead>
            <TableHead className="font-semibold">Customer Name</TableHead>
            <TableHead className="font-semibold">Order Id</TableHead>
            <TableHead className="font-semibold">Amount</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-center font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {order.product.image && <AvatarImage src={order.product.image} alt="" />}
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{order.product.name}</p>
                    <p className="text-xs text-muted-foreground">{order.product.type}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {order.customer.avatar && <AvatarImage src={order.customer.avatar} alt="" />}
                    <AvatarFallback>C</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{order.customer.name}</p>
                    <p className={cn('text-xs', getCustomerTypeClass(order.customer.type))}>
                      {order.customer.type}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm font-semibold">{order.order_id}</p>
                <p className="text-xs text-muted-foreground">{formatDate(order.order_date)}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm font-semibold">{formatCurrency(order.amount)}</p>
                <p className="text-xs text-muted-foreground">{order.payment_method}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status as OrderStatus} />
              </TableCell>
              <TableCell className="text-center">
                <OrderRowMenu
                  order={order}
                  onViewOrder={onViewOrder}
                  onEditOrder={onEditOrder}
                  onDeleteOrder={onDeleteOrder}
                  onPrintOrder={onPrintOrder}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
