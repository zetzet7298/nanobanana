/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import type {
  AuthConfig,
  EnhancementConfig,
  EnhancementPreset,
  ImageAnalysisResult,
  ImageCategory,
  ImageEnhancementRequest,
  ImageEnhancementResponse,
  ProcessedImage,
} from "./types.js";
import { FileHandler } from "./fileHandler.js";
import { ImageAnalyzer } from "./imageAnalyzer.js";

const execAsync = promisify(exec);

export class ImageEnhancer {
  private useLocalProxy: boolean = false;
  private useGrok2API: boolean = false;
  private localProxyBaseUrl: string = "";
  private localProxyApiKey: string = "";
  private config: EnhancementConfig;
  private analyzer: ImageAnalyzer;
  private modelName: string;

  constructor(authConfig: AuthConfig, config: EnhancementConfig) {
    if (authConfig.keyType === "GROK2API" && authConfig.baseUrl) {
      this.useGrok2API = true;
      this.localProxyBaseUrl = authConfig.baseUrl;
      this.localProxyApiKey = authConfig.apiKey;
      console.error(
        `DEBUG - ImageEnhancer using Grok2API at: ${this.localProxyBaseUrl}`,
      );
    } else if (authConfig.keyType === "LOCAL_PROXY" && authConfig.baseUrl) {
      this.useLocalProxy = true;
      // Remove /v1 suffix if present to use /v1beta/ Gemini endpoint
      this.localProxyBaseUrl = authConfig.baseUrl.replace(/\/v1\/?$/, "");
      this.localProxyApiKey = authConfig.apiKey;
      console.error(
        `DEBUG - ImageEnhancer using local proxy at: ${this.localProxyBaseUrl}`,
      );
    }
    this.config = config;
    this.analyzer = new ImageAnalyzer(authConfig, config);
    this.modelName =
      process.env.NANOBANANA_ENHANCER_MODEL ||
      config.globalSettings.enhancerModel ||
      "gemini-3-pro-image-preview";
    console.error(`DEBUG - ImageEnhancer using model: ${this.modelName}`);
  }

  private getPreset(presetName?: string): EnhancementPreset {
    const name = presetName || this.config.activePreset || "default";
    const preset = this.config.presets[name];
    if (!preset) {
      console.error(
        `DEBUG - Preset "${name}" not found, falling back to default`,
      );
      return this.config.presets["default"];
    }
    return preset;
  }

  private getEnhancementPrompt(preset: EnhancementPreset): string {
    if (
      this.config.customPrompts.enabled &&
      this.config.customPrompts.enhancementPrompt
    ) {
      return this.config.customPrompts.enhancementPrompt;
    }
    return preset.systemPrompt.enhancement;
  }

  private buildEnhancementPrompt(
    analysis: ImageAnalysisResult,
    preset: EnhancementPreset,
    customPrompt?: string,
  ): string {
    const basePrompt = customPrompt || this.getEnhancementPrompt(preset);
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

  private async fetchImageModelFromProxy(): Promise<string | null> {
    try {
      const response = await fetch(`${this.localProxyBaseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.localProxyApiKey}`,
        },
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { data?: Array<{ id: string }> };
      const models = data.data || [];
      const imageModel = models.find(
        (m: { id: string }) =>
          m.id.includes("image") ||
          m.id.includes("gemini-2.5-flash-preview-native-audio-dialog"),
      );
      return imageModel?.id || null;
    } catch {
      return null;
    }
  }

  private getMimeType(
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

  private async callProxyForEnhancement(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    temperature?: number,
  ): Promise<{ imageData?: string; error?: string }> {
    try {
      const proxyModel = await this.fetchImageModelFromProxy();
      const modelToUse =
        process.env.NANOBANANA_ENHANCER_MODEL || proxyModel || this.modelName;
      console.error(`DEBUG - Using model for enhancement: ${modelToUse}`);

      const generationConfig: {
        responseModalities: string[];
        temperature?: number;
      } = {
        responseModalities: ["TEXT", "IMAGE"],
      };
      if (temperature !== undefined) {
        generationConfig.temperature = temperature;
        console.error(`DEBUG - Enhancement using temperature: ${temperature}`);
      }

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig,
      };

      const response = await fetch(
        `${this.localProxyBaseUrl}/v1beta/models/${modelToUse}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.localProxyApiKey}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `DEBUG - Proxy API error: ${response.status} - ${errorText}`,
        );
        return { error: `Proxy API error: ${response.status}` };
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

      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            return { imageData: part.inlineData.data };
          }
          if (part.inline_data?.data) {
            return { imageData: part.inline_data.data };
          }
        }
      }

      return { error: "No image data in enhancement response" };
    } catch (error) {
      console.error("DEBUG - Error calling proxy for enhancement:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async callGrok2APIForEnhancement(
    imageBase64: string,
    mimeType: string,
    prompt: string,
    filename: string,
  ): Promise<{ imageData?: string; error?: string }> {
    try {
      const endpoint = `${this.localProxyBaseUrl}/v1/images/edits`;
      const formData = new FormData();
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const imageBlob = new Blob([imageBuffer], { type: mimeType });

      formData.append(
        "model",
        process.env.GROK_EDIT_MODEL || "grok-imagine-1.0-edit",
      );
      formData.append("prompt", prompt);
      formData.append("image", imageBlob, filename);
      formData.append("n", "1");
      formData.append("size", "1024x1024");
      formData.append("response_format", "b64_json");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.localProxyApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `DEBUG - Grok2API enhancement error: ${response.status} - ${errorText}`,
        );
        return { error: `Grok2API enhancement error: ${response.status}` };
      }

      const data = (await response.json()) as {
        data?: Array<{ b64_json?: string }>;
      };

      if (data.data?.[0]?.b64_json) {
        return { imageData: data.data[0].b64_json };
      }

      return { error: "No image data in Grok2API enhancement response" };
    } catch (error) {
      console.error("DEBUG - Error calling Grok2API for enhancement:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async openImagePreview(filePath: string): Promise<void> {
    try {
      const platform = process.platform;
      let command: string;

      switch (platform) {
        case "darwin":
          command = `open "${filePath}"`;
          break;
        case "win32":
          command = `start "" "${filePath}"`;
          break;
        default:
          command = `xdg-open "${filePath}"`;
          break;
      }

      await execAsync(command);
      console.error(`DEBUG - Opened preview for: ${filePath}`);
    } catch (error) {
      console.error(
        `DEBUG - Failed to open preview:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getCategoryOutputPath(category: ImageCategory): string {
    const baseOutput = FileHandler.ensureOutputDirectory();

    if (!this.config.globalSettings.organizeByCategory) {
      return baseOutput;
    }

    const categoryDef = this.config.categories?.[category];
    const folderName = categoryDef?.folderName || category;
    const categoryPath = path.join(baseOutput, folderName);

    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
      console.error(`DEBUG - Created category folder: ${categoryPath}`);
    }

    return categoryPath;
  }

  async enhanceImage(
    imagePath: string,
    presetName?: string,
    customEnhancementPrompt?: string,
  ): Promise<ProcessedImage> {
    const result: ProcessedImage = {
      originalPath: imagePath,
    };

    try {
      console.error(`DEBUG - Enhancing image: ${imagePath}`);

      if (!fs.existsSync(imagePath)) {
        result.error = `Image file not found: ${imagePath}`;
        return result;
      }

      const preset = this.getPreset(presetName);
      const analysis = await this.analyzer.analyzeImage(imagePath, presetName);

      if (!analysis.success) {
        result.error = `Analysis failed: ${analysis.error}`;
        return result;
      }

      result.analysis = analysis.analysis;

      if (this.config.globalSettings.saveAnalysisReport) {
        const reportPath = await this.analyzer.saveAnalysisReport(analysis);
        if (reportPath) {
          result.analysisPath = reportPath;
        }
      }

      if (!this.useLocalProxy && !this.useGrok2API) {
        result.error =
          "Direct API not supported for enhancement. Please use local proxy or Grok2API.";
        return result;
      }

      const enhancementPrompt = this.buildEnhancementPrompt(
        analysis,
        preset,
        customEnhancementPrompt,
      );

      const imageBase64 = await FileHandler.readImageAsBase64(imagePath);
      const mimeType = this.getMimeType(imagePath);
      const filename = path.basename(imagePath);

      const enhanceResult = this.useGrok2API
        ? await this.callGrok2APIForEnhancement(
            imageBase64,
            mimeType,
            enhancementPrompt,
            filename,
          )
        : await this.callProxyForEnhancement(
            imageBase64,
            mimeType,
            enhancementPrompt,
          );

      if (enhanceResult.error) {
        result.error = enhanceResult.error;
        return result;
      }

      if (enhanceResult.imageData) {
        const category = analysis.classification?.category || "other";
        const outputPath = this.getCategoryOutputPath(category);
        const baseName = path.basename(imagePath, path.extname(imagePath));
        const outputFilename = FileHandler.generateFilename(
          `enhanced_${baseName}`,
          this.config.globalSettings.outputFormat || "png",
          0,
        );
        const fullPath = await FileHandler.saveImageFromBase64(
          enhanceResult.imageData,
          outputPath,
          outputFilename,
        );
        result.enhancedPath = fullPath;
        console.error(
          `DEBUG - Enhanced image saved to: ${fullPath} (category: ${category})`,
        );
      }

      return result;
    } catch (error) {
      console.error(`DEBUG - Error enhancing image ${imagePath}:`, error);
      result.error = error instanceof Error ? error.message : String(error);
      return result;
    }
  }

  async processImages(
    request: ImageEnhancementRequest,
  ): Promise<ImageEnhancementResponse> {
    const response: ImageEnhancementResponse = {
      success: false,
      message: "",
      processedImages: [],
      errors: [],
    };

    try {
      const images = await this.analyzer.findImages(
        request.inputPath,
        request.recursive,
      );

      if (images.length === 0) {
        response.message = `No images found in: ${request.inputPath}`;
        return response;
      }

      console.error(
        `DEBUG - Processing ${images.length} images with preset: ${request.preset || "default"}`,
      );

      const concurrency = this.config.globalSettings.maxConcurrentImages || 3;

      for (let i = 0; i < images.length; i += concurrency) {
        const batch = images.slice(i, i + concurrency);

        let batchResults: ProcessedImage[];

        if (request.analyzeOnly) {
          const analysisResults = await Promise.all(
            batch.map((img) => this.analyzer.analyzeImage(img, request.preset)),
          );

          batchResults = await Promise.all(
            analysisResults.map(async (analysis) => {
              const processed: ProcessedImage = {
                originalPath: analysis.imagePath,
                analysis: analysis.analysis,
              };

              if (
                analysis.success &&
                this.config.globalSettings.saveAnalysisReport
              ) {
                const reportPath =
                  await this.analyzer.saveAnalysisReport(analysis);
                if (reportPath) {
                  processed.analysisPath = reportPath;
                }
              }

              if (!analysis.success) {
                processed.error = analysis.error;
              }

              return processed;
            }),
          );
        } else {
          batchResults = await Promise.all(
            batch.map((img) =>
              this.enhanceImage(
                img,
                request.preset,
                request.customEnhancementPrompt,
              ),
            ),
          );
        }

        response.processedImages.push(...batchResults);
      }

      response.errors = response.processedImages
        .filter((img) => img.error)
        .map((img) => `${img.originalPath}: ${img.error}`);

      const successCount = response.processedImages.filter(
        (img) => !img.error,
      ).length;

      response.success = successCount > 0;
      response.message = request.analyzeOnly
        ? `Analyzed ${successCount} images successfully${response.errors.length > 0 ? `, ${response.errors.length} failed` : ""}`
        : `Enhanced ${successCount} images successfully${response.errors.length > 0 ? `, ${response.errors.length} failed` : ""}`;

      if (request.preview && !request.analyzeOnly) {
        const previewFiles = response.processedImages
          .filter((img) => img.enhancedPath)
          .map((img) => img.enhancedPath!);

        if (previewFiles.length > 0) {
          await Promise.all(
            previewFiles.map((file) => this.openImagePreview(file)),
          );
        }
      }

      return response;
    } catch (error) {
      console.error("DEBUG - Error processing images:", error);
      response.message = `Failed to process images: ${error instanceof Error ? error.message : String(error)}`;
      return response;
    }
  }

  static loadConfig(configPath?: string): EnhancementConfig {
    const defaultPath = path.join(__dirname, "..", "enhancement-config.json");
    const targetPath = configPath || defaultPath;

    try {
      const raw = fs.readFileSync(targetPath, "utf-8");
      return JSON.parse(raw) as EnhancementConfig;
    } catch (error) {
      console.error(`DEBUG - Failed to load config from ${targetPath}:`, error);
      throw new Error(`Enhancement config not found or invalid: ${targetPath}`);
    }
  }
}
