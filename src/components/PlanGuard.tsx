'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/app/lib/supabase'

// Rotas que não exigem plano ativo
const PLAN_EXEMPT = [
  '/planos',
  '/onboarding',
  '/verificacao',
  '/minha-assinatura',
  '/deletar-conta',
  '/configuracoes/alterar-email',
  '/configuracoes/2fa',
  '/configuracoes/sessoes',
]

export function PlanGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  const isExempt = PLAN_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    if (authLoading) return
    if (!user || isExempt) { setAllowed(true); return }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()
        if (!data?.plan) {
          router.replace('/planos')
        } else {
          setAllowed(true)
        }
      } catch {
        setAllowed(true)
      }
    })()
  }, [user?.id, authLoading, isExempt])

  if (!allowed) return null

  return <>{children}</>
}
