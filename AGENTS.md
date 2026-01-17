# AGENTS.md - Nanobanana MCP Extension

## Commands

- **Build:** `npm run build` or `make build`
- **Lint:** `npm run lint` (auto-fix) | `npm run lint:ci` (strict)
- **Format:** `npm run format`
- **Typecheck:** `npm run typecheck`
- **Dev mode:** `npm run dev`
- **Preflight:** `npm run preflight` (clean, install, format, lint, build, typecheck)
- **Tests:** Currently no tests (`npm run test` is a no-op)

## Architecture

- **MCP Server:** TypeScript server in `mcp-server/` using `@modelcontextprotocol/sdk` and `@google/genai`
- **Core files:** `mcp-server/src/` - index.ts (entry), imageGenerator.ts, fileHandler.ts, types.ts
- **Output:** Generated images go to `nanobanana-output/`
- **Extension config:** `gemini-extension.json`

## Code Style

- ES Modules (`"type": "module"`) - use `import`, never `require()`
- TypeScript strict mode, no `any` types
- Use `type` imports: `import type { Foo } from './types'`
- Prefix unused vars with `_` (e.g., `_unused`)
- Arrow functions preferred; `const` over `let`
- All files require license header (Google LLC, Apache-2.0)
- Node.js ≥18 required
