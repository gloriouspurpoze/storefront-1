/** CSS class applied on tenant root from theme marketplace key. */
export function themeRootClass(themeKey?: string): string {
  switch (themeKey) {
    case 'minimal':
      return 'theme-minimal font-sans'
    case 'warm-bistro':
      return 'theme-warm-bistro font-serif'
    case 'trade-pro':
      return 'theme-trade-pro'
    case 'luxury-retail':
      return 'theme-luxury-retail'
    case 'saffron':
      return 'theme-saffron'
    default:
      return 'theme-classic'
  }
}
