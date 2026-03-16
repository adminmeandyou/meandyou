'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AppHeaderContextType {
  modeSelector: ReactNode
  setModeSelector: (node: ReactNode) => void
}

const AppHeaderContext = createContext<AppHeaderContextType>({
  modeSelector: null,
  setModeSelector: () => {},
})

export function AppHeaderProvider({ children }: { children: ReactNode }) {
  const [modeSelector, setModeSelectorState] = useState<ReactNode>(null)
  const setModeSelector = useCallback((node: ReactNode) => {
    setModeSelectorState(node)
  }, [])

  return (
    <AppHeaderContext.Provider value={{ modeSelector, setModeSelector }}>
      {children}
    </AppHeaderContext.Provider>
  )
}

export function useAppHeader() {
  return useContext(AppHeaderContext)
}
