'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const ASSUNTOS = [
  { value: 'suporte',  label: 'Suporte técnico' },
  { value: 'conta',    label: 'Minha conta' },
  { value: 'cobranca', label: 'Cobrança / plano' },
  { value: 'denuncia', label: 'Denúncia de perfil' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'imprensa', label: 'Imprensa / mídia' },
  { value: 'outro',    label: 'Outro' },
]

export default function FaleConosco() {
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [assunto, setAssunto]     = useState('')
  const [mensagem, setMensagem]   = useState('')
  const [imagem, setImagem]       = useState<File | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [enviando, setEnviando]   = useState(false)
  const [enviado, setEnviado]     = useState(false)
  const [erro, setErro]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 5 MB.')
      return
    }
    setImagem(file)
    const reader = new FileReader()
    reader.onload = () => setImagemPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function removerImagem() {
    setImagem(null)
    setImagemPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!nome.trim() || !email.trim() || !assunto || !mensagem.trim()) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }
    if (mensagem.trim().length < 20) {
      setErro('Descreva sua mensagem com pelo menos 20 caracteres.')
      return
    }

    setEnviando(true)
    try {
      let imagemBase64: string | null = null
      let imagemNome: string | null = null

      if (imagem) {
        imagemBase64 = imagemPreview ?? null
        imagemNome   = imagem.name
      }

      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, assunto, mensagem, imagemBase64, imagemNome }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao enviar.'); return }
      setEnviado(true)
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08090E; color: #F8F9FA; font-family: var(--font-jakarta, system-ui), sans-serif; }
        .fc-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; background: radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, #08090E 70%); }
        .fc-card { width: 100%; max-width: 620px; background: linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 48px; }
        .fc-back { display: inline-flex; align-items: center; gap: 8px; color: rgba(248,249,250,0.45); font-size: 13px; text-decoration: none; margin-bottom: 32px; transition: color 0.2s; }
        .fc-back:hover { color: rgba(248,249,250,0.75); }
        .fc-logo { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .fc-logo span { color: #E11D48; }
        .fc-title { font-size: 28px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 6px; }
        .fc-subtitle { font-size: 14px; color: rgba(248,249,250,0.55); margin-bottom: 36px; line-height: 1.6; }
        .fc-field { margin-bottom: 18px; }
        .fc-label { display: block; font-size: 12px; font-weight: 600; color: rgba(248,249,250,0.55); letter-spacing: 0.5px; margin-bottom: 7px; }
        .fc-input, .fc-select, .fc-textarea {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; color: #F8F9FA; font-family: inherit; font-size: 14px;
          padding: 12px 16px; outline: none; transition: border-color 0.2s;
          appearance: none; -webkit-appearance: none;
        }
        .fc-input:focus, .fc-select:focus, .fc-textarea:focus { border-color: rgba(225,29,72,0.5); }
        .fc-select option { background: #13161F; }
        .fc-textarea { resize: vertical; min-height: 160px; line-height: 1.65; }
        .fc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .fc-row { grid-template-columns: 1fr; } .fc-card { padding: 32px 24px; } }
        .fc-upload-area {
          border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 12px;
          padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s;
        }
        .fc-upload-area:hover { border-color: rgba(225,29,72,0.4); background: rgba(225,29,72,0.03); }
        .fc-upload-hint { font-size: 13px; color: rgba(248,249,250,0.45); margin-top: 6px; }
        .fc-preview { position: relative; margin-top: 12px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
        .fc-preview img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
        .fc-preview-remove {
          position: absolute; top: 8px; right: 8px;
          background: rgba(0,0,0,0.65); border: none; border-radius: 50%;
          width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #fff; font-size: 16px; transition: background 0.2s;
        }
        .fc-preview-remove:hover { background: rgba(225,29,72,0.8); }
        .fc-error { background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #F43F5E; margin-bottom: 18px; }
        .fc-btn {
          width: 100%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #E11D48 0%, #be123c 100%); color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700; border: none; cursor: pointer;
          transition: background 0.2s, transform 0.15s; margin-top: 8px;
        }
        .fc-btn:hover { background: #be123c; transform: translateY(-1px); }
        .fc-btn:disabled { opacity: 0.6; cursor: default; transform: none; }
        .fc-success { text-align: center; padding: 48px 0; }
        .fc-success-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #4ade80; }
        .fc-success h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .fc-success p { font-size: 14px; color: rgba(248,249,250,0.55); line-height: 1.7; }
        .fc-note { font-size: 11px; color: rgba(248,249,250,0.3); text-align: center; margin-top: 20px; }
      `}</style>

      <div className="fc-wrap">
        <div className="fc-card">
          <Link href="/" className="fc-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Voltar para a página inicial
          </Link>

          <div className="fc-logo">MeAnd<span>You</span></div>

          {enviado ? (
            <div className="fc-success">
              <div className="fc-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3>Mensagem enviada!</h3>
              <p>Recebemos seu contato e responderemos em breve no e-mail informado.<br />Agradecemos por entrar em contato.</p>
              <p className="fc-note" style={{ marginTop: '28px' }}>
                <Link href="/" style={{ color: 'rgba(225,29,72,0.8)', textDecoration: 'none' }}>← Voltar para o início</Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="fc-title">Fale conosco</h1>
              <p className="fc-subtitle">
                Tem uma dúvida, sugestão ou precisa de ajuda? Preencha o formulário abaixo.<br />
                Respondemos em até 24 horas úteis.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="fc-row">
                  <div className="fc-field">
                    <label className="fc-label">Seu nome *</label>
                    <input className="fc-input" type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
                  </div>
                  <div className="fc-field">
                    <label className="fc-label">E-mail *</label>
                    <input className="fc-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="fc-field">
                  <label className="fc-label">Assunto *</label>
                  <select className="fc-select" value={assunto} onChange={e => setAssunto(e.target.value)}>
                    <option value="" disabled>Selecione um assunto</option>
                    {ASSUNTOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>

                <div className="fc-field">
                  <label className="fc-label">Mensagem *</label>
                  <textarea
                    className="fc-textarea"
                    placeholder="Descreva com detalhes o que você precisa..."
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                  />
                  <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.3)', marginTop: '5px', textAlign: 'right' }}>
                    {mensagem.length} caracteres
                  </p>
                </div>

                <div className="fc-field">
                  <label className="fc-label">Anexar imagem (opcional · máx. 5 MB)</label>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagem} />
                  {!imagemPreview ? (
                    <div className="fc-upload-area" onClick={() => fileRef.current?.click()}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(248,249,250,0.35)" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p className="fc-upload-hint">Clique para selecionar uma imagem</p>
                      <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)', marginTop: '4px' }}>PNG, JPG, WEBP · até 5 MB</p>
                    </div>
                  ) : (
                    <div className="fc-preview">
                      <img src={imagemPreview} alt="Prévia da imagem" />
                      <button type="button" className="fc-preview-remove" onClick={removerImagem}>×</button>
                    </div>
                  )}
                </div>

                {erro && <div className="fc-error">{erro}</div>}

                <button className="fc-btn" type="submit" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar mensagem'}
                </button>
              </form>

              <p className="fc-note">Feito com carinho por brasileiros 🇧🇷 · MeAndYou</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
