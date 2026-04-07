# Nanobanana MCP Server Configuration

## Available Configurations

### 1. nanobanana (Grok2API - Default, Enabled)

**Provider:** Grok2API (Local)
**Status:** ✅ Enabled

Uses local Grok2API server for fast, cost-free image generation.

**Features:**
- Batch generation (1-10 images)
- Fast model: grok-imagine-1.0-fast
- Image editing: grok-imagine-1.0-edit
- Analysis: grok-4

**Environment Variables:**
```json
{
  "GROK_API_BASE_URL": "http://localhost:8011",
  "GROK_API_KEY": "aa",
  "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast",
  "GROK_EDIT_MODEL": "grok-imagine-1.0-edit",
  "GROK_ANALYZER_MODEL": "grok-4",
  "IMAGE_OUTPUT_DIR": "/var/www/nanobanana/nanobanana-output",
  "LOG_LEVEL": "INFO"
}
```

**Prerequisites:**
- Grok2API server running on port 8011
- Start with: `grok2api-server --port 8011`

---

### 2. nanobanana-gemini (Google Gemini API - Disabled)

**Provider:** Google Gemini API (Direct)
**Status:** ❌ Disabled

Uses Google's Gemini API directly for highest quality.

**Features:**
- Highest image quality
- Latest Gemini models
- Enterprise reliability

**To Enable:**
1. Set `"disabled": false` in mcp.json
2. Replace `your-gemini-api-key-here` with actual API key
3. Disable other servers to avoid conflicts

**Environment Variables:**
```json
{
  "NANOBANANA_GEMINI_API_KEY": "your-gemini-api-key-here",
  "NANOBANANA_MODEL": "gemini-3-pro-image-preview",
  "NANOBANANA_ANALYZER_MODEL": "gemini-2.5-flash",
  "IMAGE_OUTPUT_DIR": "/var/www/nanobanana/nanobanana-output",
  "LOG_LEVEL": "INFO"
}
```

**Prerequisites:**
- Valid Google Gemini API key
- Internet connection

---

### 3. nanobanana-local-proxy (Local Proxy - Disabled)

**Provider:** Local Proxy (Gemini Format)
**Status:** ❌ Disabled

Uses local proxy server with Gemini-compatible API.

**Features:**
- High quality Gemini models
- Local control
- Flexible backend

**To Enable:**
1. Set `"disabled": false` in mcp.json
2. Configure proxy URL and key
3. Disable other servers to avoid conflicts

**Environment Variables:**
```json
{
  "OPENAI_API_BASE": "http://localhost:8080",
  "OPENAI_API_KEY": "your-proxy-key-here",
  "NANOBANANA_MODEL": "gemini-3-pro-image-preview",
  "NANOBANANA_ANALYZER_MODEL": "gemini-2.5-flash",
  "IMAGE_OUTPUT_DIR": "/var/www/nanobanana/nanobanana-output",
  "LOG_LEVEL": "INFO"
}
```

**Prerequisites:**
- Local proxy server running
- Proxy configured for Gemini API

---

## Available Tools

All configurations provide these MCP tools:

1. **generate_image** - Generate images from text prompts
2. **edit_image** - Edit existing images with prompts
3. **restore_image** - Restore and enhance old photos
4. **analyze_image** - Analyze and classify images
5. **enhance_image** - Enhance images with presets

## Auto-Approved Tools

These tools are auto-approved and won't require confirmation:
- generate_image
- edit_image
- restore_image
- analyze_image
- enhance_image

## Switching Providers

### To Use Grok2API (Default)
```json
{
  "nanobanana": {
    "disabled": false
  },
  "nanobanana-gemini": {
    "disabled": true
  },
  "nanobanana-local-proxy": {
    "disabled": true
  }
}
```

### To Use Gemini API
```json
{
  "nanobanana": {
    "disabled": true
  },
  "nanobanana-gemini": {
    "disabled": false,
    "env": {
      "NANOBANANA_GEMINI_API_KEY": "your-actual-key"
    }
  }
}
```

### To Use Local Proxy
```json
{
  "nanobanana": {
    "disabled": true
  },
  "nanobanana-local-proxy": {
    "disabled": false,
    "env": {
      "OPENAI_API_BASE": "http://localhost:8080",
      "OPENAI_API_KEY": "your-proxy-key"
    }
  }
}
```

## Model Configuration

### Grok2API Models

**Image Generation:**
- `grok-imagine-1.0-fast` (default) - Fast, 1-10 images
- `grok-imagine-1.0` - High quality, single image

**Image Editing:**
- `grok-imagine-1.0-edit` (default)

**Image Analysis:**
- `grok-4` (default) - Balanced
- `grok-3-mini` - Fastest
- `grok-4-thinking` - Most detailed

### Gemini Models

**Image Generation:**
- `gemini-3-pro-image-preview` (default) - Highest quality
- `gemini-2.5-flash` - Fast

**Image Analysis:**
- `gemini-2.5-flash` (default) - Fast
- `gemini-3-pro` - Highest quality

## Output Directory

All generated images are saved to:
```
/var/www/nanobanana/nanobanana-output/
```

You can change this by modifying `IMAGE_OUTPUT_DIR` in the env section.

## Troubleshooting

### Server Not Starting

**Check build:**
```bash
cd /var/www/nanobanana/mcp-server
npm run build
```

**Check path:**
```bash
ls -la /var/www/nanobanana/mcp-server/dist/index.js
```

### Grok2API Not Working

**Check server:**
```bash
curl http://localhost:8011/health
```

**Start server:**
```bash
grok2api-server --port 8011
```

### Wrong Provider Detected

**Check priority:**
1. GROK2API (if GROK_API_BASE_URL set)
2. LOCAL_PROXY (if OPENAI_API_BASE set)
3. GEMINI (if NANOBANANA_GEMINI_API_KEY set)

Make sure only one provider is enabled at a time.

### Tools Not Appearing

**Restart MCP:**
1. Open Kiro command palette
2. Run "MCP: Restart Servers"
3. Check MCP panel for connection status

## Performance Tips

### For Speed
```json
{
  "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast",
  "GROK_ANALYZER_MODEL": "grok-3-mini"
}
```

### For Quality
```json
{
  "GROK_IMAGE_MODEL": "grok-imagine-1.0",
  "GROK_ANALYZER_MODEL": "grok-4-thinking"
}
```

### For Batch Generation
```json
{
  "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast"
}
```
Then use `outputCount: 5-10` in tool arguments.

## Documentation

- [Grok2API Provider Guide](../../docs/GROK2API_PROVIDER.md)
- [Provider Comparison](../../docs/PROVIDER_COMPARISON.md)
- [Quick Start](../../docs/QUICK_START_GROK.md)
- [Main README](../../README.md)

## Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Run test script: `mcp-server/test-grok2api.sh`
3. Check logs in Kiro MCP panel
4. Open GitHub issue
