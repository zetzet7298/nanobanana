# Grok2API Provider Guide

## Overview

Nanobanana MCP Server hiện hỗ trợ Grok2API làm provider local để xử lý ảnh với các model mạnh mẽ của Grok. Provider này cho phép bạn:

- ✅ Generate ảnh với `grok-imagine-1.0` và `grok-imagine-1.0-fast`
- ✅ Edit ảnh với `grok-imagine-1.0-edit`
- ✅ Analyze ảnh với các model Grok chat (grok-4, grok-4-thinking, etc.)
- ✅ Batch generation (1-10 ảnh cùng lúc với fast model)
- ✅ Hoàn toàn local, không cần API key bên ngoài

## Setup

### 1. Cài đặt Grok2API Server

Tham khảo: [Grok2API Documentation](https://github.com/your-grok2api-repo)

```bash
# Start Grok2API server
grok2api-server --port 8011
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `mcp-server/`:

```bash
# Grok2API Configuration
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-grok-api-key

# Model Selection
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_EDIT_MODEL=grok-imagine-1.0-edit
GROK_ANALYZER_MODEL=grok-4
```

### 3. Build và Run

```bash
cd mcp-server
npm install
npm run build
```

## Model Selection

### Image Generation Models

#### `grok-imagine-1.0`
- **Chất lượng:** Standard, high quality
- **Tốc độ:** Moderate
- **Số lượng:** 1 ảnh/request
- **Kích thước:** 1280x720, 720x1280, 1792x1024, 1024x1792, 1024x1024
- **Use case:** Khi cần chất lượng cao nhất

```bash
export GROK_IMAGE_MODEL=grok-imagine-1.0
```

#### `grok-imagine-1.0-fast` (Default)
- **Chất lượng:** Good quality
- **Tốc độ:** Fast
- **Số lượng:** 1-10 ảnh/request
- **Kích thước:** Same as standard
- **Use case:** Batch generation, quick iterations

```bash
export GROK_IMAGE_MODEL=grok-imagine-1.0-fast
```

### Image Editing Model

#### `grok-imagine-1.0-edit`
- **Chức năng:** Edit existing images with text prompts
- **Input:** Image file + text prompt
- **Output:** Modified image
- **Use case:** Image enhancement, style transfer, object modification

```bash
export GROK_EDIT_MODEL=grok-imagine-1.0-edit
```

### Analysis Models

Các model Grok chat hỗ trợ vision để analyze ảnh:

#### `grok-4` (Recommended)
- **Khả năng:** Excellent vision understanding
- **Tốc độ:** Fast
- **Use case:** General image analysis, classification

```bash
export GROK_ANALYZER_MODEL=grok-4
```

#### `grok-4-thinking`
- **Khả năng:** Advanced reasoning with chain-of-thought
- **Tốc độ:** Slower but more detailed
- **Use case:** Complex analysis, detailed descriptions

```bash
export GROK_ANALYZER_MODEL=grok-4-thinking
```

#### `grok-4.1-fast`
- **Khả năng:** Latest model, balanced
- **Tốc độ:** Very fast
- **Use case:** High-volume analysis

```bash
export GROK_ANALYZER_MODEL=grok-4.1-fast
```

#### Other Options
- `grok-3`: Standard Grok 3
- `grok-3-mini`: Lightweight, fastest
- `grok-4-heavy`: Most powerful, slowest
- `grok-4.1-expert`: Expert-level analysis

## Usage Examples

### 1. Generate Single Image

```bash
# Using MCP tool
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "A futuristic cyberpunk city at night with neon lights",
    "mode": "generate"
  }
}
```

### 2. Batch Generation (Fast Model)

```bash
# Generate 5 variations
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "Beautiful sunset over mountains",
    "mode": "generate",
    "outputCount": 5
  }
}
```

### 3. Edit Existing Image

```bash
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "Change the sky to sunset colors",
    "mode": "edit",
    "inputImage": "path/to/image.jpg"
  }
}
```

### 4. Analyze Image

```bash
{
  "tool": "analyze_image",
  "arguments": {
    "input": "path/to/image.jpg",
    "preset": "tourism"
  }
}
```

### 5. Enhance Image with Analysis

```bash
{
  "tool": "enhance_image",
  "arguments": {
    "input": "path/to/image.jpg",
    "preset": "restaurant",
    "preview": true
  }
}
```

## Configuration Presets

### Tourism & Travel
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0-fast  # Fast batch generation
GROK_ANALYZER_MODEL=grok-4              # Good vision understanding
```

### Restaurant & Food
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0       # High quality for food
GROK_ANALYZER_MODEL=grok-4-thinking     # Detailed food analysis
```

### E-commerce & Product
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0       # High quality product shots
GROK_ANALYZER_MODEL=grok-4.1-fast       # Fast product classification
```

### High Volume Processing
```bash
GROK_IMAGE_MODEL=grok-imagine-1.0-fast  # Batch generation
GROK_ANALYZER_MODEL=grok-3-mini         # Fastest analysis
```

## Performance Comparison

| Model | Speed | Quality | Batch | Best For |
|-------|-------|---------|-------|----------|
| grok-imagine-1.0 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1 | High quality singles |
| grok-imagine-1.0-fast | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 1-10 | Batch generation |
| grok-imagine-1.0-edit | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 1-10 | Image editing |
| grok-4 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | Analysis |
| grok-4-thinking | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | - | Detailed analysis |
| grok-3-mini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | - | Fast analysis |

## Troubleshooting

### Connection Issues

```bash
# Check if Grok2API server is running
curl http://localhost:8011/health

# Check available models
curl http://localhost:8011/v1/models \
  -H "Authorization: Bearer your-key"
```

### Model Not Found

```bash
# Verify model name in env
echo $GROK_IMAGE_MODEL

# Check server logs for supported models
```

### Slow Generation

```bash
# Switch to fast model
export GROK_IMAGE_MODEL=grok-imagine-1.0-fast

# Reduce batch size
# Use outputCount: 3 instead of 10
```

### Analysis Errors

```bash
# Try different analyzer model
export GROK_ANALYZER_MODEL=grok-3-mini

# Check image format (should be jpg, png, webp)
file path/to/image.jpg
```

## Advanced Configuration

### Mixed Providers

Bạn có thể dùng Grok cho generation và Gemini cho analysis:

```bash
# Grok for image generation
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-grok-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast

# Gemini for analysis (if you have API key)
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
NANOBANANA_GEMINI_API_KEY=your-gemini-key
```

### Custom Model Parameters

Trong code, bạn có thể customize thêm parameters:

```typescript
// In imageGenerator.ts - callGrok2API method
requestBody = {
  model: modelToUse,
  prompt: prompt,
  n: 5,                    // Number of images
  size: "1792x1024",       // Custom size
  response_format: "b64_json",
  quality: "high",         // If supported
  style: "vivid"           // If supported
};
```

## API Endpoints Reference

### Image Generation
```
POST /v1/images/generations
{
  "model": "grok-imagine-1.0-fast",
  "prompt": "...",
  "n": 1-10,
  "size": "1024x1024",
  "response_format": "b64_json"
}
```

### Image Editing
```
POST /v1/images/edits
{
  "model": "grok-imagine-1.0-edit",
  "prompt": "...",
  "image": "base64_string",
  "n": 1-10
}
```

### Chat with Vision (Analysis)
```
POST /v1/chat/completions
{
  "model": "grok-4",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "..."},
      {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,..."}}
    ]
  }]
}
```

## Best Practices

1. **Use fast model for iterations**: `grok-imagine-1.0-fast` cho draft và testing
2. **Use standard model for finals**: `grok-imagine-1.0` cho production images
3. **Batch when possible**: Generate 5-10 variations cùng lúc với fast model
4. **Choose right analyzer**: `grok-4` cho general, `grok-4-thinking` cho detailed
5. **Monitor performance**: Check generation time và adjust model accordingly

## Migration from Gemini

Nếu bạn đang dùng Gemini, chuyển sang Grok rất đơn giản:

```bash
# Before (Gemini)
NANOBANANA_GEMINI_API_KEY=your-key
NANOBANANA_MODEL=gemini-3-pro-image-preview

# After (Grok)
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
```

Code không cần thay đổi, chỉ cần update env variables!

## Support

- Grok2API Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Nanobanana Issues: [GitHub Issues](https://github.com/google-gemini/gemini-cli/issues)
- Documentation: [Full Docs](../README.md)
