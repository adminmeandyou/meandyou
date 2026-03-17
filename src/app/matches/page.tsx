'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { MessageCircle, Heart, Search, Clock, Archive, Loader2 } from 'lucide-react'
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
  const [aba, setAba] = useState<'ativos' | 'arquivados'>('ativos')

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
      const { data, error } = await supabase.rpc('get_my_matches', { p_user_id: uid })
      if (error) throw error
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: 96 }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
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
          {([
            { key: 'ativos' as const, label: 'Ativos', Icon: Heart, count: matches.length },
            { key: 'arquivados' as const, label: 'Arquivados', Icon: Archive, count: 0 },
          ]).map(({ key, label, Icon, count }) => (
            <button
              key={key}
              onClick={() => { haptics.tap(); setAba(key) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 100,
                border: aba === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: aba === key ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: aba === key ? '#fff' : 'rgba(248,249,250,0.50)',
                fontFamily: 'var(--font-jakarta)', fontSize: 13, fontWeight: aba === key ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon size={13} />
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                  background: aba === key ? 'rgba(0,0,0,0.2)' : 'var(--accent)', color: '#fff',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main style={{ padding: '20px 0 0' }}>
        {loading ? (
          <div style={{ padding: '16px 20px' }}>
            <SkeletonList rows={5} />
          </div>

        ) : aba === 'arquivados' ? (
          <EmptyState
            icon={<Archive size={28} />}
            title="Nenhum arquivado"
            description="Voce pode arquivar matches para organizar sua lista."
          />

        ) : matches.length === 0 ? (
          <EmptyState
            icon={<Heart size={28} />}
            title="Nenhum match ainda"
            description="Continue curtindo! Quando alguem curtir de volta, aparece aqui."
            action={{ label: 'Explorar perfis', onClick: () => router.push('/busca') }}
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
                  display: 'flex', gap: 12,
                  overflowX: 'auto', paddingLeft: 20, paddingRight: 20,
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}>
                  {matchesNovos.map(match => (
                    <NovoMatchCard
                      key={match.match_id}
                      match={match}
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
  onIniciarConversa,
  formatTempo,
}: {
  match: Match
  onIniciarConversa: () => void
  formatTempo: (d: string | null) => string
}) {
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at)

  return (
    <button
      onClick={onIniciarConversa}
      style={{
        scrollSnapAlign: 'start', flexShrink: 0, width: 130,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '14px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        cursor: 'pointer', position: 'relative', textAlign: 'center',
      }}
    >
      {expiry && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100,
          background: expiry.urgent ? 'rgba(225,29,72,0.20)' : 'rgba(225,29,72,0.10)',
          color: expiry.urgent ? '#F43F5E' : 'var(--accent)',
          border: `1px solid ${expiry.urgent ? 'rgba(225,29,72,0.35)' : 'var(--accent-border)'}`,
        }}>
          {expiry.label}
        </span>
      )}

      <div style={{
        width: 76, height: 76, borderRadius: '50%',
        overflow: 'hidden', position: 'relative',
        border: '2px solid var(--accent-border)',
        boxShadow: '0 4px 16px rgba(225,29,72,0.18)',
      }}>
        {match.photo_best ? (
          <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="76px" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-fraunces)', fontSize: 24 }}>{match.name[0]}</span>
          </div>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Clock size={9} color="rgba(248,249,250,0.3)" />
          <span style={{ fontSize: 11, color: 'rgba(248,249,250,0.30)' }}>{formatTempo(match.matched_at)}</span>
        </div>
      </div>

      <div style={{
        width: '100%', padding: '7px 0', borderRadius: 10, background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}>
        <MessageCircle size={11} color="#fff" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Conversar</span>
      </div>
    </button>
  )
}

// ─── Item de conversa ─────────────────────────────────────────────────────────

function ConversaItem({ match, formatTempo }: { match: Match; formatTempo: (d: string | null) => string }) {
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at)
  return (
    <Link
      href={`/conversas/${match.conversation_id}`}
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
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
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
              showLastActive={match.show_last_active}
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
