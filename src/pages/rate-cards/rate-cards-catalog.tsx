import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ExternalLink } from 'lucide-react'
import { platformServicesService } from '../../services/api/platformServices.service'
import type { PlatformService } from '../../services/api/platformServices.service'
import { ProductsService } from '../../services/api/products.service'
import type { Product } from '../../types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function formatServiceMoney(s: PlatformService): string {
  if (s.service_type === 'hourly' && s.hourly_rate != null) {
    return `${inr.format(s.hourly_rate)} / hr`
  }
  if (s.service_type === 'consultation' && s.consultation_fee != null) {
    return inr.format(s.consultation_fee)
  }
  if (s.base_price != null) {
    return inr.format(s.base_price)
  }
  return '—'
}

export default function RateCardsCatalogPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [services, setServices] = useState<PlatformService[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const [svcRes, prodRes] = await Promise.all([
          platformServicesService.getServices({
            page: 1,
            limit: 80,
            sort_by: 'name',
            sort_order: 'asc',
            status: 'published',
          }),
          ProductsService.getProducts({ page: 1, limit: 60, sort_by: 'name', sort_order: 'asc' }),
        ])
        if (cancelled) return
        setServices(svcRes.services ?? [])
        if (prodRes.success && prodRes.data?.products) {
          setProducts(prodRes.data.products)
        } else {
          setProducts([])
        }
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load catalog prices')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading catalog tariffs…
        </div>
      ) : (
        <>
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Platform services</CardTitle>
              <CardDescription>
                Published jobs customers book — amounts feed quotes and POS. Edit rows in Platform services.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto rounded-md border p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Service</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold text-right">Tariff</TableHead>
                    <TableHead className="text-right font-semibold"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No published platform services found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.category}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {s.service_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatServiceMoney(s)}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`/platform-services/edit/${s.id}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Edit
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">Store products (SKUs)</CardTitle>
              <CardDescription>
                E-commerce catalogue — prices sync to cart/checkout. Edit rows under Products.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto rounded-md border p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">SKU</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold text-right">Price</TableHead>
                    <TableHead className="text-right font-semibold"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No products returned — check catalog permissions or stock filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={String(p.id)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{inr.format(Number(p.price) || 0)}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`/products/edit/${p.id}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Edit
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
