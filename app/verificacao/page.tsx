'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'desktop' | 'aguardando' | 'dados' | 'doc_frente' | 'doc_verso' | 'selfie' | 'enviando' | 'sucesso' | 'erro' | 'expirado' | 'usado'
type ModoCaptura = 'escolha' | 'camera' | 'arquivo'

function Verificacao() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('loading')
  const [mensagem, setMensagem] = useState('')
  const [emailEnviado, setEmailEnviado] = useState(false)
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
    return /android|iphone|ipad|ipod|mobile/i.test(ua)
  }

  const formatarCPF = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
    return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
  }

  useEffect(() => {
    if (!token) { verificarSeJaValidado(); return }
    if (!isMobile()) { setStatus('desktop'); return }
    validarToken(token)
  }, [token])

  useEffect(() => {
    return () => { pararTodasCameras() }
  }, [])

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
    if (data?.verified) { router.push('/dashboard'); return }
    setStatus('aguardando')
    await enviarEmailVerificacao(user.id, data?.email || user.email || '')
  }

  const enviarEmailVerificacao = async (uid: string, email: string) => {
    if (emailEnviado) return
    try {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).single()
      const res = await fetch('/api/enviar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, email, nome: profile?.name || '' }),
      })
      if (res.ok) setEmailEnviado(true)
    } catch (e) { console.error(e) }
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: 1280, height: 720 } })
      if (tipo === 'frente') {
        streamFrenteRef.current = stream
        if (videoFrenteRef.current) { videoFrenteRef.current.srcObject = stream; videoFrenteRef.current.play() }
        setCameraFrenteAtiva(true)
      } else if (tipo === 'verso') {
        streamVersoRef.current = stream
        if (videoVersoRef.current) { videoVersoRef.current.srcObject = stream; videoVersoRef.current.play() }
        setCameraVersoAtiva(true)
      } else {
        streamSelfieRef.current = stream
        if (videoSelfieRef.current) { videoSelfieRef.current.srcObject = stream; videoSelfieRef.current.play() }
        setCameraSelfieAtiva(true)
      }
    } catch { setErroForm('Permissão de câmera negada. Permita o acesso e tente novamente.') }
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

  const uploadArquivo = async (file: File, caminho: string) => {
    const { error } = await supabase.storage.from('documentos').upload(caminho, file, { upsert: true })
    if (error) throw new Error('Erro ao fazer upload: ' + error.message)
    return caminho
  }

  const enviarVerificacao = async () => {
    setErroForm('')
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) { setErroForm('CPF inválido.'); return }
    if (!docFrente) { setErroForm('Anexe ou fotografe a frente do documento.'); return }
    if (tipoDoc !== 'cpf_doc' && !docVerso) { setErroForm('Anexe ou fotografe o verso do documento.'); return }
    if (!selfieFile) { setErroForm('Tire a selfie antes de continuar.'); return }
    setStatus('enviando')
    try {
      await uploadArquivo(docFrente, `${userId}/frente.jpg`)
      if (docVerso) await uploadArquivo(docVerso, `${userId}/verso.jpg`)
      await uploadArquivo(selfieFile, `${userId}/selfie.jpg`)
      await supabase.from('users').update({
        cpf: cpfLimpo,
        documento_tipo: tipoDoc,
        documento_verificado: false,
        selfie_url: `${userId}/selfie.jpg`,
        documento_url: `${userId}/frente.jpg`,
      }).eq('id', userId)
      const res = await fetch('/api/confirmar-verificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenAtual, userId }),
      })
      const data = await res.json()
      if (data.ok) { setStatus('sucesso'); setTimeout(() => router.push('/dashboard'), 3000) }
      else { setStatus('erro'); setMensagem('Erro ao confirmar verificação. Tente novamente.') }
    } catch (e: any) {
      setStatus('erro')
      setMensagem(e.message || 'Erro inesperado. Tente novamente.')
    }
  }

  const card = (children: React.ReactNode) => (
    <div style={{ backgroundColor: 'var(--white)', borderRadius: '24px', padding: '28px', boxShadow: '0 8px 32px rgba(46,196,160,0.1)' }}>{children}</div>
  )

  const passos = (passo: number) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
      {[1,2,3,4].map(i => (
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
    videoRef: React.RefObject<HTMLVideoElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>
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
          {/* Guia de enquadramento */}
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

    // modo === 'arquivo' ou já tem preview
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
          {emailEnviado && <button onClick={reenviarEmail} style={{ backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '10px 24px', fontSize: '13px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>Reenviar email</button>}
        </>)}

        {/* PASSO 1 — CPF e tipo */}
        {status === 'dados' && card(<>
          {passos(1)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Seus dados</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Passo 1 de 4 — CPF e documento</p>
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

        {/* PASSO 2 — Frente */}
        {status === 'doc_frente' && card(<>
          {passos(2)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Frente do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 2 de 4 — {tipoDoc === 'rg' ? 'RG' : tipoDoc === 'cnh' ? 'CNH' : 'CPF'} frente</p>
          {dicas([
            'Fundo liso, de preferência branco ou claro',
            'Boa iluminação — evite sombras e reflexos',
            'Documento inteiro visível, sem cortar bordas',
            'Sem acessórios cobrindo o documento',
            'Imagem nítida e sem borrão',
          ])}
          {botoesCaptura('frente', modoFrente, setModoFrente, docFrentePreview, docFrente, cameraFrenteAtiva, videoFrenteRef, canvasFrenteRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('frente'); setStatus('dados') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button onClick={() => { if (!docFrente) { setErroForm('Fotografe ou anexe a frente do documento.'); return } setErroForm(''); setStatus(tipoDoc === 'cpf_doc' ? 'selfie' : 'doc_verso') }}
              style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Próximo →</button>
          </div>
        </>)}

        {/* PASSO 3 — Verso */}
        {status === 'doc_verso' && card(<>
          {passos(3)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Verso do documento</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 3 de 4 — {tipoDoc === 'rg' ? 'RG' : 'CNH'} verso</p>
          {dicas([
            'Fundo liso, de preferência branco ou claro',
            'Boa iluminação — evite sombras e reflexos',
            'Documento inteiro visível, sem cortar bordas',
            'Imagem nítida e sem borrão',
          ])}
          {botoesCaptura('verso', modoVerso, setModoVerso, docVersoPreview, docVerso, cameraVersoAtiva, videoVersoRef, canvasVersoRef)}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => { pararCamera('verso'); setStatus('doc_frente') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            <button onClick={() => { if (!docVerso) { setErroForm('Fotografe ou anexe o verso do documento.'); return } setErroForm(''); setStatus('selfie') }}
              style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Próximo →</button>
          </div>
        </>)}

        {/* PASSO 4 — Selfie */}
        {status === 'selfie' && card(<>
          {passos(4)}
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: 'var(--text)', marginBottom: '4px' }}>Selfie ao vivo</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Passo 4 de 4 — Foto do seu rosto agora</p>
          {!selfiePreview && dicas([
            'Rosto inteiro visível, sem óculos ou boné',
            'Boa iluminação — evite contra a luz',
            'Fundo neutro e sem outras pessoas',
            'Expressão neutra, olhando para a câmera',
          ])}
          {!selfiePreview ? <>
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#111', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={videoSelfieRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '16px', display: cameraSelfieAtiva ? 'block' : 'none' }} />
              {cameraSelfieAtiva && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '80%', border: '2px dashed rgba(255,255,255,0.6)', borderRadius: '50%', pointerEvents: 'none' }} />
              )}
              {!cameraSelfieAtiva && <div style={{ textAlign: 'center', padding: '40px' }}><div style={{ fontSize: '48px' }}>🤳</div><p style={{ color: '#aaa', fontSize: '13px', marginTop: '8px' }}>Câmera desligada</p></div>}
            </div>
            <canvas ref={canvasSelfieRef} style={{ display: 'none' }} />
            {!cameraSelfieAtiva
              ? <button onClick={() => iniciarCamera('selfie')} style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>📷 Abrir câmera frontal</button>
              : <button onClick={() => tirarFoto('selfie')} style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>📸 Tirar selfie</button>
            }
          </> : <>
            <img src={selfiePreview} alt="selfie" style={{ width: '100%', borderRadius: '16px', marginBottom: '12px', maxHeight: '240px', objectFit: 'cover' }} />
            <button onClick={() => { setSelfieFile(null); setSelfiePreview(''); setTimeout(() => iniciarCamera('selfie'), 100) }} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer', marginBottom: '8px' }}>🔄 Refazer selfie</button>
          </>}
          {erroForm && <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '8px' }}>{erroForm}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => { pararCamera('selfie'); setStatus(tipoDoc === 'cpf_doc' ? 'doc_frente' : 'doc_verso') }} style={{ flex: 1, backgroundColor: 'transparent', border: '1.5px solid var(--border)', borderRadius: '100px', padding: '12px', fontSize: '14px', color: 'var(--muted)', fontWeight: '600', cursor: 'pointer' }}>← Voltar</button>
            {selfieFile && <button onClick={enviarVerificacao} style={{ flex: 2, backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Enviar ✓</button>}
          </div>
        </>)}

        {status === 'enviando' && <div>
          <div style={{ width: '56px', height: '56px', border: '5px solid var(--accent)', borderTop: '5px solid transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Enviando documentos...</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Não feche esta tela.</p>
        </div>}

        {status === 'sucesso' && card(<>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '22px', color: 'var(--text)', marginBottom: '12px' }}>Documentos enviados!</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.7' }}>Seus documentos foram enviados. Bem-vindo(a) ao MeAndYou!<br /><br />Redirecionando...</p>
          <div style={{ width: '48px', height: '48px', border: '4px solid var(--accent)', borderTop: '4px solid transparent', borderRadius: '50%', margin: '24px auto 0', animation: 'spin 1s linear infinite' }} />
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