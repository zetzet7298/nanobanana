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
import { FileHandler } from "./fileHandler.js";
import { ImageAnalyzer } from "./imageAnalyzer.js";
const execAsync = promisify(exec);
export class ImageEnhancer {
    useLocalProxy = false;
    localProxyBaseUrl = "";
    localProxyApiKey = "";
    config;
    analyzer;
    modelName;
    constructor(authConfig, config) {
        if (authConfig.keyType === "LOCAL_PROXY" && authConfig.baseUrl) {
            this.useLocalProxy = true;
            // Remove /v1 suffix if present to use /v1beta/ Gemini endpoint
            this.localProxyBaseUrl = authConfig.baseUrl.replace(/\/v1\/?$/, "");
            this.localProxyApiKey = authConfig.apiKey;
            console.error(`DEBUG - ImageEnhancer using local proxy at: ${this.localProxyBaseUrl}`);
        }
        this.config = config;
        this.analyzer = new ImageAnalyzer(authConfig, config);
        this.modelName =
            process.env.NANOBANANA_ENHANCER_MODEL ||
                config.globalSettings.enhancerModel ||
                "gemini-3-pro-image-preview";
        console.error(`DEBUG - ImageEnhancer using model: ${this.modelName}`);
    }
    getPreset(presetName) {
        const name = presetName || this.config.activePreset || "default";
        const preset = this.config.presets[name];
        if (!preset) {
            console.error(`DEBUG - Preset "${name}" not found, falling back to default`);
            return this.config.presets["default"];
        }
        return preset;
    }
    getEnhancementPrompt(preset) {
        if (this.config.customPrompts.enabled &&
            this.config.customPrompts.enhancementPrompt) {
            return this.config.customPrompts.enhancementPrompt;
        }
        return preset.systemPrompt.enhancement;
    }
    buildEnhancementPrompt(analysis, preset, customPrompt) {
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
    async fetchImageModelFromProxy() {
        try {
            const response = await fetch(`${this.localProxyBaseUrl}/v1/models`, {
                headers: {
                    Authorization: `Bearer ${this.localProxyApiKey}`,
                },
            });
            if (!response.ok) {
                return null;
            }
            const data = (await response.json());
            const models = data.data || [];
            const imageModel = models.find((m) => m.id.includes("image") ||
                m.id.includes("gemini-2.5-flash-preview-native-audio-dialog"));
            return imageModel?.id || null;
        }
        catch {
            return null;
        }
    }
    getMimeType(filePath) {
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
    async callProxyForEnhancement(imageBase64, mimeType, prompt) {
        try {
            const proxyModel = await this.fetchImageModelFromProxy();
            const modelToUse = process.env.NANOBANANA_ENHANCER_MODEL || proxyModel || this.modelName;
            console.error(`DEBUG - Using model for enhancement: ${modelToUse}`);
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
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                },
            };
            const response = await fetch(`${this.localProxyBaseUrl}/v1beta/models/${modelToUse}:generateContent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.localProxyApiKey}`,
                },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`DEBUG - Proxy API error: ${response.status} - ${errorText}`);
                return { error: `Proxy API error: ${response.status}` };
            }
            const data = (await response.json());
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
        }
        catch (error) {
            console.error("DEBUG - Error calling proxy for enhancement:", error);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
    async openImagePreview(filePath) {
        try {
            const platform = process.platform;
            let command;
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
        }
        catch (error) {
            console.error(`DEBUG - Failed to open preview:`, error instanceof Error ? error.message : String(error));
        }
    }
    getCategoryOutputPath(category) {
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
    async enhanceImage(imagePath, presetName, customEnhancementPrompt) {
        const result = {
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
            if (!this.useLocalProxy) {
                result.error =
                    "Direct API not supported for enhancement. Please use local proxy.";
                return result;
            }
            const enhancementPrompt = this.buildEnhancementPrompt(analysis, preset, customEnhancementPrompt);
            const imageBase64 = await FileHandler.readImageAsBase64(imagePath);
            const mimeType = this.getMimeType(imagePath);
            const enhanceResult = await this.callProxyForEnhancement(imageBase64, mimeType, enhancementPrompt);
            if (enhanceResult.error) {
                result.error = enhanceResult.error;
                return result;
            }
            if (enhanceResult.imageData) {
                const category = analysis.classification?.category || "other";
                const outputPath = this.getCategoryOutputPath(category);
                const baseName = path.basename(imagePath, path.extname(imagePath));
                const filename = FileHandler.generateFilename(`enhanced_${baseName}`, this.config.globalSettings.outputFormat || "png", 0);
                const fullPath = await FileHandler.saveImageFromBase64(enhanceResult.imageData, outputPath, filename);
                result.enhancedPath = fullPath;
                console.error(`DEBUG - Enhanced image saved to: ${fullPath} (category: ${category})`);
            }
            return result;
        }
        catch (error) {
            console.error(`DEBUG - Error enhancing image ${imagePath}:`, error);
            result.error = error instanceof Error ? error.message : String(error);
            return result;
        }
    }
    async processImages(request) {
        const response = {
            success: false,
            message: "",
            processedImages: [],
            errors: [],
        };
        try {
            const images = await this.analyzer.findImages(request.inputPath, request.recursive);
            if (images.length === 0) {
                response.message = `No images found in: ${request.inputPath}`;
                return response;
            }
            console.error(`DEBUG - Processing ${images.length} images with preset: ${request.preset || "default"}`);
            const concurrency = this.config.globalSettings.maxConcurrentImages || 3;
            for (let i = 0; i < images.length; i += concurrency) {
                const batch = images.slice(i, i + concurrency);
                let batchResults;
                if (request.analyzeOnly) {
                    const analysisResults = await Promise.all(batch.map((img) => this.analyzer.analyzeImage(img, request.preset)));
                    batchResults = await Promise.all(analysisResults.map(async (analysis) => {
                        const processed = {
                            originalPath: analysis.imagePath,
                            analysis: analysis.analysis,
                        };
                        if (analysis.success &&
                            this.config.globalSettings.saveAnalysisReport) {
                            const reportPath = await this.analyzer.saveAnalysisReport(analysis);
                            if (reportPath) {
                                processed.analysisPath = reportPath;
                            }
                        }
                        if (!analysis.success) {
                            processed.error = analysis.error;
                        }
                        return processed;
                    }));
                }
                else {
                    batchResults = await Promise.all(batch.map((img) => this.enhanceImage(img, request.preset, request.customEnhancementPrompt)));
                }
                response.processedImages.push(...batchResults);
                for (const result of batchResults) {
                    if (result.error) {
                        response.errors?.push(`${result.originalPath}: ${result.error}`);
                    }
                }
                console.error(`DEBUG - Processed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(images.length / concurrency)}`);
            }
            const successCount = response.processedImages.filter((p) => !p.error).length;
            const failCount = response.processedImages.length - successCount;
            response.success = successCount > 0;
            response.message = request.analyzeOnly
                ? `Analyzed ${successCount} images successfully${failCount > 0 ? `, ${failCount} failed` : ""}`
                : `Enhanced ${successCount} images successfully${failCount > 0 ? `, ${failCount} failed` : ""}`;
            if (request.preview && !request.noPreview) {
                for (const processed of response.processedImages) {
                    if (processed.enhancedPath) {
                        await this.openImagePreview(processed.enhancedPath);
                    }
                }
            }
            return response;
        }
        catch (error) {
            console.error("DEBUG - Error processing images:", error);
            response.message = error instanceof Error ? error.message : String(error);
            return response;
        }
    }
    static loadConfig(configPath) {
        const defaultConfigPath = path.join(process.cwd(), "enhancement-config.json");
        const mcpServerConfigPath = path.join(__dirname, "..", "enhancement-config.json");
        const pathsToTry = [
            configPath,
            defaultConfigPath,
            mcpServerConfigPath,
        ].filter(Boolean);
        for (const p of pathsToTry) {
            if (fs.existsSync(p)) {
                console.error(`DEBUG - Loading config from: ${p}`);
                const content = fs.readFileSync(p, "utf-8");
                return JSON.parse(content);
            }
        }
        console.error("DEBUG - Using default embedded config");
        return ImageEnhancer.getDefaultConfig();
    }
    static getDefaultConfig() {
        return {
            version: "1.0.0",
            activePreset: "default",
            globalSettings: {
                analyzerModel: "gemini-2.5-flash",
                enhancerModel: "gemini-2.5-flash-image",
                outputFormat: "png",
                maxConcurrentImages: 3,
                saveAnalysisReport: true,
                locale: "vi-VN",
            },
            presets: {
                default: {
                    name: "Default Enhancement",
                    description: "General purpose image enhancement",
                    systemPrompt: {
                        analysis: "Analyze this image in detail. Describe the subject, context, colors, composition, and mood. Return as JSON.",
                        enhancement: "Enhance this image based on the analysis. Add Asian people if empty, improve lighting and colors for marketing purposes.",
                    },
                    enhancementRules: {
                        addPeopleIfEmpty: true,
                        peopleEthnicity: "Asian",
                        peopleStyle: "natural, authentic",
                        colorEnhancement: "vibrant but natural",
                        lightingStyle: "natural daylight",
                    },
                },
            },
            customPrompts: {
                enabled: false,
                analysisPrompt: "",
                enhancementPrompt: "",
            },
        };
    }
}
//# sourceMappingURL=imageEnhancer.js.map