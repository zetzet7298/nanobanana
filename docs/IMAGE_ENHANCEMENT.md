# Image Enhancement Feature - Hướng dẫn sử dụng

Tính năng AI Image Enhancement cho phép phân tích và cải thiện ảnh tự động, được thiết kế chung cho bất kỳ doanh nghiệp nào.

## 🚀 Quick Start

### 1. Phân tích ảnh (Analyze Only)

```bash
# Phân tích 1 ảnh
analyze_image --input /path/to/image.jpg

# Phân tích thư mục (recursive)
analyze_image --input /path/to/folder --recursive
```

### 2. Cải thiện ảnh (Full Enhancement)

```bash
# Cải thiện 1 ảnh
enhance_image --input /path/to/image.jpg

# Cải thiện thư mục với preset du lịch
enhance_image --input /path/to/folder --preset tourism --recursive
```

## ⚙️ Cấu hình

### Config File: `enhancement-config.json`

Đặt file này ở thư mục gốc project hoặc `mcp-server/`:

```json
{
  "activePreset": "tourism",
  "globalSettings": {
    "analyzerModel": "gemini-2.5-flash",
    "enhancerModel": "gemini-2.5-flash-image",
    "maxConcurrentImages": 3,
    "saveAnalysisReport": true
  }
}
```

### Các Preset có sẵn

| Preset       | Mô tả                                |
| ------------ | ------------------------------------ |
| `default`    | Enhancement chung cho mọi loại ảnh   |
| `tourism`    | Tối ưu cho ảnh du lịch, biển đảo     |
| `restaurant` | Tối ưu cho ảnh hải sản, ẩm thực      |
| `hotel`      | Tối ưu cho ảnh khách sạn, phòng nghỉ |
| `ecommerce`  | Tối ưu cho ảnh sản phẩm bán hàng     |

## 📋 MCP Tools

### `enhance_image`

Cải thiện ảnh với AI analysis + generation.

**Parameters:**

- `input` (required): Đường dẫn file hoặc thư mục
- `output`: Thư mục output (default: `nanobanana-output/`)
- `preset`: Preset để sử dụng
- `recursive`: Xử lý thư mục con
- `analyzeOnly`: Chỉ phân tích, không tạo ảnh mới
- `preview`: Tự động mở ảnh sau khi xong

### `analyze_image`

Chỉ phân tích ảnh và trả về JSON report.

**Parameters:**

- `input` (required): Đường dẫn file hoặc thư mục
- `preset`: Preset để sử dụng
- `recursive`: Xử lý thư mục con

### `list_enhancement_presets`

Liệt kê tất cả preset có sẵn.

## 🏢 Tạo Preset cho doanh nghiệp mới

### Bước 1: Copy template

```bash
cp mcp-server/enhancement-config.json my-business-config.json
```

### Bước 2: Thêm preset mới

```json
{
  "presets": {
    "my-business": {
      "name": "My Business Name",
      "description": "Mô tả ngắn",
      "systemPrompt": {
        "analysis": "Prompt phân tích ảnh...",
        "enhancement": "Prompt cải thiện ảnh..."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Vietnamese",
        "colorEnhancement": "warm colors",
        "lightingStyle": "natural"
      }
    }
  }
}
```

### Bước 3: Sử dụng

```bash
# Copy file config vào thư mục gốc
cp my-business-config.json enhancement-config.json

# Hoặc chỉ định preset
enhance_image --input ./images --preset my-business
```

## 📁 Ví dụ: Hồng Nhàn Tour

Xem file mẫu: `hongnhan/enhancement-config.hongnhan.json`

Các preset đã tạo sẵn:

- `hongnhan-tourism`: Ảnh du lịch Bình Hưng/Bình Tiên
- `hongnhan-seafood`: Ảnh hải sản, nhà hàng
- `hongnhan-hotel`: Ảnh khách sạn Hồng Nhàn 2, 3, 5

**Cách sử dụng:**

```bash
# Copy config Hồng Nhàn
cp hongnhan/enhancement-config.hongnhan.json enhancement-config.json

# Enhance ảnh du lịch
enhance_image --input ./hongnhan-images --preset hongnhan-tourism --recursive
```

## 🔄 Flow xử lý

```
Input Image(s)
      ↓
┌─────────────┐
│ Find Images │ (single file / directory / recursive)
└─────────────┘
      ↓
┌─────────────┐
│   Analyze   │ → Gemini 2.5 Flash (TEXT mode)
└─────────────┘
      ↓
 JSON Analysis Report (saved if enabled)
      ↓
┌─────────────────┐
│ Build Prompt    │ Analysis + Enhancement Rules + System Prompt
└─────────────────┘
      ↓
┌─────────────┐
│   Enhance   │ → Gemini 2.5 Flash Image (IMAGE mode)
└─────────────┘
      ↓
 Enhanced Image (saved to output folder)
```

## 🌍 Hỗ trợ đa ngôn ngữ

Config `locale` trong `globalSettings`:

- `vi-VN`: Prompts tiếng Việt (default)
- `en-US`: English prompts

## ⚡ Tips

1. **Batch processing**: Sử dụng `maxConcurrentImages` để điều chỉnh số ảnh xử lý đồng thời
2. **Save reports**: Bật `saveAnalysisReport` để lưu analysis JSON cho mỗi ảnh
3. **Custom prompts**: Bật `customPrompts.enabled` để override toàn bộ prompts
4. **Preview**: Dùng `--preview` để tự động mở ảnh sau khi enhance

## 🔧 Environment Variables

| Variable                    | Mô tả                                            |
| --------------------------- | ------------------------------------------------ |
| `OPENAI_API_BASE`           | URL của CLIProxy (e.g., `http://localhost:8317`) |
| `OPENAI_API_KEY`            | API key cho CLIProxy                             |
| `NANOBANANA_ANALYZER_MODEL` | Override model phân tích                         |
| `NANOBANANA_ENHANCER_MODEL` | Override model enhancement                       |
