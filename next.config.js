/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit the minimal Node.js server used by the self-hosted container.
  output: "standalone",

  // Keep development artifacts separate from production `.next` output.
  // Network-backed workspaces can otherwise return EIO when `next dev` tries
  // to reuse files emitted by `next build`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "tile.openstreetmap.org" },
      { protocol: "https", hostname: "server.arcgisonline.com" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
    ],
  },
  webpack(config, { dev }) {
    if (dev) {
      // CodeSandbox's mounted filesystem does not reliably support webpack's
      // atomic pack-cache renames. Memory caching is safer for local preview.
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
