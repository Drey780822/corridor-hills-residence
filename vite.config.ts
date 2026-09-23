// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Photos and videos live on Lovable's asset CDN and are served from /__l5e/assets-v1/...
// That path only exists on Lovable hosting, so when running locally we proxy it to the
// hosted project. Inside Lovable this proxy is skipped (the platform serves it directly).
const isLovableSandbox = Boolean(process.env["LOVABLE_SANDBOX"]);
const assetHost = "https://project--40086d5d-8880-4648-b966-5c5ae27f9bdf.lovable.app";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: isLovableSandbox
    ? {}
    : {
        server: {
          proxy: {
            "/__l5e": {
              target: assetHost,
              changeOrigin: true,
              secure: true,
            },
          },
        },
      },
});
