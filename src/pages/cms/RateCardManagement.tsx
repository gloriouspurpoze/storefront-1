import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CircleDollarSign, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import { CMS_DEFAULT_FALLBACK_SLUG } from '../../constants/cmsCatalogCategories'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { usePermissions } from '../../hooks/usePermissions'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'
import { cn } from '../../lib/utils'

interface RateCardPart {
  name: string
  price: string
}

export type RateCardDataset = 'customer' | 'provider'

export interface RateCardManagementProps {
  /** `customer` — published catalog matrix; `provider` — internal partner playbook blob. */
  dataset?: RateCardDataset
  pageTitle?: string
  pageSubtitle?: string
}

export default function RateCardManagement({
  dataset = 'customer',
  pageTitle,
  pageSubtitle,
}: RateCardManagementProps) {
  const { checkPermission } = usePermissions()
  const canMutate = checkPermission('manage_rate_cards') || checkPermission('edit_settings')
  const industryHub = useIndustryServicePagesCatalog()
  const { options: catalogOptions, loading: catalogOptionsLoading, defaultSlug, getLabel } =
    useCmsCatalogCategories()
  const confirm = useAppConfirm()
  const [data, setData] = useState<Record<string, RateCardPart[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [standaloneCategory, setStandaloneCategory] = useState<string>('')
  const selectedCategory: string =
    industryHub?.catalogKey ?? (standaloneCategory || defaultSlug) ?? CMS_DEFAULT_FALLBACK_SLUG
  const setSelectedCategory = (v: string) => {
    if (industryHub) industryHub.setCatalogKey(v)
    else setStandaloneCategory(v)
  }
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formPart, setFormPart] = useState<RateCardPart>({ name: '', price: '' })

  useEffect(() => {
    fetchData()
  }, [dataset])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result =
        dataset === 'provider' ? await CMSService.getProviderRateCards() : await CMSService.getRateCards()
      setData(typeof result === 'object' && result !== null ? result : {})
    } catch (error: any) {
      console.error('Error fetching rate cards:', error)
      const msg = error.response?.data?.error || error.message || 'Failed to load rate cards'
      appToast('Error: ' + msg, 'error')
      setData({})
    } finally {
      setLoading(false)
    }
  }

  const parts = data[selectedCategory] ?? []

  const handleSaveAll = async () => {
    if (!canMutate) return
    try {
      setSaving(true)
      if (dataset === 'provider') {
        await CMSService.updateProviderRateCards(data)
      } else {
        await CMSService.updateRateCards(data)
      }
      appToast('Rate cards saved successfully.', 'success')
      fetchData()
    } catch (error: any) {
      console.error('Error saving rate cards:', error)
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPart = () => {
    if (!canMutate) return
    if (!formPart.name.trim()) {
      appToast('Part name is required.', 'warning')
      return
    }
    const next = [...parts, { name: formPart.name.trim(), price: formPart.price.trim() || 'As per rate card' }]
    setData((prev) => ({ ...prev, [selectedCategory]: next }))
    setFormPart({ name: '', price: '' })
    setShowForm(false)
  }

  const handleEditPart = (index: number) => {
    setEditingIndex(index)
    setFormPart(parts[index])
    setShowForm(true)
  }

  const handleUpdatePart = () => {
    if (!canMutate) return
    if (editingIndex === null || !formPart.name.trim()) return
    const next = [...parts]
    next[editingIndex] = { name: formPart.name.trim(), price: formPart.price.trim() || 'As per rate card' }
    setData((prev) => ({ ...prev, [selectedCategory]: next }))
    setFormPart({ name: '', price: '' })
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleDeletePart = async (index: number) => {
    if (!canMutate) return
    const ok = await confirm({
      title: 'Remove line?',
      message: 'Remove this rate card line?',
      danger: true,
      confirmLabel: 'Remove',
    })
    if (!ok) return
    const next = parts.filter((_: RateCardPart, i: number) => i !== index)
    setData((prev) => ({ ...prev, [selectedCategory]: next.length ? next : [] }))
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingIndex(null)
    setFormPart({ name: '', price: '' })
  }

  const resolvedTitle =
    pageTitle ??
    (dataset === 'provider' ? 'Provider rate playbook' : 'Rate Card (Pricing Parts)')
  const resolvedSubtitle =
    pageSubtitle ??
    (dataset === 'provider'
      ? 'Internal payout, visit, and spare-economics lines by catalog category — not published to consumers.'
      : 'Category-wise spare parts & pricing for catalog PricingTable')

  return (
    <div className={cn(!industryHub && 'p-4 sm:p-6 md:p-8')}>
      {!industryHub && (
        <PageHeader
          title={resolvedTitle}
          subtitle={resolvedSubtitle}
          action={
            canMutate ? (
              <Button
                onClick={() => {
                  setEditingIndex(null)
                  setFormPart({ name: '', price: '' })
                  setShowForm(true)
                }}
                className="rounded-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add line
              </Button>
            ) : undefined
          }
        />
      )}

      {!canMutate && !industryHub && (
        <p className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          View-only: assign <strong className="font-medium text-foreground">manage_rate_cards</strong> or{' '}
          <strong className="font-medium text-foreground">edit_settings</strong> to edit.
        </p>
      )}

      {industryHub && canMutate && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={() => {
              setEditingIndex(null)
              setFormPart({ name: '', price: '' })
              setShowForm(true)
            }}
            className="rounded-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add line
          </Button>
        </div>
      )}

      {!industryHub && (
        <Card className="mb-4 rounded-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate-cat">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={catalogOptionsLoading || catalogOptions.length === 0}
                >
                  <SelectTrigger id="rate-cat" className="w-[200px] rounded-md">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleSaveAll}
                disabled={saving || !canMutate}
                className="mt-0 self-end sm:mt-auto"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
                {saving ? 'Saving…' : 'Save all'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {industryHub && canMutate && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" onClick={handleSaveAll} disabled={saving} className="rounded-md">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
            {saving ? 'Saving…' : 'Save rate card'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="rounded-md">
          <CardContent className="p-4">
            <h2 className="mb-4 text-base font-semibold">
              Parts for “{getLabel(selectedCategory)}”
            </h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="font-semibold">Part / Service</TableHead>
                    <TableHead className="font-semibold">
                      {dataset === 'provider' ? 'Reference (payout / charge)' : 'Published price'}
                    </TableHead>
                    {canMutate ? <TableHead className="text-right font-semibold">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canMutate ? 3 : 2}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {dataset === 'provider'
                          ? 'No partner lines yet — add visit splits, spare margins, or SLA notes.'
                          : 'No lines. Add one to show in catalog.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((row: RateCardPart, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        {canMutate ? (
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => handleEditPart(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              title="Delete"
                              onClick={() => handleDeletePart(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={(o) => !o && handleCloseForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit line' : 'Add line'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="part-name">Part / Service name</Label>
              <Input
                id="part-name"
                value={formPart.name}
                onChange={(e) => setFormPart((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Gas charging (R32/R410A)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="part-price">Price</Label>
              <Input
                id="part-price"
                value={formPart.price}
                onChange={(e) => setFormPart((p) => ({ ...p, price: e.target.value }))}
                placeholder={
                  dataset === 'provider'
                    ? 'e.g. ₹450–₹650 visit share or 62% of spare margin'
                    : 'e.g. ₹2,499 onwards or As per capacity'
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={editingIndex !== null ? handleUpdatePart : handleAddPart}
              disabled={!formPart.name.trim()}
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
