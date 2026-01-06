import React, { createContext, useContext, ReactNode } from 'react'
import staticData from '../data/staticData.json'
import { StaticData } from '../types'

interface DataContextType {
  data: StaticData
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  return (
    <DataContext.Provider value={{ data: staticData as StaticData }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
