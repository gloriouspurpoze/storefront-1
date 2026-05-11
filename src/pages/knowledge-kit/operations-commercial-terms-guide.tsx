import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BadgePercent, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/common'
import { Button } from '../../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export function OperationsCommercialTermsGuide() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 gap-1 text-muted-foreground">
          <Link to="/knowledge-kit">
            <ArrowLeft className="h-4 w-4" />
            Knowledge kit
          </Link>
        </Button>
        <PageHeader
          title="Commercial terms — how it works"
          subtitle="Single source of truth per tenant (or global when no tenant row). Saved values drive platform fee math in the backend; customer and provider surfaces consume them through bookings, POS, and payouts."
          icon={<BadgePercent className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where to edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Admin UI:{' '}
            <Link
              to="/operations/commercial/terms"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Operations → Fees & cities → Fees & commissions
              <ExternalLink className="h-3 w-3" />
            </Link>
          </p>
          <p className="text-xs">
            API: <code className="rounded bg-muted px-1.5 py-0.5">GET/PATCH /api/operations-commercial/terms</code>{' '}
            (requires <code className="rounded bg-muted px-1">view_operating_terms</code> /{' '}
            <code className="rounded bg-muted px-1">manage_operating_terms</code>). Public checkout disclosure (when
            enabled) uses <code className="rounded bg-muted px-1.5 py-0.5">GET /api/public/commerce/checkout-terms</code>{' '}
            — no admin token; optional <code className="rounded bg-muted px-1">X-Tenant-Id</code> for SaaS.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Field reference</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Field</TableHead>
                <TableHead>What it does</TableHead>
                <TableHead>Customer site</TableHead>
                <TableHead>Provider / professional</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium">Currency</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  ISO code for reporting and labels (e.g. INR). Stored on the commercial terms document.
                </TableCell>
                <TableCell className="align-top text-sm">Shown in fee copy where the storefront formats money.</TableCell>
                <TableCell className="align-top text-sm">Same code in partner-facing statements when surfaced.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Convenience fee %</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Percent of the <strong className="text-foreground">merchandise subtotal after discounts</strong> used
                  in strict POS / checkout pricing paths.
                </TableCell>
                <TableCell className="align-top text-sm">
                  Can increase “taxes and fees” / platform line on checkout or POS when that flow validates{' '}
                  <code className="rounded bg-muted px-1 text-xs">posPricing</code>.
                </TableCell>
                <TableCell className="align-top text-sm">
                  Does not change partner’s list rates; affects what the customer pays when the fee is passed through.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Convenience fee (flat)</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Fixed amount added after the %-based part; still subject to minimum fee floor.
                </TableCell>
                <TableCell className="align-top text-sm">Raises total due on applicable checkouts.</TableCell>
                <TableCell className="align-top text-sm">Indirect via customer invoice / booking total.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Training fee / pro</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Internal / onboarding economics field. Not the same as per-partner commission on Edit Professional.
                </TableCell>
                <TableCell className="align-top text-sm">Usually not shown on B2C checkout unless you build a flow.</TableCell>
                <TableCell className="align-top text-sm">Use for finance tracking of onboarding charges.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Provider commission %</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Tenant-level platform retain on payout-related calculations (policy varies by product).
                </TableCell>
                <TableCell className="align-top text-sm">Typically invisible; affects net price to partner after platform take.</TableCell>
                <TableCell className="align-top text-sm">
                  Partner app earnings / wallet logic may use this or the <strong className="text-foreground">per-pro</strong>{' '}
                  override on Edit Professional.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Payment processing %</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Pass-through model for gateway cost; documentation / POS may reference it.
                </TableCell>
                <TableCell className="align-top text-sm">May appear in “payment processing” disclosures.</TableCell>
                <TableCell className="align-top text-sm">Rarely shown to pros unless you expose fee breakdowns.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Minimum platform fee</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Floor for the computed convenience fee (before GST on fee).
                </TableCell>
                <TableCell className="align-top text-sm">Small jobs pay at least this platform line (when fee path runs).</TableCell>
                <TableCell className="align-top text-sm">Ensures platform revenue on low-ticket work.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">GST % on fee lines</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Applied to the platform convenience fee amount; 0 = treat fee line as exempt in the calculator.
                </TableCell>
                <TableCell className="align-top text-sm">Adds GST component next to platform fee on compliant checkouts.</TableCell>
                <TableCell className="align-top text-sm">Shown on invoices where fee GST is broken out.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">After-hours uplift %</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Hint for peak / night pricing; POS or catalog rules may consume separately.
                </TableCell>
                <TableCell className="align-top text-sm">May affect quoted slot price if wired into pricing engines.</TableCell>
                <TableCell className="align-top text-sm">Professionals may see higher job value for peak slots.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">Internal notes</TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">Admin-only; not sent to public checkout API.</TableCell>
                <TableCell className="align-top text-sm">Never shown to customers.</TableCell>
                <TableCell className="align-top text-sm">Never shown to providers.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base text-amber-950 dark:text-amber-100">Saving terms (PATCH)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-950/90 dark:text-amber-50/90">
          <p>
            If you previously saw <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/60">currency</code>{' '}
            conflict errors on save, that was a MongoDB upsert rule: the same field cannot appear in both{' '}
            <code className="rounded bg-amber-100/80 px-1">$set</code> and <code className="rounded bg-amber-100/80 px-1">$setOnInsert</code>.
            The backend now merges defaults on insert only for keys you are not updating.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
