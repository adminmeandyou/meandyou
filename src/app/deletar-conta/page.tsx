'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, AlertTriangle, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'

export default function DeletarContaPage() {
  const router = useRouter()
  const [step, setStep] = useState<'aviso' | 'confirmar'>('aviso')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!senha.trim()) {
      setError('Digite sua senha para confirmar.')
      return
    }
    setError(null)
    setLoading(true)

    // 1. Verifica a senha fazendo login (se falhar, senha errada)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha,
    })

    if (loginErr) {
      setError('Senha incorreta. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Chama a API de exclusão (service role faz tudo no servidor)
    const res = await fetch('/api/auth/deletar-conta', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    setLoading(false)

    if (res.ok) {
      // Limpa cookies de sessão
      document.cookie = 'sb-access-token=; Max-Age=0; path=/'
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
      router.replace('/')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error ?? 'Erro ao excluir conta. Tente novamente ou contate o suporte.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0b14] font-jakarta pb-24">

      <header className="sticky top-0 z-30 bg-[#0e0b14]/90 backdrop-blur border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/60" />
        </button>
        <div className="flex-1">
          <h1 className="font-fraunces text-xl text-white">Excluir conta</h1>
          <p className="text-white/30 text-xs">Ação permanente e irreversível</p>
        </div>
      </header>

      <div className="px-5 pt-8 max-w-sm mx-auto space-y-6">

        {step === 'aviso' && (
          <>
            {/* Ícone de alerta */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={36} className="text-red-400" />
              </div>
              <div className="text-center">
                <h2 className="font-fraunces text-2xl text-white mb-2">Tem certeza?</h2>
                <p className="text-white/40 text-sm leading-relaxed">
                  Ao excluir sua conta, todos os seus dados serão removidos permanentemente, incluindo matches, conversas e fotos.
                </p>
              </div>
            </div>

            {/* Lista do que será deletado */}
            <div className="rounded-2xl p-4 bg-red-500/5 border border-red-500/20 space-y-2">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldAlert size={12} /> O que será excluído permanentemente
              </p>
              {[
                'Perfil e fotos',
                'Todos os matches e conversas',
                'Histórico de curtidas',
                'Saldo de SuperLikes, Boosts, Lupas e tickets',
                'Assinatura ativa (sem reembolso)',
                'Indicações e bônus pendentes',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-400 shrink-0" />
                  <span className="text-white/50 text-xs">{item}</span>
                </div>
              ))}
            </div>

            {/* Aviso LGPD */}
            <p className="text-white/20 text-xs text-center leading-relaxed">
              Em conformidade com a LGPD, todos os seus dados pessoais serão removidos de nossos servidores após a exclusão.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => setStep('confirmar')}
                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition"
              >
                Continuar com a exclusão
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm hover:text-white transition"
              >
                Cancelar — manter minha conta
              </button>
            </div>
          </>
        )}

        {step === 'confirmar' && (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertTriangle size={32} className="text-red-400" />
              <h2 className="font-fraunces text-xl text-white">Confirme sua senha</h2>
              <p className="text-white/40 text-sm">
                Digite sua senha para confirmar a exclusão definitiva da conta.
              </p>
            </div>

            <div>
              <label className="text-xs text-white/30 uppercase tracking-widest block mb-2">Sua senha</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                  placeholder="Digite sua senha"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500/40"
                  autoFocus
                />
                <button
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={loading || !senha.trim()}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {loading ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
              </button>
              <button
                onClick={() => { setStep('aviso'); setSenha(''); setError(null) }}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-sm hover:text-white transition"
              >
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
