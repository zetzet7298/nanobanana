/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Nanobanana Library - Shared Image Generation & Enhancement
 *
 * This module exports all core functionality for use as a library
 * while maintaining full MCP server compatibility.
 */

// Core classes
export { ImageGenerator } from "../imageGenerator.js";
export { ImageEnhancer } from "../imageEnhancer.js";
export { ImageAnalyzer } from "../imageAnalyzer.js";
export { FileHandler } from "../fileHandler.js";

// All types
export type {
  ImageGenerationRequest,
  ImageGenerationResponse,
  AuthConfig,
  FileSearchResult,
  StorySequenceArgs,
  IconPromptArgs,
  PatternPromptArgs,
  DiagramPromptArgs,
  EnhancementPreset,
  EnhancementRules,
  EnhancementConfig,
  ImageAnalysisResult,
  ImageEnhancementRequest,
  ImageEnhancementResponse,
  ProcessedImage,
  EnhanceImageArgs,
  AnalyzeImageArgs,
  ImageCategory,
  CategoryDefinition,
  ImageClassification,
  TranslationLanguage,
  TranslationContext,
  ImageTranslationRequest,
  ImageTranslationResponse,
} from "../types.js";
