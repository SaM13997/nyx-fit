# Tailnet dev access

How to expose the Nyx Fit dev server over the tailnet for on-device testing
(e.g. the `android` node). URL format from the last working run:

```
https://devhub.cobbler-tritone.ts.net:9443
```

`devhub` (100.65.179.60) is the dev machine's MagicDNS name. Check the actual
name with `tailscale status --json | grep DNSName` — the tailnet suffix was
renamed once before (`tail092528` → `cobbler-tritone`), so never assume it.

## Quick reference

Use port 9443 for Nyx Fit: port 443 is already serving OpenChamber
(a `bun` process on port 5000), and other serve entries exist on 9119/49474.
Overwriting someone else's serve binding loses it silently — always run
`tailscale serve status` first and pick a free HTTPS port.

## Steps

1. `tailscale serve status` — confirm port 9443 is free.

2. Create `.dev.vars` (gitignored) from the example, with the tailnet origin
   as `BETTER_AUTH_URL` including the serve port. Plain `.env` / `.env.local`
   are NOT read by the Worker runtime.

   ```bash
   cp .dev.vars.example .dev.vars
   # BETTER_AUTH_URL=https://devhub.cobbler-tritone.ts.net:9443
   # BETTER_AUTH_SECRET=<openssl rand -hex 32>
   ```

3. Local D1 must have migrations applied or sign-in fails with
   `no such table: verification`:

   ```bash
   bunx wrangler d1 migrations apply nyx-fit --local
   ```

4. Start the dev server with the host allowlist or every request through the
   serve proxy gets a 403 from Vite's host check:

   ```bash
   VITE_ALLOWED_HOSTS=devhub.cobbler-tritone.ts.net bun run dev
   ```

   `VITE_ALLOWED_HOSTS` is read by `vite.config.ts` (`server.allowedHosts`).
   If the machine restarts, this env var is the one most often forgotten.

5. Start the serve proxy (background, survives the shell):

   ```bash
   tailscale serve --bg --https=9443 http://127.0.0.1:3000
   ```

6. Verify. TLS only completes with correct SNI, so local checks must use the
   hostname, not the raw 100.x.y.z IP:

   ```bash
   curl -sk -o /dev/null -w "%{http_code}\n" --resolve \
     devhub.cobbler-tritone.ts.net:9443:100.65.179.60 \
     https://devhub.cobbler-tritone.ts.net:9443/api/auth/get-session
   ```

   - `200` and a wrong-Host request still returning `403` (spoofed Host
     header) means everything is correct.
   - `000` / TLS alert over the IP address alone is an SNI artifact, not an
     outage — retest with `--resolve` before debugging.

## Gotchas

- `bun install` after any break with `ERR_MODULE_NOT_FOUND` from
  `vite.config.ts` imports.
- `getent hosts devhub.<suffix>.ts.net` should resolve to 100.65.179.60;
  if MagicDNS is stale on the test device, wait or ping the device.
- `tailscale cert <dnsname>` lists the only valid cert hostnames; anything
  else returns `invalid domain`.
- To stop serving: `tailscale serve --https=9443 off`.
