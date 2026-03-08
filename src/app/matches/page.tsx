'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { MessageCircle, Heart, Search, Loader2, Clock } from 'lucide-react'

type Match = {
  match_id: string
  other_user_id: string
  name: string
  photo_best: string | null
  city: string | null
  state: string | null
  matched_at: string
  // última mensagem (se houver conversa)
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  conversation_id: string | null
}

export default function MatchesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'novos' | 'conversas'>('novos')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadMatches(user.id)
    })
  }, [])

  async function loadMatches(uid: string) {
    setLoading(true)
    try {
      // Busca matches: curtidas mútuas entre from_user e to_user
      // ✅ usa from_user/to_user (não user_id) conforme regra da tabela likes
      const { data, error } = await supabase.rpc('get_my_matches', {
        p_user_id: uid,
      })

      if (error) throw error
      setMatches(data || [])
    } catch {
      setMatches([])
    }
    setLoading(false)
  }

  // Separa matches sem conversa (novos) dos que já têm conversa
  const matchesNovos = matches.filter(m => !m.conversation_id)
  const matchesComConversa = matches.filter(m => !!m.conversation_id)
    .sort((a, b) => {
      // Ordena por última mensagem mais recente
      const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : new Date(a.matched_at).getTime()
      const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : new Date(b.matched_at).getTime()
      return dateB - dateA
    })

  const totalUnread = matches.reduce((sum, m) => sum + (m.unread_count || 0), 0)

  function formatTempo(dateStr: string | null): string {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m`
    if (hrs < 24) return `${hrs}h`
    if (days < 7) return `${days}d`
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  async function iniciarConversa(matchId: string, otherUserId: string) {
    if (!userId) return
    // Cria ou busca conversa existente via RPC
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_a: userId,
      p_user_b: otherUserId,
      p_match_id: matchId,
    })
    if (!error && data) {
      router.push(`/conversas/${data}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] text-white font-jakarta pb-24">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-fraunces text-2xl">
            Matches
            {totalUnread > 0 && (
              <span className="ml-2 text-sm font-normal text-[#b8f542]">{totalUnread} não lidas</span>
            )}
          </h1>
          {loading && <Loader2 size={18} className="animate-spin text-white/30" />}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          <button
            onClick={() => setAba('novos')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition ${
              aba === 'novos'
                ? 'bg-[#b8f542] text-black border-[#b8f542] font-semibold'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            <Heart size={13} />
            Novos
            {matchesNovos.length > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${aba === 'novos' ? 'bg-black/20' : 'bg-[#b8f542] text-black'}`}>
                {matchesNovos.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAba('conversas')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition ${
              aba === 'conversas'
                ? 'bg-[#b8f542] text-black border-[#b8f542] font-semibold'
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            <MessageCircle size={13} />
            Conversas
            {totalUnread > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${aba === 'conversas' ? 'bg-black/20' : 'bg-[#b8f542] text-black'}`}>
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="px-4 pt-4">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/30">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Carregando seus matches…</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
            <Heart size={40} className="opacity-30" />
            <div className="text-center">
              <p className="text-base font-medium text-white/50">Nenhum match ainda</p>
              <p className="text-sm mt-1 max-w-[220px]">Continue curtindo! Quando alguém curtir de volta, aparece aqui.</p>
            </div>
            <Link href="/busca" className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b8f542] text-black text-sm font-semibold">
              <Search size={14} /> Explorar perfis
            </Link>
          </div>
        ) : (
          <>
            {/* ── ABA NOVOS ── */}
            {aba === 'novos' && (
              <>
                {matchesNovos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
                    <Heart size={32} />
                    <p className="text-sm text-center max-w-[200px]">
                      Nenhum match novo. Todos já têm conversa em andamento!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-white/30 mb-4 uppercase tracking-widest">
                      {matchesNovos.length} novo{matchesNovos.length !== 1 ? 's' : ''} match{matchesNovos.length !== 1 ? 'es' : ''}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {matchesNovos.map((match) => (
                        <NovoMatchCard
                          key={match.match_id}
                          match={match}
                          onIniciarConversa={() => iniciarConversa(match.match_id, match.other_user_id)}
                          formatTempo={formatTempo}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── ABA CONVERSAS ── */}
            {aba === 'conversas' && (
              <>
                {matchesComConversa.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
                    <MessageCircle size={32} />
                    <p className="text-sm text-center max-w-[200px]">
                      Nenhuma conversa ainda. Inicie uma conversa com seus matches!
                    </p>
                    <button onClick={() => setAba('novos')} className="text-[#b8f542] text-xs underline mt-1">
                      Ver matches novos
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {matchesComConversa.map((match) => (
                      <ConversaItem
                        key={match.match_id}
                        match={match}
                        formatTempo={formatTempo}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Cards de novo match ──────────────────────────────────────────────────────

function NovoMatchCard({
  match,
  onIniciarConversa,
  formatTempo,
}: {
  match: Match
  onIniciarConversa: () => void
  formatTempo: (d: string | null) => string
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 aspect-[3/4]">
      {/* Foto */}
      {match.photo_best ? (
        <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="50vw" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#b8f542]/10 to-transparent flex items-center justify-center text-5xl text-white/20">?</div>
      )}

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Badge novo match */}
      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#b8f542] text-black text-[10px] font-bold">
          <Heart size={9} fill="black" /> Match!
        </span>
      </div>

      {/* Tempo */}
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1 text-white/40 text-[10px]">
          <Clock size={9} /> {formatTempo(match.matched_at)}
        </span>
      </div>

      {/* Info + botão */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="font-fraunces font-semibold text-sm leading-tight mb-2">{match.name}</p>
        <button
          onClick={onIniciarConversa}
          className="w-full py-2 rounded-xl bg-[#b8f542] text-black text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <MessageCircle size={12} /> Iniciar conversa
        </button>
      </div>
    </div>
  )
}

// ─── Item de conversa ─────────────────────────────────────────────────────────

function ConversaItem({
  match,
  formatTempo,
}: {
  match: Match
  formatTempo: (d: string | null) => string
}) {
  return (
    <Link
      href={`/conversas/${match.conversation_id}`}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition"
    >
      {/* Avatar */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        {match.photo_best ? (
          <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xl">?</div>
        )}
        {/* Indicador de não lidas */}
        {match.unread_count > 0 && (
          <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#b8f542] border-2 border-[#0e0b14] flex items-center justify-center">
            <span className="text-[8px] font-bold text-black">{match.unread_count > 9 ? '9+' : match.unread_count}</span>
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm font-semibold truncate ${match.unread_count > 0 ? 'text-white' : 'text-white/80'}`}>
            {match.name}
          </p>
          <span className="text-xs text-white/30 flex-shrink-0 ml-2">
            {formatTempo(match.last_message_at || match.matched_at)}
          </span>
        </div>
        <p className={`text-xs truncate ${match.unread_count > 0 ? 'text-white/70' : 'text-white/40'}`}>
          {match.last_message || 'Iniciar conversa…'}
        </p>
      </div>
    </Link>
  )
}
