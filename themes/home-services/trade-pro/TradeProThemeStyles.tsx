/**
 * Server-side theme stylesheet entry for trade-pro.
 * Imported from the tenant layout so CSS is in the first HTML response
 * (not deferred until a client leaf that imports `./trade-pro.css` hydrates).
 */
import '../home-services-shell.css'
import './trade-pro.css'

export function TradeProThemeStyles() {
  return null
}
