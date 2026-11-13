import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.34'],
  headers: async () => [
    { source: '/(.*)', headers: securityHeaders },
    // Game sprites and sounds in public/ are not content-hashed, so cache them
    // for a day and revalidate in the background instead of on every visit.
    {
      source: '/:asset(.+\\.(?:webp|mp3))',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=604800',
        },
      ],
    },
  ],
};

export default nextConfig;
