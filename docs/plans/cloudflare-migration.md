# Cloudflare migration

## Approved scope

- Use implementer subagents and Bun for package management and project commands.
- Move the TanStack Start app to Cloudflare Workers, application/auth data to D1, and images to a private R2 bucket.
- Start with an empty database. No legacy import tooling or changes to the live Convex deployment.
- Keep better-auth 1.3.27 with email/password and configured Google sign-in.
- Replace Convex subscriptions with user-scoped TanStack Query caches, mutation invalidation, focus/reconnect refresh, and an active-workout interval.
- Preserve existing working-tree UI changes.
- Approved dependencies: `@cloudflare/vite-plugin`, `wrangler`, `@cloudflare/workers-types`, `kysely`, and `kysely-d1`. Root configuration/build/lockfile changes and removal of replaced Convex/Vercel integration files are approved.

## Implementation

1. Replace Nitro with the Cloudflare Vite plugin. Configure local D1/R2 bindings, a secret example, Bun scripts, and isolated jsdom Vitest configuration.
2. Generate compatible better-auth SQL and add profiles, workouts, weight entries, and weight goals. Calculate exercise statistics from workouts.
3. Use typed TanStack server functions for application data and route handlers for auth and private images. Load Worker bindings and server helpers only inside server handlers.
4. Enforce session ownership, validated input, atomic goal upserts, one active workout per user, and revision-checked workout edits. Reject stale edits and preserve drawer input on failure.
5. Replace frontend Convex hooks/providers, preserving existing UI behavior. Publish mutation results before allowing the next workout save; invalidate affected detail/list/stat queries.
6. Keep static-asset/font caching. Remove authenticated HTML/API caching and obsolete page caches; document the resulting offline navigation limit.
7. Remove replaced Convex source/dependencies and Vercel integration, and document local development and production setup.

## Review

An implementer reviewed the plan for correctness and unnecessary complexity. Re-review found no remaining P0/P1 issues after clarifying server-only imports, secret configuration, service-worker caching, fresh-database scope, and stale-edit handling.

Use native D1 constraints, R2 bindings, existing TanStack server functions/query features, and a single effective service-worker generator. No ORM for application queries, Durable Objects, KV, custom realtime layer, or import framework.

## Verification and known limits

- Run Bun typecheck, Vitest, production build, local D1/R2/auth/ownership smoke checks, and Worker deployment dry-run.
- Inspect client output for server-only bindings and inspect service-worker rules.
- Baseline TypeScript passed. All 34 existing onboarding tests pass with an isolated jsdom configuration and explicit `@` alias; the current Vite test setup fails without it.
- The built-in browser is disconnected, so interactive Google sign-in and visual smoke checks require a connected browser.
- Actual deployment requires Cloudflare resource IDs/secrets and Google OAuth configuration. Local implementation verification does not constitute a production migration.

### Local HTTP regression check

After applying local migrations and building, run the built Worker on port 3000 with `bun run preview --port 3000`. In another shell, run `bun docs/reviews/cloudflare-http-smoke.mjs` from the repository root. This exercises the built TanStack RPC endpoints, real local D1 sessions/data, stale-edit rejection, and private R2 images. It creates two disposable accounts and a completed workout in the local database. It never targets a remote deployment.

## References

- https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- https://www.better-auth.com/docs/adapters/other-relational-databases
