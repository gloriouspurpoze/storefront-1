import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Megaphone } from 'lucide-react'
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

const toc = [
  { id: 'map', label: 'Area map' },
  { id: 'structure', label: 'Website structure' },
  { id: 'surfaces', label: 'Surfaces & campaigns' },
  { id: 'editorial', label: 'Editorial & proof' },
  { id: 'catalog-seo', label: 'Catalog landing & SEO' },
  { id: 'workspace', label: 'Marketing workspace' },
  { id: 'workflows', label: 'Suggested workflows' },
  { id: 'access', label: 'Access & safety' },
] as const

function GuideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </Link>
  )
}

export function ContentMarketingGuide() {
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
          title="Content & marketing — knowledge kit"
          subtitle="What each admin screen controls, where customers see it, and how CMS, sliders, growth tools, and the marketing workspace fit together for one tenant."
          icon={<Megaphone className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">On this page</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-primary hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card id="map">
        <CardHeader>
          <CardTitle className="text-base">Area map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Start from <GuideLink to="/cms">CMS overview</GuideLink> for every public-site building block. Use{' '}
            <GuideLink to="/marketing">Marketing workspace</GuideLink> for planning calendars, campaign notes, and
            organic social drafts (workspace data is primarily local in the browser until backend APIs are connected).
          </p>
          <p>
            Sliders and CMS banners (carousels + hero / pop-ups) live in one workspace:{' '}
            <GuideLink to="/sliders">Sliders &amp; site banners</GuideLink>
            <span className="text-muted-foreground"> (second tab). Old URL </span>
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/cms/banners</code>
            <span className="text-muted-foreground"> redirects there.</span> Coupons and referrals sit under{' '}
            <GuideLink to="/coupons">Coupons</GuideLink> and <GuideLink to="/referrals">Referrals</GuideLink> with their
            own permissions.
          </p>
        </CardContent>
      </Card>

      <Card id="structure">
        <CardHeader>
          <CardTitle className="text-base">Website structure</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Screen</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Customer impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/homepage">Homepage</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Sections above the fold: hero, featured modules, and ordered blocks visitors see first.
                </TableCell>
                <TableCell className="align-top text-sm">Defines first impression and primary calls to action.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/site-appearance">Site appearance</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Design tokens: colors, typography, radius, spacing for the public storefront theme.
                </TableCell>
                <TableCell className="align-top text-sm">Keeps brand consistent across pages without editing each page.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/pages">Pages</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Static routes: legal, policies, landing copy not tied to the blog engine.
                </TableCell>
                <TableCell className="align-top text-sm">Published URLs for compliance and evergreen content.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/menus">Menus</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Header, footer, and app navigation trees linking to pages and external URLs.
                </TableCell>
                <TableCell className="align-top text-sm">Controls discoverability of services, blog, and support links.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/media">Media library</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Central store for uploads reused by sliders, blog covers, and rich text embeds.
                </TableCell>
                <TableCell className="align-top text-sm">Faster publishing and fewer broken image links.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card id="surfaces">
        <CardHeader>
          <CardTitle className="text-base">Surfaces & campaigns</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Screen</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Customer impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/sliders">Sliders &amp; site banners</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Tab 1: carousel slides (sliders API). Tab 2: CMS banners — hero, bars, modals, timed announcements,
                  optional product targets. <span className="text-foreground/80">/cms/banners</span> redirects to the
                  banners tab.
                </TableCell>
                <TableCell className="align-top text-sm">
                  High-visibility promotions; interruptive surfaces — schedule carefully to avoid fatigue.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/promotions">Promotions</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Scheduled offer copy and campaign messaging aligned with catalog or checkout.
                </TableCell>
                <TableCell className="align-top text-sm">Surfaces discounts and bundles consistently with legal copy.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/coupons">Coupons</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Codes, redemption limits, eligibility rules, and stacking policy.
                </TableCell>
                <TableCell className="align-top text-sm">Directly changes cart totals when validated at checkout.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/referrals">Referrals</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Refer-a-friend rewards and tracking for growth loops.
                </TableCell>
                <TableCell className="align-top text-sm">Incentivizes sharing; ensure reward rules match finance policy.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card id="editorial">
        <CardHeader>
          <CardTitle className="text-base">Editorial & social proof</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Screen</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Customer impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/blogs">Blog posts</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Long-form articles, SEO copy, and guides with publish dates and authors.
                </TableCell>
                <TableCell className="align-top text-sm">Organic traffic and education; pairs with blog categories.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/blog-categories">Blog categories</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Taxonomy and URL segments for grouping posts.
                </TableCell>
                <TableCell className="align-top text-sm">Cleaner navigation and topic clusters for SEO.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/newsletter">Newsletter</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Subscriber lists and broadcast touchpoints managed from admin.
                </TableCell>
                <TableCell className="align-top text-sm">Retention channel; align sign-up placement with privacy policy.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/email-templates">Email templates</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Transactional HTML for bookings, invoices, invites — preview before wide rollout.
                </TableCell>
                <TableCell className="align-top text-sm">Affects clarity of operational emails, not only marketing.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/social-links">Social links</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Official profiles surfaced in header/footer.
                </TableCell>
                <TableCell className="align-top text-sm">Trust signal and secondary acquisition paths.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/testimonials">Testimonials</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Curated quotes and case blurbs you choose to display.
                </TableCell>
                <TableCell className="align-top text-sm">Controlled social proof versus raw reviews.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/reviews">Reviews (CMS)</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Moderation and presentation of booking or category feedback on the site.
                </TableCell>
                <TableCell className="align-top text-sm">Balances authenticity with brand-safe display rules.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium">
                  <GuideLink to="/cms/faqs">FAQs</GuideLink>
                </TableCell>
                <TableCell className="align-top text-sm text-muted-foreground">
                  Structured Q&amp;A for support deflection and rich results.
                </TableCell>
                <TableCell className="align-top text-sm">Reduces tickets when kept in sync with real policies.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card id="catalog-seo">
        <CardHeader>
          <CardTitle className="text-base">Catalog landing pages &amp; SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The <GuideLink to="/cms/category-marketing">Industry service pages</GuideLink> hub ties one catalog key
            (vertical) to marketing copy, locality, rate-card lines, and internal cross-links. Use the in-page tabs:
            default landing content, <strong className="text-foreground">Service areas</strong> for hyperlocal slugs
            and sitemap visibility, <strong className="text-foreground">Rate card</strong> for indicative spare-part
            lines, and <strong className="text-foreground">Cross-linking</strong> for related problems users search.
          </p>
          <p>
            <GuideLink to="/cms/seo">SEO management</GuideLink> holds global defaults: meta templates, redirects, and
            indexation hints that apply beyond a single category page.
          </p>
        </CardContent>
      </Card>

      <Card id="workspace">
        <CardHeader>
          <CardTitle className="text-base">Marketing workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The workspace is the operational layer for the marketing team: briefs, calendars, and checklists without
            replacing the CMS publishing tools above. Open <GuideLink to="/marketing">Marketing workspace</GuideLink>{' '}
            and use the sub-navigation for:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-1">
            <li>
              <GuideLink to="/marketing/campaigns">Campaigns</GuideLink> — program status, owners, and launch KPIs.
            </li>
            <li>
              <GuideLink to="/marketing/calendar">Content calendar</GuideLink> — editorial schedule alongside product
              launches.
            </li>
            <li>
              <GuideLink to="/marketing/social">Social posts</GuideLink> — drafts for organic channels; pair with{' '}
              <GuideLink to="/marketing/live-publish">Live publish</GuideLink> settings when connecting accounts.
            </li>
            <li>
              <GuideLink to="/marketing/planning">Planning &amp; ideas</GuideLink> — backlog and idea stages before
              commitment.
            </li>
            <li>
              <GuideLink to="/marketing/tasks">Marketing tasks</GuideLink> — execution checklist per initiative.
            </li>
            <li>
              <GuideLink to="/marketing/lab">R&amp;D &amp; brainstorm</GuideLink> — experiments and hypotheses not yet
              in the calendar.
            </li>
          </ul>
          <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-xs">
            Note: much of this hub persists in the browser session until dedicated APIs exist. Treat it as a team
            cockpit, not the system of record for financial promotions (those remain coupons / checkout).
          </p>
        </CardContent>
      </Card>

      <Card id="workflows">
        <CardHeader>
          <CardTitle className="text-base">Suggested workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-inside list-decimal space-y-3 pl-1">
            <li>
              <strong className="text-foreground">New vertical launch:</strong> configure industry hub tabs → add FAQs
              and blog pillar → wire menus and homepage modules → publish service areas for target cities → verify SEO
              records.
            </li>
            <li>
              <strong className="text-foreground">Seasonal sale:</strong> create promotion copy → add slider and optional
              banner → issue coupon rules → add workspace campaign + calendar slots → monitor referrals if you stack a
              share incentive.
            </li>
            <li>
              <strong className="text-foreground">Trust refresh:</strong> curate testimonials → audit featured reviews →
              align FAQ with policy pages → update social links if handles changed.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card id="access">
        <CardHeader>
          <CardTitle className="text-base">Access &amp; safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            CMS routes are gated for administrators with <code className="rounded bg-muted px-1.5 py-0.5 text-xs">manage_system_settings</code>{' '}
            in this app. Coupons, referrals, and the marketing workspace use marketing-related permissions; if a tile
            is missing from <GuideLink to="/cms">CMS overview</GuideLink>, request the matching role from an owner.
          </p>
          <p>
            Prefer staging review for wide-reaching edits: site appearance, homepage order, global SEO redirects, and
            modal banners affect every visitor immediately after save.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
