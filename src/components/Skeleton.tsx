/**
 * Skeleton loaders reutilizáveis.
 * Uso: <SkeletonCard /> <SkeletonList rows={5} /> <SkeletonAvatar />
 */

const pulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: '8px',
}

/** Uma linha de texto genérica */
export function SkeletonLine({ width = '100%', height = 14, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  return <div style={{ ...pulse, width, height, borderRadius: radius, flexShrink: 0 }} />
}

/** Avatar circular */
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <div style={{ ...pulse, width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />
}

/** Card de perfil para grid de busca */
export function SkeletonCard() {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ ...pulse, width: '100%', aspectRatio: '3/4', borderRadius: 0 }} />
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="60%" height={15} />
        <SkeletonLine width="40%" height={12} />
      </div>
    </div>
  )
}

/** Linha de conversa/lista */
export function SkeletonListRow({ last = false }: { last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--border-soft)' }}>
      <SkeletonAvatar size={48} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonLine width="45%" height={13} />
        <SkeletonLine width="70%" height={11} />
      </div>
      <SkeletonLine width={36} height={11} />
    </div>
  )
}

/** Lista de N linhas */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} last={i === rows - 1} />
      ))}
    </div>
  )
}

/** Grid de cards (busca, destaque) */
export function SkeletonGrid({ cols = 2, rows = 3 }: { cols?: number; rows?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', padding: '16px' }}>
      {Array.from({ length: cols * rows }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

/** Notificação */
export function SkeletonNotif({ last = false }: { last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
      <SkeletonAvatar size={40} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
        <SkeletonLine width="80%" height={13} />
        <SkeletonLine width="50%" height={11} />
      </div>
    </div>
  )
}

export const skeletonCss = `@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`
