import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 180, height: 180 }

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#08090E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '38px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '46px',
              fontWeight: 700,
              color: '#F8F9FA',
              letterSpacing: '-2px',
              display: 'flex',
            }}
          >
            Me
            <span style={{ color: '#E11D48' }}>And</span>
            You
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
