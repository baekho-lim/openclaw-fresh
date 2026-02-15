import type { OpenClawPluginApi } from "../../src/plugins/types.js";

import { createSecretWalletTools } from "./src/tools.js";

export default function register(api: OpenClawPluginApi) {
  const config = (api.pluginConfig ?? {}) as {
    binaryPath?: string;
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
}
