# Cloudflare setup

Nyx Fit runs on Cloudflare Workers through the Cloudflare Vite plugin, with D1 for
application and auth data and a private R2 bucket for images. TanStack Start server
functions and route handlers read bindings with `import { env } from "cloudflare:workers"`.

## Bindings and configuration

| Binding | Kind | Local | Production |
| --- | --- | --- | --- |
| `DB` | D1 database | `.wrangler/state` emulation | `nyx-fit` |
| `IMAGES` | R2 bucket | `.wrangler/state` emulation | `nyx-fit-images` |
| `BETTER_AUTH_URL` | Worker var / secret | `.dev.vars` | Worker var or secret |
| `BETTER_AUTH_SECRET` | Secret | `.dev.vars` | `bunx wrangler secret put` |
| `GOOGLE_CLIENT_ID` | Secret | `.dev.vars` (optional) | `bunx wrangler secret put` |
| `GOOGLE_CLIENT_SECRET` | Secret | `.dev.vars` (optional) | `bunx wrangler secret put` |

`wrangler.jsonc` ships with a placeholder `database_id`. Replace it with the id printed
by `bunx wrangler d1 create nyx-fit` before any remote command. `BETTER_AUTH_URL` is
intentionally not set in `wrangler.jsonc` so local development fails loudly when
`.dev.vars` is missing.

Binding types live in `src/env.d.ts`. `AppEnv` is declared in `src/lib/auth-server.ts`
and merged into Cloudflare's generated `Cloudflare.Env` namespace, because that is how
`@cloudflare/workers-types` exposes the type of `cloudflare:workers`' `env` export. No
hand-written `as Env` casts are needed.

Auth tables are created by `src/db/migrations/0001_auth.sql`, generated from better-auth
1.3.27 with the Kysely `sqlite` adapter (camelCase columns, ISO dates, `0`/`1` booleans).
The remaining tables are added by later migrations in the same folder. D1 has no
interactive transactions (`BEGIN`/`COMMIT` across statements); a single `D1.batch()` call is
atomic, so better-auth is configured with `transaction: false` and multi-statement writes
go through `batch()`.

## Local development

```bash
bun install
# create .dev.vars from the example and set BETTER_AUTH_URL + BETTER_AUTH_SECRET
bunx wrangler d1 migrations apply nyx-fit --local
bun run dev
```

- `bun run dev` runs the app inside `workerd`, so D1 and R2 are the local emulations.
- Google sign-in stays disabled until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are
  present. To exercise it locally, add both to `.dev.vars` and register
  `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
  `.env` / `.env.local` are not read by the Worker runtime — auth env must live in
  `.dev.vars`, otherwise better-auth fails with `Provider not found`.
- A fresh local D1 database without migrations fails better-auth with
  `no such table: verification`; run the migrations command above before first sign-in.
- `.dev.vars` is gitignored. Do not commit real credentials.

Useful commands:

```bash
bun run typecheck   # tsc --noEmit
bun run test        # vitest run (isolated config, no app plugins)
bun run build       # vite build + service-worker generation
bun run preview     # preview the built Worker
```

## Production (operator steps)

These steps change remote Cloudflare resources and are not run as part of local
implementation or verification.

```bash
bunx wrangler login
bunx wrangler d1 create nyx-fit                    # copy the id into wrangler.jsonc
bunx wrangler r2 bucket create nyx-fit-images
bunx wrangler d1 migrations apply nyx-fit --remote
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bun run deploy                                     # build + wrangler deploy
```

- Set `BETTER_AUTH_URL` to the canonical serving origin, `https://fit.webdevsam.pro`, as a
  dashboard variable (or a local `vars` entry that is not committed). The auth handler
  always uses this value, never the request host; it must be an origin only, without path,
  query, or fragment.
- Register the matching Google redirect URI,
  `https://fit.webdevsam.pro/api/auth/callback/google`.
- Google sign-in is required for the current login UI. Without both Google secrets the
  provider is not registered, so plan to set them before the first production deploy.
- The configured origin is trusted automatically; add any additional origin to
  `trustedOrigins` in `src/lib/auth-server.ts`.
- Changing the serving origin means attaching that domain's zone on the same Cloudflare
  account and updating both `BETTER_AUTH_URL` and the Google redirect URI to the new origin.
- `bunx wrangler deploy --dry-run` verifies the bundle and asset upload without deploying.
- `bun run preview` serves the built Worker from `dist/`. It copies `.dev.vars` into
  `dist/server/`, which is a local-only artifact inside the gitignored `dist/`; it is not
  uploaded by `wrangler deploy`.
- Workers Free allows 10 ms CPU per request, which server-rendered auth and D1 reads can
  exceed under load; the paid plan is the realistic target.
- `bunx wrangler types` is optional and writes `worker-configuration.d.ts`. Binding types
  are maintained by hand in `src/env.d.ts`, which merges `AppEnv` into `Cloudflare.Env`; the
  app does not depend on generated types.

## Service worker and offline behavior

One post-build generator (`scripts/generate-sw.mjs`) owns `dist/client/sw.js`:

- Precache: icons, `manifest.json` and `assetlinks.json` only (about 190 KB).
- Runtime cache: Google Fonts stylesheets and webfonts.
- Not precached: `favicon/splash/**` (used by the native iOS shell) and `onboarding/**`
  first-run artwork; both are served by the Worker.
- Authenticated HTML, API routes and server functions are network-only: there is no
  navigation fallback and no page cache, so the app does not boot offline.
- The legacy `nyx-pages` cache is removed on activation through the generated
  `sw-cleanup.js`, which `sw.js` imports. The worker activates and claims clients
  immediately (`skipWaiting`/`clientsClaim`), so the purge does not wait for open tabs to
  close.
- `vite-plugin-pwa` development service-worker generation is disabled; `dev-dist/` is not
  regenerated by builds.
