'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { ArrowLeft, ArrowRight, EyeOff, ScanFace, Smile, Camera, FolderOpen, RefreshCw, Check, AlertCircle, Lightbulb } from 'lucide-react'

type Status = 'loading' | 'desktop' | 'aguardando' | 'dados' | 'doc_frente' | 'doc_verso' | 'selfie' | 'enviando' | 'sucesso' | 'erro' | 'expirado' | 'usado'
type ModoCaptura = 'escolha' | 'camera' | 'arquivo'

const PASSOS_LIVENESS = [
  { id: 'esquerda', instrucao: 'Olhe para a esquerda'  },
  { id: 'direita',  instrucao: 'Olhe para a direita'   },
  { id: 'frente',   instrucao: 'Olhe para a câmera'    },
  { id: 'piscar',   instrucao: 'Pisque uma vez'        },
  { id: 'sorriso',  instrucao: 'Sorria!'               },
]

const LIVENESS_ICON: Record<string, React.ReactNode> = {
  esquerda: <ArrowLeft  size={40} strokeWidth={1.5} />,
  direita:  <ArrowRight size={40} strokeWidth={1.5} />,
  frente:   <ScanFace   size={40} strokeWidth={1.5} />,
  piscar:   <EyeOff     size={40} strokeWidth={1.5} />,
  sorriso:  <Smile      size={40} strokeWidth={1.5} />,
}

const VERIF_DRAFT_KEY = 'meandyou_verif_draft'
function salvarVerifDraft(dados: Record<string, unknown>) {
  try { localStorage.setItem(VERIF_DRAFT_KEY, JSON.stringify(dados)) } catch {}
}
function carregarVerifDraft() {
  try { const raw = localStorage.getItem(VERIF_DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function limparVerifDraft() {
  try { localStorage.removeItem(VERIF_DRAFT_KEY) } catch {}
}

function Verificacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const draft = typeof window !== 'undefined' ? carregarVerifDraft() : null

  const [status, setStatus] = useState<Status>('loading')
  const [mensagem, setMensagem] = useState('')
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [erroEmail, setErroEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [tokenAtual, setTokenAtual] = useState('')

  const [cpf, setCpf] = useState(draft?.cpf ?? '')
  const [tipoDoc, setTipoDoc] = useState<'rg' | 'cnh' | 'cpf_doc'>(draft?.tipoDoc ?? 'rg')
  const [docFrente, setDocFrente] = useState<File | null>(null)
  const [docFrentePreview, setDocFrentePreview] = useState('')
  const [docVerso, setDocVerso] = useState<File | null>(null)
  const [docVersoPreview, setDocVersoPreview] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [erroForm, setErroForm] = useState('')

  // Controla upload imediato de cada documento
  const [frenteFeita, setFrenteFeita] = useState<boolean>(draft?.frenteFeita ?? false)
  const [versoFeita, setVersoFeita] = useState<boolean>(draft?.versoFeita ?? false)
  const [frenteUploadando, setFrenteUploadando] = useState(false)
  const [versoUploadando, setVersoUploadando] = useState(false)
  const [frenteUploadFalhou, setFrenteUploadFalhou] = useState(false)
  const [versoUploadFalhou, setVersoUploadFalhou] = useState(false)

  const [modoFrente, setModoFrente] = useState<ModoCaptura>('escolha')
  const [modoVerso, setModoVerso] = useState<ModoCaptura>('escolha')

  const [faceApiCarregado, setFaceApiCarregado] = useState(false)
  const [faceApiErro, setFaceApiErro] = useState(false)
  const [livnessIniciado, setLivenessIniciado] = useState(false)
  const [passoAtual, setPassoAtual] = useState(0)
  const [passosConcluidos, setPassosConcluidos] = useState<boolean[]>(Array(PASSOS_LIVENESS.length).fill(false))
  const [livenessOk, setLivenessOk] = useState(false)
  const [feedbackLiveness, setFeedbackLiveness] = useState('')
  const [deteccaoAtiva, setDeteccaoAtiva] = useState(false)
  const piscarContRef = useRef(0)
  const olhosAbertosRef = useRef(true)
  const deteccaoLoopRef = useRef<NodeJS.Timeout | null>(null)
  const holdCountRef = useRef(0) // frames consecutivos com condicao ok
  // ✅ CORREÇÃO AVISO 13: ref para selfie usado no auto-submit após liveness
  const selfieFileRef = useRef<File | null>(null)

  const videoFrenteRef = useRef<HTMLVideoElement>(null)
  const canvasFrenteRef = useRef<HTMLCanvasElement>(null)
  const videoVersoRef = useRef<HTMLVideoElement>(null)
  const canvasVersoRef = useRef<HTMLCanvasElement>(null)
  const videoSelfieRef = useRef<HTMLVideoElement>(null)
  const canvasSelfieRef = useRef<HTMLCanvasElement>(null)
  const streamFrenteRef = useRef<MediaStream | null>(null)
  const streamVersoRef = useRef<MediaStream | null>(null)
  const streamSelfieRef = useRef<MediaStream | null>(null)
  const [cameraFrenteAtiva, setCameraFrenteAtiva] = useState(false)
  const [cameraVersoAtiva, setCameraVersoAtiva] = useState(false)
  const [cameraSelfieAtiva, setCameraSelfieAtiva] = useState(false)

  // Verifica nitidez da imagem usando variância de gradiente (Laplacian approximation)
  // Retorna true se a imagem está nítida o suficiente
  const verificarNitidez = (canvas: HTMLCanvasElement): boolean => {
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return true
      const { width, height } = canvas
      // Amostra a região central (evita bordas que podem ser pretas)
      const sx = Math.floor(width * 0.1), sy = Math.floor(height * 0.1)
      const sw = Math.floor(width * 0.8), sh = Math.floor(height * 0.8)
      const data = ctx.getImageData(sx, sy, sw, sh).data
      let sumSq = 0, count = 0
      // Variância de diferenças horizontais entre pixels (aprox. Laplacian)
      for (let i = 0; i < data.length - 4; i += 20) {
        const g1 = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const g2 = data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114
        const diff = g1 - g2
        sumSq += diff * diff
        count++
      }
      return count > 0 ? (sumSq / count) > 40 : true
    } catch {
      return true // em caso de erro, não bloqueia
    }
  }

  const isMobile = () => {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    const isEmulator = /bluestacks|nox|memu|ldplayer|gameloop|android.*sdk|sdk.*android/i.test(ua)
    if (isEmulator) return false
    const uaIsMobile = /android|iphone|ipad|ipod|mobile/i.test(ua)
    if (!uaIsMobile) return false
    // ✅ CORREÇÃO: verificar DeviceMotionEvent além do User Agent
    // DevTools com device emulation (F12) falsifica o UA mas NÃO tem acelerômetro real.
    // Em desktop com UA falsificado, window.DeviceMotionEvent existe mas é undefined/não-chamável.
    const hasMotionApi = typeof window.DeviceMotionEvent !== 'undefined'
    if (!hasMotionApi) return false
    // Verificar se o TouchEvent nativo está presente (desktops não têm, mesmo com UA mobile)
    const hasTouchApi = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    return hasTouchApi
  }

  const validarCPF = (cpfRaw: string): boolean => {
    const c = cpfRaw.replace(/\D/g, '')
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
    let soma = 0
    for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i)
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(c[9])) return false
    soma = 0
    for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i)
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    return resto === parseInt(c[10])
  }

  const formatarCPF = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
    return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
  }

  const carregarFaceApi = async () => {
    if ((window as any).faceapi) { setFaceApiCarregado(true); return }
    setFaceApiErro(false)

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 15000)
    )

    try {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          // ✅ CORREÇÃO CRÍTICA: usar @vladmandic/face-api para biblioteca E modelos
          // Antes: biblioteca era face-api.js@0.22.2 (pacote original) com modelos de
          // @vladmandic/face-api@1.7.12 (fork incompatível) → manifests e pesos distintos
          script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js'
          script.onload = async () => {
            const faceapi = (window as any).faceapi
            try {
              const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model'
              await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              ])
              setFaceApiCarregado(true)
              resolve()
            } catch (e) { reject(e) }
          }
          script.onerror = reject
          document.head.appendChild(script)
        }),
        timeout,
      ])
    } catch {
      setFaceApiErro(true)
    }
  }

  useEffect(() => {
    if (!token) { verificarSeJaValidado(); return }
    if (!isMobile()) { setStatus('desktop'); return }
    validarToken(token)
  }, [token])

  useEffect(() => {
    return () => {
      pararTodasCameras()
      if (deteccaoLoopRef.current) clearInterval(deteccaoLoopRef.current)
    }
  }, [])

  // Salva progresso sempre que qualquer campo relevante muda
  useEffect(() => {
    salvarVerifDraft({ cpf, tipoDoc, frenteFeita, versoFeita })
  }, [cpf, tipoDoc, frenteFeita, versoFeita])

  // Auto-submit após liveness concluído
  useEffect(() => {
    if (livenessOk && selfieFileRef.current) {
      enviarVerificacao()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livenessOk])

  const pararTodasCameras = () => {
    [streamFrenteRef, streamVersoRef, streamSelfieRef].forEach(ref => {
      if (ref.current) { ref.current.getTracks().forEach(t => t.stop()); ref.current = null }
    })
    setCameraFrenteAtiva(false)
    setCameraVersoAtiva(false)
    setCameraSelfieAtiva(false)
  }

  const verificarSeJaValidado = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('verified, email').eq('id', user.id).single()
    if (data?.verified) { router.push('/busca'); return }
    setStatus('aguardando')

    // Checar se já existe token válido antes de gerar novo — preserva rate limit
    const agora = new Date().toISOString()
    const { data: tokenExistente } = await supabase
      .from('verification_tokens')
      .select('id, token')
      .eq('user_id', user.id)
      .eq('used', false)
      .gte('expires_at', agora)
      .maybeSingle()

    if (tokenExistente) {
      // Token válido existe — redirecionar direto para a verificação de rosto
      router.replace(`/verificacao?token=${tokenExistente.token}`)
      return
    }

    await enviarEmailVerificacao(user.id, data?.email || user.email || '')
  }

  const enviarEmailVerificacao = async (uid: string, email: string) => {
    if (emailEnviado) return
    setErroEmail('')
    try {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).single()
      const res = await fetch('/api/enviar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, email, nome: profile?.name || '' }),
      })
      if (res.ok) {
        setEmailEnviado(true)
      } else {
        const d = await res.json().catch(() => ({}))
        setErroEmail(d.error || 'Erro ao enviar email. Tente novamente.')
      }
    } catch {
      setErroEmail('Erro de conexão. Tente novamente.')
    }
  }

  const reenviarEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmailEnviado(false)
    const { data } = await supabase.from('users').select('email').eq('id', user.id).single()
    await enviarEmailVerificacao(user.id, data?.email || user.email || '')
  }

  const validarToken = async (tk: string) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/validar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk }),
      })
      const data = await res.json()
      if (res.status === 403 || data.error === 'mobile_required') { setStatus('desktop'); return }
      if (data.error === 'expirado') { setStatus('expirado'); return }
      if (data.error === 'usado') { setStatus('usado'); return }
      if (data.error || !data.userId) { setStatus('erro'); setMensagem('Link inválido ou não encontrado.'); return }
      setUserId(data.userId)
      setTokenAtual(tk)
      setStatus('dados')
    } catch {
      setStatus('erro')
      setMensagem('Erro ao validar o link. Tente novamente.')
    }
  }

  const handleArquivo = (file: File, tipo: 'frente' | 'verso') => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!permitidos.includes(file.type)) { setErroForm('Formato inválido. Use JPG, PNG, WEBP ou PDF.'); return }
    if (file.size > 10 * 1024 * 1024) { setErroForm('Arquivo muito grande. Máximo 10MB.'); return }
    setErroForm('')
    if (tipo === 'frente') setFrenteUploadFalhou(false)
    else setVersoUploadFalhou(false)
    const url = file.type === 'application/pdf' ? '' : URL.createObjectURL(file)
    if (tipo === 'frente') { setDocFrente(file); setDocFrentePreview(url) }
    else { setDocVerso(file); setDocVersoPreview(url) }
    uploadDocImediato(file, tipo)
  }

  const iniciarCamera = async (tipo: 'frente' | 'verso' | 'selfie') => {
    const facingMode = tipo === 'selfie' ? 'user' : 'environment'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      if (tipo === 'frente') {
        streamFrenteRef.current = stream
        if (videoFrenteRef.current) { videoFrenteRef.current.srcObject = stream; videoFrenteRef.current.play().catch(() => {}) }
        setCameraFrenteAtiva(true)
      } else if (tipo === 'verso') {
        streamVersoRef.current = stream
        if (videoVersoRef.current) { videoVersoRef.current.srcObject = stream; videoVersoRef.current.play().catch(() => {}) }
        setCameraVersoAtiva(true)
      } else {
        streamSelfieRef.current = stream
        if (videoSelfieRef.current) { videoSelfieRef.current.srcObject = stream; videoSelfieRef.current.play().catch(() => {}) }
        setCameraSelfieAtiva(true)
      }
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Permissão de câmera negada. Permita o acesso nas configurações do navegador.'
        : err?.name === 'NotFoundError'
        ? 'Nenhuma câmera encontrada no dispositivo.'
        : `Erro ao abrir câmera: ${err?.message ?? 'Tente novamente.'}`
      setErroForm(msg)
    }
  }

  const pararCamera = (tipo: 'frente' | 'verso' | 'selfie') => {
    if (tipo === 'frente' && streamFrenteRef.current) { streamFrenteRef.current.getTracks().forEach(t => t.stop()); streamFrenteRef.current = null; setCameraFrenteAtiva(false) }
    if (tipo === 'verso' && streamVersoRef.current) { streamVersoRef.current.getTracks().forEach(t => t.stop()); streamVersoRef.current = null; setCameraVersoAtiva(false) }
    if (tipo === 'selfie' && streamSelfieRef.current) { streamSelfieRef.current.getTracks().forEach(t => t.stop()); streamSelfieRef.current = null; setCameraSelfieAtiva(false) }
  }

  const tirarFoto = (tipo: 'frente' | 'verso' | 'selfie') => {
    const video = tipo === 'frente' ? videoFrenteRef.current : tipo === 'verso' ? videoVersoRef.current : videoSelfieRef.current
    const canvas = tipo === 'frente' ? canvasFrenteRef.current : tipo === 'verso' ? canvasVersoRef.current : canvasSelfieRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const nitida = verificarNitidez(canvas)
      const file = new File([blob], `${tipo}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      pararCamera(tipo)
      if (tipo === 'frente') { setDocFrente(file); setDocFrentePreview(url); setModoFrente('arquivo'); uploadDocImediato(file, 'frente') }
      else if (tipo === 'verso') { setDocVerso(file); setDocVersoPreview(url); setModoVerso('arquivo'); uploadDocImediato(file, 'verso') }
      else { setSelfieFile(file); setSelfiePreview(url) }
      if (!nitida) setErroForm('A foto pode estar borrada. Se a imagem não estiver nítida, tire outra foto.')
    }, 'image/jpeg', 0.92)
  }

  const iniciarLiveness = async () => {
    setFeedbackLiveness('Carregando detector facial...')
    try {
      await carregarFaceApi()
    } catch {
      setFeedbackLiveness('Erro ao carregar detector.')
    }
    if (faceApiErro) {
      setFeedbackLiveness('Não foi possível carregar o detector facial. Verifique sua conexão e tente novamente.')
      return
    }
    setPassoAtual(0)
    setPassosConcluidos(Array(PASSOS_LIVENESS.length).fill(false))
    setLivenessOk(false)
    piscarContRef.current = 0
    olhosAbertosRef.current = true
    // ✅ CORREÇÃO: renderizar o elemento <video> ANTES de iniciarCamera
    // Se livenessIniciado=false, o <video ref={videoSelfieRef}> não existe no DOM,
    // então videoSelfieRef.current é null e o stream nunca é atribuído ao elemento.
    setLivenessIniciado(true)
    setFeedbackLiveness('Iniciando câmera...')
    // Aguarda React renderizar o elemento <video> no DOM
    await new Promise(r => setTimeout(r, 80))
    await iniciarCamera('selfie')
    setDeteccaoAtiva(true)
    setFeedbackLiveness(PASSOS_LIVENESS[0].instrucao)
  }

  const reiniciarLiveness = async () => {
    if (deteccaoLoopRef.current) clearInterval(deteccaoLoopRef.current)
    setDeteccaoAtiva(false)
    setLivenessIniciado(false)
    setLivenessOk(false)
    setPassoAtual(0)
    setPassosConcluidos(Array(PASSOS_LIVENESS.length).fill(false))
    setSelfieFile(null)
    setSelfiePreview('')
    piscarContRef.current = 0
    olhosAbertosRef.current = true
    holdCountRef.current = 0
    pararCamera('selfie')
  }

  useEffect(() => {
    if (!deteccaoAtiva || !faceApiCarregado || livenessOk) return
    holdCountRef.current = 0
    deteccaoLoopRef.current = setInterval(() => detectarPasso(), 300)
    return () => { if (deteccaoLoopRef.current) clearInterval(deteccaoLoopRef.current) }
  }, [deteccaoAtiva, faceApiCarregado, passoAtual, livenessOk])

  const detectarPasso = async () => {
    const faceapi = (window as any).faceapi
    const video = videoSelfieRef.current
    if (!video || !faceapi || video.readyState < 2) return

    const deteccao = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()

    if (!deteccao) {
      holdCountRef.current = 0
      setFeedbackLiveness('Rosto não detectado. Centralize o rosto na câmera.')
      return
    }

    const landmarks = deteccao.landmarks
    const passoId = PASSOS_LIVENESS[passoAtual]?.id
    let condicaoOk = false

    if (passoId === 'direita') {
      // Vídeo tem transform: scaleX(-1) no CSS (espelhado para o usuário).
      // face-api lê pixels brutos SEM espelhamento.
      // Virar para a direita fisicamente → nariz move para a ESQUERDA nos pixels brutos.
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const largura = jawRight.x - jawLeft.x
      if (noseTip.x < centro - largura * 0.18) { condicaoOk = true }
      else { holdCountRef.current = 0; setFeedbackLiveness('Vire mais para a direita') }
    }

    if (passoId === 'esquerda') {
      // Video CSS-mirrored (scaleX(-1)): olhar para a esquerda fisicamente
      // → nariz move para a DIREITA nos pixels brutos (x aumenta)
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const largura = jawRight.x - jawLeft.x
      if (noseTip.x > centro + largura * 0.18) { condicaoOk = true }
      else { holdCountRef.current = 0; setFeedbackLiveness('Vire mais para a esquerda') }
    }

    if (passoId === 'frente') {
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const diff = Math.abs(noseTip.x - centro)
      const largura = jawRight.x - jawLeft.x
      if (diff < largura * 0.12) { condicaoOk = true }
      else { holdCountRef.current = 0; setFeedbackLiveness('Olhe diretamente para a câmera') }
    }

    if (passoId === 'piscar') {
      // EAR (Eye Aspect Ratio): (dist(p1,p5) + dist(p2,p4)) / (2 * dist(p0,p3))
      // Tolerante: limiar baixo para capturar piscadas rápidas e lentas
      const leftEye  = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      const ear = (calcularEAR(leftEye) + calcularEAR(rightEye)) / 2

      if (ear < 0.22 && olhosAbertosRef.current) {
        // Olhos fecharam — qualquer velocidade conta
        olhosAbertosRef.current = false
        piscarContRef.current += 1
        setFeedbackLiveness('Piscada detectada!')
      } else if (ear > 0.27) {
        // Olhos abriram — pronto para próxima piscada
        olhosAbertosRef.current = true
      }
      if (piscarContRef.current >= 1) { condicaoOk = true }
      // Sem holdCount para piscar — a maquina de estado ja garante precisao
    }

    if (passoId === 'sorriso') {
      // getMouth() retorna 20 pontos: outer (0-11) + inner (12-19)
      // mouth[0] = canto esquerdo outer, mouth[6] = canto direito outer
      // mouth[3] = labio superior centro, mouth[9] = labio inferior centro
      const mouth = landmarks.getMouth()
      const mouthWidth  = dist(mouth[0], mouth[6])
      const mouthHeight = dist(mouth[3], mouth[9])
      const smileRatio  = mouthWidth > 0 ? mouthHeight / mouthWidth : 0
      if (smileRatio > 0.22) { condicaoOk = true }
      else { holdCountRef.current = 0; setFeedbackLiveness('Sorria mostrando os dentes!') }
    }

    // Exige 3 frames consecutivos para confirmar posicao (nao se aplica ao piscar)
    if (passoId !== 'piscar') {
      if (condicaoOk) {
        holdCountRef.current += 1
        if (holdCountRef.current < 3) {
          setFeedbackLiveness('Mantenha a posição...')
          return
        }
      }
    }

    const passou = passoId === 'piscar'
      ? piscarContRef.current >= 2
      : condicaoOk && holdCountRef.current >= 3

    if (passou) {
      holdCountRef.current = 0
      if (deteccaoLoopRef.current) clearInterval(deteccaoLoopRef.current)
      setDeteccaoAtiva(false)

      const novosConcluidos = [...passosConcluidos]
      novosConcluidos[passoAtual] = true
      setPassosConcluidos(novosConcluidos)

      const proximoPasso = passoAtual + 1

      if (proximoPasso >= PASSOS_LIVENESS.length) {
        setTimeout(() => { capturarSelfieFinal() }, 600)
      } else {
        setTimeout(() => {
          setPassoAtual(proximoPasso)
          setFeedbackLiveness(PASSOS_LIVENESS[proximoPasso].instrucao)
          setDeteccaoAtiva(true)
        }, 800)
      }
    }
  }

  const calcularEAR = (pontos: { x: number; y: number }[]) => {
    const A = dist(pontos[1], pontos[5])
    const B = dist(pontos[2], pontos[4])
    const C = dist(pontos[0], pontos[3])
    return (A + B) / (2.0 * C)
  }

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

  const capturarSelfieFinal = () => {
    const video = videoSelfieRef.current
    const canvas = canvasSelfieRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      pararCamera('selfie')
      selfieFileRef.current = file  // sincroniza ref antes de atualizar estado
      setSelfieFile(file)
      setSelfiePreview(url)
      setLivenessOk(true)
      setDeteccaoAtiva(false)
      setFeedbackLiveness('✅ Verificação concluída!')
    }, 'image/jpeg', 0.92)
  }

  // ─── Upload e envio ──────────────────────────────────────────────────────────

  const uploadArquivo = async (file: File, caminho: string) => {
    // ✅ CORREÇÃO CRÍTICA: upload via API route com service role
    // Antes: supabase.storage com anon key sem sessão → RLS bloqueava silenciosamente
    const form = new FormData()
    form.append('file', file)
    form.append('caminho', caminho)
    form.append('userId', userId)
    form.append('token', tokenAtual)
    const res = await fetch('/api/upload-verificacao', { method: 'POST', body: form })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || 'Erro ao fazer upload')
    }
    return caminho
  }

  // Upload imediato ao tirar/selecionar foto de documento
  const uploadDocImediato = async (file: File, tipo: 'frente' | 'verso') => {
    if (!userId || !tokenAtual) return
    if (tipo === 'frente') { setFrenteUploadando(true); setFrenteFeita(false); setFrenteUploadFalhou(false) }
    else { setVersoUploadando(true); setVersoFeita(false); setVersoUploadFalhou(false) }
    setErroForm('')
    try {
      await uploadArquivo(file, `${userId}/${tipo}.jpg`)
      if (tipo === 'frente') {
        setFrenteFeita(true)
        setFrenteUploadFalhou(false)
        // Auto-avança para o próximo passo após 800ms (tempo para ver o banner verde)
        setTimeout(() => {
          setStatus(prev => prev === 'doc_frente' ? (tipoDoc === 'cpf_doc' ? 'selfie' : 'doc_verso') : prev)
        }, 800)
      } else {
        setVersoFeita(true)
        setVersoUploadFalhou(false)
        setTimeout(() => {
          setStatus(prev => prev === 'doc_verso' ? 'selfie' : prev)
        }, 800)
      }
    } catch (e: any) {
      if (tipo === 'frente') setFrenteUploadFalhou(true)
      else setVersoUploadFalhou(true)
      setErroForm(e.message || `Erro ao enviar foto. Tente novamente.`)
    } finally {
      if (tipo === 'frente') setFrenteUploadando(false)
      else setVersoUploadando(false)
    }
  }

  const enviarVerificacao = async () => {
    setErroForm('')
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (!validarCPF(cpfLimpo)) { setErroForm('CPF inválido. Verifique os dígitos.'); return }
    if (!docFrente && !frenteFeita) { setErroForm('Fotografe ou anexe a frente do documento.'); return }
    if (tipoDoc !== 'cpf_doc' && !docVerso && !versoFeita) { setErroForm('Fotografe ou anexe o verso do documento.'); return }
    if (!selfieFile) { setErroForm('Conclua a verificação de rosto antes de continuar.'); return }
    setStatus('enviando')

    // Timeout de 60s por operação — evita spinner infinito em conexões instáveis
    // function declaration (não arrow) para evitar parse ambíguo de <T> como JSX em .tsx
    function comTimeout<T>(p: Promise<T>): Promise<T> {
      return Promise.race([
        p,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tempo esgotado. Verifique sua conexão e tente novamente.')), 60000)
        ),
      ])
    }

    // Upload frente — pula se já foi enviado antes
    if (!frenteFeita && docFrente) {
      try {
        await comTimeout(uploadArquivo(docFrente, `${userId}/frente.jpg`))
        setFrenteFeita(true)
      } catch (e: any) {
        setStatus('doc_frente')
        setErroForm(e.message || 'Erro ao enviar a frente do documento. Tente novamente.')
        return
      }
    }

    // Upload verso — pula se já foi enviado antes
    if (!versoFeita && docVerso) {
      try {
        await comTimeout(uploadArquivo(docVerso, `${userId}/verso.jpg`))
        setVersoFeita(true)
      } catch (e: any) {
        setStatus('doc_verso')
        setErroForm(e.message || 'Erro ao enviar o verso do documento. Tente novamente.')
        return
      }
    }

    try {
      await comTimeout(uploadArquivo(selfieFile, `${userId}/selfie.jpg`))

      const res = await comTimeout(fetch('/api/confirmar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenAtual, userId, cpf: cpfLimpo }),
      }))
      const data = await res.json()
      if (data.ok) {
        limparVerifDraft()
        setStatus('sucesso')
        setTimeout(async () => {
          const { data: profile } = await supabase.from('profiles').select('onboarding_done').eq('id', userId).single()
          router.push(profile?.onboarding_done ? '/busca' : '/onboarding')
        }, 2500)
      }
      else { setStatus('selfie'); setErroForm(data.error || 'Erro ao confirmar verificação. Tente novamente.') }
    } catch (e: any) {
      setStatus('selfie')
      setErroForm(e.message || 'Erro inesperado. Tente novamente.')
    }
  }

  // ─── Componentes visuais ─────────────────────────────────────────────────────

  const card = (children: React.ReactNode) => (
    <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>{children}</div>
  )

  const totalPassos = tipoDoc === 'cpf_doc' ? 3 : 4

  const passos = (passo: number) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
      {Array.from({ length: totalPassos }, (_, i) => i + 1).map(i => (
        <div key={i} style={{ width: i === passo ? '24px' : '8px', height: '8px', borderRadius: '100px', backgroundColor: i <= passo ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s' }} />
      ))}
    </div>
  )

  const dicas = (textos: string[]) => (
    <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Lightbulb size={13} color="var(--gold)" strokeWidth={2} />
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gold)', margin: 0 }}>Dicas para uma boa foto:</p>
      </div>
      {textos.map((t, i) => <p key={i} style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>• {t}</p>)}
    </div>
  )

  const botoesCaptura = (
    tipo: 'frente' | 'verso',
    modo: ModoCaptura,
    setModo: (m: ModoCaptura) => void,
    preview: string,
    arquivo: File | null,
    cameraAtiva: boolean,
    videoRef: React.RefObject<HTMLVideoElement | null>,
    canvasRef: React.RefObject<HTMLCanvasElement | null>
  ) => {
    if (modo === 'escolha') return (
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => { setModo('camera'); setTimeout(() => iniciarCamera(tipo), 100) }}
          style={{ flex: 1, border: '2px solid var(--accent)', borderRadius: '16px', padding: '16px 8px', backgroundColor: 'var(--accent-light)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <Camera size={28} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginTop: '0' }}>Fotografar agora</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Usar câmera do celular</p>
        </button>
        <button onClick={() => setModo('arquivo')}
          style={{ flex: 1, border: '2px solid var(--border)', borderRadius: '16px', padding: '16px 8px', backgroundColor: 'var(--bg-card2)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
            <FolderOpen size={28} color="var(--muted)" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginTop: '0' }}>Anexar arquivo</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>JPG, PNG ou PDF</p>
        </button>
      </div>
    )

    if (modo === 'camera') return (
      <div>
        <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', marginBottom: '12px' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '16px', display: cameraAtiva ? 'block' : 'none', maxHeight: '200px', objectFit: 'cover' }} />
          {!cameraAtiva && <div style={{ padding: '40px', textAlign: 'center' }}><div style={{ fontSize: '36px' }}>⏳</div><p style={{ color: '#aaa', fontSize: '13px', marginTop: '8px' }}>Abrindo câmera...</p></div>}
          {cameraAtiva && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '70%', border: '2px dashed rgba(255,255,255,0.6)', borderRadius: '8px', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px', padding: '2px 8px' }}>
                <p style={{ color: '#fff', fontSize: '10px' }}>Encaixe o documento aqui</p>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { pararCamera(tipo); setModo('escolha') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
          {cameraAtiva && <button onClick={() => tirarFoto(tipo)} style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Camera size={16} /> Fotografar</button>}
        </div>
      </div>
    )

    return (
      <div>
        {preview ? (
          <img src={preview} alt="documento" style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '180px', objectFit: 'cover' }} />
        ) : arquivo?.type === 'application/pdf' ? (
          <div style={{ border: '2px solid var(--accent)', borderRadius: '12px', padding: '16px', marginBottom: '12px', backgroundColor: 'var(--accent-light)' }}>
            <FolderOpen size={32} color="var(--accent)" strokeWidth={1.5} />
            <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '13px', marginTop: '4px' }}>{arquivo.name}</p>
          </div>
        ) : (
          <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', textAlign: 'center' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0], tipo)} />
            <FolderOpen size={36} color="var(--muted)" strokeWidth={1.5} />
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Toque para selecionar arquivo<br /><span style={{ fontSize: '11px' }}>JPG, PNG, WEBP ou PDF — máx. 10MB</span></p>
          </label>
        )}
        {arquivo && (
          <label style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0], tipo)} />
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={13} /> Trocar arquivo</span>
          </label>
        )}
        <button onClick={() => setModo('escolha')} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '10px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>← Voltar às opções</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>

        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '28px', color: 'var(--text)', marginBottom: '24px' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>

        {status === 'loading' && <div><div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} /><p style={{ color: 'var(--muted)', fontSize: '15px' }}>Verificando...</p></div>}

        {status === 'desktop' && card(<>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><ScanFace size={32} color="var(--accent)" strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Use o celular</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>
            A verificação só pode ser feita pelo celular.<br /><br />
            Abra o email que enviamos e toque em <strong style={{ color: 'var(--accent)' }}>Verificar identidade</strong> no seu celular.
          </p>
        </>)}

        {status === 'aguardando' && card(<>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check size={28} color="var(--accent)" strokeWidth={2} /></div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Verifique seu email</h2>
          {emailEnviado
            ? <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Enviamos um link para o seu email. <strong style={{ color: 'var(--text)' }}>Abra no celular</strong> para concluir.<br /><br />O link expira em <strong style={{ color: 'var(--accent)' }}>30 minutos</strong>.</p>
            : <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Enviando o link de verificação...</p>
          }
          <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>Abra o link no celular</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>A selfie ao vivo só funciona no celular.</p>
          </div>
          {erroEmail && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', fontWeight: '600' }}>{erroEmail}</p>}
          {emailEnviado && <button onClick={reenviarEmail} style={{ backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '10px 24px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>Reenviar email</button>}
        </>)}

        {status === 'dados' && card(<>
          {passos(1)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Seus dados</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Passo 1 de {totalPassos} — CPF e documento</p>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>CPF</label>
            <input type="tel" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatarCPF(e.target.value))}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '15px', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box', backgroundColor: 'var(--bg-card2)', color: 'var(--text)' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Tipo de documento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['rg', 'cnh', 'cpf_doc'] as const).map(tipo => (
                <button key={tipo} onClick={() => setTipoDoc(tipo)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `2px solid ${tipoDoc === tipo ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: tipoDoc === tipo ? 'var(--accent-light)' : 'var(--bg-card2)', color: tipoDoc === tipo ? 'var(--accent)' : 'var(--muted)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                  {tipo === 'rg' ? 'RG' : tipo === 'cnh' ? 'CNH' : 'CPF'}
                </button>
              ))}
            </div>
          </div>
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <button onClick={() => { const c = cpf.replace(/\D/g,''); if (!validarCPF(c)) { setErroForm('CPF inválido. Verifique os dígitos.'); return } setErroForm(''); setStatus('doc_frente') }}
            style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>
            Próximo →
          </button>
        </>)}

        {status === 'doc_frente' && card(<>
          {passos(2)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Frente do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 2 de {totalPassos} — {tipoDoc === 'rg' ? 'RG' : tipoDoc === 'cnh' ? 'CNH' : 'CPF'} frente</p>
          {frenteFeita && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
              <Check size={16} color="#10b981" strokeWidth={2} />
              <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', margin: 0 }}>Foto enviada com sucesso</p>
            </div>
          )}
          {frenteUploadando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Enviando foto...</p>
            </div>
          )}
          {dicas(['Fundo liso, de preferência branco ou claro', 'Boa iluminação — evite sombras e reflexos', 'Documento inteiro visível, sem cortar bordas', 'Sem acessórios cobrindo o documento', 'Imagem nítida e sem borrão'])}
          {botoesCaptura('frente', modoFrente, setModoFrente, docFrentePreview, docFrente, cameraFrenteAtiva, videoFrenteRef, canvasFrenteRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('frente'); setStatus('dados') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button
              disabled={frenteUploadando}
              onClick={() => {
                if (!docFrente && !frenteFeita) { setErroForm('Fotografe ou anexe a frente do documento.'); return }
                if (frenteUploadando) return
                if (frenteUploadFalhou && docFrente) { uploadDocImediato(docFrente, 'frente'); return }
                if (!frenteFeita) { setErroForm('Aguarde o envio da foto.'); return }
                setErroForm(''); setStatus(tipoDoc === 'cpf_doc' ? 'selfie' : 'doc_verso')
              }}
              style={{ flex: 2, backgroundColor: frenteUploadando ? 'var(--border)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: frenteUploadando ? 'not-allowed' : 'pointer' }}>
              {frenteUploadando ? 'Enviando...' : frenteUploadFalhou ? 'Tentar enviar novamente' : 'Próximo →'}
            </button>
          </div>
        </>)}

        {status === 'doc_verso' && card(<>
          {passos(3)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Verso do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 3 de {totalPassos} — {tipoDoc === 'rg' ? 'RG' : 'CNH'} verso</p>
          {versoFeita && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
              <Check size={16} color="#10b981" strokeWidth={2} />
              <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', margin: 0 }}>Foto enviada com sucesso</p>
            </div>
          )}
          {versoUploadando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Enviando foto...</p>
            </div>
          )}
          {dicas(['Fundo liso, de preferência branco ou claro', 'Boa iluminação — evite sombras e reflexos', 'Documento inteiro visível, sem cortar bordas', 'Imagem nítida e sem borrão'])}
          {botoesCaptura('verso', modoVerso, setModoVerso, docVersoPreview, docVerso, cameraVersoAtiva, videoVersoRef, canvasVersoRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('verso'); setStatus('doc_frente') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button
              disabled={versoUploadando}
              onClick={() => {
                if (!docVerso && !versoFeita) { setErroForm('Fotografe ou anexe o verso do documento.'); return }
                if (versoUploadando) return
                if (versoUploadFalhou && docVerso) { uploadDocImediato(docVerso, 'verso'); return }
                if (!versoFeita) { setErroForm('Aguarde o envio da foto.'); return }
                setErroForm(''); setStatus('selfie')
              }}
              style={{ flex: 2, backgroundColor: versoUploadando ? 'var(--border)' : 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: versoUploadando ? 'not-allowed' : 'pointer' }}>
              {versoUploadando ? 'Enviando...' : versoUploadFalhou ? 'Tentar enviar novamente' : 'Próximo →'}
            </button>
          </div>
        </>)}

        {status === 'selfie' && card(<>
          {passos(totalPassos)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Verificação facial</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo {totalPassos} de {totalPassos} — Confirmação de que você é uma pessoa real</p>

          {!livnessIniciado && !livenessOk && (
            <>
              <div style={{ backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>O que vai acontecer:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {PASSOS_LIVENESS.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '10px', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ color: 'var(--accent)', flexShrink: 0, transform: 'scale(0.5)', transformOrigin: 'center', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{LIVENESS_ICON[p.id]}</div>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: '1.3' }}>{p.instrucao}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={13} color="var(--gold)" strokeWidth={2} />
                  <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>Boa iluminação, rosto descoberto, fundo neutro.</p>
                </div>
              </div>
              {feedbackLiveness && (
                <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '12px' }}>{feedbackLiveness}</p>
              )}
              {faceApiErro ? (
                <button onClick={iniciarLiveness} style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                  Tentar novamente
                </button>
              ) : (
                <button onClick={iniciarLiveness} style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                  Iniciar verificacao facial
                </button>
              )}
            </>
          )}

          {livnessIniciado && !livenessOk && (
            <>
              {/* Progresso: bolinhas pequenas */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', justifyContent: 'center', alignItems: 'center' }}>
                {PASSOS_LIVENESS.map((_, i) => (
                  <div key={i} style={{
                    width: passosConcluidos[i] ? '8px' : i === passoAtual ? '20px' : '8px',
                    height: '8px', borderRadius: '100px',
                    backgroundColor: passosConcluidos[i] ? 'var(--accent)' : i === passoAtual ? 'var(--accent)' : 'var(--border)',
                    transition: 'all 0.3s',
                    opacity: passosConcluidos[i] ? 0.5 : 1,
                  }} />
                ))}
              </div>

              {/* Ícone grande do passo atual */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--accent-light)', borderRadius: '16px', padding: '20px 12px 16px', marginBottom: '12px', border: '1px solid var(--accent-border)' }}>
                <div style={{ color: 'var(--accent)', marginBottom: '12px' }}>
                  {LIVENESS_ICON[PASSOS_LIVENESS[passoAtual]?.id]}
                </div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
                  {PASSOS_LIVENESS[passoAtual]?.instrucao}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: feedbackLiveness ? '8px' : '0' }}>
                  Passo {passoAtual + 1} de {PASSOS_LIVENESS.length}
                </p>
                {feedbackLiveness && (
                  <p style={{ fontSize: '13px', color: feedbackLiveness.startsWith('✅') ? 'var(--accent)' : 'var(--muted)', fontWeight: '500' }}>
                    {feedbackLiveness}
                  </p>
                )}
              </div>

              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', marginBottom: '12px', aspectRatio: '3/4' }}>
                <video ref={videoSelfieRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraSelfieAtiva ? 'block' : 'none', transform: 'scaleX(-1)' }} />
                {cameraSelfieAtiva && (
                  <svg viewBox="0 0 300 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <defs>
                      <mask id="oval-cutout">
                        <rect width="300" height="400" fill="white" />
                        <ellipse cx="150" cy="185" rx="90" ry="120" fill="black" />
                      </mask>
                    </defs>
                    {/* Fundo escurecido fora do oval */}
                    <rect width="300" height="400" fill="rgba(0,0,0,0.55)" mask="url(#oval-cutout)" />
                    {/* Borda do oval */}
                    <ellipse cx="150" cy="185" rx="90" ry="120" fill="none" stroke="rgba(225,29,72,0.9)" strokeWidth="2.5" />
                    {/* Marcadores de canto */}
                    <path d="M78 100 Q60 100 60 118" fill="none" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
                    <path d="M222 100 Q240 100 240 118" fill="none" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
                    <path d="M78 270 Q60 270 60 252" fill="none" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
                    <path d="M222 270 Q240 270 240 252" fill="none" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {!cameraSelfieAtiva && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
                    <p style={{ color: '#aaa', fontSize: '13px' }}>Abrindo câmera...</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasSelfieRef} style={{ display: 'none' }} />

              <button onClick={reiniciarLiveness} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <RefreshCw size={14} /> Reiniciar verificação
              </button>
            </>
          )}

          {livenessOk && selfiePreview && (
            <>
              <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><Check size={16} /> Verificação facial concluída!</p>
                {!erroForm && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', textAlign: 'center' }}>Enviando dados...</p>}
              </div>
              <img src={selfiePreview} alt="selfie" style={{ width: '100%', borderRadius: '16px', marginBottom: '12px', maxHeight: '240px', objectFit: 'cover' }} />
              {erroForm && (
                <>
                  <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{erroForm}</p>
                  <button onClick={enviarVerificacao}
                    style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px' }}>
                    Tentar novamente →
                  </button>
                  <button onClick={reiniciarLiveness}
                    style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '11px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>
                    Refazer verificação facial
                  </button>
                </>
              )}
            </>
          )}

          {!livenessOk && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => { reiniciarLiveness(); setStatus(tipoDoc === 'cpf_doc' ? 'doc_frente' : 'doc_verso') }}
                style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            </div>
          )}
        </>)}

        {status === 'enviando' && <div>
          <div style={{ width: '56px', height: '56px', border: '5px solid var(--accent)', borderTop: '5px solid transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Enviando documentos...</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Não feche esta tela.</p>
          <p style={{ color: 'var(--muted-2)', fontSize: '12px', marginTop: '24px' }}>Isso pode levar até 1 minuto em conexões lentas.</p>
        </div>}

        {status === 'sucesso' && card(<>
          {/* Selo azul de verificação */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '88px', height: '88px' }}>
              <svg viewBox="0 0 88 88" width="88" height="88">
                <defs>
                  <linearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                </defs>
                {/* Escudo arredondado */}
                <path d="M44 6 L76 18 L76 44 C76 61 62 75 44 82 C26 75 12 61 12 44 L12 18 Z" fill="url(#sealGrad)" />
                {/* Brilho superior */}
                <path d="M44 10 L72 20 L72 42 C72 57 60 70 44 77" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                {/* Checkmark */}
                <polyline points="28,44 38,54 60,32" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Brilho animado */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(37,99,235,0.25) 0%, transparent 70%)', animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', marginBottom: '8px' }}>Identidade verificada!</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '100px', padding: '4px 14px', marginBottom: '16px' }}>
            <svg width="12" height="12" viewBox="0 0 88 88"><path d="M44 6 L76 18 L76 44 C76 61 62 75 44 82 C26 75 12 61 12 44 L12 18 Z" fill="#2563EB" /><polyline points="28,44 38,54 60,32" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#60A5FA' }}>Perfil Verificado</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>Sua identidade foi confirmada com sucesso. Agora complete o seu perfil para começar.<br /><br />Redirecionando...</p>
          <div style={{ width: '48px', height: '48px', border: '4px solid var(--accent)', borderTop: '4px solid transparent', borderRadius: '50%', margin: '24px auto 0', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </>)}

        {status === 'expirado' && card(<>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><AlertCircle size={28} color="var(--gold)" strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link expirado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Este link expirou. Faça login para receber um novo.</p>
          <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Fazer login</button>
        </>)}

        {status === 'usado' && card(<>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><AlertCircle size={28} color="var(--gold)" strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link já utilizado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Este link já foi usado. Faça login para receber um novo.</p>
          <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Fazer login</button>
        </>)}

        {status === 'erro' && card(<>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><AlertCircle size={28} color="#ef4444" strokeWidth={1.5} /></div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Algo deu errado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>{mensagem}</p>
          <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Voltar ao login</button>
        </>)}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function VerificacaoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    }>
      <Verificacao />
    </Suspense>
  )
}
