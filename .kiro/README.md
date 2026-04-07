# Kiro MCP Configuration for Nano Banana

This directory contains MCP (Model Context Protocol) configuration for Kiro IDE.

## Configuration File

The MCP configuration is located at:
```
.kiro/settings/mcp.json
```

## Available Servers

### 1. nanobanana-local (Default - Enabled)
Development server running from local source code.

**Use when:**
- Developing and testing changes
- Debugging issues
- Contributing to the project

**Requirements:**
- `uv` package manager installed
- Local source code in `/var/www/nanobanana-mcp-server`
- Environment variables set (see below)

### 2. nanobanana-grok-only (Disabled by default)
Local server configured to use only Grok provider with fast model.

**Use when:**
- Testing Grok2API integration
- Running without Gemini API access
- Local-only image generation with fast model

**Model:** `grok-imagine-1.0-fast` (supports 1-10 images)

**Requirements:**
- Grok2API server running at `http://localhost:8011`
- `GROK_API_BASE_URL` and `GROK_API_KEY` set

**To enable:**
Change `"disabled": true` to `"disabled": false` in mcp.json

### 2b. nanobanana-grok-standard (Disabled by default)
Local server configured to use Grok standard model.

**Use when:**
- Need standard quality Grok generation
- Testing different Grok models

**Model:** `grok-imagine-1.0` (standard quality)

**To enable:**
Change `"disabled": true` to `"disabled": false` in mcp.json

### 3. nanobanana-production (Disabled by default)
Production server using published package from PyPI.

**Use when:**
- Using stable release version
- No local development needed
- Quick setup without source code

**Requirements:**
- `uvx` installed (comes with `uv`)
- Environment variables set

**To enable:**
Change `"disabled": true` to `"disabled": false` in mcp.json

## Environment Variables

Set these environment variables in your shell or `.env` file:

### Required for Gemini Models
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```

Get your API key: https://makersuite.google.com/app/apikey

### Optional for Grok Provider
```bash
export GROK_API_BASE_URL="http://localhost:8011"
export GROK_API_KEY="your-grok-api-key"  # Optional

# Grok Model Selection (optional)
export GROK_IMAGE_MODEL="grok-imagine-1.0-fast"  # or grok-imagine-1.0
export GROK_EDIT_MODEL="grok-imagine-1.0-edit"
```

### Optional Configuration
```bash
export NANOBANANA_MODEL="auto"  # Options: auto, flash, nb2, pro, grok
export IMAGE_OUTPUT_DIR="$HOME/nanobanana-images"
export LOG_LEVEL="INFO"  # Options: DEBUG, INFO, WARNING, ERROR
```

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in your home directory or project root:

```bash
# ~/.env or /var/www/nanobanana-mcp-server/.env
GEMINI_API_KEY=your-gemini-api-key-here
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-grok-api-key
```

Load the environment:
```bash
source ~/.env
# or
export $(cat /var/www/nanobanana-mcp-server/.env | xargs)
```

### 2. Open in Kiro

Open this workspace in Kiro IDE:
```bash
kiro /var/www/nanobanana-mcp-server
```

### 3. Verify MCP Connection

1. Open Kiro panel (click Kiro icon in sidebar)
2. Look for "MCP Servers" section
3. You should see "nanobanana-local" with a green indicator
4. Click to view available tools

### 4. Test Image Generation

In Kiro chat, try:
```
Generate an image of a sunset over mountains using Nano Banana
```

Or explicitly:
```
Use generate_image tool with prompt "sunset over mountains" and model_tier "grok"
```

## Switching Between Servers

### Enable Grok-Only Mode

1. Open `.kiro/settings/mcp.json`
2. Set `nanobanana-local` to `"disabled": true`
3. Set `nanobanana-grok-only` to `"disabled": false`
4. Save the file (Kiro will auto-reload)

### Enable Production Mode

1. Open `.kiro/settings/mcp.json`
2. Set `nanobanana-local` to `"disabled": true`
3. Set `nanobanana-production` to `"disabled": false`
4. Save the file (Kiro will auto-reload)

## Auto-Approve Tools

To skip approval prompts for specific tools, add them to `autoApprove`:

```json
{
  "mcpServers": {
    "nanobanana-local": {
      "autoApprove": [
        "generate_image",
        "upload_file"
      ]
    }
  }
}
```

To auto-approve all tools (not recommended for security):
```json
"autoApprove": ["*"]
```

## Disable Specific Tools

To hide specific tools from Kiro:

```json
{
  "mcpServers": {
    "nanobanana-local": {
      "disabledTools": [
        "maintenance_cleanup"
      ]
    }
  }
}
```

## Troubleshooting

### Server Not Connecting

1. **Check environment variables:**
   ```bash
   echo $GEMINI_API_KEY
   echo $GROK_API_BASE_URL
   ```

2. **Verify command exists:**
   ```bash
   which uv
   which uvx
   ```

3. **Test server manually:**
   ```bash
   cd /var/www/nanobanana-mcp-server
   uv run python -m nanobanana_mcp_server.server
   ```

4. **Check Kiro logs:**
   - Open Command Palette (Cmd/Ctrl + Shift + P)
   - Search for "Kiro: Show MCP Logs"

### Grok Provider Not Available

1. **Check Grok2API is running:**
   ```bash
   curl http://localhost:8011/health
   ```

2. **Verify environment variables:**
   ```bash
   echo $GROK_API_BASE_URL
   echo $GROK_API_KEY
   ```

3. **Check server logs:**
   Look for "Grok service not available" warnings

### Permission Errors

If you get permission errors:
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/nanobanana-mcp-server

# Fix permissions
chmod -R 755 /var/www/nanobanana-mcp-server
```

### JSON Syntax Errors

Validate your JSON:
```bash
cat .kiro/settings/mcp.json | python -m json.tool
```

## Security Best Practices

1. **Never commit credentials:**
   - Use environment variables (${VAR_NAME})
   - Don't hardcode API keys in mcp.json
   - Add `.env` to `.gitignore`

2. **Review auto-approved tools:**
   - Only auto-approve tools you trust
   - Avoid using `"*"` for autoApprove

3. **Use workspace config for sensitive projects:**
   - Keep project-specific configs in `.kiro/settings/`
   - Use user config (`~/.kiro/settings/`) for general tools

4. **Regularly update:**
   ```bash
   # Update to latest version
   uvx nanobanana-mcp-server@latest
   
   # Or for local development
   cd /var/www/nanobanana-mcp-server
   git pull
   uv sync
   ```

## Advanced Configuration

### Custom Output Directory

```json
{
  "env": {
    "IMAGE_OUTPUT_DIR": "/custom/path/to/images"
  }
}
```

### Debug Mode

```json
{
  "env": {
    "LOG_LEVEL": "DEBUG",
    "LOG_FORMAT": "detailed"
  }
}
```

### Vertex AI Authentication (Google Cloud)

```json
{
  "env": {
    "NANOBANANA_AUTH_METHOD": "vertex_ai",
    "GCP_PROJECT_ID": "your-project-id",
    "GCP_REGION": "us-central1"
  }
}
```

### Custom Gemini Endpoint

```json
{
  "env": {
    "GEMINI_BASE_URL": "https://custom-api.example.com"
  }
}
```

## Resources

- **Documentation:** [docs/](../docs/)
- **Grok Provider Guide:** [docs/GROK_PROVIDER.md](../docs/GROK_PROVIDER.md)
- **Quick Start:** [docs/GROK_QUICKSTART.md](../docs/GROK_QUICKSTART.md)
- **Examples:** [examples/](../examples/)
- **GitHub Issues:** https://github.com/zhongweili/nanobanana-mcp-server/issues
- **Kiro MCP Docs:** https://kiro.dev/docs/mcp/

## Support

For help with:
- **Nano Banana MCP Server:** GitHub Issues
- **Kiro IDE:** https://kiro.dev/docs/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Grok2API:** See Grok2API documentation
