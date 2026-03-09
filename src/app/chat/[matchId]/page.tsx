'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { VideoCallButton } from '@/components/VideoCall'
import Image from 'next/image'
import { ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react'

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const params = useParams()
  const matchId = params.matchId as string
  const router = useRouter()
  const { user } = useAuth()


  const { messages, loading, sending, error, sendMessage, currentUserId } = useChat(matchId)

  const [input, setInput] = useState('')
  const [otherProfile, setOtherProfile] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!matchId || !user) return
    loadOtherProfile()
  }, [matchId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadOtherProfile() {
    const { data: match } = await supabase
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()

    if (!match) return

    const otherId = match.user1 === user!.id ? match.user2 : match.user1

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, photo_best, city')
      .eq('id', otherId)
      .single()

    setOtherProfile(profile)
  }

  async function handleSend() {
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0e0b14] font-jakarta">

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition"
        >
          <ArrowLeft size={20} className="text-white/60" />
        </button>

        {otherProfile && (
          <>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
              {otherProfile.photo_best ? (
                <Image
                  src={otherProfile.photo_best}
                  alt={otherProfile.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm leading-tight">{otherProfile.name}</p>
              <p className="text-white/40 text-xs">{otherProfile.city}</p>
            </div>
            <VideoCallButton matchId={matchId} otherName={otherProfile.name} />
          </>
        )}
      </header>

      {/* ── Mensagens ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-white/30" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-8">
            <p className="text-3xl">👋</p>
            <p className="text-white/50 text-sm">
              Vocês se curtiram! Mande a primeira mensagem para {otherProfile?.name ?? 'essa pessoa'}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const prevMsg = messages[i - 1]
              const showTime =
                !prevMsg ||
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

              return (
                <div key={msg.id}>
                  {showTime && (
                    <p className="text-center text-white/20 text-xs my-3">
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[#b8f542] text-black rounded-br-sm font-medium'
                          : 'bg-white/8 text-white rounded-bl-sm border border-white/5'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </main>

      {/* ── Erro ── */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 text-xs text-red-300">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0e0b14] flex gap-3 items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem…"
          maxLength={500}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#b8f542]/40 transition"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-full bg-[#b8f542] flex items-center justify-center hover:bg-[#a8e030] transition disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin text-black" />
          ) : (
            <Send size={16} className="text-black" />
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}