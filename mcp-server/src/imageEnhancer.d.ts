/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthConfig, EnhancementConfig, ImageEnhancementRequest, ImageEnhancementResponse, ProcessedImage } from "./types.js";
export declare class ImageEnhancer {
    private useLocalProxy;
    private localProxyBaseUrl;
    private localProxyApiKey;
    private config;
    private analyzer;
    private modelName;
    constructor(authConfig: AuthConfig, config: EnhancementConfig);
    private getPreset;
    private getEnhancementPrompt;
    private buildEnhancementPrompt;
    private fetchImageModelFromProxy;
    private getMimeType;
    private callProxyForEnhancement;
    private openImagePreview;
    private getCategoryOutputPath;
    enhanceImage(imagePath: string, presetName?: string, customEnhancementPrompt?: string): Promise<ProcessedImage>;
    processImages(request: ImageEnhancementRequest): Promise<ImageEnhancementResponse>;
    static loadConfig(configPath?: string): EnhancementConfig;
    static getDefaultConfig(): EnhancementConfig;
}
//# sourceMappingURL=imageEnhancer.d.ts.map