'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AppHeaderContextType {
  modeSelector: ReactNode
  setModeSelector: (node: ReactNode) => void
  rightActions: ReactNode
  setRightActions: (node: ReactNode) => void
  leftAction: ReactNode
  setLeftAction: (node: ReactNode) => void
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
  leftAction: null,
  setLeftAction: () => {},
  backHref: null,
  setBackHref: () => {},
  pageTitle: null,
  setPageTitle: () => {},
})

export function AppHeaderProvider({ children }: { children: ReactNode }) {
  const [modeSelector, setModeSelectorState] = useState<ReactNode>(null)
  const [rightActions, setRightActionsState] = useState<ReactNode>(null)
  const [leftAction, setLeftActionState] = useState<ReactNode>(null)
  const [backHref, setBackHrefState] = useState<string | null>(null)
  const [pageTitle, setPageTitleState] = useState<string | null>(null)

  const setModeSelector = useCallback((node: ReactNode) => { setModeSelectorState(node) }, [])
  const setRightActions = useCallback((node: ReactNode) => { setRightActionsState(node) }, [])
  const setLeftAction = useCallback((node: ReactNode) => { setLeftActionState(node) }, [])
  const setBackHref = useCallback((href: string | null) => { setBackHrefState(href) }, [])
  const setPageTitle = useCallback((title: string | null) => { setPageTitleState(title) }, [])

  return (
    <AppHeaderContext.Provider value={{ modeSelector, setModeSelector, rightActions, setRightActions, leftAction, setLeftAction, backHref, setBackHref, pageTitle, setPageTitle }}>
      {children}
    </AppHeaderContext.Provider>
  )
}

export function useAppHeader() {
  return useContext(AppHeaderContext)
}
