'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcessoPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(false)

    const res = await fetch('/api/acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setErro(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#08090E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-jakarta, sans-serif)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>

        <h1 style={{
          fontFamily: 'var(--font-fraunces, serif)', fontSize: 28,
          color: '#F8F9FA', marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          MeAnd<span style={{ color: '#E11D48' }}>You</span>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(248,249,250,0.50)', marginBottom: 32 }}>
          Site em manutencao. Acesso restrito.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            autoFocus
            style={{
              padding: '12px 16px', borderRadius: 12, fontSize: 15,
              backgroundColor: '#13161F', border: `1px solid ${erro ? '#E11D48' : 'rgba(255,255,255,0.07)'}`,
              color: '#F8F9FA', outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
          />
          {erro && (
            <p style={{ fontSize: 13, color: '#E11D48', margin: 0 }}>Senha incorreta.</p>
          )}
          <button
            type="submit"
            disabled={loading || !senha}
            style={{
              padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              background: loading || !senha ? 'rgba(225,29,72,0.4)' : 'linear-gradient(135deg, #E11D48, #be123c)',
              color: '#fff', border: 'none', cursor: loading || !senha ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}
