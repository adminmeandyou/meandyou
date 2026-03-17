'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlan } from '@/hooks/usePlan'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Headphones, Send, CheckCircle, Loader2, Crown, AlertCircle } from 'lucide-react'

const CATEGORIAS = [
  { value: 'verificacao', label: 'Verificação de identidade' },
  { value: 'pagamento',   label: 'Pagamento / Assinatura' },
  { value: 'bug',         label: 'Bug / Problema técnico' },
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
      setError('Preencha a categoria e a descrição.')
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
    const prioridade = limits.isBlack ? '🔴 PRIORITÁRIO (Black)' : limits.isPlus ? '🟡 Plus' : '⚪ Essencial'

    // Envia via API de email (Resend → adminmeandyou@proton.me)
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
        nome: profile?.name ?? 'Usuário',
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
      setError('Não foi possível enviar. Tente novamente ou mande email para adminmeandyou@proton.me')
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0e0b14] font-jakarta flex flex-col items-center justify-center px-8 gap-5">
        <div className="w-16 h-16 rounded-full bg-[#b8f542]/10 border border-[#b8f542]/30 flex items-center justify-center">
          <CheckCircle size={28} className="text-[#b8f542]" />
        </div>
        <div className="text-center">
          <h2 className="font-fraunces text-2xl text-white mb-2">Mensagem enviada!</h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            {limits.isBlack
              ? 'Suporte prioritário Black — responderemos em até 24h.'
              : 'Responderemos o mais breve possível pelo email cadastrado.'}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Suporte</h1>
          <p className="text-white/30 text-xs">
            {limits.isBlack ? '🔴 Prioritário — resposta em até 24h' : 'Fale com a equipe MeAndYou'}
          </p>
        </div>
        {limits.isBlack && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#f5c842]/10 border border-[#f5c842]/20">
            <Crown size={11} className="text-[#f5c842]" />
            <span className="text-[#f5c842] text-xs font-bold">Black</span>
          </div>
        )}
      </header>

      <div className="px-5 pt-6 space-y-5 max-w-md mx-auto">

        {/* Badge plano */}
        <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
          limits.isBlack
            ? 'bg-[#f5c842]/5 border-[#f5c842]/20'
            : limits.isPlus
              ? 'bg-violet-500/5 border-violet-500/20'
              : 'bg-white/3 border-white/8'
        }`}>
          <Headphones size={20} className={limits.isBlack ? 'text-[#f5c842]' : limits.isPlus ? 'text-violet-400' : 'text-white/30'} />
          <div>
            <p className="text-white/70 text-sm font-semibold">
              {limits.isBlack ? 'Suporte prioritário 24h' : limits.isPlus ? 'Suporte Plus' : 'Suporte Essencial'}
            </p>
            <p className="text-white/30 text-xs">
              {limits.isBlack
                ? 'Sua mensagem será tratada com prioridade máxima'
                : 'Para suporte prioritário, assine o plano Black'}
            </p>
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-white/30 uppercase tracking-widest block mb-2">Categoria *</label>
          <div className="space-y-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setForm((f) => ({ ...f, categoria: cat.value }))}
                className={`w-full py-3 px-4 rounded-xl border text-left text-sm transition ${
                  form.categoria === cat.value
                    ? 'bg-[#b8f542]/10 border-[#b8f542]/40 text-[#b8f542] font-semibold'
                    : 'bg-white/3 border-white/8 text-white/50 hover:border-white/20'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs text-white/30 uppercase tracking-widest block mb-2">
            Descrição * <span className="text-white/20 normal-case">({form.descricao.length}/1000)</span>
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value.slice(0, 1000) }))}
            placeholder="Descreva o problema com o máximo de detalhes possível…"
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#b8f542]/40 resize-none"
          />
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Botão enviar */}
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="w-full py-4 rounded-2xl bg-[#b8f542] text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#a8e030] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Enviando…' : 'Enviar mensagem'}
        </button>

        {/* FAQ link */}
        <p className="text-center text-white/20 text-xs">
          Tem uma dúvida simples?{' '}
          <a href="/ajuda" className="text-white/40 underline hover:text-white/60 transition">
            Consulte o FAQ
          </a>
        </p>

      </div>
    </div>
  )
}
