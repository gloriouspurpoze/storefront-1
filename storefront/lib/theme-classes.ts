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
    case 'menufast-minimal':
      return 'theme-menufast-minimal'
    case 'menufast-cards':
      return 'theme-menufast-cards'
    case 'soft-studio':
      return 'theme-soft-studio'
    case 'luxe-essence':
      return 'theme-luxe-essence'
    case 'private-thebrownbutter':
      return 'theme-brown-butter'
    default:
      return 'theme-classic'
  }
}
