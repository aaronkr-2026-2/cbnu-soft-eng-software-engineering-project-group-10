import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (process.env.VERCEL && !apiUrl)
  throw new Error('Set NEXT_PUBLIC_API_URL before deploying.');
if (apiUrl) {
  const url = new URL(apiUrl);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'NEXT_PUBLIC_API_URL must be an HTTP(S) origin without credentials, path or query.',
    );
  }
  if (process.env.VERCEL && url.protocol !== 'https:')
    throw new Error('Hosted frontend requires an HTTPS backend.');
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
