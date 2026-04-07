# Commercialization Checklist

A practical checklist for preparing `nanobanana` for commercial distribution.

## Already improved

- Root package marked `private: true` to reduce accidental npm publishing.
- MCP package metadata improved (`license`, `repository`, `homepage`, `bugs`, `author`).
- `mcp-server/.npmignore` added to reduce accidental publishing of dev-only files.
- `.gitignore` expanded to avoid committing secrets, Python venvs, caches, and local helper binaries.

## Recommended next steps

### 1. Packaging & release hygiene

- Add a `files` allowlist to `mcp-server/package.json` so npm publishes only intended artifacts.
- Run `npm pack --dry-run` in `mcp-server/` and verify published contents.
- Decide whether the commercial artifact is:
  - the open-source repo,
  - a hosted service,
  - a paid binary/package,
  - or dual-license/open-core.

### 2. Legal & business

- Decide the business model:
  - paid hosted API,
  - paid MCP package,
  - enterprise support,
  - usage-based billing,
  - or dual-license.
- Review third-party license obligations for all runtime dependencies.
- Add Terms of Service / Privacy Policy if users will send prompts or images to your hosted infrastructure.
- Define data retention rules for generated and uploaded images.

### 3. Security

- Audit logs to ensure API keys and image URLs are never leaked.
- Add secret scanning in CI.
- Document supported auth environment variables clearly.
- Consider rate limiting and request size limits if exposed as a hosted service.

### 4. Productization

- Add clearer positioning in README:
  - who it is for,
  - what problem it solves,
  - supported providers,
  - self-hosted vs hosted expectations.
- Add a compatibility matrix for providers/models.
- Add versioned release notes and upgrade notes.
- Add screenshots/GIFs for the key workflows.

### 5. Reliability

- Add smoke tests for:
  - generate,
  - edit,
  - restore,
  - enhance,
  - analyze.
- Add fixture-based regression tests around file naming and output extension handling.
- Add provider fallback and clearer error taxonomy.

### 6. Commercial readiness

- Add telemetry only with explicit disclosure and opt-out.
- Add support and SLA definitions if selling to teams/businesses.
- Create pricing/plan boundaries early if usage costs depend on upstream providers.
- Separate community docs from commercial onboarding docs.

## Suggested release gate

Before a commercial launch, aim for:

- reproducible build,
- dry-run publish review,
- dependency/license review,
- secret scanning,
- smoke tests for all major tools,
- clear legal docs,
- support channel and issue triage process.
