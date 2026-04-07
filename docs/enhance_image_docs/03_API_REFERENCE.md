# Gemini API Reference for Image Enhancement

This document describes the Gemini API endpoints used for image analysis and enhancement.

## 1. Authentication

### 1.1 Local Proxy (Recommended)

```bash
export OPENAI_API_BASE="http://localhost:8317"
export OPENAI_API_KEY="your-proxy-key"
```

### 1.2 Direct API Key (Not Supported)

> **Note**: Direct Gemini API calls are not supported by the implementation. Use the local proxy.

---

## 2. API Endpoints

### 2.1 Base URLs

| Environment | Base URL                                                    |
| ----------- | ----------------------------------------------------------- |
| Local Proxy | `http://localhost:8317`                                     |
| Direct API  | `https://generativelanguage.googleapis.com` (not supported) |

### 2.2 Endpoint Paths

| Operation            | Path                                           | Method |
| -------------------- | ---------------------------------------------- | ------ |
| Generate Content     | `/v1beta/models/{model}:generateContent`       | POST   |
| Stream Generate      | `/v1beta/models/{model}:streamGenerateContent` | POST   |
| List Models          | `/v1beta/models`                               | GET    |
| List Models (OpenAI) | `/v1/models`                                   | GET    |

### 2.3 Models Used

| Purpose           | Model                    | Environment Variable Override |
| ----------------- | ------------------------ | ----------------------------- |
| Image Analysis    | `gemini-2.5-flash`       | `NANOBANANA_ANALYZER_MODEL`   |
| Image Enhancement | `gemini-2.5-flash-image` | `NANOBANANA_ENHANCER_MODEL`   |

---

## 3. Image Analysis API

### 3.1 Request

**Endpoint:** `POST /v1beta/models/gemini-2.5-flash:generateContent`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer YOUR_PROXY_KEY
```

**Request Body:**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Your analysis prompt here..."
        },
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "BASE64_ENCODED_IMAGE_DATA"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT"]
  }
}
```

### 3.2 curl Example

```bash
# Encode image to base64
IMAGE_BASE64=$(base64 -w 0 /path/to/image.png)

# Call API
curl -X POST "http://localhost:8317/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {"text": "Analyze this image. Return JSON with subject, context, colors, composition, mood fields."},
        {"inline_data": {"mime_type": "image/png", "data": "'"$IMAGE_BASE64"'"}}
      ]
    }],
    "generationConfig": {"responseModalities": ["TEXT"]}
  }'
```

### 3.3 Analysis Prompt Template

```
Bạn là chuyên gia phân tích hình ảnh. Hãy mô tả chi tiết:
1. CHỦ THỂ CHÍNH: Người, vật, cảnh vật chính trong ảnh
2. BỐI CẢNH: Địa điểm, thời gian, không gian
3. MÀU SẮC & ÁNH SÁNG: Tone màu, nguồn sáng, độ tương phản
4. COMPOSITION: Bố cục, góc chụp, điểm nhấn
5. CẢM XÚC: Mood, atmosphere của ảnh
6. ĐÁNH GIÁ: Điểm mạnh và điểm cần cải thiện

Trả về JSON với format:
{
  "subject": "",
  "context": "",
  "colors": "",
  "composition": "",
  "mood": "",
  "strengths": [],
  "improvements": []
}

QUAN TRỌNG: Ngoài việc phân tích, bạn PHẢI phân loại ảnh này vào MỘT trong các category sau:
- landscape
- portrait
- restaurant
- hotel
- room
- beach
- island
- tourist-attraction
- floating-house
- seafood
- food
- pool
- activity
- transport
- event
- product
- other

Thêm vào JSON response:
"classification": {
  "category": "<category_name>",
  "confidence": <0.0-1.0>,
  "subcategory": "<optional: chi tiết hơn>",
  "tags": ["tag1", "tag2", ...]
}
```

### 3.4 Response

**Success Response (200 OK):**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\n  \"subject\": \"Tropical beach with clear turquoise water\",\n  \"context\": \"Daytime, sunny weather, tropical island\",\n  \"colors\": \"Blue sea, white sand, green palm trees\",\n  \"composition\": \"Wide angle, horizon line at upper third\",\n  \"mood\": \"Peaceful, inviting, vacation vibes\",\n  \"strengths\": [\"Beautiful natural colors\", \"Good lighting\"],\n  \"improvements\": [\"Add tourists to show scale\", \"Enhance water clarity\"],\n  \"classification\": {\n    \"category\": \"beach\",\n    \"confidence\": 0.95,\n    \"subcategory\": \"tropical beach\",\n    \"tags\": [\"ocean\", \"sand\", \"palm trees\", \"tropical\"]\n  }\n}"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

### 3.5 Parsing Response

```javascript
const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

const jsonMatch = responseText.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  const analysis = JSON.parse(jsonMatch[0]);
  const classification = analysis.classification;
}
```

---

## 4. Image Enhancement API

### 4.1 Request

**Endpoint:** `POST /v1beta/models/gemini-2.5-flash-image:generateContent`

**Headers:**

```http
Content-Type: application/json
Authorization: Bearer YOUR_PROXY_KEY
```

**Request Body:**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Your enhancement prompt here..."
        },
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "BASE64_ENCODED_IMAGE_DATA"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### 4.2 curl Example

```bash
# Encode image to base64
IMAGE_BASE64=$(base64 -w 0 /path/to/image.png)

# Call API
curl -X POST "http://localhost:8317/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [
        {"text": "Enhance this image. Improve lighting, colors. Add Asian people if empty."},
        {"inline_data": {"mime_type": "image/png", "data": "'"$IMAGE_BASE64"'"}}
      ]
    }],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }' | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' | base64 -d > enhanced.png
```

### 4.3 Enhancement Prompt Template

```
Dựa trên phân tích ảnh gốc, hãy tạo phiên bản cải thiện với các yêu cầu:
- Giữ nguyên chủ thể chính và bối cảnh
- Cải thiện ánh sáng và màu sắc cho sinh động hơn
- Nếu ảnh trống/vắng người, thêm người phù hợp với bối cảnh
- Người và vật phải mang đặc điểm châu Á
- Tăng tính hấp dẫn thị giác cho mục đích marketing

## Phân tích ảnh gốc:
{analysis_json}

## Quy tắc áp dụng:
- Nếu ảnh không có người hoặc vắng vẻ, hãy thêm người châu Á
- Phong cách người: tự nhiên, chân thực
- Các loại người phù hợp: gia đình, cặp đôi, nhóm bạn
- Cải thiện màu sắc: tươi sáng nhưng tự nhiên
- Ánh sáng: natural daylight

Hãy tạo phiên bản cải thiện của ảnh gốc dựa trên các quy tắc trên.
Giữ nguyên bố cục và chủ thể chính nhưng làm ảnh hấp dẫn hơn cho mục đích marketing.
```

### 4.4 Response

**Success Response (200 OK):**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "I've enhanced the image by adding a Vietnamese family enjoying the beach..."
          },
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "BASE64_ENCODED_ENHANCED_IMAGE"
            }
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```

**Alternative Response Format (snake_case):**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "inline_data": {
              "mime_type": "image/png",
              "data": "BASE64_ENCODED_ENHANCED_IMAGE"
            }
          }
        ]
      }
    }
  ]
}
```

### 4.5 Parsing Response

```javascript
let imageData = null;

for (const part of data.candidates?.[0]?.content?.parts || []) {
  // Handle both camelCase and snake_case
  if (part.inlineData?.data) {
    imageData = part.inlineData.data;
    break;
  }
  if (part.inline_data?.data) {
    imageData = part.inline_data.data;
    break;
  }
}

if (imageData) {
  const buffer = Buffer.from(imageData, "base64");
  fs.writeFileSync("enhanced_image.png", buffer);
}
```

---

## 5. Error Responses

### 5.1 Common Error Codes

| Code | Status             | Meaning                 | Action                         |
| ---- | ------------------ | ----------------------- | ------------------------------ |
| 400  | INVALID_ARGUMENT   | Bad Request format      | Check request body structure   |
| 401  | UNAUTHENTICATED    | Invalid/missing API key | Verify Authorization header    |
| 403  | PERMISSION_DENIED  | Access forbidden        | Check API key permissions      |
| 404  | NOT_FOUND          | Model not found         | Check model name spelling      |
| 429  | RESOURCE_EXHAUSTED | Rate limited            | Wait and retry with backoff    |
| 500  | INTERNAL           | Server error            | Retry with exponential backoff |
| 503  | UNAVAILABLE        | Service unavailable     | Retry later                    |

### 5.2 Error Response Format

```json
{
  "error": {
    "code": 400,
    "message": "Invalid request: image data is required",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.BadRequest",
        "fieldViolations": [
          {
            "field": "contents[0].parts[1].inline_data.data",
            "description": "Required field missing"
          }
        ]
      }
    ]
  }
}
```

### 5.3 Common Error Scenarios

**Image too large:**

```json
{
  "error": {
    "code": 400,
    "message": "Request payload size exceeds the limit: 20971520 bytes.",
    "status": "INVALID_ARGUMENT"
  }
}
```

_Solution: Compress image to under 10MB before sending._

**Invalid MIME type:**

```json
{
  "error": {
    "code": 400,
    "message": "Unsupported MIME type: image/tiff",
    "status": "INVALID_ARGUMENT"
  }
}
```

_Solution: Convert to supported format (PNG, JPEG, GIF, WebP)._

**Model not available:**

```json
{
  "error": {
    "code": 404,
    "message": "Model 'models/gemini-unknown' not found",
    "status": "NOT_FOUND"
  }
}
```

_Solution: Check model name or use `/v1beta/models` to list available models._

**Image generation blocked:**

```json
{
  "candidates": [
    {
      "finishReason": "SAFETY",
      "safetyRatings": [
        { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "probability": "HIGH" }
      ]
    }
  ]
}
```

_Solution: Modify prompt to avoid content policy violations._

### 5.4 Retry Logic with Exponential Backoff

```javascript
async function callAPIWithRetry(requestFn, maxRetries = 3) {
  const retryableStatuses = [429, 500, 502, 503, 504];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();

      if (response.ok) {
        return await response.json();
      }

      if (retryableStatuses.includes(response.status)) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(Math.pow(2, attempt) * 1000, 60000);

        console.log(`Retry ${attempt}/${maxRetries} after ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Client error - don't retry
      const error = await response.json();
      throw new Error(`API error ${response.status}: ${error.error?.message}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Network error - retry
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}
```

---

## 6. Rate Limits & Best Practices

### 6.1 Rate Limits

| Tier          | Requests/minute | Tokens/minute | Image Requests/day |
| ------------- | --------------- | ------------- | ------------------ |
| Free          | 15              | 1,000,000     | 50                 |
| Pay-as-you-go | 1,000           | 4,000,000     | 1,500              |
| Enterprise    | Custom          | Custom        | Custom             |

### 6.2 Rate Limit Handling

```javascript
class RateLimiter {
  constructor(requestsPerMinute = 15) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    const windowStart = now - 60000;

    // Clean old requests
    this.requests = this.requests.filter((t) => t > windowStart);

    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest - windowStart + 100;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(15);
await limiter.waitForSlot();
const result = await callAPI();
```

### 6.3 Best Practices

1. **Image Size**: Compress images to < 10MB (recommended < 4MB for faster processing)
2. **Batch Processing**: Use `maxConcurrentImages` setting (default: 3) to respect rate limits
3. **Caching**: Cache analysis results to avoid re-processing unchanged images
4. **Timeouts**: Set 60-second timeout for API calls
5. **Error Handling**: Implement retry logic with exponential backoff
6. **Monitoring**: Log all API calls for debugging and usage tracking

---

## 7. MIME Type Reference

### 7.1 Supported Input Formats

| Extension       | MIME Type    | Notes                                    |
| --------------- | ------------ | ---------------------------------------- |
| `.png`          | `image/png`  | Best for graphics, supports transparency |
| `.jpg`, `.jpeg` | `image/jpeg` | Best for photos, smaller file size       |
| `.gif`          | `image/gif`  | Supports animation (first frame only)    |
| `.webp`         | `image/webp` | Modern format, good compression          |
| `.bmp`          | `image/bmp`  | Large file size, not recommended         |

### 7.2 Output Formats

The API returns enhanced images as `image/png`. Post-process if other formats needed:

```bash
# Convert PNG to JPEG
convert enhanced.png -quality 85 enhanced.jpg

# Convert PNG to WebP
cwebp enhanced.png -o enhanced.webp -q 80
```

---

## 8. Model Reference

### 8.1 Available Models

| Model                    | Purpose     | Input        | Output       |
| ------------------------ | ----------- | ------------ | ------------ |
| `gemini-2.5-flash`       | Analysis    | Text + Image | Text only    |
| `gemini-2.5-flash-image` | Enhancement | Text + Image | Text + Image |
| `gemini-2.0-flash`       | Alternative | Text + Image | Text only    |

### 8.2 Model Discovery

```bash
# List available models via proxy
curl -X GET "http://localhost:8317/v1/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.data[].id'

# List models (Gemini format)
curl -X GET "http://localhost:8317/v1beta/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY" | jq '.models[].name'
```

### 8.3 Model Selection Logic

```javascript
// Environment variable takes precedence
const analyzerModel =
  process.env.NANOBANANA_ANALYZER_MODEL ||
  config.globalSettings.analyzerModel ||
  "gemini-2.5-flash";

const enhancerModel =
  process.env.NANOBANANA_ENHANCER_MODEL ||
  config.globalSettings.enhancerModel ||
  "gemini-2.5-flash-image";
```

---

## 9. Complete Code Examples

### 9.1 Node.js (TypeScript)

```typescript
import * as fs from "fs";
import * as path from "path";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { data: string; mimeType: string };
        inline_data?: { data: string; mime_type: string };
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

const BASE_URL = process.env.OPENAI_API_BASE || "http://localhost:8317";
const API_KEY = process.env.OPENAI_API_KEY || "";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "image/jpeg";
}

async function analyzeImage(
  imagePath: string,
  prompt: string,
): Promise<object | null> {
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const mimeType = getMimeType(imagePath);

  const response = await fetch(
    `${BASE_URL}/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
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
        generationConfig: {
          responseModalities: ["TEXT"],
        },
      }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as GeminiResponse;
    throw new Error(`API error: ${error.error?.message}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) return null;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

async function enhanceImage(
  imagePath: string,
  prompt: string,
): Promise<Buffer | null> {
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");
  const mimeType = getMimeType(imagePath);

  const response = await fetch(
    `${BASE_URL}/v1beta/models/gemini-2.5-flash-image:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
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
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    },
  );

  if (!response.ok) {
    const error = (await response.json()) as GeminiResponse;
    throw new Error(`API error: ${error.error?.message}`);
  }

  const data = (await response.json()) as GeminiResponse;

  for (const part of data.candidates?.[0]?.content?.parts || []) {
    const imageData = part.inlineData?.data || part.inline_data?.data;
    if (imageData) {
      return Buffer.from(imageData, "base64");
    }
  }

  return null;
}

// Usage example
async function main() {
  try {
    const analysis = await analyzeImage(
      "./test.png",
      "Analyze this image in detail.",
    );
    console.log("Analysis:", analysis);

    const enhanced = await enhanceImage("./test.png", "Enhance this image.");
    if (enhanced) {
      fs.writeFileSync("./enhanced.png", enhanced);
      console.log("Enhanced image saved to ./enhanced.png");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

### 9.2 Python

```python
#!/usr/bin/env python3
"""Complete image analysis and enhancement client for Gemini API."""

import base64
import json
import os
import re
import time
from pathlib import Path
from typing import Optional, Dict, Any, Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class GeminiClient:
    """Client for Gemini image analysis and enhancement API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 60,
        max_retries: int = 3,
    ):
        self.base_url = base_url or os.getenv('OPENAI_API_BASE', 'http://localhost:8317')
        self.api_key = api_key or os.getenv('OPENAI_API_KEY', '')
        self.timeout = timeout

        # Setup session with retry logic
        self.session = requests.Session()
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def _get_mime_type(self, file_path: str) -> str:
        """Get MIME type from file extension."""
        ext = Path(file_path).suffix.lower()
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        }
        return mime_types.get(ext, 'image/jpeg')

    def _read_image_base64(self, file_path: str) -> str:
        """Read image file and encode to base64."""
        with open(file_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')

    def analyze_image(
        self,
        image_path: str,
        prompt: str,
        model: str = 'gemini-2.5-flash',
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze an image and return structured JSON response.

        Args:
            image_path: Path to the image file
            prompt: Analysis prompt
            model: Model to use for analysis

        Returns:
            Parsed JSON analysis or None if failed
        """
        image_base64 = self._read_image_base64(image_path)
        mime_type = self._get_mime_type(image_path)

        url = f'{self.base_url}/v1beta/models/{model}:generateContent'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
        }
        payload = {
            'contents': [{
                'role': 'user',
                'parts': [
                    {'text': prompt},
                    {'inline_data': {'mime_type': mime_type, 'data': image_base64}},
                ],
            }],
            'generationConfig': {
                'responseModalities': ['TEXT'],
            },
        }

        response = self.session.post(url, headers=headers, json=payload, timeout=self.timeout)
        response.raise_for_status()

        data = response.json()

        if 'error' in data:
            raise Exception(f"API error: {data['error'].get('message')}")

        text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

        # Parse JSON from response text
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())

        return None

    def enhance_image(
        self,
        image_path: str,
        prompt: str,
        model: str = 'gemini-2.5-flash-image',
    ) -> Optional[bytes]:
        """
        Enhance an image and return the enhanced image bytes.

        Args:
            image_path: Path to the image file
            prompt: Enhancement prompt
            model: Model to use for enhancement

        Returns:
            Enhanced image as bytes or None if failed
        """
        image_base64 = self._read_image_base64(image_path)
        mime_type = self._get_mime_type(image_path)

        url = f'{self.base_url}/v1beta/models/{model}:generateContent'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
        }
        payload = {
            'contents': [{
                'role': 'user',
                'parts': [
                    {'text': prompt},
                    {'inline_data': {'mime_type': mime_type, 'data': image_base64}},
                ],
            }],
            'generationConfig': {
                'responseModalities': ['TEXT', 'IMAGE'],
            },
        }

        response = self.session.post(url, headers=headers, json=payload, timeout=self.timeout)
        response.raise_for_status()

        data = response.json()

        if 'error' in data:
            raise Exception(f"API error: {data['error'].get('message')}")

        # Extract image from response (handle both naming conventions)
        for part in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
            image_data = (
                part.get('inlineData', {}).get('data') or
                part.get('inline_data', {}).get('data')
            )
            if image_data:
                return base64.b64decode(image_data)

        return None

    def list_models(self) -> list:
        """List available models."""
        url = f'{self.base_url}/v1/models'
        headers = {'Authorization': f'Bearer {self.api_key}'}

        response = self.session.get(url, headers=headers, timeout=self.timeout)
        response.raise_for_status()

        data = response.json()
        return [m.get('id') for m in data.get('data', [])]


# Usage example
if __name__ == '__main__':
    client = GeminiClient()

    # List available models
    print("Available models:", client.list_models())

    # Analyze image
    analysis = client.analyze_image(
        './test.png',
        'Analyze this image. Return JSON with subject, context, colors, composition, mood.'
    )
    print("Analysis:", json.dumps(analysis, indent=2))

    # Enhance image
    enhanced = client.enhance_image(
        './test.png',
        'Enhance this image. Improve lighting and colors. Add people if empty.'
    )
    if enhanced:
        with open('./enhanced.png', 'wb') as f:
            f.write(enhanced)
        print("Enhanced image saved to ./enhanced.png")
```

### 9.3 Go

```go
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// Request structures
type GeminiRequest struct {
	Contents         []Content        `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig"`
}

type Content struct {
	Role  string `json:"role"`
	Parts []Part `json:"parts"`
}

type Part struct {
	Text       string      `json:"text,omitempty"`
	InlineData *InlineData `json:"inline_data,omitempty"`
}

type InlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type GenerationConfig struct {
	ResponseModalities []string `json:"responseModalities"`
}

// Response structures
type GeminiResponse struct {
	Candidates []Candidate  `json:"candidates,omitempty"`
	Error      *GeminiError `json:"error,omitempty"`
}

type Candidate struct {
	Content      ResponseContent `json:"content"`
	FinishReason string          `json:"finishReason,omitempty"`
}

type ResponseContent struct {
	Parts []ResponsePart `json:"parts"`
	Role  string         `json:"role,omitempty"`
}

type ResponsePart struct {
	Text       string          `json:"text,omitempty"`
	InlineData *ResponseInline `json:"inlineData,omitempty"`
	// Handle snake_case variant
	InlineDataSnake *ResponseInlineSnake `json:"inline_data,omitempty"`
}

type ResponseInline struct {
	MimeType string `json:"mimeType"`
	Data     string `json:"data"`
}

type ResponseInlineSnake struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type GeminiError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Status  string `json:"status"`
}

// Client
type GeminiClient struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewGeminiClient() *GeminiClient {
	baseURL := os.Getenv("OPENAI_API_BASE")
	if baseURL == "" {
		baseURL = "http://localhost:8317"
	}

	apiKey := os.Getenv("OPENAI_API_KEY")

	return &GeminiClient{
		BaseURL: baseURL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *GeminiClient) getMimeType(filePath string) string {
	ext := strings.ToLower(filepath.Ext(filePath))
	mimeTypes := map[string]string{
		".png":  "image/png",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".gif":  "image/gif",
		".webp": "image/webp",
	}
	if mime, ok := mimeTypes[ext]; ok {
		return mime
	}
	return "image/jpeg"
}

func (c *GeminiClient) readImageBase64(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

func (c *GeminiClient) AnalyzeImage(imagePath, prompt string) (map[string]interface{}, error) {
	imageBase64, err := c.readImageBase64(imagePath)
	if err != nil {
		return nil, err
	}

	mimeType := c.getMimeType(imagePath)

	request := GeminiRequest{
		Contents: []Content{{
			Role: "user",
			Parts: []Part{
				{Text: prompt},
				{InlineData: &InlineData{MimeType: mimeType, Data: imageBase64}},
			},
		}},
		GenerationConfig: GenerationConfig{
			ResponseModalities: []string{"TEXT"},
		},
	}

	body, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/v1beta/models/gemini-2.5-flash:generateContent", c.BaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result GeminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Error != nil {
		return nil, fmt.Errorf("API error %d: %s", result.Error.Code, result.Error.Message)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no response content")
	}

	text := result.Candidates[0].Content.Parts[0].Text

	// Extract JSON from response
	re := regexp.MustCompile(`\{[\s\S]*\}`)
	jsonStr := re.FindString(text)
	if jsonStr == "" {
		return nil, fmt.Errorf("no JSON found in response")
	}

	var analysis map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &analysis); err != nil {
		return nil, fmt.Errorf("failed to parse analysis JSON: %w", err)
	}

	return analysis, nil
}

func (c *GeminiClient) EnhanceImage(imagePath, prompt string) ([]byte, error) {
	imageBase64, err := c.readImageBase64(imagePath)
	if err != nil {
		return nil, err
	}

	mimeType := c.getMimeType(imagePath)

	request := GeminiRequest{
		Contents: []Content{{
			Role: "user",
			Parts: []Part{
				{Text: prompt},
				{InlineData: &InlineData{MimeType: mimeType, Data: imageBase64}},
			},
		}},
		GenerationConfig: GenerationConfig{
			ResponseModalities: []string{"TEXT", "IMAGE"},
		},
	}

	body, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s/v1beta/models/gemini-2.5-flash-image:generateContent", c.BaseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result GeminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Error != nil {
		return nil, fmt.Errorf("API error %d: %s", result.Error.Code, result.Error.Message)
	}

	// Extract image data (handle both naming conventions)
	for _, part := range result.Candidates[0].Content.Parts {
		var imageData string
		if part.InlineData != nil && part.InlineData.Data != "" {
			imageData = part.InlineData.Data
		} else if part.InlineDataSnake != nil && part.InlineDataSnake.Data != "" {
			imageData = part.InlineDataSnake.Data
		}

		if imageData != "" {
			return base64.StdEncoding.DecodeString(imageData)
		}
	}

	return nil, fmt.Errorf("no image data in response")
}

func main() {
	client := NewGeminiClient()

	// Analyze image
	analysis, err := client.AnalyzeImage("./test.png", "Analyze this image. Return JSON with subject, context, colors.")
	if err != nil {
		fmt.Printf("Analysis error: %v\n", err)
	} else {
		jsonBytes, _ := json.MarshalIndent(analysis, "", "  ")
		fmt.Printf("Analysis:\n%s\n", string(jsonBytes))
	}

	// Enhance image
	enhanced, err := client.EnhanceImage("./test.png", "Enhance this image. Improve lighting and colors.")
	if err != nil {
		fmt.Printf("Enhancement error: %v\n", err)
	} else {
		if err := os.WriteFile("./enhanced.png", enhanced, 0644); err != nil {
			fmt.Printf("Failed to save enhanced image: %v\n", err)
		} else {
			fmt.Println("Enhanced image saved to ./enhanced.png")
		}
	}
}
```

---

## 10. Proxy Management API

The local proxy provides management endpoints for configuration and monitoring.

### 10.1 Check Auth Status

```bash
curl -X GET "http://localhost:8317/v0/management/get-auth-status" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 10.2 View Usage Statistics

```bash
curl -X GET "http://localhost:8317/v0/management/usage" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 10.3 View Configuration

```bash
curl -X GET "http://localhost:8317/v0/management/config" \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 10.4 Access Management Panel

Open `http://localhost:8317/management.html` in a browser for the web-based management UI.

---

## Document History

| Version | Date       | Author          | Changes                                                                                                            |
| ------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1.0.0   | 2025-06-28 | Nanobanana Team | Initial API Reference                                                                                              |
| 1.1.0   | 2025-12-28 | Nanobanana Team | Added curl examples, complete Python/Go examples, error scenarios, rate limit handling, proxy management endpoints |
