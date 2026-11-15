/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    // NOTE: script-src/style-src keep 'unsafe-inline' because Next.js
    // renders inline scripts/styles for RSC streaming; a bare 'self'
    // would break hydration. Everything else stays locked to self +
    // the tile hosts Leaflet needs.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    const headers = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
    ];
    if (isProd) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [{ source: '/:path*', headers }];
  },
};

export default nextConfig;
