'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Users, Lock, Crown, Search, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'

type Room = {
  id: string
  name: string
  type: 'public' | 'private' | 'black'
  description: string | null
  emoji: string
  max_members: number
  created_by: string | null
  is_active: boolean
  member_count?: number
}

// ─── Sheet de confirmação de entrada ──────────────────────────────────────────
function JoinSheet({
  room,
  onClose,
  onJoin,
}: {
  room: Room
  onClose: () => void
  onJoin: (nickname: string) => void
}) {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (nickname.trim().length < 2) {
      setError('Nome deve ter ao menos 2 caracteres')
      return
    }
    if (nickname.trim().length > 20) {
      setError('Nome muito longo (max 20 caracteres)')
      return
    }
    setLoading(true)
    setError('')
    onJoin(nickname.trim())
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 50,
        background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 20px 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            backgroundColor: 'rgba(225,29,72,0.10)', border: '1px solid rgba(225,29,72,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {room.emoji}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 18, color: 'var(--text)', margin: 0 }}>{room.name}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>{room.description ?? 'Sala de bate-papo'}</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
          Escolha um nome fantasia para entrar na sala. Os outros membros so verao este nome.
        </p>

        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleJoin()}
          placeholder="Ex: Morango32, Estrela28..."
          maxLength={20}
          autoFocus
          style={{
            width: '100%', padding: '13px 14px', borderRadius: 12,
            backgroundColor: 'var(--bg-card2)', border: `1px solid ${error ? 'rgba(225,29,72,0.5)' : 'var(--border)'}`,
            color: 'var(--text)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
            fontFamily: 'var(--font-jakarta)', marginBottom: error ? 8 : 16,
          }}
        />
        {error && <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{error}</p>}

        <p style={{ fontSize: 11, color: 'var(--muted-2)', marginBottom: 16, lineHeight: 1.5 }}>
          Deixe em branco para receber um nome aleatorio. Voce pode entrar anonimamente.
        </p>

        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', fontFamily: 'var(--font-jakarta)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Entrando...' : 'Entrar na sala'}
        </button>
      </div>
    </>
  )
}

// ─── Card de sala ─────────────────────────────────────────────────────────────
function RoomCard({
  room,
  canJoin,
  onJoin,
  plan,
}: {
  room: Room
  canJoin: boolean
  onJoin: (room: Room) => void
  plan: string
}) {
  const isFull = (room.member_count ?? 0) >= room.max_members
  const isBlack = room.type === 'black'
  const planLocked = !canJoin || (isBlack && plan !== 'black')

  return (
    <button
      onClick={() => onJoin(room)}
      disabled={isFull && !planLocked}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 16, width: '100%', textAlign: 'left',
        background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
        border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : planLocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.06)'}`,
        cursor: isFull && !planLocked ? 'default' : 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Emoji / ícone */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        backgroundColor: isBlack ? 'rgba(245,158,11,0.10)' : planLocked ? 'rgba(255,255,255,0.04)' : 'rgba(225,29,72,0.10)',
        border: `1px solid ${isBlack ? 'rgba(245,158,11,0.25)' : planLocked ? 'rgba(255,255,255,0.07)' : 'rgba(225,29,72,0.20)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        filter: planLocked ? 'grayscale(0.6) opacity(0.5)' : 'none',
      }}>
        {room.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{
            fontFamily: 'var(--font-jakarta)', fontWeight: 600, fontSize: 14,
            color: planLocked ? 'rgba(248,249,250,0.35)' : 'var(--text)', margin: 0,
          }}>
            {room.name}
          </p>
          {isBlack && <Crown size={12} color={planLocked ? 'rgba(245,158,11,0.4)' : '#F59E0B'} strokeWidth={2} />}
          {room.type === 'private' && !planLocked && <Lock size={11} color="var(--muted)" strokeWidth={2} />}
        </div>
        <p style={{
          fontSize: 12, color: planLocked ? 'rgba(248,249,250,0.22)' : 'var(--muted)',
          margin: 0, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {isFull ? 'Sala cheia' : room.description ?? 'Sala de bate-papo'}
        </p>
      </div>

      {/* Direita: lock ou contagem */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {planLocked ? (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={13} color="rgba(248,249,250,0.3)" strokeWidth={2} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isFull ? '#F59E0B' : '#10b981' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {room.member_count ?? 0}/{room.max_members}
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Sheet de upgrade ─────────────────────────────────────────────────────────
function UpgradeSheet({
  room,
  isBlackOnly,
  onClose,
}: {
  room: Room
  isBlackOnly: boolean
  onClose: () => void
}) {
  const router = useRouter()
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 50,
        background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '24px 24px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 24px 48px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)', margin: '0 auto 24px' }} />

        {/* Ícone + preview da sala */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: isBlackOnly ? 'rgba(245,158,11,0.10)' : 'rgba(225,29,72,0.10)',
            border: `1px solid ${isBlackOnly ? 'rgba(245,158,11,0.30)' : 'rgba(225,29,72,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
          }}>
            {room.emoji}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: 0 }}>
              {room.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
              {room.description ?? 'Sala de bate-papo'}
            </p>
          </div>
        </div>

        {/* Mensagem de bloqueio */}
        <div style={{
          padding: '14px 16px', borderRadius: 14, marginBottom: 20,
          backgroundColor: isBlackOnly ? 'rgba(245,158,11,0.08)' : 'rgba(225,29,72,0.08)',
          border: `1px solid ${isBlackOnly ? 'rgba(245,158,11,0.20)' : 'rgba(225,29,72,0.20)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            backgroundColor: isBlackOnly ? 'rgba(245,158,11,0.15)' : 'rgba(225,29,72,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={15} color={isBlackOnly ? '#F59E0B' : 'var(--accent)'} strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: isBlackOnly ? '#F59E0B' : 'var(--accent)', margin: 0 }}>
              {isBlackOnly ? 'Exclusivo para assinantes Black' : 'Disponivel no plano Plus ou Black'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
              {isBlackOnly
                ? 'Faca upgrade para o plano Black e acesse salas exclusivas com perfis selecionados.'
                : 'Faca upgrade e entre em salas para conhecer pessoas com os mesmos interesses que voce.'}
            </p>
          </div>
        </div>

        {/* Beneficios rapidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {(isBlackOnly
            ? ['Salas Black exclusivas', 'Acesso ilimitado a todas as salas', 'Beneficios VIP completos']
            : ['Acesso a todas as salas publicas e privadas', 'Crie suas proprias salas', 'Converse sem limites']
          ).map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={13} color={isBlackOnly ? '#F59E0B' : 'var(--accent)'} />
              <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.70)' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/planos')}
          style={{
            width: '100%', padding: '15px', borderRadius: 14,
            background: isBlackOnly ? '#F59E0B' : 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none',
            fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Crown size={16} />
          {isBlackOnly ? 'Ver plano Black' : 'Fazer upgrade agora'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 10, padding: '13px', borderRadius: 14,
            backgroundColor: 'transparent', color: 'var(--muted)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-jakarta)',
          }}
        >
          Agora nao
        </button>
      </div>
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SalasPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('essencial')
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'public' | 'private' | 'black'>('public')
  const [search, setSearch] = useState('')
  const [joiningRoom, setJoiningRoom] = useState<Room | null>(null)
  const [upgradeRoom, setUpgradeRoom] = useState<Room | null>(null)
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      setPlan(profile?.plan ?? 'essencial')

      await loadRooms()
    }
    load()
  }, [])

  async function loadRooms() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_rooms')
      .select('id, name, type, description, emoji, max_members, created_by, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (data) {
      // Buscar contagem de membros para cada sala
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

  async function handleJoin(nickname: string) {
    if (!joiningRoom || joining) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/salas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: joiningRoom.id, nickname }),
      })
      const data = await res.json()
      if (!res.ok) {
        setJoinError(data.error ?? 'Erro ao entrar na sala')
        setJoining(false)
        return
      }
      router.push(`/salas/${joiningRoom.id}`)
    } catch {
      setJoinError('Erro de conexao. Tente novamente.')
      setJoining(false)
    }
  }

  const canJoin = plan === 'plus' || plan === 'black'
  const canJoinBlack = plan === 'black'

  function handleRoomClick(room: Room) {
    const isBlackRoom = room.type === 'black'
    if (!canJoin || (isBlackRoom && !canJoinBlack)) {
      setUpgradeRoom(room)
      return
    }
    setJoiningRoom(room)
  }

  const filteredRooms = rooms.filter(r => {
    if (r.type !== tab) return false
    if (search.trim()) return r.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const TABS = [
    { key: 'public' as const,  label: 'Publicas',  icon: <Users size={14} />, accessible: canJoin },
    { key: 'private' as const, label: 'Privadas',  icon: <Lock size={14} />,  accessible: canJoin },
    { key: 'black' as const,   label: 'Black',     icon: <Crown size={14} />, accessible: canJoinBlack },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', position: 'sticky', top: 0, backgroundColor: 'var(--bg)', zIndex: 20 }}>
        <button onClick={() => router.push('/dashboard')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>Salas de Bate-papo</h1>
        <div style={{ flex: 1 }} />
        <button
          onClick={loadRooms}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
        >
          <RefreshCw size={15} strokeWidth={2} />
        </button>
        {canJoin && (
          <Link href="/salas/criar" style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', textDecoration: 'none' }}>
            <Plus size={16} strokeWidth={2} />
          </Link>
        )}
      </div>

      {/* Busca */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', borderRadius: 12, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search size={15} color="var(--muted)" strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sala..."
            style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-jakarta)' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '14px 16px 0', gap: 8, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 100, flexShrink: 0,
              border: `1px solid ${tab === t.key ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
              backgroundColor: tab === t.key ? 'rgba(225,29,72,0.12)' : 'transparent',
              color: tab === t.key ? 'var(--accent)' : (t.accessible ? 'var(--muted)' : 'var(--muted-2)'),
              fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
              fontFamily: 'var(--font-jakarta)',
            }}
          >
            {t.icon}
            {t.label}
            {!t.accessible && <Lock size={10} />}
          </button>
        ))}
      </div>

      {/* Hint sutil para plano essencial */}
      {!canJoin && (
        <div style={{ margin: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Lock size={13} color="rgba(248,249,250,0.30)" strokeWidth={2} />
          <p style={{ fontSize: 12, color: 'rgba(248,249,250,0.35)', margin: 0 }}>
            Toque em uma sala para ver como fazer upgrade
          </p>
        </div>
      )}

      {/* Lista */}
      <div style={{ padding: '14px 16px 100px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 76, borderRadius: 16, background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', animation: 'ui-pulse 1.5s ease infinite' }} />
          ))
        ) : filteredRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <Users size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {tab === 'private' ? 'Nenhuma sala privada. Crie a primeira!' : 'Nenhuma sala encontrada.'}
            </p>
          </div>
        ) : (
          filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              canJoin={canJoin}
              onJoin={handleRoomClick}
              plan={plan}
            />
          ))
        )}
      </div>

      {/* Join Sheet */}
      {joiningRoom && (
        <JoinSheet
          room={joiningRoom}
          onClose={() => { setJoiningRoom(null); setJoinError('') }}
          onJoin={handleJoin}
        />
      )}

      {/* Upgrade Sheet */}
      {upgradeRoom && (
        <UpgradeSheet
          room={upgradeRoom}
          isBlackOnly={upgradeRoom.type === 'black' && canJoin}
          onClose={() => setUpgradeRoom(null)}
        />
      )}
      {joinError && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, zIndex: 60 }}>
          {joinError}
        </div>
      )}
    </div>
  )
}
