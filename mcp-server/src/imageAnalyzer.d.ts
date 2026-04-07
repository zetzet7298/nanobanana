/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthConfig, EnhancementConfig, ImageAnalysisResult } from "./types.js";
export declare class ImageAnalyzer {
    private useLocalProxy;
    private localProxyBaseUrl;
    private localProxyApiKey;
    private config;
    private modelName;
    private static readonly IMAGE_EXTENSIONS;
    constructor(authConfig: AuthConfig, config: EnhancementConfig);
    private getPreset;
    private getAnalysisPrompt;
    private getClassificationPrompt;
    private parseClassification;
    findImages(inputPath: string, recursive?: boolean): Promise<string[]>;
    private getMimeType;
    analyzeImage(imagePath: string, presetName?: string, customPrompt?: string): Promise<ImageAnalysisResult>;
    private callProxyForAnalysis;
    analyzeMultipleImages(inputPath: string, recursive?: boolean, presetName?: string): Promise<ImageAnalysisResult[]>;
    saveAnalysisReport(result: ImageAnalysisResult, outputDir?: string): Promise<string | null>;
}
//# sourceMappingURL=imageAnalyzer.d.ts.map