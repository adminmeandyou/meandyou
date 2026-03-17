'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'desktop' | 'aguardando' | 'dados' | 'doc_frente' | 'doc_verso' | 'selfie' | 'enviando' | 'sucesso' | 'erro' | 'expirado' | 'usado'
type ModoCaptura = 'escolha' | 'camera' | 'arquivo'

const PASSOS_LIVENESS = [
  { id: 'frente',   instrucao: 'Olhe para a câmera',         emoji: '😐' },
  { id: 'direita',  instrucao: 'Vire o rosto para a direita', emoji: '➡️' },
  { id: 'esquerda', instrucao: 'Vire o rosto para a esquerda', emoji: '⬅️' },
  { id: 'cima',     instrucao: 'Levante o queixo',            emoji: '⬆️' },
  { id: 'baixo',    instrucao: 'Abaixe o queixo',             emoji: '⬇️' },
  { id: 'piscar',   instrucao: 'Pisque duas vezes',           emoji: '😉' },
]

function Verificacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [mensagem, setMensagem] = useState('')
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [erroEmail, setErroEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [tokenAtual, setTokenAtual] = useState('')

  const [cpf, setCpf] = useState('')
  const [tipoDoc, setTipoDoc] = useState<'rg' | 'cnh' | 'cpf_doc'>('rg')
  const [docFrente, setDocFrente] = useState<File | null>(null)
  const [docFrentePreview, setDocFrentePreview] = useState('')
  const [docVerso, setDocVerso] = useState<File | null>(null)
  const [docVersoPreview, setDocVersoPreview] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [erroForm, setErroForm] = useState('')

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

  // ✅ CORREÇÃO AVISO 13: auto-submit após liveness concluído
  // A spec documenta: "API chama POST /api/confirmar-verificacao automaticamente ao final do fluxo"
  // Usa selfieFileRef para evitar problema de closure stale com o estado selfieFile
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
      .select('id')
      .eq('user_id', user.id)
      .eq('used', false)
      .gte('expires_at', agora)
      .maybeSingle()

    if (tokenExistente) {
      // Email já foi enviado antes e o link ainda é válido — não gerar outro
      setEmailEnviado(true)
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
    const url = file.type === 'application/pdf' ? '' : URL.createObjectURL(file)
    if (tipo === 'frente') { setDocFrente(file); setDocFrentePreview(url) }
    else { setDocVerso(file); setDocVersoPreview(url) }
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
      const file = new File([blob], `${tipo}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      pararCamera(tipo)
      if (tipo === 'frente') { setDocFrente(file); setDocFrentePreview(url); setModoFrente('arquivo') }
      else if (tipo === 'verso') { setDocVerso(file); setDocVersoPreview(url); setModoVerso('arquivo') }
      else { setSelfieFile(file); setSelfiePreview(url) }
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
    pararCamera('selfie')
  }

  useEffect(() => {
    if (!deteccaoAtiva || !faceApiCarregado || livenessOk) return
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
      setFeedbackLiveness('Rosto não detectado. Centralize o rosto na câmera.')
      return
    }

    const landmarks = deteccao.landmarks
    const passoId = PASSOS_LIVENESS[passoAtual]?.id
    let passou = false

    if (passoId === 'frente') {
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const diff = Math.abs(noseTip.x - centro)
      const largura = jawRight.x - jawLeft.x
      if (diff < largura * 0.12) { passou = true; setFeedbackLiveness('✅ Ótimo!') }
      else setFeedbackLiveness('Olhe diretamente para a câmera')
    }

    if (passoId === 'direita') {
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const largura = jawRight.x - jawLeft.x
      if (noseTip.x > centro + largura * 0.18) { passou = true; setFeedbackLiveness('✅ Perfeito!') }
      else setFeedbackLiveness('Vire mais para a direita')
    }

    if (passoId === 'esquerda') {
      const nose = landmarks.getNose()
      const jaw = landmarks.getJawOutline()
      const noseTip = nose[3]
      const jawLeft = jaw[0]
      const jawRight = jaw[16]
      const centro = (jawLeft.x + jawRight.x) / 2
      const largura = jawRight.x - jawLeft.x
      if (noseTip.x < centro - largura * 0.18) { passou = true; setFeedbackLiveness('✅ Perfeito!') }
      else setFeedbackLiveness('Vire mais para a esquerda')
    }

    if (passoId === 'cima') {
      const nose = landmarks.getNose()
      const chin = landmarks.getJawOutline()[8]
      const noseBridge = nose[0]
      const diff = chin.y - noseBridge.y
      if (diff < 65) { passou = true; setFeedbackLiveness('✅ Ótimo!') }
      else setFeedbackLiveness('Levante mais o queixo')
    }

    if (passoId === 'baixo') {
      const nose = landmarks.getNose()
      const chin = landmarks.getJawOutline()[8]
      const noseBridge = nose[0]
      const diff = chin.y - noseBridge.y
      if (diff > 110) { passou = true; setFeedbackLiveness('✅ Ótimo!') }
      else setFeedbackLiveness('Abaixe mais o queixo')
    }

    if (passoId === 'piscar') {
      const leftEye = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      const earEsq = calcularEAR(leftEye)
      const earDir = calcularEAR(rightEye)
      const ear = (earEsq + earDir) / 2

      if (ear < 0.22 && olhosAbertosRef.current) {
        olhosAbertosRef.current = false
        piscarContRef.current += 1
        setFeedbackLiveness(`Piscar detectado: ${piscarContRef.current}/2`)
      } else if (ear > 0.28) {
        olhosAbertosRef.current = true
      }
      if (piscarContRef.current >= 2) { passou = true; setFeedbackLiveness('✅ Perfeito!') }
    }

    if (passou) {
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

  const enviarVerificacao = async () => {
    setErroForm('')
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (!validarCPF(cpfLimpo)) { setErroForm('CPF inválido. Verifique os dígitos.'); return }
    if (!docFrente) { setErroForm('Anexe ou fotografe a frente do documento.'); return }
    if (tipoDoc !== 'cpf_doc' && !docVerso) { setErroForm('Anexe ou fotografe o verso do documento.'); return }
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

    try {
      await comTimeout(uploadArquivo(docFrente, `${userId}/frente.jpg`))
      if (docVerso) await comTimeout(uploadArquivo(docVerso, `${userId}/verso.jpg`))
      await comTimeout(uploadArquivo(selfieFile, `${userId}/selfie.jpg`))

      const res = await comTimeout(fetch('/api/confirmar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenAtual, userId, cpf: cpfLimpo }),
      }))
      const data = await res.json()
      if (data.ok) { setStatus('sucesso'); setTimeout(() => router.push('/perfil'), 3000) }
      else { setStatus('erro'); setMensagem(data.error || 'Erro ao confirmar verificação. Tente novamente.') }
    } catch (e: any) {
      setStatus('erro')
      setMensagem(e.message || 'Erro inesperado. Tente novamente.')
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
    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' }}>
      <p style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>💡 Dicas para uma boa foto:</p>
      {textos.map((t, i) => <p key={i} style={{ fontSize: '12px', color: '#78350f', marginBottom: '2px' }}>• {t}</p>)}
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
          <div style={{ fontSize: '28px' }}>📷</div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-dark)', marginTop: '6px' }}>Fotografar agora</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Usar câmera do celular</p>
        </button>
        <button onClick={() => setModo('arquivo')}
          style={{ flex: 1, border: '2px solid var(--border)', borderRadius: '16px', padding: '16px 8px', backgroundColor: 'var(--white)', cursor: 'pointer' }}>
          <div style={{ fontSize: '28px' }}>📁</div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginTop: '6px' }}>Anexar arquivo</p>
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
          {cameraAtiva && <button onClick={() => tirarFoto(tipo)} style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>📸 Fotografar</button>}
        </div>
      </div>
    )

    return (
      <div>
        {preview ? (
          <img src={preview} alt="documento" style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '180px', objectFit: 'cover' }} />
        ) : arquivo?.type === 'application/pdf' ? (
          <div style={{ border: '2px solid var(--accent)', borderRadius: '12px', padding: '16px', marginBottom: '12px', backgroundColor: 'var(--accent-light)' }}>
            <div style={{ fontSize: '32px' }}>📄</div>
            <p style={{ color: 'var(--accent-dark)', fontWeight: '600', fontSize: '13px', marginTop: '4px' }}>{arquivo.name}</p>
          </div>
        ) : (
          <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: '16px', padding: '24px', cursor: 'pointer', textAlign: 'center' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0], tipo)} />
            <div style={{ fontSize: '36px' }}>📎</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Toque para selecionar arquivo<br /><span style={{ fontSize: '11px' }}>JPG, PNG, WEBP ou PDF — máx. 10MB</span></p>
          </label>
        )}
        {arquivo && (
          <label style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleArquivo(e.target.files[0], tipo)} />
            <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>🔄 Trocar arquivo</span>
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

        {status === 'loading' && <div><div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div><p style={{ color: 'var(--muted)', fontSize: '15px' }}>Verificando...</p></div>}

        {status === 'desktop' && card(<>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📱</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Use o celular</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>
            A verificação só pode ser feita pelo celular.<br /><br />
            Abra o email que enviamos e toque em <strong style={{ color: 'var(--accent)' }}>Verificar identidade</strong> no seu celular.
          </p>
        </>)}

        {status === 'aguardando' && card(<>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Verifique seu email</h2>
          {emailEnviado
            ? <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Enviamos um link para o seu email. <strong style={{ color: 'var(--text)' }}>Abra no celular</strong> para concluir.<br /><br />O link expira em <strong style={{ color: 'var(--accent)' }}>30 minutos</strong>.</p>
            : <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Enviando o link de verificação...</p>
          }
          <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent-dark)', fontWeight: '600' }}>📱 Abra o link no celular</p>
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
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '15px', fontFamily: 'var(--font-jakarta)', boxSizing: 'border-box' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Tipo de documento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['rg', 'cnh', 'cpf_doc'] as const).map(tipo => (
                <button key={tipo} onClick={() => setTipoDoc(tipo)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: `2px solid ${tipoDoc === tipo ? 'var(--accent)' : 'var(--border)'}`, backgroundColor: tipoDoc === tipo ? 'var(--accent-light)' : 'var(--white)', color: tipoDoc === tipo ? 'var(--accent-dark)' : 'var(--muted)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                  {tipo === 'rg' ? 'RG' : tipo === 'cnh' ? 'CNH' : 'CPF'}
                </button>
              ))}
            </div>
          </div>
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <button onClick={() => { const c = cpf.replace(/\D/g,''); if (c.length !== 11) { setErroForm('CPF inválido.'); return } setErroForm(''); setStatus('doc_frente') }}
            style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '20px' }}>
            Próximo →
          </button>
        </>)}

        {status === 'doc_frente' && card(<>
          {passos(2)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Frente do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 2 de {totalPassos} — {tipoDoc === 'rg' ? 'RG' : tipoDoc === 'cnh' ? 'CNH' : 'CPF'} frente</p>
          {dicas(['Fundo liso, de preferência branco ou claro', 'Boa iluminação — evite sombras e reflexos', 'Documento inteiro visível, sem cortar bordas', 'Sem acessórios cobrindo o documento', 'Imagem nítida e sem borrão'])}
          {botoesCaptura('frente', modoFrente, setModoFrente, docFrentePreview, docFrente, cameraFrenteAtiva, videoFrenteRef, canvasFrenteRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('frente'); setStatus('dados') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button onClick={() => { if (!docFrente) { setErroForm('Fotografe ou anexe a frente do documento.'); return } setErroForm(''); setStatus(tipoDoc === 'cpf_doc' ? 'selfie' : 'doc_verso') }}
              style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Próximo →</button>
          </div>
        </>)}

        {status === 'doc_verso' && card(<>
          {passos(3)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Verso do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 3 de {totalPassos} — {tipoDoc === 'rg' ? 'RG' : 'CNH'} verso</p>
          {dicas(['Fundo liso, de preferência branco ou claro', 'Boa iluminação — evite sombras e reflexos', 'Documento inteiro visível, sem cortar bordas', 'Imagem nítida e sem borrão'])}
          {botoesCaptura('verso', modoVerso, setModoVerso, docVersoPreview, docVerso, cameraVersoAtiva, videoVersoRef, canvasVersoRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('verso'); setStatus('doc_frente') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button onClick={() => { if (!docVerso) { setErroForm('Fotografe ou anexe o verso do documento.'); return } setErroForm(''); setStatus('selfie') }}
              style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Próximo →</button>
          </div>
        </>)}

        {status === 'selfie' && card(<>
          {passos(totalPassos)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Verificação facial</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo {totalPassos} de {totalPassos} — Confirmação de que você é uma pessoa real</p>

          {!livnessIniciado && !livenessOk && (
            <>
              <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-dark)', marginBottom: '10px' }}>🎯 O que vai acontecer:</p>
                {PASSOS_LIVENESS.map((p, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
                    {p.emoji} {p.instrucao}
                  </p>
                ))}
              </div>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' }}>
                <p style={{ fontSize: '12px', color: '#78350f' }}>💡 Boa iluminação, rosto descoberto, fundo neutro.</p>
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
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', justifyContent: 'center' }}>
                {PASSOS_LIVENESS.map((p, i) => (
                  <div key={i} title={p.instrucao} style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    backgroundColor: passosConcluidos[i] ? 'var(--accent)' : i === passoAtual ? 'var(--accent-light)' : 'var(--border)',
                    border: i === passoAtual ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.3s'
                  }}>
                    {passosConcluidos[i] ? '✓' : p.emoji}
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: 'var(--accent-light)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-dark)' }}>
                  {PASSOS_LIVENESS[passoAtual]?.emoji} {PASSOS_LIVENESS[passoAtual]?.instrucao}
                </p>
                {feedbackLiveness && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{feedbackLiveness}</p>
                )}
              </div>

              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', marginBottom: '12px', aspectRatio: '3/4' }}>
                <video ref={videoSelfieRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraSelfieAtiva ? 'block' : 'none' }} />
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

              <button onClick={reiniciarLiveness} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>
                🔄 Reiniciar verificação
              </button>
            </>
          )}

          {livenessOk && selfiePreview && (
            <>
              <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-dark)' }}>✅ Verificação facial concluída!</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Enviando automaticamente...</p>
              </div>
              <img src={selfiePreview} alt="selfie" style={{ width: '100%', borderRadius: '16px', marginBottom: '12px', maxHeight: '240px', objectFit: 'cover' }} />
            </>
          )}

          {erroForm && (
            <>
              <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{erroForm}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => { reiniciarLiveness(); setStatus(tipoDoc === 'cpf_doc' ? 'doc_frente' : 'doc_verso') }}
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
                {livenessOk && selfieFile && (
                  <button onClick={enviarVerificacao} style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    Tentar novamente ✓
                  </button>
                )}
              </div>
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
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>⏰</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link expirado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Este link expirou. Faça login para receber um novo.</p>
          <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Fazer login</button>
        </>)}

        {status === 'usado' && card(<>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Link já utilizado</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>Este link já foi usado. Faça login para receber um novo.</p>
          <button onClick={() => router.push('/login')} style={{ backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Fazer login</button>
        </>)}

        {status === 'erro' && card(<>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
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
