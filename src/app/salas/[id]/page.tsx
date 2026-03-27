'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Send, Users, X, Check, ChevronDown,
  UserCircle, MessageCircle, Ban, VolumeX, Crown, AlertTriangle, UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { moderateContent, getModerationMessage } from '@/app/lib/moderation'

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Room = {
  id: string; name: string; type: string; emoji: string; max_members: number
}
type RoomMessage = {
  id: string; room_id: string; sender_id: string; nickname: string
  content: string; is_system: boolean; created_at: string
}
type RoomMember = {
  room_id: string; user_id: string; nickname: string; joined_at: string
}
type ProfileRequest = {
  id: string; requester_id: string; target_id: string; status: string
  expires_at: string; room_id: string; requesterNickname?: string
}
type ChatRequest = {
  id: string; requester_id: string; target_id: string; status: string
  expires_at: string; room_id: string; requesterNickname?: string
}
type PublicProfile = {
  id: string; name: string; photo_best: string | null; city: string | null; plan: string
  bio: string | null
}

// ─── Modal de perfil revelado ─────────────────────────────────────────────────
function ProfileModal({ profile, onClose }: { profile: PublicProfile; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 70,
        backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', padding: '20px 20px 40px',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          {profile.photo_best ? (
            <img src={profile.photo_best} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--border)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCircle size={36} color="var(--muted)" />
            </div>
          )}
          <div>
            <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, margin: 0 }}>{profile.name}</p>
            {profile.city && <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>{profile.city}</p>}
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio}</p>
        )}
        <Link
          href={`/perfil/${profile.id}`}
          style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          Ver perfil completo
        </Link>
        <button onClick={onClose} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
          Fechar
        </button>
      </div>
    </>
  )
}

// ─── Sheet de membros ─────────────────────────────────────────────────────────
function MembersSheet({
  members, myUserId, myNickname, onClose, onAction, blocked,
}: {
  members: RoomMember[]
  myUserId: string
  myNickname: string
  onClose: () => void
  onAction: (member: RoomMember, action: 'profile' | 'chat' | 'block' | 'mute' | 'friend') => void
  blocked: Set<string>
}) {
  const [selected, setSelected] = useState<RoomMember | null>(null)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, zIndex: 60,
        backgroundColor: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border)', padding: '20px 16px 40px',
        maxHeight: '70vh', overflowY: 'auto',
        animation: 'ui-slide-up 0.25s ease-out',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
        <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, margin: '0 0 16px' }}>
          Membros na sala ({members.length})
        </p>

        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {members.map(m => (
              <button
                key={m.user_id}
                onClick={() => m.user_id !== myUserId && setSelected(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 12, backgroundColor: 'transparent', border: 'none',
                  cursor: m.user_id === myUserId ? 'default' : 'pointer', textAlign: 'left',
                  opacity: blocked.has(m.user_id) ? 0.4 : 1,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {m.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                    {m.nickname}
                    {m.user_id === myUserId && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>(voce)</span>}
                  </p>
                </div>
                {blocked.has(m.user_id) && <VolumeX size={12} color="var(--muted)" style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                <ArrowLeft size={18} />
              </button>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{selected.nickname}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { action: 'friend' as const,  icon: <UserPlus size={18} />, label: 'Adicionar como amigo' },
                { action: 'profile' as const, icon: <UserCircle size={18} />, label: 'Solicitar ver perfil' },
                { action: 'chat' as const,    icon: <MessageCircle size={18} />, label: 'Solicitar chat privado' },
                { action: 'mute' as const,    icon: <VolumeX size={18} />, label: blocked.has(selected.user_id) ? 'Desbloquear mensagens' : 'Silenciar na sala' },
                { action: 'block' as const,   icon: <Ban size={18} />, label: 'Bloquear permanentemente', danger: true },
              ].map(opt => (
                <button
                  key={opt.action}
                  onClick={() => { onAction(selected, opt.action); setSelected(null); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                    borderRadius: 12, border: '1px solid var(--border)',
                    backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                    color: (opt as { danger?: boolean }).danger ? '#f87171' : 'var(--text)',
                    fontFamily: 'var(--font-jakarta)', fontSize: 14,
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SalaChatPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [room, setRoom] = useState<Room | null>(null)
  const [myUserId, setMyUserId] = useState('')
  const [myNickname, setMyNickname] = useState('')
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [members, setMembers] = useState<RoomMember[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [modError, setModError] = useState('')
  const [floodWarning, setFloodWarning] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [blocked, setBlocked] = useState<Set<string>>(new Set())
  const [muted, setMuted] = useState<Set<string>>(new Set())
  const [pendingProfileReqs, setPendingProfileReqs] = useState<ProfileRequest[]>([])
  const [pendingChatReqs, setPendingChatReqs] = useState<ChatRequest[]>([])
  const [revealedProfile, setRevealedProfile] = useState<PublicProfile | null>(null)
  const [leaving, setLeaving] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const msgTimestamps = useRef<number[]>([]) // anti-flood
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionStart = useRef<string>(new Date().toISOString()) // momento de entrada nesta sessao

  // ─── Scroll para o fim ────────────────────────────────────────────────────
  function scrollBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // ─── Carregamento inicial ─────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyUserId(user.id)

      // Dados da sala
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select('id, name, type, emoji, max_members')
        .eq('id', roomId)
        .single()
      if (!roomData) { router.push('/salas'); return }
      setRoom(roomData)

      // Verificar se e membro
      const { data: memberRow } = await supabase
        .from('room_members')
        .select('nickname')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()

      if (!memberRow) {
        // Nao e membro — redirecionar de volta para a listagem para entrar
        router.push(`/salas?join=${roomId}`)
        return
      }
      setMyNickname(memberRow.nickname)

      // Carregar apenas mensagens desta sessao (a partir do momento que entrou)
      const { data: msgs } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', roomId)
        .gte('created_at', sessionStart.current)
        .order('created_at', { ascending: true })
      setMessages(msgs ?? [])

      // Carregar membros
      await loadMembers()

      // Carregar bloqueios locais do localStorage
      const storedBlocked = localStorage.getItem(`room_blocks_${roomId}`)
      if (storedBlocked) {
        try { setBlocked(new Set(JSON.parse(storedBlocked))) } catch { /* */ }
      }
      const storedMuted = localStorage.getItem(`room_muted_${roomId}`)
      if (storedMuted) {
        try { setMuted(new Set(JSON.parse(storedMuted))) } catch { /* */ }
      }

      setLoading(false)
      setTimeout(scrollBottom, 100)
    }
    init()
  }, [roomId])

  // ─── Realtime: novas mensagens ────────────────────────────────────────────
  useEffect(() => {
    if (!myUserId || loading) return

    const channel = supabase
      .channel(`room-msgs-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        const msg = payload.new as RoomMessage
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        setTimeout(scrollBottom, 50)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => loadMembers())
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => loadMembers())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myUserId, loading, roomId])

  // ─── Realtime: solicitacoes para este usuario ─────────────────────────────
  useEffect(() => {
    if (!myUserId || loading) return

    const channel = supabase
      .channel(`room-reqs-${roomId}-${myUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_profile_requests',
        filter: `target_id=eq.${myUserId}`,
      }, async (payload) => {
        const req = payload.new as ProfileRequest
        if (req.room_id !== roomId) return
        // Buscar nickname do solicitante
        const { data: memberRow } = await supabase
          .from('room_members')
          .select('nickname')
          .eq('room_id', roomId)
          .eq('user_id', req.requester_id)
          .single()
        setPendingProfileReqs(prev => [...prev, { ...req, requesterNickname: memberRow?.nickname ?? 'Alguem' }])
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_chat_requests',
        filter: `target_id=eq.${myUserId}`,
      }, async (payload) => {
        const req = payload.new as ChatRequest
        if (req.room_id !== roomId) return
        const { data: memberRow } = await supabase
          .from('room_members')
          .select('nickname')
          .eq('room_id', roomId)
          .eq('user_id', req.requester_id)
          .single()
        setPendingChatReqs(prev => [...prev, { ...req, requesterNickname: memberRow?.nickname ?? 'Alguem' }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myUserId, loading, roomId])

  async function loadMembers() {
    const { data } = await supabase
      .from('room_members')
      .select('room_id, user_id, nickname, joined_at')
      .eq('room_id', roomId)
      .order('joined_at')
    setMembers(data ?? [])
  }

  // ─── Enviar mensagem ──────────────────────────────────────────────────────
  async function sendMessage() {
    const content = text.trim()
    if (!content || sending) return

    // Anti-flood: max 3 mensagens em 10s
    const now = Date.now()
    const recent = msgTimestamps.current.filter(t => now - t < 10_000)
    if (recent.length >= 3) {
      const oldest = recent[0]
      const wait = Math.ceil((10_000 - (now - oldest)) / 1000)
      setFloodWarning(`Aguarde ${wait}s antes de enviar mais mensagens`)
      setTimeout(() => setFloodWarning(''), 3000)
      return
    }

    // Moderacao de conteudo
    const mod = moderateContent(content)
    if (mod.blocked) {
      setModError(getModerationMessage(mod))
      setTimeout(() => setModError(''), 4000)
      if (mod.critical) {
        // Alertar suporte automaticamente
        try {
          await fetch('/api/salas/alertar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, roomName: room?.name, content, matchedWords: mod.matchedWords, context: 'room_chat' }),
          })
        } catch { /* silencioso */ }
      }
      return
    }

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: RoomMessage = {
      id: tempId,
      room_id: roomId,
      sender_id: myUserId,
      nickname: myNickname,
      content,
      is_system: false,
      created_at: new Date().toISOString(),
    }

    setText('')
    setSending(true)
    msgTimestamps.current = [...recent, now]
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(scrollBottom, 50)

    try {
      const { data, error } = await supabase.from('room_messages').insert({
        room_id: roomId,
        sender_id: myUserId,
        nickname: myNickname,
        content,
      }).select('id').single()

      if (error) {
        // Rollback — remove mensagem otimista
        setMessages(prev => prev.filter(m => m.id !== tempId))
      } else if (data) {
        // Trocar id temporario pelo real
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // ─── Sair da sala ─────────────────────────────────────────────────────────
  async function leaveRoom() {
    if (leaving) return
    setLeaving(true)
    try {
      // Mensagem de sistema
      await supabase.from('room_messages').insert({
        room_id: roomId,
        sender_id: myUserId,
        nickname: 'Sistema',
        content: `${myNickname} saiu da sala`,
        is_system: true,
      })
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', myUserId)
    } catch { /* silencioso */ }
    router.push('/salas')
  }

  // ─── Acoes em membros ─────────────────────────────────────────────────────
  async function handleMemberAction(member: RoomMember, action: 'profile' | 'chat' | 'block' | 'mute' | 'friend') {
    if (action === 'friend') {
      try {
        await fetch('/api/amigos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId: member.user_id }),
        })
        setModError('Pedido de amizade enviado!')
        setTimeout(() => setModError(''), 3000)
      } catch { setModError('Erro ao enviar pedido') }
      return
    }

    if (action === 'profile') {
      // Enviar solicitacao de perfil
      try {
        await supabase.from('room_profile_requests').insert({
          room_id: roomId,
          requester_id: myUserId,
          target_id: member.user_id,
          status: 'pending',
        })
        setModError('Solicitacao enviada. Aguarde a resposta.')
        setTimeout(() => setModError(''), 3000)
      } catch { setModError('Erro ao enviar solicitacao') }
      return
    }

    if (action === 'chat') {
      try {
        await supabase.from('room_chat_requests').insert({
          room_id: roomId,
          requester_id: myUserId,
          target_id: member.user_id,
          status: 'pending',
        })
        setModError('Solicitacao de chat enviada.')
        setTimeout(() => setModError(''), 3000)
      } catch { setModError('Erro ao enviar solicitacao') }
      return
    }

    if (action === 'mute') {
      const next = new Set(muted)
      if (next.has(member.user_id)) { next.delete(member.user_id) } else { next.add(member.user_id) }
      setMuted(next)
      localStorage.setItem(`room_muted_${roomId}`, JSON.stringify([...next]))
      return
    }

    if (action === 'block') {
      const next = new Set(blocked)
      next.add(member.user_id)
      setBlocked(next)
      localStorage.setItem(`room_blocks_${roomId}`, JSON.stringify([...next]))
      // Inserir no banco tambem
      try {
        await supabase.from('room_blocks').insert({ room_id: roomId, blocker_id: myUserId, blocked_id: member.user_id })
      } catch { /* silencioso */ }
    }
  }

  // ─── Responder solicitacao de perfil ──────────────────────────────────────
  async function respondProfileReq(req: ProfileRequest, accept: boolean) {
    const status = accept ? 'accepted' : 'rejected'
    try {
      await supabase.from('room_profile_requests').update({ status }).eq('id', req.id)
    } catch { /* */ }
    setPendingProfileReqs(prev => prev.filter(r => r.id !== req.id))

    if (accept) {
      // Revelar perfil real do solicitante
      const { data } = await supabase
        .from('public_profiles')
        .select('id, name, photo_best, city, plan, bio')
        .eq('id', req.requester_id)
        .single()
      if (data) setRevealedProfile(data as PublicProfile)
    }
  }

  // ─── Responder solicitacao de chat ────────────────────────────────────────
  async function respondChatReq(req: ChatRequest, accept: boolean) {
    const status = accept ? 'accepted' : 'rejected'
    try {
      await supabase.from('room_chat_requests').update({ status }).eq('id', req.id)
    } catch { /* */ }
    setPendingChatReqs(prev => prev.filter(r => r.id !== req.id))

    if (accept) {
      // O chat real so acontece apos um match, mas podemos redirecionar para busca/perfil
      router.push(`/perfil/${req.requester_id}`)
    }
  }

  // ─── Formatacao de hora ───────────────────────────────────────────────────
  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // ─── Renderizacao ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(225,29,72,0.3)', borderTop: '3px solid var(--accent)', animation: 'ui-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!room) return null

  const visibleMessages = messages.filter(m => !blocked.has(m.sender_id) && !muted.has(m.sender_id) || m.is_system)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
        <button onClick={() => router.push('/salas')} style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
          <ArrowLeft size={17} strokeWidth={2} />
        </button>
        <div style={{ fontSize: 20, flexShrink: 0 }}>{room.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
            {members.length}/{room.max_members} pessoas
            {room.type === 'black' && <Crown size={10} color="#F59E0B" style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
          </p>
        </div>
        <button
          onClick={() => setShowMembers(true)}
          style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}
        >
          <Users size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={leaveRoom}
          disabled={leaving}
          style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', flexShrink: 0 }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Banners de solicitacao */}
      {pendingProfileReqs.map(req => (
        <div key={req.id} style={{ padding: '10px 14px', backgroundColor: 'rgba(225,29,72,0.08)', borderBottom: '1px solid rgba(225,29,72,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <UserCircle size={18} color="var(--accent)" />
          <p style={{ flex: 1, fontSize: 13, margin: 0, color: 'var(--text)' }}>
            <strong>{req.requesterNickname}</strong> quer ver seu perfil
          </p>
          <button onClick={() => respondProfileReq(req, true)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Check size={14} />
          </button>
          <button onClick={() => respondProfileReq(req, false)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <X size={14} />
          </button>
        </div>
      ))}
      {pendingChatReqs.map(req => (
        <div key={req.id} style={{ padding: '10px 14px', backgroundColor: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <MessageCircle size={18} color="#60a5fa" />
          <p style={{ flex: 1, fontSize: 13, margin: 0, color: 'var(--text)' }}>
            <strong>{req.requesterNickname}</strong> quer conversar em privado
          </p>
          <button onClick={() => respondChatReq(req, true)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Check size={14} />
          </button>
          <button onClick={() => respondChatReq(req, false)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === myUserId
          if (msg.is_system) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 11, color: 'var(--muted-2)', backgroundColor: 'var(--bg-card2)', padding: '3px 10px', borderRadius: 100 }}>{msg.content}</span>
              </div>
            )
          }
          const showNick = !isMe && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id || messages[i - 1]?.is_system)
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {showNick && (
                <span style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 2, marginLeft: 4 }}>{msg.nickname}</span>
              )}
              <div style={{
                maxWidth: '78%', padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                backgroundColor: isMe ? 'var(--accent)' : 'var(--bg-card)',
                border: isMe ? 'none' : '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5, color: isMe ? '#fff' : 'var(--text)', wordBreak: 'break-word' }}>{msg.content}</p>
                <p style={{ fontSize: 10, margin: '2px 0 0', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--muted-2)', textAlign: 'right' }}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Avisos */}
      {(modError || floodWarning) && (
        <div style={{ padding: '8px 14px', backgroundColor: modError.startsWith('Solicitacao') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.15)', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: modError.startsWith('Solicitacao') ? '#10b981' : '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {!modError.startsWith('Solicitacao') && <AlertTriangle size={13} />}
            {modError || floodWarning}
          </p>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--muted-2)', margin: '0 0 6px' }}>
          Voce e <strong style={{ color: 'var(--accent)' }}>{myNickname}</strong> nesta sala
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            rows={1}
            style={{
              flex: 1, padding: '11px 13px', borderRadius: 12, resize: 'none',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              fontFamily: 'var(--font-jakarta)', lineHeight: 1.4,
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              backgroundColor: text.trim() ? 'var(--accent)' : 'var(--bg-card)',
              border: '1px solid var(--border)', cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: text.trim() ? '#fff' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Sheet de membros */}
      {showMembers && (
        <MembersSheet
          members={members}
          myUserId={myUserId}
          myNickname={myNickname}
          onClose={() => setShowMembers(false)}
          onAction={handleMemberAction}
          blocked={blocked}
        />
      )}

      {/* Modal de perfil revelado */}
      {revealedProfile && (
        <ProfileModal profile={revealedProfile} onClose={() => setRevealedProfile(null)} />
      )}
    </div>
  )
}
