#!/bin/bash
# ============================================================
# Nano Banana MCP Server - Kiro Setup Script
# ============================================================
# This script helps you set up the MCP configuration for Kiro
#
# Usage:
#   bash .kiro/setup.sh

set -e

echo "🍌 Nano Banana MCP Server - Kiro Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "pyproject.toml" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    echo "   cd /var/www/nanobanana-mcp-server"
    exit 1
fi

echo "📋 Step 1: Checking Prerequisites"
echo "-----------------------------------"

# Check uv
if command -v uv &> /dev/null; then
    echo -e "${GREEN}✅ uv is installed${NC}"
else
    echo -e "${YELLOW}⚠️  uv not found. Installing...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✅ Python ${PYTHON_VERSION} is installed${NC}"
else
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

echo ""
echo "🔑 Step 2: Environment Variables"
echo "-----------------------------------"

# Check if .env exists
if [ -f "$HOME/.env" ]; then
    echo -e "${GREEN}✅ Found ~/.env${NC}"
    source "$HOME/.env"
else
    echo -e "${YELLOW}⚠️  No ~/.env found${NC}"
    echo ""
    read -p "Would you like to create one now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .kiro/.env.example "$HOME/.env"
        echo -e "${GREEN}✅ Created ~/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit ~/.env with your API keys:${NC}"
        echo "   nano ~/.env"
        echo ""
        read -p "Press Enter after editing ~/.env..."
        source "$HOME/.env"
    fi
fi

# Check required variables
echo ""
echo "Checking environment variables..."

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not set${NC}"
    echo "   Get your key: https://makersuite.google.com/app/apikey"
else
    echo -e "${GREEN}✅ GEMINI_API_KEY is set${NC}"
fi

if [ -z "$GROK_API_BASE_URL" ]; then
    echo -e "${YELLOW}⚠️  GROK_API_BASE_URL not set (optional)${NC}"
else
    echo -e "${GREEN}✅ GROK_API_BASE_URL is set: ${GROK_API_BASE_URL}${NC}"
    
    # Test Grok connection
    if curl -s -f "${GROK_API_BASE_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Grok2API is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  Grok2API not responding at ${GROK_API_BASE_URL}${NC}"
    fi
fi

echo ""
echo "🔧 Step 3: MCP Configuration"
echo "-----------------------------------"

# Check MCP config
if [ -f ".kiro/settings/mcp.json" ]; then
    echo -e "${GREEN}✅ MCP config exists: .kiro/settings/mcp.json${NC}"
    
    # Validate JSON
    if python3 -m json.tool .kiro/settings/mcp.json > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP config is valid JSON${NC}"
    else
        echo -e "${RED}❌ MCP config has JSON syntax errors${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ MCP config not found${NC}"
    exit 1
fi

echo ""
echo "🧪 Step 4: Testing Server"
echo "-----------------------------------"

echo "Testing server startup..."
timeout 5 uv run python -m nanobanana_mcp_server.server > /dev/null 2>&1 &
SERVER_PID=$!

sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Server starts successfully${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${RED}❌ Server failed to start${NC}"
    echo "   Check logs for errors"
fi

echo ""
echo "📚 Step 5: Documentation"
echo "-----------------------------------"

echo "Available documentation:"
echo "  • Kiro Setup: .kiro/README.md"
echo "  • Grok Provider: docs/GROK_PROVIDER.md"
echo "  • Quick Start: docs/GROK_QUICKSTART.md"
echo "  • Examples: examples/grok_example.py"

echo ""
echo "✅ Setup Complete!"
echo "===================="
echo ""
echo "Next steps:"
echo ""
echo "1. Open in Kiro:"
echo "   ${BLUE}kiro /var/www/nanobanana-mcp-server${NC}"
echo ""
echo "2. Verify MCP connection:"
echo "   - Open Kiro panel (click Kiro icon)"
echo "   - Look for 'nanobanana-local' in MCP Servers"
echo "   - Should show green indicator"
echo ""
echo "3. Test image generation:"
echo "   ${BLUE}Generate an image of a sunset over mountains${NC}"
echo ""
echo "4. View configuration:"
echo "   ${BLUE}cat .kiro/settings/mcp.json${NC}"
echo ""
echo "For help, see: ${BLUE}.kiro/README.md${NC}"
echo ""
