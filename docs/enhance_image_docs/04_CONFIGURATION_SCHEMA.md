# Configuration Schema Reference

This document provides the complete schema for the image enhancement configuration file.

## 1. Configuration File Location

The system looks for configuration in this order:

1. Custom path provided as parameter
2. `./enhancement-config.json` (current working directory)
3. Built-in default configuration

---

## 2. Quick Start

### 2.1 Minimal Configuration

The smallest valid configuration file:

```json
{
  "version": "1.0.0",
  "activePreset": "default",
  "globalSettings": {
    "analyzerModel": "gemini-2.5-flash",
    "enhancerModel": "gemini-2.5-flash-image",
    "outputFormat": "png",
    "maxConcurrentImages": 3,
    "saveAnalysisReport": true,
    "locale": "vi-VN"
  },
  "presets": {
    "default": {
      "name": "Default",
      "description": "Basic enhancement",
      "systemPrompt": {
        "analysis": "Analyze this image and describe its key elements.",
        "enhancement": "Enhance this image for marketing purposes."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": false,
        "colorEnhancement": "natural",
        "lightingStyle": "natural daylight"
      }
    }
  },
  "customPrompts": {
    "enabled": false,
    "analysisPrompt": "",
    "enhancementPrompt": ""
  }
}
```

### 2.2 Using JSON Schema Validation

Add the `$schema` property to enable IDE validation and autocompletion:

```json
{
  "$schema": "./enhancement-config.schema.json",
  "version": "1.0.0",
  ...
}
```

---

## 3. JSON Schema

The full JSON Schema is available at:

- **File**: [`mcp-server/enhancement-config.schema.json`](../../mcp-server/enhancement-config.schema.json)
- **Usage**: Copy to your config directory or reference via `$schema`

### 3.1 Schema Overview

```
EnhancementConfig (root)
├── version: string (required) - Semantic version "x.y.z"
├── activePreset: string (required) - Default preset name
├── globalSettings: GlobalSettings (required)
│   ├── analyzerModel: string (required)
│   ├── enhancerModel: string (required)
│   ├── outputFormat: "png" | "jpeg" (required)
│   ├── maxConcurrentImages: integer 1-10 (required)
│   ├── saveAnalysisReport: boolean (required)
│   ├── locale: string (required)
│   └── organizeByCategory: boolean (optional)
├── categories: Record<string, CategoryDefinition> (optional)
├── presets: Record<string, EnhancementPreset> (required, min 1)
└── customPrompts: CustomPrompts (required)
```

---

## 4. Configuration Sections

### 4.1 Global Settings

Controls system-wide behavior for image processing.

```json
{
  "globalSettings": {
    "analyzerModel": "gemini-2.5-flash",
    "enhancerModel": "gemini-2.5-flash-image",
    "outputFormat": "png",
    "maxConcurrentImages": 3,
    "saveAnalysisReport": true,
    "organizeByCategory": true,
    "locale": "vi-VN"
  }
}
```

| Field                 | Type    | Required | Default                  | Validation                             | Description                            |
| --------------------- | ------- | -------- | ------------------------ | -------------------------------------- | -------------------------------------- |
| `analyzerModel`       | string  | ✅       | `gemini-2.5-flash`       | Non-empty                              | Model for image analysis (text+vision) |
| `enhancerModel`       | string  | ✅       | `gemini-2.5-flash-image` | Non-empty                              | Model for image generation             |
| `outputFormat`        | string  | ✅       | `png`                    | `png` or `jpeg`                        | Output image format                    |
| `maxConcurrentImages` | integer | ✅       | 3                        | 1-10                                   | Concurrent batch processing limit      |
| `saveAnalysisReport`  | boolean | ✅       | true                     | -                                      | Save JSON analysis reports             |
| `organizeByCategory`  | boolean | ❌       | true                     | -                                      | Create category subfolders             |
| `locale`              | string  | ✅       | `vi-VN`                  | BCP 47 format (e.g., `vi-VN`, `en-US`) | Prompt language locale                 |

### 4.2 Categories

Defines categories for automatic image classification and folder organization.

```json
{
  "categories": {
    "beach": {
      "name": "Beach",
      "nameVi": "Bãi biển",
      "keywords": ["beach", "sand", "shore", "coast", "seaside"],
      "folderName": "bai-bien"
    }
  }
}
```

| Field        | Type     | Required | Validation                                             | Description                      |
| ------------ | -------- | -------- | ------------------------------------------------------ | -------------------------------- |
| `name`       | string   | ✅       | Min 1 char                                             | English display name             |
| `nameVi`     | string   | ✅       | Min 1 char                                             | Vietnamese display name          |
| `keywords`   | string[] | ✅       | Array of non-empty strings                             | Keywords for auto-classification |
| `folderName` | string   | ✅       | Lowercase alphanumeric + hyphens only (`^[a-z0-9-]+$`) | URL-safe output folder name      |

**Built-in Categories:**

| Key                  | Name                              | Folder         |
| -------------------- | --------------------------------- | -------------- |
| `landscape`          | Landscape / Phong cảnh            | `phong-canh`   |
| `portrait`           | Portrait / Chân dung              | `chan-dung`    |
| `restaurant`         | Restaurant / Nhà hàng             | `nha-hang`     |
| `hotel`              | Hotel / Khách sạn                 | `khach-san`    |
| `room`               | Room / Phòng nghỉ                 | `phong-nghi`   |
| `beach`              | Beach / Bãi biển                  | `bai-bien`     |
| `island`             | Island / Biển đảo                 | `bien-dao`     |
| `tourist-attraction` | Tourist Attraction / Điểm du lịch | `diem-du-lich` |
| `floating-house`     | Floating House / Nhà bè           | `nha-be`       |
| `seafood`            | Seafood / Hải sản                 | `hai-san`      |
| `food`               | Food / Ẩm thực                    | `am-thuc`      |
| `pool`               | Pool / Hồ bơi                     | `ho-boi`       |
| `activity`           | Activity / Hoạt động              | `hoat-dong`    |
| `transport`          | Transport / Phương tiện           | `phuong-tien`  |
| `event`              | Event / Sự kiện                   | `su-kien`      |
| `product`            | Product / Sản phẩm                | `san-pham`     |
| `other`              | Other / Khác                      | `khac`         |

### 4.3 Presets

Presets define how images are analyzed and enhanced for specific use cases.

```json
{
  "presets": {
    "tourism": {
      "name": "Tourism & Travel",
      "description": "Optimized for tourism marketing images",
      "systemPrompt": {
        "analysis": "Analyze this tourism image...",
        "enhancement": "Enhance for tourism marketing..."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Vietnamese/Asian",
        "peopleStyle": "tourists enjoying activities",
        "peopleTypes": ["family", "couples", "friends"],
        "colorEnhancement": "vivid tropical colors",
        "lightingStyle": "golden hour, natural sunlight"
      }
    }
  }
}
```

#### Preset Fields

| Field              | Type   | Required | Validation | Description                      |
| ------------------ | ------ | -------- | ---------- | -------------------------------- |
| `name`             | string | ✅       | Min 1 char | Display name                     |
| `description`      | string | ✅       | Min 1 char | Purpose description              |
| `systemPrompt`     | object | ✅       | See below  | Analysis and enhancement prompts |
| `enhancementRules` | object | ✅       | See below  | Enhancement behavior rules       |

#### System Prompts

| Field         | Type   | Required | Validation   | Description                                                          |
| ------------- | ------ | -------- | ------------ | -------------------------------------------------------------------- |
| `analysis`    | string | ✅       | Min 10 chars | Prompt for analyzing the original image (should request JSON output) |
| `enhancement` | string | ✅       | Min 10 chars | Prompt for generating enhanced version                               |

#### Enhancement Rules

| Field                | Type     | Required | Default | Description                                                        |
| -------------------- | -------- | -------- | ------- | ------------------------------------------------------------------ |
| `addPeopleIfEmpty`   | boolean  | ✅       | -       | Add people if scene is empty                                       |
| `peopleEthnicity`    | string   | ❌       | -       | Ethnicity of people to add (e.g., "Vietnamese", "Asian")           |
| `peopleStyle`        | string   | ❌       | -       | Style/mood of people (e.g., "tourists enjoying activities")        |
| `peopleTypes`        | string[] | ❌       | -       | Types of people groups (e.g., ["family", "couples"])               |
| `addHumanElements`   | boolean  | ❌       | false   | Add human elements (hands, partial figures) instead of full people |
| `humanElements`      | string[] | ❌       | -       | Specific human elements (e.g., ["hands with chopsticks"])          |
| `addModelIfRelevant` | boolean  | ❌       | false   | Add model for product photos                                       |
| `colorEnhancement`   | string   | ✅       | -       | Color improvement style                                            |
| `lightingStyle`      | string   | ✅       | -       | Lighting improvement style                                         |

### 4.4 Custom Prompts

Override preset prompts with custom ones.

```json
{
  "customPrompts": {
    "enabled": false,
    "analysisPrompt": "",
    "enhancementPrompt": ""
  }
}
```

| Field               | Type    | Required | Validation                | Description               |
| ------------------- | ------- | -------- | ------------------------- | ------------------------- |
| `enabled`           | boolean | ✅       | -                         | Enable custom prompts     |
| `analysisPrompt`    | string  | ✅\*     | Min 10 chars when enabled | Custom analysis prompt    |
| `enhancementPrompt` | string  | ✅\*     | Min 10 chars when enabled | Custom enhancement prompt |

> **Note:** When `enabled: true`, both prompt fields must have at least 10 characters.

---

## 5. Preset Examples by Business Type

### 5.1 Tourism & Travel

```json
{
  "presets": {
    "tourism": {
      "name": "Tourism & Travel",
      "description": "Optimized for tourism marketing",
      "systemPrompt": {
        "analysis": "Phân tích ảnh du lịch: điểm đến, hoạt động, thời điểm, đối tượng, điểm nổi bật.",
        "enhancement": "Tạo ảnh du lịch marketing: thêm du khách Việt Nam nếu trống, golden hour, màu sắc tropical."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Vietnamese/Asian",
        "peopleStyle": "tourists enjoying activities",
        "peopleTypes": [
          "family with children",
          "young couples",
          "group of friends"
        ],
        "colorEnhancement": "vivid tropical colors",
        "lightingStyle": "golden hour, natural sunlight"
      }
    }
  }
}
```

### 5.2 Restaurant & Food

```json
{
  "presets": {
    "restaurant": {
      "name": "Restaurant & Food",
      "description": "Optimized for food marketing",
      "systemPrompt": {
        "analysis": "Phân tích ảnh ẩm thực: món ăn, trình bày, màu sắc, không gian.",
        "enhancement": "Tạo ảnh food marketing: tăng độ tươi ngon, có thể thêm tay đang gắp."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": false,
        "addHumanElements": true,
        "humanElements": ["hands with chopsticks", "person enjoying food"],
        "peopleEthnicity": "Vietnamese/Asian",
        "colorEnhancement": "warm, appetizing colors",
        "lightingStyle": "soft diffused food photography"
      }
    }
  }
}
```

### 5.3 Hotel & Accommodation

```json
{
  "presets": {
    "hotel": {
      "name": "Hotel & Accommodation",
      "description": "Optimized for hotel marketing",
      "systemPrompt": {
        "analysis": "Phân tích ảnh khách sạn: loại phòng, tiện nghi, view, phong cách.",
        "enhancement": "Tạo ảnh khách sạn marketing: ấm cúng, sang trọng, có thể thêm khách thư giãn."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Vietnamese/Asian",
        "peopleStyle": "relaxed guests",
        "colorEnhancement": "warm, inviting tones",
        "lightingStyle": "natural window light"
      }
    }
  }
}
```

### 5.4 E-commerce & Product

```json
{
  "presets": {
    "ecommerce": {
      "name": "E-commerce & Product",
      "description": "Optimized for product photography",
      "systemPrompt": {
        "analysis": "Phân tích ảnh sản phẩm: loại, góc chụp, background, ánh sáng.",
        "enhancement": "Tạo ảnh sản phẩm e-commerce: nền sạch, studio light, màu chính xác."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": false,
        "addModelIfRelevant": true,
        "peopleEthnicity": "Vietnamese/Asian",
        "colorEnhancement": "accurate, true to product",
        "lightingStyle": "studio lighting, soft shadows"
      }
    }
  }
}
```

### 5.5 Real Estate

```json
{
  "presets": {
    "realestate": {
      "name": "Real Estate",
      "description": "Optimized for property listings",
      "systemPrompt": {
        "analysis": "Analyze this property image: room type, features, lighting, staging quality.",
        "enhancement": "Enhance for real estate listing: bright, spacious feel, declutter, add lifestyle elements."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": false,
        "colorEnhancement": "bright, airy, natural colors",
        "lightingStyle": "natural daylight, window light"
      }
    }
  }
}
```

### 5.6 Spa & Wellness

```json
{
  "presets": {
    "spa": {
      "name": "Spa & Wellness",
      "description": "Optimized for spa and wellness marketing",
      "systemPrompt": {
        "analysis": "Analyze spa/wellness image: treatment type, ambiance, relaxation elements.",
        "enhancement": "Enhance for spa marketing: serene, calming, luxurious atmosphere."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,
        "peopleEthnicity": "Asian",
        "peopleStyle": "relaxed, eyes closed, peaceful expression",
        "colorEnhancement": "soft, muted, calming tones",
        "lightingStyle": "soft ambient lighting, candle-lit feel"
      }
    }
  }
}
```

### 5.7 Fashion & Apparel

```json
{
  "presets": {
    "fashion": {
      "name": "Fashion & Apparel",
      "description": "Optimized for fashion e-commerce",
      "systemPrompt": {
        "analysis": "Analyze fashion image: garment type, style, fit, presentation.",
        "enhancement": "Enhance for fashion e-commerce: professional model shot, lifestyle context."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": false,
        "addModelIfRelevant": true,
        "peopleEthnicity": "Vietnamese/Asian",
        "peopleStyle": "professional model pose, confident expression",
        "colorEnhancement": "accurate fabric colors, slight contrast boost",
        "lightingStyle": "fashion studio lighting"
      }
    }
  }
}
```

---

## 6. TypeScript Interface Definitions

These interfaces are defined in [`mcp-server/src/types.ts`](../../mcp-server/src/types.ts):

```typescript
export type ImageCategory =
  | "landscape"
  | "portrait"
  | "restaurant"
  | "hotel"
  | "beach"
  | "island"
  | "tourist-attraction"
  | "floating-house"
  | "seafood"
  | "food"
  | "room"
  | "pool"
  | "activity"
  | "transport"
  | "event"
  | "product"
  | "other";

export interface CategoryDefinition {
  name: string;
  nameVi: string;
  keywords: string[];
  folderName: string;
}

export interface ImageClassification {
  category: ImageCategory;
  confidence: number;
  subcategory?: string;
  tags?: string[];
}

export interface EnhancementConfig {
  version: string;
  activePreset: string;
  globalSettings: {
    analyzerModel: string;
    enhancerModel: string;
    outputFormat: "png" | "jpeg";
    maxConcurrentImages: number;
    saveAnalysisReport: boolean;
    locale: string;
    organizeByCategory?: boolean;
  };
  categories?: Record<string, CategoryDefinition>;
  presets: Record<string, EnhancementPreset>;
  customPrompts: {
    enabled: boolean;
    analysisPrompt: string;
    enhancementPrompt: string;
  };
}

export interface EnhancementPreset {
  name: string;
  description: string;
  systemPrompt: {
    analysis: string;
    enhancement: string;
  };
  enhancementRules: EnhancementRules;
}

export interface EnhancementRules {
  addPeopleIfEmpty: boolean;
  peopleEthnicity?: string;
  peopleStyle?: string;
  peopleTypes?: string[];
  addHumanElements?: boolean;
  humanElements?: string[];
  addModelIfRelevant?: boolean;
  colorEnhancement: string;
  lightingStyle: string;
}
```

---

## 7. Environment Variable Overrides

Environment variables can override configuration values:

| Variable                    | Overrides                      | Description           |
| --------------------------- | ------------------------------ | --------------------- |
| `NANOBANANA_ANALYZER_MODEL` | `globalSettings.analyzerModel` | Analysis model        |
| `NANOBANANA_ENHANCER_MODEL` | `globalSettings.enhancerModel` | Enhancement model     |
| `OPENAI_API_BASE`           | -                              | Local proxy base URL  |
| `OPENAI_API_KEY`            | -                              | Local proxy API key   |
| `GEMINI_API_KEY`            | -                              | Direct Gemini API key |

---

## 8. Validation

### 8.1 Using JSON Schema

Validate your configuration with the provided JSON Schema:

```bash
# Using ajv-cli
npx ajv validate -s enhancement-config.schema.json -d enhancement-config.json

# Using jsonschema (Python)
pip install jsonschema
python -c "
import json
from jsonschema import validate
schema = json.load(open('enhancement-config.schema.json'))
config = json.load(open('enhancement-config.json'))
validate(config, schema)
print('Valid!')
"
```

### 8.2 Common Validation Errors

| Error                              | Cause                  | Fix                                              |
| ---------------------------------- | ---------------------- | ------------------------------------------------ |
| `version` must match pattern       | Invalid version format | Use semantic versioning: `"1.0.0"`               |
| `folderName` must match pattern    | Invalid folder name    | Use lowercase letters, numbers, and hyphens only |
| `locale` must match pattern        | Invalid locale format  | Use BCP 47 format: `"vi-VN"`, `"en-US"`          |
| `maxConcurrentImages` must be ≤ 10 | Value too high         | Use value between 1-10                           |
| Missing required property          | Required field missing | Add the missing field                            |

---

## 9. Migration Guide

### 9.1 From v0.x to v1.0.0

If upgrading from an earlier version:

1. **Add `version` field:**

   ```json
   "version": "1.0.0"
   ```

2. **Rename `outputDirectory` to use `organizeByCategory`:**

   ```json
   "organizeByCategory": true
   ```

3. **Update preset structure** (if using old format):

   ```json
   // Old format
   "presets": { "default": { "prompt": "..." } }

   // New format
   "presets": {
     "default": {
       "name": "Default",
       "description": "...",
       "systemPrompt": { "analysis": "...", "enhancement": "..." },
       "enhancementRules": { ... }
     }
   }
   ```

### 9.2 Future Migrations

When `version` changes:

- **Minor version** (1.x.0): New optional fields, backward compatible
- **Major version** (2.0.0): Breaking changes, migration required

---

## 10. Real-World Example: Hồng Nhàn Tourism

Complete configuration for a Vietnamese tourism business:

**File:** `hongnhan/enhancement-config.hongnhan.json`

See [`hongnhan/enhancement-config.hongnhan.json`](../../hongnhan/enhancement-config.hongnhan.json) for a complete real-world example with:

- Custom tourism preset for Bình Hưng island
- Seafood/restaurant preset
- Hotel preset

---

## Document History

| Version | Date       | Author          | Changes                                                                                    |
| ------- | ---------- | --------------- | ------------------------------------------------------------------------------------------ |
| 1.0.0   | 2025-06-28 | Nanobanana Team | Initial Schema                                                                             |
| 1.1.0   | 2025-12-28 | Nanobanana Team | Added JSON Schema file, validation rules, preset examples, minimal config, migration guide |
