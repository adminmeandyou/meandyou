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
        .select('id')
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
      backgroundColor: '#08090E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      <div style={{
        width: 32, height: 32,
        border: '1.5px solid rgba(255,255,255,0.06)',
        borderTop: '1.5px solid #E11D48',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        fontFamily: 'var(--font-fraunces)',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'rgba(248,249,250,0.25)',
        margin: 0,
      }}>
        Me&amp;You
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
