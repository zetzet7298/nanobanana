# Nanobanana + Pi Integration

Quick guide to add Nanobanana MCP server to Pi AI agent.

## Quick Setup (Automated)

```bash
# Run the setup script
./add-to-pi.sh

# Restart Pi
sudo systemctl restart pi-agent  # If running as service
# Or restart Pi application manually
```

## Manual Setup

### 1. Edit Pi Config

```bash
nano ~/.pi/agent/mcp.json
```

### 2. Add Nanobanana Server

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/var/www/nanobanana/mcp-server/dist/index.js"],
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
      "idleTimeout": 5
    }
  }
}
```

### 3. Restart Pi

## Usage in Pi

Once configured, you can use these commands in Pi:

```
Generate an image of a beautiful sunset
Generate 5 variations of a modern logo
Analyze this image: /path/to/image.jpg
Create a seamless geometric pattern
Generate icons in sizes 64, 128, 256
```

## Available Tools

- generate_image - Text to image
- analyze_image - Image analysis (Vietnamese support)
- generate_pattern - Seamless patterns
- generate_icon - Multi-size icons
- generate_story - Story sequences
- generate_diagram - Technical diagrams
- edit_image - Image editing
- restore_image - Image restoration
- enhance_image - Image enhancement

## Files

- `pi-mcp-config.json` - Ready-to-use config
- `add-to-pi.sh` - Automated setup script
- `PI_SETUP_GUIDE.md` - Detailed setup guide

## Requirements

- Node.js 20+
- Grok2API server running on port 8011
- Nanobanana MCP server built (`npm run build`)

## Troubleshooting

**Server not starting:**
```bash
cd /var/www/nanobanana/mcp-server
npm run build
node dist/index.js  # Test manually
```

**Grok2API not running:**
```bash
curl http://localhost:8011/health
grok2api-server --port 8011  # Start if needed
```

**Config syntax error:**
```bash
cat ~/.pi/agent/mcp.json | jq '.'
```

## Documentation

- [Full Setup Guide](PI_SETUP_GUIDE.md)
- [Grok2API Provider](docs/GROK2API_PROVIDER.md)
- [Test Results](TEST_RESULTS.md)

---

**Ready to use!** 🚀
