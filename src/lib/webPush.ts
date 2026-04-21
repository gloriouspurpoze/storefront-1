/**
 * Web Push `applicationServerKey` must be a `BufferSource` (browser-specific; Chrome expects uint8).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    out[i] = raw.charCodeAt(i)
  }
  return out
}
