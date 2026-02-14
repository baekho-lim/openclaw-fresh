---
name: secret-wallet
description: macOS Keychain credential manager with TouchID biometric authentication
metadata:
  openclaw:
    emoji: "🔐"
    requires:
      bins:
        - secret-wallet
    install:
      - id: brew
        kind: brew
        formula: baekho-lim/tap/secret-wallet
        bins:
          - secret-wallet
        label: Install via Homebrew
      - id: source
        kind: custom
        label: Build from source
        instructions: "git clone https://github.com/baekho-lim/secret-wallet && cd secret-wallet && swift build -c release && cp .build/release/secret-wallet /usr/local/bin/"
---

# Secret Wallet

Keychain-based credential manager for AI agents. Replaces plaintext `.env` files and `auth-profiles.json` with hardware-backed encryption.

## Quick Start

```bash
# Initialize (verify Keychain access)
secret-wallet init

# Store a secret
secret-wallet add OPENAI_KEY --biometric
# Enter value (hidden input)

# Retrieve
secret-wallet get OPENAI_KEY

# List all (no values shown)
secret-wallet list

# Run a command with secrets injected
secret-wallet inject -- node server.js

# Check status (JSON)
secret-wallet status
```

## Security Model

Defense in Depth -- 7 independent layers:
1. Physical device security (FileVault)
2. Secure Enclave (T2/M1/M2 hardware)
3. OS-level Keychain ACL
4. AES-256-GCM encrypted storage
5. TouchID biometric authentication
6. Runtime injection (no static config)
7. Process isolation (child-only env vars)

## OpenClaw Integration

When this plugin is active, agents can use these tools:

- `secret-wallet-status` -- Check installation and Keychain health
- `secret-wallet-list` -- List stored secrets (no values)
- `secret-wallet-get` -- Retrieve a secret (may trigger TouchID)
- `secret-wallet-add` -- Store a new secret
- `secret-wallet-remove` -- Delete a secret
- `secret-wallet-inject` -- Run command with secrets as env vars

## Why Not .env Files?

| Aspect | .env files | Secret Wallet |
|--------|-----------|---------------|
| Storage | Plaintext on disk | macOS Keychain (AES-256) |
| Git risk | Easy to commit | Nothing to commit |
| Access control | File permissions | TouchID biometric |
| Process isolation | Loaded globally | Child process only |
| Hardware backing | None | Secure Enclave |
