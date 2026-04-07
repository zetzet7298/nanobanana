# Nanobanana MCP Extension

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
- **Core files:** `mcp-server/src/` - index.ts (entry), imageGenerator.ts, imageAnalyzer.ts, imageEnhancer.ts, fileHandler.ts, types.ts
- **Output:** Generated images go to `nanobanana-output/`
- **Extension config:** `gemini-extension.json`

## Providers

### 1. Grok2API (Recommended for Local)
```bash
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_EDIT_MODEL=grok-imagine-1.0-edit
GROK_ANALYZER_MODEL=grok-4
```

**Models:**
- Image: `grok-imagine-1.0`, `grok-imagine-1.0-fast` (1-10 images)
- Edit: `grok-imagine-1.0-edit`
- Analysis: `grok-3`, `grok-4`, `grok-4-thinking`, `grok-4.1-fast`, etc.

See [GROK2API_PROVIDER.md](docs/GROK2API_PROVIDER.md) for details.

### 2. Local Proxy (Gemini Format)
```bash
OPENAI_API_BASE=http://localhost:8080
OPENAI_API_KEY=your-key
NANOBANANA_MODEL=gemini-3-pro-image-preview
```

### 3. Google Gemini API (Direct)
```bash
NANOBANANA_GEMINI_API_KEY=your-key
NANOBANANA_MODEL=gemini-3-pro-image-preview
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

## Code Style

- ES Modules (`"type": "module"`) - use `import`, never `require()`
- TypeScript strict mode, no `any` types
- Use `type` imports: `import type { Foo } from './types'`
- Prefix unused vars with `_` (e.g., `_unused`)
- Arrow functions preferred; `const` over `let`
- All files require license header (Google LLC, Apache-2.0)
- Node.js ≥18 required

## Quick Start

1. Copy `.env.example` to `.env` and configure your provider
2. Run `npm install && npm run build`
3. Start using MCP tools for image generation, editing, and enhancement

