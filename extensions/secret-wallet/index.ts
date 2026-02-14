import type { OpenClawPluginApi } from "../../src/plugins/types.js";

import { createSecretWalletTools } from "./src/tools.js";

export default function register(api: OpenClawPluginApi) {
  const config = (api.pluginConfig ?? {}) as {
    binaryPath?: string;
    autoInject?: boolean;
  };

  const tools = createSecretWalletTools(api, config);

  for (const tool of tools) {
    api.registerTool(
      (ctx) => {
        if (ctx.sandboxed) return null;
        return tool;
      },
      { optional: true },
    );
  }

  if (config.autoInject) {
    api.on("session_start", async () => {
      api.logger.info("[secret-wallet] Auto-injecting secrets into environment");
      try {
        const { runSecretWallet } = await import("./src/runner.js");
        const result = await runSecretWallet(config.binaryPath, ["list", "--json"]);
        if (result.ok) {
          const secrets = JSON.parse(result.stdout) as Array<{ name: string; envName: string }>;
          api.logger.info(`[secret-wallet] ${secrets.length} secret(s) available`);
        }
      } catch (err) {
        api.logger.warn(`[secret-wallet] Auto-inject failed: ${err}`);
      }
    });
  }
}
