# Implementation Guide

This guide provides step-by-step instructions for implementing the AI Image Enhancement system in any programming language.

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Environment Setup](#2-environment-setup)
3. [Step-by-Step Implementation](#3-step-by-step-implementation)
4. [Minimal Working Example](#4-minimal-working-example)
5. [Language-Specific Implementations](#5-language-specific-implementations)
6. [Unit Testing](#6-unit-testing)
7. [Logging and Debugging](#7-logging-and-debugging)
8. [Troubleshooting](#8-troubleshooting)
9. [Performance Optimization](#9-performance-optimization)

---

## 1. Quick Start

### 1.1 Prerequisites

- **API Access**: Gemini API key (via proxy or direct)
- **Runtime**: Node.js ≥18, Python ≥3.9, or Go ≥1.21
- **Libraries**:
  - Image processing (for base64 encoding/decoding)
  - HTTP client with async support
  - JSON parsing

### 1.2 Minimal Implementation Steps

1. Read image file and convert to base64
2. Call Gemini Flash API for analysis (with classification prompt)
3. Parse classification from JSON response
4. Build enhancement prompt with analysis results
5. Call Gemini Flash-Image API for enhancement
6. Save enhanced image to categorized folder

---

## 2. Environment Setup

### 2.1 Required Environment Variables

```bash
# Option 1: Direct Gemini API (for analysis only)
export GEMINI_API_KEY="your-gemini-api-key"

# Option 2: Proxy API (required for image enhancement)
export OPENAI_API_BASE="http://localhost:8080"  # Your proxy URL
export OPENAI_API_KEY="your-proxy-api-key"

# Optional: Model overrides
export NANOBANANA_ANALYZER_MODEL="gemini-2.5-flash"
export NANOBANANA_ENHANCER_MODEL="gemini-2.5-flash-image"
```

### 2.2 Node.js Setup

```bash
mkdir my-image-enhancer && cd my-image-enhancer
npm init -y
npm install typescript @types/node
npx tsc --init
```

**tsconfig.json** additions:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### 2.3 Python Setup

```bash
mkdir my-image-enhancer && cd my-image-enhancer
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: .\venv\Scripts\activate  # Windows

pip install requests aiohttp dataclasses-json
```

### 2.4 Go Setup

```bash
mkdir my-image-enhancer && cd my-image-enhancer
go mod init my-image-enhancer
```

---

## 3. Step-by-Step Implementation

### Step 1: Setup Configuration

Based on the actual [enhancement-config.json](../../mcp-server/enhancement-config.json):

```typescript
interface EnhancementConfig {
  version: string;
  activePreset: string;
  globalSettings: {
    analyzerModel: string; // e.g., 'gemini-2.5-flash'
    enhancerModel: string; // e.g., 'gemini-2.5-flash-image'
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

interface CategoryDefinition {
  name: string;
  nameVi: string;
  keywords: string[];
  folderName: string;
}

interface EnhancementPreset {
  name: string;
  description: string;
  systemPrompt: {
    analysis: string;
    enhancement: string;
  };
  enhancementRules: {
    addPeopleIfEmpty: boolean;
    peopleEthnicity?: string;
    peopleStyle?: string;
    peopleTypes?: string[];
    addHumanElements?: boolean;
    humanElements?: string[];
    colorEnhancement: string;
    lightingStyle: string;
  };
}
```

### Step 2: Image Input Handler

From [fileHandler.ts](../../mcp-server/src/fileHandler.ts):

```typescript
import * as fs from "fs";
import * as path from "path";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

async function readImageAsBase64(filePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  return buffer.toString("base64");
}

function getMimeType(
  filePath: string,
): "image/png" | "image/jpeg" | "image/gif" | "image/webp" {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function findImages(
  inputPath: string,
  recursive = false,
): Promise<string[]> {
  const images: string[] = [];
  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Path not found: ${absolutePath}`);
    return images;
  }

  const stats = fs.statSync(absolutePath);

  if (stats.isFile()) {
    const ext = path.extname(absolutePath).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      images.push(absolutePath);
    }
  } else if (stats.isDirectory()) {
    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath);
        }
      } else if (entry.isDirectory() && recursive) {
        const subImages = await findImages(fullPath, true);
        images.push(...subImages);
      }
    }
  }

  return images;
}
```

### Step 3: Build Analysis Prompt with Classification

From [imageAnalyzer.ts](../../mcp-server/src/imageAnalyzer.ts):

```typescript
function getClassificationPrompt(categories?: string[]): string {
  const defaultCategories = [
    "landscape",
    "portrait",
    "restaurant",
    "hotel",
    "room",
    "beach",
    "island",
    "tourist-attraction",
    "floating-house",
    "seafood",
    "food",
    "pool",
    "activity",
    "transport",
    "event",
    "product",
    "other",
  ];

  const categoryList = categories || defaultCategories;

  return `
QUAN TRỌNG: Ngoài việc phân tích, bạn PHẢI phân loại ảnh này vào MỘT trong các category sau:
${categoryList.map((c) => `- ${c}`).join("\n")}

Thêm vào JSON response:
"classification": {
  "category": "<category_name>",
  "confidence": <0.0-1.0>,
  "subcategory": "<optional: chi tiết hơn>",
  "tags": ["tag1", "tag2", ...]
}

Chọn category phù hợp nhất dựa trên nội dung chính của ảnh.
`;
}

function buildAnalysisPrompt(
  presetPrompt: string,
  categories?: string[],
): string {
  const classificationPrompt = getClassificationPrompt(categories);
  return `${presetPrompt}\n\n${classificationPrompt}`;
}
```

### Step 4: Call Analysis API

```typescript
interface ImageAnalysisResult {
  success: boolean;
  imagePath: string;
  analysis?: Record<string, unknown>;
  rawAnalysis?: string;
  classification?: {
    category: string;
    confidence: number;
    subcategory?: string;
    tags?: string[];
  };
  error?: string;
}

async function analyzeImage(
  imagePath: string,
  prompt: string,
  config: { baseUrl: string; apiKey: string; model: string },
): Promise<ImageAnalysisResult> {
  const imageBase64 = await readImageAsBase64(imagePath);
  const mimeType = getMimeType(imagePath);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT"],
    },
  };

  const response = await fetch(
    `${config.baseUrl}/v1beta/models/${config.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error: ${response.status} - ${errorText}`);
    return {
      success: false,
      imagePath,
      error: `API error: ${response.status}`,
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return { success: false, imagePath, error: "No text response from API" };
  }

  // Parse JSON from response
  let parsedAnalysis: Record<string, unknown> | undefined;
  let classification = { category: "other", confidence: 0.5 };

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      parsedAnalysis = JSON.parse(jsonMatch[0]);
      if (parsedAnalysis?.classification) {
        const cls = parsedAnalysis.classification as Record<string, unknown>;
        classification = {
          category: String(cls.category || "other"),
          confidence: typeof cls.confidence === "number" ? cls.confidence : 0.8,
          subcategory: cls.subcategory as string | undefined,
          tags: cls.tags as string[] | undefined,
        };
      }
    } catch {
      console.error("Failed to parse analysis JSON, using raw text");
    }
  }

  console.error(
    `Image classified as: ${classification.category} (confidence: ${classification.confidence})`,
  );

  return {
    success: true,
    imagePath,
    analysis: parsedAnalysis,
    rawAnalysis: text,
    classification,
  };
}
```

### Step 5: Build Enhancement Prompt

From [imageEnhancer.ts](../../mcp-server/src/imageEnhancer.ts):

```typescript
function buildEnhancementPrompt(
  analysis: ImageAnalysisResult,
  preset: EnhancementPreset,
  customPrompt?: string,
): string {
  const basePrompt = customPrompt || preset.systemPrompt.enhancement;
  const rules = preset.enhancementRules;

  let prompt = `${basePrompt}\n\n`;

  prompt += `## Phân tích ảnh gốc:\n`;
  if (analysis.rawAnalysis) {
    prompt += `${analysis.rawAnalysis}\n\n`;
  }

  prompt += `## Quy tắc áp dụng:\n`;
  if (rules.addPeopleIfEmpty) {
    prompt += `- Nếu ảnh không có người hoặc vắng vẻ, hãy thêm người ${rules.peopleEthnicity || "châu Á"}\n`;
    if (rules.peopleStyle) {
      prompt += `- Phong cách người: ${rules.peopleStyle}\n`;
    }
    if (rules.peopleTypes && rules.peopleTypes.length > 0) {
      prompt += `- Các loại người phù hợp: ${rules.peopleTypes.join(", ")}\n`;
    }
  }

  if (rules.addHumanElements && rules.humanElements) {
    prompt += `- Thêm yếu tố con người: ${rules.humanElements.join(", ")}\n`;
  }

  prompt += `- Cải thiện màu sắc: ${rules.colorEnhancement}\n`;
  prompt += `- Ánh sáng: ${rules.lightingStyle}\n`;

  prompt += `\nHãy tạo phiên bản cải thiện của ảnh gốc dựa trên các quy tắc trên. Giữ nguyên bố cục và chủ thể chính nhưng làm ảnh hấp dẫn hơn cho mục đích marketing.`;

  return prompt;
}
```

### Step 6: Call Enhancement API

```typescript
async function enhanceImage(
  imagePath: string,
  prompt: string,
  config: { baseUrl: string; apiKey: string; model: string },
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  const imageBase64 = await readImageAsBase64(imagePath);
  const mimeType = getMimeType(imagePath);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"], // CRITICAL: Must include IMAGE
    },
  };

  const response = await fetch(
    `${config.baseUrl}/v1beta/models/${config.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Enhancement API error: ${response.status} - ${errorText}`);
    return { success: false, error: `API error: ${response.status}` };
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { data: string; mimeType: string };
          inline_data?: { data: string; mime_type: string };
        }>;
      };
    }>;
  };

  // Extract image from response - handle both camelCase and snake_case
  for (const part of data.candidates?.[0]?.content?.parts || []) {
    const imageData = part.inlineData?.data || part.inline_data?.data;
    if (imageData) {
      return { success: true, imageData };
    }
  }

  return { success: false, error: "No image data in enhancement response" };
}
```

### Step 7: Save Output with Category Organization

```typescript
async function saveEnhancedImage(
  imageData: string,
  originalPath: string,
  category: string,
  config: {
    outputDir: string;
    organizeByCategory: boolean;
    categories?: Record<string, { folderName: string }>;
    outputFormat: "png" | "jpeg";
  },
): Promise<string> {
  let outputDir = config.outputDir;

  // Add category subfolder if enabled
  if (config.organizeByCategory) {
    const categoryDef = config.categories?.[category];
    const folderName = categoryDef?.folderName || category;
    outputDir = path.join(outputDir, folderName);
  }

  // Create directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.error(`Created category folder: ${outputDir}`);
  }

  // Generate filename
  const baseName = path.basename(originalPath, path.extname(originalPath));
  const ext = config.outputFormat;
  const filename = `enhanced_${baseName}.${ext}`;
  const fullPath = path.join(outputDir, filename);

  // Save image
  const buffer = Buffer.from(imageData, "base64");
  await fs.promises.writeFile(fullPath, buffer);

  console.error(`Enhanced image saved to: ${fullPath} (category: ${category})`);
  return fullPath;
}
```

---

## 4. Minimal Working Example

### 4.1 TypeScript Standalone Example

Save as `enhance-single.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

// Configuration
const CONFIG = {
  baseUrl:
    process.env.OPENAI_API_BASE || "https://generativelanguage.googleapis.com",
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "",
  analyzerModel: "gemini-2.5-flash",
  enhancerModel: "gemini-2.5-flash-image",
  outputDir: "./enhanced-output",
};

if (!CONFIG.apiKey) {
  console.error(
    "ERROR: Set OPENAI_API_KEY or GEMINI_API_KEY environment variable",
  );
  process.exit(1);
}

async function readImageAsBase64(filePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  return buffer.toString("base64");
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext] || "image/jpeg";
}

async function callGeminiAPI(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  model: string,
  responseModalities: string[],
): Promise<{ text?: string; imageData?: string; error?: string }> {
  const response = await fetch(
    `${CONFIG.baseUrl}/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: { responseModalities },
      }),
    },
  );

  if (!response.ok) {
    return {
      error: `API error: ${response.status} - ${await response.text()}`,
    };
  }

  const data = (await response.json()) as any;
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.text) return { text: part.text };
    if (part.inlineData?.data) return { imageData: part.inlineData.data };
    if (part.inline_data?.data) return { imageData: part.inline_data.data };
  }

  return { error: "No content in response" };
}

async function enhanceImage(imagePath: string): Promise<void> {
  console.log(`\n🔍 Processing: ${imagePath}`);

  if (!fs.existsSync(imagePath)) {
    console.error(`ERROR: File not found: ${imagePath}`);
    return;
  }

  const imageBase64 = await readImageAsBase64(imagePath);
  const mimeType = getMimeType(imagePath);

  // Step 1: Analyze
  console.log("📊 Analyzing image...");
  const analysisPrompt = `Analyze this image. Return JSON with:
{
  "description": "what's in the image",
  "classification": { "category": "one of: landscape|portrait|restaurant|hotel|beach|food|other", "confidence": 0.9 },
  "improvements": ["suggestion1", "suggestion2"]
}`;

  const analysisResult = await callGeminiAPI(
    imageBase64,
    mimeType,
    analysisPrompt,
    CONFIG.analyzerModel,
    ["TEXT"],
  );

  if (analysisResult.error) {
    console.error(`Analysis failed: ${analysisResult.error}`);
    return;
  }

  console.log("✅ Analysis complete");

  // Parse category
  let category = "other";
  try {
    const jsonMatch = analysisResult.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      category = parsed.classification?.category || "other";
    }
  } catch {
    /* use default */
  }

  console.log(`📁 Category: ${category}`);

  // Step 2: Enhance
  console.log("🎨 Enhancing image...");
  const enhancementPrompt = `Based on this analysis:
${analysisResult.text}

Enhance this image:
- Improve lighting and colors for marketing
- Add Asian people if the scene is empty
- Keep the main subject and composition
- Make it visually appealing for social media`;

  const enhanceResult = await callGeminiAPI(
    imageBase64,
    mimeType,
    enhancementPrompt,
    CONFIG.enhancerModel,
    ["TEXT", "IMAGE"],
  );

  if (enhanceResult.error || !enhanceResult.imageData) {
    console.error(
      `Enhancement failed: ${enhanceResult.error || "No image returned"}`,
    );
    return;
  }

  // Step 3: Save
  const outputDir = path.join(CONFIG.outputDir, category);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(imagePath, path.extname(imagePath));
  const outputPath = path.join(outputDir, `enhanced_${baseName}.png`);

  await fs.promises.writeFile(
    outputPath,
    Buffer.from(enhanceResult.imageData, "base64"),
  );
  console.log(`✅ Saved: ${outputPath}`);
}

// Main
const imagePath = process.argv[2];
if (!imagePath) {
  console.log("Usage: npx ts-node enhance-single.ts <image-path>");
  console.log("Example: npx ts-node enhance-single.ts ./beach.jpg");
  process.exit(1);
}

enhanceImage(imagePath).catch(console.error);
```

**Run it:**

```bash
export OPENAI_API_BASE="http://localhost:8080"
export OPENAI_API_KEY="your-key"
npx ts-node enhance-single.ts ./my-image.jpg
```

---

## 5. Language-Specific Implementations

### 5.1 Python Implementation (Production-Ready)

```python
#!/usr/bin/env python3
"""
AI Image Enhancer - Production-ready Python implementation.

Usage:
    python image_enhancer.py <input_path> [--recursive] [--preset tourism]

Environment:
    OPENAI_API_BASE: Proxy URL (e.g., http://localhost:8080)
    OPENAI_API_KEY: API key for proxy

    OR

    GEMINI_API_KEY: Direct Gemini API key (analysis only)
"""

import os
import sys
import json
import base64
import logging
import re
from pathlib import Path
from typing import Optional, Any
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import time

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ImageClassification:
    """Classification result for an image."""
    category: str
    confidence: float
    subcategory: Optional[str] = None
    tags: list[str] = field(default_factory=list)


@dataclass
class ProcessedImage:
    """Result of processing a single image."""
    original_path: str
    enhanced_path: Optional[str] = None
    category: Optional[str] = None
    analysis: Optional[dict] = None
    error: Optional[str] = None
    processing_time: float = 0.0


class ImageEnhancer:
    """Production-ready image enhancement using Gemini API."""

    VALID_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}

    MIME_TYPES = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    }

    DEFAULT_CATEGORIES = [
        'landscape', 'portrait', 'restaurant', 'hotel', 'room', 'beach',
        'island', 'tourist-attraction', 'floating-house', 'seafood',
        'food', 'pool', 'activity', 'transport', 'event', 'product', 'other'
    ]

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        analyzer_model: str = 'gemini-2.5-flash',
        enhancer_model: str = 'gemini-2.5-flash-image',
        output_dir: str = './enhanced-output',
        output_format: str = 'png',
        organize_by_category: bool = True,
        max_concurrent: int = 3,
        timeout: int = 120,
    ):
        self.base_url = base_url or os.environ.get(
            'OPENAI_API_BASE', 'https://generativelanguage.googleapis.com'
        )
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY') or os.environ.get('GEMINI_API_KEY')

        if not self.api_key:
            raise ValueError("API key required: set OPENAI_API_KEY or GEMINI_API_KEY")

        self.analyzer_model = os.environ.get('NANOBANANA_ANALYZER_MODEL', analyzer_model)
        self.enhancer_model = os.environ.get('NANOBANANA_ENHANCER_MODEL', enhancer_model)
        self.output_dir = Path(output_dir)
        self.output_format = output_format
        self.organize_by_category = organize_by_category
        self.max_concurrent = max_concurrent
        self.timeout = timeout

        # Category folder mappings (Vietnamese names)
        self.category_folders = {
            'landscape': 'phong-canh',
            'portrait': 'chan-dung',
            'restaurant': 'nha-hang',
            'hotel': 'khach-san',
            'room': 'phong-nghi',
            'beach': 'bai-bien',
            'island': 'bien-dao',
            'tourist-attraction': 'diem-du-lich',
            'floating-house': 'nha-be',
            'seafood': 'hai-san',
            'food': 'am-thuc',
            'pool': 'ho-boi',
            'activity': 'hoat-dong',
            'transport': 'phuong-tien',
            'event': 'su-kien',
            'product': 'san-pham',
            'other': 'khac',
        }

        # Setup requests session with retry logic
        self.session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=['POST', 'GET']
        )
        self.session.mount('http://', HTTPAdapter(max_retries=retries))
        self.session.mount('https://', HTTPAdapter(max_retries=retries))

        logger.info(f"ImageEnhancer initialized: base_url={self.base_url}, analyzer={self.analyzer_model}")

    def _read_image_base64(self, path: Path) -> str:
        """Read image file and return base64 encoded string."""
        with open(path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')

    def _get_mime_type(self, path: Path) -> str:
        """Get MIME type for image file."""
        return self.MIME_TYPES.get(path.suffix.lower(), 'image/jpeg')

    def find_images(self, input_path: str, recursive: bool = False) -> list[Path]:
        """Find all valid image files in path."""
        images = []
        path = Path(input_path)

        if not path.exists():
            logger.warning(f"Path not found: {path}")
            return images

        if path.is_file():
            if path.suffix.lower() in self.VALID_EXTENSIONS:
                images.append(path)
        elif path.is_dir():
            pattern = '**/*' if recursive else '*'
            for p in path.glob(pattern):
                if p.is_file() and p.suffix.lower() in self.VALID_EXTENSIONS:
                    images.append(p)

        logger.info(f"Found {len(images)} images in {path}")
        return images

    def _call_api(
        self,
        image_base64: str,
        mime_type: str,
        prompt: str,
        model: str,
        response_modalities: list[str],
    ) -> dict[str, Any]:
        """Call Gemini API with proper error handling."""
        url = f"{self.base_url}/v1beta/models/{model}:generateContent"

        request_body = {
            'contents': [{
                'role': 'user',
                'parts': [
                    {'text': prompt},
                    {'inline_data': {'mime_type': mime_type, 'data': image_base64}}
                ]
            }],
            'generationConfig': {
                'responseModalities': response_modalities
            }
        }

        try:
            response = self.session.post(
                url,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                json=request_body,
                timeout=self.timeout
            )

            if response.status_code == 429:
                logger.warning("Rate limited, waiting 60 seconds...")
                time.sleep(60)
                return self._call_api(image_base64, mime_type, prompt, model, response_modalities)

            if not response.ok:
                return {'error': f'API error {response.status_code}: {response.text[:200]}'}

            data = response.json()
            parts = data.get('candidates', [{}])[0].get('content', {}).get('parts', [])

            result = {}
            for part in parts:
                if 'text' in part:
                    result['text'] = part['text']
                if 'inlineData' in part:
                    result['image_data'] = part['inlineData']['data']
                if 'inline_data' in part:
                    result['image_data'] = part['inline_data']['data']

            return result

        except requests.exceptions.Timeout:
            return {'error': 'Request timeout'}
        except requests.exceptions.RequestException as e:
            return {'error': f'Request failed: {str(e)}'}

    def _build_analysis_prompt(self, preset: str = 'default') -> str:
        """Build analysis prompt with classification."""
        base_prompt = """Bạn là chuyên gia phân tích hình ảnh. Hãy mô tả chi tiết:
1. CHỦ THỂ CHÍNH: Người, vật, cảnh vật chính trong ảnh
2. BỐI CẢNH: Địa điểm, thời gian, không gian
3. MÀU SẮC & ÁNH SÁNG: Tone màu, nguồn sáng, độ tương phản
4. COMPOSITION: Bố cục, góc chụp, điểm nhấn
5. CẢM XÚC: Mood, atmosphere của ảnh
6. ĐÁNH GIÁ: Điểm mạnh và điểm cần cải thiện"""

        classification_prompt = f"""

QUAN TRỌNG: Bạn PHẢI phân loại ảnh vào MỘT trong các category sau:
{chr(10).join(f'- {c}' for c in self.DEFAULT_CATEGORIES)}

Trả về JSON với format:
{{
  "subject": "",
  "context": "",
  "colors": "",
  "composition": "",
  "mood": "",
  "strengths": [],
  "improvements": [],
  "classification": {{
    "category": "<category_name>",
    "confidence": <0.0-1.0>,
    "subcategory": "<optional>",
    "tags": ["tag1", "tag2"]
  }}
}}"""

        return base_prompt + classification_prompt

    def _build_enhancement_prompt(self, analysis_text: str, preset: str = 'default') -> str:
        """Build enhancement prompt based on analysis."""
        return f"""Dựa trên phân tích ảnh gốc:
{analysis_text}

Hãy tạo phiên bản cải thiện với các yêu cầu:
- Giữ nguyên chủ thể chính và bối cảnh
- Cải thiện ánh sáng và màu sắc cho sinh động hơn
- Nếu ảnh trống/vắng người, thêm người Việt Nam/châu Á phù hợp với bối cảnh
- Người phải tự nhiên, authentic, thể hiện niềm vui
- Tăng tính hấp dẫn thị giác cho mục đích marketing"""

    def _parse_classification(self, text: str) -> ImageClassification:
        """Parse classification from analysis text."""
        try:
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                data = json.loads(json_match.group())
                cls = data.get('classification', {})
                return ImageClassification(
                    category=cls.get('category', 'other'),
                    confidence=cls.get('confidence', 0.5),
                    subcategory=cls.get('subcategory'),
                    tags=cls.get('tags', [])
                )
        except (json.JSONDecodeError, KeyError):
            pass

        # Fallback: try regex
        category_match = re.search(r'"category"\s*:\s*"([^"]+)"', text, re.IGNORECASE)
        if category_match:
            return ImageClassification(
                category=category_match.group(1),
                confidence=0.5
            )

        return ImageClassification(category='other', confidence=0.5)

    def _save_enhanced_image(
        self,
        image_data: str,
        original_path: Path,
        category: str
    ) -> Path:
        """Save enhanced image to categorized folder."""
        if self.organize_by_category:
            folder = self.category_folders.get(category, category)
            output_dir = self.output_dir / folder
        else:
            output_dir = self.output_dir

        output_dir.mkdir(parents=True, exist_ok=True)

        filename = f"enhanced_{original_path.stem}.{self.output_format}"
        output_path = output_dir / filename

        # Handle duplicates
        counter = 1
        while output_path.exists():
            filename = f"enhanced_{original_path.stem}_{counter}.{self.output_format}"
            output_path = output_dir / filename
            counter += 1

        image_bytes = base64.b64decode(image_data)
        output_path.write_bytes(image_bytes)

        return output_path

    def process_image(self, image_path: Path, preset: str = 'default') -> ProcessedImage:
        """Process a single image: analyze and enhance."""
        start_time = time.time()
        result = ProcessedImage(original_path=str(image_path))

        try:
            logger.info(f"Processing: {image_path}")

            if not image_path.exists():
                result.error = f"File not found: {image_path}"
                return result

            image_base64 = self._read_image_base64(image_path)
            mime_type = self._get_mime_type(image_path)

            # Step 1: Analyze
            analysis_prompt = self._build_analysis_prompt(preset)
            analysis_result = self._call_api(
                image_base64, mime_type, analysis_prompt,
                self.analyzer_model, ['TEXT']
            )

            if 'error' in analysis_result:
                result.error = f"Analysis failed: {analysis_result['error']}"
                return result

            analysis_text = analysis_result.get('text', '')
            classification = self._parse_classification(analysis_text)
            result.category = classification.category

            logger.info(f"Classified as: {classification.category} ({classification.confidence:.2f})")

            # Parse analysis JSON for storage
            try:
                json_match = re.search(r'\{[\s\S]*\}', analysis_text)
                if json_match:
                    result.analysis = json.loads(json_match.group())
            except json.JSONDecodeError:
                result.analysis = {'raw': analysis_text}

            # Step 2: Enhance
            enhancement_prompt = self._build_enhancement_prompt(analysis_text, preset)
            enhance_result = self._call_api(
                image_base64, mime_type, enhancement_prompt,
                self.enhancer_model, ['TEXT', 'IMAGE']
            )

            if 'error' in enhance_result:
                result.error = f"Enhancement failed: {enhance_result['error']}"
                return result

            if 'image_data' not in enhance_result:
                result.error = "No image data in enhancement response"
                return result

            # Step 3: Save
            output_path = self._save_enhanced_image(
                enhance_result['image_data'],
                image_path,
                classification.category
            )
            result.enhanced_path = str(output_path)
            logger.info(f"Saved: {output_path}")

        except Exception as e:
            logger.exception(f"Error processing {image_path}")
            result.error = str(e)

        result.processing_time = time.time() - start_time
        return result

    def process_images(
        self,
        input_path: str,
        recursive: bool = False,
        preset: str = 'default'
    ) -> list[ProcessedImage]:
        """Process multiple images with concurrency."""
        images = self.find_images(input_path, recursive)

        if not images:
            logger.warning(f"No images found in: {input_path}")
            return []

        results = []

        with ThreadPoolExecutor(max_workers=self.max_concurrent) as executor:
            futures = {
                executor.submit(self.process_image, img, preset): img
                for img in images
            }

            for i, future in enumerate(as_completed(futures), 1):
                try:
                    result = future.result()
                    results.append(result)
                    status = "✓" if not result.error else "✗"
                    logger.info(f"[{i}/{len(images)}] {status} {futures[future]}")
                except Exception as e:
                    img = futures[future]
                    results.append(ProcessedImage(original_path=str(img), error=str(e)))
                    logger.error(f"[{i}/{len(images)}] ✗ {img}: {e}")

        # Summary
        success = sum(1 for r in results if not r.error)
        failed = len(results) - success
        logger.info(f"Completed: {success} successful, {failed} failed")

        return results


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description='AI Image Enhancer')
    parser.add_argument('input', help='Image file or directory')
    parser.add_argument('--recursive', '-r', action='store_true', help='Process subdirectories')
    parser.add_argument('--preset', '-p', default='default', help='Enhancement preset')
    parser.add_argument('--output', '-o', default='./enhanced-output', help='Output directory')
    parser.add_argument('--concurrent', '-c', type=int, default=3, help='Max concurrent requests')

    args = parser.parse_args()

    try:
        enhancer = ImageEnhancer(
            output_dir=args.output,
            max_concurrent=args.concurrent
        )

        results = enhancer.process_images(
            args.input,
            recursive=args.recursive,
            preset=args.preset
        )

        # Print results
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)

        for r in results:
            if r.error:
                print(f"✗ {r.original_path}: {r.error}")
            else:
                print(f"✓ {r.original_path} -> {r.enhanced_path} ({r.processing_time:.1f}s)")

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
```

### 5.2 Go Implementation

```go
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Config holds enhancer configuration
type Config struct {
	BaseURL       string
	APIKey        string
	AnalyzerModel string
	EnhancerModel string
	OutputDir     string
	OutputFormat  string
	MaxConcurrent int
	Timeout       time.Duration
}

// Classification represents image category
type Classification struct {
	Category    string   `json:"category"`
	Confidence  float64  `json:"confidence"`
	Subcategory string   `json:"subcategory,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

// ProcessedImage represents result of processing
type ProcessedImage struct {
	OriginalPath  string
	EnhancedPath  string
	Category      string
	Error         error
	ProcessingTime time.Duration
}

// ImageEnhancer handles AI image enhancement
type ImageEnhancer struct {
	config     Config
	client     *http.Client
	categories map[string]string
}

// NewImageEnhancer creates a new enhancer instance
func NewImageEnhancer(config Config) *ImageEnhancer {
	if config.BaseURL == "" {
		config.BaseURL = os.Getenv("OPENAI_API_BASE")
		if config.BaseURL == "" {
			config.BaseURL = "https://generativelanguage.googleapis.com"
		}
	}
	if config.APIKey == "" {
		config.APIKey = os.Getenv("OPENAI_API_KEY")
		if config.APIKey == "" {
			config.APIKey = os.Getenv("GEMINI_API_KEY")
		}
	}
	if config.AnalyzerModel == "" {
		config.AnalyzerModel = "gemini-2.5-flash"
	}
	if config.EnhancerModel == "" {
		config.EnhancerModel = "gemini-2.5-flash-image"
	}
	if config.OutputDir == "" {
		config.OutputDir = "./enhanced-output"
	}
	if config.OutputFormat == "" {
		config.OutputFormat = "png"
	}
	if config.MaxConcurrent == 0 {
		config.MaxConcurrent = 3
	}
	if config.Timeout == 0 {
		config.Timeout = 120 * time.Second
	}

	return &ImageEnhancer{
		config: config,
		client: &http.Client{Timeout: config.Timeout},
		categories: map[string]string{
			"landscape":          "phong-canh",
			"portrait":           "chan-dung",
			"restaurant":         "nha-hang",
			"hotel":              "khach-san",
			"beach":              "bai-bien",
			"food":               "am-thuc",
			"other":              "khac",
		},
	}
}

// ValidExtensions returns valid image extensions
var ValidExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true,
	".gif": true, ".webp": true, ".bmp": true,
}

// getMimeType returns MIME type for file extension
func getMimeType(path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	types := map[string]string{
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".webp": "image/webp",
	}
	if mt, ok := types[ext]; ok {
		return mt
	}
	return "image/jpeg"
}

// readImageBase64 reads an image file and returns base64 encoded string
func readImageBase64(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// FindImages finds all image files in path
func (e *ImageEnhancer) FindImages(inputPath string, recursive bool) ([]string, error) {
	var images []string

	info, err := os.Stat(inputPath)
	if err != nil {
		return nil, err
	}

	if info.IsDir() {
		err = filepath.Walk(inputPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if !info.IsDir() {
				ext := strings.ToLower(filepath.Ext(path))
				if ValidExtensions[ext] {
					images = append(images, path)
				}
			} else if !recursive && path != inputPath {
				return filepath.SkipDir
			}
			return nil
		})
	} else {
		ext := strings.ToLower(filepath.Ext(inputPath))
		if ValidExtensions[ext] {
			images = append(images, inputPath)
		}
	}

	return images, err
}

// APIRequest represents Gemini API request
type APIRequest struct {
	Contents         []Content        `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig"`
}

// Content represents message content
type Content struct {
	Role  string `json:"role"`
	Parts []Part `json:"parts"`
}

// Part represents content part
type Part struct {
	Text       string      `json:"text,omitempty"`
	InlineData *InlineData `json:"inline_data,omitempty"`
}

// InlineData represents inline image data
type InlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

// GenerationConfig represents generation settings
type GenerationConfig struct {
	ResponseModalities []string `json:"responseModalities"`
}

// APIResponse represents Gemini API response
type APIResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text       string `json:"text,omitempty"`
				InlineData *struct {
					Data     string `json:"data"`
					MimeType string `json:"mimeType"`
				} `json:"inlineData,omitempty"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// callAPI makes request to Gemini API
func (e *ImageEnhancer) callAPI(imageBase64, mimeType, prompt, model string, modalities []string) (*APIResponse, error) {
	url := fmt.Sprintf("%s/v1beta/models/%s:generateContent", e.config.BaseURL, model)

	req := APIRequest{
		Contents: []Content{{
			Role: "user",
			Parts: []Part{
				{Text: prompt},
				{InlineData: &InlineData{MimeType: mimeType, Data: imageBase64}},
			},
		}},
		GenerationConfig: GenerationConfig{ResponseModalities: modalities},
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+e.config.APIKey)

	resp, err := e.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody[:200]))
	}

	var apiResp APIResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, err
	}

	return &apiResp, nil
}

// parseClassification extracts classification from analysis text
func parseClassification(text string) Classification {
	re := regexp.MustCompile(`\{[\s\S]*\}`)
	match := re.FindString(text)
	if match != "" {
		var data struct {
			Classification Classification `json:"classification"`
		}
		if err := json.Unmarshal([]byte(match), &data); err == nil {
			if data.Classification.Category != "" {
				return data.Classification
			}
		}
	}
	return Classification{Category: "other", Confidence: 0.5}
}

// ProcessImage processes a single image
func (e *ImageEnhancer) ProcessImage(imagePath string) ProcessedImage {
	start := time.Now()
	result := ProcessedImage{OriginalPath: imagePath}

	log.Printf("Processing: %s", imagePath)

	imageBase64, err := readImageBase64(imagePath)
	if err != nil {
		result.Error = err
		return result
	}

	mimeType := getMimeType(imagePath)

	// Step 1: Analyze
	analysisPrompt := `Analyze this image and return JSON with:
{
  "description": "what's in the image",
  "classification": {"category": "landscape|portrait|restaurant|hotel|beach|food|other", "confidence": 0.9},
  "improvements": ["suggestion1"]
}`

	analysisResp, err := e.callAPI(imageBase64, mimeType, analysisPrompt, e.config.AnalyzerModel, []string{"TEXT"})
	if err != nil {
		result.Error = fmt.Errorf("analysis failed: %w", err)
		return result
	}

	analysisText := ""
	if len(analysisResp.Candidates) > 0 && len(analysisResp.Candidates[0].Content.Parts) > 0 {
		analysisText = analysisResp.Candidates[0].Content.Parts[0].Text
	}

	classification := parseClassification(analysisText)
	result.Category = classification.Category
	log.Printf("Classified as: %s (%.2f)", classification.Category, classification.Confidence)

	// Step 2: Enhance
	enhancePrompt := fmt.Sprintf(`Based on analysis: %s

Enhance this image:
- Improve lighting and colors
- Add Asian people if empty
- Keep main subject`, analysisText)

	enhanceResp, err := e.callAPI(imageBase64, mimeType, enhancePrompt, e.config.EnhancerModel, []string{"TEXT", "IMAGE"})
	if err != nil {
		result.Error = fmt.Errorf("enhancement failed: %w", err)
		return result
	}

	// Find image data in response
	var imageData string
	for _, part := range enhanceResp.Candidates[0].Content.Parts {
		if part.InlineData != nil && part.InlineData.Data != "" {
			imageData = part.InlineData.Data
			break
		}
	}

	if imageData == "" {
		result.Error = fmt.Errorf("no image in response")
		return result
	}

	// Step 3: Save
	folder := e.categories[classification.Category]
	if folder == "" {
		folder = classification.Category
	}
	outputDir := filepath.Join(e.config.OutputDir, folder)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		result.Error = err
		return result
	}

	baseName := strings.TrimSuffix(filepath.Base(imagePath), filepath.Ext(imagePath))
	outputPath := filepath.Join(outputDir, fmt.Sprintf("enhanced_%s.%s", baseName, e.config.OutputFormat))

	decoded, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		result.Error = err
		return result
	}

	if err := os.WriteFile(outputPath, decoded, 0644); err != nil {
		result.Error = err
		return result
	}

	result.EnhancedPath = outputPath
	result.ProcessingTime = time.Since(start)
	log.Printf("Saved: %s", outputPath)

	return result
}

// ProcessImages processes multiple images concurrently
func (e *ImageEnhancer) ProcessImages(inputPath string, recursive bool) []ProcessedImage {
	images, err := e.FindImages(inputPath, recursive)
	if err != nil {
		log.Printf("Error finding images: %v", err)
		return nil
	}

	if len(images) == 0 {
		log.Printf("No images found in: %s", inputPath)
		return nil
	}

	log.Printf("Found %d images", len(images))

	results := make([]ProcessedImage, len(images))
	sem := make(chan struct{}, e.config.MaxConcurrent)
	var wg sync.WaitGroup

	for i, img := range images {
		wg.Add(1)
		go func(idx int, imagePath string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			results[idx] = e.ProcessImage(imagePath)
		}(i, img)
	}

	wg.Wait()

	// Summary
	success := 0
	for _, r := range results {
		if r.Error == nil {
			success++
		}
	}
	log.Printf("Completed: %d/%d successful", success, len(results))

	return results
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <image-path> [--recursive]")
		os.Exit(1)
	}

	inputPath := os.Args[1]
	recursive := len(os.Args) > 2 && os.Args[2] == "--recursive"

	enhancer := NewImageEnhancer(Config{})

	if enhancer.config.APIKey == "" {
		log.Fatal("Set OPENAI_API_KEY or GEMINI_API_KEY environment variable")
	}

	results := enhancer.ProcessImages(inputPath, recursive)

	fmt.Println("\n========== RESULTS ==========")
	for _, r := range results {
		if r.Error != nil {
			fmt.Printf("✗ %s: %v\n", r.OriginalPath, r.Error)
		} else {
			fmt.Printf("✓ %s -> %s (%v)\n", r.OriginalPath, r.EnhancedPath, r.ProcessingTime.Round(time.Second))
		}
	}
}
```

---

## 6. Unit Testing

### 6.1 TypeScript/Jest Tests

```typescript
// __tests__/imageEnhancer.test.ts
import * as fs from "fs";
import * as path from "path";

// Mock modules
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
  readdirSync: jest.fn(),
}));

describe("ImageEnhancer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readImageAsBase64", () => {
    it("should read file and return base64", async () => {
      const mockBuffer = Buffer.from("test-image-data");
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await readImageAsBase64("/path/to/image.jpg");

      expect(result).toBe(mockBuffer.toString("base64"));
      expect(fs.promises.readFile).toHaveBeenCalledWith("/path/to/image.jpg");
    });
  });

  describe("getMimeType", () => {
    it("should return correct MIME type for PNG", () => {
      expect(getMimeType("/path/to/image.png")).toBe("image/png");
    });

    it("should return correct MIME type for JPG", () => {
      expect(getMimeType("/path/to/image.jpg")).toBe("image/jpeg");
    });

    it("should return jpeg for unknown extensions", () => {
      expect(getMimeType("/path/to/image.unknown")).toBe("image/jpeg");
    });
  });

  describe("findImages", () => {
    it("should find single image file", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
      });

      const images = await findImages("/path/to/image.jpg");

      expect(images).toEqual(["/path/to/image.jpg"]);
    });

    it("should find images in directory", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({
        isFile: () => false,
        isDirectory: () => true,
      });
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: "image1.jpg", isFile: () => true, isDirectory: () => false },
        { name: "image2.png", isFile: () => true, isDirectory: () => false },
        { name: "document.txt", isFile: () => true, isDirectory: () => false },
      ]);

      const images = await findImages("/path/to/folder");

      expect(images).toHaveLength(2);
      expect(images).toContain("/path/to/folder/image1.jpg");
      expect(images).toContain("/path/to/folder/image2.png");
    });

    it("should return empty array for non-existent path", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const images = await findImages("/non/existent/path");

      expect(images).toEqual([]);
    });
  });

  describe("parseClassification", () => {
    it("should parse valid classification JSON", () => {
      const text =
        '{"classification": {"category": "beach", "confidence": 0.95}}';

      const result = parseClassification(text);

      expect(result.category).toBe("beach");
      expect(result.confidence).toBe(0.95);
    });

    it("should return default for invalid JSON", () => {
      const text = "This is not JSON";

      const result = parseClassification(text);

      expect(result.category).toBe("other");
      expect(result.confidence).toBe(0.5);
    });

    it("should handle classification without subcategory", () => {
      const text =
        '{"classification": {"category": "hotel", "confidence": 0.8}}';

      const result = parseClassification(text);

      expect(result.category).toBe("hotel");
      expect(result.subcategory).toBeUndefined();
    });
  });

  describe("buildEnhancementPrompt", () => {
    const mockAnalysis = {
      success: true,
      imagePath: "/test/image.jpg",
      rawAnalysis: "Test analysis text",
      classification: { category: "beach", confidence: 0.9 },
    };

    const mockPreset = {
      name: "test",
      description: "Test preset",
      systemPrompt: {
        analysis: "Analyze this",
        enhancement: "Enhance this",
      },
      enhancementRules: {
        addPeopleIfEmpty: true,
        peopleEthnicity: "Asian",
        peopleStyle: "natural",
        colorEnhancement: "vibrant",
        lightingStyle: "natural",
      },
    };

    it("should include analysis in prompt", () => {
      const prompt = buildEnhancementPrompt(mockAnalysis, mockPreset);

      expect(prompt).toContain("Test analysis text");
    });

    it("should include people rules when enabled", () => {
      const prompt = buildEnhancementPrompt(mockAnalysis, mockPreset);

      expect(prompt).toContain("Asian");
      expect(prompt).toContain("natural");
    });

    it("should use custom prompt when provided", () => {
      const prompt = buildEnhancementPrompt(
        mockAnalysis,
        mockPreset,
        "Custom prompt",
      );

      expect(prompt).toContain("Custom prompt");
    });
  });
});

// Helper functions to test (import these from your implementation)
function readImageAsBase64(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath).then((b) => b.toString("base64"));
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext] || "image/jpeg";
}

async function findImages(
  inputPath: string,
  recursive = false,
): Promise<string[]> {
  // ... implementation
  return [];
}

function parseClassification(text: string): {
  category: string;
  confidence: number;
  subcategory?: string;
} {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]);
      return data.classification || { category: "other", confidence: 0.5 };
    }
  } catch {}
  return { category: "other", confidence: 0.5 };
}

function buildEnhancementPrompt(
  analysis: any,
  preset: any,
  custom?: string,
): string {
  let prompt = custom || preset.systemPrompt.enhancement;
  if (analysis.rawAnalysis) prompt += "\n\n" + analysis.rawAnalysis;
  if (preset.enhancementRules.addPeopleIfEmpty) {
    prompt += `\n- Add ${preset.enhancementRules.peopleEthnicity} people`;
  }
  return prompt;
}
```

### 6.2 Python Tests (pytest)

```python
# test_image_enhancer.py
import pytest
import base64
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Import the class (adjust import path as needed)
# from image_enhancer import ImageEnhancer, ImageClassification, ProcessedImage


class TestImageEnhancer:
    """Tests for ImageEnhancer class."""

    @pytest.fixture
    def enhancer(self):
        """Create enhancer with mock API key."""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            return ImageEnhancer(base_url='http://localhost:8080')

    @pytest.fixture
    def sample_image_data(self):
        """Generate sample base64 image data."""
        return base64.b64encode(b'fake-image-data').decode()

    def test_init_with_env_vars(self):
        """Test initialization from environment variables."""
        with patch.dict('os.environ', {
            'OPENAI_API_BASE': 'http://test-proxy',
            'OPENAI_API_KEY': 'test-api-key'
        }):
            enhancer = ImageEnhancer()
            assert enhancer.base_url == 'http://test-proxy'
            assert enhancer.api_key == 'test-api-key'

    def test_init_raises_without_api_key(self):
        """Test that initialization fails without API key."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="API key required"):
                ImageEnhancer()

    def test_get_mime_type(self, enhancer):
        """Test MIME type detection."""
        assert enhancer._get_mime_type(Path('test.png')) == 'image/png'
        assert enhancer._get_mime_type(Path('test.jpg')) == 'image/jpeg'
        assert enhancer._get_mime_type(Path('test.jpeg')) == 'image/jpeg'
        assert enhancer._get_mime_type(Path('test.gif')) == 'image/gif'
        assert enhancer._get_mime_type(Path('test.webp')) == 'image/webp'
        assert enhancer._get_mime_type(Path('test.unknown')) == 'image/jpeg'

    def test_find_images_single_file(self, enhancer, tmp_path):
        """Test finding a single image file."""
        img_path = tmp_path / 'test.jpg'
        img_path.touch()

        images = enhancer.find_images(str(img_path))
        assert len(images) == 1
        assert images[0] == img_path

    def test_find_images_directory(self, enhancer, tmp_path):
        """Test finding images in a directory."""
        (tmp_path / 'image1.jpg').touch()
        (tmp_path / 'image2.png').touch()
        (tmp_path / 'document.txt').touch()

        images = enhancer.find_images(str(tmp_path))
        assert len(images) == 2

    def test_find_images_recursive(self, enhancer, tmp_path):
        """Test recursive image finding."""
        (tmp_path / 'image1.jpg').touch()
        subdir = tmp_path / 'subdir'
        subdir.mkdir()
        (subdir / 'image2.png').touch()

        # Non-recursive
        images = enhancer.find_images(str(tmp_path), recursive=False)
        assert len(images) == 1

        # Recursive
        images = enhancer.find_images(str(tmp_path), recursive=True)
        assert len(images) == 2

    def test_find_images_nonexistent(self, enhancer):
        """Test handling of non-existent path."""
        images = enhancer.find_images('/nonexistent/path')
        assert images == []

    def test_parse_classification_valid(self, enhancer):
        """Test parsing valid classification."""
        text = '{"classification": {"category": "beach", "confidence": 0.95, "tags": ["ocean", "sand"]}}'

        result = enhancer._parse_classification(text)

        assert result.category == 'beach'
        assert result.confidence == 0.95
        assert 'ocean' in result.tags

    def test_parse_classification_invalid(self, enhancer):
        """Test parsing invalid text returns default."""
        result = enhancer._parse_classification('Not valid JSON at all')

        assert result.category == 'other'
        assert result.confidence == 0.5

    def test_parse_classification_partial(self, enhancer):
        """Test parsing with partial data."""
        text = '{"classification": {"category": "hotel"}}'

        result = enhancer._parse_classification(text)

        assert result.category == 'hotel'
        assert result.confidence == 0.5  # Default when missing

    @patch('requests.Session.post')
    def test_call_api_success(self, mock_post, enhancer, sample_image_data):
        """Test successful API call."""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'candidates': [{
                'content': {
                    'parts': [{'text': 'Analysis result'}]
                }
            }]
        }
        mock_post.return_value = mock_response

        result = enhancer._call_api(
            sample_image_data, 'image/jpeg', 'Test prompt',
            'gemini-2.5-flash', ['TEXT']
        )

        assert 'text' in result
        assert result['text'] == 'Analysis result'

    @patch('requests.Session.post')
    def test_call_api_with_image_response(self, mock_post, enhancer, sample_image_data):
        """Test API call that returns image."""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            'candidates': [{
                'content': {
                    'parts': [
                        {'text': 'Enhancement complete'},
                        {'inlineData': {'data': sample_image_data}}
                    ]
                }
            }]
        }
        mock_post.return_value = mock_response

        result = enhancer._call_api(
            sample_image_data, 'image/jpeg', 'Enhance',
            'gemini-2.5-flash-image', ['TEXT', 'IMAGE']
        )

        assert 'image_data' in result

    @patch('requests.Session.post')
    def test_call_api_error(self, mock_post, enhancer, sample_image_data):
        """Test API error handling."""
        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 500
        mock_response.text = 'Internal Server Error'
        mock_post.return_value = mock_response

        result = enhancer._call_api(
            sample_image_data, 'image/jpeg', 'Test',
            'gemini-2.5-flash', ['TEXT']
        )

        assert 'error' in result
        assert '500' in result['error']

    def test_save_enhanced_image(self, enhancer, sample_image_data, tmp_path):
        """Test saving enhanced image to correct folder."""
        enhancer.output_dir = tmp_path

        output_path = enhancer._save_enhanced_image(
            sample_image_data,
            Path('/original/beach_photo.jpg'),
            'beach'
        )

        assert Path(output_path).exists()
        assert 'bai-bien' in str(output_path)  # Vietnamese folder name
        assert 'enhanced_beach_photo.png' in str(output_path)

    def test_save_enhanced_image_duplicate_handling(self, enhancer, sample_image_data, tmp_path):
        """Test handling of duplicate filenames."""
        enhancer.output_dir = tmp_path

        # Create first file
        first = enhancer._save_enhanced_image(
            sample_image_data, Path('/test.jpg'), 'other'
        )

        # Create second file with same name
        second = enhancer._save_enhanced_image(
            sample_image_data, Path('/test.jpg'), 'other'
        )

        assert first != second
        assert '_1' in str(second)


class TestProcessedImage:
    """Tests for ProcessedImage dataclass."""

    def test_defaults(self):
        """Test default values."""
        img = ProcessedImage(original_path='/test.jpg')

        assert img.original_path == '/test.jpg'
        assert img.enhanced_path is None
        assert img.error is None
        assert img.processing_time == 0.0


# Run with: pytest test_image_enhancer.py -v
```

---

## 7. Logging and Debugging

### 7.1 Debug Logging Configuration

The actual implementation uses `console.error` for debug logging. Configure logging level:

```typescript
// TypeScript - structured logging
const DEBUG = process.env.DEBUG === "true" || process.env.DEBUG === "1";

function log(
  level: "DEBUG" | "INFO" | "ERROR",
  message: string,
  data?: object,
) {
  if (level === "DEBUG" && !DEBUG) return;

  const timestamp = new Date().toISOString();
  const logLine = JSON.stringify({
    timestamp,
    level,
    message,
    ...data,
  });

  console.error(logLine);
}

// Usage
log("DEBUG", "Processing image", { path: imagePath, preset: "tourism" });
log("INFO", "Image classified", { category: "beach", confidence: 0.95 });
log("ERROR", "API call failed", { status: 500, error: "timeout" });
```

```python
# Python - structured logging
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
        }
        if hasattr(record, 'extra'):
            log_data.update(record.extra)
        return json.dumps(log_data)

# Configure
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger('image_enhancer')
logger.addHandler(handler)
logger.setLevel(logging.DEBUG if os.environ.get('DEBUG') else logging.INFO)

# Usage
logger.debug('Processing image', extra={'path': image_path, 'preset': 'tourism'})
logger.info('Image classified', extra={'category': 'beach', 'confidence': 0.95})
```

### 7.2 Debug Environment Variables

```bash
# Enable verbose debugging
export DEBUG=true

# Override models for testing
export NANOBANANA_ANALYZER_MODEL=gemini-2.5-flash
export NANOBANANA_ENHANCER_MODEL=gemini-2.5-flash-image

# Trace API requests
export LOG_API_REQUESTS=true
```

### 7.3 Request/Response Logging

```typescript
// Log API requests for debugging
async function callAPIWithLogging(
  url: string,
  body: object,
  headers: Record<string, string>,
): Promise<Response> {
  const requestId = Math.random().toString(36).substring(7);

  console.error(`DEBUG - Request [${requestId}]: ${url}`);
  console.error(
    `DEBUG - Request body size: ${JSON.stringify(body).length} bytes`,
  );

  const startTime = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const duration = Date.now() - startTime;
  console.error(
    `DEBUG - Response [${requestId}]: ${response.status} in ${duration}ms`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `DEBUG - Error [${requestId}]: ${errorText.substring(0, 500)}`,
    );
  }

  return response;
}
```

---

## 8. Troubleshooting

### Common Issues and Solutions

| Issue                                | Cause                                    | Solution                                                        |
| ------------------------------------ | ---------------------------------------- | --------------------------------------------------------------- |
| **No image in enhancement response** | `responseModalities` missing `IMAGE`     | Ensure `generationConfig.responseModalities: ['TEXT', 'IMAGE']` |
| **Classification not found**         | Classification prompt not appended       | Append classification prompt to analysis prompt                 |
| **JSON parsing fails**               | Response contains markdown or extra text | Use regex `/{[\s\S]*}/` to extract JSON block                   |
| **Rate limiting (429 errors)**       | Too many requests                        | Implement exponential backoff, reduce concurrency               |
| **Large images timeout**             | Image too large                          | Compress to <10MB before sending                                |
| **API error 400**                    | Invalid request format                   | Check `inline_data` vs `inlineData` (snake_case vs camelCase)   |
| **No API key found**                 | Environment not set                      | Set `OPENAI_API_KEY` or `GEMINI_API_KEY`                        |
| **Proxy connection refused**         | Proxy not running                        | Start proxy server, verify `OPENAI_API_BASE` URL                |
| **Wrong output folder**              | Category not in config                   | Add category to `enhancement-config.json`                       |
| **Image corrupted**                  | Base64 encoding issue                    | Verify proper encoding/decoding                                 |

### 8.1 Debugging API Responses

```typescript
// Debug helper to inspect API response structure
function debugAPIResponse(data: unknown): void {
  console.error("=== API Response Debug ===");
  console.error("Type:", typeof data);
  console.error("Structure:", JSON.stringify(data, null, 2).substring(0, 2000));

  const resp = data as any;
  if (resp?.candidates?.[0]?.content?.parts) {
    console.error("Parts count:", resp.candidates[0].content.parts.length);
    resp.candidates[0].content.parts.forEach((part: any, i: number) => {
      console.error(`Part ${i}:`, {
        hasText: !!part.text,
        hasInlineData: !!part.inlineData || !!part.inline_data,
        textPreview: part.text?.substring(0, 100),
      });
    });
  }
}
```

### 8.2 Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.error(
          `Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage
const result = await retryWithBackoff(() => callAPI(imageBase64, prompt));
```

### 8.3 Health Check Script

```bash
#!/bin/bash
# health-check.sh - Verify environment is properly configured

echo "=== Image Enhancer Health Check ==="

# Check API key
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ No API key found"
    echo "   Set OPENAI_API_KEY or GEMINI_API_KEY"
    exit 1
else
    echo "✓ API key configured"
fi

# Check proxy connectivity (if using proxy)
if [ -n "$OPENAI_API_BASE" ]; then
    if curl -s -o /dev/null -w "%{http_code}" "$OPENAI_API_BASE/v1/models" | grep -q "200\|401"; then
        echo "✓ Proxy reachable at $OPENAI_API_BASE"
    else
        echo "❌ Cannot reach proxy at $OPENAI_API_BASE"
        exit 1
    fi
fi

# Check output directory
OUTPUT_DIR="${OUTPUT_DIR:-./nanobanana-output}"
if [ -w "$(dirname "$OUTPUT_DIR")" ]; then
    echo "✓ Output directory writable"
else
    echo "❌ Cannot write to output directory"
    exit 1
fi

echo ""
echo "=== All checks passed ==="
```

---

## 9. Performance Optimization

1. **Batch Processing**: Process images in batches to manage concurrency
2. **Caching**: Cache analysis results to skip re-analysis
3. **Image Compression**: Resize large images before API call (max 10MB)
4. **Connection Pooling**: Reuse HTTP connections (use session/client)
5. **Async I/O**: Use async file operations for better throughput

```typescript
// Optimal batch processing
const OPTIMAL_CONCURRENCY = 3; // Prevent rate limiting
const BATCH_DELAY_MS = 1000; // Pause between batches

async function processBatches(
  images: string[],
  processor: (img: string) => Promise<Result>,
) {
  const results: Result[] = [];

  for (let i = 0; i < images.length; i += OPTIMAL_CONCURRENCY) {
    const batch = images.slice(i, i + OPTIMAL_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (i + OPTIMAL_CONCURRENCY < images.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return results;
}
```

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                  |
| ------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1.0.0   | 2025-06-28 | Nanobanana Team | Initial Guide                                                                                                            |
| 1.1.0   | 2025-06-28 | Nanobanana Team | Added minimal working example, environment setup, troubleshooting, Go implementation, unit tests, logging/debugging tips |
