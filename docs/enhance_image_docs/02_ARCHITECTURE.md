# AI Image Enhancement - System Architecture

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI IMAGE ENHANCEMENT SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   INPUT     │    │  ANALYZER   │    │  ENHANCER   │    │   OUTPUT    │  │
│  │   HANDLER   │───▶│   MODULE    │───▶│   MODULE    │───▶│   HANDLER   │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                  │                  │                  │           │
│        │                  ▼                  ▼                  │           │
│        │           ┌─────────────┐    ┌─────────────┐          │           │
│        │           │   GEMINI    │    │   GEMINI    │          │           │
│        │           │   FLASH     │    │ FLASH-IMAGE │          │           │
│        │           │  (Analysis) │    │(Generation) │          │           │
│        │           └─────────────┘    └─────────────┘          │           │
│        │                                                        │           │
│        ▼                                                        ▼           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CONFIGURATION MANAGER                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │   │
│  │  │ Presets  │  │Categories│  │  Global  │  │  Custom Prompts  │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Details

### 2.1 FileHandler (Static Utility)

**Responsibility**: File I/O operations and path management

```
┌─────────────────────────────────────┐
│           FileHandler               │
├─────────────────────────────────────┤
│  Constants:                         │
│  ├── OUTPUT_DIR = 'nanobanana-output'│
│  └── SEARCH_PATHS[]                 │
│                                     │
│  Static Methods:                    │
│  ├── ensureOutputDirectory()        │
│  ├── findInputFile(filename)        │
│  ├── generateFilename(prompt,fmt,i) │
│  ├── saveImageFromBase64(data,...)  │
│  └── readImageAsBase64(filePath)    │
│                                     │
│  Search Paths (in order):           │
│  ├── process.cwd()                  │
│  ├── ./images                       │
│  ├── ./input                        │
│  ├── ./nanobanana-output            │
│  ├── ~/Downloads                    │
│  └── ~/Desktop                      │
│                                     │
└─────────────────────────────────────┘
```

### 2.2 ImageAnalyzer

**Responsibility**: Analyze image content and classify into categories

```
┌─────────────────────────────────────┐
│          ImageAnalyzer              │
├─────────────────────────────────────┤
│  Dependencies:                      │
│  ├── AuthConfig (injected)          │
│  ├── EnhancementConfig (injected)   │
│  └── FileHandler (static)           │
│                                     │
│  Supported Formats:                 │
│  ├── .jpg, .jpeg                    │
│  ├── .png                           │
│  ├── .gif                           │
│  ├── .webp                          │
│  └── .bmp                           │
│                                     │
│  Process Flow:                      │
│  1. Read image as base64            │
│  2. Build analysis + classification │
│     prompt                          │
│  3. Call Gemini Flash API           │
│  4. Parse JSON response             │
│  5. Extract classification          │
│                                     │
└─────────────────────────────────────┘
```

### 2.3 ImageEnhancer

**Responsibility**: Orchestrate the enhancement workflow

```
┌─────────────────────────────────────┐
│          ImageEnhancer              │
├─────────────────────────────────────┤
│  Dependencies:                      │
│  ├── AuthConfig (injected)          │
│  ├── EnhancementConfig (injected)   │
│  ├── ImageAnalyzer (composed)       │
│  └── FileHandler (static)           │
│                                     │
│  Capabilities:                      │
│  ├── Single image enhancement       │
│  ├── Batch processing               │
│  ├── Analysis-only mode             │
│  ├── Category-based organization    │
│  └── Preview functionality          │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. Class Diagram (Actual Implementation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ImageEnhancer                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ - useLocalProxy: boolean                                                     │
│ - localProxyBaseUrl: string                                                  │
│ - localProxyApiKey: string                                                   │
│ - config: EnhancementConfig                                                  │
│ - analyzer: ImageAnalyzer                                                    │
│ - modelName: string                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ + constructor(authConfig: AuthConfig, config: EnhancementConfig)             │
│ + processImages(request: ImageEnhancementRequest): Promise<Response>         │
│ + enhanceImage(path: string, preset?: string, prompt?: string): Promise<PI>  │
│ + static loadConfig(path?: string): EnhancementConfig                        │
│ + static getDefaultConfig(): EnhancementConfig                               │
│ - getPreset(name?: string): EnhancementPreset                                │
│ - getEnhancementPrompt(preset: EnhancementPreset): string                    │
│ - buildEnhancementPrompt(analysis, preset, prompt?): string                  │
│ - fetchImageModelFromProxy(): Promise<string | null>                         │
│ - getMimeType(filePath: string): MimeType                                    │
│ - callProxyForEnhancement(base64, mime, prompt): Promise<Result>             │
│ - openImagePreview(filePath: string): Promise<void>                          │
│ - getCategoryOutputPath(category: ImageCategory): string                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ creates & uses
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ImageAnalyzer                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ - useLocalProxy: boolean                                                     │
│ - localProxyBaseUrl: string                                                  │
│ - localProxyApiKey: string                                                   │
│ - config: EnhancementConfig                                                  │
│ - modelName: string                                                          │
│ - static readonly IMAGE_EXTENSIONS: string[]                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ + constructor(authConfig: AuthConfig, config: EnhancementConfig)             │
│ + findImages(path: string, recursive?: boolean): Promise<string[]>           │
│ + analyzeImage(path, preset?, prompt?): Promise<ImageAnalysisResult>         │
│ + analyzeMultipleImages(path, recursive?, preset?): Promise<Results[]>       │
│ + saveAnalysisReport(result, outputDir?): Promise<string | null>             │
│ - getPreset(name?: string): EnhancementPreset                                │
│ - getAnalysisPrompt(preset: EnhancementPreset): string                       │
│ - getClassificationPrompt(): string                                          │
│ - getMimeType(filePath: string): MimeType                                    │
│ - parseClassification(text, parsed?): ImageClassification | undefined        │
│ - callProxyForAnalysis(base64, mime, prompt): Promise<{text?, error?}>       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ uses
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FileHandler (Static)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ - static readonly OUTPUT_DIR: string = 'nanobanana-output'                   │
│ - static readonly SEARCH_PATHS: string[]                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ + static ensureOutputDirectory(): string                                     │
│ + static findInputFile(filename: string): FileSearchResult                   │
│ + static generateFilename(prompt, format?, index?): string                   │
│ + static saveImageFromBase64(data, outputPath, filename): Promise<string>    │
│ + static readImageAsBase64(filePath: string): Promise<string>                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Sequence Diagrams

### 4.1 Single Image Enhancement Flow

```
┌──────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│Client│     │ImageEnhancer│     │ImageAnalyzer│     │FileHandler│     │Gemini API│
└──┬───┘     └──────┬──────┘     └──────┬──────┘     └─────┬─────┘     └────┬─────┘
   │                │                   │                  │                │
   │ enhanceImage() │                   │                  │                │
   │───────────────>│                   │                  │                │
   │                │                   │                  │                │
   │                │ analyzeImage()    │                  │                │
   │                │──────────────────>│                  │                │
   │                │                   │                  │                │
   │                │                   │ readImageAsBase64│                │
   │                │                   │─────────────────>│                │
   │                │                   │<─────────────────│                │
   │                │                   │                  │                │
   │                │                   │ POST /v1beta/models/gemini-2.5-flash:generateContent
   │                │                   │─────────────────────────────────>│
   │                │                   │<─────────────────────────────────│
   │                │                   │                  │   (analysis)  │
   │                │                   │                  │                │
   │                │<──────────────────│                  │                │
   │                │   (AnalysisResult)│                  │                │
   │                │                   │                  │                │
   │                │ buildEnhancementPrompt()             │                │
   │                │──────────────────────┐               │                │
   │                │<─────────────────────┘               │                │
   │                │                   │                  │                │
   │                │ readImageAsBase64 │                  │                │
   │                │─────────────────────────────────────>│                │
   │                │<─────────────────────────────────────│                │
   │                │                   │                  │                │
   │                │ POST /v1beta/models/gemini-2.5-flash-image:generateContent
   │                │─────────────────────────────────────────────────────>│
   │                │<─────────────────────────────────────────────────────│
   │                │                   │                  │  (image data) │
   │                │                   │                  │                │
   │                │ getCategoryOutputPath()              │                │
   │                │──────────────────────┐               │                │
   │                │<─────────────────────┘               │                │
   │                │                   │                  │                │
   │                │ saveImageFromBase64                  │                │
   │                │─────────────────────────────────────>│                │
   │                │<─────────────────────────────────────│                │
   │                │                   │                  │ (saved path)  │
   │                │                   │                  │                │
   │<───────────────│                   │                  │                │
   │ ProcessedImage │                   │                  │                │
```

### 4.2 Batch Processing Flow

```
┌──────┐     ┌─────────────┐     ┌─────────────┐
│Client│     │ImageEnhancer│     │ImageAnalyzer│
└──┬───┘     └──────┬──────┘     └──────┬──────┘
   │                │                   │
   │ processImages()│                   │
   │───────────────>│                   │
   │                │                   │
   │                │ findImages()      │
   │                │──────────────────>│
   │                │<──────────────────│
   │                │   (image list)    │
   │                │                   │
   │                │                   │
   │                │   ┌───────────────────────────────┐
   │                │   │ FOR EACH BATCH (concurrency N)│
   │                │   └───────────────────────────────┘
   │                │                   │
   │                │   ┌───────────────────────────────┐
   │                │   │ IF analyzeOnly:               │
   │                │   │   Promise.all(analyzeImage()) │
   │                │   │ ELSE:                         │
   │                │   │   Promise.all(enhanceImage()) │
   │                │   └───────────────────────────────┘
   │                │                   │
   │                │   ┌───────────────────────────────┐
   │                │   │ Collect results, track errors │
   │                │   └───────────────────────────────┘
   │                │                   │
   │                │                   │
   │<───────────────│                   │
   │ImageEnhancement│                   │
   │   Response     │                   │
```

### 4.3 Configuration Loading Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   loadConfig(configPath?)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Try paths in order:           │
              │ 1. configPath (if provided)   │
              │ 2. ./enhancement-config.json  │
              │ 3. ../enhancement-config.json │
              │    (relative to module)       │
              └───────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  File Found?    │           │ No File Found   │
    │ Return parsed   │           │ Return default  │
    │ JSON config     │           │ embedded config │
    └─────────────────┘           └─────────────────┘
```

---

## 5. Dependency Injection Pattern

The system uses **Constructor Injection** for its dependencies:

```typescript
// AuthConfig is injected to provide API credentials
// EnhancementConfig is injected to provide settings

class ImageEnhancer {
  private analyzer: ImageAnalyzer;

  constructor(authConfig: AuthConfig, config: EnhancementConfig) {
    // Dependencies injected through constructor
    this.config = config;
    // Composition: ImageEnhancer creates and owns ImageAnalyzer
    this.analyzer = new ImageAnalyzer(authConfig, config);
  }
}

class ImageAnalyzer {
  constructor(authConfig: AuthConfig, config: EnhancementConfig) {
    // Same auth and config injected
    this.config = config;
    // Uses static FileHandler - no injection needed
  }
}
```

### Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                         Entry Point                               │
│                    (index.ts / MCP Tool)                          │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              │ creates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AuthConfig                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ apiKey: string (from env or config)                       │   │
│  │ keyType: 'GEMINI_API_KEY' | 'GOOGLE_API_KEY' | 'LOCAL_PROXY'│ │
│  │ baseUrl?: string (for local proxy)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ injected into
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ImageEnhancer                              │
│  ├── Owns: ImageAnalyzer (composition)                          │
│  ├── Uses: FileHandler (static dependency)                      │
│  └── Uses: EnhancementConfig (injected)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Interface Definitions

### 6.1 Authentication Types

```typescript
interface AuthConfig {
  apiKey: string;
  keyType: "GEMINI_API_KEY" | "GOOGLE_API_KEY" | "LOCAL_PROXY";
  baseUrl?: string; // Required when keyType is 'LOCAL_PROXY'
}
```

### 6.2 Configuration Types

```typescript
interface EnhancementConfig {
  version: string;
  activePreset: string;
  globalSettings: {
    analyzerModel: string; // e.g., 'gemini-2.5-flash'
    enhancerModel: string; // e.g., 'gemini-2.5-flash-image'
    outputFormat: "png" | "jpeg";
    maxConcurrentImages: number; // Batch concurrency
    saveAnalysisReport: boolean;
    organizeByCategory?: boolean; // Enable category folders
    locale: string; // e.g., 'vi-VN'
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
  name: string; // English name
  nameVi: string; // Vietnamese name
  keywords: string[]; // Classification keywords
  folderName: string; // Output folder name
}

interface EnhancementPreset {
  name: string;
  description: string;
  systemPrompt: {
    analysis: string;
    enhancement: string;
  };
  enhancementRules: EnhancementRules;
}

interface EnhancementRules {
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

### 6.3 Request/Response Types

```typescript
interface ImageEnhancementRequest {
  inputPath: string; // Required: file or directory
  outputPath?: string; // Optional: custom output
  preset?: string; // Preset name
  customAnalysisPrompt?: string;
  customEnhancementPrompt?: string;
  recursive?: boolean; // Search subdirectories
  preview?: boolean; // Auto-open result
  noPreview?: boolean; // Suppress preview
  analyzeOnly?: boolean; // Skip enhancement
}

interface ImageEnhancementResponse {
  success: boolean;
  message: string;
  processedImages: ProcessedImage[];
  errors?: string[];
}

interface ProcessedImage {
  originalPath: string;
  enhancedPath?: string; // Path to enhanced image
  analysisPath?: string; // Path to analysis JSON
  analysis?: Record<string, unknown>;
  error?: string;
}
```

### 6.4 Analysis Types

```typescript
interface ImageAnalysisResult {
  success: boolean;
  imagePath: string;
  analysis?: Record<string, unknown>; // Parsed JSON
  rawAnalysis?: string; // Raw text response
  classification?: ImageClassification;
  error?: string;
}

type ImageCategory =
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

interface ImageClassification {
  category: ImageCategory;
  confidence: number; // 0.0 - 1.0
  subcategory?: string;
  tags?: string[];
}
```

---

## 7. Data Flow

### 7.1 Complete Processing Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│  1. INPUT VALIDATION                 │
│  ├── Check file/directory exists     │
│  ├── Validate file extensions        │
│  └── Build image list                │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  2. LOAD CONFIGURATION               │
│  ├── Load config file                │
│  ├── Get active preset               │
│  └── Initialize modules              │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  3. FOR EACH IMAGE (batch)           │
│  └── Process up to N concurrent      │
└────────────────┬─────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼                       ▼
┌─────────────┐       ┌─────────────┐
│  Image 1    │       │  Image 2    │  ... (concurrent)
└──────┬──────┘       └──────┬──────┘
       │                     │
       ▼                     ▼
┌──────────────────────────────────────┐
│  4. ANALYZE IMAGE                    │
│  ├── Read image as base64            │
│  ├── Build analysis prompt           │
│  │   ├── Preset analysis prompt      │
│  │   └── Classification prompt       │
│  ├── Call Gemini Flash API           │
│  │   POST /v1beta/models/gemini-2.5-flash:generateContent
│  │   {                               │
│  │     contents: [{ parts: [         │
│  │       { text: prompt },           │
│  │       { inline_data: { base64 }}  │
│  │     ]}],                          │
│  │     generationConfig: {           │
│  │       responseModalities: ["TEXT"]│
│  │     }                             │
│  │   }                               │
│  ├── Parse JSON response             │
│  └── Extract classification          │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  5. BUILD ENHANCEMENT PROMPT         │
│  ├── Include analysis results        │
│  ├── Apply enhancement rules         │
│  │   ├── addPeopleIfEmpty            │
│  │   ├── peopleEthnicity             │
│  │   ├── colorEnhancement            │
│  │   └── lightingStyle               │
│  └── Add preset enhancement prompt   │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  6. ENHANCE IMAGE                    │
│  ├── Call Gemini Flash-Image API     │
│  │   POST /v1beta/models/gemini-2.5-flash-image:generateContent
│  │   {                               │
│  │     contents: [{ parts: [         │
│  │       { text: enhancement_prompt },│
│  │       { inline_data: { base64 }}  │
│  │     ]}],                          │
│  │     generationConfig: {           │
│  │       responseModalities: ["TEXT", "IMAGE"]
│  │     }                             │
│  │   }                               │
│  └── Extract image from response     │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  7. SAVE OUTPUT                      │
│  ├── Determine category folder       │
│  ├── Create folder if needed         │
│  ├── Generate filename               │
│  ├── Save enhanced image             │
│  └── Save analysis report (optional) │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  8. AGGREGATE RESULTS                │
│  ├── Collect all processed images    │
│  ├── Count success/failures          │
│  └── Generate summary                │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────┐
│   END    │
└──────────┘
```

---

## 8. Deployment Architecture

### 8.1 With Local Proxy (Required for Enhancement)

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Image Enhancement Module                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐    │    │
│  │  │ImageAnalyzer │  │ImageEnhancer │  │FileHandler│    │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  Configuration  │                          │
│                    │      File       │                          │
│                    └─────────────────┘                          │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ HTTP (localhost)
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL PROXY                                   │
│                  (e.g., CLIProxyAPI)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • API Key Management                                     │   │
│  │  • Request Caching                                        │   │
│  │  • Rate Limiting                                          │   │
│  │  • Logging & Debugging                                    │   │
│  │  • Model Discovery (/v1/models endpoint)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI API                                    │
│  ┌──────────────────────┐  ┌───────────────────────────┐        │
│  │  gemini-2.5-flash    │  │  gemini-2.5-flash-image   │        │
│  │  (Text + Vision)     │  │  (Image Generation)       │        │
│  └──────────────────────┘  └───────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Environment Variables

```bash
# Required for local proxy mode
OPENAI_API_BASE="http://localhost:8080"
OPENAI_API_KEY="your-proxy-key"

# Optional: Override default models
NANOBANANA_ANALYZER_MODEL="gemini-2.5-flash"
NANOBANANA_ENHANCER_MODEL="gemini-2.5-flash-image"
```

---

## 9. Error Handling Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Input Validation                                       │
│  ├── File not found → Return error immediately                   │
│  ├── Invalid format → Skip file, continue batch                  │
│  └── Empty directory → Return "no images found"                  │
│                                                                  │
│  Layer 2: API Errors                                             │
│  ├── Network timeout → Return error (no retry built-in)          │
│  ├── Rate limit (429) → Return error                             │
│  ├── Auth error (401) → Return config error                      │
│  └── Server error (5xx) → Return error                           │
│                                                                  │
│  Layer 3: Processing Errors                                      │
│  ├── Analysis failed → Skip enhancement, log error               │
│  ├── No image in response → Return error for image               │
│  ├── Classification failed → Default to "other"                  │
│  └── Save failed → Return error with details                     │
│                                                                  │
│  Layer 4: Aggregation                                            │
│  ├── Partial success → Return success with error list            │
│  ├── All failed → Return failure with all errors                 │
│  └── All success → Return success                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Scalability Considerations

### 10.1 Batch Processing Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONCURRENCY MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Configuration:                                                  │
│  └── maxConcurrentImages: number (default: 3)                    │
│                                                                  │
│  Processing Pattern:                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Images: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]                │    │
│  │                                                          │    │
│  │  Batch 1: Promise.all([1, 2, 3]) → wait                 │    │
│  │  Batch 2: Promise.all([4, 5, 6]) → wait                 │    │
│  │  Batch 3: Promise.all([7, 8, 9]) → wait                 │    │
│  │  Batch 4: Promise.all([10])      → wait                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Benefits:                                                       │
│  ├── Prevents API rate limiting                                  │
│  ├── Controls memory usage                                       │
│  └── Allows progress tracking per batch                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Memory Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY MANAGEMENT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Per-Image Memory Footprint:                                     │
│  ├── Original image (base64): ~1.37x file size                  │
│  ├── API response: Variable                                      │
│  └── Enhanced image (base64): ~1.37x output size                │
│                                                                  │
│  Strategy:                                                       │
│  ├── Process images sequentially within batches                  │
│  ├── Release memory after each image save                        │
│  └── Use streaming for large batch operations                    │
│                                                                  │
│  Recommended Limits:                                             │
│  ├── Single image: Up to 20MB                                    │
│  ├── Batch size: 3-5 concurrent for standard systems             │
│  └── Total batch: Monitor system memory                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Future Scalability Improvements

```
┌─────────────────────────────────────────────────────────────────┐
│               POTENTIAL ENHANCEMENTS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Queue-Based Processing                                       │
│     └── Use message queue for large batch jobs                   │
│                                                                  │
│  2. Worker Pool                                                  │
│     └── Distribute across multiple worker processes              │
│                                                                  │
│  3. Result Caching                                               │
│     └── Cache analysis results by image hash                     │
│                                                                  │
│  4. Retry Logic                                                  │
│     └── Exponential backoff for transient failures               │
│                                                                  │
│  5. Progress Callbacks                                           │
│     └── Real-time progress reporting for UI integration          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Key Management                                              │
│  ├── Store in environment variables                              │
│  ├── Never log or expose in responses                            │
│  └── Use local proxy for additional security                     │
│                                                                  │
│  Data Handling                                                   │
│  ├── Images processed in memory                                  │
│  ├── Only output files persisted                                 │
│  ├── No external data transmission (except API)                  │
│  └── Analysis reports contain no sensitive data                  │
│                                                                  │
│  Network Security                                                │
│  ├── HTTPS for all API communication                             │
│  ├── Local proxy on localhost only                               │
│  └── No incoming network connections required                    │
│                                                                  │
│  File System Security                                            │
│  ├── Output restricted to nanobanana-output/                     │
│  ├── No arbitrary file writes outside output dir                 │
│  └── Category folders created with standard permissions          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Component Interaction Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ImageEnhancer (Facade)                                          │
│  ├── Creates: ImageAnalyzer (at construction)                    │
│  ├── Uses: FileHandler.readImageAsBase64()                       │
│  ├── Uses: FileHandler.saveImageFromBase64()                     │
│  ├── Uses: FileHandler.ensureOutputDirectory()                   │
│  ├── Uses: FileHandler.generateFilename()                        │
│  └── Delegates: Analysis to ImageAnalyzer                        │
│                                                                  │
│  ImageAnalyzer                                                   │
│  ├── Uses: FileHandler.readImageAsBase64()                       │
│  ├── Uses: FileHandler.ensureOutputDirectory()                   │
│  └── Independent: Can be used standalone for analysis            │
│                                                                  │
│  FileHandler (Static Utility)                                    │
│  ├── No dependencies on other modules                            │
│  └── Purely utility functions                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                                                           |
| ------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2025-06-28 | Nanobanana Team | Initial Architecture                                                                                                                                              |
| 1.1.0   | 2025-06-28 | Nanobanana Team | Updated class diagrams to match implementation, added sequence diagrams, dependency injection patterns, scalability considerations, component interaction summary |
