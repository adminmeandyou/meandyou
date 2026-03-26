import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'akignnxgjyryqcgxesqn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://akignnxgjyryqcgxesqn.supabase.co https://images.unsplash.com",
              "connect-src 'self' https://akignnxgjyryqcgxesqn.supabase.co wss://akignnxgjyryqcgxesqn.supabase.co https://api.abacatepay.com https://api.resend.com https://me-and-you-195o0nxw.livekit.cloud wss://me-and-you-195o0nxw.livekit.cloud",
              "frame-src 'self' https://challenges.cloudflare.com",
              "media-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
