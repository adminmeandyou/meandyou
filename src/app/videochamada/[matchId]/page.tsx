'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { VideoCallButton } from '@/components/VideoCall'
import { ArrowLeft, Loader2 } from 'lucide-react'

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

    // Busca o match para descobrir o outro participante
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

    // Garante que o usuário logado faz parte deste match
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
    <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-white/20" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0e0b14] flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-white/40 text-sm">{error}</p>
      <button
        onClick={() => router.back()}
        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition"
      >
        Voltar
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-lg text-white">{otherProfile?.name}</h1>
          <p className="text-white/30 text-xs">Videochamada</p>
        </div>

        {/* Botão que controla toda a lógica da chamada */}
        {otherProfile && (
          <VideoCallButton
            matchId={matchId}
            otherName={otherProfile.name}
            otherPhoto={otherProfile.photo_best}
          />
        )}
      </header>

      {/* Instruções enquanto não há chamada ativa */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#b8f542]/10 border border-[#b8f542]/20 flex items-center justify-center">
          <span className="text-4xl">📹</span>
        </div>
        <div>
          <h2 className="font-fraunces text-xl text-white mb-2">
            Pronto para chamar {otherProfile?.name}?
          </h2>
          <p className="text-white/30 text-sm leading-relaxed max-w-xs">
            Toque no ícone de vídeo no canto superior direito para iniciar a chamada. A outra pessoa precisará aceitar.
          </p>
        </div>
        <p className="text-white/20 text-xs">
          Os minutos serão descontados automaticamente ao encerrar.
        </p>
      </div>

    </div>
  )
}
