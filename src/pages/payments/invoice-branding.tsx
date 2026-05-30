import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Palette, RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { appToast } from '../../lib/appToast'
import {
  type InvoiceBranding,
  fileToLogoDataUrl,
  loadInvoiceBranding,
  saveInvoiceBranding,
  DEFAULT_INVOICE_BRANDING,
} from '../../lib/invoiceBranding'
import { InvoicePreviewPanel } from './InvoicePreviewPanel'
import { computeInvoiceFromLines, isInterStateForPreview } from './invoicePreviewData'
import type { ManualInvoiceLineItem } from '../../services/api/invoices.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Separator } from '../../components/ui/separator'
import { HStack, VStack } from '../../components/ui/spacing'

const COMPANY_STATE = (process.env.REACT_APP_INVOICE_COMPANY_STATE || '').trim() || 'Maharashtra'

const SAMPLE_ITEMS: ManualInvoiceLineItem[] = [
  {
    description: 'Site visit & labour (sample)',
    quantity: 2,
    unitPrice: 1850,
    lineKind: 'service',
    category: 'electrical',
  },
  {
    description: 'Materials / consumables',
    quantity: 1,
    unitPrice: 640,
    lineKind: 'product',
    category: 'hardware',
  },
]

function parseAddressBlock(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function InvoiceBrandingPage() {
  const [draft, setDraft] = useState<InvoiceBranding>(() => loadInvoiceBranding())
  const [addressText, setAddressText] = useState(() => loadInvoiceBranding().supplierAddressLines.join('\n'))

  const previewComputed = useMemo(
    () => computeInvoiceFromLines(SAMPLE_ITEMS, 150, { applyGst: true, gstRate: 18 }),
    []
  )
  const sampleBilling = useMemo(
    () => ({
      name: 'Sample Customer Pvt Ltd',
      lines: ['402 Blue Tower', 'BKC', 'Mumbai'],
      phone: '+91 98765 43210',
      email: 'accounts@example.com',
      gstin: '27AAAAA0000A1Z5',
      state: 'Maharashtra',
    }),
    []
  )

  const isInter = isInterStateForPreview(sampleBilling.state, COMPANY_STATE)

  const patch = (p: Partial<InvoiceBranding>) => setDraft((d) => ({ ...d, ...p }))

  const handleSave = () => {
    const next: InvoiceBranding = {
      ...draft,
      supplierAddressLines: parseAddressBlock(addressText),
    }
    saveInvoiceBranding(next)
    setDraft(loadInvoiceBranding())
    appToast('Invoice appearance saved. Previews use these settings on this device.', 'success')
  }

  const handleReset = () => {
    saveInvoiceBranding(DEFAULT_INVOICE_BRANDING)
    const d = loadInvoiceBranding()
    setDraft(d)
    setAddressText(d.supplierAddressLines.join('\n'))
    appToast('Reset to defaults', 'info')
  }

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const dataUrl = await fileToLogoDataUrl(f)
      patch({ logoDataUrl: dataUrl })
      appToast('Logo updated', 'success')
    } catch (err: unknown) {
      appToast(err instanceof Error ? err.message : 'Could not load logo', 'error')
    }
  }

  const brandingForPreview: InvoiceBranding = {
    ...draft,
    supplierAddressLines: parseAddressBlock(addressText),
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Invoice appearance"
        subtitle="Logo, brand colours, and supplier details shown on the in-app invoice preview. PDFs from the server still use backend company config unless your API is extended to accept this profile."
        icon={<Palette className="h-9 w-9" />}
        action={
          <HStack className="flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Invoices
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/invoices/create">Create invoice</Link>
            </Button>
          </HStack>
        }
      />

      <div
        className="mb-6 rounded-md border border-primary/20 bg-primary-soft p-4 text-sm text-primary dark:border-primary dark:bg-primary/40 dark:text-primary-deep"
        role="status"
      >
        Settings are stored in this browser (<strong>localStorage</strong>). For multi-admin teams, mirror the same values in
        Settings → General or add an API field later. Exported PDFs typically require matching fields in fixer-backend{' '}
        <code className="rounded bg-white/60 px-1 dark:bg-black/20">PDFService</code> / company model.
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <VStack className="gap-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-bold">Logo</p>
                <VStack className="gap-4">
                  <div className="flex items-center gap-2">
                    <Switch id="showLogo" checked={draft.showLogo} onCheckedChange={(v) => patch({ showLogo: !!v })} />
                    <Label htmlFor="showLogo">Show logo on preview</Label>
                  </div>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      Upload logo (PNG / JPG / SVG)
                      <input type="file" accept="image/*" className="sr-only" onChange={onLogoFile} />
                    </label>
                  </Button>
                  {draft.logoDataUrl && (
                    <Button variant="ghost" size="sm" className="w-fit" type="button" onClick={() => patch({ logoDataUrl: null })}>
                      Remove logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Max ~450 KB. Wide logos work best (≤180×56 px display).</p>
                </VStack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-bold">Colours</p>
                <HStack className="mb-2 flex-wrap gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      className="h-10 w-28 cursor-pointer"
                      value={draft.primaryColor}
                      onChange={(e) => patch({ primaryColor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent (totals)</Label>
                    <Input
                      id="accentColor"
                      type="color"
                      className="h-10 w-28 cursor-pointer"
                      value={draft.accentColor}
                      onChange={(e) => patch({ accentColor: e.target.value })}
                    />
                  </div>
                </HStack>
                <div className="space-y-2">
                  <Label htmlFor="primaryHex">Primary (hex)</Label>
                  <Input
                    id="primaryHex"
                    value={draft.primaryColor}
                    onChange={(e) => patch({ primaryColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentHex">Accent (hex)</Label>
                  <Input
                    id="accentHex"
                    value={draft.accentColor}
                    onChange={(e) => patch({ accentColor: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-bold">Document & company</p>
                <VStack className="gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentTitle">Document title</Label>
                    <Input
                      id="documentTitle"
                      value={draft.documentTitle}
                      onChange={(e) => patch({ documentTitle: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">e.g. TAX INVOICE, PROFORMA INVOICE</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyDisplayName">Display name</Label>
                    <Input
                      id="companyDisplayName"
                      value={draft.companyDisplayName}
                      onChange={(e) => patch({ companyDisplayName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyLegalName">Legal name (optional)</Label>
                    <Input
                      id="companyLegalName"
                      value={draft.companyLegalName}
                      onChange={(e) => patch({ companyLegalName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline (optional)</Label>
                    <Input id="tagline" value={draft.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
                  </div>
                </VStack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-bold">Supplier block (Bill from)</p>
                <VStack className="gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      rows={4}
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">One line per row — printed under company name</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierPhone">Phone</Label>
                    <Input
                      id="supplierPhone"
                      value={draft.supplierPhone}
                      onChange={(e) => patch({ supplierPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierEmail">Email</Label>
                    <Input
                      id="supplierEmail"
                      value={draft.supplierEmail}
                      onChange={(e) => patch({ supplierEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierWebsite">Website</Label>
                    <Input
                      id="supplierWebsite"
                      value={draft.supplierWebsite}
                      onChange={(e) => patch({ supplierWebsite: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierGstin">GSTIN</Label>
                    <Input
                      id="supplierGstin"
                      value={draft.supplierGstin}
                      onChange={(e) => patch({ supplierGstin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierPan">PAN (optional)</Label>
                    <Input
                      id="supplierPan"
                      value={draft.supplierPan}
                      onChange={(e) => patch({ supplierPan: e.target.value })}
                    />
                  </div>
                </VStack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="font-bold">Footer & banking</p>
                <VStack className="gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="footerNote">Footer note</Label>
                    <Textarea
                      id="footerNote"
                      rows={3}
                      value={draft.footerNote}
                      onChange={(e) => patch({ footerNote: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankDetails">Bank / UPI details (optional)</Label>
                    <Textarea
                      id="bankDetails"
                      rows={3}
                      value={draft.bankDetails}
                      onChange={(e) => patch({ bankDetails: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Shown in supplier panel — IBAN, IFSC, UPI ID, etc.</p>
                  </div>
                </VStack>
              </CardContent>
            </Card>

            <HStack className="flex-wrap gap-2">
              <Button type="button" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save appearance
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset defaults
              </Button>
            </HStack>
          </VStack>
        </div>

        <div className="lg:col-span-7">
          <p className="mb-1 text-sm font-medium text-muted-foreground">Live preview (sample customer & lines)</p>
          <Separator className="mb-4" />
          <InvoicePreviewPanel
            branding={brandingForPreview}
            documentTypeLabel="Service & goods"
            customerMode="platform"
            customerReference="PO-2026-0142"
            billingName={sampleBilling.name}
            billingAddressLines={sampleBilling.lines}
            billingPhone={sampleBilling.phone}
            billingEmail={sampleBilling.email}
            billingGstin={sampleBilling.gstin}
            lineRows={previewComputed.lines}
            subtotal={previewComputed.subtotal}
            totalTax={previewComputed.totalTax}
            discount={previewComputed.discount}
            grandTotal={previewComputed.grandTotal}
            isInterState={isInter}
            placeOfSupply={sampleBilling.state}
            paymentMethod="UPI / Bank transfer"
            notes="Sample remarks — GST 18% per line."
            companyStateLabel={COMPANY_STATE}
            mode="proforma"
          />
        </div>
      </div>
    </div>
  )
}

export default InvoiceBrandingPage
