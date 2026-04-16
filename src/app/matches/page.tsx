'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { MessageCircle, Heart, Loader2, UserPlus, Check, User, HeartCrack, ShieldAlert, Archive, X, UserCircle, Clock, Users, CalendarHeart, MapPin, CalendarCheck, RefreshCw, PartyPopper } from 'lucide-react'
import { SkeletonList } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { playSoundDirect } from '@/hooks/useSounds'
import { ReportModal } from '@/components/ReportModal'

import { Match, Friendship, MeetingInvite, isFriendOnline, formatTempo, formatMeetingDate } from './_components/helpers'
import { NovoMatchCard } from './_components/NovoMatchCard'
import { ConversaItem } from './_components/ConversaItem'
import { FriendRowInline } from './_components/FriendRowInline'
import { MeetingCard } from './_components/MeetingCard'

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

  // Aba principal
  const [pageTab, setPageTab] = useState<'matches' | 'encontros' | 'amigos'>('matches')

  // Encontros
  const [meetings, setMeetings] = useState<MeetingInvite[]>([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const [meetingsLoaded, setMeetingsLoaded] = useState(false)
  const [meetingTab, setMeetingTab] = useState<'ativos' | 'historico'>('ativos')
  const [meetingAction, setMeetingAction] = useState<{ invite: MeetingInvite; type: 'cancel' | 'reschedule' | 'decline' } | null>(null)
  const [rescheduleNote, setRescheduleNote] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleLocal, setRescheduleLocal] = useState('')
  const [meetingActionLoading, setMeetingActionLoading] = useState(false)
  const [acceptedPopup, setAcceptedPopup] = useState<MeetingInvite | null>(null)

  // Amigos
  const [friendsList, setFriendsList] = useState<Friendship[]>([])
  const [friendsPending, setFriendsPending] = useState<Friendship[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsLoaded, setFriendsLoaded] = useState(false)
  const [friendTab, setFriendTab] = useState<'amigos' | 'pendentes'>('amigos')
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null)

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

  // ── Funções de amigos ──
  async function loadFriends() {
    setFriendsLoading(true)
    try {
      const res = await fetch('/api/amigos')
      if (res.ok) {
        const data = await res.json()
        setFriendsList(data.friends ?? [])
        setFriendsPending(data.pending ?? [])
      }
    } catch { /* silencioso */ }
    setFriendsLoading(false)
    setFriendsLoaded(true)
  }

  async function friendRespond(friendshipId: string, action: 'accept' | 'decline') {
    setFriendActionLoading(friendshipId)
    try {
      const res = await fetch('/api/amigos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      })
      if (res.ok) await loadFriends()
    } catch { /* silencioso */ }
    setFriendActionLoading(null)
  }

  async function friendRemove(friendshipId: string) {
    setFriendActionLoading(friendshipId)
    try {
      const res = await fetch('/api/amigos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action: 'remove' }),
      })
      if (res.ok) await loadFriends()
    } catch { /* silencioso */ }
    setFriendActionLoading(null)
  }

  // ── Funções de encontros ──
  async function loadMeetings() {
    setMeetingsLoading(true)
    try {
      const res = await fetch('/api/meeting/invite')
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.invites ?? [])
      }
    } catch { /* silencioso */ }
    setMeetingsLoading(false)
    setMeetingsLoaded(true)
  }

  async function handleMeetingAction(inviteId: string, action: string, extra?: Record<string, string>) {
    setMeetingActionLoading(true)
    try {
      const res = await fetch('/api/meeting/invite', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, action, ...extra }),
      })
      if (res.ok) {
        if (action === 'accepted') {
          // Busca o convite atualizado pra mostrar popup
          const inv = meetings.find(m => m.id === inviteId)
          if (inv) {
            setAcceptedPopup({ ...inv, status: 'accepted' })
            playSoundDirect('match')
            haptics.success()
          }
        } else {
          toast.success(
            action === 'cancelled' ? 'Encontro cancelado' :
            action === 'declined' ? 'Convite recusado' :
            action === 'rescheduled' ? 'Reagendamento solicitado' : 'Feito'
          )
        }
        await loadMeetings()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Erro ao processar')
      }
    } catch { toast.error('Erro de conexão') }
    setMeetingActionLoading(false)
    setMeetingAction(null)
    setRescheduleNote('')
    setRescheduleDate('')
    setRescheduleLocal('')
  }

  const meetingsAtivos = meetings.filter(m => m.status === 'pending' || m.status === 'accepted')
  const meetingsHistorico = meetings.filter(m => m.status === 'declined' || m.status === 'rescheduled' || m.status === 'cancelled')
  const meetingsPendingCount = meetings.filter(m => m.status === 'pending' && !m.is_proposer).length

  // Carregar encontros quando trocar pra aba
  useEffect(() => {
    if (pageTab === 'encontros' && !meetingsLoaded) loadMeetings()
  }, [pageTab])

  // Carregar amigos quando trocar pra aba
  useEffect(() => {
    if (pageTab === 'amigos' && !friendsLoaded) loadFriends()
  }, [pageTab])

  const onlineFriends = friendsList.filter(f => isFriendOnline(f.other?.last_seen ?? null))
  const offlineFriends = friendsList.filter(f => !isFriendOnline(f.other?.last_seen ?? null))
  const receivedPending = friendsPending.filter(f => f.receiver_id === userId)
  const sentPending = friendsPending.filter(f => f.requester_id === userId)

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_invites' }, () => {
          if (meetingsLoaded) loadMeetings()
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

      {/* ── Tabs: Matches / Amigos ── */}
      <div style={{
        display: 'flex', gap: 0,
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(8,9,14,0.92)',
        position: 'sticky', top: 61, zIndex: 29,
      }}>
        {([
          { key: 'matches' as const, label: 'Matches', icon: <Heart size={14} strokeWidth={1.5} /> },
          { key: 'encontros' as const, label: 'Encontros', icon: <CalendarHeart size={14} strokeWidth={1.5} />, badge: meetingsPendingCount },
          { key: 'amigos' as const, label: 'Amigos', icon: <Users size={14} strokeWidth={1.5} />, badge: receivedPending.length },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setPageTab(t.key)}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              borderBottom: pageTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: pageTab === t.key ? '#F8F9FA' : 'rgba(248,249,250,0.35)',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-jakarta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {t.icon}
            {t.label}
            {t.badge && t.badge > 0 ? (
              <span style={{
                minWidth: 16, height: 16, borderRadius: 100,
                background: '#E11D48', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>
                {t.badge > 9 ? '9+' : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <main style={{ padding: '24px 0 0' }}>
        {/* ═══ Aba Matches ═══ */}
        {pageTab === 'matches' && (<>
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
        </>)}

        {/* ═══ Aba Encontros ═══ */}
        {pageTab === 'encontros' && (
          <div style={{ padding: '0 16px' }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {([
                { key: 'ativos' as const, label: `Ativos (${meetingsAtivos.length})` },
                { key: 'historico' as const, label: `Histórico (${meetingsHistorico.length})` },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setMeetingTab(t.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 100,
                    border: `1px solid ${meetingTab === t.key ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                    backgroundColor: meetingTab === t.key ? 'rgba(225,29,72,0.12)' : 'transparent',
                    color: meetingTab === t.key ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 13, fontWeight: meetingTab === t.key ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {meetingsLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} style={{ height: 96, borderRadius: 14, backgroundColor: 'var(--bg-card)', marginBottom: 8, animation: 'ui-pulse 1.5s ease infinite' }} />
              ))
            ) : (
              <>
                {/* Ativos */}
                {meetingTab === 'ativos' && (
                  <>
                    {meetingsAtivos.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <CalendarHeart size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhum encontro marcado</p>
                        <p style={{ color: 'var(--muted-2)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
                          Convide alguém para um encontro pelo chat!
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {meetingsAtivos.map(inv => (
                          <MeetingCard
                            key={inv.id}
                            invite={inv}
                            onAccept={() => handleMeetingAction(inv.id, 'accepted')}
                            onDecline={() => setMeetingAction({ invite: inv, type: 'decline' })}
                            onCancel={() => setMeetingAction({ invite: inv, type: 'cancel' })}
                            onReschedule={() => {
                              setRescheduleLocal(inv.local)
                              setRescheduleDate(inv.meeting_date ? inv.meeting_date.slice(0, 16) : '')
                              setMeetingAction({ invite: inv, type: 'reschedule' })
                            }}
                            loading={meetingActionLoading}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Histórico */}
                {meetingTab === 'historico' && (
                  <>
                    {meetingsHistorico.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                        <Clock size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhum histórico ainda</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {meetingsHistorico.map(inv => (
                          <MeetingCard key={inv.id} invite={inv} loading={false} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ Aba Amigos ═══ */}
        {pageTab === 'amigos' && (
          <div style={{ padding: '0 16px' }}>
            {/* Sub-tabs: Amigos / Pendentes */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {([
                { key: 'amigos' as const, label: `Amigos (${friendsList.length})` },
                { key: 'pendentes' as const, label: `Pendentes (${friendsPending.length})` },
              ]).map(t => (
                <button
                  key={t.key}
                  onClick={() => setFriendTab(t.key)}
                  style={{
                    padding: '8px 16px', borderRadius: 100,
                    border: `1px solid ${friendTab === t.key ? 'var(--accent)' : 'rgba(255,255,255,0.06)'}`,
                    backgroundColor: friendTab === t.key ? 'rgba(225,29,72,0.12)' : 'transparent',
                    color: friendTab === t.key ? 'var(--accent)' : 'var(--muted)',
                    fontSize: 13, fontWeight: friendTab === t.key ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Lista de amigos */}
            {friendTab === 'amigos' && (
              <>
                {friendsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} style={{ height: 64, borderRadius: 14, backgroundColor: 'var(--bg-card)', marginBottom: 8, animation: 'ui-pulse 1.5s ease infinite' }} />
                  ))
                ) : friendsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <Users size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                    <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhum amigo ainda</p>
                    <p style={{ color: 'var(--muted-2)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
                      Depois de um match, você pode adicionar a pessoa como amigo. Amigos não expiram.
                    </p>
                  </div>
                ) : (
                  <>
                    {onlineFriends.length > 0 && (
                      <>
                        <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 700 }}>
                          Online agora ({onlineFriends.length})
                        </p>
                        {onlineFriends.map(f => (
                          <FriendRowInline key={f.id} friendship={f} onRemove={friendRemove} actionLoading={friendActionLoading} online />
                        ))}
                        <div style={{ height: 12 }} />
                      </>
                    )}
                    {offlineFriends.length > 0 && (
                      <>
                        {onlineFriends.length > 0 && (
                          <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 700 }}>
                            Todos os amigos ({offlineFriends.length})
                          </p>
                        )}
                        {offlineFriends.map(f => (
                          <FriendRowInline key={f.id} friendship={f} onRemove={friendRemove} actionLoading={friendActionLoading} online={false} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Pendentes */}
            {friendTab === 'pendentes' && (
              <>
                {receivedPending.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 700 }}>Pedidos recebidos</p>
                    {receivedPending.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Link href={`/perfil/${f.other?.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                          {f.other?.photo_best ? (
                            <img src={f.other.photo_best} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserCircle size={28} color="var(--muted)" />
                            </div>
                          )}
                        </Link>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: '#F8F9FA' }}>{f.other?.name ?? 'Usuário'}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>Quer ser seu amigo</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => friendRespond(f.id, 'accept')}
                            disabled={friendActionLoading === f.id}
                            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => friendRespond(f.id, 'decline')}
                            disabled={friendActionLoading === f.id}
                            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ height: 16 }} />
                  </>
                )}

                {sentPending.length > 0 && (
                  <>
                    <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: 700 }}>Pedidos enviados</p>
                    {sentPending.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <Link href={`/perfil/${f.other?.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
                          {f.other?.photo_best ? (
                            <img src={f.other.photo_best} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserCircle size={28} color="var(--muted)" />
                            </div>
                          )}
                        </Link>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, fontSize: 14, margin: 0, color: '#F8F9FA' }}>{f.other?.name ?? 'Usuário'}</p>
                          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> Aguardando resposta
                          </p>
                        </div>
                        <button
                          onClick={() => friendRemove(f.id)}
                          disabled={friendActionLoading === f.id}
                          style={{ fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {friendsPending.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <UserPlus size={40} color="var(--muted-2)" strokeWidth={1} style={{ marginBottom: 12 }} />
                    <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nenhum pedido pendente</p>
                  </div>
                )}
              </>
            )}
          </div>
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
                  <Image src={actionsFor.photo_best} alt={actionsFor.name} fill className="object-cover" sizes="44px" draggable={false} style={{ pointerEvents: 'none' }} />
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

      {/* ── Modal de ação de encontro ── */}
      {meetingAction && (
        <div
          onClick={() => { setMeetingAction(null); setRescheduleNote(''); setRescheduleDate(''); setRescheduleLocal('') }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(8,9,14,0.75)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ui-fade-in 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'calc(100% - 40px)', maxWidth: 380,
              background: 'rgba(15,17,23,0.98)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: 24,
              animation: 'ui-slide-up 0.22s ease',
            }}
          >
            {/* Header com foto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0,
                background: '#13161F', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {meetingAction.invite.other_photo ? (
                  <Image src={meetingAction.invite.other_photo} alt="" fill className="object-cover" sizes="48px" draggable={false} style={{ pointerEvents: 'none' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-fraunces)', fontSize: 20 }}>
                    {meetingAction.invite.other_name[0]}
                  </div>
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#F8F9FA' }}>{meetingAction.invite.other_name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  {meetingAction.type === 'cancel' ? 'Cancelar encontro' :
                   meetingAction.type === 'decline' ? 'Recusar convite' :
                   'Pedir reagendamento'}
                </p>
              </div>
            </div>

            {/* Info do encontro */}
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 16, fontSize: 13, color: 'rgba(248,249,250,0.70)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={13} color="var(--accent)" strokeWidth={1.5} />
                <span>{meetingAction.invite.local}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck size={13} color="var(--accent)" strokeWidth={1.5} />
                <span>{formatMeetingDate(meetingAction.invite.meeting_date)}</span>
              </div>
            </div>

            {meetingAction.type === 'reschedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Novo local</label>
                  <input
                    value={rescheduleLocal}
                    onChange={e => setRescheduleLocal(e.target.value)}
                    placeholder="Local do encontro"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F8F9FA', fontSize: 14, fontFamily: 'var(--font-jakarta)',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Nova data/hora</label>
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F8F9FA', fontSize: 14, fontFamily: 'var(--font-jakarta)',
                      outline: 'none', colorScheme: 'dark',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Mensagem (opcional)</label>
                  <input
                    value={rescheduleNote}
                    onChange={e => setRescheduleNote(e.target.value)}
                    placeholder="Ex: Podemos mudar para sábado?"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F8F9FA', fontSize: 14, fontFamily: 'var(--font-jakarta)',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {(meetingAction.type === 'cancel' || meetingAction.type === 'decline') && (
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(248,249,250,0.60)', lineHeight: 1.5 }}>
                {meetingAction.type === 'cancel'
                  ? 'Tem certeza? A outra pessoa será notificada do cancelamento.'
                  : 'Tem certeza que deseja recusar este convite?'
                }
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setMeetingAction(null); setRescheduleNote(''); setRescheduleDate(''); setRescheduleLocal('') }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(248,249,250,0.75)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-jakarta)',
                }}
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  const action = meetingAction.type === 'cancel' ? 'cancelled' : meetingAction.type === 'decline' ? 'declined' : 'rescheduled'
                  const extra: Record<string, string> = {}
                  if (meetingAction.type === 'reschedule') {
                    if (rescheduleNote) extra.rescheduleNote = rescheduleNote
                    if (rescheduleDate) extra.newDate = rescheduleDate
                    if (rescheduleLocal && rescheduleLocal !== meetingAction.invite.local) extra.newLocal = rescheduleLocal
                  }
                  handleMeetingAction(meetingAction.invite.id, action, Object.keys(extra).length > 0 ? extra : undefined)
                }}
                disabled={meetingActionLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: meetingAction.type === 'reschedule' ? 'var(--accent)' : '#E11D48',
                  border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: meetingActionLoading ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-jakarta)',
                  opacity: meetingActionLoading ? 0.6 : 1,
                }}
              >
                {meetingActionLoading ? 'Processando...' :
                  meetingAction.type === 'cancel' ? 'Cancelar encontro' :
                  meetingAction.type === 'decline' ? 'Recusar' :
                  'Reagendar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup encontro aceito ── */}
      {acceptedPopup && (
        <div
          onClick={() => setAcceptedPopup(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(8,9,14,0.85)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ui-fade-in 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'calc(100% - 48px)', maxWidth: 340,
              background: 'linear-gradient(170deg, rgba(225,29,72,0.10) 0%, rgba(15,17,23,0.98) 40%)',
              border: '1px solid rgba(225,29,72,0.20)',
              borderRadius: 24, padding: '40px 28px 28px',
              textAlign: 'center',
              animation: 'ui-slide-up 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 24px 80px rgba(225,29,72,0.15)',
            }}
          >
            {/* Icone celebracao */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, rgba(225,29,72,0.20), rgba(245,158,11,0.15))',
              border: '2px solid rgba(225,29,72,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(225,29,72,0.20)',
            }}>
              <PartyPopper size={32} color="#E11D48" strokeWidth={1.5} />
            </div>

            <h2 style={{
              fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700,
              color: '#F8F9FA', margin: '0 0 8px', letterSpacing: '-0.02em',
            }}>
              Encontro confirmado!
            </h2>

            <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
              Você aceitou o encontro com <strong style={{ color: '#F8F9FA' }}>{acceptedPopup.other_name}</strong>
            </p>

            {/* Detalhes */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 24, textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={15} color="#E11D48" strokeWidth={1.5} />
                <span style={{ color: 'rgba(248,249,250,0.80)', fontSize: 14 }}>{acceptedPopup.local}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarCheck size={15} color="#E11D48" strokeWidth={1.5} />
                <span style={{ color: 'rgba(248,249,250,0.80)', fontSize: 14 }}>{formatMeetingDate(acceptedPopup.meeting_date)}</span>
              </div>
            </div>

            <button
              onClick={() => setAcceptedPopup(null)}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
                color: '#fff', fontWeight: 700, fontSize: 14,
                borderRadius: 14, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-jakarta)',
                boxShadow: '0 8px 28px rgba(225,29,72,0.30)',
              }}
            >
              Fechar
            </button>
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

