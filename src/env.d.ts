/// <reference types="@cloudflare/workers-types" />

import type { AppEnv } from "@/lib/auth-server";

// `import { env } from "cloudflare:workers"` is typed as `Cloudflare.Env`, which
// @cloudflare/workers-types intentionally leaves empty for projects to merge into.
declare global {
  namespace Cloudflare {
    interface Env extends AppEnv {}
  }
}
