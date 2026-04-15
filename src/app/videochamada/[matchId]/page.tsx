'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { VideoCallButton } from '@/components/VideoCall'
import { ArrowLeft, Loader2, Video } from 'lucide-react'
import Image from 'next/image'

export default function VideochamadaPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const router = useRouter()

  const [otherProfile, setOtherProfile] = useState<{ name: string; photo_best: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    loadMatch()
  }, [matchId])

  async function loadMatch() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .select('user1, user2')
      .eq('id', matchId)
      .single()

    if (matchErr || !match) {
      setError('Match não encontrado.')
      setLoading(false)
      return
    }

    if (match.user1 !== user.id && match.user2 !== user.id) {
      setError('Acesso não autorizado.')
      setLoading(false)
      return
    }

    const otherId = match.user1 === user.id ? match.user2 : match.user1

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, photo_best')
      .eq('id', otherId)
      .single()

    setOtherProfile(profile ?? { name: 'Usuário', photo_best: null })
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="rgba(255,255,255,0.20)" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 32px', textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>{error}</p>
      <button
        onClick={() => router.back()}
        style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}
      >
        Voltar
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-jakarta)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="rgba(248,249,250,0.60)" strokeWidth={1.5} />
        </button>

        {/* Avatar + nome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card2)', position: 'relative', flexShrink: 0, border: '2px solid rgba(255,255,255,0.07)' }}>
            {otherProfile?.photo_best
              ? <Image src={otherProfile.photo_best} alt={otherProfile.name} fill style={{ objectFit: 'cover' }} sizes="36px" />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-fraunces)', fontSize: 16, color: 'var(--muted)' }}>{otherProfile?.name[0]}</div>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-fraunces)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherProfile?.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-2)' }}>Videochamada</p>
          </div>
        </div>

        {/* Botão que controla toda a lógica */}
        {otherProfile && (
          <VideoCallButton
            matchId={matchId}
            otherName={otherProfile.name}
            otherPhoto={otherProfile.photo_best}
          />
        )}
      </header>

      {/* Corpo — instruções */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 32px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Video size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, color: 'var(--text)', margin: '0 0 8px' }}>
            Chamar {otherProfile?.name}?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
            Toque no ícone de vídeo acima para iniciar. A outra pessoa precisará aceitar a chamada.
          </p>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(248,249,250,0.15)', margin: 0 }}>
          Os minutos são descontados ao encerrar.
        </p>
      </div>

    </div>
  )
}
