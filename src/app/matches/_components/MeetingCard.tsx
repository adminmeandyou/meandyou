'use client'

import Image from 'next/image'
import { MapPin, CalendarCheck, RefreshCw, Check, CalendarX, Ban } from 'lucide-react'
import { MeetingInvite, formatMeetingDate, getMeetingStatusInfo } from './helpers'

export function MeetingCard({
  invite,
  onAccept,
  onDecline,
  onCancel,
  onReschedule,
  loading,
}: {
  invite: MeetingInvite
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  onReschedule?: () => void
  loading: boolean
}) {
  const statusInfo = getMeetingStatusInfo(invite.status, invite.is_proposer)
  const isActive = invite.status === 'pending' || invite.status === 'accepted'
  const isPast = new Date(invite.meeting_date).getTime() < Date.now()

  return (
    <div style={{
      padding: 16, borderRadius: 16,
      background: 'rgba(15,17,23,0.70)',
      border: `1px solid ${isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
      opacity: isActive ? 1 : 0.65,
    }}>
      {/* Topo: foto + nome + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0,
          background: '#13161F', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {invite.other_photo ? (
            <Image src={invite.other_photo} alt={invite.other_name} fill className="object-cover" sizes="44px" draggable={false} style={{ pointerEvents: 'none' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(248,249,250,0.5)', fontFamily: 'var(--font-fraunces)', fontSize: 18 }}>
              {invite.other_name[0]}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#F8F9FA', fontFamily: 'var(--font-fraunces)' }}>
              {invite.other_name}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
              background: statusInfo.bg, color: statusInfo.color,
              border: `1px solid ${statusInfo.border}`,
            }}>
              {statusInfo.label}
            </span>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)' }}>
            {invite.is_proposer ? 'Você convidou' : 'Convidou você'}
          </p>
        </div>
      </div>

      {/* Detalhes */}
      <div style={{
        padding: 12, borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.04)',
        marginBottom: isActive ? 14 : 0,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={13} color="var(--accent)" strokeWidth={1.5} />
          <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.75)' }}>{invite.local}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarCheck size={13} color="var(--accent)" strokeWidth={1.5} />
          <span style={{ fontSize: 13, color: 'rgba(248,249,250,0.75)' }}>{formatMeetingDate(invite.meeting_date)}</span>
        </div>
        {invite.reschedule_note && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 2 }}>
            <RefreshCw size={13} color="#F59E0B" strokeWidth={1.5} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(248,249,250,0.55)', fontStyle: 'italic' }}>"{invite.reschedule_note}"</span>
          </div>
        )}
      </div>

      {/* Ações */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {invite.status === 'pending' && !invite.is_proposer && onAccept && (
            <button
              onClick={onAccept}
              disabled={loading}
              style={{
                flex: 1, minWidth: 100, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.30)',
                color: '#10b981', fontSize: 13, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-jakarta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Check size={14} strokeWidth={2} /> Aceitar
            </button>
          )}

          {invite.status === 'pending' && !invite.is_proposer && onDecline && (
            <button
              onClick={onDecline}
              disabled={loading}
              style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)',
                color: '#f87171', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-jakarta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <CalendarX size={14} strokeWidth={1.5} /> Recusar
            </button>
          )}

          {onReschedule && (
            <button
              onClick={onReschedule}
              disabled={loading}
              style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)',
                color: '#F59E0B', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-jakarta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <RefreshCw size={14} strokeWidth={1.5} /> Remarcar
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(248,249,250,0.45)', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-jakarta)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Ban size={14} strokeWidth={1.5} /> Cancelar
            </button>
          )}
        </div>
      )}

      {isPast && invite.status === 'accepted' && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 10,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)',
          fontSize: 12, color: '#10b981', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <CalendarCheck size={13} strokeWidth={1.5} /> Encontro realizado
        </div>
      )}
    </div>
  )
}
