import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  pill?: boolean
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  block,
  pill,
  className,
}: Pick<CommonProps, 'variant' | 'size' | 'block' | 'pill'> & { className?: string }): string {
  return cx(
    'sf-btn',
    variant !== 'primary' && `sf-btn--${variant}`,
    size !== 'md' && `sf-btn--${size}`,
    block && 'sf-btn--block',
    pill && 'sf-btn--pill',
    className,
  )
}

function Inner({ loading, iconLeft, iconRight, children }: CommonProps & { children?: ReactNode }) {
  return (
    <>
      {loading ? null : iconLeft /* spinner comes from .sf-btn[aria-busy] in ui.css */}
      <span className="sf-btn__label">{children}</span>
      {iconRight}
    </>
  )
}

export function Button({
  variant,
  size,
  block,
  pill,
  loading,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, block, pill, className })}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Inner loading={loading} iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </Inner>
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  block,
  pill,
  iconLeft,
  iconRight,
  className,
  children,
  href,
  ...rest
}: Omit<CommonProps, 'loading'> & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block, pill, className })} {...rest}>
      <Inner iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </Inner>
    </Link>
  )
}

export function IconButton({
  label,
  count,
  solid,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; count?: number; solid?: boolean }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('sf-icon-btn', solid && 'sf-icon-btn--solid', className)}
      {...rest}
    >
      {children}
      {count ? (
        <span key={count} className="sf-icon-btn__count" aria-hidden>
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )
}
