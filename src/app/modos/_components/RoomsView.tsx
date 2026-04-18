'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Lock, Crown, Loader2 } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { Room } from './helpers'

export function RoomsView({ userPlan }: { userPlan: string }) {
  const router = useRouter()
  const canJoin = userPlan === 'plus' || userPlan === 'black'
  const canJoinBlack = userPlan === 'black'
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningRoom, setJoiningRoom] = useState<Room | null>(null)
  const [nickname, setNickname] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => { loadRooms() }, [])

  async function loadRooms() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_rooms')
      .select('id, name, type, description, emoji, max_members, created_by, is_active')
      .eq('is_active', true)
      .order('name')
    if (data) {
      const roomsWithCount = await Promise.all(
        data.map(async (room) => {
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
          return { ...room, member_count: count ?? 0 } as Room
        })
      )
      setRooms(roomsWithCount)
    }
    setLoading(false)
  }

  async function handleJoin() {
    if (!joiningRoom || joining) return
    if (nickname.trim().length < 2) { setJoinError('Nome deve ter ao menos 2 caracteres.'); return }
    if (nickname.trim().length > 20) { setJoinError('Nome deve ter no máximo 20 caracteres.'); return }
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/salas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: joiningRoom.id, nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Erro ao entrar na sala.'); setJoining(false); return }
      router.push(`/salas/${joiningRoom.id}`)
    } catch {
      setJoinError('Erro de conexão. Tente novamente.')
      setJoining(false)
    }
  }

  if (!canJoin) {
    const fakeRooms = [
      { name: 'Paquera Livre', members: 12, max: 20, emoji: '💬' },
      { name: 'Musica e Conversa', members: 8, max: 15, emoji: '🎵' },
      { name: 'Noturno(a)s', members: 5, max: 10, emoji: '🌙' },
    ]
    return (
      <div style={{ padding: '0 16px 20px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', paddingTop: 32, marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(225,29,72,0.05) 100%)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={28} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, color: 'var(--text)', margin: '0 0 8px' }}>Salas de Bate-papo</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, lineHeight: 1.6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Converse anonimamente em salas temáticas com pessoas que compartilham seus interesses.
          </p>
        </div>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fakeRooms.map((room, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{room.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{room.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Sala ativa agora</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.members}/{room.max}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, backgroundColor: 'rgba(8,9,14,0.85)', border: '1px solid rgba(225,29,72,0.25)', backdropFilter: 'blur(4px)' }}>
              <Lock size={13} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Disponível no Plus e Black</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { icon: <Users size={16} strokeWidth={1.5} />, text: 'Salas temáticas com até 20 pessoas' },
            { icon: <Lock size={16} strokeWidth={1.5} />, text: 'Identidade protegida com apelidos' },
            { icon: <Crown size={16} strokeWidth={1.5} />, text: 'Salas exclusivas Black com categorias VIP' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)' }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.70)', lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <Link
          href="/planos"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '15px', borderRadius: 14,
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            textDecoration: 'none', fontFamily: 'var(--font-jakarta)',
            boxShadow: '0 8px 32px rgba(225,29,72,0.25)',
          }}
        >
          Fazer upgrade
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
        <p style={{ fontSize: 11, color: 'var(--muted-2)', textAlign: 'center', margin: '10px 0 0' }}>
          A partir de R$14,90/mês no plano Essencial
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 size={24} style={{ color: 'var(--accent)', animation: 'ui-spin 1s linear infinite' }} />
      </div>
    )
  }

  if (joiningRoom) {
    const isBlack = joiningRoom.type === 'black'
    return (
      <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => { setJoiningRoom(null); setNickname(''); setJoinError('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
        >
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 16, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : 'var(--border)'}` }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, backgroundColor: isBlack ? 'rgba(245,158,11,0.10)' : 'rgba(225,29,72,0.10)', border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : 'rgba(225,29,72,0.20)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {joiningRoom.emoji}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 15, color: 'var(--text)', margin: '0 0 2px' }}>{joiningRoom.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{joiningRoom.description ?? 'Sala de bate-papo'}</p>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Como quer ser chamado nessa sala?</p>
          <input
            value={nickname}
            onChange={e => { setNickname(e.target.value); setJoinError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Seu apelido na sala"
            maxLength={20}
            autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${joinError ? 'rgba(225,29,72,0.50)' : 'var(--border)'}`, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-jakarta)', outline: 'none', boxSizing: 'border-box' }}
          />
          {joinError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{joinError}</p>}
        </div>
        <button
          onClick={handleJoin}
          disabled={joining}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', opacity: joining ? 0.7 : 1 }}
        >
          {joining ? 'Entrando...' : 'Entrar na sala'}
        </button>
      </div>
    )
  }

  const publicRooms = rooms.filter(r => r.type === 'public')
  const blackRooms = rooms.filter(r => r.type === 'black')

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 2px' }}>Salas</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Bate-papo em grupo por tema</p>
        </div>
        <Link href="/salas" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
      </div>

      {publicRooms.length === 0 && blackRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhuma sala disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {publicRooms.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Publicas</p>
              {publicRooms.map(room => {
                const isFull = (room.member_count ?? 0) >= room.max_members
                return (
                  <button
                    key={room.id}
                    onClick={() => { if (!isFull) { setJoiningRoom(room); setNickname('') } }}
                    disabled={isFull}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, width: '100%', textAlign: 'left', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', opacity: isFull ? 0.45 : 1, cursor: isFull ? 'default' : 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{room.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 2px' }}>{room.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isFull ? 'Sala cheia' : (room.description ?? 'Sala de bate-papo')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isFull ? '#F59E0B' : '#10b981' }} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.member_count ?? 0}/{room.max_members}</span>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {blackRooms.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '12px 0 6px' }}>Black</p>
              {blackRooms.map(room => {
                const isFull = (room.member_count ?? 0) >= room.max_members
                const isLocked = !canJoinBlack
                return (
                  <button
                    key={room.id}
                    onClick={() => { if (!isLocked && !isFull) { setJoiningRoom(room); setNickname('') } }}
                    disabled={isLocked || isFull}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, width: '100%', textAlign: 'left', background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(245,158,11,0.25)', opacity: isLocked || isFull ? 0.45 : 1, cursor: isLocked || isFull ? 'default' : 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{room.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <p style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>{room.name}</p>
                        <Crown size={12} color="#F59E0B" strokeWidth={2} />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isFull ? 'Sala cheia' : (room.description ?? 'Sala de bate-papo')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {isLocked ? <Lock size={12} color="var(--muted)" strokeWidth={2} /> : (
                        <>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isFull ? '#F59E0B' : '#10b981' }} />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{room.member_count ?? 0}/{room.max_members}</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
