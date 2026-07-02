/** Build storefront login URL with optional return path after sign-in. */
export function buildStorefrontLoginUrl(returnPath: string, options?: { signup?: boolean }): string {
  const params = new URLSearchParams({
    returnUrl: returnPath || '/',
  })
  if (options?.signup) params.set('signup', '1')
  return `/account/login?${params.toString()}`
}

/** @deprecated Use buildStorefrontLoginUrl */
export const buildCartSignupLoginUrl = (returnPath: string) =>
  buildStorefrontLoginUrl(returnPath, { signup: true })
