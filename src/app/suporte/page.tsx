'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Headphones, Send, CheckCircle, Loader2, Crown, AlertCircle } from 'lucide-react'

const CATEGORIAS = [
  { value: 'verificacao', label: 'Verificacao de identidade' },
  { value: 'pagamento',   label: 'Pagamento / Assinatura' },
  { value: 'bug',         label: 'Bug / Problema tecnico' },
  { value: 'conta',       label: 'Minha conta' },
  { value: 'outro',       label: 'Outro' },
]

export default function SuportePage() {
  const { limits } = usePlan()
  const router = useRouter()

  const [form, setForm] = useState({ categoria: '', descricao: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!form.categoria || !form.descricao.trim()) {
      setError('Preencha a categoria e a descricao.')
      return
    }
    if (form.descricao.trim().length < 20) {
      setError('Descreva o problema com pelo menos 20 caracteres.')
      return
    }

    setError(null)
    setSending(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const plano = limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'
    const prioridade = limits.isBlack ? 'PRIORITARIO (Black)' : limits.isPlus ? 'Plus' : 'Essencial'

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/suporte', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        nome: profile?.name ?? 'Usuario',
        plano,
        prioridade,
        categoria: form.categoria,
        descricao: form.descricao,
      }),
    })

    setSending(false)

    if (res.ok) {
      setSent(true)
    } else {
      setError('Nao foi possivel enviar. Tente novamente ou mande email para adminmeandyou@proton.me')
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={28} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '24px', color: '#F8F9FA', margin: '0 0 8px' }}>Mensagem enviada!</h2>
          <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '14px', lineHeight: '1.6', margin: 0, maxWidth: '280px' }}>
            {limits.isBlack
              ? 'Suporte prioritario Black — responderemos em ate 24h.'
              : 'Responderemos o mais breve possivel pelo email cadastrado.'}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          style={{ padding: '12px 24px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(248,249,250,0.60)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={18} color="rgba(248,249,250,0.60)" strokeWidth={1.5} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', color: '#F8F9FA', margin: 0 }}>Suporte</h1>
          <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', margin: 0 }}>
            {limits.isBlack ? 'Prioritario — resposta em ate 24h' : 'Fale com a equipe MeAndYou'}
          </p>
        </div>
        {limits.isBlack && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', backgroundColor: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <Crown size={11} color="#F59E0B" strokeWidth={1.5} />
            <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: 700 }}>Black</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Badge plano */}
        <div style={{
          borderRadius: '16px', padding: '16px', border: '1px solid',
          borderColor: limits.isBlack ? 'rgba(245,158,11,0.20)' : limits.isPlus ? 'rgba(139,92,246,0.20)' : 'rgba(255,255,255,0.08)',
          backgroundColor: limits.isBlack ? 'rgba(245,158,11,0.05)' : limits.isPlus ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Headphones size={20} color={limits.isBlack ? '#F59E0B' : limits.isPlus ? '#8b5cf6' : 'rgba(248,249,250,0.30)'} strokeWidth={1.5} />
          <div>
            <p style={{ color: 'rgba(248,249,250,0.70)', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>
              {limits.isBlack ? 'Suporte prioritario 24h' : limits.isPlus ? 'Suporte Plus' : 'Suporte Essencial'}
            </p>
            <p style={{ color: 'rgba(248,249,250,0.30)', fontSize: '12px', margin: 0 }}>
              {limits.isBlack
                ? 'Sua mensagem sera tratada com prioridade maxima'
                : 'Para suporte prioritario, assine o plano Black'}
            </p>
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label style={{ display: 'block', color: 'rgba(248,249,250,0.30)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Categoria *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setForm((f) => ({ ...f, categoria: cat.value }))}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', textAlign: 'left', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)', transition: 'all 0.15s',
                  border: form.categoria === cat.value ? '1px solid rgba(225,29,72,0.40)' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: form.categoria === cat.value ? 'rgba(225,29,72,0.08)' : 'rgba(255,255,255,0.03)',
                  color: form.categoria === cat.value ? '#E11D48' : 'rgba(248,249,250,0.50)',
                  fontWeight: form.categoria === cat.value ? 600 : 400,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descricao */}
        <div>
          <label style={{ display: 'block', color: 'rgba(248,249,250,0.30)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Descricao * <span style={{ color: 'rgba(248,249,250,0.20)', textTransform: 'none', fontWeight: 400 }}>({form.descricao.length}/1000)</span>
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value.slice(0, 1000) }))}
            placeholder="Descreva o problema com o maximo de detalhes possivel..."
            rows={6}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', padding: '14px 16px', color: '#F8F9FA', fontSize: '14px', fontFamily: 'var(--font-jakarta)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Erro */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '12px', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)' }}>
            <AlertCircle size={14} color="#f87171" strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Botao enviar */}
        <button
          onClick={handleSubmit}
          disabled={sending}
          style={{ width: '100%', padding: '15px', borderRadius: '100px', backgroundColor: '#E11D48', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: sending ? 0.5 : 1 }}
        >
          {sending ? <Loader2 size={16} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} strokeWidth={1.5} />}
          {sending ? 'Enviando...' : 'Enviar mensagem'}
        </button>

        {/* FAQ link */}
        <p style={{ textAlign: 'center', color: 'rgba(248,249,250,0.20)', fontSize: '13px', margin: 0 }}>
          Tem uma duvida simples?{' '}
          <a href="/ajuda" style={{ color: 'rgba(248,249,250,0.40)', textDecoration: 'underline' }}>
            Consulte o FAQ
          </a>
        </p>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
