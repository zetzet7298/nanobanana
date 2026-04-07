#!/bin/bash
# Script to add Nanobanana MCP server to Pi configuration

set -e

PI_CONFIG="$HOME/.pi/agent/mcp.json"
BACKUP_CONFIG="$HOME/.pi/agent/mcp.json.backup"

echo "🔧 Adding Nanobanana to Pi MCP Configuration"
echo "=============================================="
echo ""

# Check if Pi config directory exists
if [ ! -d "$HOME/.pi/agent" ]; then
    echo "📁 Creating Pi config directory..."
    mkdir -p "$HOME/.pi/agent"
fi

# Backup existing config if it exists
if [ -f "$PI_CONFIG" ]; then
    echo "💾 Backing up existing config to: $BACKUP_CONFIG"
    cp "$PI_CONFIG" "$BACKUP_CONFIG"
    
    # Check if nanobanana already exists
    if cat "$PI_CONFIG" | jq -e '.mcpServers.nanobanana' > /dev/null 2>&1; then
        echo "⚠️  Nanobanana server already exists in config!"
        echo ""
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Aborted. No changes made."
            exit 0
        fi
    fi
    
    # Merge with existing config
    echo "🔄 Merging with existing config..."
    
    NANOBANANA_CONFIG=$(cat << 'EOF'
{
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
EOF
)
    
    # Use jq to merge
    cat "$PI_CONFIG" | jq --argjson nano "$NANOBANANA_CONFIG" \
        '.mcpServers.nanobanana = $nano' > "$PI_CONFIG.tmp"
    mv "$PI_CONFIG.tmp" "$PI_CONFIG"
    
else
    # Create new config
    echo "📝 Creating new Pi config..."
    cat > "$PI_CONFIG" << 'EOF'
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
fi

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Current config:"
cat "$PI_CONFIG" | jq '.mcpServers.nanobanana'
echo ""

# Verify JSON syntax
if cat "$PI_CONFIG" | jq '.' > /dev/null 2>&1; then
    echo "✅ JSON syntax is valid"
else
    echo "❌ JSON syntax error! Restoring backup..."
    if [ -f "$BACKUP_CONFIG" ]; then
        cp "$BACKUP_CONFIG" "$PI_CONFIG"
        echo "✅ Backup restored"
    fi
    exit 1
fi

echo ""
echo "🔍 Verification:"
echo "---------------"

# Check if server file exists
if [ -f "/var/www/nanobanana/mcp-server/dist/index.js" ]; then
    echo "✅ Server file exists"
else
    echo "⚠️  Server file not found. Run: cd /var/www/nanobanana/mcp-server && npm run build"
fi

# Check if Grok2API is running
if curl -s http://localhost:8011/health > /dev/null 2>&1; then
    echo "✅ Grok2API server is running"
else
    echo "⚠️  Grok2API server not running. Start with: grok2api-server --port 8011"
fi

# Check if output directory exists
if [ -d "/var/www/nanobanana/nanobanana-output" ]; then
    echo "✅ Output directory exists"
else
    echo "📁 Creating output directory..."
    mkdir -p "/var/www/nanobanana/nanobanana-output"
    echo "✅ Output directory created"
fi

echo ""
echo "📚 Next Steps:"
echo "-------------"
echo "1. Restart Pi to load the new configuration"
echo "2. Test with: 'Generate an image of a sunset'"
echo "3. Check available tools in Pi"
echo ""
echo "📖 For more info, see: PI_SETUP_GUIDE.md"
echo ""
echo "✨ Setup complete!"
