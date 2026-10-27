import type { NextConfig } from 'next';

// Static export for GitHub Pages (REBUILD-PLAN.md §3). NEXT_PUBLIC_BASE_PATH is set by the
// Pages workflow to "/<repo>"; it is empty locally.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      // msw/browser exports `null` for Node; give the server render a stub (src/mocks/server-stub.ts).
      'msw/browser': { browser: 'msw/browser', default: './src/mocks/server-stub.ts' },
    },
  },
};

export default nextConfig;
