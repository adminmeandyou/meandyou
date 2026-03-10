'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Send, Video, MoreVertical,
  Loader2, AlertCircle, Lock, ShieldAlert
} from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  // ✅ campo correto: 'read' boolean, não 'read_at'
  read: boolean
}

interface OtherUser {
  id: string
  name: string
  photo_best: string | null
  verified: boolean
}

const MAX_CHARS = 500
// Rate limit: 5 msgs sem resposta (controlado no useChat hook, aqui só mostra UI)

export default function ChatPage() {
  const params = useParams()
  const matchId = params.id as string
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [rateLimited, setRateLimited] = useState(false)
  const [emergencyModal, setEmergencyModal] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      initChat(user.id)
    })
  }, [matchId])

  async function initChat(uid: string) {
    setLoading(true)

    // Verifica se o match pertence ao usuário
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('id, user1, user2')
      .eq('id', matchId)
      .or(`user1.eq.${uid},user2.eq.${uid}`)
      .single()

    if (matchErr || !match) {
      router.push('/conversas')
      return
    }

    const otherId = match.user1 === uid ? match.user2 : match.user1

    // Busca perfil do outro — sem campos sensíveis
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, photo_best')
      .eq('id', otherId)
      .single()

    // Busca se é verificado (tabela users, coluna verified)
    const { data: userRow } = await supabase
      .from('users')
      .select('verified')
      .eq('id', otherId)
      .single()

    setOtherUser({
      id: otherId,
      name: profile?.name ?? 'Usuário',
      photo_best: profile?.photo_best ?? null,
      // ✅ verified fica em users, não profiles
      verified: userRow?.verified ?? false,
    })

    // Carrega mensagens
    await loadMessages(uid)

    // Marca mensagens recebidas como lidas
    await marcarComoLidas(uid)

    // Realtime: escuta novas mensagens deste match
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => [...prev, newMsg])
        // Se a mensagem é do outro, marca como lida automaticamente
        if (newMsg.sender_id !== uid) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMsg.id)
        }
        scrollToBottom()
      })
      .subscribe()

    setLoading(false)
    scrollToBottom()

    return () => { supabase.removeChannel(channel) }
  }

  async function loadMessages(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(100)

    setMessages(data || [])
  }

  async function marcarComoLidas(uid: string) {
    // ✅ CORREÇÃO: campo 'read' boolean (não 'read_at')
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', uid)
      .eq('read', false)
  }

  function scrollToBottom() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  // ✅ Rate limit local: 5 msgs seguidas sem resposta bloqueiam envio
  function checkRateLimit(): boolean {
    if (!userId) return false
    const minhas = messages.filter(m => m.sender_id === userId)
    const ultimas = [...messages].reverse()
    let seguidas = 0
    for (const m of ultimas) {
      if (m.sender_id === userId) seguidas++
      else break // houve resposta do outro — reseta contagem
    }
    return seguidas >= 5
  }

  async function handleSend() {
    const texto = input.trim()
    if (!texto || !userId || sending) return
    if (texto.length > MAX_CHARS) { setError(`Máximo ${MAX_CHARS} caracteres.`); return }

    if (checkRateLimit()) {
      setRateLimited(true)
      setError('Aguarde uma resposta antes de enviar mais mensagens.')
      return
    }

    setSending(true)
    setError('')
    setRateLimited(false)
    setInput('')

    const { error: sendErr } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: userId,
        content: texto,
        // ✅ read começa false — o outro ainda não leu
        read: false,
      })

    if (sendErr) {
      setError('Erro ao enviar mensagem. Tente novamente.')
      setInput(texto) // restaura o texto se falhar
    }

    setSending(false)
    inputRef.current?.focus()
    scrollToBottom()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Agrupa mensagens por data
  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  // Renderiza mensagens com separadores de data
  function renderMessages() {
    const items: React.ReactNode[] = []
    let lastDate = ''

    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.created_at)
      if (dateLabel !== lastDate) {
        lastDate = dateLabel
        items.push(
          <div key={`date-${msg.id}`} className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 px-2">{dateLabel}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )
      }

      const isMe = msg.sender_id === userId
      items.push(
        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
          <div
            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isMe
                ? 'bg-[#b8f542] text-black rounded-br-sm'
                : 'bg-white/10 text-white rounded-bl-sm'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-black/40' : 'text-white/30'}`}>
              <span className="text-[10px]">
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {/* ✅ checkmark de lido — só para minhas mensagens */}
              {isMe && (
                <span className={`text-[10px] ${msg.read ? 'text-blue-400' : ''}`}>
                  {msg.read ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    })

    return items
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0e0b14] flex flex-col font-jakarta">

      {/* ── Header ── */}
      <header className="shrink-0 bg-[#0e0b14]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.push('/conversas')} className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft size={20} className="text-white/60" />
        </button>

        {/* Avatar clicável → perfil */}
        <Link href={`/perfil/${otherUser?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            {otherUser?.photo_best ? (
              <Image src={otherUser.photo_best} alt={otherUser.name} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 font-fraunces">
                {otherUser?.name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {otherUser?.name}
              {otherUser?.verified && (
                <span className="ml-1.5 text-[#b8f542] text-xs">✓</span>
              )}
            </p>
            <p className="text-xs text-white/30">Toque para ver perfil</p>
          </div>
        </Link>

        {/* Botão de videochamada */}
        <button
          onClick={() => router.push(`/videochamada/${matchId}`)}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#b8f542]/10 hover:border-[#b8f542]/30 transition"
          title="Iniciar videochamada"
        >
          <Video size={16} className="text-white/60" />
        </button>

        {/* Botão de emergência oculto */}
        <button
          onClick={() => setEmergencyModal(true)}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/30 transition"
          title="Emergência"
        >
          <ShieldAlert size={16} className="text-white/20 hover:text-red-400" />
        </button>

        <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <MoreVertical size={16} className="text-white/60" />
        </button>
      </header>

      {/* ── Modal de Emergência ── */}
      {emergencyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setEmergencyModal(false)}
        >
          <div
            className="bg-[#1a0a0a] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} className="text-red-400" />
            </div>
            <h3 className="text-white font-fraunces text-xl font-bold mb-2">Você está em perigo?</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Esta ação ligará imediatamente para a <strong className="text-white/70">Polícia Militar (190)</strong>. Use apenas em situações de risco real.
            </p>
            <a
              href="tel:190"
              className="block w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base transition mb-3"
            >
              Ligar 190 agora
            </a>
            <button
              onClick={() => setEmergencyModal(false)}
              className="block w-full py-3 text-white/30 text-sm hover:text-white/60 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Aviso de privacidade ── */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-2 text-white/20 text-[11px]">
        <Lock size={10} />
        Conversa privada — respeite os limites
      </div>

      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 relative">
              {otherUser?.photo_best && (
                <Image src={otherUser.photo_best} alt="" fill className="object-cover" sizes="64px" />
              )}
            </div>
            <p className="text-sm text-center">
              Vocês fizeram um match! 🎉<br />
              <span className="text-xs text-white/20">Seja o(a) primeiro(a) a dizer olá.</span>
            </p>
          </div>
        ) : (
          <>
            {renderMessages()}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Erro / rate limit ── */}
      {(error || rateLimited) && (
        <div className="shrink-0 mx-4 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error || 'Aguarde uma resposta antes de enviar mais mensagens.'}</p>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 bg-[#0e0b14]/95 backdrop-blur border-t border-white/5 px-4 py-3">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (error) setError('')
                if (rateLimited) setRateLimited(false)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma mensagem..."
              maxLength={MAX_CHARS}
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#b8f542]/40 transition resize-none overflow-hidden"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            {input.length > MAX_CHARS * 0.8 && (
              <span className={`absolute bottom-2 right-3 text-[10px] ${input.length >= MAX_CHARS ? 'text-red-400' : 'text-white/30'}`}>
                {input.length}/{MAX_CHARS}
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || input.length > MAX_CHARS}
            className="w-11 h-11 rounded-full bg-[#b8f542] flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition active:scale-90"
          >
            {sending
              ? <Loader2 size={18} className="animate-spin text-black" />
              : <Send size={18} className="text-black" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
