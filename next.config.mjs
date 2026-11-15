/** @type {import('next').NextConfig} */
import { LEGACY_PERSONA_HTTP_REDIRECTS } from "./src/lib/sttns/legacyPersonaHttpRedirects.mjs";

const nextConfig = {
  output: "standalone",
  // Optimiseur d'images désactivé : les avis de sécurité next/image (DoS, cache) ne sont corrigés qu'en 15.5+.
  images: { unoptimized: true },
  poweredByHeader: false,
  /**
   * Étape B — Personas legacy → Matrice Besoins (`/why`).
   * 308 permanent ; pages App Router gardent aussi `redirect()` en filet.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return LEGACY_PERSONA_HTTP_REDIRECTS;
  },
  webpack: (config, { dev }) => {
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });

    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          "**/.next/**",
          "**/node_modules/**",
          "**/assets/**",
          "**/.cursor/**",
          "**/mcps/**",
          "**/terminals/**",
          "**/agent-transcripts/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
