/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from "fs";
import * as path from "path";
import { FileHandler } from "./fileHandler.js";
export class ImageAnalyzer {
    useLocalProxy = false;
    localProxyBaseUrl = "";
    localProxyApiKey = "";
    config;
    modelName;
    static IMAGE_EXTENSIONS = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
    ];
    constructor(authConfig, config) {
        if (authConfig.keyType === "LOCAL_PROXY" && authConfig.baseUrl) {
            this.useLocalProxy = true;
            // Remove /v1 suffix if present to use /v1beta/ Gemini endpoint
            this.localProxyBaseUrl = authConfig.baseUrl.replace(/\/v1\/?$/, "");
            this.localProxyApiKey = authConfig.apiKey;
            console.error(`DEBUG - ImageAnalyzer using local proxy at: ${this.localProxyBaseUrl}`);
        }
        this.config = config;
        this.modelName =
            process.env.NANOBANANA_ANALYZER_MODEL ||
                config.globalSettings.analyzerModel ||
                "gemini-2.5-flash";
        console.error(`DEBUG - ImageAnalyzer using model: ${this.modelName}`);
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
    getAnalysisPrompt(preset) {
        if (this.config.customPrompts.enabled &&
            this.config.customPrompts.analysisPrompt) {
            return this.config.customPrompts.analysisPrompt;
        }
        return preset.systemPrompt.analysis;
    }
    getClassificationPrompt() {
        const categories = this.config.categories
            ? Object.keys(this.config.categories)
            : [
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
        return `
QUAN TRỌNG: Ngoài việc phân tích, bạn PHẢI phân loại ảnh này vào MỘT trong các category sau:
${categories.map((c) => `- ${c}`).join("\n")}

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
    parseClassification(analysisText, parsedAnalysis) {
        try {
            if (parsedAnalysis?.classification &&
                typeof parsedAnalysis.classification === "object") {
                const cls = parsedAnalysis.classification;
                if (cls.category && typeof cls.category === "string") {
                    return {
                        category: cls.category,
                        confidence: typeof cls.confidence === "number" ? cls.confidence : 0.8,
                        subcategory: typeof cls.subcategory === "string" ? cls.subcategory : undefined,
                        tags: Array.isArray(cls.tags) ? cls.tags : undefined,
                    };
                }
            }
            const categoryMatch = analysisText.match(/"category"\s*:\s*"([^"]+)"/i);
            if (categoryMatch) {
                const confidenceMatch = analysisText.match(/"confidence"\s*:\s*([\d.]+)/i);
                const subcategoryMatch = analysisText.match(/"subcategory"\s*:\s*"([^"]+)"/i);
                return {
                    category: categoryMatch[1],
                    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8,
                    subcategory: subcategoryMatch ? subcategoryMatch[1] : undefined,
                };
            }
            return { category: "other", confidence: 0.5 };
        }
        catch {
            console.error("DEBUG - Failed to parse classification");
            return { category: "other", confidence: 0.5 };
        }
    }
    async findImages(inputPath, recursive = false) {
        const images = [];
        const absolutePath = path.isAbsolute(inputPath)
            ? inputPath
            : path.join(process.cwd(), inputPath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`DEBUG - Path not found: ${absolutePath}`);
            return images;
        }
        const stats = fs.statSync(absolutePath);
        if (stats.isFile()) {
            const ext = path.extname(absolutePath).toLowerCase();
            if (ImageAnalyzer.IMAGE_EXTENSIONS.includes(ext)) {
                images.push(absolutePath);
            }
        }
        else if (stats.isDirectory()) {
            const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(absolutePath, entry.name);
                if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (ImageAnalyzer.IMAGE_EXTENSIONS.includes(ext)) {
                        images.push(fullPath);
                    }
                }
                else if (entry.isDirectory() && recursive) {
                    const subImages = await this.findImages(fullPath, true);
                    images.push(...subImages);
                }
            }
        }
        console.error(`DEBUG - Found ${images.length} images in ${absolutePath}`);
        return images;
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
    async analyzeImage(imagePath, presetName, customPrompt) {
        try {
            console.error(`DEBUG - Analyzing image: ${imagePath}`);
            if (!fs.existsSync(imagePath)) {
                return {
                    success: false,
                    imagePath,
                    error: `Image file not found: ${imagePath}`,
                };
            }
            const preset = this.getPreset(presetName);
            const basePrompt = customPrompt || this.getAnalysisPrompt(preset);
            const classificationPrompt = this.getClassificationPrompt();
            const analysisPrompt = `${basePrompt}\n\n${classificationPrompt}`;
            const imageBase64 = await FileHandler.readImageAsBase64(imagePath);
            const mimeType = this.getMimeType(imagePath);
            let analysisText;
            if (this.useLocalProxy) {
                const result = await this.callProxyForAnalysis(imageBase64, mimeType, analysisPrompt);
                if (result.error) {
                    return {
                        success: false,
                        imagePath,
                        error: result.error,
                    };
                }
                analysisText = result.text;
            }
            else {
                return {
                    success: false,
                    imagePath,
                    error: "Direct API not supported for analysis. Please use local proxy (OPENAI_API_BASE + OPENAI_API_KEY)",
                };
            }
            if (!analysisText) {
                return {
                    success: false,
                    imagePath,
                    error: "No analysis text received from API",
                };
            }
            let parsedAnalysis;
            try {
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedAnalysis = JSON.parse(jsonMatch[0]);
                }
            }
            catch {
                console.error("DEBUG - Could not parse JSON from analysis, using raw text");
            }
            const classification = this.parseClassification(analysisText, parsedAnalysis);
            console.error(`DEBUG - Image classified as: ${classification?.category} (confidence: ${classification?.confidence})`);
            return {
                success: true,
                imagePath,
                analysis: parsedAnalysis,
                rawAnalysis: analysisText,
                classification,
            };
        }
        catch (error) {
            console.error(`DEBUG - Error analyzing image ${imagePath}:`, error);
            return {
                success: false,
                imagePath,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async callProxyForAnalysis(imageBase64, mimeType, prompt) {
        try {
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
                    responseModalities: ["TEXT"],
                },
            };
            const response = await fetch(`${this.localProxyBaseUrl}/v1beta/models/${this.modelName}:generateContent`, {
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
                    if (part.text) {
                        return { text: part.text };
                    }
                }
            }
            return { error: "No text response from analysis API" };
        }
        catch (error) {
            console.error("DEBUG - Error calling proxy for analysis:", error);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
    async analyzeMultipleImages(inputPath, recursive = false, presetName) {
        const images = await this.findImages(inputPath, recursive);
        const results = [];
        const concurrency = this.config.globalSettings.maxConcurrentImages || 3;
        console.error(`DEBUG - Analyzing ${images.length} images with concurrency ${concurrency}`);
        for (let i = 0; i < images.length; i += concurrency) {
            const batch = images.slice(i, i + concurrency);
            const batchResults = await Promise.all(batch.map((img) => this.analyzeImage(img, presetName)));
            results.push(...batchResults);
            console.error(`DEBUG - Analyzed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(images.length / concurrency)}`);
        }
        return results;
    }
    async saveAnalysisReport(result, outputDir) {
        if (!result.success || !result.analysis) {
            return null;
        }
        const outputPath = outputDir || FileHandler.ensureOutputDirectory();
        const baseName = path.basename(result.imagePath, path.extname(result.imagePath));
        const reportPath = path.join(outputPath, `${baseName}_analysis.json`);
        const report = {
            imagePath: result.imagePath,
            analyzedAt: new Date().toISOString(),
            analysis: result.analysis,
            rawAnalysis: result.rawAnalysis,
        };
        await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.error(`DEBUG - Analysis report saved to: ${reportPath}`);
        return reportPath;
    }
}
//# sourceMappingURL=imageAnalyzer.js.map