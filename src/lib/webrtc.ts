import { supabase } from '@/app/lib/supabase'

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
]

async function fetchIceServers(accessToken: string): Promise<RTCIceServer[]> {
  try {
    const res = await fetch('/api/videocall/ice-servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    if (!res.ok) return FALLBACK_ICE
    const data = await res.json()
    return data.iceServers ?? FALLBACK_ICE
  } catch {
    return FALLBACK_ICE
  }
}

export type WebRTCCallbacks = {
  onRemoteStream: (stream: MediaStream) => void
  onConnectionState: (state: RTCIceConnectionState) => void
  onDisconnected: () => void
}

const VIDEO_QUALITY: Record<string, { minW: number; minH: number; maxW: number; maxH: number }> = {
  essencial: { minW: 480, minH: 360, maxW: 640, maxH: 480 },
  plus:      { minW: 480, minH: 360, maxW: 1280, maxH: 720 },
  black:     { minW: 480, minH: 360, maxW: 1920, maxH: 1080 },
}

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private matchId: string
  private accessToken: string
  private plan: string
  private callbacks: WebRTCCallbacks
  private pendingCandidates: RTCIceCandidateInit[] = []
  private hasRemoteDescription = false

  // Canal dedicado para sinalizacao SDP/ICE (1 por match ativo)
  private matchChannel: ReturnType<typeof supabase.channel> | null = null
  private channelReady = false
  private pcReady = false
  private pendingIncoming: { type: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }[] = []
  private pendingOutgoing: { type: string; sdp?: { type: string; sdp?: string }; candidate?: RTCIceCandidateInit }[] = []

  constructor(_targetUserId: string, matchId: string, accessToken: string, plan: string, callbacks: WebRTCCallbacks) {
    this.matchId = matchId
    this.accessToken = accessToken
    this.plan = plan
    this.callbacks = callbacks
  }

  private get quality() {
    const q = VIDEO_QUALITY[this.plan] ?? VIDEO_QUALITY.essencial
    return {
      width: { min: q.minW, ideal: q.maxW, max: q.maxW },
      height: { min: q.minH, ideal: q.maxH, max: q.maxH },
    }
  }

  async init(isCaller: boolean, facingMode: 'user' | 'environment' = 'user') {
    // 1. Inscreve no canal do match para SDP/ICE (ambos os lados)
    await this.setupMatchChannel()

    // 2. Cria a PeerConnection
    const iceServers = await fetchIceServers(this.accessToken)
    this.pc = new RTCPeerConnection({ iceServers })
    this.remoteStream = new MediaStream()

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({ type: 'ice_candidate', candidate: e.candidate.toJSON() })
      }
    }

    this.pc.ontrack = (e) => {
      try {
        this.remoteStream!.addTrack(e.track)
      } catch {}
      this.callbacks.onRemoteStream(this.remoteStream!)
    }

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc!.iceConnectionState
      this.callbacks.onConnectionState(state)
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.callbacks.onDisconnected()
      }
    }

    // 3. Captura camera e microfone
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: this.quality.width, height: this.quality.height },
      audio: true,
    })

    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!)
    })

    // 4. PC pronto — processa sinais que chegaram antes
    this.pcReady = true
    this.drainPendingIncoming()

    // 5. Se for o chamador, cria e envia a offer
    if (isCaller) {
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)
      this.sendSignal({
        type: 'sdp_offer',
        sdp: { type: offer.type, sdp: offer.sdp },
      })
    }
  }

  // ─── Canal do match para sinalizacao ──────────────────────────────────────────

  private async setupMatchChannel() {
    this.matchChannel = supabase.channel(`videocall:match:${this.matchId}`)

    this.matchChannel.on('broadcast', { event: 'webrtc' }, ({ payload }) => {
      if (!payload) return
      this.handleIncomingSignal(payload)
    })

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[WebRTC] match channel subscription timeout')
        resolve()
      }, 5000)
      this.matchChannel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          this.channelReady = true
          this.drainPendingOutgoing()
          resolve()
        }
      })
    })
  }

  private handleIncomingSignal(payload: { type: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    if (!this.pcReady || !this.pc) {
      this.pendingIncoming.push(payload)
      return
    }
    if (payload.type === 'sdp_offer' && payload.sdp) this.handleOffer(payload.sdp)
    if (payload.type === 'sdp_answer' && payload.sdp) this.handleAnswer(payload.sdp)
    if (payload.type === 'ice_candidate' && payload.candidate) this.handleIceCandidate(payload.candidate)
  }

  private drainPendingIncoming() {
    const signals = this.pendingIncoming.splice(0)
    for (const s of signals) this.handleIncomingSignal(s)
  }

  private sendSignal(payload: { type: string; sdp?: { type: string; sdp?: string }; candidate?: RTCIceCandidateInit }) {
    if (!this.channelReady || !this.matchChannel) {
      this.pendingOutgoing.push(payload)
      return
    }
    this.matchChannel.send({
      type: 'broadcast',
      event: 'webrtc',
      payload,
    }).catch((err) => {
      console.error('[WebRTC] sendSignal failed:', err)
    })
  }

  private drainPendingOutgoing() {
    const signals = this.pendingOutgoing.splice(0)
    for (const s of signals) this.sendSignal(s)
  }

  // ─── SDP handling ─────────────────────────────────────────────────────────────

  async handleOffer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      this.hasRemoteDescription = true
      this.drainPendingCandidates()

      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      this.sendSignal({
        type: 'sdp_answer',
        sdp: { type: answer.type, sdp: answer.sdp },
      })
    } catch (err) {
      console.error('[WebRTC] handleOffer failed:', err)
    }
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      this.hasRemoteDescription = true
      this.drainPendingCandidates()
    } catch (err) {
      console.error('[WebRTC] handleAnswer failed:', err)
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return
    if (!this.hasRemoteDescription) {
      this.pendingCandidates.push(candidate)
      return
    }
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch {}
  }

  private drainPendingCandidates() {
    for (const c of this.pendingCandidates) {
      try { this.pc?.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    this.pendingCandidates = []
  }

  // ─── Controles ────────────────────────────────────────────────────────────────

  getLocalStream() {
    return this.localStream
  }

  getRemoteStream() {
    return this.remoteStream
  }

  toggleMic(): boolean {
    const audioTrack = this.localStream?.getAudioTracks()[0]
    if (!audioTrack) return false
    audioTrack.enabled = !audioTrack.enabled
    return audioTrack.enabled
  }

  toggleCamera(): boolean {
    const videoTrack = this.localStream?.getVideoTracks()[0]
    if (!videoTrack) return false
    videoTrack.enabled = !videoTrack.enabled
    return videoTrack.enabled
  }

  async flipCamera(newFacing: 'user' | 'environment') {
    if (!this.pc || !this.localStream) return

    const oldVideoTrack = this.localStream.getVideoTracks()[0]
    if (oldVideoTrack) {
      oldVideoTrack.stop()
      this.localStream.removeTrack(oldVideoTrack)
    }

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacing, width: this.quality.width, height: this.quality.height },
    })
    const newTrack = newStream.getVideoTracks()[0]
    this.localStream.addTrack(newTrack)

    const sender = this.pc.getSenders().find(s => s.track?.kind === 'video')
    if (sender) {
      await sender.replaceTrack(newTrack)
    }
  }

  destroy() {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.remoteStream?.getTracks().forEach(t => t.stop())
    this.pc?.close()
    this.pc = null
    this.localStream = null
    this.remoteStream = null
    this.pendingCandidates = []
    this.hasRemoteDescription = false
    this.pcReady = false
    this.channelReady = false
    this.pendingIncoming = []
    this.pendingOutgoing = []
    if (this.matchChannel) {
      supabase.removeChannel(this.matchChannel)
      this.matchChannel = null
    }
  }
}
