'use client'

/** Default from THEME_BRIEF.yaml → data.emptyMenuMessage */
export const MENUFAST_CARDS_EMPTY_MENU_MESSAGE =
  'Menu is being updated. Please check back soon.'

export type MenuFastCardsEmptyVariant = 'global' | 'category' | 'search'

export function MenuFastCardsEmpty({
  variant,
  message = MENUFAST_CARDS_EMPTY_MENU_MESSAGE,
  onShowAll,
  onClearSearch,
}: {
  variant: MenuFastCardsEmptyVariant
  message?: string
  onShowAll?: () => void
  onClearSearch?: () => void
}) {
  const isGlobal = variant === 'global'
  const isSearch = variant === 'search'

  const copy = isGlobal
    ? message
    : isSearch
      ? 'No dishes match your search.'
      : 'No items in this category right now.'

  return (
    <div className="mf-catalog-empty" role="status">
      <p className="mf-catalog-empty-copy">{copy}</p>
      {isSearch && onClearSearch ? (
        <button type="button" className="mf-catalog-empty-btn" onClick={onClearSearch}>
          Clear search
        </button>
      ) : null}
      {!isGlobal && !isSearch && onShowAll ? (
        <button type="button" className="mf-catalog-empty-btn" onClick={onShowAll}>
          View all items
        </button>
      ) : null}
    </div>
  )
}
