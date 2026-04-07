# CLIProxyAPI Full Reference

This document provides a comprehensive list of all API endpoints available in the CLIProxyAPI server.

## Base Configuration

- **Default Host**: `localhost`
- **Default Port**: `8317`
- **Base URL**: `http://localhost:8317`

---

## 1. OpenAI & Claude Compatible API (`/v1`)

Core endpoints for AI interaction.

| Method | Endpoint                    | Description                                                  |
| :----- | :-------------------------- | :----------------------------------------------------------- |
| `GET`  | `/v1/models`                | List available models (Format depends on User-Agent).        |
| `POST` | `/v1/chat/completions`      | OpenAI Chat Completion.                                      |
| `POST` | `/v1/completions`           | OpenAI Legacy Text Completion.                               |
| `POST` | `/v1/messages`              | Anthropic Claude Messages API.                               |
| `POST` | `/v1/messages/count_tokens` | Token counting for Claude.                                   |
| `POST` | `/v1/responses`             | OpenAI Responses API.                                        |
| `GET`  | `/v1/ws`                    | Generic Websocket upgrade endpoint (path depends on config). |

---

## 2. Gemini Compatible API (`/v1beta`)

Endpoints for Google Gemini SDKs.

| Method | Endpoint                 | Description                                                  |
| :----- | :----------------------- | :----------------------------------------------------------- |
| `GET`  | `/v1beta/models`         | List models in Gemini format.                                |
| `GET`  | `/v1beta/models/*action` | Get model info.                                              |
| `POST` | `/v1beta/models/*action` | Model actions (GenerateContent, StreamGenerateContent, etc). |

---

## 3. Management API (`/v0/management`)

Endpoints for system administration, configuration, and monitoring.  
_Requires `Authorization: Bearer <SECRET>` or `X-Local-Password: <SECRET>`._

### System & Usage

- `GET /v0/management/usage`: Usage statistics.
- `GET /v0/management/latest-version`: Check for updates.
- `GET /v0/management/debug`: Current debug status.
- `PUT /v0/management/debug`: Update debug status.
- `GET /v0/management/logs`: Retrieve system logs.
- `DELETE /v0/management/logs`: Clear system logs.
- `GET /v0/management/request-error-logs`: List error log files.
- `GET /v0/management/request-error-logs/:name`: Download specific error log.

### Configuration

- `GET /v0/management/config`: Get full current configuration.
- `GET /v0/management/config.yaml`: Download configuration as YAML.
- `PUT /v0/management/config.yaml`: Update configuration via YAML upload.
- `GET /v0/management/proxy-url`: Current upstream proxy URL.
- `PUT/PATCH /v0/management/proxy-url`: Update proxy URL.
- `DELETE /v0/management/proxy-url`: Remove proxy URL.

### Credentials & Keys

- `GET/PUT/PATCH/DELETE /v0/management/api-keys`: OpenAI-style API keys.
- `GET/PUT/PATCH/DELETE /v0/management/gemini-api-key`: Google Gemini keys.
- `GET/PUT/PATCH/DELETE /v0/management/claude-api-key`: Anthropic Claude keys.
- `GET/PUT/PATCH/DELETE /v0/management/codex-api-key`: OpenAI Codex keys.

### Authentication & OAuth

- `GET /v0/management/get-auth-status`: Check current login status for all providers.
- `GET /v0/management/anthropic-auth-url`: Get login URL for Anthropic.
- `GET /v0/management/codex-auth-url`: Get login URL for OpenAI Codex.
- `GET /v0/management/gemini-cli-auth-url`: Get login URL for Gemini CLI.
- `GET /v0/management/antigravity-auth-url`: Get login URL for Antigravity.
- `GET /v0/management/qwen-auth-url`: Get login URL for Qwen.
- `GET /v0/management/iflow-auth-url`: Get login URL for IFlow.
- `POST /v0/management/oauth-callback`: Manual check for OAuth completion.

### Advanced Settings

- `GET/PUT /v0/management/logging-to-file`: Toggle disk logging.
- `GET/PUT /v0/management/usage-statistics-enabled`: Toggle usage tracking.
- `GET/PUT /v0/management/ws-auth`: Toggle authentication for Websockets.
- `GET/PUT /v0/management/request-retry`: Configuration for retries.
- `GET/PUT /v0/management/max-retry-interval`: Max wait time between retries.
- `GET/PUT /v0/management/openai-compatibility`: OpenAI compatibility flags.
- `GET/PUT /v0/management/oauth-excluded-models`: Models to skip OAuth for.

### AmpCode (Routing & Mapping)

- `GET /v0/management/ampcode`: Amp routing status.
- `GET/PUT /v0/management/ampcode/upstream-url`: Target URL for Amp routing.
- `GET/PUT /v0/management/ampcode/model-mappings`: Model translation map.
- `GET/PUT /v0/management/ampcode/force-model-mappings`: Force specific model overrides.

---

## 4. UI & Utility Endpoints

| Method | Endpoint             | Description                                                             |
| :----- | :------------------- | :---------------------------------------------------------------------- |
| `GET`  | `/`                  | Root info message.                                                      |
| `GET`  | `/management.html`   | The Web-based Management Panel UI.                                      |
| `GET`  | `/keep-alive`        | Heartbeat endpoint to keep server/session active.                       |
| `POST` | `/v1internal:method` | Gemini CLI internal handler.                                            |
| `GET`  | `/*/callback`        | OAuth callback handlers (Anthropic, Codex, Google, IFlow, Antigravity). |
