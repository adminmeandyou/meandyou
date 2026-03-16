'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, ChevronRight, User, HelpCircle,
  FileText, Shield, Trash2, LogOut, CreditCard, Headphones,
  ShieldCheck, Monitor, Mail
} from 'lucide-react'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ name: string; photo_best: string | null } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('name, photo_best')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #b8f542', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0e0b14', fontFamily: 'var(--font-jakarta)', paddingBottom: '40px' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: '#fff', fontSize: '20px', margin: 0 }}>Configurações</h1>
      </div>

      {/* Perfil preview */}
      {profile && (
        <Link
          href={userId ? `/perfil/${userId}` : '#'}
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none' }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
            {profile.photo_best ? (
              <Image src={profile.photo_best} alt={profile.name} fill className="object-cover" sizes="56px" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '22px' }}>?</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#fff', fontWeight: 600, margin: 0, fontSize: '15px' }}>{profile.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0' }}>Ver meu perfil público</p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
        </Link>
      )}

      {/* Seções */}
      <div style={{ marginTop: '8px' }}>

        <Secao titulo="Perfil">
          <ItemMenu href="/configuracoes/editar-perfil" icone={<User size={18} />} label="Editar perfil" />
          <ItemMenu href="/minha-assinatura" icone={<CreditCard size={18} />} label="Minha assinatura" />
        </Secao>

        <Secao titulo="Suporte">
          <ItemMenu href="/ajuda" icone={<HelpCircle size={18} />} label="Central de ajuda" />
          <ItemMenu href="/suporte" icone={<Headphones size={18} />} label="Abrir chamado" />
        </Secao>

        <Secao titulo="Segurança">
          <ItemMenu href="/configuracoes/2fa" icone={<ShieldCheck size={18} />} label="Verificação em dois fatores" />
          <ItemMenu href="/configuracoes/sessoes" icone={<Monitor size={18} />} label="Sessões ativas" />
          <ItemMenu href="/configuracoes/alterar-email" icone={<Mail size={18} />} label="Alterar email" />
        </Secao>

        <Secao titulo="Legal">
          <ItemMenu href="/termos" icone={<FileText size={18} />} label="Termos de uso" />
          <ItemMenu href="/privacidade" icone={<Shield size={18} />} label="Política de privacidade" />
        </Secao>

        <Secao titulo="Conta">
          <ItemMenu href="/deletar-conta" icone={<Trash2 size={18} />} label="Deletar conta" perigo />
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LogOut size={18} color="#f87171" />
            </div>
            <span style={{ color: '#f87171', fontSize: '15px', fontWeight: 500 }}>Sair da conta</span>
          </button>
        </Secao>

      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '12px 20px 6px' }}>{titulo}</p>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {children}
      </div>
    </div>
  )
}

function ItemMenu({ href, icone, label, perigo }: { href: string; icone: React.ReactNode; label: string; perigo?: boolean }) {
  return (
    <Link
      href={href}
      style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: perigo ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: perigo ? '#f87171' : 'rgba(255,255,255,0.6)' }}>{icone}</span>
      </div>
      <span style={{ color: perigo ? '#f87171' : '#fff', fontSize: '15px', fontWeight: 500, flex: 1 }}>{label}</span>
      <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
    </Link>
  )
}
