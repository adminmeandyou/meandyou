'use client'

interface SliderRangeProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  unit?: string
  step?: number
  disabled?: boolean
  label?: string
}

export function SliderRange({
  min,
  max,
  value,
  onChange,
  unit = '',
  step = 1,
  disabled = false,
  label,
}: SliderRangeProps) {
  const [minVal, maxVal] = value
  const range = max - min

  const leftPercent = ((minVal - min) / range) * 100
  const rightPercent = ((maxVal - min) / range) * 100

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-jakarta)' }}>
            {label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
            {minVal}{unit} — {maxVal}{unit}
          </span>
        </div>
      )}
      {!label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
            {minVal}{unit}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jakarta)' }}>
            {maxVal}{unit}
          </span>
        </div>
      )}
      <div
        style={{
          position: 'relative',
          height: 6,
          margin: '11px 0',
        }}
      >
        {/* Track base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 100,
          }}
        />
        {/* Track preenchido */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
            backgroundColor: disabled ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
            borderRadius: 100,
            transition: 'left 0.05s, right 0.05s',
          }}
        />
        {/* Input min */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          disabled={disabled}
          className="ui-range-input"
          style={{ zIndex: minVal > max - range * 0.25 ? 5 : 3 }}
          onChange={(e) => {
            const val = Math.min(Number(e.target.value), maxVal - step)
            onChange([val, maxVal])
          }}
        />
        {/* Input max */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          disabled={disabled}
          className="ui-range-input"
          style={{ zIndex: 4 }}
          onChange={(e) => {
            const val = Math.max(Number(e.target.value), minVal + step)
            onChange([minVal, val])
          }}
        />
      </div>
    </div>
  )
}
