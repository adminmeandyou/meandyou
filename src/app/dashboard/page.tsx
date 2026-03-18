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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Verifica se está verificado (campo em users, não em profiles)
      const { data: userData } = await supabase
        .from('users')
        .select('verified, banned')
        .eq('id', user.id)
        .single()

      if (userData?.banned) { router.push('/banido'); return }
      if (!userData?.verified) { router.push('/verificacao'); return }

      // Busca perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, onboarding_done')
        .eq('id', user.id)
        .single()

      // Nunca completou o onboarding E ainda nao tem nome → usuario novo, mostrar boas-vindas
      if (!profile?.onboarding_done && !profile?.name) { router.push('/onboarding'); return }

      // Onboarding feito → mostrar dashboard normalmente
      setNome(profile.name ?? '')
      setCarregando(false)
    }

    verificarEstado()
  }, [])

  const handleLogout = async () => {
    // Faz signOut no Supabase e limpa cookies de sessão
    await supabase.auth.signOut()
    // Limpa os cookies setados manualmente pelo /api/auth/login
    document.cookie = 'sb-access-token=; Max-Age=0; path=/'
    document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
    router.push('/login')
  }

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
            { label: 'Buscar',      rota: '/busca',      icon: <Search size={18} strokeWidth={1.5} /> },
            { label: 'Conversas',   rota: '/conversas',  icon: <MessageCircle size={18} strokeWidth={1.5} /> },
            { label: 'Destaque',    rota: '/destaque',   icon: <Star size={18} strokeWidth={1.5} /> },
            { label: 'Roleta',      rota: '/roleta',     icon: <Dices size={18} strokeWidth={1.5} /> },
          ].map(({ label, rota, icon }) => (
            <button key={rota} onClick={() => router.push(rota)}
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 12px', fontSize: '14px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent)' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <button onClick={() => router.push('/busca')}
          style={{ width: '100%', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '100px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
          Começar a explorar →
        </button>

        <button onClick={handleLogout}
          style={{ background: 'none', border: '2px solid var(--border)', borderRadius: '100px', padding: '14px 32px', color: 'var(--muted)', fontFamily: 'var(--font-jakarta)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
          Sair
        </button>
      </div>
    </div>
  )
}
