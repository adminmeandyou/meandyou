import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#08090E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          border: '1.5px solid rgba(225,29,72,0.40)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'Georgia, serif',
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#F8F9FA' }}>M</span>
          <span style={{ color: '#E11D48' }}>Y</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
