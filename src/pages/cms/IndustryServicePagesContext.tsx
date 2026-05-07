import React, { createContext, useContext } from 'react'

export type IndustryServicePagesCatalogContextValue = {
  catalogKey: string
  setCatalogKey: (key: string) => void
}

export const IndustryServicePagesCatalogContext =
  createContext<IndustryServicePagesCatalogContextValue | null>(null)

export function useIndustryServicePagesCatalog(): IndustryServicePagesCatalogContextValue | null {
  return useContext(IndustryServicePagesCatalogContext)
}
