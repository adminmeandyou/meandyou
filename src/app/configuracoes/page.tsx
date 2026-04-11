'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, ChevronRight, User, HelpCircle, FileText, Shield, Trash2,
  LogOut, CreditCard, Headphones, ShieldCheck, Monitor, Mail, Bell,
  Eye, EyeOff, Lock, Smartphone, Bug, Paperclip, X, Heart, Users, Crown, Compass,
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ ativo, onChange, loading }: { ativo: boolean; onChange: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      aria-checked={ativo}
      role="switch"
      style={{
        width: '44px', height: '26px', borderRadius: '100px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        backgroundColor: ativo ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
        position: 'relative', flexShrink: 0, transition: 'background-color 0.25s cubic-bezier(0.4,0,0.2,1)',
        opacity: loading ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: ativo ? '21px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.22s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
      }} />
    </button>
  )
}

// ─── Row de link (ícone + label + chevron) ─────────────────────────────────────
function LinkRow({
  href, icon, label, sub, badge, perigo = false, last = false,
}: {
  href: string; icon: React.ReactNode; label: string;
  sub?: string; badge?: React.ReactNode; perigo?: boolean; last?: boolean;
}) {
  const accent = perigo ? '#f87171' : '#fff'
  const bgIcon = perigo ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.07)'
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', textDecoration: 'none', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: bgIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: perigo ? '#f87171' : 'rgba(255,255,255,0.55)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: accent, fontSize: '15px', fontWeight: 500, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '12px', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      {badge && <span style={{ marginRight: '4px' }}>{badge}</span>}
      <ChevronRight size={16} color="rgba(255,255,255,0.18)" />
    </Link>
  )
}

// ─── Row de toggle (ícone + label + switch) ────────────────────────────────────
function ToggleRow({
  icon, label, sub, ativo, onChange, loading, last = false,
}: {
  icon: React.ReactNode; label: string; sub?: string;
  ativo: boolean; onChange: () => void; loading?: boolean; last?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgba(255,255,255,0.55)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontSize: '15px', fontWeight: 500, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '12px', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <ToggleSwitch ativo={ativo} onChange={onChange} loading={loading} />
    </div>
  )
}

// ─── Card container de seção ───────────────────────────────────────────────────
function CardSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px', padding: '0 16px' }}>
      <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', paddingLeft: '4px' }}>
        {titulo}
      </p>
      <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, cor }: { label: string; cor: string }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: cor, backgroundColor: `${cor}18`, border: `1px solid ${cor}30`, borderRadius: '100px', padding: '2px 8px' }}>
      {label}
    </span>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
  const router = useRouter()
  const toast = useToast()
  const haptics = useHaptics()

  const [profile, setProfile]   = useState<{ name: string; photo_best: string | null; plan: string } | null>(null)
  const [email, setEmail]       = useState('')
  const [userId, setUserId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [twoFaAtivo, set2FA]    = useState(false)

  const [bugModal, setBugModal] = useState(false)
  const [bugDescricao, setBugDescricao] = useState('')
  const [bugFile, setBugFile] = useState<File | null>(null)
  const [bugEnviando, setBugEnviando] = useState(false)
  const [bugEnviado, setBugEnviado] = useState(false)

  // toggles
  const [showLastActive, setShowLastActive]         = useState(true)
  const [notifEmail, setNotifEmail]                 = useState(true)
  const [notifPush, setNotifPush]                   = useState(false)
  const [savingLastActive, setSavingLastActive]     = useState(false)
  const [savingNotifEmail, setSavingNotifEmail]     = useState(false)
  const [savingPush, setSavingPush]                 = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? '')

      const [{ data: prof }, { data: usr }] = await Promise.all([
        supabase.from('profiles').select('name, photo_best, plan, show_last_active, notifications_email').eq('id', user.id).single(),
        supabase.from('users').select('totp_enabled').eq('id', user.id).single(),
      ])

      if (prof) {
        setProfile({ name: prof.name, photo_best: prof.photo_best, plan: prof.plan ?? 'essencial' })
        setShowLastActive(prof.show_last_active ?? true)
        setNotifEmail(prof.notifications_email ?? true)
      }
      if (usr) set2FA(usr.totp_enabled ?? false)

      // push: verificar permissão atual do browser
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') setNotifPush(true)

      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    haptics.medium()
    await supabase.auth.signOut()
    await fetch('/api/auth/logout', { method: 'POST' })
    document.cookie = 'sb-access-token=; Max-Age=0; path=/'
    document.cookie = 'sb-refresh-token=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  async function toggleLastActive() {
    if (!userId) return
    haptics.tap()
    setSavingLastActive(true)
    const novo = !showLastActive
    setShowLastActive(novo)
    try {
      const { error } = await supabase.from('profiles').update({ show_last_active: novo }).eq('id', userId!)
      if (error) throw error
      toast.success(novo ? 'Status de atividade ativado' : 'Status de atividade ocultado')
    } catch {
      setShowLastActive(!novo)
      toast.error('Erro ao salvar preferência')
    }
    setSavingLastActive(false)
  }

  async function toggleNotifEmail() {
    if (!userId) return
    haptics.tap()
    setSavingNotifEmail(true)
    const novo = !notifEmail
    setNotifEmail(novo)
    try {
      const { error } = await supabase.from('profiles').update({ notifications_email: novo }).eq('id', userId!)
      if (error) throw error
      toast.success(novo ? 'Emails de engajamento ativados' : 'Emails de engajamento desativados')
    } catch {
      setNotifEmail(!novo)
      toast.error('Erro ao salvar preferência')
    }
    setSavingNotifEmail(false)
  }

  async function toggleNotifPush() {
    haptics.tap()
    if (notifPush) { setNotifPush(false); return }
    setSavingPush(true)
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          setNotifPush(true)
          toast.success('Notificações ativadas')
        } else {
          toast.info('Permissão negada pelo dispositivo')
        }
      }
    } finally { setSavingPush(false) }
  }

  async function enviarBug() {
    if (bugDescricao.trim().length < 20) return
    setBugEnviando(true)
    try {
      const fd = new FormData()
      fd.append('descricao', bugDescricao)
      if (bugFile) fd.append('screenshot', bugFile)
      const res = await fetch('/api/bugs/reportar', { method: 'POST', body: fd })
      if (res.ok) {
        setBugEnviado(true)
        setBugDescricao('')
        setBugFile(null)
      }
    } catch {
      // falha silenciosa — usuario nao perde o texto digitado
    } finally {
      setBugEnviando(false)
    }
  }

  const planLabel = profile?.plan === 'black' ? 'Black' : profile?.plan === 'plus' ? 'Plus' : 'Essencial'
  const planLabelFull = profile?.plan === 'black' ? 'PLANO BLACK' : profile?.plan === 'plus' ? 'PLANO PLUS' : 'PLANO ESSENCIAL'
  const planCor = profile?.plan === 'black' ? '#F59E0B' : profile?.plan === 'plus' ? 'var(--accent)' : 'rgba(255,255,255,0.4)'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: 'var(--font-jakarta)', paddingBottom: '48px' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(8,9,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => router.back()} style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--text)', fontSize: '20px', margin: 0 }}>Configurações</h1>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '20px' }}>

        {/* ── Avatar + nome (editorial centrado) ── */}
        {profile && (
          <Link href={userId ? `/perfil/${userId}` : '#'} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '28px 20px 24px', textDecoration: 'none', marginBottom: '8px',
          }}>
            {/* Avatar com badge do plano */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%', overflow: 'hidden',
                position: 'relative', flexShrink: 0,
                border: profile.plan === 'black' ? '2px solid #F59E0B' : '2px solid var(--accent-border)',
                boxShadow: profile.plan === 'black'
                  ? '0 0 28px rgba(245,158,11,0.25)'
                  : '0 0 28px rgba(225,29,72,0.15)',
              }}>
                {profile.photo_best ? (
                  <Image src={profile.photo_best} alt={profile.name} fill style={{ objectFit: 'cover' }} sizes="84px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)' }}>
                    <User size={32} color="var(--muted)" />
                  </div>
                )}
              </div>
              {/* Badge do plano na base do avatar */}
              <div style={{
                position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: profile.plan === 'black' ? '#000' : '#fff',
                background: profile.plan === 'black'
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                  : profile.plan === 'plus'
                  ? 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)'
                  : 'rgba(255,255,255,0.18)',
                borderRadius: 100, padding: '3px 10px', whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                border: '1.5px solid rgba(0,0,0,0.15)',
              }}>
                {planLabelFull}
              </div>
            </div>

            {/* Nome */}
            <p style={{
              color: 'var(--text)', fontWeight: 700, margin: '8px 0 0',
              fontSize: 22, fontFamily: 'var(--font-fraunces)', letterSpacing: '-0.02em',
              textAlign: 'center',
            }}>{profile.name}</p>

            {/* Email */}
            <p style={{
              color: 'var(--muted)', fontSize: 13, margin: '5px 0 0',
              textAlign: 'center',
            }}>{email}</p>

            {/* Ver perfil */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
              fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            }}>
              <span>Ver perfil</span>
              <ChevronRight size={13} />
            </div>
          </Link>
        )}

        {/* ── CONTA ── */}
        <CardSection titulo="Conta">
          <LinkRow href="/configuracoes/editar-perfil" icon={<User size={17} />} label="Editar perfil" sub="Fotos, bio, aparência, filtros" />
          <LinkRow href="/minha-assinatura" icon={<CreditCard size={17} />} label="Minha assinatura" sub="Gerenciar plano e cobranças" badge={<Badge label={planLabel} cor={planCor} />} />
          <LinkRow href="/configuracoes/alterar-email" icon={<Mail size={17} />} label="Alterar email" sub={email} last />
        </CardSection>

        {/* ── CASAL (Black only) ── */}
        {profile?.plan === 'black' && (
          <CardSection titulo="Plano Black">
            <LinkRow href="/backstage" icon={<Crown size={17} />} label="Camarote Black" sub="Vitrine exclusiva e resgates" badge={<Badge label="Black" cor="#F59E0B" />} />
            <LinkRow href="/amigos" icon={<Users size={17} />} label="Amigos" sub="Ver amigos online" last />
          </CardSection>
        )}
        {profile?.plan !== 'black' && (
          <CardSection titulo="Social">
            <LinkRow href="/amigos" icon={<Users size={17} />} label="Amigos" sub="Ver amigos online" last />
          </CardSection>
        )}

        {/* ── PRIVACIDADE ── */}
        <CardSection titulo="Privacidade">
          <ToggleRow
            icon={<Eye size={17} />}
            label="Mostrar quando estou ativo"
            sub={showLastActive ? 'Visível para outros usuários' : 'Oculto para outros usuários'}
            ativo={showLastActive}
            onChange={toggleLastActive}
            loading={savingLastActive}
          />
          <LinkRow
            href="/loja"
            icon={<EyeOff size={17} />}
            label="Modo invisível"
            sub="Fique oculto no feed por 7 dias"
            badge={<Badge label="Na loja" cor="rgba(255,255,255,0.35)" />}
          />
          <LinkRow
            href="/configuracoes/2fa"
            icon={<Lock size={17} />}
            label="Verificação em dois fatores"
            sub={twoFaAtivo ? 'Ativado' : 'Desativado - recomendamos ativar'}
            badge={twoFaAtivo ? <Badge label="Ativo" cor="#22c55e" /> : <Badge label="Inativo" cor="#f59e0b" />}
            last
          />
        </CardSection>

        {/* ── NOTIFICAÇÕES ── */}
        <CardSection titulo="Notificações">
          <ToggleRow
            icon={<Mail size={17} />}
            label="Emails de engajamento"
            sub="Matches, curtidas e novidades por email"
            ativo={notifEmail}
            onChange={toggleNotifEmail}
            loading={savingNotifEmail}
          />
          <ToggleRow
            icon={<Bell size={17} />}
            label="Notificações push"
            sub={notifPush ? 'Ativadas neste dispositivo' : 'Ative para receber alertas instantâneos'}
            ativo={notifPush}
            onChange={toggleNotifPush}
            loading={savingPush}
            last
          />
        </CardSection>

        {/* ── SESSÕES ── */}
        <CardSection titulo="Sessões">
          <LinkRow
            href="/configuracoes/sessoes"
            icon={<Smartphone size={17} />}
            label="Dispositivos ativos"
            sub="Veja e encerre sessões abertas"
            last
          />
        </CardSection>

        {/* ── SUPORTE ── */}
        <CardSection titulo="Suporte">
          <LinkRow href="/ajuda" icon={<HelpCircle size={17} />} label="Central de ajuda" sub="Perguntas frequentes" />
          <LinkRow href="/suporte" icon={<Headphones size={17} />} label="Abrir chamado" sub="Falar com o suporte" />
          <button onClick={() => { setBugModal(true); setBugEnviado(false) }} style={{
            display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: 'none', textAlign: 'left',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bug size={18} color="rgba(255,255,255,0.55)" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: 500, margin: 0 }}>Reportar problema</p>
              <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '12px', margin: '2px 0 0' }}>Encontrou um problema? Avise-nos.</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.20)" />
          </button>
        </CardSection>

        {/* ── LEGAL ── */}
        <CardSection titulo="Legal">
          <LinkRow href="/termos" icon={<FileText size={17} />} label="Termos de uso" />
          <LinkRow href="/privacidade" icon={<Shield size={17} />} label="Política de privacidade" last />
        </CardSection>

        {/* ── ZONA DE RISCO ── */}
        <CardSection titulo="Zona de risco">
          <LinkRow href="/deletar-conta" icon={<Trash2 size={17} />} label="Excluir conta" sub="Remove todos os dados permanentemente" perigo last />
        </CardSection>

        {/* ── BOTAO SAIR — pill vermelho centralizado ── */}
        <div style={{ padding: '8px 32px 32px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 40px',
              borderRadius: '100px',
              background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)',
              border: 'none', cursor: 'pointer',
              color: '#fff', fontFamily: 'var(--font-jakarta)',
              fontSize: '14px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(225,29,72,0.30)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <LogOut size={15} strokeWidth={2} />
            Sair da conta
          </button>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modal de reporte de bugs */}
      {bugModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(19,22,31,0.95) 0%, rgba(15,17,23,0.98) 100%)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '430px', padding: '24px 20px 36px', boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.25)' }}>
            {bugEnviado ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🙏</p>
                <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '20px', marginBottom: '8px' }}>Obrigado pela sua contribuição!</h3>
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '14px', lineHeight: 1.6 }}>
                  Nossa equipe irá analisar o problema. Se for constatado, você receberá uma recompensa especial.
                </p>
                <button onClick={() => setBugModal(false)} style={{ marginTop: '20px', padding: '12px 24px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '18px' }}>Reportar problema</h3>
                  <button onClick={() => setBugModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.40)', padding: '4px' }}>
                    <X size={20} />
                  </button>
                </div>
                <textarea
                  placeholder="O que aconteceu? Descreva com detalhes (mínimo 20 caracteres)..."
                  value={bugDescricao}
                  onChange={e => setBugDescricao(e.target.value)}
                  rows={5}
                  style={{ width: '100%', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#13161F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px' }}>
                  <Paperclip size={16} color="rgba(255,255,255,0.40)" strokeWidth={1.5} />
                  <span style={{ color: bugFile ? '#fff' : 'rgba(255,255,255,0.40)', fontSize: '14px' }}>
                    {bugFile ? bugFile.name : 'Anexar print (opcional)'}
                  </span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBugFile(e.target.files?.[0] ?? null)} />
                </label>
                <button
                  onClick={enviarBug}
                  disabled={bugEnviando || bugDescricao.trim().length < 20}
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', color: '#fff',
                    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                    cursor: bugDescricao.trim().length < 20 ? 'not-allowed' : 'pointer',
                    opacity: bugDescricao.trim().length < 20 ? 0.5 : 1,
                  }}
                >
                  {bugEnviando ? 'Enviando...' : 'Enviar relatório'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
