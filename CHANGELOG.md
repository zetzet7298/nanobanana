## 1.1.0 (Unreleased)

### Added
- **Grok2API Provider Support**: Added full support for Grok2API as a local image generation provider
  - Image generation with `grok-imagine-1.0` and `grok-imagine-1.0-fast` models
  - Image editing with `grok-imagine-1.0-edit` model
  - Image analysis with Grok chat models (grok-3, grok-4, grok-4.1, etc.)
  - Batch generation support (1-10 images with fast model)
  - Configurable via environment variables: `GROK_API_BASE_URL`, `GROK_API_KEY`, `GROK_IMAGE_MODEL`, `GROK_EDIT_MODEL`, `GROK_ANALYZER_MODEL`

### Changed
- Updated `AuthConfig` type to include `GROK2API` provider
- Enhanced `ImageGenerator` to support Grok2API endpoints
- Enhanced `ImageAnalyzer` to support Grok models for image analysis
- Updated authentication priority: GROK2API > LOCAL_PROXY > GEMINI

### Documentation
- Added comprehensive Grok2API provider guide (`docs/GROK2API_PROVIDER.md`)
- Added `.env.example` with all provider configurations
- Added test script for Grok2API integration (`mcp-server/test-grok2api.sh`)
- Updated `AGENTS.md` with provider information

## 1.0.1

- Fix `edit_file` tool to handle absolute file paths.

## 1.0.0

- Initial release.
