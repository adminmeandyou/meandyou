'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [verificado, setVerificado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const verificarEstado = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setEmail(user.email || '')

      // Verifica se tem perfil preenchido
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (!profile?.name) {
        // Sem perfil — vai preencher
        router.push('/perfil')
        return
      }

      // Verifica se está verificado
      const { data: userData } = await supabase
        .from('users')
        .select('verified')
        .eq('id', user.id)
        .single()

      if (!userData?.verified) {
        // Tem perfil mas não verificou — vai verificar
        router.push('/verificacao')
        return
      }

      // Tudo certo — fica no dashboard
      setNome(profile.name)
      setVerificado(true)
      setCarregando(false)
    }

    verificarEstado()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: 'var(--text)', marginBottom: '8px' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>Olá, <strong style={{ color: 'var(--text)' }}>{nome}</strong>! 👋</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent-light)', borderRadius: '100px', padding: '6px 14px', marginBottom: '32px' }}>
          <span style={{ fontSize: '12px' }}>✅</span>
          <span style={{ fontSize: '13px', color: 'var(--accent-dark)', fontWeight: '600' }}>Identidade verificada</span>
        </div>

        <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(46,196,160,0.08)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>
            🚧 O sistema de busca e matches está sendo desenvolvido.<br /><br />
            Em breve você poderá encontrar pessoas compatíveis com você!
          </p>
        </div>

        <button onClick={handleLogout} style={{ background: 'none', border: '2px solid var(--border)', borderRadius: '100px', padding: '14px 32px', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
          Sair
        </button>
      </div>
    </div>
  )
}