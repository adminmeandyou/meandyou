'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { SkeletonLine, SkeletonAvatar, skeletonCss } from '@/components/Skeleton'
import { Search, MessageCircle, Star, Dices, ShieldCheck } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const verificarEstado = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        // Proxy já garante que só chega aqui quem completou onboarding
        // Buscamos apenas o nome para exibir na tela
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()

        setNome(profile?.name ?? '')
        setCarregando(false)
      } catch (err) {
        console.error('[dashboard] Erro ao carregar:', err)
        setCarregando(false)
      }
    }

    verificarEstado()
  }, [])

  const handleLogout = async () => {
    // Faz signOut no Supabase e limpa cookies de sessão
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style>{skeletonCss}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 280 }}>
          <SkeletonAvatar size={64} />
          <SkeletonLine width={160} height={18} />
          <SkeletonLine width={220} height={14} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 8 }}>
            {[1,2,3,4].map(i => <SkeletonLine key={i} height={72} radius={16} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 60%), var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '32px', color: 'var(--text)', marginBottom: '8px' }}>
          MeAnd<span style={{ color: 'var(--accent)' }}>You</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>Olá, <strong style={{ color: 'var(--text)' }}>{nome}</strong>!</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent-light)', borderRadius: '100px', padding: '6px 14px', marginBottom: '32px' }}>
          <ShieldCheck size={13} color="var(--accent)" strokeWidth={1.5} />
          <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>Identidade verificada</span>
        </div>

        {/* Atalhos principais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Buscar',      rota: '/modos',      icon: <Search size={18} strokeWidth={1.5} /> },
            { label: 'Conversas',   rota: '/conversas',  icon: <MessageCircle size={18} strokeWidth={1.5} /> },
            { label: 'Destaque',    rota: '/destaque',   icon: <Star size={18} strokeWidth={1.5} /> },
            { label: 'Roleta',      rota: '/roleta',     icon: <Dices size={18} strokeWidth={1.5} /> },
          ].map(({ label, rota, icon }) => (
            <button key={rota} onClick={() => router.push(rota)}
              style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px 12px', fontSize: '14px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
              <span style={{ color: 'var(--accent)' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <button onClick={() => router.push('/modos')}
          style={{ width: '100%', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', boxShadow: '0 4px 20px rgba(225,29,72,0.25)', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
          Começar a explorar →
        </button>

        <button onClick={handleLogout}
          style={{ background: 'none', border: '2px solid rgba(255,255,255,0.06)', borderRadius: '100px', padding: '14px 32px', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
          Sair
        </button>
      </div>
    </div>
  )
}
