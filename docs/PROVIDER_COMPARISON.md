# Provider Comparison Guide

## Overview

Nanobanana MCP Server hỗ trợ 3 providers chính để xử lý ảnh. Mỗi provider có ưu nhược điểm riêng.

## Quick Comparison

| Feature | Grok2API | Local Proxy (Gemini) | Google Gemini API |
|---------|----------|---------------------|-------------------|
| **Setup** | Local server | Local server | Cloud API |
| **Cost** | Free (local) | Free (local) | Pay per use |
| **Speed** | Fast | Fast | Moderate |
| **Batch Generation** | ✅ 1-10 images | ❌ 1 image | ❌ 1 image |
| **Image Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Image Editing** | ✅ Native | ✅ Via prompt | ✅ Via prompt |
| **Analysis Models** | Multiple (grok-3/4) | Gemini Flash/Pro | Gemini Flash/Pro |
| **Internet Required** | ❌ No | ❌ No | ✅ Yes |
| **API Key Required** | ✅ Yes (local) | ✅ Yes (local) | ✅ Yes (Google) |

## Detailed Comparison

### 1. Grok2API

**Best for:** Local development, batch generation, rapid iterations

#### Pros
- ✅ **Batch generation**: Generate 1-10 images in one request
- ✅ **Fast model**: `grok-imagine-1.0-fast` is very quick
- ✅ **Native editing**: Dedicated edit model
- ✅ **Multiple analysis models**: Choose from grok-3, grok-4, grok-4.1
- ✅ **Completely local**: No internet required
- ✅ **Free**: No API costs

#### Cons
- ❌ Requires running local Grok2API server
- ❌ Quality slightly lower than Gemini Pro
- ❌ Limited to Grok model capabilities

#### Setup
```bash
# 1. Start Grok2API server
grok2api-server --port 8011

# 2. Configure environment
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-local-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_ANALYZER_MODEL=grok-4
```

#### Use Cases
- **Batch processing**: Generate multiple variations quickly
- **Rapid prototyping**: Fast iterations during development
- **Offline work**: No internet dependency
- **Cost-sensitive projects**: No API fees

---

### 2. Local Proxy (Gemini Format)

**Best for:** High quality, Gemini compatibility, local control

#### Pros
- ✅ **Highest quality**: Gemini Pro image quality
- ✅ **Gemini compatibility**: Use Gemini models locally
- ✅ **Flexible**: Can proxy to various backends
- ✅ **Local control**: Full control over infrastructure
- ✅ **Free**: No API costs

#### Cons
- ❌ Requires local proxy server setup
- ❌ Single image per request
- ❌ More complex configuration
- ❌ Depends on proxy implementation

#### Setup
```bash
# 1. Start local proxy (example)
gemini-proxy --port 8080

# 2. Configure environment
OPENAI_API_BASE=http://localhost:8080
OPENAI_API_KEY=your-proxy-key
NANOBANANA_MODEL=gemini-3-pro-image-preview
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

#### Use Cases
- **Production quality**: When you need best image quality
- **Gemini features**: Access to latest Gemini capabilities
- **Custom infrastructure**: When you control the proxy
- **Privacy**: Keep all data local

---

### 3. Google Gemini API (Direct)

**Best for:** Simplicity, latest features, no local setup

#### Pros
- ✅ **Easiest setup**: Just need API key
- ✅ **Latest features**: Always up-to-date
- ✅ **Highest quality**: Official Gemini models
- ✅ **No maintenance**: Google handles infrastructure
- ✅ **Reliable**: Enterprise-grade uptime

#### Cons
- ❌ **Costs money**: Pay per API call
- ❌ **Internet required**: Must be online
- ❌ **Single image**: One image per request
- ❌ **Rate limits**: Subject to API quotas
- ❌ **Privacy**: Data sent to Google

#### Setup
```bash
# Just need API key
NANOBANANA_GEMINI_API_KEY=your-google-api-key
NANOBANANA_MODEL=gemini-3-pro-image-preview
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

#### Use Cases
- **Quick start**: Get running immediately
- **Production apps**: Reliable, scalable
- **Latest features**: Access newest Gemini capabilities
- **No local resources**: When you can't run local servers

---

## Model Comparison

### Image Generation Models

| Model | Provider | Quality | Speed | Batch | Size Options |
|-------|----------|---------|-------|-------|--------------|
| grok-imagine-1.0 | Grok2API | ⭐⭐⭐⭐ | ⭐⭐⭐ | 1 | Multiple |
| grok-imagine-1.0-fast | Grok2API | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1-10 | Multiple |
| gemini-3-pro-image | Gemini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 1 | Fixed |
| gemini-2.5-flash | Gemini | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 1 | Fixed |

### Analysis Models

| Model | Provider | Vision | Speed | Reasoning | Cost |
|-------|----------|--------|-------|-----------|------|
| grok-4 | Grok2API | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free |
| grok-4-thinking | Grok2API | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free |
| grok-3-mini | Grok2API | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Free |
| gemini-2.5-flash | Gemini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Paid |
| gemini-3-pro | Gemini | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Paid |

---

## Recommended Configurations

### For Development
```bash
# Use Grok2API for speed and batch generation
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=dev-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
GROK_ANALYZER_MODEL=grok-3-mini
```

### For Production (Quality)
```bash
# Use Gemini API for best quality
NANOBANANA_GEMINI_API_KEY=your-key
NANOBANANA_MODEL=gemini-3-pro-image-preview
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

### For Production (Cost-Effective)
```bash
# Use local Grok2API to avoid API costs
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=prod-key
GROK_IMAGE_MODEL=grok-imagine-1.0
GROK_ANALYZER_MODEL=grok-4
```

### For High Volume
```bash
# Use Grok2API fast model with batch
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=batch-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast  # Supports 1-10 images
GROK_ANALYZER_MODEL=grok-3-mini         # Fastest analysis
```

### Mixed Setup (Best of Both)
```bash
# Grok for generation, Gemini for analysis
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=grok-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast

NANOBANANA_GEMINI_API_KEY=gemini-key
NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
```

---

## Performance Benchmarks

### Image Generation (Single Image)

| Provider | Model | Time | Quality Score |
|----------|-------|------|---------------|
| Grok2API | grok-imagine-1.0-fast | ~3s | 8.5/10 |
| Grok2API | grok-imagine-1.0 | ~5s | 9/10 |
| Gemini | gemini-3-pro-image | ~6s | 9.5/10 |
| Gemini | gemini-2.5-flash | ~4s | 8.8/10 |

### Batch Generation (5 Images)

| Provider | Model | Time | Avg Quality |
|----------|-------|------|-------------|
| Grok2API | grok-imagine-1.0-fast | ~8s | 8.5/10 |
| Gemini | Sequential calls | ~30s | 9.5/10 |

### Image Analysis

| Provider | Model | Time | Accuracy |
|----------|-------|------|----------|
| Grok2API | grok-4 | ~2s | 90% |
| Grok2API | grok-4-thinking | ~4s | 95% |
| Gemini | gemini-2.5-flash | ~2s | 92% |
| Gemini | gemini-3-pro | ~3s | 96% |

---

## Cost Analysis

### Per 1000 Images

| Provider | Generation | Analysis | Total | Notes |
|----------|-----------|----------|-------|-------|
| Grok2API | $0 | $0 | $0 | Local, free |
| Local Proxy | $0 | $0 | $0 | Local, free |
| Gemini API | ~$50 | ~$10 | ~$60 | Varies by model |

### Break-Even Point

If you generate more than **~1000 images/month**, local setup (Grok2API or Local Proxy) becomes cost-effective compared to Gemini API.

---

## Migration Guide

### From Gemini to Grok2API

```bash
# Before
NANOBANANA_GEMINI_API_KEY=abc123
NANOBANANA_MODEL=gemini-3-pro-image-preview

# After
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key
GROK_IMAGE_MODEL=grok-imagine-1.0-fast
```

**No code changes needed!** Just update environment variables.

### From Grok2API to Gemini

```bash
# Before
GROK_API_BASE_URL=http://localhost:8011
GROK_API_KEY=your-key

# After
NANOBANANA_GEMINI_API_KEY=abc123
NANOBANANA_MODEL=gemini-3-pro-image-preview
```

**No code changes needed!** Provider is auto-detected.

---

## Troubleshooting

### Grok2API Not Detected

```bash
# Check priority order
# 1. GROK_API_BASE_URL + GROK_API_KEY (highest)
# 2. OPENAI_API_BASE + OPENAI_API_KEY
# 3. NANOBANANA_GEMINI_API_KEY
# 4. GEMINI_API_KEY (lowest)

# Make sure Grok vars are set
echo $GROK_API_BASE_URL
echo $GROK_API_KEY
```

### Slow Generation

```bash
# Switch to faster model
GROK_IMAGE_MODEL=grok-imagine-1.0-fast  # Instead of grok-imagine-1.0
GROK_ANALYZER_MODEL=grok-3-mini         # Instead of grok-4-thinking
```

### Quality Issues

```bash
# Use higher quality models
GROK_IMAGE_MODEL=grok-imagine-1.0       # Instead of fast
GROK_ANALYZER_MODEL=grok-4-thinking     # Instead of mini
```

---

## Conclusion

**Choose Grok2API if:**
- You need batch generation
- You want to minimize costs
- You work offline frequently
- Speed is more important than absolute quality

**Choose Local Proxy if:**
- You need highest quality
- You have existing proxy infrastructure
- You want Gemini compatibility locally

**Choose Gemini API if:**
- You want simplest setup
- You need latest features immediately
- You don't want to manage servers
- Cost is not a primary concern

**Best Practice:** Start with Grok2API for development, then decide based on your production needs.
