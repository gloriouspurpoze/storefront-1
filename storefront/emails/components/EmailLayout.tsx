import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

const DEFAULT_BRAND_COLOR = '#FF5C00'

export interface EmailLayoutProps {
  brandName: string
  brandColor?: string
  logoUrl?: string
  previewText: string
  /** Show "Powered by Menufast" for free/local tier tenants */
  showMenufastFooter?: boolean
  children: React.ReactNode
}

export function EmailLayout({
  brandName,
  brandColor = DEFAULT_BRAND_COLOR,
  logoUrl,
  previewText,
  showMenufastFooter = true,
  children,
}: EmailLayoutProps) {
  const accent = brandColor || DEFAULT_BRAND_COLOR

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...header, borderBottomColor: accent }}>
            {logoUrl ? (
              <Img src={logoUrl} alt={brandName} width={120} height={40} style={logo} />
            ) : (
              <Heading style={{ ...brandHeading, color: accent }}>{brandName}</Heading>
            )}
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          {showMenufastFooter ? (
            <Text style={footerMuted}>Powered by Menufast</Text>
          ) : (
            <Text style={footerMuted}>{brandName}</Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

const main: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '24px 12px',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '560px',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  borderBottom: '3px solid',
  padding: '24px 32px 16px',
  textAlign: 'center',
}

const logo: React.CSSProperties = {
  display: 'inline-block',
  height: 'auto',
  maxHeight: '48px',
  objectFit: 'contain',
  width: 'auto',
}

const brandHeading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '28px',
  margin: 0,
}

const content: React.CSSProperties = {
  padding: '24px 32px 32px',
}

const hr: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '0 32px',
}

const footerMuted: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '16px 32px 24px',
  textAlign: 'center',
}
