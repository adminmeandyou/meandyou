'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Heart, MessageCircle, Star, Zap, Crown, Loader2, CheckCheck } from 'lucide-react'

type Notification = {
  id: string
  type: 'match' | 'message' | 'superlike' | 'boost_expired' | 'plan_expired'
  from_user_id: string | null
  read: boolean
  data: Record<string, any>
  created_at: string
  from_profile?: { name: string; photo_best: string | null }
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  match:        { label: 'Novo match!',           icon: <Heart size={16} />,          color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  message:      { label: 'Nova mensagem',          icon: <MessageCircle size={16} />,  color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  superlike:    { label: 'SuperLike recebido',     icon: <Star size={16} />,           color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  boost_expired:{ label: 'Boost expirado',         icon: <Zap size={16} />,            color: 'text-white/40',   bg: 'bg-white/5' },
  plan_expired: { label: 'Plano expirado',         icon: <Crown size={16} />,          color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    // Usa a API criada na etapa 5
    const res = await fetch('/api/notificacoes')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    }
    setLoading(false)
  }

  async function markAllRead() {
    if (markingRead) return
    setMarkingRead(true)
    await fetch('/api/notificacoes', { method: 'PATCH' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setMarkingRead(false)
  }

  function handleClick(n: Notification) {
    // Marca individual como lida localmente
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))

    // Navega para a tela correta conforme tipo
    if (n.type === 'match' && n.data?.match_id) {
      router.push(`/conversas/${n.data.match_id}`)
    } else if (n.type === 'message' && n.data?.match_id) {
      router.push(`/conversas/${n.data.match_id}`)
    } else if (n.type === 'superlike' && n.from_user_id) {
      router.push(`/perfil/${n.from_user_id}`)
    } else if (n.type === 'plan_expired') {
      router.push('/planos')
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Bell size={18} className="text-white/60" />
          <h1 className="font-fraunces text-xl text-white">Notificações</h1>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingRead}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition"
          >
            <CheckCheck size={14} />
            Marcar todas lidas
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-white/20" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-white/20">
          <Bell size={36} />
          <p className="text-sm">Nenhuma notificação ainda.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG['message']
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left transition hover:bg-white/3 ${!n.read ? 'bg-white/2' : ''}`}
              >
                {/* Ícone do tipo */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <span className={cfg.color}>{cfg.icon}</span>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? 'text-white/50' : 'text-white'}`}>
                    {cfg.label}
                    {n.data?.name && (
                      <span className="font-normal text-white/50"> · {n.data.name}</span>
                    )}
                  </p>
                  {n.data?.message_preview && (
                    <p className="text-xs text-white/30 truncate mt-0.5">{n.data.message_preview}</p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-white/20">{timeAgo(n.created_at)}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
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
