'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { MessageCircle, Heart, Clock, Loader2, UserPlus, Check } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

type Match = {
  match_id: string
  other_user_id: string
  name: string
  photo_best: string | null
  city: string | null
  state: string | null
  matched_at: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  conversation_id: string | null
  last_active_at?: string | null
  show_last_active?: boolean
}

// Lógica: sem conversa expira em 7 dias, com conversa expira em 14 dias sem interação
function getExpiryInfo(matchedAt: string, lastMessageAt: string | null): { label: string; urgent: boolean } | null {
  const now = Date.now()
  const matchAge = (now - new Date(matchedAt).getTime()) / 3600000 // horas

  if (lastMessageAt === null) {
    // Sem conversa: expiração em 7 dias (168h)
    if (matchAge < 2) return { label: 'Novo', urgent: false }
    const horasRestantes = 168 - matchAge
    if (horasRestantes <= 0) return null // já expirou, cron vai limpar
    if (horasRestantes <= 24) return { label: 'Expira hoje', urgent: true }
    if (horasRestantes <= 48) return { label: `Expira em ${Math.ceil(horasRestantes / 24)}d`, urgent: true }
    return null
  } else {
    // Com conversa: expiração em 14 dias de inatividade (336h)
    const inativo = (now - new Date(lastMessageAt).getTime()) / 3600000
    const horasRestantes = 336 - inativo
    if (horasRestantes <= 0) return null
    if (horasRestantes <= 24) return { label: 'Expira hoje', urgent: true }
    if (horasRestantes <= 48) return { label: `Expira em ${Math.ceil(horasRestantes / 24)}d`, urgent: true }
    return null
  }
}

export default function MatchesPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()
  const [userId, setUserId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadMatches(user.id)

      channel = supabase
        .channel(`matches-page-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          loadMatches(user.id)
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, () => {
          loadMatches(user.id)
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function loadMatches(uid: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_my_matches', { p_user_id: uid })
      // PGRST116 = zero rows — conta nova sem matches, nao e erro real
      if (error && error.code !== 'PGRST116') throw error
      setMatches(data || [])
    } catch {
      setMatches([])
      toast.error('Erro ao carregar matches')
    }
    setLoading(false)
  }

  const matchesNovos = matches.filter(m => !m.conversation_id)
  const matchesComConversa = matches
    .filter(m => !!m.conversation_id)
    .sort((a, b) => {
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
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_a: userId,
      p_user_b: otherUserId,
      p_match_id: matchId,
    })
    if (!error && data) router.push(`/conversas/${data}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: 96 }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, color: 'var(--text)', margin: 0 }}>
              Matches
            </h1>
            {totalUnread > 0 && (
              <span style={{
                minWidth: 22, height: 22, borderRadius: 100,
                background: 'var(--accent)', color: '#fff',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
              }}>
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          {loading && <Loader2 size={18} color="rgba(248,249,250,0.3)" className="animate-spin" />}
        </div>

        {/* Tabs Ativos / Arquivados */}
        <div style={{ display: 'flex', gap: 8 }}>
          {matches.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 100,
            border: '1px solid var(--accent)',
            background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
            color: '#fff',
            fontFamily: 'var(--font-jakarta)', fontSize: 13, fontWeight: 700,
          }}>
            <Heart size={13} />
            Ativos
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: 'rgba(0,0,0,0.2)', color: '#fff' }}>
              {matches.length}
            </span>
          </div>
        )}
        </div>
      </header>

      <main style={{ padding: '20px 0 0' }}>
        {loading ? (
          <div style={{ padding: '16px 20px' }}>
            <SkeletonList rows={5} />
          </div>

        ) : matches.length === 0 ? (
          <EmptyState
            icon={<Heart size={28} />}
            title="Voce nao tem matches ainda"
            description="Va para Modos, interaja com outros perfis e quando alguem curtir de volta o match aparece aqui."
            action={{ label: 'Ir para Modos', onClick: () => router.push('/modos') }}
          />

        ) : (
          <>
            {/* Carrossel de novos matches */}
            {matchesNovos.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Heart size={14} color="var(--accent)" fill="var(--accent)" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,249,250,0.50)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Novos matches
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{matchesNovos.length}</span>
                </div>
                <div style={{
                  display: 'flex', gap: 16,
                  overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 4,
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}>
                  {matchesNovos.map(match => (
                    <NovoMatchCard
                      key={match.match_id}
                      match={match}
                      userId={userId}
                      onIniciarConversa={() => iniciarConversa(match.match_id, match.other_user_id)}
                      formatTempo={formatTempo}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lista de conversas */}
            {matchesComConversa.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', marginBottom: 12 }}>
                  <MessageCircle size={14} color="rgba(248,249,250,0.4)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(248,249,250,0.40)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Conversas
                  </span>
                </div>
                {matchesComConversa.map(match => (
                  <ConversaItem key={match.match_id} match={match} formatTempo={formatTempo} />
                ))}
              </div>
            )}

            {matchesNovos.length === 0 && matchesComConversa.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 12 }}>
                <Heart size={32} color="rgba(248,249,250,0.12)" />
                <p style={{ fontSize: 14, textAlign: 'center', maxWidth: 200, color: 'rgba(248,249,250,0.3)' }}>
                  Todos os matches expiraram. Continue curtindo!
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── Card do carrossel ────────────────────────────────────────────────────────

function NovoMatchCard({
  match,
  userId,
  onIniciarConversa,
  formatTempo,
}: {
  match: Match
  userId: string | null
  onIniciarConversa: () => void
  formatTempo: (d: string | null) => string
}) {
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at)
  const [friendSent, setFriendSent] = useState(false)

  async function handleAddFriend(e: React.MouseEvent) {
    e.stopPropagation()
    if (friendSent || !userId) return
    setFriendSent(true)
    try {
      await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: match.other_user_id }),
      })
    } catch {
      setFriendSent(false)
    }
  }

  return (
    <div
      onClick={onIniciarConversa}
      style={{
        scrollSnapAlign: 'start', flexShrink: 0, width: 80,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Avatar com badge de expiração e botão + */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          border: '2.5px solid var(--accent)',
          boxShadow: '0 0 0 2px rgba(225,29,72,0.15)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="72px" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{match.name[0]}</span>
            </div>
          )}
        </div>

        {/* Botao adicionar amigo — canto inferior direito */}
        <button
          onClick={handleAddFriend}
          style={{
            position: 'absolute', bottom: 0, right: -2,
            width: 22, height: 22, borderRadius: '50%',
            background: friendSent ? '#10b981' : 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)',
            border: `2px solid var(--bg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: friendSent ? 'default' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {friendSent
            ? <Check size={11} color="#fff" strokeWidth={2.5} />
            : <UserPlus size={11} color="rgba(248,249,250,0.7)" strokeWidth={2} />
          }
        </button>

        {/* Badge de expiracao */}
        {expiry && (
          <span style={{
            position: 'absolute', top: -2, left: -2,
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 100,
            background: expiry.urgent ? 'rgba(225,29,72,0.90)' : 'rgba(225,29,72,0.75)',
            color: '#fff',
          }}>
            {expiry.label}
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {match.name}
      </p>
    </div>
  )
}

// ─── Nível de conexão ─────────────────────────────────────────────────────────

function getNivel(matchedAt: string, lastMessageAt: string | null): { label: string; color: string } | null {
  if (!lastMessageAt) return null
  const daysSinceMatch = (Date.now() - new Date(matchedAt).getTime()) / 86400000
  if (daysSinceMatch > 30) return { label: 'História', color: '#F59E0B' }
  if (daysSinceMatch > 7)  return { label: 'Conexão',  color: '#10b981' }
  return { label: 'Sintonia', color: '#60a5fa' }
}

// ─── Item de conversa ─────────────────────────────────────────────────────────

function ConversaItem({ match, formatTempo }: { match: Match; formatTempo: (d: string | null) => string }) {
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at)
  const nivel = getNivel(match.matched_at, match.last_message_at)
  return (
    <Link
      href={`/conversas/${match.match_id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 20px', borderBottom: '1px solid var(--border-soft)',
        textDecoration: 'none',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          background: 'var(--bg-card2)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>{match.name[0]}</span>
            </div>
          )}
        </div>
        {match.unread_count === 0 && (
          <div style={{ position: 'absolute', bottom: 1, right: 1 }}>
            <OnlineIndicator
              lastActiveAt={match.last_active_at}
              showLastActive={match.show_last_active ?? false}
              mode="dot"
              size={12}
            />
          </div>
        )}
        {match.unread_count > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 100,
            background: 'var(--accent)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {match.unread_count > 9 ? '9+' : match.unread_count}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: match.unread_count > 0 ? 700 : 500,
              color: match.unread_count > 0 ? 'var(--text)' : 'rgba(248,249,250,0.80)',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {match.name}
            </p>
            {expiry && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: expiry.urgent ? 'rgba(225,29,72,0.15)' : 'rgba(225,29,72,0.08)',
                color: expiry.urgent ? '#F43F5E' : 'var(--accent)',
                border: `1px solid ${expiry.urgent ? 'rgba(225,29,72,0.30)' : 'var(--accent-border)'}`,
              }}>
                {expiry.label}
              </span>
            )}
            {!expiry && nivel && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: `${nivel.color}18`,
                color: nivel.color,
                border: `1px solid ${nivel.color}35`,
              }}>
                {nivel.label}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.30)', flexShrink: 0, marginLeft: 8 }}>
            {formatTempo(match.last_message_at || match.matched_at)}
          </span>
        </div>
        <p style={{
          fontSize: 13, margin: 0,
          color: match.unread_count > 0 ? 'rgba(248,249,250,0.65)' : 'rgba(248,249,250,0.35)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {match.last_message || 'Iniciar conversa…'}
        </p>
      </div>
    </Link>
  )
}
