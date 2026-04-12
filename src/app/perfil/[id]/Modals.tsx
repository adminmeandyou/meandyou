'use client'

import { X, ShieldAlert } from 'lucide-react'
import { BadgePill } from '@/components/ui/BadgePill'
import type { EmblemaDef } from './types'

// ─── Modal Pokedex ───────────────────────────────────────────────────────────

export function BadgeModal({ badge, onClose }: { badge: EmblemaDef; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', padding: '28px 24px', maxWidth: '340px', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: badge.desbloqueado ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badges/${badge.id}.svg`} alt="" width={48} height={48} style={{ display: 'block', opacity: badge.desbloqueado ? 1 : 0.20, filter: badge.desbloqueado ? 'none' : 'grayscale(1)' }} />
            {!badge.desbloqueado && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,14,0.65)' }}>
                <span style={{ fontSize: '28px', opacity: 0.5 }}>&#128274;</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>{badge.name}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
            <BadgePill rarity={badge.raridade} />
            {badge.desbloqueado && (
              <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', padding: '2px 8px', fontWeight: 600 }}>Desbloqueado</span>
            )}
          </div>
        </div>
        <p style={{ color: 'rgba(248,249,250,0.55)', fontSize: '14px', lineHeight: 1.65, textAlign: 'center', margin: '0 0 20px' }}>{badge.desc}</p>
        {!badge.desbloqueado && badge.total > 1 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.35)', fontWeight: 500 }}>Progresso</span>
              <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.50)', fontWeight: 600 }}>{badge.progresso}/{badge.total}</span>
            </div>
            <div style={{ height: '4px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((badge.progresso / badge.total) * 100, 100)}%`, borderRadius: '100px', backgroundColor: 'var(--accent)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', color: '#F8F9FA', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Fechar</button>
      </div>
    </div>
  )
}

// ─── Modal Emergencia ────────────────────────────────────────────────────────

export function EmergencyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(225,29,72,0.25)', borderRadius: '20px', padding: '28px 24px', maxWidth: '360px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(225,29,72,0.12)', border: '1px solid rgba(225,29,72,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldAlert size={26} color="#E11D48" strokeWidth={1.5} />
        </div>
        <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>Você está em perigo?</h3>
        <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>
          Esta ação ligará imediatamente para a <strong style={{ color: 'rgba(248,249,250,0.70)' }}>Polícia Militar (190)</strong>. Use apenas em situações de risco real.
        </p>
        <a href="tel:190" style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '16px', textDecoration: 'none', marginBottom: '12px', boxSizing: 'border-box', fontFamily: 'var(--font-jakarta)' }}>Ligar 190 agora</a>
        <button onClick={onClose} style={{ display: 'block', width: '100%', padding: '12px', background: 'none', border: 'none', color: 'rgba(248,249,250,0.30)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Modal Denuncia ──────────────────────────────────────────────────────────

interface DenunciaModalProps {
  profileId: string
  userId: string
  supabase: any
  toast: any
  onClose: () => void
}

export function DenunciaModal({ profileId, userId, supabase, toast, onClose }: DenunciaModalProps) {
  const [categoria, setCat] = __import_useState('')
  const [texto, setTexto] = __import_useState('')
  const [enviando, setEnviando] = __import_useState(false)
  const [enviado, setEnviado] = __import_useState(false)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div style={{ backgroundColor: '#0F1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {enviado ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span style={{ fontSize: '22px' }}>&#10003;</span>
            </div>
            <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>Denúncia enviada</h3>
            <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '14px', lineHeight: 1.65, marginBottom: '24px' }}>Nossa equipe vai analisar e tomar as medidas necessárias. Obrigado por ajudar a manter a comunidade segura.</p>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#F8F9FA', fontFamily: 'var(--font-fraunces)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Denunciar perfil</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="rgba(248,249,250,0.35)" strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ color: 'rgba(248,249,250,0.45)', fontSize: '13px', marginBottom: '14px', marginTop: 0 }}>Por que você está denunciando este perfil?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {DENUNCIA_CATS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCat(cat.id)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${categoria === cat.id ? 'rgba(225,29,72,0.40)' : 'rgba(255,255,255,0.07)'}`, backgroundColor: categoria === cat.id ? 'rgba(225,29,72,0.08)' : 'rgba(255,255,255,0.04)', color: categoria === cat.id ? 'var(--accent)' : 'rgba(248,249,250,0.65)', fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'var(--font-jakarta)' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              maxLength={500}
              rows={3}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#F8F9FA', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'var(--font-jakarta)', lineHeight: 1.6 }}
            />
            <button
              disabled={!categoria || enviando}
              onClick={async () => {
                if (!categoria || !userId) return
                setEnviando(true)
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  await fetch('/api/denuncias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
                    body: JSON.stringify({ reported_user_id: profileId, category: categoria, description: texto }),
                  })
                  setEnviado(true)
                } catch {
                  toast.show('Erro ao enviar denúncia. Tente novamente.', 'error')
                } finally {
                  setEnviando(false)
                }
              }}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: !categoria ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #E11D48 0%, #be123c 100%)', border: 'none', color: !categoria ? 'rgba(248,249,250,0.25)' : '#fff', fontWeight: 700, fontSize: '15px', cursor: !categoria ? 'not-allowed' : 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', fontFamily: 'var(--font-jakarta)' }}
            >
              {enviando ? 'Enviando...' : 'Enviar denúncia'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// useState precisa ser importado assim para evitar problemas com 'use client'
import { useState as __import_useState } from 'react'

const DENUNCIA_CATS = [
  { id: 'fake', label: 'Perfil falso ou fotos enganosas' },
  { id: 'inappropriate', label: 'Conteúdo inapropriado' },
  { id: 'harassment', label: 'Assédio ou comportamento abusivo' },
  { id: 'spam', label: 'Spam ou golpe' },
  { id: 'minor', label: 'Possível menor de idade' },
  { id: 'other', label: 'Outro motivo' },
]
