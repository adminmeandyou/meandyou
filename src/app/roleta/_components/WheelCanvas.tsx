'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Gift, Ticket, Loader2, Zap } from 'lucide-react'
import { WHEEL_SEGMENTS } from './helpers'

type Props = {
  wheelSize: number
  spinning: boolean
  canSpin: boolean
  tickets: number
  spinsLeft: number
  dailyTickets: number
  countdown: string
  limits: { isBlack: boolean; isPlus: boolean }
  onSpin: () => void
  onShowPrizes: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  particleRef: React.RefObject<HTMLCanvasElement | null>
}

export function drawWheelOnCanvas(canvas: HTMLCanvasElement, currentRotation: number, wheelSize: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const size = wheelSize
  canvas.width = size
  canvas.height = size
  const cx = size / 2
  const cy = size / 2
  const outerR = cx - 4
  const innerR = outerR - 4
  const segCount = WHEEL_SEGMENTS.length
  const segAngle = (2 * Math.PI) / segCount

  ctx.clearRect(0, 0, size, size)

  ctx.save()
  ctx.shadowColor = 'rgba(225,29,72,0.6)'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(225,29,72,0.7)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, outerR - 8, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  WHEEL_SEGMENTS.forEach((seg, i) => {
    const startAngle = currentRotation + i * segAngle
    const endAngle = startAngle + segAngle
    const midAngle = startAngle + segAngle / 2

    const gxA = cx + (innerR * 0.2) * Math.cos(midAngle)
    const gyA = cy + (innerR * 0.2) * Math.sin(midAngle)
    const gxB = cx + (innerR * 0.92) * Math.cos(midAngle)
    const gyB = cy + (innerR * 0.92) * Math.sin(midAngle)
    const grad = ctx.createLinearGradient(gxA, gyA, gxB, gyB)
    grad.addColorStop(0, seg.colorA + 'cc')
    grad.addColorStop(1, seg.colorB + 'ff')

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, innerR, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.strokeStyle = seg.colorB
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle))
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(midAngle)
    ctx.textAlign = 'right'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.max(8, wheelSize * 0.030)}px Inter, sans-serif`
    ctx.fillText(seg.label, innerR - 12, 4)
    ctx.restore()

    const iconDist = innerR * 0.32
    const ix = cx + iconDist * Math.cos(midAngle)
    const iy = cy + iconDist * Math.sin(midAngle)
    ctx.beginPath()
    ctx.arc(ix, iy, 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = seg.colorB
    ctx.shadowColor = seg.colorB
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0
  })

  const hubR = Math.max(22, wheelSize * 0.10)
  const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 2, cx, cy, hubR)
  hubGrad.addColorStop(0, '#2a0d1c')
  hubGrad.addColorStop(0.5, '#16050f')
  hubGrad.addColorStop(1, '#0F1117')
  ctx.save()
  ctx.shadowColor = 'rgba(225,29,72,0.4)'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI)
  ctx.fillStyle = hubGrad
  ctx.fill()
  ctx.strokeStyle = 'rgba(225,29,72,0.60)'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.restore()

  ctx.beginPath()
  ctx.arc(cx, cy, hubR - 6, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
  ctx.fillStyle = '#E11D48'
  ctx.shadowColor = '#E11D48'
  ctx.shadowBlur = 12
  ctx.fill()
  ctx.shadowBlur = 0
}

export default function WheelCanvas({ wheelSize, spinning, canSpin, tickets, spinsLeft, dailyTickets, countdown, limits, onSpin, onShowPrizes, canvasRef, particleRef }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <button
        onClick={onShowPrizes}
        style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', color: 'rgba(248,249,250,0.55)', fontFamily: 'var(--font-jakarta)', fontSize: 11, fontWeight: 600, marginBottom: 10 }}
      >
        <Gift size={12} strokeWidth={1.5} />
        O que posso ganhar?
      </button>

      <div style={{ position: 'relative', width: wheelSize + 40, height: wheelSize + 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: wheelSize * 0.7, height: wheelSize * 0.7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 70%)', animation: spinning ? 'wheel-glow-pulse 0.5s ease-in-out infinite alternate' : 'none', pointerEvents: 'none' }} />

        <canvas ref={particleRef} width={wheelSize + 40} height={wheelSize + 40} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />

        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 15, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #E11D48', filter: 'drop-shadow(0 0 8px rgba(225,29,72,0.9))' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E11D48', boxShadow: '0 0 10px rgba(225,29,72,0.9)', marginTop: -2 }} />
        </div>

        <canvas
          ref={canvasRef}
          width={wheelSize}
          height={wheelSize}
          style={{ borderRadius: '50%', display: 'block', cursor: canSpin ? 'pointer' : 'default', filter: spinning ? 'brightness(1.05)' : 'brightness(1)', transition: 'filter 0.3s' }}
          onClick={onSpin}
        />

        <div style={{ position: 'absolute', width: wheelSize + 16, height: wheelSize + 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      </div>

      <button
        onClick={onSpin}
        disabled={!canSpin}
        style={{ marginTop: 16, width: '100%', maxWidth: '320px', padding: '16px 24px', borderRadius: '16px', border: canSpin ? '1px solid rgba(225,29,72,0.40)' : '1px solid rgba(225,29,72,0.15)', backgroundColor: canSpin ? '#E11D48' : 'rgba(225,29,72,0.20)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: canSpin ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-jakarta)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: canSpin ? '0 8px 32px rgba(225,29,72,0.35)' : 'none' }}
      >
        {spinning ? (
          <><Loader2 size={18} strokeWidth={1.5} style={{ animation: 'spin-anim 0.8s linear infinite' }} />Girando...</>
        ) : tickets === 0 ? (
          <><Ticket size={16} strokeWidth={1.5} />Próximo giro em {countdown}</>
        ) : spinsLeft === 0 ? (
          <><Ticket size={16} strokeWidth={1.5} />Limite diário, renova em {countdown}</>
        ) : (
          <><Zap size={16} strokeWidth={2} />Girar (1 ticket)</>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Plano {limits.isBlack ? 'Black' : limits.isPlus ? 'Plus' : 'Essencial'}</span>
        <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: dailyTickets }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i < (dailyTickets - spinsLeft) ? 'rgba(234,179,8,0.3)' : '#eab308', boxShadow: i < (dailyTickets - spinsLeft) ? 'none' : '0 0 6px rgba(234,179,8,0.6)' }} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: spinsLeft > 0 ? '#eab308' : 'var(--muted)' }}>
          {spinsLeft > 0 ? `${spinsLeft} ${spinsLeft > 1 ? 'disponíveis' : 'disponível'}` : 'Esgotados'}
        </span>
      </div>
    </div>
  )
}
