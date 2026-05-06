import { store } from '../../store'
import { apiClient } from '../apiClient'
import {
  DEFAULT_PUBLIC_SITE_THEME,
  type PublicSiteThemeTokens,
} from '../../types/publicSiteTheme.types'

const STORAGE_PREFIX = 'fixer.publicSiteTheme.v1'

function storageKey(): string {
  const tenantId = store.getState().tenant?.tenantId ?? null
  return `${STORAGE_PREFIX}.${tenantId || 'global'}`
}

function mergeTheme(partial: Partial<PublicSiteThemeTokens> | null | undefined): PublicSiteThemeTokens {
  return { ...DEFAULT_PUBLIC_SITE_THEME, ...(partial || {}) }
}

/**
 * Backend contract (optional): GET/PUT `/cms/public-site-theme` with body `{ data: PublicSiteThemeTokens }`
 * or raw tokens object. If unavailable, persists in localStorage per tenant.
 */
class PublicSiteThemeService {
  async getTheme(): Promise<{ theme: PublicSiteThemeTokens; source: 'api' | 'local' | 'default' }> {
    try {
      const res = (await apiClient.get<unknown>('/cms/public-site-theme', {
        showLoading: false,
        showErrorToast: false,
        showSuccessToast: false,
      })) as Record<string, unknown>

      const raw =
        (res?.data as Partial<PublicSiteThemeTokens> | undefined) ||
        (res?.theme as Partial<PublicSiteThemeTokens> | undefined) ||
        (typeof res === 'object' &&
        res &&
        'primaryColor' in res &&
        typeof (res as { primaryColor?: unknown }).primaryColor === 'string'
          ? (res as Partial<PublicSiteThemeTokens>)
          : null)

      if (raw && typeof raw.primaryColor === 'string') {
        return { theme: mergeTheme(raw), source: 'api' }
      }
    } catch {
      /* fall through */
    }

    try {
      const raw = window.localStorage.getItem(storageKey())
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PublicSiteThemeTokens>
        return { theme: mergeTheme(parsed), source: 'local' }
      }
    } catch {
      /* ignore */
    }

    return { theme: { ...DEFAULT_PUBLIC_SITE_THEME }, source: 'default' }
  }

  async saveTheme(theme: PublicSiteThemeTokens): Promise<{ ok: boolean; source: 'api' | 'local'; error?: string }> {
    const merged = mergeTheme(theme)
    try {
      await apiClient.put(
        '/cms/public-site-theme',
        { data: merged },
        {
          showLoading: true,
          loadingMessage: 'Saving theme…',
          showSuccessToast: false,
          showErrorToast: false,
        },
      )
      return { ok: true, source: 'api' }
    } catch (e) {
      try {
        window.localStorage.setItem(storageKey(), JSON.stringify(merged))
        return { ok: true, source: 'local', error: e instanceof Error ? e.message : 'API unavailable; saved locally' }
      } catch (storeErr) {
        return {
          ok: false,
          source: 'local',
          error: storeErr instanceof Error ? storeErr.message : 'Could not save',
        }
      }
    }
  }
}

export const publicSiteThemeService = new PublicSiteThemeService()
