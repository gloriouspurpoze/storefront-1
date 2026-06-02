/**
 * Globals that browsers ship by default but Hermes (React Native's JS engine)
 * does not. Importing this file at the top of `index.js` makes the rest of the
 * app — and any third-party library that assumes a browser-ish environment —
 * safe to use.
 */

if (typeof (globalThis as { DOMException?: unknown }).DOMException === 'undefined') {
  class DOMExceptionPolyfill extends Error {
    public readonly code: number
    constructor(message = '', name = 'Error') {
      super(message)
      this.name = name
      // Numeric DOMException codes are mostly historical; AbortError = 20.
      this.code = name === 'AbortError' ? 20 : 0
    }
  }
  ;(globalThis as { DOMException?: unknown }).DOMException = DOMExceptionPolyfill
}
