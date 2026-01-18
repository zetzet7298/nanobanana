# Nanobanana - Shared Library Usage

## Installation

The `facebook-automation-tool` already includes nanobanana as a dependency via:

```json
"nanobanana": "file:../nanobanana/mcp-server"
```

## Usage as Library

### Import Classes

```typescript
import {
  ImageGenerator,
  ImageEnhancer,
  ImageAnalyzer,
  FileHandler,
  type AuthConfig,
  type ImageGenerationRequest,
  type ImageEnhancementRequest,
} from "nanobanana";
```

### Generate Images

```typescript
// Initialize
const authConfig = ImageGenerator.validateAuthentication();
const generator = new ImageGenerator(authConfig);

// Generate image from text
const result = await generator.generateTextToImage({
  prompt: "A beautiful sunset over the ocean",
  outputCount: 1,
  mode: "generate",
});

console.log(result.generatedFiles); // ['nanobanana-output/a_beautiful_sunset_over.png']
```

### Enhance Images

```typescript
// Initialize
const authConfig = ImageGenerator.validateAuthentication();
const config = ImageEnhancer.loadConfig();
const enhancer = new ImageEnhancer(authConfig, config);

// Enhance images in directory
const result = await enhancer.processImages({
  inputPath: "./images-to-enhance",
  preset: "default",
  recursive: true,
});
```

### Analyze Images

```typescript
const analyzer = new ImageAnalyzer(authConfig, config);
const results = await analyzer.analyzeMultipleImages(
  "./images-to-analyze",
  true, // recursive
  "default" // preset
);
```

### File Utilities

```typescript
// Save base64 image
await FileHandler.saveImageFromBase64(base64Data, outputDir, "image.png");

// Read image as base64
const base64 = await FileHandler.readImageAsBase64("./image.png");

// Get/create output directory
const outputDir = FileHandler.ensureOutputDirectory();
```

## Usage as MCP Server

The package still works as an MCP server:

```bash
# Run MCP server
node dist/index.js

# Or via binary
npx nanobanana-mcp
```

## Environment Variables

```bash
# For local proxy (recommended)
OPENAI_API_BASE=http://localhost:8000
OPENAI_API_KEY=your-key

# Or direct Gemini API
NANOBANANA_GEMINI_API_KEY=your-gemini-key
# or
NANOBANANA_GOOGLE_API_KEY=your-google-key

# Optional model override
NANOBANANA_MODEL=gemini-3-pro-image-preview
NANOBANANA_ENHANCER_MODEL=gemini-3-pro-image-preview
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

## Package Exports

| Export Path | Description |
|-------------|-------------|
| `nanobanana` | Library exports (ImageGenerator, ImageEnhancer, etc.) |
| `nanobanana/mcp` | MCP server entry point |
| `nanobanana/types` | TypeScript types only |

## Wrapper in facebook-automation-tool

See `lib/nanobanana/index.ts` for convenience wrapper functions:

```typescript
import {
  generateImage,
  editImage,
  enhanceImages,
  analyzeImages,
} from "@/lib/nanobanana";

// Simple usage
const result = await generateImage("A cat wearing a hat");
```
