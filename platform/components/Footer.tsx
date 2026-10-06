import { MARKETING_VERTICALS } from '@profixer/marketing-data'
import { PLATFORM_BRAND, PLATFORM_CONTACT_EMAIL, SIGN_IN_URL, signupUrl } from '../config'
import { AttributionLink } from './AttributionLink'
import { BrandLink } from './Brand'
import { Container } from './Section'

export function Footer() {
  return (
    <footer className="border-t border-tq-line bg-tq-wash">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLink />
          <p className="mt-3 max-w-xs text-sm text-tq-muted">
            Bookings, orders, CRM, storefront and team for growing businesses — in one workspace.
          </p>
        </div>
        <nav aria-label="Industries">
          <p className="text-sm font-semibold text-tq-ink">Industries</p>
          <ul className="mt-3 space-y-2 text-sm text-tq-muted">
            {MARKETING_VERTICALS.map((v) => (
              <li key={v.key}>
                <a href={`/${v.marketingSlug}`} className="hover:text-tq-ink">
                  {v.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Product">
          <p className="text-sm font-semibold text-tq-ink">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-tq-muted">
            <li>
              <a href="/#features" className="hover:text-tq-ink">Features</a>
            </li>
            <li>
              <a href="/pricing" className="hover:text-tq-ink">Pricing</a>
            </li>
            <li>
              <a href="/blog" className="hover:text-tq-ink">Blog</a>
            </li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-sm font-semibold text-tq-ink">Get started</p>
          <ul className="mt-3 space-y-2 text-sm text-tq-muted">
            <li>
              <AttributionLink href={signupUrl()} className="hover:text-tq-ink">Start free trial</AttributionLink>
            </li>
            <li>
              <AttributionLink href={SIGN_IN_URL} className="hover:text-tq-ink">Sign in</AttributionLink>
            </li>
            <li>
              <a href={`mailto:${PLATFORM_CONTACT_EMAIL}`} className="hover:text-tq-ink">{PLATFORM_CONTACT_EMAIL}</a>
            </li>
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-tq-line py-6 text-sm text-tq-muted">
        © {new Date().getFullYear()} {PLATFORM_BRAND}
      </Container>
    </footer>
  )
}
