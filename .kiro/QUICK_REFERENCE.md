# Kiro MCP Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup environment
cp .kiro/.env.example ~/.env
nano ~/.env  # Add your API keys

# 2. Load environment
source ~/.env

# 3. Run setup script
bash .kiro/setup.sh

# 4. Open in Kiro
kiro /var/www/nanobanana-mcp-server
```

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.kiro/settings/mcp.json` | MCP server configuration |
| `~/.env` | Environment variables |
| `.kiro/README.md` | Full documentation |

## 🔧 MCP Servers

### nanobanana-local (Default)
```json
"disabled": false  // ✅ Enabled
```
Local development server with all models

### nanobanana-grok-only
```json
"disabled": true  // ❌ Disabled
```
Grok-only mode (fast model: grok-imagine-1.0-fast)

### nanobanana-grok-standard
```json
"disabled": true  // ❌ Disabled
```
Grok-only mode (standard model: grok-imagine-1.0)

### nanobanana-production
```json
"disabled": true  // ❌ Disabled
```
Published package from PyPI

## 🔑 Environment Variables

### Required
```bash
GEMINI_API_KEY=your-key
```

### Optional
```bash
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast  # or grok-imagine-1.0
GROK_EDIT_MODEL=grok-imagine-1.0-edit
NANOBANANA_MODEL=auto  # auto|flash|nb2|pro|grok
IMAGE_OUTPUT_DIR=$HOME/nanobanana-images
LOG_LEVEL=INFO
```

## 🎨 Model Selection

| Model | Tier | Resolution | Speed | Use Case |
|-------|------|------------|-------|----------|
| Gemini 3.1 Flash | `nb2` | 4K | Fast | Default, production |
| Gemini 3 Pro | `pro` | 4K | Moderate | Max quality |
| Gemini 2.5 Flash | `flash` | 1024px | Very Fast | Quick drafts |
| Grok Imagine | `grok` | 1792x1024 | Fast | Local, 1-10 images |

## 💬 Usage Examples

### In Kiro Chat

```
Generate an image of a sunset over mountains
```

```
Create 5 product photos using Grok provider
```

```
Edit this image to change the background to a beach
```

### Explicit Tool Calls

```python
generate_image(
    prompt="A futuristic city",
    model_tier="grok",
    n=10,
    aspect_ratio="16:9"
)
```

## 🔄 Switch Servers

### Enable Grok-Only
1. Open `.kiro/settings/mcp.json`
2. Set `nanobanana-local` → `"disabled": true`
3. Set `nanobanana-grok-only` → `"disabled": false`
4. Save (auto-reloads)

### Enable Production
1. Open `.kiro/settings/mcp.json`
2. Set `nanobanana-local` → `"disabled": true`
3. Set `nanobanana-production` → `"disabled": false`
4. Save (auto-reloads)

## 🛠️ Troubleshooting

### Server Not Connecting
```bash
# Check environment
echo $GEMINI_API_KEY
echo $GROK_API_BASE_URL

# Test server
cd /var/www/nanobanana-mcp-server
uv run python -m nanobanana_mcp_server.server

# View Kiro logs
# Cmd/Ctrl + Shift + P → "Kiro: Show MCP Logs"
```

### Grok Not Available
```bash
# Test Grok2API
curl http://localhost:8011/health

# Check environment
echo $GROK_API_BASE_URL
```

### JSON Syntax Error
```bash
# Validate JSON
cat .kiro/settings/mcp.json | python -m json.tool
```

## 🔐 Security

### ✅ Do
- Use `${VAR_NAME}` for secrets
- Keep `.env` in `.gitignore`
- Review auto-approved tools

### ❌ Don't
- Hardcode API keys in mcp.json
- Commit credentials to git
- Use `"*"` for autoApprove

## 📚 Resources

| Resource | Location |
|----------|----------|
| Full Setup Guide | `.kiro/README.md` |
| Grok Provider Docs | `docs/GROK_PROVIDER.md` |
| Quick Start | `docs/GROK_QUICKSTART.md` |
| Examples | `examples/grok_example.py` |
| Kiro MCP Docs | https://kiro.dev/docs/mcp/ |

## 🆘 Support

- **Nano Banana Issues:** https://github.com/zhongweili/nanobanana-mcp-server/issues
- **Kiro Docs:** https://kiro.dev/docs/
- **MCP Protocol:** https://modelcontextprotocol.io/

## ⚡ Common Commands

```bash
# Reload environment
source ~/.env

# Validate config
cat .kiro/settings/mcp.json | python -m json.tool

# Test server
uv run python -m nanobanana_mcp_server.server

# Update dependencies
uv sync

# Run examples
python examples/grok_example.py

# View logs
tail -f ~/nanobanana-images/logs/*.log
```

## 🎯 Tips

1. **Start with auto mode** - Let the system choose the best model
2. **Use Grok for batches** - Generate 10 images at once
3. **Enable debug logging** - Set `LOG_LEVEL=DEBUG` for troubleshooting
4. **Check MCP panel** - Green indicator = connected
5. **Read full docs** - See `.kiro/README.md` for details
