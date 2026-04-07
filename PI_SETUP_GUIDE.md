# Pi MCP Adapter - Nanobanana Setup Guide

## Overview

This guide shows how to add Nanobanana MCP server to Pi AI agent.

## Configuration File Location

Pi MCP Adapter looks for configurations in:
- **Global:** `~/.pi/agent/mcp.json` (user-wide settings)
- **Project:** `.pi/mcp.json` (project-specific, overrides global)

## Step 1: Locate Your Pi Config

```bash
# Check if config exists
ls -la ~/.pi/agent/mcp.json

# If not exists, create directory
mkdir -p ~/.pi/agent
```

## Step 2: Add Nanobanana Server

### Option A: Edit Existing Config

If you already have `~/.pi/agent/mcp.json`, add the nanobanana server to the `mcpServers` section:

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": [
        "/var/www/nanobanana/mcp-server/dist/index.js"
      ],
      "env": {
        "GROK_API_BASE_URL": "http://localhost:8011",
        "GROK_API_KEY": "aa",
        "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast",
        "GROK_EDIT_MODEL": "grok-imagine-1.0-edit",
        "GROK_ANALYZER_MODEL": "grok-4.1-fast",
        "IMAGE_OUTPUT_DIR": "/var/www/nanobanana/nanobanana-output",
        "LOG_LEVEL": "INFO"
      },
      "lifecycle": "lazy",
      "idleTimeout": 5,
      "exposeResources": false,
      "directTools": false,
      "showStderr": false
    }
  }
}
```

### Option B: Create New Config

If you don't have a config file yet:

```bash
# Copy the provided config
cp pi-mcp-config.json ~/.pi/agent/mcp.json

# Or create manually
cat > ~/.pi/agent/mcp.json << 'EOF'
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": [
        "/var/www/nanobanana/mcp-server/dist/index.js"
      ],
      "env": {
        "GROK_API_BASE_URL": "http://localhost:8011",
        "GROK_API_KEY": "aa",
        "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast",
        "GROK_EDIT_MODEL": "grok-imagine-1.0-edit",
        "GROK_ANALYZER_MODEL": "grok-4.1-fast",
        "IMAGE_OUTPUT_DIR": "/var/www/nanobanana/nanobanana-output",
        "LOG_LEVEL": "INFO"
      },
      "lifecycle": "lazy",
      "idleTimeout": 5,
      "exposeResources": false,
      "directTools": false,
      "showStderr": false
    }
  }
}
EOF
```

## Step 3: Configuration Fields Explained

### Required Fields

- **command**: `"node"` - The executable to run
- **args**: Path to the compiled MCP server (`dist/index.js`)

### Environment Variables

- **GROK_API_BASE_URL**: Grok2API server URL (default: http://localhost:8011)
- **GROK_API_KEY**: Your Grok2API key
- **GROK_IMAGE_MODEL**: Model for image generation
  - `grok-imagine-1.0-fast` (recommended, supports batch 1-10 images)
  - `grok-imagine-1.0` (high quality, single image)
- **GROK_EDIT_MODEL**: Model for image editing (default: grok-imagine-1.0-edit)
- **GROK_ANALYZER_MODEL**: Model for image analysis
  - `grok-4.1-fast` (recommended, fast)
  - `grok-4.1-thinking` (detailed analysis)
  - `grok-4` (balanced)
- **IMAGE_OUTPUT_DIR**: Where to save generated images
- **LOG_LEVEL**: Logging level (INFO, DEBUG, WARN, ERROR)

### Optional Fields

- **lifecycle**: `"lazy"` (default) - Connect on first use
  - `"eager"` - Connect at startup
  - `"keep-alive"` - Auto-reconnect with health checks
- **idleTimeout**: Minutes before disconnect (default: 5, set 0 to disable)
- **exposeResources**: `false` - Don't expose MCP resources as tools
- **directTools**: `false` - Use proxy mode (recommended)
- **showStderr**: `false` - Hide debug output (set `true` for debugging)

## Step 4: Verify Setup

### Check Config Syntax

```bash
# Validate JSON syntax
cat ~/.pi/agent/mcp.json | jq '.'

# Should output formatted JSON without errors
```

### Test Server Manually

```bash
# Build the server
cd /var/www/nanobanana/mcp-server
npm run build

# Test if it runs
node dist/index.js
# Should start without errors (Ctrl+C to stop)
```

### Check Grok2API Server

```bash
# Verify Grok2API is running
curl http://localhost:8011/health

# Should return: {"status":"ok"}
```

## Step 5: Restart Pi

After updating the config, restart Pi to load the new server:

```bash
# If Pi is running as a service
sudo systemctl restart pi-agent

# Or restart Pi application manually
```

## Step 6: Test in Pi

Once Pi is restarted, you can use Nanobanana tools:

### Generate Image
```
Generate an image of a beautiful sunset over mountains
```

### Batch Generation
```
Generate 5 variations of a modern minimalist logo
```

### Analyze Image
```
Analyze this image: /path/to/image.jpg
```

### Generate Pattern
```
Create a seamless geometric hexagon pattern
```

### Generate Icon
```
Create a camera icon in sizes 64, 128, and 256 pixels
```

## Available Tools

Pi will have access to these Nanobanana tools:

1. **generate_image** - Generate images from text prompts
2. **edit_image** - Edit existing images
3. **restore_image** - Restore/enhance old photos
4. **analyze_image** - Analyze and classify images
5. **enhance_image** - Enhance with presets
6. **generate_pattern** - Create seamless patterns
7. **generate_icon** - Generate multi-size icons
8. **generate_story** - Create story sequences
9. **generate_diagram** - Generate technical diagrams

## Troubleshooting

### Server Not Starting

**Check logs:**
```bash
# Enable stderr output in config
"showStderr": true

# Check Pi logs
journalctl -u pi-agent -f
```

**Verify paths:**
```bash
# Check if server exists
ls -la /var/www/nanobanana/mcp-server/dist/index.js

# Check if node is available
which node
node --version
```

### Grok2API Connection Issues

**Check server:**
```bash
curl http://localhost:8011/health
```

**Start server if needed:**
```bash
grok2api-server --port 8011
```

### Tools Not Appearing

**Verify config:**
```bash
cat ~/.pi/agent/mcp.json | jq '.mcpServers.nanobanana'
```

**Check lifecycle:**
- If using `"lazy"`, tools appear on first use
- If using `"eager"`, tools appear at startup

### Permission Issues

**Check file permissions:**
```bash
chmod +x /var/www/nanobanana/mcp-server/dist/index.js
```

**Check output directory:**
```bash
mkdir -p /var/www/nanobanana/nanobanana-output
chmod 755 /var/www/nanobanana/nanobanana-output
```

## Advanced Configuration

### Enable Debug Mode

```json
{
  "env": {
    "LOG_LEVEL": "DEBUG"
  },
  "showStderr": true
}
```

### Use Different Models

```json
{
  "env": {
    "GROK_IMAGE_MODEL": "grok-imagine-1.0",
    "GROK_ANALYZER_MODEL": "grok-4.1-thinking"
  }
}
```

### Custom Output Directory

```json
{
  "env": {
    "IMAGE_OUTPUT_DIR": "/home/user/my-images"
  }
}
```

### Keep-Alive Mode

For production use with frequent requests:

```json
{
  "lifecycle": "keep-alive",
  "idleTimeout": 0
}
```

## Multiple Providers

You can configure multiple Nanobanana instances with different providers:

```json
{
  "mcpServers": {
    "nanobanana-grok": {
      "command": "node",
      "args": ["/var/www/nanobanana/mcp-server/dist/index.js"],
      "env": {
        "GROK_API_BASE_URL": "http://localhost:8011",
        "GROK_API_KEY": "aa",
        "GROK_IMAGE_MODEL": "grok-imagine-1.0-fast"
      }
    },
    "nanobanana-gemini": {
      "command": "node",
      "args": ["/var/www/nanobanana/mcp-server/dist/index.js"],
      "env": {
        "NANOBANANA_GEMINI_API_KEY": "your-gemini-key",
        "NANOBANANA_MODEL": "gemini-3-pro-image-preview"
      }
    }
  }
}
```

## Documentation

For more information:
- [Grok2API Provider Guide](docs/GROK2API_PROVIDER.md)
- [Provider Comparison](docs/PROVIDER_COMPARISON.md)
- [Quick Start](docs/QUICK_START_GROK.md)
- [Pi MCP Adapter Docs](https://www.mintlify.com/nicobailon/pi-mcp-adapter)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify Grok2API server is running
3. Check Pi logs for errors
4. Test server manually with node
5. Open an issue on GitHub

---

**Setup complete!** Pi can now use Nanobanana for image generation and analysis. 🎉
