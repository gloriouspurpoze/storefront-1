import type { ThemedAccountKey } from '@/lib/account-themes'

export type AccountThemeClasses = {
  backLink: string
  contentWrap: string
  card: string
  title: string
  subtitle: string
  text: string
  textMuted: string
  link: string
  signupRow: string
  error: string
  btnPrimary: string
  btnSecondary: string
  btnBlock: string
  btnGoogle: string
  divider: string
  phoneRow: string
  phonePrefix: string
  emptyState: string
  emptyTitle: string
  orderList: string
  orderCard: string
  orderCardExpanded: string
  orderMeta: string
  orderItems: string
  orderTrackLink: string
  trackingPanel: string
  trackingResult: string
  trackingCompactInner: string
  trackingEyebrow: string
  trackingStatusTitle: string
  trackingOrderNum: string
  statusBadge: string
  statusBadgeDelivered: string
  statusBadgeShipped: string
  statusBadgeCancelled: string
  statusBadgeDefault: string
  trackingDl: string
  trackingRow: string
  trackingDt: string
  trackingDd: string
  trackingCarrierLink: string
  trackingCarrierBtn: string
  trackingHistory: string
  trackingHistoryItem: string
  trackingHistoryStatus: string
  trackingHistoryDate: string
  signedInNote: string
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
  contentWrap: 'mx-auto w-full max-w-md',
  card: 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8',
  title: 'text-2xl font-semibold tracking-tight text-neutral-900',
  subtitle: 'mt-2 text-sm text-neutral-500',
  text: 'text-sm text-neutral-600',
  textMuted: 'text-sm text-neutral-500',
  link: 'font-medium text-neutral-900 underline-offset-2 hover:underline',
  signupRow: 'mt-3 text-sm text-neutral-600',
  error: 'mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
  btnPrimary:
    'inline-flex rounded-xl bg-[var(--site-brand,#171717)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60',
  btnSecondary:
    'inline-flex rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50',
  btnBlock: 'w-full justify-center',
  btnGoogle:
    'mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60',
  divider: 'my-6 flex items-center gap-3',
  phoneRow: 'mt-1.5 flex gap-2',
  phonePrefix:
    'inline-flex items-center rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600',
  emptyState: 'rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center',
  emptyTitle: 'font-medium text-neutral-800',
  orderList: 'space-y-4',
  orderCard:
    'w-full rounded-2xl border border-neutral-200 bg-white p-5 mb-4 text-left shadow-sm transition hover:border-neutral-300',
  orderCardExpanded: 'border-neutral-400 ring-2 ring-neutral-200',
  orderMeta: 'mt-0.5 text-sm text-neutral-500',
  orderItems: 'mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm text-neutral-600',
  orderTrackLink: 'mt-4 inline-flex text-sm font-medium text-neutral-900 underline underline-offset-2',
  trackingPanel: 'mb-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4',
  trackingResult: 'rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm',
  trackingCompactInner: 'space-y-4',
  trackingEyebrow: 'text-xs font-semibold uppercase tracking-wide text-neutral-500',
  trackingStatusTitle: 'text-2xl font-bold text-neutral-900',
  trackingOrderNum: 'mt-1 font-mono text-sm text-neutral-600',
  statusBadge: 'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
  statusBadgeDelivered: 'bg-emerald-100 text-emerald-800',
  statusBadgeShipped: 'bg-blue-100 text-blue-800',
  statusBadgeCancelled: 'bg-red-100 text-red-800',
  statusBadgeDefault: 'bg-neutral-100 text-neutral-700',
  trackingDl: 'space-y-3 text-sm',
  trackingRow: 'flex justify-between gap-4',
  trackingDt: 'text-neutral-500',
  trackingDd: 'font-medium text-neutral-900',
  trackingCarrierLink: 'inline-flex text-sm font-medium text-neutral-900 underline underline-offset-2',
  trackingCarrierBtn:
    'mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white',
  trackingHistory: 'mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm',
  trackingHistoryItem: 'flex justify-between gap-2',
  trackingHistoryStatus: 'text-neutral-800',
  trackingHistoryDate: 'text-neutral-500',
  signedInNote: 'rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600',
  statusLoading: 'text-sm text-neutral-500',
  pageTitle: 'text-2xl font-semibold tracking-tight text-neutral-900',
  pageSubtitle: 'mt-1 text-sm text-neutral-500',
  form: 'space-y-4',
  input: 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2',
  label: 'block text-sm font-medium text-slate-700',
  trackFooter: 'mt-8 text-center text-sm text-slate-500',
  trackFooterLink: 'font-medium text-indigo-600 hover:underline',
}

const BB: Partial<AccountThemeClasses> = {
  backLink: 'bb-acct-back',
  contentWrap: 'bb-acct-content',
  card: 'bb-acct-card',
  title: 'bb-acct-title',
  subtitle: 'bb-acct-subtitle',
  text: 'bb-acct-text',
  textMuted: 'bb-acct-muted',
  link: 'bb-acct-link',
  signupRow: 'bb-acct-signup-row',
  error: 'bb-acct-error',
  btnPrimary: 'bb-acct-btn bb-acct-btn--primary',
  btnSecondary: 'bb-acct-btn bb-acct-btn--secondary',
  btnBlock: 'bb-acct-btn--block',
  btnGoogle: 'bb-acct-btn bb-acct-btn--google',
  divider: 'bb-acct-divider',
  phoneRow: 'bb-acct-phone-row',
  phonePrefix: 'bb-acct-phone-prefix',
  emptyState: 'bb-acct-empty',
  emptyTitle: 'bb-acct-empty-title',
  orderList: 'bb-acct-order-list',
  orderCard: 'bb-acct-order',
  orderCardExpanded: 'bb-acct-order--expanded',
  orderMeta: 'bb-acct-order-meta',
  orderItems: 'bb-acct-order-items',
  orderTrackLink: 'bb-acct-order-track',
  trackingPanel: 'bb-acct-tracking',
  trackingResult: 'bb-acct-tracking-result',
  trackingCompactInner: 'bb-acct-tracking-inner',
  trackingEyebrow: 'bb-acct-tracking-eyebrow',
  trackingStatusTitle: 'bb-acct-tracking-status-title',
  trackingOrderNum: 'bb-acct-tracking-order-num',
  statusBadge: 'bb-acct-order-status',
  statusBadgeDelivered: 'bb-acct-order-status--delivered',
  statusBadgeShipped: 'bb-acct-order-status--shipped',
  statusBadgeCancelled: 'bb-acct-order-status--cancelled',
  statusBadgeDefault: '',
  trackingDl: 'bb-acct-tracking-dl',
  trackingRow: 'bb-acct-tracking-row',
  trackingDt: 'bb-acct-tracking-dt',
  trackingDd: 'bb-acct-tracking-dd',
  trackingCarrierLink: 'bb-acct-order-track',
  trackingCarrierBtn: 'bb-acct-btn bb-acct-btn--primary bb-acct-btn--block bb-acct-tracking-carrier-btn',
  trackingHistory: 'bb-acct-tracking-history',
  trackingHistoryItem: 'bb-acct-tracking-history-item',
  trackingHistoryStatus: 'bb-acct-tracking-history-status',
  trackingHistoryDate: 'bb-acct-tracking-history-date',
  signedInNote: 'bb-acct-signed-in-note',
  statusLoading: 'bb-acct-muted',
  pageTitle: 'bb-acct-page-title',
  pageSubtitle: 'bb-acct-page-sub',
  form: 'bb-acct-form',
  input: 'bb-acct-input',
  label: 'bb-acct-label',
  trackFooter: 'bb-acct-track-footer',
  trackFooterLink: 'bb-acct-link',
}

const LE: Partial<AccountThemeClasses> = {
  backLink: 'le-acct-back',
  contentWrap: 'le-acct-content',
  card: 'le-acct-card',
  title: 'le-acct-title',
  subtitle: 'le-acct-subtitle',
  text: 'le-acct-text',
  textMuted: 'le-acct-muted',
  link: 'le-acct-link',
  signupRow: 'le-acct-signup-row',
  error: 'le-acct-error',
  btnPrimary: 'le-acct-btn le-acct-btn--primary',
  btnSecondary: 'le-acct-btn le-acct-btn--secondary',
  btnBlock: 'le-acct-btn--block',
  btnGoogle: 'le-acct-btn le-acct-btn--google',
  divider: 'le-acct-divider',
  phoneRow: 'le-acct-phone-row',
  phonePrefix: 'le-acct-phone-prefix',
  emptyState: 'le-acct-empty',
  emptyTitle: 'le-acct-empty-title',
  orderList: 'le-acct-order-list',
  orderCard: 'le-acct-order',
  orderCardExpanded: 'le-acct-order--expanded',
  orderMeta: 'le-acct-order-meta',
  orderItems: 'le-acct-order-items',
  orderTrackLink: 'le-acct-order-track',
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

const SS: Partial<AccountThemeClasses> = {
  backLink: 'ss-acct-back',
  contentWrap: 'ss-acct-content',
  card: 'ss-acct-card',
  title: 'ss-acct-title',
  subtitle: 'ss-acct-subtitle',
  text: 'ss-acct-text',
  textMuted: 'ss-acct-muted',
  link: 'ss-acct-link',
  signupRow: 'ss-acct-signup-row',
  error: 'ss-acct-error',
  btnPrimary: 'ss-acct-btn ss-acct-btn--primary',
  btnSecondary: 'ss-acct-btn ss-acct-btn--secondary',
  btnBlock: 'ss-acct-btn--block',
  btnGoogle: 'ss-acct-btn ss-acct-btn--google',
  divider: 'ss-acct-divider',
  phoneRow: 'ss-acct-phone-row',
  phonePrefix: 'ss-acct-phone-prefix',
  emptyState: 'ss-acct-empty',
  emptyTitle: 'ss-acct-empty-title',
  orderList: 'ss-acct-order-list',
  orderCard: 'ss-acct-order',
  orderCardExpanded: 'ss-acct-order--expanded',
  orderMeta: 'ss-acct-order-meta',
  orderItems: 'ss-acct-order-items',
  orderTrackLink: 'ss-acct-order-track',
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

const SAF: Partial<AccountThemeClasses> = {
  backLink: 'saf-acct-back saf-acct-muted',
  contentWrap: 'saf-acct-content',
  card: 'saf-acct-card',
  title: 'saf-acct-title',
  subtitle: 'saf-acct-subtitle',
  text: 'saf-acct-text',
  textMuted: 'saf-acct-muted',
  link: 'saf-acct-link',
  signupRow: 'saf-acct-text',
  error: 'saf-acct-error',
  btnPrimary: 'saf-acct-btn saf-acct-btn--primary',
  btnSecondary: 'saf-acct-btn saf-acct-btn--secondary',
  btnBlock: 'saf-acct-btn--block',
  btnGoogle: 'saf-acct-btn saf-acct-btn--google',
  divider: 'saf-acct-divider',
  phoneRow: 'saf-acct-phone-row',
  phonePrefix: 'saf-acct-phone-prefix',
  emptyState: 'saf-acct-empty',
  emptyTitle: 'saf-acct-empty-title',
  orderList: 'saf-acct-order-list',
  orderCard: 'saf-acct-order',
  orderCardExpanded: 'saf-acct-order--expanded',
  orderMeta: 'saf-acct-order-meta',
  orderItems: 'saf-acct-order-items',
  orderTrackLink: 'saf-acct-link',
  trackingPanel: 'saf-acct-tracking',
  statusLoading: 'saf-acct-muted',
  pageTitle: 'saf-acct-page-title',
  pageSubtitle: 'saf-acct-page-sub',
  form: 'saf-acct-card saf-acct-form',
  input: 'saf-acct-input',
  label: 'saf-acct-label',
  trackFooter: 'saf-acct-track-footer',
  trackFooterLink: 'saf-acct-link',
}

const MF: Partial<AccountThemeClasses> = {
  backLink: 'mf-acct-muted',
  contentWrap: 'mf-acct-content',
  card: 'mf-acct-card',
  title: 'mf-acct-title',
  subtitle: 'mf-acct-subtitle',
  text: 'mf-acct-text',
  textMuted: 'mf-acct-muted',
  link: 'mf-acct-link',
  signupRow: 'mf-acct-text',
  error: 'mf-acct-error',
  btnPrimary: 'mf-acct-btn mf-acct-btn--primary',
  btnSecondary: 'mf-acct-btn mf-acct-btn--secondary',
  btnBlock: 'mf-acct-btn--block',
  btnGoogle: 'mf-acct-btn mf-acct-btn--google',
  divider: 'mf-acct-divider',
  phoneRow: 'mf-acct-phone-row',
  phonePrefix: 'mf-acct-phone-prefix',
  emptyState: 'mf-acct-empty',
  emptyTitle: 'mf-acct-empty-title',
  orderList: 'mf-acct-order-list',
  orderCard: 'mf-acct-order',
  orderCardExpanded: 'mf-acct-order--expanded',
  orderMeta: 'mf-acct-order-meta',
  orderItems: 'mf-acct-order-items',
  orderTrackLink: 'mf-acct-link',
  trackingPanel: 'mf-acct-tracking',
  statusLoading: 'mf-acct-muted',
  pageTitle: 'mf-acct-page-title',
  pageSubtitle: 'mf-acct-page-sub',
  form: 'mf-acct-card mf-acct-form',
  input: 'mf-acct-input',
  label: 'mf-acct-label',
  trackFooter: 'mf-acct-track-footer',
  trackFooterLink: 'mf-acct-link',
}

export function accountThemeClasses(themeKey?: ThemedAccountKey): AccountThemeClasses {
  switch (themeKey) {
    case 'private-thebrownbutter':
      return { ...DEFAULT, ...BB }
    case 'luxe-essence':
      return { ...DEFAULT, ...LE }
    case 'soft-studio':
      return { ...DEFAULT, ...SS }
    case 'saffron':
      return { ...DEFAULT, ...SAF }
    case 'menufast-minimal':
    case 'menufast-cards':
      return { ...DEFAULT, ...MF }
    default:
      return DEFAULT
  }
}
