import type { ThemedAccountKey } from '@/lib/account-themes'

export type AccountThemeClasses = {
  backLink: string
  card: string
  title: string
  subtitle: string
  text: string
  textMuted: string
  link: string
  error: string
  btnPrimary: string
  btnSecondary: string
  btnGoogle: string
  emptyState: string
  orderCard: string
  orderCardExpanded: string
  orderMeta: string
  orderItems: string
  trackingPanel: string
  statusLoading: string
  pageTitle: string
  pageSubtitle: string
  form: string
  input: string
  label: string
  trackFooter: string
  trackFooterLink: string
}

const DEFAULT: AccountThemeClasses = {
  backLink: 'mb-8 inline-flex text-sm text-neutral-500 transition hover:text-neutral-900',
  card: 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8',
  title: 'text-2xl font-semibold tracking-tight text-neutral-900',
  subtitle: 'mt-2 text-sm text-neutral-500',
  text: 'text-sm text-neutral-600',
  textMuted: 'text-sm text-neutral-500',
  link: 'font-medium text-neutral-900 underline-offset-2 hover:underline',
  error: 'mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
  btnPrimary:
    'inline-flex rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60',
  btnSecondary:
    'inline-flex rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50',
  btnGoogle:
    'mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60',
  emptyState: 'rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center',
  orderCard:
    'w-full rounded-2xl border border-neutral-200 bg-white p-5 mb-4 text-left shadow-sm transition hover:border-neutral-300',
  orderCardExpanded: 'border-neutral-400 ring-2 ring-neutral-200',
  orderMeta: 'mt-0.5 text-sm text-neutral-500',
  orderItems: 'mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm text-neutral-600',
  trackingPanel: 'mb-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4',
  statusLoading: 'text-sm text-neutral-500',
  pageTitle: 'text-2xl font-semibold tracking-tight text-neutral-900',
  pageSubtitle: 'mt-1 text-sm text-neutral-500',
  form: 'space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm',
  input: 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2',
  label: 'block text-sm font-medium text-slate-700',
  trackFooter: 'mt-8 text-center text-sm text-slate-500',
  trackFooterLink: 'font-medium text-indigo-600 hover:underline',
}

const BB: AccountThemeClasses = {
  backLink: 'bb-acct-back',
  card: 'bb-acct-card',
  title: 'bb-acct-title',
  subtitle: 'bb-acct-subtitle',
  text: 'bb-acct-text',
  textMuted: 'bb-acct-muted',
  link: 'bb-acct-link',
  error: 'bb-acct-error',
  btnPrimary: 'bb-acct-btn bb-acct-btn--primary',
  btnSecondary: 'bb-acct-btn bb-acct-btn--secondary',
  btnGoogle: 'bb-acct-btn bb-acct-btn--google',
  emptyState: 'bb-acct-empty',
  orderCard: 'bb-acct-order',
  orderCardExpanded: 'bb-acct-order--expanded',
  orderMeta: 'bb-acct-order-meta',
  orderItems: 'bb-acct-order-items',
  trackingPanel: 'bb-acct-tracking',
  statusLoading: 'bb-acct-muted',
  pageTitle: 'bb-acct-page-title',
  pageSubtitle: 'bb-acct-page-sub',
  form: 'bb-acct-card bb-acct-form',
  input: 'bb-acct-input',
  label: 'bb-acct-label',
  trackFooter: 'bb-acct-track-footer',
  trackFooterLink: 'bb-acct-link',
}

const LE: AccountThemeClasses = {
  backLink: 'le-acct-back',
  card: 'le-acct-card',
  title: 'le-acct-title',
  subtitle: 'le-acct-subtitle',
  text: 'le-acct-text',
  textMuted: 'le-acct-muted',
  link: 'le-acct-link',
  error: 'le-acct-error',
  btnPrimary: 'le-acct-btn le-acct-btn--primary',
  btnSecondary: 'le-acct-btn le-acct-btn--secondary',
  btnGoogle: 'le-acct-btn le-acct-btn--google',
  emptyState: 'le-acct-empty',
  orderCard: 'le-acct-order',
  orderCardExpanded: 'le-acct-order--expanded',
  orderMeta: 'le-acct-order-meta',
  orderItems: 'le-acct-order-items',
  trackingPanel: 'le-acct-tracking',
  statusLoading: 'le-acct-muted',
  pageTitle: 'le-acct-page-title',
  pageSubtitle: 'le-acct-page-sub',
  form: 'le-acct-card le-acct-form',
  input: 'le-acct-input',
  label: 'le-acct-label',
  trackFooter: 'le-acct-track-footer',
  trackFooterLink: 'le-acct-link',
}

const SS: AccountThemeClasses = {
  backLink: 'ss-acct-back',
  card: 'ss-acct-card',
  title: 'ss-acct-title',
  subtitle: 'ss-acct-subtitle',
  text: 'ss-acct-text',
  textMuted: 'ss-acct-muted',
  link: 'ss-acct-link',
  error: 'ss-acct-error',
  btnPrimary: 'ss-acct-btn ss-acct-btn--primary',
  btnSecondary: 'ss-acct-btn ss-acct-btn--secondary',
  btnGoogle: 'ss-acct-btn ss-acct-btn--google',
  emptyState: 'ss-acct-empty',
  orderCard: 'ss-acct-order',
  orderCardExpanded: 'ss-acct-order--expanded',
  orderMeta: 'ss-acct-order-meta',
  orderItems: 'ss-acct-order-items',
  trackingPanel: 'ss-acct-tracking',
  statusLoading: 'ss-acct-muted',
  pageTitle: 'ss-acct-page-title',
  pageSubtitle: 'ss-acct-page-sub',
  form: 'ss-acct-card ss-acct-form',
  input: 'ss-acct-input',
  label: 'ss-acct-label',
  trackFooter: 'ss-acct-track-footer',
  trackFooterLink: 'ss-acct-link',
}

export function accountThemeClasses(themeKey?: ThemedAccountKey): AccountThemeClasses {
  switch (themeKey) {
    case 'private-thebrownbutter':
      return BB
    case 'luxe-essence':
      return LE
    case 'soft-studio':
      return SS
    default:
      return DEFAULT
  }
}
