import path from "node:path";
import { generateServiceWorker } from "./scripts/generate-sw.mjs";

/** Vite plugin: emit Workbox SW into dist/client before Nitro copies public assets. */
export function nyxPwaSwPlugin() {
  let clientOutDir = path.resolve("dist/client");

  return {
    name: "nyx-pwa-sw",
    apply: "build",
    configResolved(config) {
      const clientEnvironment = config.environments?.client;
      if (clientEnvironment?.build?.outDir) {
        clientOutDir = path.resolve(clientEnvironment.build.outDir);
      }
    },
    async closeBundle() {
      if (this.environment.name !== "client") {
        return;
      }

      await generateServiceWorker(clientOutDir);
    },
  };
}
