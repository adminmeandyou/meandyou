'use client'

interface SkeletonLoaderProps {
  variant?: 'text' | 'avatar' | 'card' | 'rect'
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  count?: number
  gap?: number
}

function SkeletonItem({
  width,
  height,
  borderRadius,
}: {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
}) {
  return (
    <div
      className="ui-skeleton"
      style={{
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: borderRadius ?? 8,
      }}
    />
  )
}

export function SkeletonLoader({
  variant = 'rect',
  width,
  height,
  borderRadius,
  count = 1,
  gap = 10,
}: SkeletonLoaderProps) {
  if (variant === 'avatar') {
    const size = (typeof width === 'number' ? width : 48)
    return (
      <SkeletonItem
        width={size}
        height={size}
        borderRadius="50%"
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className="ui-skeleton"
        style={{
          width: width ?? '100%',
          height: height ?? 280,
          borderRadius: borderRadius ?? 16,
        }}
      />
    )
  }

  if (variant === 'text') {
    const widths = ['100%', '88%', '72%', '80%', '65%']
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonItem
            key={i}
            width={count === 1 ? (width ?? '100%') : widths[i % widths.length]}
            height={height ?? 14}
            borderRadius={borderRadius ?? 6}
          />
        ))}
      </div>
    )
  }

  // rect
  return (
    <SkeletonItem
      width={width}
      height={height}
      borderRadius={borderRadius}
    />
  )
}
