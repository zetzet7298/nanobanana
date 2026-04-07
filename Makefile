.PHONY: install build dev start test clean lint format typecheck preflight help

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make build      - Build the project"
	@echo "  make dev        - Run in development mode (watch)"
	@echo "  make start      - Start the MCP server"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linter with auto-fix"
	@echo "  make format     - Format code with Prettier"
	@echo "  make typecheck  - Run TypeScript type checking"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make preflight  - Run full preflight checks"

install:
	npm install
	cd mcp-server && npm install

build:
	cd mcp-server && npm run build

dev:
	cd mcp-server && npm run dev

start:
	cd mcp-server && npm run start

test:
	cd mcp-server && npm run test

lint:
	npm run lint

format:
	npm run format

typecheck:
	cd mcp-server && npm run typecheck

clean:
	rm -rf mcp-server/dist
	rm -rf node_modules
	rm -rf mcp-server/node_modules

preflight: clean install format lint build typecheck
	@echo "Preflight checks completed!"
