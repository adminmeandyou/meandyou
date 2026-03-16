'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react'
import Image from 'next/image'

type Etapa = 'loading' | 'inativo' | 'qrcode' | 'backup' | 'ativo' | 'desativar'

export default function Page2FA() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('loading')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigosBackup, setCodigosBackup] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('totp_enabled').eq('id', user.id).single()
      setEtapa(data?.totp_enabled ? 'ativo' : 'inativo')
    })
  }, [])

  async function gerarQR() {
    setCarregando(true); setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/auth/2fa/gerar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    const json = await res.json()
    setCarregando(false)
    if (!res.ok) { setErro(json.error); return }
    setQrCode(json.qr_code)
    setSecret(json.secret)
    setEtapa('qrcode')
  }

  async function ativar() {
    if (codigo.length < 6) { setErro('Digite o código de 6 dígitos'); return }
    setCarregando(true); setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/auth/2fa/ativar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ codigo }),
    })
    const json = await res.json()
    setCarregando(false)
    if (!res.ok) { setErro(json.error); return }
    setCodigosBackup(json.backup_codes)
    setCodigo('')
    setEtapa('backup')
  }

  async function desativar() {
    if (codigo.length < 6) { setErro('Digite o código para confirmar'); return }
    setCarregando(true); setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/auth/2fa/desativar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ codigo }),
    })
    const json = await res.json()
    setCarregando(false)
    if (!res.ok) { setErro(json.error); return }
    setCodigo('')
    setEtapa('inativo')
  }

  function copiarBackup() {
    navigator.clipboard.writeText(codigosBackup.join('\n'))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: 0 }}>Verificação em dois fatores</h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px' }}>

        {etapa === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* ─── INATIVO ─── */}
        {etapa === 'inativo' && (
          <div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <ShieldOff size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>2FA desativado</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                Ative a verificação em dois fatores para proteger sua conta com um app autenticador (Google Authenticator, Authy, etc).
              </p>
            </div>
            <button
              onClick={gerarQR}
              disabled={carregando}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: carregando ? 0.6 : 1 }}
            >
              {carregando ? 'Gerando...' : 'Ativar verificação em dois fatores'}
            </button>
            {erro && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{erro}</p>}
          </div>
        )}

        {/* ─── QR CODE ─── */}
        {etapa === 'qrcode' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              Escaneie o QR code abaixo com seu app autenticador e confirme com o código gerado.
            </p>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '16px' }}>
              {qrCode && <Image src={qrCode} alt="QR Code 2FA" width={200} height={200} />}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '4px' }}>Ou insira o código manualmente:</p>
            <code style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', backgroundColor: 'rgba(255,255,255,0.07)', padding: '8px 12px', borderRadius: '8px', display: 'block', marginBottom: '24px', wordBreak: 'break-all' }}>
              {secret}
            </code>
            <input
              type="text"
              inputMode="numeric"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Código de 6 dígitos"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '20px', textAlign: 'center', letterSpacing: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <button
              onClick={ativar}
              disabled={carregando || codigo.length < 6}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: (carregando || codigo.length < 6) ? 0.6 : 1 }}
            >
              {carregando ? 'Verificando...' : 'Confirmar e ativar'}
            </button>
            {erro && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{erro}</p>}
          </div>
        )}

        {/* ─── BACKUP CODES ─── */}
        {etapa === 'backup' && (
          <div>
            <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>Salve seus códigos de backup</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
                Guarde estes códigos em um local seguro. Cada um pode ser usado uma vez se voce perder acesso ao app autenticador.
              </p>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {codigosBackup.map((c, i) => (
                  <code key={i} style={{ color: '#fff', fontSize: '14px', letterSpacing: '2px', textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>{c}</code>
                ))}
              </div>
            </div>
            <button
              onClick={copiarBackup}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}
            >
              {copiado ? <><Check size={16} color="#22c55e" /> Copiado!</> : <><Copy size={16} /> Copiar todos</>}
            </button>
            <button
              onClick={() => setEtapa('ativo')}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
            >
              Ja salvei, continuar
            </button>
          </div>
        )}

        {/* ─── ATIVO ─── */}
        {etapa === 'ativo' && (
          <div>
            <div style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <ShieldCheck size={40} color="#22c55e" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>2FA ativado</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                Sua conta esta protegida com verificacao em dois fatores.
              </p>
            </div>
            <button
              onClick={() => { setEtapa('desativar'); setErro(''); setCodigo('') }}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
            >
              Desativar 2FA
            </button>
          </div>
        )}

        {/* ─── DESATIVAR ─── */}
        {etapa === 'desativar' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              Para desativar, confirme com o código do seu app autenticador.
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Código de 6 dígitos"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '20px', textAlign: 'center', letterSpacing: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <button
              onClick={desativar}
              disabled={carregando || codigo.length < 6}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: (carregando || codigo.length < 6) ? 0.6 : 1, marginBottom: '12px' }}
            >
              {carregando ? 'Processando...' : 'Confirmar desativacao'}
            </button>
            <button
              onClick={() => { setEtapa('ativo'); setErro(''); setCodigo('') }}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '15px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            {erro && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>{erro}</p>}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
