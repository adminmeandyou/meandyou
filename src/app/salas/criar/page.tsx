'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'

const EMOJIS = ['🔒','💬','🎮','🎬','🎶','🏕','⚽','🍻','📚','🎨','💃','🎯','🌙','☕','🌺']

export default function CriarSalaPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [emoji, setEmoji] = useState('🔒')
  const [maxMembros, setMaxMembros] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCriar() {
    if (nome.trim().length < 3) {
      setError('Nome deve ter ao menos 3 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/salas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, description: descricao || null, emoji, maxMembers: maxMembros }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar sala.')
        setLoading(false)
        return
      }
      // Entrar automaticamente na sala criada
      const entrarRes = await fetch('/api/salas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: data.roomId }),
      })
      if (entrarRes.ok) {
        router.push(`/salas/${data.roomId}`)
      } else {
        router.push('/salas')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)', padding: '0 0 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 24px' }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>Criar sala privada</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Emoji */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Ícone da sala</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 44, height: 44, borderRadius: 12, fontSize: 22,
                  backgroundColor: emoji === e ? 'rgba(225,29,72,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Nome */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Nome da sala *</p>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Cinema Favoritos, Gamers SP..."
            maxLength={40}
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 12, boxSizing: 'border-box',
              backgroundColor: 'var(--bg-card)', border: `1px solid ${error && nome.trim().length < 3 ? 'rgba(225,29,72,0.5)' : 'var(--border)'}`,
              color: 'var(--text)', fontSize: 15, outline: 'none', fontFamily: 'var(--font-jakarta)',
            }}
          />
          <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: '4px 0 0', textAlign: 'right' }}>{nome.length}/40</p>
        </div>

        {/* Descricao */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Descrição (opcional)</p>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Do que se trata esta sala?"
            maxLength={100}
            rows={2}
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 12, boxSizing: 'border-box',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none',
              fontFamily: 'var(--font-jakarta)', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Maximo de membros */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Limite de membros: <strong style={{ color: 'var(--text)' }}>{maxMembros}</strong></p>
          <input
            type="range"
            min={2}
            max={10}
            value={maxMembros}
            onChange={e => setMaxMembros(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>2</span>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>10</span>
          </div>
        </div>

        {/* Info privacidade */}
        <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <Lock size={14} color="var(--muted)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            Sala privada: apenas quem tiver o link pode entrar. Você como criador pode sair e a sala continuará ativa.
          </p>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--accent)', margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleCriar}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            backgroundColor: 'var(--accent)', color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', fontFamily: 'var(--font-jakarta)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Criando...' : 'Criar sala'}
        </button>
      </div>
    </div>
  )
}
