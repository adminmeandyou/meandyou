'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { MessageCircle, Heart, Loader2, UserPlus, Check, User, HeartCrack, ShieldAlert, Archive, X } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { OnlineIndicator } from '@/components/OnlineIndicator'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { playSoundDirect } from '@/hooks/useSounds'
import { ReportModal } from '@/components/ReportModal'

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
  is_friend?: boolean
}

// Lógica: sem conversa expira em 7 dias, com conversa expira em 14 dias sem interação
// Amigos (is_friend = true) nunca expiram
function getExpiryInfo(matchedAt: string, lastMessageAt: string | null, isFriend?: boolean): { label: string; urgent: boolean } | null {
  if (isFriend) return null // amigos nunca expiram

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
  const [actionsFor, setActionsFor] = useState<Match | null>(null)
  const [reportFor, setReportFor] = useState<{ id: string; name: string } | null>(null)
  const [unmatchConfirm, setUnmatchConfirm] = useState(false)

  async function actionAddFriend(m: Match) {
    if (!userId) return
    try {
      const res = await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: m.other_user_id }),
      })
      if (res.ok) toast.success('Solicitação enviada')
      else toast.error('Erro ao enviar solicitação')
    } catch { toast.error('Erro ao enviar solicitação') }
    setActionsFor(null)
  }

  async function actionUnmatch(m: Match) {
    try {
      await supabase.from('matches').update({ status: 'blocked' }).eq('id', m.match_id)
      toast.success('Match desfeito')
      if (userId) loadMatches(userId)
    } catch { toast.error('Erro ao desfazer') }
    setUnmatchConfirm(false)
    setActionsFor(null)
  }

  function actionVerPerfil(m: Match) {
    setActionsFor(null)
    router.push(`/perfil/${m.other_user_id}`)
  }

  function actionAvaliar(m: Match) {
    setActionsFor(null)
    router.push(`/conversas/${m.match_id}?avaliar=1`)
  }

  function actionReport(m: Match) {
    setActionsFor(null)
    setReportFor({ id: m.other_user_id, name: m.name })
  }

  function actionArquivar() {
    setActionsFor(null)
    toast.info('Arquivamento em breve')
  }

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
      const [matchesRes, friendsRes] = await Promise.all([
        supabase.rpc('get_my_matches', { p_user_id: uid }),
        fetch('/api/amigos').then(r => r.ok ? r.json() : { friends: [] }).catch(() => ({ friends: [] })),
      ])
      // PGRST116 = zero rows — conta nova sem matches, nao e erro real
      if (matchesRes.error && matchesRes.error.code !== 'PGRST116') throw matchesRes.error
      const friendIds = new Set(
        (friendsRes.friends ?? []).map((f: any) =>
          f.requester_id === uid ? f.receiver_id : f.requester_id
        )
      )
      const enriched = (matchesRes.data || []).map((m: Match) => ({
        ...m,
        is_friend: friendIds.has(m.other_user_id),
      }))
      setMatches(enriched)
    } catch {
      setMatches([])
      toast.error('Erro ao carregar matches.')
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
    <div style={{
      minHeight: '100vh',
      background: '#08090E',
      fontFamily: 'var(--font-jakarta)',
      paddingBottom: 96,
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '18px 20px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}>
          <h1 style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: 22,
            fontWeight: 700,
            color: '#F8F9FA',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Matches
          </h1>
          {totalUnread > 0 && (
            <span style={{
              minWidth: 20, height: 20, borderRadius: 100,
              background: '#E11D48', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
            }}>
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
          {loading && (
            <span style={{ position: 'absolute', right: 0 }}>
              <Loader2 size={16} color="rgba(248,249,250,0.3)" className="animate-spin" />
            </span>
          )}
        </div>
      </header>

      <main style={{ padding: '24px 0 0' }}>
        {loading ? (
          <div style={{ padding: '0 20px' }}>
            <SkeletonList rows={5} />
          </div>

        ) : matches.length === 0 ? (
          /* ── Empty state ── */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '72vh', padding: '40px 32px',
            textAlign: 'center',
          }}>
            {/* Coração grande */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(225,29,72,0.12) 0%, rgba(225,29,72,0.04) 100%)',
              border: '1.5px solid rgba(225,29,72,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 32,
              boxShadow: '0 0 60px rgba(225,29,72,0.10), 0 0 0 24px rgba(225,29,72,0.03)',
            }}>
              <Heart
                size={40}
                color="#E11D48"
                fill="#E11D48"
                strokeWidth={0}
              />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 28,
              fontWeight: 700,
              color: '#F8F9FA',
              margin: '0 0 14px',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
            }}>
              Você não tem<br />matches ainda
            </h2>
            <p style={{
              color: 'rgba(248,249,250,0.50)',
              fontSize: 14,
              lineHeight: 1.7,
              margin: '0 0 36px',
              maxWidth: 260,
            }}>
              Sua jornada para encontrar conexões profundas está apenas começando. Que tal explorar novos horizontes?
            </p>
            <button
              onClick={() => router.push('/modos')}
              style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
                color: '#fff',
                fontWeight: 700,
                padding: '14px 36px',
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-jakarta)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 8px 28px rgba(225,29,72,0.30)',
                transition: 'all 0.2s ease',
              }}
            >
              Ir para Modos
            </button>
          </div>

        ) : (
          <>
            {/* Carrossel de novos matches */}
            {matchesNovos.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Heart size={13} color="#E11D48" fill="#E11D48" strokeWidth={0} />
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: 'rgba(248,249,250,0.40)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.10em',
                    }}>
                      Novos matches
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#E11D48',
                    background: 'rgba(225,29,72,0.10)',
                    border: '1px solid rgba(225,29,72,0.18)',
                    borderRadius: 100,
                    padding: '2px 8px',
                  }}>
                    {matchesNovos.length}
                  </span>
                </div>
                <div style={{
                  display: 'flex', gap: 20,
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
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0 20px', marginBottom: 14,
                }}>
                  <MessageCircle size={13} color="rgba(248,249,250,0.30)" strokeWidth={1.5} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'rgba(248,249,250,0.30)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                  }}>
                    Conversas
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
                  {matchesComConversa.map(match => (
                    <ConversaItem
                      key={match.match_id}
                      match={match}
                      formatTempo={formatTempo}
                      onLongPress={(m) => { haptics.medium(); setActionsFor(m); setUnmatchConfirm(false) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {matchesNovos.length === 0 && matchesComConversa.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 20px', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Heart size={24} color="rgba(248,249,250,0.12)" strokeWidth={1.5} />
                </div>
                <p style={{
                  fontSize: 14, textAlign: 'center', maxWidth: 220,
                  color: 'rgba(248,249,250,0.25)',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  Todos os matches expiraram. Continue curtindo!
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Action Sheet (long-press) ── */}
      {actionsFor && (
        <div
          onClick={() => { setActionsFor(null); setUnmatchConfirm(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,9,14,0.75)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: 'ui-fade-in 0.18s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 430,
              background: 'rgba(15,17,23,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: '12px 12px calc(24px + env(safe-area-inset-bottom))',
              animation: 'ui-slide-up 0.22s ease',
            }}
          >
            {/* handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '4px auto 14px' }} />

            {/* título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#13161F', border: '1px solid rgba(255,255,255,0.06)' }}>
                {actionsFor.photo_best ? (
                  <Image src={actionsFor.photo_best} alt={actionsFor.name} fill className="object-cover" sizes="44px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-fraunces)', fontSize: 18 }}>{actionsFor.name[0]}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 700, color: '#F8F9FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actionsFor.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(248,249,250,0.40)' }}>Escolha uma ação</p>
              </div>
              <button onClick={() => { setActionsFor(null); setUnmatchConfirm(false) }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <X size={16} color="rgba(248,249,250,0.6)" strokeWidth={1.5} />
              </button>
            </div>

            {unmatchConfirm ? (
              <div style={{ padding: '12px' }}>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(248,249,250,0.70)', lineHeight: 1.5, textAlign: 'center' }}>
                  Desfazer o match com <strong style={{ color: '#F8F9FA' }}>{actionsFor.name}</strong>? Essa ação não pode ser desfeita.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setUnmatchConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.75)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Cancelar</button>
                  <button onClick={() => actionUnmatch(actionsFor)} style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#E11D48', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Desfazer</button>
                </div>
              </div>
            ) : (
              <>
                {[
                  { icon: <User size={18} strokeWidth={1.5} />, label: 'Ver perfil', onClick: () => actionVerPerfil(actionsFor) },
                  { icon: <UserPlus size={18} strokeWidth={1.5} />, label: 'Adicionar como amigo', onClick: () => actionAddFriend(actionsFor) },
                  { icon: <MessageCircle size={18} strokeWidth={1.5} />, label: 'Avaliar conversa', onClick: () => actionAvaliar(actionsFor) },
                  { icon: <Archive size={18} strokeWidth={1.5} />, label: 'Arquivar conversa', onClick: () => actionArquivar() },
                  { icon: <ShieldAlert size={18} strokeWidth={1.5} />, label: 'Reportar', onClick: () => actionReport(actionsFor), danger: true },
                  { icon: <HeartCrack size={18} strokeWidth={1.5} />, label: 'Desfazer match', onClick: () => setUnmatchConfirm(true), danger: true },
                ].map((item, i) => (
                  <button key={i} onClick={item.onClick} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 12px', borderRadius: 12, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: item.danger ? '#F43F5E' : 'rgba(248,249,250,0.85)',
                    fontFamily: 'var(--font-jakarta)', fontSize: 14, fontWeight: 600,
                    textAlign: 'left',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: item.danger ? 'rgba(225,29,72,0.10)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${item.danger ? 'rgba(225,29,72,0.20)' : 'rgba(255,255,255,0.06)'}`,
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    {item.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportFor && (
        <ReportModal
          reportedId={reportFor.id}
          reportedName={reportFor.name}
          onClose={() => setReportFor(null)}
        />
      )}
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
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at, match.is_friend)
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
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      {/* Avatar com badge de expiração e botão + */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          border: '2px solid #E11D48',
          boxShadow: '0 0 0 3px rgba(225,29,72,0.12), 0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="72px" />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1a0a14 0%, #3d1530 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(248,249,250,0.7)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>
                {match.name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Botao adicionar amigo — canto inferior direito (esconde se ja e amigo) */}
        {!match.is_friend && (
        <button
          onClick={handleAddFriend}
          style={{
            position: 'absolute', bottom: 0, right: -2,
            width: 22, height: 22, borderRadius: '50%',
            background: friendSent ? '#10b981' : 'rgba(15,17,23,0.95)',
            border: `2px solid #08090E`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: friendSent ? 'default' : 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {friendSent
            ? <Check size={11} color="#fff" strokeWidth={2.5} />
            : <UserPlus size={11} color="rgba(248,249,250,0.7)" strokeWidth={2} />
          }
        </button>
        )}

        {/* Badge amigo */}
        {match.is_friend && (
          <span style={{
            position: 'absolute', top: -3, left: -3,
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 100,
            background: '#10b981',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(16,185,129,0.30)',
          }}>
            Amigo
          </span>
        )}

        {/* Badge de expiracao */}
        {!match.is_friend && expiry && (
          <span style={{
            position: 'absolute', top: -3, left: -3,
            fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 100,
            background: expiry.urgent ? '#E11D48' : 'rgba(225,29,72,0.80)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(225,29,72,0.30)',
          }}>
            {expiry.label}
          </span>
        )}
      </div>

      <p style={{
        fontSize: 12, fontWeight: 600,
        color: 'rgba(248,249,250,0.85)',
        margin: 0,
        maxWidth: 76,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
        fontFamily: 'var(--font-fraunces)',
      }}>
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

function ConversaItem({ match, formatTempo, onLongPress }: { match: Match; formatTempo: (d: string | null) => string; onLongPress: (m: Match) => void }) {
  const router = useRouter()
  const expiry = getExpiryInfo(match.matched_at, match.last_message_at, match.is_friend)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  function startPress() {
    triggered.current = false
    pressTimer.current = setTimeout(() => {
      triggered.current = true
      onLongPress(match)
    }, 500)
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }
  function handleClick() {
    if (triggered.current) return
    playSoundDirect('tap')
    router.push(`/conversas/${match.match_id}`)
  }

  return (
    <div
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => { e.preventDefault(); triggered.current = true; onLongPress(match) }}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(15,17,23,0.60)',
        border: '1px solid rgba(255,255,255,0.04)',
        textDecoration: 'none',
        transition: 'background 0.15s ease',
        cursor: 'pointer', userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #13161F 0%, #0F1117 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>
          {match.photo_best ? (
            <Image src={match.photo_best} alt={match.name} fill className="object-cover" sizes="56px" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-fraunces)', fontSize: 22 }}>
                {match.name[0]}
              </span>
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
            background: '#E11D48', border: '2px solid #08090E',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            boxShadow: '0 2px 8px rgba(225,29,72,0.40)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {match.unread_count > 9 ? '9+' : match.unread_count}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-fraunces)',
              fontSize: 15,
              fontWeight: match.unread_count > 0 ? 700 : 600,
              color: match.unread_count > 0 ? '#F8F9FA' : 'rgba(248,249,250,0.80)',
              margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {match.name}
            </p>
            {match.is_friend && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: 'rgba(16,185,129,0.12)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                Amigo
              </span>
            )}
            {!match.is_friend && expiry && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, flexShrink: 0,
                background: expiry.urgent ? 'rgba(225,29,72,0.15)' : 'rgba(225,29,72,0.08)',
                color: expiry.urgent ? '#F43F5E' : '#E11D48',
                border: `1px solid ${expiry.urgent ? 'rgba(225,29,72,0.30)' : 'rgba(225,29,72,0.15)'}`,
              }}>
                {expiry.label}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11,
            color: 'rgba(248,249,250,0.25)',
            flexShrink: 0, marginLeft: 8,
          }}>
            {formatTempo(match.last_message_at || match.matched_at)}
          </span>
        </div>
        <p style={{
          fontSize: 13, margin: 0,
          color: match.unread_count > 0 ? 'rgba(248,249,250,0.60)' : 'rgba(248,249,250,0.30)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {(() => {
            const msg = match.last_message
            if (!msg) return 'Iniciar conversa...'
            if (msg === '__NUDGE__') return 'Chamou sua atenção'
            if (msg.startsWith('__CONVITE__:')) return 'Convite de encontro'
            if (msg.startsWith('__MEETING__:')) return 'Convite de encontro'
            return msg
          })()}
        </p>
      </div>
    </div>
  )
}
