'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { Camera, FolderOpen, RefreshCw, Check, AlertCircle, ScanFace, Shield } from 'lucide-react'

type Status =
  | 'loading'
  | 'desktop'
  | 'aguardando'
  | 'doc'
  | 'selfie'
  | 'enviando'
  | 'sucesso'
  | 'erro'
  | 'expirado'
  | 'usado'

function isMobile() {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// ─── Componente principal ───────────────────────────────────────────────────

function Verificacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus]         = useState<Status>('loading')
  const [userId, setUserId]         = useState('')
  const [tokenAtual, setTokenAtual] = useState('')
  const [mensagem, setMensagem]     = useState('')

  // Doc
  const [docFile, setDocFile]             = useState<File | null>(null)
  const [docPreview, setDocPreview]       = useState('')
  const [docUploadando, setDocUploadando] = useState(false)
  const [docFeita, setDocFeita]           = useState(false)
  const [docErro, setDocErro]             = useState('')

  // Selfie
  const [selfieFile, setSelfieFile]       = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [cameraAberta, setCameraAberta]   = useState(false)

  // Email
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [erroEmail, setErroEmail]       = useState('')

  const streamRef    = useRef<MediaStream | null>(null)
  const videoRef     = useRef<HTMLVideoElement | null>(null)
  const canvasDocRef = useRef<HTMLCanvasElement | null>(null)
  const videoDocRef  = useRef<HTMLVideoElement | null>(null)
  const streamDocRef = useRef<MediaStream | null>(null)
  const [cameraDocAberta, setCameraDocAberta] = useState(false)
  const [modoDoc, setModoDoc] = useState<'escolha' | 'camera' | 'arquivo'>('escolha')

  // ── Inicialização ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      verificarSeJaValidado()
      return
    }
    if (!isMobile()) {
      setStatus('desktop')
      return
    }
    validarToken(token)
  }, [token])

  async function verificarSeJaValidado() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    const { data: u } = await supabase.from('users').select('verified').eq('id', user.id).single()
    if (u?.verified) { window.location.href = '/onboarding'; return }
    setStatus('aguardando')
    enviarEmailVerificacao(user.id, user.email ?? '')
  }

  async function enviarEmailVerificacao(uid: string, email: string) {
    if (emailEnviado) return
    try {
      const res = await fetch('/api/enviar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, email }),
      })
      if (res.ok) setEmailEnviado(true)
      else setErroEmail('Erro ao enviar o email. Tente novamente.')
    } catch {
      setErroEmail('Erro de conexão.')
    }
  }

  async function validarToken(t: string) {
    setStatus('loading')
    try {
      const res = await fetch('/api/validar-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      })
      const data = await res.json()
      if (res.status === 403)          { setStatus('desktop'); return }
      if (data.error === 'expirado')   { setStatus('expirado'); return }
      if (data.error === 'usado')      { setStatus('usado'); return }
      if (data.error || !data.userId)  { setStatus('erro'); setMensagem('Link inválido ou não encontrado.'); return }
      setUserId(data.userId)
      setTokenAtual(t)
      setStatus('doc')
    } catch {
      setStatus('erro')
      setMensagem('Erro ao verificar o link.')
    }
  }

  // ── Câmera — documento ─────────────────────────────────────────────────────

  async function abrirCameraDoc() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamDocRef.current = stream
      if (videoDocRef.current) {
        videoDocRef.current.srcObject = stream
        await videoDocRef.current.play()
      }
      setCameraDocAberta(true)
    } catch {
      setDocErro('Não foi possível acessar a câmera. Use a opção de arquivo.')
    }
  }

  function fecharCameraDoc() {
    streamDocRef.current?.getTracks().forEach(t => t.stop())
    streamDocRef.current = null
    setCameraDocAberta(false)
  }

  function fotografarDoc() {
    const video  = videoDocRef.current
    const canvas = canvasDocRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    fecharCameraDoc()
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'documento.jpg', { type: 'image/jpeg' })
      const url  = URL.createObjectURL(blob)
      setDocFile(file)
      setDocPreview(url)
      setModoDoc('arquivo')
      uploadDoc(file)
    }, 'image/jpeg', 0.92)
  }

  // ── Câmera — selfie ────────────────────────────────────────────────────────

  async function abrirCameraSelfie() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraAberta(true)
    } catch {
      setMensagem('Não foi possível acessar a câmera frontal.')
    }
  }

  function fecharCameraSelfie() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraAberta(false)
  }

  function fotografarSelfie() {
    const video  = videoRef.current
    const canvas = document.createElement('canvas')
    if (!video) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    fecharCameraSelfie()
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      const url  = URL.createObjectURL(blob)
      setSelfieFile(file)
      setSelfiePreview(url)
    }, 'image/jpeg', 0.92)
  }

  // ── Upload documento ───────────────────────────────────────────────────────

  async function uploadDoc(file: File) {
    if (!userId || !tokenAtual) return
    setDocUploadando(true)
    setDocFeita(false)
    setDocErro('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('caminho', `${userId}/frente.jpg`)
      form.append('userId', userId)
      form.append('token', tokenAtual)
      const res  = await fetch('/api/upload-verificacao', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setDocErro(data.error || 'Erro ao enviar foto.'); return }
      setDocFeita(true)
    } catch {
      setDocErro('Erro de conexão. Tente novamente.')
    } finally {
      setDocUploadando(false)
    }
  }

  function handleArquivoDoc(file: File) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setDocErro('Use uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) { setDocErro('Arquivo muito grande. Máximo 10MB.'); return }
    const url = URL.createObjectURL(file)
    setDocFile(file)
    setDocPreview(url)
    setDocErro('')
    uploadDoc(file)
  }

  // ── Envio final ────────────────────────────────────────────────────────────

  async function enviarVerificacao() {
    if (!selfieFile) { setMensagem('Tire uma selfie antes de continuar.'); return }
    setStatus('enviando')
    setMensagem('')
    try {
      // Upload selfie
      const form = new FormData()
      form.append('file', selfieFile)
      form.append('caminho', `${userId}/selfie.jpg`)
      form.append('userId', userId)
      form.append('token', tokenAtual)
      const uploadRes = await fetch('/api/upload-verificacao', { method: 'POST', body: form })
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}))
        setStatus('selfie')
        setMensagem(d.error || 'Erro ao enviar selfie.')
        return
      }

      // Confirmar verificação
      const confRes = await fetch('/api/confirmar-verificacao', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: tokenAtual, userId }),
      })
      const confData = await confRes.json()
      if (confData.ok) {
        setStatus('sucesso')
        setTimeout(() => { window.location.href = '/onboarding' }, 2500)
      } else {
        setStatus('selfie')
        setMensagem(confData.error || 'Erro ao confirmar. Tente novamente.')
      }
    } catch {
      setStatus('selfie')
      setMensagem('Erro de conexão. Tente novamente.')
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const S: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }

  const card = (children: React.ReactNode) => (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      borderRadius: '24px',
      padding: '28px 24px',
      border: '1px solid var(--border)',
      width: '100%',
      maxWidth: '400px',
    }}>
      {children}
    </div>
  )

  const logo = (
    <p style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '24px', textAlign: 'center' }}>
      MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
    </p>
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div style={S}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Desktop ────────────────────────────────────────────────────────────────
  if (status === 'desktop') return (
    <div style={S}>
      {logo}
      {card(<>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ScanFace size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '10px', textAlign: 'center' }}>Use o celular</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', textAlign: 'center' }}>
          A verificação só pode ser feita pelo celular.<br /><br />
          Abra o email que enviamos e toque em <strong style={{ color: 'var(--accent)' }}>Verificar identidade</strong> no seu celular.
        </p>
      </>)}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Aguardando email ───────────────────────────────────────────────────────
  if (status === 'aguardando') return (
    <div style={S}>
      {logo}
      {card(<>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Check size={28} color="var(--accent)" strokeWidth={2} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '10px', textAlign: 'center' }}>Verifique seu email</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', textAlign: 'center', marginBottom: '20px' }}>
          {emailEnviado
            ? <>Enviamos um link para o seu email. <strong style={{ color: 'var(--text)' }}>Abra no celular</strong> para continuar.<br /><br />O link expira em <strong style={{ color: 'var(--accent)' }}>30 minutos</strong>.</>
            : 'Enviando link de verificação...'
          }
        </p>
        {erroEmail && <p style={{ color: 'var(--red)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{erroEmail}</p>}
        {emailEnviado && (
          <button
            onClick={() => {
              setEmailEnviado(false)
              supabase.auth.getUser().then(({ data }) => {
                if (data.user) enviarEmailVerificacao(data.user.id, data.user.email ?? '')
              })
            }}
            style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}
          >
            Reenviar email
          </button>
        )}
      </>)}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Foto do documento ──────────────────────────────────────────────────────
  if (status === 'doc') return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {logo}

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
        {[1, 2].map(i => (
          <div key={i} style={{ width: i === 1 ? '28px' : '10px', height: '6px', borderRadius: '100px', backgroundColor: i === 1 ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', marginBottom: '6px' }}>Foto do documento</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
          Passo 1 de 2 — RG, CNH ou CPF (frente)
        </p>

        {/* Status do upload */}
        {docUploadando && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Analisando documento...</p>
          </div>
        )}
        {docFeita && !docUploadando && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
            <Check size={16} color="#10b981" strokeWidth={2} />
            <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', margin: 0 }}>Documento verificado com sucesso</p>
          </div>
        )}
        {docErro && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
            <AlertCircle size={16} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: '1.5' }}>{docErro}</p>
          </div>
        )}

        {/* Área principal de captura */}
        {modoDoc === 'escolha' && !docPreview && (
          <>
            {/* Dica rápida */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: '1.6' }}>
                Posicione o documento inteiro na foto, em boa iluminação, sem reflexos. CPF e nome precisam estar legíveis.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={() => { setModoDoc('camera'); setTimeout(abrirCameraDoc, 100) }}
                style={{ flex: 1, border: '2px solid var(--accent)', borderRadius: '16px', padding: '20px 8px', backgroundColor: 'rgba(225,29,72,0.06)', cursor: 'pointer', textAlign: 'center' }}
              >
                <Camera size={28} color="var(--accent)" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', margin: '0 0 2px' }}>Fotografar agora</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>Câmera do celular</p>
              </button>
              <button
                onClick={() => setModoDoc('arquivo')}
                style={{ flex: 1, border: '2px solid var(--border)', borderRadius: '16px', padding: '20px 8px', backgroundColor: 'var(--bg-card2)', cursor: 'pointer', textAlign: 'center' }}
              >
                <FolderOpen size={28} color="var(--muted)" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', margin: '0 0 2px' }}>Selecionar arquivo</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>JPG ou PNG</p>
              </button>
            </div>
          </>
        )}

        {modoDoc === 'camera' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '12px', aspectRatio: '16/9' }}>
              <video ref={videoDocRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraDocAberta ? 'block' : 'none' }} />
              {cameraDocAberta && (
                <div style={{ position: 'absolute', inset: '8px', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '10px', pointerEvents: 'none' }} />
              )}
              {!cameraDocAberta && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
            </div>
            <canvas ref={canvasDocRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { fecharCameraDoc(); setModoDoc('escolha') }}
                style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>
                Cancelar
              </button>
              {cameraDocAberta && (
                <button onClick={fotografarDoc}
                  style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Camera size={16} /> Fotografar
                </button>
              )}
            </div>
          </div>
        )}

        {modoDoc === 'arquivo' && !docPreview && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', border: '2px dashed var(--border)', borderRadius: '16px', padding: '32px 16px', cursor: 'pointer', textAlign: 'center' }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleArquivoDoc(e.target.files[0])} />
              <FolderOpen size={36} color="var(--muted)" strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 10px' }} />
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>Toque para selecionar<br /><span style={{ fontSize: '11px' }}>JPG, PNG ou WEBP — máx. 10MB</span></p>
            </label>
            <button onClick={() => setModoDoc('escolha')}
              style={{ width: '100%', marginTop: '10px', backgroundColor: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
              ← Voltar
            </button>
          </div>
        )}

        {/* Preview da foto */}
        {docPreview && (
          <div style={{ marginBottom: '16px' }}>
            <img src={docPreview} alt="documento" style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', maxHeight: '200px' }} />
            {!docUploadando && (
              <label style={{ display: 'block', textAlign: 'center', marginTop: '10px', cursor: 'pointer' }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) { setDocFeita(false); handleArquivoDoc(e.target.files[0]) } }} />
                <span style={{ fontSize: '13px', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Trocar foto
                </span>
              </label>
            )}
          </div>
        )}

        {/* Botão avançar */}
        <button
          disabled={!docFeita || docUploadando}
          onClick={() => { setDocErro(''); setStatus('selfie') }}
          style={{
            width: '100%', padding: '16px', borderRadius: '100px', border: 'none',
            backgroundColor: docFeita && !docUploadando ? 'var(--accent)' : 'var(--border)',
            color: '#fff', fontSize: '15px', fontWeight: '700',
            cursor: docFeita && !docUploadando ? 'pointer' : 'not-allowed',
          }}
        >
          {docUploadando ? 'Verificando...' : 'Próximo →'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Selfie ─────────────────────────────────────────────────────────────────
  if (status === 'selfie') return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {logo}

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
        {[1, 2].map(i => (
          <div key={i} style={{ width: '28px', height: '6px', borderRadius: '100px', backgroundColor: 'var(--accent)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', marginBottom: '6px' }}>Selfie de confirmação</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>Passo 2 de 2 — Confirme que você é a pessoa do documento</p>

        {mensagem && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
            <AlertCircle size={16} color="var(--accent)" strokeWidth={2} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: '1.5' }}>{mensagem}</p>
          </div>
        )}

        {/* Câmera frontal */}
        {!selfiePreview && (
          <>
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '14px', aspectRatio: '3/4' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraAberta ? 'block' : 'none' }} />
              {cameraAberta && (
                <svg viewBox="0 0 300 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <mask id="oval-mask">
                      <rect width="300" height="400" fill="white" />
                      <ellipse cx="150" cy="185" rx="95" ry="125" fill="black" />
                    </mask>
                  </defs>
                  <rect width="300" height="400" fill="rgba(0,0,0,0.5)" mask="url(#oval-mask)" />
                  <ellipse cx="150" cy="185" rx="95" ry="125" fill="none" stroke="rgba(225,29,72,0.85)" strokeWidth="2.5" />
                </svg>
              )}
              {!cameraAberta && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <ScanFace size={48} color="rgba(255,255,255,0.2)" strokeWidth={1} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '0 32px' }}>Enquadre o seu rosto dentro do oval</p>
                </div>
              )}
            </div>

            {!cameraAberta ? (
              <button
                onClick={abrirCameraSelfie}
                style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Camera size={18} /> Abrir câmera
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={fecharCameraSelfie}
                  style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '14px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={fotografarSelfie}
                  style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Camera size={18} /> Fotografar
                </button>
              </div>
            )}
          </>
        )}

        {/* Preview selfie */}
        {selfiePreview && (
          <>
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', marginBottom: '14px', aspectRatio: '3/4' }}>
              <img src={selfiePreview} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(16,185,129,0.9)', borderRadius: '100px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} color="#fff" strokeWidth={2.5} />
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700' }}>Foto tirada</span>
              </div>
            </div>
            <button
              onClick={() => { setSelfiePreview(''); setSelfieFile(null); abrirCameraSelfie() }}
              style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} /> Tirar outra foto
            </button>
            <button
              onClick={enviarVerificacao}
              style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
            >
              Confirmar e finalizar
            </button>
          </>
        )}

        <button onClick={() => setStatus('doc')}
          style={{ width: '100%', marginTop: '14px', backgroundColor: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
          ← Voltar
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Enviando ───────────────────────────────────────────────────────────────
  if (status === 'enviando') return (
    <div style={{ ...S, gap: '16px' }}>
      <div style={{ width: '56px', height: '56px', border: '4px solid var(--accent)', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ color: 'var(--text)', fontSize: '16px', fontWeight: '600' }}>Finalizando verificação...</p>
      <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Não feche esta tela.</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Sucesso ────────────────────────────────────────────────────────────────
  if (status === 'sucesso') return (
    <div style={S}>
      {logo}
      {card(<>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <svg viewBox="0 0 88 88" width="80" height="80">
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <path d="M44 6 L76 18 L76 44 C76 61 62 75 44 82 C26 75 12 61 12 44 L12 18 Z" fill="url(#sg)" />
              <polyline points="28,44 38,54 60,32" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: 'var(--text)', textAlign: 'center', marginBottom: '8px' }}>Identidade verificada!</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', textAlign: 'center', lineHeight: '1.7' }}>
          Tudo certo. Redirecionando para o perfil...
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--accent)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      </>)}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Expirado / Usado / Erro ────────────────────────────────────────────────
  const estadosFim: Record<string, { icone: React.ReactNode; titulo: string; texto: string }> = {
    expirado: {
      icone: <AlertCircle size={28} color="#F59E0B" strokeWidth={1.5} />,
      titulo: 'Link expirado',
      texto: 'Este link expirou. Faça login para receber um novo.',
    },
    usado: {
      icone: <Check size={28} color="#10b981" strokeWidth={2} />,
      titulo: 'Já verificado',
      texto: 'Este link já foi utilizado. Faça login para continuar.',
    },
    erro: {
      icone: <AlertCircle size={28} color="var(--accent)" strokeWidth={1.5} />,
      titulo: 'Algo deu errado',
      texto: mensagem || 'Não foi possível validar o link.',
    },
  }

  const est = estadosFim[status as string]
  if (est) return (
    <div style={S}>
      {logo}
      {card(<>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          {est.icone}
        </div>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', textAlign: 'center', marginBottom: '10px' }}>{est.titulo}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7', textAlign: 'center', marginBottom: '24px' }}>{est.texto}</p>
        <button onClick={() => router.push('/login')}
          style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
          Ir para o login
        </button>
      </>)}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return null
}

export default function VerificacaoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #E11D48', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <Verificacao />
    </Suspense>
  )
}
