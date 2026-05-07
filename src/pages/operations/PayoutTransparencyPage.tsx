import React from 'react'
import { Link } from 'react-router-dom'
import { Wallet, FileText, Landmark } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export function PayoutTransparencyPage() {
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Payouts playbook</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Explainability for finance and supply teams: how customer cash becomes pro payouts, where
          platform fee sits, and which admin surfaces to audit.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Landmark className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">Customer → platform</CardTitle>
            <CardDescription>Authorized charges, refunds, partial captures.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Start every investigation in <strong className="text-foreground">Payments</strong> then open the
            booking for operational context (services, adjustments, disputes).
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Wallet className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">Platform → professional</CardTitle>
            <CardDescription>Net of platform fee, taxes per policy, holds.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use <strong className="text-foreground">Earnings & payouts</strong> for batch posture; booking detail
            for per-job earning lines and dispute holds.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileText className="mb-2 h-6 w-6 text-primary" />
            <CardTitle className="text-base">GST & invoices</CardTitle>
            <CardDescription>India-ready paperwork trail.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Align invoice branding with GST numbers for B2B accounts; export ledger for filing windows from{' '}
            <strong className="text-foreground">Finance</strong> modules when enabled.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested audit checklist</CardTitle>
          <CardDescription>Use before closing month or answering a pro payout question.</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Booking status completed & payment signal matches customer bank/UPI settlement.</li>
            <li>No open earning dispute on the booking ledger row.</li>
            <li>Refund ticket (if any) resolved or explicitly excluded from payout batch.</li>
            <li>Platform fee % matches active commercial policy for that category/city.</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/payouts">Earnings & payouts</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/payments">Payments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/invoices">Invoices</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/finance/overview">Finance overview</Link>
        </Button>
      </div>
    </div>
  )
}
