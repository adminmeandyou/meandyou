'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AppHeaderContextType {
  modeSelector: ReactNode
  setModeSelector: (node: ReactNode) => void
  rightActions: ReactNode
  setRightActions: (node: ReactNode) => void
  backHref: string | null
  setBackHref: (href: string | null) => void
  pageTitle: string | null
  setPageTitle: (title: string | null) => void
}

const AppHeaderContext = createContext<AppHeaderContextType>({
  modeSelector: null,
  setModeSelector: () => {},
  rightActions: null,
  setRightActions: () => {},
  backHref: null,
  setBackHref: () => {},
  pageTitle: null,
  setPageTitle: () => {},
})

export function AppHeaderProvider({ children }: { children: ReactNode }) {
  const [modeSelector, setModeSelectorState] = useState<ReactNode>(null)
  const [rightActions, setRightActionsState] = useState<ReactNode>(null)
  const [backHref, setBackHrefState] = useState<string | null>(null)
  const [pageTitle, setPageTitleState] = useState<string | null>(null)

  const setModeSelector = useCallback((node: ReactNode) => { setModeSelectorState(node) }, [])
  const setRightActions = useCallback((node: ReactNode) => { setRightActionsState(node) }, [])
  const setBackHref = useCallback((href: string | null) => { setBackHrefState(href) }, [])
  const setPageTitle = useCallback((title: string | null) => { setPageTitleState(title) }, [])

  return (
    <AppHeaderContext.Provider value={{ modeSelector, setModeSelector, rightActions, setRightActions, backHref, setBackHref, pageTitle, setPageTitle }}>
      {children}
    </AppHeaderContext.Provider>
  )
}

export function useAppHeader() {
  return useContext(AppHeaderContext)
}
