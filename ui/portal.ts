/**
 * Overlay portal target: the tenant wrapper from `app/sites/[tenantId]/layout.tsx`
 * so portaled drawers/modals inherit its brand vars, theme class and fonts.
 */
export function portalRoot(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-tenant]') ?? document.body
}
