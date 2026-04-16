// src/lib/videocall-bus.ts
// Barramento global de sinalizacao de videochamada.
// Mantem 1 UNICA conexao Realtime por cliente ("videocall:user:{userId}") e
// expoe um event emitter pra IncomingCallOverlay + VideoCallButton se
// inscreverem no mesmo canal. Antes havia 1 canal por match ativo — 15+
// conexoes por usuario logado. Agora e sempre 1.
import { supabase } from '@/app/lib/supabase'

export type CallSignal = {
  type: 'ringing' | 'accepted' | 'rejected' | 'ended' | 'cancelled' | 'sdp_offer' | 'sdp_answer' | 'ice_candidate'
  call_id?: string
  match_id?: string
  caller_id?: string
  callee_id?: string
  caller_name?: string
  caller_photo?: string | null
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

type Listener = (payload: CallSignal) => void

let channel: ReturnType<typeof supabase.channel> | null = null
let currentUserId: string | null = null
const listeners = new Set<Listener>()

export function initVideoCallBus(userId: string) {
  if (currentUserId === userId && channel) return
  teardownVideoCallBus()
  currentUserId = userId
  channel = supabase
    .channel(`videocall:user:${userId}`)
    .on('broadcast', { event: 'call_signal' }, ({ payload }) => {
      if (!payload) return
      listeners.forEach(l => {
        try { l(payload as CallSignal) } catch {}
      })
    })
    .subscribe()
}

export function teardownVideoCallBus() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  currentUserId = null
}

export function onVideoCallSignal(listener: Listener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

// Envia um sinal para OUTRO usuario criando um canal efemero (subscribe,
// send, remove). Dura menos de 1s e nao acumula conexoes permanentes.
export async function sendVideoCallSignal(targetUserId: string, payload: CallSignal) {
  const ephemeral = supabase.channel(`videocall:user:${targetUserId}`)
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => { resolve() }, 3000)
    ephemeral.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout)
        try {
          await ephemeral.send({
            type: 'broadcast',
            event: 'call_signal',
            payload,
          })
        } catch {}
        setTimeout(() => { supabase.removeChannel(ephemeral) }, 300)
        resolve()
      }
    })
  })
}
