# Quick Start: Grok2API Provider

## 5-Minute Setup

### Step 1: Start Grok2API Server (1 min)

```bash
# Start the server
grok2api-server --port 8011

# Verify it's running
curl http://localhost:8011/health
```

### Step 2: Configure Environment (1 min)

```bash
cd mcp-server

# Copy example config
cp .env.example .env

# Edit .env and set:
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-grok-api-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_ANALYZER_MODEL=grok-4
```

### Step 3: Build & Test (3 min)

```bash
# Install and build
npm install
npm run build

# Run test script
./test-grok2api.sh
```

Done! 🎉

---

## Common Tasks

### Generate Single Image

```json
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "A beautiful sunset over mountains",
    "mode": "generate"
  }
}
```

### Generate 5 Variations (Batch)

```json
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "Modern minimalist logo",
    "mode": "generate",
    "outputCount": 5
  }
}
```

### Edit Existing Image

```json
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "Change the sky to sunset colors",
    "mode": "edit",
    "inputImage": "path/to/image.jpg"
  }
}
```

### Analyze Image

```json
{
  "tool": "analyze_image",
  "arguments": {
    "input": "path/to/image.jpg",
    "preset": "tourism"
  }
}
```

### Enhance Image

```json
{
  "tool": "enhance_image",
  "arguments": {
    "input": "path/to/image.jpg",
    "preset": "restaurant",
    "preview": true
  }
}
```

---

## Environment Variables Cheat Sheet

```bash
# Required
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key

# Optional (with defaults)
GROK_IMAGE_MODEL=grok-imagine-1.0-fast    # or grok-imagine-1.0
GROK_EDIT_MODEL=grok-imagine-1.0-edit
GROK_ANALYZER_MODEL=grok-4                # or grok-3, grok-4-thinking, etc.

# Output
IMAGE_OUTPUT_DIR=./nanobanana-output
LOG_LEVEL=INFO
```

---

## Model Selection Guide

### For Speed → Use Fast Model
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_ANALYZER_MODEL=grok-3-mini
```

### For Quality → Use Standard Model
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0
GROK_ANALYZER_MODEL=grok-4-thinking
```

### For Balance → Use Defaults
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_ANALYZER_MODEL=grok-4
```

---

## Troubleshooting

### Server Not Running
```bash
# Check if server is up
curl http://localhost:8011/health

# Start server if needed
grok2api-server --port 8011
```

### Wrong Provider Detected
```bash
# Check env vars
env | grep GROK

# Make sure these are set
export GROK_API_BASE_URL=http://localhost:8011
export GROK_API_KEY=your-key
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Slow Generation
```bash
# Use fast model
export GROK_IMAGE_MODEL=grok-imagine-1.0-fast
```

---

## Tips & Tricks

### 1. Batch Generation
Generate multiple variations in one call:
```json
{"outputCount": 10}  // Max 10 with fast model
```

### 2. Model Override
Override model per request (if supported):
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0  # High quality
```

### 3. Analysis Models
Choose based on need:
- `grok-3-mini`: Fastest, good for simple classification
- `grok-4`: Balanced, recommended default
- `grok-4-thinking`: Detailed analysis with reasoning

### 4. Preview Images
Auto-open generated images:
```json
{"preview": true}
```

### 5. Organize Output
Enable category-based organization:
```json
// In enhancement-config.json
"organizeByCategory": true
```

---

## Next Steps

1. ✅ Read full guide: [GROK2API_PROVIDER.md](GROK2API_PROVIDER.md)
2. ✅ Compare providers: [PROVIDER_COMPARISON.md](PROVIDER_COMPARISON.md)
3. ✅ Check examples: `docs/enhance_image_docs/examples/`
4. ✅ Join community: [GitHub Discussions](#)

---

## Quick Reference

| Task | Model | Speed | Quality |
|------|-------|-------|---------|
| Draft images | grok-imagine-1.0-fast | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| Final images | grok-imagine-1.0 | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| Edit images | grok-imagine-1.0-edit | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| Quick analysis | grok-3-mini | ⚡⚡⚡ | ⭐⭐⭐ |
| Standard analysis | grok-4 | ⚡⚡ | ⭐⭐⭐⭐ |
| Deep analysis | grok-4-thinking | ⚡ | ⭐⭐⭐⭐⭐ |

---

**Need help?** Check the [full documentation](../README.md) or open an issue on GitHub.
