'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Heart, MessageCircle, Star, Zap, Crown, CheckCheck, UserPlus, UserCheck, CalendarHeart, CalendarCheck, CalendarX, RefreshCw, Ban } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { playSoundDirect } from '@/hooks/useSounds'
import { useNotifications } from '@/contexts/NotificationContext'

type Notification = {
  id: string
  type: string
  from_user_id: string | null
  read: boolean
  data: Record<string, unknown>
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  match:            { label: 'Novo match!',                icon: <Heart size={16} />,         color: '#f472b6', bg: 'rgba(244,114,182,0.10)' },
  message:          { label: 'Nova mensagem',              icon: <MessageCircle size={16} />, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  superlike:        { label: 'SuperCurtida recebida',      icon: <Star size={16} />,          color: '#facc15', bg: 'rgba(250,204,21,0.10)' },
  like:             { label: 'Alguem curtiu voce',         icon: <Heart size={16} />,         color: '#f472b6', bg: 'rgba(244,114,182,0.10)' },
  friend_request:   { label: 'Pedido de amizade',          icon: <UserPlus size={16} />,      color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  friend_accepted:  { label: 'Amizade aceita!',            icon: <UserCheck size={16} />,     color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  boost_expired:        { label: 'Boost expirado',             icon: <Zap size={16} />,           color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)' },
  plan_expired:         { label: 'Plano expirado',             icon: <Crown size={16} />,         color: '#fb923c', bg: 'rgba(251,146,60,0.10)' },
  meeting_invite:       { label: 'Convite de encontro',        icon: <CalendarHeart size={16} />, color: '#f472b6', bg: 'rgba(244,114,182,0.10)' },
  meeting_accepted:     { label: 'Encontro confirmado!',       icon: <CalendarCheck size={16} />, color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  meeting_declined:     { label: 'Encontro recusado',          icon: <CalendarX size={16} />,     color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  meeting_rescheduled:  { label: 'Encontro remarcado',         icon: <RefreshCw size={16} />,     color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
  meeting_cancelled:    { label: 'Encontro cancelado',         icon: <Ban size={16} />,           color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

export default function NotificacoesPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()
  const { markAllRead: markAllReadGlobal, decrementUnread } = useNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // Realtime: escuta novas notificações na lista da página
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('notif-page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function loadNotifications() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/notificacoes', {
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notificacoes ?? [])
      } else {
        toast.error('Erro ao carregar notificações.')
      }
    } catch {
      toast.error('Erro ao carregar notificações.')
    }
    setLoading(false)
  }

  async function markAllRead() {
    if (markingRead) return
    haptics.tap()
    setMarkingRead(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/notificacoes', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session?.access_token ?? ''}` },
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      markAllReadGlobal()
      toast.success('Todas marcadas como lidas')
    } catch {
      toast.error('Erro ao marcar como lidas.')
    }
    setMarkingRead(false)
  }

  function handleClick(n: Notification) {
    haptics.tap()
    playSoundDirect('tap')
    if (!n.read) decrementUnread()
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    if (n.type === 'match' && n.data?.match_id) {
      router.push(`/conversas/${n.data.match_id}`)
    } else if (n.type === 'message' && n.data?.match_id) {
      router.push(`/conversas/${n.data.match_id}`)
    } else if (n.type === 'superlike' && n.from_user_id) {
      router.push(`/perfil/${n.from_user_id}`)
    } else if (n.type === 'like' && n.from_user_id) {
      router.push('/curtidas')
    } else if ((n.type === 'friend_request' || n.type === 'friend_accepted') && n.from_user_id) {
      router.push('/amigos')
    } else if (n.type === 'plan_expired') {
      router.push('/planos')
    } else if (n.type.startsWith('meeting_')) {
      router.push('/matches')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: 96 }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} color="var(--muted)" />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="var(--muted)" />
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: 0 }}>
            Notificações
          </h1>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 100,
              background: 'var(--accent-light)', color: 'var(--accent)',
              fontWeight: 700, border: '1px solid var(--accent-border)',
            }}>
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: markingRead ? 'var(--muted-2)' : 'var(--muted)',
              background: 'none', border: 'none', cursor: markingRead ? 'not-allowed' : 'pointer',
              transition: 'color 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <CheckCheck size={14} />
            Marcar todas como lidas
          </button>
        )}
      </header>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ padding: '12px 0' }}>
          <SkeletonList rows={6} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="Nenhuma notificação ainda"
          description="Matches, mensagens e SuperCurtidas aparecem aqui."
        />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-soft)' }}>
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['message']
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  textAlign: 'left', background: n.read ? 'transparent' : 'rgba(255,255,255,0.018)',
                  cursor: 'pointer', transition: 'background 0.25s cubic-bezier(0.4,0,0.2,1)',
                  border: 'none', borderBottom: '1px solid var(--border-soft)',
                }}
              >
                {/* Ícone */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: cfg.color,
                }}>
                  {cfg.icon}
                </div>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 600, margin: '0 0 2px',
                    color: n.read ? 'var(--muted)' : 'var(--text)',
                  }}>
                    {cfg.label}
                    {typeof n.data?.name === 'string' && n.data.name && (
                      <span style={{ fontWeight: 400, color: 'var(--muted)' }}> · {n.data.name}</span>
                    )}
                  </p>
                  {typeof n.data?.message_preview === 'string' && n.data.message_preview && (
                    <p style={{
                      fontSize: 13, margin: 0, color: 'var(--muted-2)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.data.message_preview}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{timeAgo(n.created_at)}</span>
                  {!n.read && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
