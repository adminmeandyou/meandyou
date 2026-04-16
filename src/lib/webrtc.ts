import { sendVideoCallSignal } from '@/lib/videocall-bus'

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
  private targetUserId: string
  private matchId: string
  private accessToken: string
  private plan: string
  private callbacks: WebRTCCallbacks
  private pendingCandidates: RTCIceCandidateInit[] = []
  private hasRemoteDescription = false

  constructor(targetUserId: string, matchId: string, accessToken: string, plan: string, callbacks: WebRTCCallbacks) {
    this.targetUserId = targetUserId
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
    const iceServers = await fetchIceServers(this.accessToken)
    this.pc = new RTCPeerConnection({ iceServers })
    this.remoteStream = new MediaStream()

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendVideoCallSignal(this.targetUserId, {
          type: 'ice_candidate',
          match_id: this.matchId,
          candidate: e.candidate.toJSON(),
        })
      }
    }

    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach(track => {
        this.remoteStream!.addTrack(track)
      })
      this.callbacks.onRemoteStream(this.remoteStream!)
    }

    this.pc.oniceconnectionstatechange = () => {
      const state = this.pc!.iceConnectionState
      this.callbacks.onConnectionState(state)
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.callbacks.onDisconnected()
      }
    }

    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: this.quality.width, height: this.quality.height },
      audio: true,
    })

    this.localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, this.localStream!)
    })

    if (isCaller) {
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)
      await sendVideoCallSignal(this.targetUserId, {
        type: 'sdp_offer',
        match_id: this.matchId,
        sdp: { type: offer.type, sdp: offer.sdp },
      })
    }
  }

  async handleOffer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    this.hasRemoteDescription = true
    this.drainPendingCandidates()

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
    await sendVideoCallSignal(this.targetUserId, {
      type: 'sdp_answer',
      match_id: this.matchId,
      sdp: { type: answer.type, sdp: answer.sdp },
    })
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    this.hasRemoteDescription = true
    this.drainPendingCandidates()
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
  }
}
