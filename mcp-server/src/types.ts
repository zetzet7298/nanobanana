/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageGenerationRequest {
  prompt: string;
  inputImage?: string;
  outputCount?: number;
  mode: "generate" | "edit" | "restore";
  // Batch generation options
  styles?: string[];
  variations?: string[];
  format?: "grid" | "separate";
  fileFormat?: "png" | "jpeg";
  seed?: number;
  // Generation config
  temperature?: number; // 0.0-2.0, default 1.0 (recommended for Gemini 3)
  // Preview options
  preview?: boolean;
  noPreview?: boolean;
}

export interface ImageGenerationResponse {
  success: boolean;
  message: string;
  generatedFiles?: string[];
  error?: string;
}

export interface AuthConfig {
  apiKey: string;
  keyType: "GEMINI_API_KEY" | "GOOGLE_API_KEY" | "LOCAL_PROXY";
  baseUrl?: string;
}

export interface FileSearchResult {
  found: boolean;
  filePath?: string;
  searchedPaths: string[];
}

export interface StorySequenceArgs {
  type?: string;
  style?: string;
  transition?: string;
}

export interface IconPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  background?: string;
  corners?: string;
}

export interface PatternPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  density?: string;
  colors?: string;
  size?: string;
}

export interface DiagramPromptArgs {
  prompt?: string;
  type?: string;
  style?: string;
  layout?: string;
  complexity?: string;
  colors?: string;
  annotations?: string;
}

// ============================================
// Image Enhancement Types
// ============================================

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

export interface ImageAnalysisResult {
  success: boolean;
  imagePath: string;
  analysis?: Record<string, unknown>;
  rawAnalysis?: string;
  classification?: ImageClassification;
  error?: string;
}

export interface ImageEnhancementRequest {
  inputPath: string;
  outputPath?: string;
  preset?: string;
  customAnalysisPrompt?: string;
  customEnhancementPrompt?: string;
  recursive?: boolean;
  preview?: boolean;
  noPreview?: boolean;
  analyzeOnly?: boolean;
}

export interface ImageEnhancementResponse {
  success: boolean;
  message: string;
  processedImages: ProcessedImage[];
  errors?: string[];
}

export interface ProcessedImage {
  originalPath: string;
  enhancedPath?: string;
  analysisPath?: string;
  analysis?: Record<string, unknown>;
  error?: string;
}

export interface EnhanceImageArgs {
  input: string;
  output?: string;
  preset?: string;
  recursive?: boolean;
  analyzeOnly?: boolean;
  preview?: boolean;
}

export interface AnalyzeImageArgs {
  input: string;
  preset?: string;
  recursive?: boolean;
}

// ============================================
// Image Classification Types
// ============================================

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

// ============================================
// Image Translation Types
// ============================================

export type TranslationLanguage =
  | "auto"
  | "zh"
  | "en"
  | "vi"
  | "ja"
  | "ko"
  | "th"
  | "id"
  | "ms"
  | "fr"
  | "de"
  | "es"
  | "pt"
  | "ru"
  | "ar";

export type TranslationContext =
  | "general"
  | "comic"
  | "game"
  | "document"
  | "menu"
  | "signage"
  | "product"
  | "ui"
  | "social";

export interface ImageTranslationRequest {
  inputImage: string;
  sourceLanguage?: TranslationLanguage;
  targetLanguage: TranslationLanguage;
  context?: TranslationContext;
  temperature?: number;
  preview?: boolean;
  noPreview?: boolean;
}

export interface ImageTranslationResponse {
  success: boolean;
  message: string;
  generatedFiles?: string[];
  error?: string;
}
