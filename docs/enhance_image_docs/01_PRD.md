# AI Image Enhancement - Product Requirements Document (PRD)

## 1. Overview

### 1.1 Product Name

**AI Image Enhancement System**

### 1.2 Version

1.1.0

### 1.3 Summary

An AI-powered image enhancement system that automatically analyzes, classifies, and enhances images for marketing purposes. The system uses Google Gemini AI models to understand image content and generate improved versions with added human elements, better lighting, and vibrant colors.

---

## 2. Problem Statement

### 2.1 Current Challenges

- **Empty/lifeless images**: Marketing images often lack human presence, making them less engaging
- **Inconsistent quality**: Images from different sources have varying quality levels
- **Manual editing**: Professional photo editing is time-consuming and expensive
- **No standardization**: Images lack consistent style and categorization

### 2.2 Target Users

- Marketing teams
- Tourism businesses
- E-commerce platforms
- Hotel & restaurant owners
- Content creators
- Any business needing enhanced marketing visuals

---

## 3. Product Goals

### 3.1 Primary Goals

1. **Automatic Enhancement**: Transform ordinary images into marketing-ready visuals
2. **Smart Classification**: Categorize images by type (beach, hotel, food, etc.)
3. **Human Element Addition**: Add culturally-appropriate people to empty scenes
4. **Quality Improvement**: Enhance lighting, colors, and composition
5. **Batch Processing**: Handle multiple images efficiently

### 3.2 Success Metrics

- Image processing success rate > 95%
- Classification accuracy > 85%
- Processing time < 30 seconds per image
- User satisfaction score > 4/5

---

## 4. Core Features

### 4.1 Image Analysis (Phase 1)

| Feature                 | Description                                      | Priority | Acceptance Criteria                                           |
| ----------------------- | ------------------------------------------------ | -------- | ------------------------------------------------------------- |
| Content Detection       | Identify main subjects, context, and composition | P0       | Returns JSON with subject, context, colors, composition, mood |
| Quality Assessment      | Evaluate lighting, colors, and technical quality | P0       | Identifies strengths and improvements arrays                  |
| Classification          | Categorize into predefined categories            | P0       | Returns category with confidence score 0.0-1.0                |
| Improvement Suggestions | Generate enhancement recommendations             | P1       | Provides actionable improvement list                          |

**Edge Cases:**

- Image file not found → Return error with path
- Corrupted image → Return graceful error message
- No classification match → Default to "other" with confidence 0.5

### 4.2 Image Enhancement (Phase 2)

| Feature              | Description                                         | Priority | Acceptance Criteria                         |
| -------------------- | --------------------------------------------------- | -------- | ------------------------------------------- |
| People Addition      | Add culturally-appropriate people if scene is empty | P0       | People match configured ethnicity and style |
| Color Enhancement    | Improve vibrancy while maintaining natural look     | P0       | Colors enhanced per preset rules            |
| Lighting Improvement | Optimize lighting for marketing appeal              | P0       | Lighting style applied as configured        |
| Context Preservation | Maintain original scene while enhancing             | P0       | Main subject and composition preserved      |
| Human Elements       | Add partial human elements (hands, etc.)            | P1       | For food/product images per preset          |

**Edge Cases:**

- API returns no image data → Return error "No image data in enhancement response"
- Analysis fails → Return error and skip enhancement
- Local proxy not configured → Return "Direct API not supported" error

### 4.3 Organization & Output (Phase 3)

| Feature          | Description                          | Priority | Acceptance Criteria                                        |
| ---------------- | ------------------------------------ | -------- | ---------------------------------------------------------- |
| Category Folders | Organize output by image category    | P1       | Creates folders with Vietnamese names (e.g., `phong-canh`) |
| Analysis Reports | Save JSON analysis for each image    | P1       | Saves `{basename}_analysis.json` with timestamp            |
| Batch Processing | Process multiple images concurrently | P1       | Respects `maxConcurrentImages` setting                     |
| Recursive Search | Find images in subdirectories        | P1       | Scans all nested folders when enabled                      |
| Preview          | Auto-open enhanced images            | P2       | Opens with system default viewer                           |

**Edge Cases:**

- No images found in path → Return message with path searched
- Category folder exists → Reuse without error
- Mixed success/failure → Report counts for both

---

## 5. Image Categories

The system classifies images into these categories with Vietnamese folder names:

| Category ID          | English Name       | Vietnamese   | Folder Name    | Keywords                          |
| -------------------- | ------------------ | ------------ | -------------- | --------------------------------- |
| `landscape`          | Landscape          | Phong cảnh   | `phong-canh`   | scenery, nature, mountain, forest |
| `portrait`           | Portrait           | Chân dung    | `chan-dung`    | person, face, selfie, headshot    |
| `restaurant`         | Restaurant         | Nhà hàng     | `nha-hang`     | dining, table, menu, interior     |
| `hotel`              | Hotel              | Khách sạn    | `khach-san`    | hotel, lobby, reception           |
| `room`               | Room               | Phòng nghỉ   | `phong-nghi`   | bedroom, bathroom, suite          |
| `beach`              | Beach              | Bãi biển     | `bai-bien`     | beach, sand, shore, coast         |
| `island`             | Island             | Biển đảo     | `bien-dao`     | island, sea, ocean, coral         |
| `tourist-attraction` | Tourist Attraction | Điểm du lịch | `diem-du-lich` | landmark, monument, temple        |
| `floating-house`     | Floating House     | Nhà bè       | `nha-be`       | floating, raft, houseboat         |
| `seafood`            | Seafood            | Hải sản      | `hai-san`      | lobster, crab, shrimp, fish       |
| `food`               | Food               | Ẩm thực      | `am-thuc`      | food, dish, meal, cuisine         |
| `pool`               | Pool               | Hồ bơi       | `ho-boi`       | pool, swimming, resort            |
| `activity`           | Activity           | Hoạt động    | `hoat-dong`    | tour, snorkeling, diving, kayak   |
| `transport`          | Transport          | Phương tiện  | `phuong-tien`  | boat, car, bus, speedboat         |
| `event`              | Event              | Sự kiện      | `su-kien`      | party, wedding, festival          |
| `product`            | Product            | Sản phẩm     | `san-pham`     | product, item, merchandise        |
| `other`              | Other              | Khác         | `khac`         | (fallback category)               |

---

## 6. Enhancement Rules

### 6.1 People Addition Rules

| Rule               | Description                                    | Configurable   |
| ------------------ | ---------------------------------------------- | -------------- |
| `addPeopleIfEmpty` | Add people when scene is empty                 | Yes (boolean)  |
| `peopleEthnicity`  | Target ethnicity (default: Asian)              | Yes (string)   |
| `peopleStyle`      | Style description (e.g., "natural, authentic") | Yes (string)   |
| `peopleTypes`      | Allowed groups (families, couples, friends)    | Yes (string[]) |

### 6.2 Human Element Rules

| Rule                 | Description                     | Configurable   |
| -------------------- | ------------------------------- | -------------- |
| `addHumanElements`   | Add partial elements like hands | Yes (boolean)  |
| `humanElements`      | Specific elements to add        | Yes (string[]) |
| `addModelIfRelevant` | Add model for product photos    | Yes (boolean)  |

### 6.3 Visual Enhancement Rules

| Rule               | Description            | Options                                               |
| ------------------ | ---------------------- | ----------------------------------------------------- |
| `colorEnhancement` | Color processing style | "vibrant but natural", "warm, appetizing", "accurate" |
| `lightingStyle`    | Lighting preference    | "natural daylight", "golden hour", "studio lighting"  |

---

## 7. Preset System

### 7.1 Built-in Presets

| Preset       | Target           | Key Features                                              |
| ------------ | ---------------- | --------------------------------------------------------- |
| `default`    | General use      | Basic enhancement, Asian people if empty                  |
| `tourism`    | Travel marketing | Vietnamese tourists, tropical colors, golden hour         |
| `restaurant` | Food marketing   | Human elements (hands with chopsticks), appetizing colors |
| `hotel`      | Accommodation    | Relaxed guests, warm atmosphere, natural window light     |
| `ecommerce`  | Product photos   | Asian model if relevant, accurate colors, studio lighting |

### 7.2 Preset Structure

```typescript
interface EnhancementPreset {
  name: string;
  description: string;
  systemPrompt: {
    analysis: string; // Prompt for AI analysis
    enhancement: string; // Prompt for AI enhancement
  };
  enhancementRules: {
    addPeopleIfEmpty: boolean;
    peopleEthnicity?: string;
    peopleStyle?: string;
    peopleTypes?: string[];
    addHumanElements?: boolean;
    humanElements?: string[];
    addModelIfRelevant?: boolean;
    colorEnhancement: string;
    lightingStyle: string;
  };
}
```

### 7.3 Custom Prompts Override

Users can override preset prompts globally via:

```json
{
  "customPrompts": {
    "enabled": true,
    "analysisPrompt": "Your custom analysis prompt...",
    "enhancementPrompt": "Your custom enhancement prompt..."
  }
}
```

---

## 8. Technical Requirements

### 8.1 AI Models Required

| Purpose     | Model                    | Environment Variable Override |
| ----------- | ------------------------ | ----------------------------- |
| Analysis    | `gemini-2.5-flash`       | `NANOBANANA_ANALYZER_MODEL`   |
| Enhancement | `gemini-2.5-flash-image` | `NANOBANANA_ENHANCER_MODEL`   |

### 8.2 Input Requirements

| Requirement   | Specification                        |
| ------------- | ------------------------------------ |
| Formats       | PNG, JPEG, JPG, GIF, WebP, BMP       |
| Max size      | Recommended < 10MB                   |
| Resolution    | Any (model handles internally)       |
| Path handling | Absolute or relative paths supported |

### 8.3 Output Specifications

| Specification    | Details                                                  |
| ---------------- | -------------------------------------------------------- |
| Format           | PNG or JPEG (configurable via `outputFormat`)            |
| Naming           | `enhanced_{original_name}.{format}`                      |
| Organization     | By category folder if `organizeByCategory: true`         |
| Analysis reports | `{basename}_analysis.json` if `saveAnalysisReport: true` |

---

## 9. Configuration Schema

### 9.1 Global Settings

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

| Setting               | Type                | Default                  | Description                |
| --------------------- | ------------------- | ------------------------ | -------------------------- |
| `analyzerModel`       | string              | `gemini-2.5-flash`       | Model for image analysis   |
| `enhancerModel`       | string              | `gemini-2.5-flash-image` | Model for image generation |
| `outputFormat`        | `"png"` \| `"jpeg"` | `"png"`                  | Output image format        |
| `maxConcurrentImages` | number              | 3                        | Batch concurrency limit    |
| `saveAnalysisReport`  | boolean             | true                     | Save JSON analysis files   |
| `organizeByCategory`  | boolean             | true                     | Create category folders    |
| `locale`              | string              | `"vi-VN"`                | Localization setting       |

### 9.2 Category Definition

```json
{
  "categories": {
    "beach": {
      "name": "Beach",
      "nameVi": "Bãi biển",
      "keywords": ["beach", "sand", "shore", "coast"],
      "folderName": "bai-bien"
    }
  }
}
```

---

## 10. API Integration Points

### 10.1 Authentication

| Method      | Environment Variables                | Description                               |
| ----------- | ------------------------------------ | ----------------------------------------- |
| Local Proxy | `OPENAI_API_BASE`, `OPENAI_API_KEY`  | Recommended for enhanced features         |
| Direct API  | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Analysis only, enhancement requires proxy |

### 10.2 API Endpoints Used

```
# Analysis (Text generation with vision)
POST {baseUrl}/v1beta/models/{analyzerModel}:generateContent
Content-Type: application/json
Authorization: Bearer {apiKey}

# Enhancement (Image generation)
POST {baseUrl}/v1beta/models/{enhancerModel}:generateContent
Content-Type: application/json
Authorization: Bearer {apiKey}
```

### 10.3 Request/Response Types

**ImageEnhancementRequest:**

```typescript
interface ImageEnhancementRequest {
  inputPath: string; // File or directory path
  outputPath?: string; // Optional output directory
  preset?: string; // Preset name (default: "default")
  customAnalysisPrompt?: string;
  customEnhancementPrompt?: string;
  recursive?: boolean; // Scan subdirectories
  preview?: boolean; // Auto-open results
  noPreview?: boolean; // Disable preview
  analyzeOnly?: boolean; // Skip enhancement
}
```

**ImageEnhancementResponse:**

```typescript
interface ImageEnhancementResponse {
  success: boolean;
  message: string; // Summary message
  processedImages: ProcessedImage[];
  errors?: string[]; // List of errors
}

interface ProcessedImage {
  originalPath: string;
  enhancedPath?: string; // Path to enhanced image
  analysisPath?: string; // Path to analysis JSON
  analysis?: Record<string, unknown>;
  error?: string;
}
```

---

## 11. User Stories

### 11.1 Tourism Business Owner

> "As a tour operator, I want to enhance my destination photos with happy tourists so potential customers can visualize themselves enjoying the experience."

**Acceptance Criteria:**

- Use `tourism` preset
- Add Vietnamese/Asian tourists (families, couples, friends)
- Apply golden hour lighting and tropical colors

### 11.2 Restaurant Manager

> "As a restaurant owner, I want my food photos to look more appetizing and professional without hiring a photographer."

**Acceptance Criteria:**

- Use `restaurant` preset
- Add human elements (hands with chopsticks) instead of full people
- Apply warm, appetizing color enhancement

### 11.3 Hotel Marketing Team

> "As a hotel marketer, I want to add guests to empty room photos to make them feel more inviting and lived-in."

**Acceptance Criteria:**

- Use `hotel` preset
- Add relaxed guests enjoying amenities
- Apply warm tones with natural window lighting

### 11.4 E-commerce Seller

> "As an online seller, I want my product photos to have consistent quality and professional lighting."

**Acceptance Criteria:**

- Use `ecommerce` preset
- Optionally add Asian model using product
- Maintain accurate product colors

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Metric                  | Target                                 |
| ----------------------- | -------------------------------------- |
| Single image processing | < 30 seconds                           |
| Batch processing        | 3 concurrent images (configurable)     |
| API timeout             | 60 seconds per request                 |
| Image discovery         | Immediate for directories < 1000 files |

### 12.2 Reliability

| Requirement             | Implementation                                |
| ----------------------- | --------------------------------------------- |
| Graceful error handling | Try-catch with detailed error messages        |
| Fallback classification | Default to "other" category on failure        |
| Partial success         | Continue processing after individual failures |
| Config fallback         | Embedded default config if file not found     |

### 12.3 Security

| Requirement | Implementation                       |
| ----------- | ------------------------------------ |
| API keys    | Stored in environment variables only |
| Image data  | Not persisted beyond output files    |
| Transport   | HTTPS for all API communication      |

### 12.4 Platform Support

| Platform | Preview Command         |
| -------- | ----------------------- |
| macOS    | `open "{filePath}"`     |
| Windows  | `start "" "{filePath}"` |
| Linux    | `xdg-open "{filePath}"` |

---

## 13. Implementation Notes for Other Languages

### 13.1 Core Algorithm

```
1. DISCOVER images in inputPath (recursive if enabled)
2. FOR EACH batch of maxConcurrentImages:
   a. ANALYZE each image with vision model
   b. PARSE JSON response for classification
   c. IF not analyzeOnly:
      - BUILD enhancement prompt from analysis + preset rules
      - CALL image generation model with original image + prompt
      - SAVE to category folder
   d. IF saveAnalysisReport: SAVE analysis JSON
3. RETURN summary with success/failure counts
```

### 13.2 Key Implementation Details

- Image data is sent as base64 inline data in API requests
- Analysis prompt includes classification instructions appended dynamically
- Enhancement prompt is built from: base prompt + raw analysis + rules
- Category folder paths: `{outputDir}/{categoryDefinition.folderName}/`
- Filename format: `enhanced_{originalBasename}.{outputFormat}`

### 13.3 Required Dependencies

- HTTP client for API calls
- Base64 encoding for images
- JSON parsing
- File system operations
- Child process for preview (optional)

---

## 14. Future Enhancements (v2.0)

| Feature               | Description                            |
| --------------------- | -------------------------------------- |
| Video Enhancement     | Process video frames                   |
| Style Transfer        | Apply specific artistic styles         |
| A/B Testing           | Generate multiple versions for testing |
| Analytics Dashboard   | Track enhancement metrics              |
| Custom Model Training | Fine-tune for specific brands          |
| Direct API Support    | Full feature parity without proxy      |

---

## 15. Glossary

| Term               | Definition                                                         |
| ------------------ | ------------------------------------------------------------------ |
| **Enhancement**    | The process of improving an image using AI                         |
| **Classification** | Categorizing an image into predefined types                        |
| **Preset**         | A saved configuration for specific use cases                       |
| **Analysis**       | AI examination of image content and quality                        |
| **Golden Hour**    | Optimal natural lighting (sunrise/sunset)                          |
| **Local Proxy**    | Intermediate server for API access (required for image generation) |
| **Human Elements** | Partial human features like hands, not full people                 |

---

## Document History

| Version | Date       | Author          | Changes                                                                         |
| ------- | ---------- | --------------- | ------------------------------------------------------------------------------- |
| 1.0.0   | 2025-06-28 | Nanobanana Team | Initial PRD                                                                     |
| 1.1.0   | 2025-12-28 | Nanobanana Team | Added acceptance criteria, edge cases, integration points, implementation notes |
