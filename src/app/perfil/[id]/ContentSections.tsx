'use client'

import {
  MapPin, Heart, Eye, Calendar, Ruler, Weight,
  Award, Pencil, Check, ChevronDown, ChevronUp
} from 'lucide-react'
import type { EmblemaDef, StatusChip, DbBadge } from './types'
import { getAparenciaTags, getEstiloTags, getPersonalidadeTags, getObjetivosTags } from './utils'

const GENDER_LABELS: Record<string, string> = {
  cis_man:     'Homem',
  cis_woman:   'Mulher',
  trans_man:   'Homem Trans',
  trans_woman: 'Mulher Trans',
  nonbinary:   'Não-binário',
  fluid:       'Gênero Fluido',
  masculino:   'Masculino',
  feminino:    'Feminino',
}
function formatGender(g: string) {
  return GENDER_LABELS[g] ?? g.charAt(0).toUpperCase() + g.slice(1)
}

// ─── Status Chips ────────────────────────────────────────────────────────────

export function StatusChips({ chips }: { chips: StatusChip[] }) {
  if (chips.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
      {chips.map((c, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
          {c.label}
        </span>
      ))}
    </div>
  )
}

// ─── Bio Section ─────────────────────────────────────────────────────────────

export function BioSection({ bio, isOwnProfile, onEdit }: { bio: string | null; isOwnProfile: boolean; onEdit: () => void }) {
  if (!bio && !isOwnProfile) return null
  return (
    <div>
      {isOwnProfile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(248,249,250,0.30)' }}>Sobre mim</span>
          <EditButton onClick={onEdit} />
        </div>
      )}
      {bio ? (
        <p style={{ fontFamily: 'var(--font-fraunces)', fontStyle: 'italic', color: 'var(--accent)', fontSize: 'clamp(20px,5.5vw,26px)', lineHeight: '1.55', margin: 0, fontWeight: 400 }}>{bio}</p>
      ) : (
        <p style={{ color: 'rgba(248,249,250,0.25)', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>Adicione uma bio para se apresentar...</p>
      )}
    </div>
  )
}

// ─── Pergunta do Perfil ──────────────────────────────────────────────────────

export function ProfileQuestion({ question, answer }: { question: string; answer: string }) {
  return (
    <div style={{ backgroundColor: 'rgba(19,22,31,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px 20px' }}>
      <p style={{ color: 'rgba(248,249,250,0.35)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px' }}>{question}</p>
      <p style={{ color: '#F8F9FA', fontSize: '15px', lineHeight: '1.65', margin: 0, fontFamily: 'var(--font-jakarta)', fontWeight: 400 }}>{answer}</p>
    </div>
  )
}

// ─── Interesses (bento grid) ─────────────────────────────────────────────────

export function InterestsGrid({ tags, isOwnProfile, onEdit }: { tags: string[]; isOwnProfile: boolean; onEdit: () => void }) {
  if (!tags?.length) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(248,249,250,0.30)' }}>Interesses</span>
        {isOwnProfile && <EditButton onClick={onEdit} />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {tags.slice(0, 4).map((tag: string, i: number) => (
          <div key={i} style={{ backgroundColor: '#1a1b21', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px' }}>
            <Heart size={22} color="var(--accent)" strokeWidth={1.5} />
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: '14px', color: '#F8F9FA', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Info Grid (stats) ───────────────────────────────────────────────────────

export function InfoGrid({ age, city, state, gender, heightCm, weightKg, isOwnProfile, onEdit }: {
  age: number | null; city: string | null; state: string | null; gender: string | null
  heightCm: number | null; weightKg: number | null; isOwnProfile: boolean; onEdit: () => void
}) {
  return (
    <div>
      {isOwnProfile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(248,249,250,0.30)' }}>Características</span>
          <EditButton onClick={onEdit} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {age && <StatCard icon={<Calendar size={14} strokeWidth={1.5} />} label="Idade" value={`${age} anos`} />}
        {city && <StatCard icon={<MapPin size={14} strokeWidth={1.5} />} label="Cidade" value={`${city}${state ? `, ${state}` : ''}`} />}
        {gender && <StatCard icon={<Eye size={14} strokeWidth={1.5} />} label="Gênero" value={formatGender(gender)} />}
        {heightCm && <StatCard icon={<Ruler size={14} strokeWidth={1.5} />} label="Altura" value={`${heightCm} cm`} />}
        {weightKg && <StatCard icon={<Weight size={14} strokeWidth={1.5} />} label="Peso" value={`${weightKg} kg`} />}
      </div>
    </div>
  )
}

// ─── Trust Score ─────────────────────────────────────────────────────────────

export function TrustScore({ score }: { score: number }) {
  return (
    <div style={{ backgroundColor: 'rgba(19,22,31,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Confiança do perfil</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8F9FA' }}>{score}%</span>
      </div>
      <div style={{ height: '3px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: '100px', backgroundColor: 'var(--accent)', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Avaliacoes ──────────────────────────────────────────────────────────────

export function RatingsCard({ ratings }: { ratings: { total: number; positive: number } }) {
  return (
    <div style={{ backgroundColor: 'rgba(19,22,31,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Avaliações dos matches</span>
        <span style={{ fontSize: '11px', color: 'rgba(248,249,250,0.25)' }}>{ratings.total} {ratings.total === 1 ? 'avaliação' : 'avaliações'}</span>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: '0 0 2px' }}>
            {Math.round((ratings.positive / ratings.total) * 100)}%
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.40)', margin: 0 }}>Boas conversas</p>
        </div>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#F8F9FA', margin: '0 0 2px' }}>{ratings.total}</p>
          <p style={{ fontSize: '11px', color: 'rgba(248,249,250,0.40)', margin: 0 }}>Avaliações</p>
        </div>
      </div>
    </div>
  )
}

// ─── Tag Sections (filtros) ──────────────────────────────────────────────────

export function FilterTags({ filters, isOwnProfile, onEdit }: { filters: any; isOwnProfile: boolean; onEdit: () => void }) {
  return (
    <>
      <TagSection title="Aparência" tags={getAparenciaTags(filters)} onEdit={isOwnProfile ? onEdit : undefined} />
      <TagSection title="Estilo de vida" tags={getEstiloTags(filters)} />
      <TagSection title="Personalidade" tags={getPersonalidadeTags(filters)} />
      <TagSection title="O que busca" tags={getObjetivosTags(filters)} />
    </>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ backgroundColor: 'rgba(19,22,31,0.95)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ color: 'rgba(248,249,250,0.40)', fontSize: '10px', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ color: '#F8F9FA', fontSize: '13px', fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

function TagSection({ title, tags, onEdit }: { title: string; tags: string[]; onEdit?: () => void }) {
  if (tags.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(248,249,250,0.30)', margin: 0 }}>{title}</h3>
        {onEdit && <EditButton onClick={onEdit} />}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {tags.map((tag) => (
          <span key={tag} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(248,249,250,0.50)' }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 100, padding: '3px 10px', color: 'rgba(248,249,250,0.45)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jakarta)' }}>
      <Pencil size={10} strokeWidth={1.5} />
      Editar
    </button>
  )
}
