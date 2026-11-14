/** @type {import('next').NextConfig} */
import { LEGACY_PERSONA_HTTP_REDIRECTS } from "./src/lib/sttns/legacyPersonaHttpRedirects.mjs";

const nextConfig = {
  output: "standalone",
  /**
   * Étape B — Personas legacy → Matrice Besoins (`/why`).
   * 308 permanent ; pages App Router gardent aussi `redirect()` en filet.
   */
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
