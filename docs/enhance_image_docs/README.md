# AI Image Enhancement - Complete Documentation

Comprehensive documentation for implementing an AI-powered image enhancement system using Google Gemini models. This documentation is **language-independent** and can be used to implement in Node.js, Python, Go, Rust, Java, or any other language.

## 📚 Documentation Index

| # | Document | Description | Lines |
|---|----------|-------------|-------|
| 1 | [PRD](01_PRD.md) | Product Requirements - features, acceptance criteria, user stories | ~600 |
| 2 | [Architecture](02_ARCHITECTURE.md) | System design, class diagrams, sequence diagrams, scalability | ~800 |
| 3 | [API Reference](03_API_REFERENCE.md) | Gemini API endpoints, curl examples, code samples | ~1300 |
| 4 | [Configuration Schema](04_CONFIGURATION_SCHEMA.md) | Complete config schema, validation rules, presets | ~700 |
| 5 | [Implementation Guide](05_IMPLEMENTATION_GUIDE.md) | Step-by-step guide, working examples, testing | ~1200 |
| 6 | [Flow Diagrams](06_FLOW_DIAGRAMS.md) | Visual workflows, data flow, error handling | ~500 |

### Example Configurations
| File | Business Type |
|------|---------------|
| [examples/config-real-estate.json](examples/config-real-estate.json) | Bất động sản |
| [examples/config-restaurant.json](examples/config-restaurant.json) | Nhà hàng & Ẩm thực |
| [examples/config-ecommerce.json](examples/config-ecommerce.json) | Thương mại điện tử |
| [examples/config-spa-wellness.json](examples/config-spa-wellness.json) | Spa & Wellness |

---

## 🎯 What This System Does

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Original   │     │   Analyze    │     │   Enhance    │     │   Output     │
│    Image     │────▶│  + Classify  │────▶│  with AI     │────▶│  Organized   │
│              │     │              │     │              │     │  by Category │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │ gemini-2.5   │     │ gemini-2.5   │
                     │ -flash       │     │ -flash-image │
                     │ (TEXT mode)  │     │ (IMAGE mode) │
                     └──────────────┘     └──────────────┘
```

### Core Features
- **AI Analysis**: Understand image content, composition, mood
- **Auto Classification**: Categorize into 17+ types (beach, hotel, food, etc.)
- **Smart Enhancement**: Add people, improve colors/lighting for marketing
- **Category Organization**: Output saved to category subfolders
- **Batch Processing**: Handle multiple images with concurrency control
- **Configurable Presets**: Different settings for different business types

---

## 🚀 Quick Start (5 Minutes)

### 1. Set Environment Variables
```bash
# Using local proxy (recommended)
export OPENAI_API_BASE="http://localhost:8317"
export OPENAI_API_KEY="your-proxy-key"

# Or direct API
export GEMINI_API_KEY="your-gemini-key"
```

### 2. Minimal Implementation (Any Language)

```
1. Read image → Convert to base64
2. Call Gemini Flash API (TEXT mode) with analysis prompt
3. Parse JSON response → Extract classification
4. Build enhancement prompt with analysis + rules
5. Call Gemini Flash-Image API (TEXT+IMAGE mode)
6. Extract image from response → Save to category folder
```

### 3. Test with curl
```bash
# Analysis
curl -X POST "http://localhost:8317/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "contents": [{"role": "user", "parts": [
      {"text": "Analyze this image and classify it"},
      {"inline_data": {"mime_type": "image/png", "data": "BASE64..."}}
    ]}],
    "generationConfig": {"responseModalities": ["TEXT"]}
  }'
```

---

## 📖 Reading Order

### For Product Managers
1. [PRD](01_PRD.md) - Understand features and requirements
2. [Flow Diagrams](06_FLOW_DIAGRAMS.md) - Visualize the process

### For Architects
1. [Architecture](02_ARCHITECTURE.md) - System design and patterns
2. [API Reference](03_API_REFERENCE.md) - API integration details

### For Developers
1. [Implementation Guide](05_IMPLEMENTATION_GUIDE.md) - Start coding
2. [Configuration Schema](04_CONFIGURATION_SCHEMA.md) - Configure presets
3. [API Reference](03_API_REFERENCE.md) - API details and examples

---

## 🔧 Implementation Checklist

### Core Components
- [ ] Image Input Handler (read, base64, MIME type)
- [ ] Image Analyzer (API call, JSON parsing, classification)
- [ ] Image Enhancer (prompt building, API call, image extraction)
- [ ] Output Handler (category folders, file naming)
- [ ] Configuration Manager (load config, presets)

### API Integration
- [ ] Authentication (API key or OAuth)
- [ ] Analysis endpoint (`gemini-2.5-flash:generateContent`)
- [ ] Enhancement endpoint (`gemini-2.5-flash-image:generateContent`)
- [ ] Error handling (retry, rate limits)

### Testing
- [ ] Unit tests for each component
- [ ] Integration tests with real API
- [ ] Batch processing tests

---

## 🌐 Language Examples

| Language | Location | Status |
|----------|----------|--------|
| **Node.js/TypeScript** | [Implementation Guide](05_IMPLEMENTATION_GUIDE.md#step-by-step) | Complete |
| **Python** | [Implementation Guide](05_IMPLEMENTATION_GUIDE.md#python) | Complete |
| **Go** | [Implementation Guide](05_IMPLEMENTATION_GUIDE.md#go) | Complete |
| **curl** | [API Reference](03_API_REFERENCE.md#curl) | Complete |

---

## 📁 Output Structure

When `organizeByCategory: true`:
```
output/
├── bai-bien/           # Beach images
│   ├── enhanced_beach1.png
│   └── beach1_analysis.json
├── nha-hang/           # Restaurant images
│   └── enhanced_food1.png
├── khach-san/          # Hotel images
│   └── enhanced_lobby1.png
├── phong-nghi/         # Room images
├── hai-san/            # Seafood images
├── am-thuc/            # Food images
├── ho-boi/             # Pool images
├── hoat-dong/          # Activity images
└── khac/               # Uncategorized
```

---

## 🔑 Key Configuration

### Minimal Config
```json
{
  "version": "1.0.0",
  "activePreset": "default",
  "globalSettings": {
    "analyzerModel": "gemini-2.5-flash",
    "enhancerModel": "gemini-2.5-flash-image",
    "organizeByCategory": true
  },
  "presets": {
    "default": {
      "name": "Default",
      "systemPrompt": {
        "analysis": "Analyze this image...",
        "enhancement": "Enhance this image..."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Asian"
      }
    }
  }
}
```

See [Configuration Schema](04_CONFIGURATION_SCHEMA.md) for complete options.

---

## ❓ FAQ

### Q: Can I use this without MCP?
**A:** Yes! This documentation is designed for standalone implementation. You only need HTTP client and JSON parsing.

### Q: Which AI models are required?
**A:** 
- `gemini-2.5-flash` for analysis (text+vision)
- `gemini-2.5-flash-image` for enhancement (image generation)

### Q: Can I customize the categories?
**A:** Yes! See [Configuration Schema](04_CONFIGURATION_SCHEMA.md#categories).

### Q: How do I add a new business type?
**A:** Create a custom preset. See [examples/](examples/) for templates.

---

## 📄 License

Apache-2.0

---

## 📞 Support

- Review [Troubleshooting](05_IMPLEMENTATION_GUIDE.md#troubleshooting)
- Check [Common Issues](05_IMPLEMENTATION_GUIDE.md#common-issues)
- Reference [API Errors](03_API_REFERENCE.md#error-responses)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-06-28 | Added examples, improved all docs with sub-agent review |
| 1.0.0 | 2025-06-28 | Initial documentation |
