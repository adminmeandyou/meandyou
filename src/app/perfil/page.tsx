'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

/**
 * /perfil — redireciona para o perfil visual do usuario logado (/perfil/[id])
 * que mostra fotos, bio, emblemas e tags igual como outros usuarios veem.
 */
export default function PerfilPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }

      // Verifica se o row de perfil existe antes de redirecionar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, onboarding_done')
        .eq('id', user.id)
        .maybeSingle()

      // Se deu erro (ex: RLS), vai direto ao perfil — evita loop de onboarding indevido
      if (profileError) {
        router.replace(`/perfil/${user.id}`)
        return
      }

      if (!profile) {
        // Conta existe no Auth mas perfil nao foi criado — manda para onboarding
        router.replace('/onboarding')
        return
      }

      router.replace(`/perfil/${user.id}`)
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
