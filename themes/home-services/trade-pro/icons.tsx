/** Small inline icon set for the Trade Pro theme — no icon package dependency. */

type IconProps = { className?: string }

function base(children: React.ReactNode, className?: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'h-5 w-5'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function PhoneIcon({ className }: IconProps) {
  return base(
    <path d="M4.5 4h3.6l1.4 4.2-2 1.6a12.3 12.3 0 0 0 5.7 5.7l1.6-2 4.2 1.4v3.6a1.6 1.6 0 0 1-1.7 1.6C10.6 19.6 4.4 13.4 3 6.1A1.6 1.6 0 0 1 4.5 4Z" />,
    className,
  )
}

export function CheckIcon({ className }: IconProps) {
  return base(<polyline points="5 12.5 9.5 17 19 6.5" />, className)
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className ?? 'h-4 w-4'} fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77 4.8 17.5l.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return base(
    <path d="M12 3.5l7 2.6v5.4c0 4.6-3 8.2-7 9-4-.8-7-4.4-7-9V6.1l7-2.6Zm-1.7 9.6 4.9-5-.1 0-.1 0-4.7 4.8-2.1-2.1-1.2 1.2 3.3 3.3Z" />,
    className,
  )
}

export function ClockIcon({ className }: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
    className,
  )
}

export function MapPinIcon({ className }: IconProps) {
  return base(
    <>
      <path d="M12 21s7-6.1 7-11.6A7 7 0 0 0 5 9.4C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.4" r="2.4" />
    </>,
    className,
  )
}

export function MenuIcon({ className }: IconProps) {
  return base(
    <>
      <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
    </>,
    className,
  )
}

export function CloseIcon({ className }: IconProps) {
  return base(
    <>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </>,
    className,
  )
}

export function ArrowRightIcon({ className }: IconProps) {
  return base(
    <>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </>,
    className,
  )
}

export function BoltIcon({ className }: IconProps) {
  return base(<polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" />, className)
}

export function WrenchIcon({ className }: IconProps) {
  return base(
    <path d="M14.7 6.3a4 4 0 0 1-5.1 5.1L4 17l3 3 5.6-5.6a4 4 0 0 1 5.1-5.1l-2.6 2.6-2-2 2.6-2.6Z" />,
    className,
  )
}
