import React, { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PageHeader } from '../../components/common/PageHeader'
import { CMSService } from '../../services/api'
import { CMS_DEFAULT_FALLBACK_SLUG } from '../../constants/cmsCatalogCategories'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { appToast } from '../../lib/appToast'
import { cn } from '../../lib/utils'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'

export default function CrossLinkingManagement() {
  const industryHub = useIndustryServicePagesCatalog()
  const { options: catalogOptions, loading: catalogOptionsLoading, defaultSlug, getLabel } =
    useCmsCatalogCategories()
  const [data, setData] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [standaloneCategory, setStandaloneCategory] = useState<string>('')
  const selectedCategory: string =
    industryHub?.catalogKey ?? (standaloneCategory || defaultSlug) ?? CMS_DEFAULT_FALLBACK_SLUG
  const setSelectedCategory = (v: string) => {
    if (industryHub) industryHub.setCatalogKey(v)
    else setStandaloneCategory(v)
  }
  const [newProblem, setNewProblem] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await CMSService.getCrossLinking()
      setData(typeof result === 'object' && result !== null ? result : {})
    } catch (error: any) {
      console.error('Error fetching cross-linking:', error)
      const msg = error.response?.data?.error || error.message || 'Failed to load'
      appToast('Error: ' + msg, 'error')
      setData({})
    } finally {
      setLoading(false)
    }
  }

  const problems = data[selectedCategory] ?? []

  const handleSave = async () => {
    try {
      setSaving(true)
      await CMSService.updateCrossLinking(data)
      appToast('Cross-linking saved.', 'success')
      fetchData()
    } catch (error: any) {
      appToast('Error: ' + (error.response?.data?.error || 'Failed to save'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const addProblem = () => {
    const text = newProblem.trim()
    if (!text) return
    const next = [...problems, text]
    setData((prev) => ({ ...prev, [selectedCategory]: next }))
    setNewProblem('')
  }

  const removeProblem = (index: number) => {
    const next = problems.filter((_: string, i: number) => i !== index)
    setData((prev) => ({ ...prev, [selectedCategory]: next }))
  }

  return (
    <div className={cn(!industryHub && 'p-4 sm:p-6 md:p-8')}>
      {!industryHub && (
        <PageHeader
          title="Cross-Linking (Common Problems)"
          subtitle="Common problems per category for SEO and catalog cross-linking block"
          action={
            <Button onClick={handleSave} disabled={saving} className="rounded-md">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          }
        />
      )}

      {industryHub && (
        <div className="mb-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="rounded-md">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            {saving ? 'Saving…' : 'Save cross-links'}
          </Button>
        </div>
      )}

      {!industryHub && (
        <Card className="mb-4 rounded-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="space-y-2">
                <Label htmlFor="cat-select">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={catalogOptionsLoading || catalogOptions.length === 0}
                >
                  <SelectTrigger id="cat-select" className="w-[200px] rounded-md">
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
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="rounded-md">
          <CardContent className="p-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Common problems we fix — “
              {getLabel(selectedCategory)}”
            </p>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="new-problem">New problem</Label>
                <Input
                  id="new-problem"
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addProblem()
                    }
                  }}
                  placeholder="e.g. AC Not Cooling properly"
                />
              </div>
              <Button onClick={addProblem} disabled={!newProblem.trim()} className="shrink-0 sm:mb-0.5">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <ul
              className={cn(
                'divide-y rounded-md border border-border bg-muted/30',
                problems.length === 0 && 'p-3'
              )}
            >
              {problems.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No problems added. Add items to show in catalog cross-linking block.
                </li>
              ) : (
                problems.map((text: string, index: number) => (
                  <li key={index} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="text-sm">{text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      title="Remove"
                      onClick={() => removeProblem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
            <Button variant="outline" onClick={handleSave} disabled={saving} className="mt-4">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
