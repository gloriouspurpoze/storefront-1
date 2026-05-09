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
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'
import { cn } from '../../lib/utils'

interface RateCardPart {
  name: string
  price: string
}

export default function RateCardManagement() {
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
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await CMSService.getRateCards()
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
    try {
      setSaving(true)
      await CMSService.updateRateCards(data)
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
    if (editingIndex === null || !formPart.name.trim()) return
    const next = [...parts]
    next[editingIndex] = { name: formPart.name.trim(), price: formPart.price.trim() || 'As per rate card' }
    setData((prev) => ({ ...prev, [selectedCategory]: next }))
    setFormPart({ name: '', price: '' })
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleDeletePart = async (index: number) => {
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

  return (
    <div className={cn(!industryHub && 'p-4 sm:p-6 md:p-8')}>
      {!industryHub && (
        <PageHeader
          title="Rate Card (Pricing Parts)"
          subtitle="Category-wise spare parts & pricing for catalog PricingTable"
          action={
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
          }
        />
      )}

      {industryHub && (
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
              <Button variant="outline" onClick={handleSaveAll} disabled={saving} className="mt-0 self-end sm:mt-auto">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
                {saving ? 'Saving…' : 'Save all'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {industryHub && (
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
                    <TableHead className="font-semibold">Price</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                        No lines. Add one to show in catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    parts.map((row: RateCardPart, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.price}</TableCell>
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
                placeholder="e.g. ₹2,499 onwards or As per capacity"
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
