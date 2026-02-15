import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "../../../src/plugins/types.js";
import { runSecretWallet } from "./runner.js";

type PluginConfig = {
  binaryPath?: string;
};

/**
 * Create all secret-wallet tools for OpenClaw agent use.
 */
export function createSecretWalletTools(api: OpenClawPluginApi, config: PluginConfig) {
  return [
    createStatusTool(config),
    createListTool(config),
    createGetTool(config),
    createAddTool(config),
    createRemoveTool(config),
    createInjectTool(config),
  ];
}

function createStatusTool(config: PluginConfig) {
  return {
    name: "secret-wallet-status",
    description:
      "Check Secret Wallet status: version, biometric availability, stored secret count. " +
      "Use this to verify Secret Wallet is installed and working before other operations.",
    parameters: Type.Object({}),

    async execute() {
      const result = await runSecretWallet(config.binaryPath, ["status"]);
      if (!result.ok) {
        return {
          content: [{ type: "text" as const, text: `Secret Wallet error: ${result.error}` }],
        };
      }
      return {
        content: [{ type: "text" as const, text: result.stdout }],
      };
    },
  };
}

function createListTool(config: PluginConfig) {
  return {
    name: "secret-wallet-list",
    description:
      "List all secrets stored in macOS Keychain via Secret Wallet. " +
      "Returns name, environment variable mapping, and biometric protection status. " +
      "Does NOT return secret values.",
    parameters: Type.Object({}),

    async execute() {
      const result = await runSecretWallet(config.binaryPath, ["list", "--json"]);
      if (!result.ok) {
        return {
          content: [{ type: "text" as const, text: `Failed to list secrets: ${result.error}` }],
        };
      }
      return {
        content: [{ type: "text" as const, text: result.stdout }],
      };
    },
  };
}

function createGetTool(config: PluginConfig) {
  return {
    name: "secret-wallet-get",
    description:
      "Retrieve a secret value from macOS Keychain. May trigger TouchID prompt. " +
      "The value is returned as text. Use for injecting into API calls or configs.",
    parameters: Type.Object({
      name: Type.String({ description: "Name of the secret to retrieve" }),
    }),

    async execute(_id: string, params: { name: string }) {
      const result = await runSecretWallet(config.binaryPath, ["get", params.name]);
      if (!result.ok) {
        return {
          content: [
            { type: "text" as const, text: `Failed to get secret '${params.name}': ${result.error}` },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: result.stdout }],
      };
    },
  };
}

function createAddTool(config: PluginConfig) {
  return {
    name: "secret-wallet-add",
    description:
      "Store a new secret in macOS Keychain via Secret Wallet. " +
      "Optionally enable TouchID biometric protection. " +
      "The secret is stored encrypted, never as plaintext.",
    parameters: Type.Object({
      name: Type.String({ description: "Name for the secret (e.g., OPENAI_KEY)" }),
      value: Type.String({ description: "The secret value to store" }),
      envName: Type.Optional(
        Type.String({ description: "Environment variable name (defaults to uppercased name)" }),
      ),
      biometric: Type.Optional(
        Type.Boolean({ description: "Require TouchID for access (default: false)" }),
      ),
    }),

    async execute(
      _id: string,
      params: { name: string; value: string; envName?: string; biometric?: boolean },
    ) {
      const args = ["add", params.name];
      if (params.envName) {
        args.push("--env-name", params.envName);
      }
      if (params.biometric) {
        args.push("--biometric");
      }

      const result = await runSecretWallet(config.binaryPath, args, {
        stdin: params.value,
      });

      if (!result.ok) {
        return {
          content: [
            { type: "text" as const, text: `Failed to store secret '${params.name}': ${result.error}` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Secret '${params.name}' stored securely in macOS Keychain.`,
          },
        ],
      };
    },
  };
}

function createRemoveTool(config: PluginConfig) {
  return {
    name: "secret-wallet-remove",
    description: "Remove a secret from macOS Keychain. This action is irreversible.",
    parameters: Type.Object({
      name: Type.String({ description: "Name of the secret to remove" }),
    }),

    async execute(_id: string, params: { name: string }) {
      const result = await runSecretWallet(config.binaryPath, ["remove", params.name]);
      if (!result.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to remove secret '${params.name}': ${result.error}`,
            },
          ],
        };
      }
      return {
        content: [{ type: "text" as const, text: `Secret '${params.name}' removed from Keychain.` }],
      };
    },
  };
}

function createInjectTool(config: PluginConfig) {
  return {
    name: "secret-wallet-inject",
    description:
      "Run a command with all stored secrets injected as environment variables. " +
      "Secrets are only available in the child process -- the parent shell is never contaminated. " +
      "Example: inject -- node server.js",
    parameters: Type.Object({
      command: Type.Array(Type.String(), {
        description: "Command and arguments to run (e.g., ['node', 'server.js'])",
      }),
    }),

    async execute(_id: string, params: { command: string[] }) {
      if (params.command.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No command specified for injection." }],
        };
      }

      const args = ["inject", "--", ...params.command];
      const result = await runSecretWallet(config.binaryPath, args, {
        timeoutMs: 120_000,
      });

      if (!result.ok) {
        return {
          content: [
            { type: "text" as const, text: `Inject failed: ${result.error}` },
          ],
        };
      }
      return {
        content: [
          { type: "text" as const, text: result.stdout || "Command executed with injected secrets." },
        ],
      };
    },
  };
}
