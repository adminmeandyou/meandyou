'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: 'var(--text)', marginBottom: '8px' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Logado como {email}</p>
        <a href="/perfil" style={{ display: 'block', backgroundColor: 'var(--accent)', color: '#fff', padding: '14px 32px', borderRadius: '100px', textDecoration: 'none', fontWeight: '700', marginBottom: '12px' }}>
          Completar perfil
        </a>
        <button onClick={handleLogout} style={{ background: 'none', border: '2px solid var(--border)', borderRadius: '100px', padding: '14px 32px', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
          Sair
        </button>
      </div>
    </div>
  )
}