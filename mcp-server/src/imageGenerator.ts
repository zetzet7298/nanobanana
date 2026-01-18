/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { FileHandler } from "./fileHandler.js";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  AuthConfig,
  StorySequenceArgs,
  ImageTranslationRequest,
  ImageTranslationResponse,
  TranslationLanguage,
  TranslationContext,
} from "./types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ImageGenerator {
  private ai: GoogleGenAI | null = null;
  private modelName: string;
  private useLocalProxy: boolean = false;
  private localProxyBaseUrl: string = "";
  private localProxyApiKey: string = "";
  private static readonly DEFAULT_MODEL = "gemini-3-pro-image-preview";

  constructor(authConfig: AuthConfig) {
    if (authConfig.keyType === "LOCAL_PROXY" && authConfig.baseUrl) {
      this.useLocalProxy = true;
      this.localProxyBaseUrl = authConfig.baseUrl;
      this.localProxyApiKey = authConfig.apiKey;
      console.error(`DEBUG - Using local proxy at: ${this.localProxyBaseUrl}`);
    } else {
      this.ai = new GoogleGenAI({
        apiKey: authConfig.apiKey,
      });
    }
    this.modelName =
      process.env.NANOBANANA_MODEL || ImageGenerator.DEFAULT_MODEL;
    console.error(`DEBUG - Using image model: ${this.modelName}`);
  }

  private async fetchImageModelFromProxy(): Promise<string | null> {
    try {
      const response = await fetch(`${this.localProxyBaseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.localProxyApiKey}`,
        },
      });
      if (!response.ok) {
        console.error(`DEBUG - Failed to fetch models: ${response.status}`);
        return null;
      }
      const data = (await response.json()) as { data?: Array<{ id: string }> };
      const models = data.data || [];
      const imageModel = models.find(
        (m: { id: string }) =>
          m.id.includes("image") ||
          m.id.includes("gemini-2.5-flash-preview-native-audio-dialog"),
      );
      if (imageModel) {
        console.error(`DEBUG - Found image model from proxy: ${imageModel.id}`);
        return imageModel.id;
      }
      return null;
    } catch (error) {
      console.error("DEBUG - Error fetching models from proxy:", error);
      return null;
    }
  }

  private async callLocalProxyAPI(
    prompt: string,
    imageBase64?: string,
    temperature?: number,
  ): Promise<{ imageData?: string; error?: string }> {
    try {
      const proxyModel = await this.fetchImageModelFromProxy();
      const modelToUse = process.env.NANOBANANA_MODEL || proxyModel || this.modelName;
      console.error(`DEBUG - Using model for proxy call: ${modelToUse}`);

      const parts: Array<{
        text?: string;
        inline_data?: { mime_type: string; data: string };
      }> = [{ text: prompt }];
      if (imageBase64) {
        parts.push({
          inline_data: {
            mime_type: "image/png",
            data: imageBase64,
          },
        });
      }

      const generationConfig: {
        responseModalities: string[];
        temperature?: number;
      } = {
        responseModalities: ["TEXT", "IMAGE"],
      };
      if (temperature !== undefined) {
        generationConfig.temperature = temperature;
        console.error(`DEBUG - Using temperature: ${temperature}`);
      }

      const requestBody = {
        contents: [
          {
            role: "user",
            parts,
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
      console.error("DEBUG - Proxy response received");

      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            return { imageData: part.inlineData.data };
          }
          if (part.inline_data?.data) {
            return { imageData: part.inline_data.data };
          }
        }
      }

      return { error: "No image data in proxy response" };
    } catch (error) {
      console.error("DEBUG - Error calling local proxy:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async openImagePreview(filePath: string): Promise<void> {
    try {
      const platform = process.platform;
      let command: string;

      switch (platform) {
        case "darwin": // macOS
          command = `open "${filePath}"`;
          break;
        case "win32": // Windows
          command = `start "" "${filePath}"`;
          break;
        default: // Linux and others
          command = `xdg-open "${filePath}"`;
          break;
      }

      await execAsync(command);
      console.error(`DEBUG - Opened preview for: ${filePath}`);
    } catch (error: unknown) {
      console.error(
        `DEBUG - Failed to open preview for ${filePath}:`,
        error instanceof Error ? error.message : String(error),
      );
      // Don't throw - preview failure shouldn't break image generation
    }
  }

  private shouldAutoPreview(request: ImageGenerationRequest): boolean {
    // If --no-preview is explicitly set, never preview
    if (request.noPreview) {
      return false;
    }

    // Only preview when --preview flag is explicitly set
    if (request.preview) {
      return true;
    }

    // No auto-preview - images only open when explicitly requested
    return false;
  }

  private async handlePreview(
    files: string[],
    request: ImageGenerationRequest,
  ): Promise<void> {
    const shouldPreview = this.shouldAutoPreview(request);

    if (!shouldPreview || !files.length) {
      if (files.length > 1 && request.noPreview) {
        console.error(
          `DEBUG - Auto-preview disabled for ${files.length} images (--no-preview specified)`,
        );
      }
      return;
    }

    console.error(
      `DEBUG - ${request.preview ? "Explicit" : "Auto"}-opening ${files.length} image(s) for preview`,
    );

    // Open all generated images
    const previewPromises = files.map((file) => this.openImagePreview(file));
    await Promise.all(previewPromises);
  }

  static validateAuthentication(): AuthConfig {
    // Check for local proxy first (highest priority)
    const openaiApiBase = process.env.OPENAI_API_BASE;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiBase && openaiApiKey) {
      // Strip /v1 suffix if present - nanobanana uses /v1beta endpoints
      let baseUrl = openaiApiBase;
      if (baseUrl.endsWith("/v1")) {
        baseUrl = baseUrl.slice(0, -3);
        console.error(
          "✓ Found OPENAI_API_BASE + OPENAI_API_KEY (local proxy mode, stripped /v1 suffix)",
        );
      } else {
        console.error(
          "✓ Found OPENAI_API_BASE + OPENAI_API_KEY (local proxy mode)",
        );
      }
      return {
        apiKey: openaiApiKey,
        keyType: "LOCAL_PROXY",
        baseUrl,
      };
    }

    const nanoGeminiKey = process.env.NANOBANANA_GEMINI_API_KEY;
    if (nanoGeminiKey) {
      console.error("✓ Found NANOBANANA_GEMINI_API_KEY environment variable");
      return { apiKey: nanoGeminiKey, keyType: "GEMINI_API_KEY" };
    }

    const nanoGoogleKey = process.env.NANOBANANA_GOOGLE_API_KEY;
    if (nanoGoogleKey) {
      console.error("✓ Found NANOBANANA_GOOGLE_API_KEY environment variable");
      return { apiKey: nanoGoogleKey, keyType: "GOOGLE_API_KEY" };
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      console.error("✓ Found GEMINI_API_KEY environment variable (fallback)");
      return { apiKey: geminiKey, keyType: "GEMINI_API_KEY" };
    }

    const googleKey = process.env.GOOGLE_API_KEY;
    if (googleKey) {
      console.error("✓ Found GOOGLE_API_KEY environment variable (fallback)");
      return { apiKey: googleKey, keyType: "GOOGLE_API_KEY" };
    }

    throw new Error(
      "ERROR: No valid API key found. Please set one of:\n" +
        "  - OPENAI_API_BASE + OPENAI_API_KEY (for local proxy)\n" +
        "  - NANOBANANA_GEMINI_API_KEY\n" +
        "  - NANOBANANA_GOOGLE_API_KEY\n" +
        "  - GEMINI_API_KEY\n" +
        "  - GOOGLE_API_KEY\n" +
        "For more details on authentication, visit: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/authentication.md",
    );
  }

  private isValidBase64ImageData(data: string): boolean {
    // Check if data looks like base64 image data
    if (!data || data.length < 100) {
      return false; // Too short to be meaningful image data
    }

    // Check if it's valid base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(data)) {
      return false; // Not valid base64
    }

    // Additional check: base64 image data is typically quite long
    if (data.length < 1000) {
      console.error(
        "DEBUG - Skipping short data that may not be image:",
        data.length,
        "characters",
      );
      return false;
    }

    return true;
  }

  private buildBatchPrompts(request: ImageGenerationRequest): string[] {
    const prompts: string[] = [];
    const basePrompt = request.prompt;

    // If no batch options, return original prompt
    if (!request.styles && !request.variations && !request.outputCount) {
      return [basePrompt];
    }

    // Handle styles
    if (request.styles && request.styles.length > 0) {
      for (const style of request.styles) {
        prompts.push(`${basePrompt}, ${style} style`);
      }
    }

    // Handle variations
    if (request.variations && request.variations.length > 0) {
      const basePrompts = prompts.length > 0 ? prompts : [basePrompt];
      const variationPrompts: string[] = [];

      for (const baseP of basePrompts) {
        for (const variation of request.variations) {
          switch (variation) {
            case "lighting":
              variationPrompts.push(`${baseP}, dramatic lighting`);
              variationPrompts.push(`${baseP}, soft lighting`);
              break;
            case "angle":
              variationPrompts.push(`${baseP}, from above`);
              variationPrompts.push(`${baseP}, close-up view`);
              break;
            case "color-palette":
              variationPrompts.push(`${baseP}, warm color palette`);
              variationPrompts.push(`${baseP}, cool color palette`);
              break;
            case "composition":
              variationPrompts.push(`${baseP}, centered composition`);
              variationPrompts.push(`${baseP}, rule of thirds composition`);
              break;
            case "mood":
              variationPrompts.push(`${baseP}, cheerful mood`);
              variationPrompts.push(`${baseP}, dramatic mood`);
              break;
            case "season":
              variationPrompts.push(`${baseP}, in spring`);
              variationPrompts.push(`${baseP}, in winter`);
              break;
            case "time-of-day":
              variationPrompts.push(`${baseP}, at sunrise`);
              variationPrompts.push(`${baseP}, at sunset`);
              break;
          }
        }
      }
      if (variationPrompts.length > 0) {
        prompts.splice(0, prompts.length, ...variationPrompts);
      }
    }

    // If no styles/variations but outputCount > 1, create simple variations
    if (
      prompts.length === 0 &&
      request.outputCount &&
      request.outputCount > 1
    ) {
      for (let i = 0; i < request.outputCount; i++) {
        prompts.push(basePrompt);
      }
    }

    // Limit to outputCount if specified
    if (request.outputCount && prompts.length > request.outputCount) {
      prompts.splice(request.outputCount);
    }

    return prompts.length > 0 ? prompts : [basePrompt];
  }

  async generateTextToImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    try {
      const outputPath = FileHandler.ensureOutputDirectory();
      const generatedFiles: string[] = [];
      const prompts = this.buildBatchPrompts(request);
      let firstError: string | null = null;

      console.error(`DEBUG - Generating ${prompts.length} image variation(s)`);

      for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        console.error(
          `DEBUG - Generating variation ${i + 1}/${prompts.length}:`,
          currentPrompt,
        );

        try {
          let imageBase64: string | undefined;

          if (this.useLocalProxy) {
            // Use local proxy API
            const result = await this.callLocalProxyAPI(currentPrompt, undefined, request.temperature);
            if (result.imageData) {
              imageBase64 = result.imageData;
              console.error("DEBUG - Found image data from local proxy");
            } else if (result.error) {
              throw new Error(result.error);
            }
          } else {
            // Use Google GenAI SDK
            const response = await this.ai!.models.generateContent({
              model: this.modelName,
              contents: [
                {
                  role: "user",
                  parts: [{ text: currentPrompt }],
                },
              ],
            });

            console.error(
              "DEBUG - API Response structure for variation",
              i + 1,
            );

            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  imageBase64 = part.inlineData.data;
                  console.error("DEBUG - Found image data in inlineData:", {
                    length: imageBase64.length,
                    mimeType: part.inlineData.mimeType,
                  });
                  break;
                } else if (
                  part.text &&
                  this.isValidBase64ImageData(part.text)
                ) {
                  imageBase64 = part.text;
                  console.error(
                    "DEBUG - Found image data in text field (fallback)",
                  );
                  break;
                }
              }
            }
          }

          if (imageBase64) {
            const filename = FileHandler.generateFilename(
              request.styles || request.variations
                ? currentPrompt
                : request.prompt,
              request.fileFormat,
              i,
            );
            const fullPath = await FileHandler.saveImageFromBase64(
              imageBase64,
              outputPath,
              filename,
            );
            generatedFiles.push(fullPath);
            console.error("DEBUG - Image saved to:", fullPath);
          }
        } catch (error: unknown) {
          const errorMessage = this.handleApiError(error);
          if (!firstError) {
            firstError = errorMessage;
          }
          console.error(
            `DEBUG - Error generating variation ${i + 1}:`,
            errorMessage,
          );

          // If auth-related, stop immediately
          if (errorMessage.toLowerCase().includes("authentication failed")) {
            return {
              success: false,
              message: "Image generation failed",
              error: errorMessage,
            };
          }
        }
      }

      if (generatedFiles.length === 0) {
        return {
          success: false,
          message: "Failed to generate any images",
          error: firstError || "No image data found in API responses",
        };
      }

      // Handle preview if requested
      await this.handlePreview(generatedFiles, request);

      return {
        success: true,
        message: `Successfully generated ${generatedFiles.length} image variation(s)`,
        generatedFiles,
      };
    } catch (error: unknown) {
      console.error("DEBUG - Error in generateTextToImage:", error);
      return {
        success: false,
        message: "Failed to generate image",
        error: this.handleApiError(error),
      };
    }
  }

  private handleApiError(error: unknown): string {
    // Ideal: Check for a specific error code or type from the SDK
    // Fallback: Check for revealing strings in the error message
    const errorMessage =
      error instanceof Error ? error.message : String(error).toLowerCase();

    if (errorMessage.includes("api key not valid")) {
      return "Authentication failed: The provided API key is invalid. Please check your NANOBANANA_GEMINI_API_KEY environment variable.";
    }

    if (errorMessage.includes("permission denied")) {
      return "Authentication failed: The provided API key does not have the necessary permissions for the Gemini API. Please check your Google Cloud project settings.";
    }

    if (errorMessage.includes("quota exceeded")) {
      return "API quota exceeded. Please check your usage and limits in the Google Cloud console.";
    }

    // Check for GoogleGenerativeAIResponseError
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response
    ) {
      const responseError = error as {
        response: { status: number; statusText: string };
      };
      const { status } = responseError.response;

      switch (status) {
        case 400:
          return "The request was malformed. This may be due to an issue with the prompt. Please check for safety violations or unsupported content.";
        case 403: // General permission error if specific message not caught
          return "Authentication failed. Please ensure your API key (e.g., NANOBANANA_GEMINI_API_KEY) is valid and has the necessary permissions.";
        case 500:
          return "The image generation service encountered a temporary internal error. Please try again later.";
        default:
          return `API request failed with status ${status}. Please check your connection and API key.`;
      }
    }

    // Fallback for other error types
    return `An unexpected error occurred: ${errorMessage}`;
  }

  async generateStorySequence(
    request: ImageGenerationRequest,
    args?: StorySequenceArgs,
  ): Promise<ImageGenerationResponse> {
    try {
      const outputPath = FileHandler.ensureOutputDirectory();
      const generatedFiles: string[] = [];
      const steps = request.outputCount || 4;
      const type = args?.type || "story";
      const style = args?.style || "consistent";
      const transition = args?.transition || "smooth";
      let firstError: string | null = null;

      console.error(`DEBUG - Generating ${steps}-step ${type} sequence`);

      // Generate each step of the story/process
      for (let i = 0; i < steps; i++) {
        const stepNumber = i + 1;
        let stepPrompt = `${request.prompt}, step ${stepNumber} of ${steps}`;

        // Add context based on type
        switch (type) {
          case "story":
            stepPrompt += `, narrative sequence, ${style} art style`;
            break;
          case "process":
            stepPrompt += `, procedural step, instructional illustration`;
            break;
          case "tutorial":
            stepPrompt += `, tutorial step, educational diagram`;
            break;
          case "timeline":
            stepPrompt += `, chronological progression, timeline visualization`;
            break;
        }

        // Add transition context
        if (i > 0) {
          stepPrompt += `, ${transition} transition from previous step`;
        }

        console.error(`DEBUG - Generating step ${stepNumber}: ${stepPrompt}`);

        try {
          let imageBase64: string | undefined;

          if (this.useLocalProxy) {
            // Use local proxy API
            const result = await this.callLocalProxyAPI(stepPrompt, undefined, request.temperature);
            if (result.imageData) {
              imageBase64 = result.imageData;
              console.error(
                `DEBUG - Found step ${stepNumber} image from local proxy`,
              );
            } else if (result.error) {
              throw new Error(result.error);
            }
          } else {
            // Use Google GenAI SDK
            const response = await this.ai!.models.generateContent({
              model: this.modelName,
              contents: [
                {
                  role: "user",
                  parts: [{ text: stepPrompt }],
                },
              ],
            });

            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  imageBase64 = part.inlineData.data;
                  break;
                } else if (
                  part.text &&
                  this.isValidBase64ImageData(part.text)
                ) {
                  imageBase64 = part.text;
                  break;
                }
              }
            }
          }

          if (imageBase64) {
            const filename = FileHandler.generateFilename(
              `${type}step${stepNumber}${request.prompt}`,
              "png",
              0,
            );
            const fullPath = await FileHandler.saveImageFromBase64(
              imageBase64,
              outputPath,
              filename,
            );
            generatedFiles.push(fullPath);
            console.error(`DEBUG - Step ${stepNumber} saved to:`, fullPath);
          }
        } catch (error: unknown) {
          const errorMessage = this.handleApiError(error);
          if (!firstError) {
            firstError = errorMessage;
          }
          console.error(
            `DEBUG - Error generating step ${stepNumber}:`,
            errorMessage,
          );
          if (errorMessage.toLowerCase().includes("authentication failed")) {
            return {
              success: false,
              message: "Story generation failed",
              error: errorMessage,
            };
          }
        }

        // Check if this step was actually generated
        if (generatedFiles.length < stepNumber) {
          console.error(
            `DEBUG - WARNING: Step ${stepNumber} failed to generate - no valid image data received`,
          );
        }
      }

      console.error(
        `DEBUG - Story generation completed. Generated ${generatedFiles.length} out of ${steps} requested images`,
      );

      if (generatedFiles.length === 0) {
        return {
          success: false,
          message: "Failed to generate any story sequence images",
          error: firstError || "No image data found in API responses",
        };
      }

      // Handle preview if requested
      await this.handlePreview(generatedFiles, request);

      const wasFullySuccessful = generatedFiles.length === steps;
      const successMessage = wasFullySuccessful
        ? `Successfully generated complete ${steps}-step ${type} sequence`
        : `Generated ${generatedFiles.length} out of ${steps} requested ${type} steps (${steps - generatedFiles.length} steps failed)`;

      return {
        success: true,
        message: successMessage,
        generatedFiles,
      };
    } catch (error: unknown) {
      console.error("DEBUG - Error in generateStorySequence:", error);
      return {
        success: false,
        message: `Failed to generate ${request.mode} sequence`,
        error: this.handleApiError(error),
      };
    }
  }
  async editImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    try {
      if (!request.inputImage) {
        return {
          success: false,
          message: "Input image file is required for editing",
          error: "Missing inputImage parameter",
        };
      }

      const fileResult = FileHandler.findInputFile(request.inputImage);
      if (!fileResult.found) {
        return {
          success: false,
          message: `Input image not found: ${request.inputImage}`,
          error: `Searched in: ${fileResult.searchedPaths.join(", ")}`,
        };
      }

      const outputPath = FileHandler.ensureOutputDirectory();
      const inputImageBase64 = await FileHandler.readImageAsBase64(
        fileResult.filePath!,
      );

      let resultImageBase64: string | undefined;

      if (this.useLocalProxy) {
        // Use local proxy API with image
        const result = await this.callLocalProxyAPI(
          request.prompt,
          inputImageBase64,
          request.temperature,
        );
        if (result.imageData) {
          resultImageBase64 = result.imageData;
          console.error("DEBUG - Found edited image from local proxy");
        } else if (result.error) {
          return {
            success: false,
            message: `Failed to ${request.mode} image`,
            error: result.error,
          };
        }
      } else {
        // Use Google GenAI SDK
        const response = await this.ai!.models.generateContent({
          model: this.modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: request.prompt },
                {
                  inlineData: {
                    data: inputImageBase64,
                    mimeType: "image/png",
                  },
                },
              ],
            },
          ],
        });

        console.error(
          "DEBUG - Edit API Response structure:",
          JSON.stringify(response, null, 2),
        );

        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              resultImageBase64 = part.inlineData.data;
              console.error("DEBUG - Found edited image in inlineData:", {
                length: resultImageBase64.length,
                mimeType: part.inlineData.mimeType,
              });
              break;
            } else if (part.text && this.isValidBase64ImageData(part.text)) {
              resultImageBase64 = part.text;
              console.error(
                "DEBUG - Found edited image in text field (fallback)",
              );
              break;
            }
          }
        }
      }

      if (resultImageBase64) {
        const generatedFiles: string[] = [];
        const filename = FileHandler.generateFilename(
          `${request.mode}_${request.prompt}`,
          "png",
          0,
        );
        const fullPath = await FileHandler.saveImageFromBase64(
          resultImageBase64,
          outputPath,
          filename,
        );
        generatedFiles.push(fullPath);
        console.error("DEBUG - Edited image saved to:", fullPath);

        // Handle preview if requested
        await this.handlePreview(generatedFiles, request);

        return {
          success: true,
          message: `Successfully ${request.mode}d image`,
          generatedFiles,
        };
      }

      return {
        success: false,
        message: `Failed to ${request.mode} image`,
        error: "No image data in response",
      };
    } catch (error: unknown) {
      console.error(`DEBUG - Error in ${request.mode}Image:`, error);
      return {
        success: false,
        message: `Failed to ${request.mode} image`,
        error: this.handleApiError(error),
      };
    }
  }

  private getLanguageName(code: TranslationLanguage): string {
    const languageNames: Record<TranslationLanguage, string> = {
      auto: "auto-detect",
      zh: "Chinese",
      en: "English",
      vi: "Vietnamese",
      ja: "Japanese",
      ko: "Korean",
      th: "Thai",
      id: "Indonesian",
      ms: "Malay",
      fr: "French",
      de: "German",
      es: "Spanish",
      pt: "Portuguese",
      ru: "Russian",
      ar: "Arabic",
    };
    return languageNames[code] || code;
  }

  private getContextGuidelines(context: TranslationContext): string {
    const guidelines: Record<TranslationContext, string> = {
      general: `Use natural, everyday language appropriate for general content.`,
      comic: `This is a COMIC/MANGA image. Translation guidelines:
   - Use informal, conversational tone for dialogues
   - Preserve onomatopoeia style (translate or keep original based on context)
   - Sound effects can be romanized or translated
   - Emotion expressions should feel natural in target language
   - Keep character voice/personality consistent`,
      game: `This is a GAME interface/screenshot. Translation guidelines:
   - Use gaming terminology familiar to players
   - Keep UI terms concise to fit button/menu spaces
   - Maintain action-oriented language for commands
   - Stats, skills, items should use standard gaming conventions
   - Consider character limits for UI elements`,
      document: `This is a FORMAL DOCUMENT. Translation guidelines:
   - Use formal, professional language
   - Maintain document structure and formatting
   - Technical terms should be accurately translated
   - Keep legal/official terminology precise
   - Preserve numbering and reference systems`,
      menu: `This is a RESTAURANT/FOOD MENU. Translation guidelines:
   - Translate dish names with descriptions
   - Keep prices and measurements unchanged
   - Food terminology should be appetizing
   - Include original name in parentheses if helpful
   - Allergen/dietary info must be accurate`,
      signage: `This is a SIGN/BANNER. Translation guidelines:
   - Keep messages concise and impactful
   - Directional signs should be clear
   - Warning/safety text must be accurate
   - Business names may be kept or transliterated
   - Contact info (phone, website) unchanged`,
      product: `This is a PRODUCT LABEL/PACKAGING. Translation guidelines:
   - Product name may be kept or translated
   - Ingredients/specifications must be accurate
   - Marketing claims should be compelling
   - Safety warnings must be precise
   - Keep brand names unchanged`,
      ui: `This is a SOFTWARE/APP INTERFACE. Translation guidelines:
   - Use standard UI/UX terminology
   - Keep button text concise
   - Error messages should be helpful
   - Menu items need consistent terminology
   - Consider text expansion in target language`,
      social: `This is SOCIAL MEDIA CONTENT. Translation guidelines:
   - Use casual, engaging tone
   - Hashtags may be translated or kept
   - Emojis and mentions unchanged
   - Slang/trendy expressions adapted to target culture
   - Keep usernames/handles unchanged`,
    };
    return guidelines[context] || guidelines.general;
  }

  async translateImage(
    request: ImageTranslationRequest,
  ): Promise<ImageTranslationResponse> {
    try {
      if (!request.inputImage) {
        return {
          success: false,
          message: "Input image file is required for translation",
          error: "Missing inputImage parameter",
        };
      }

      const fileResult = FileHandler.findInputFile(request.inputImage);
      if (!fileResult.found) {
        return {
          success: false,
          message: `Input image not found: ${request.inputImage}`,
          error: `Searched in: ${fileResult.searchedPaths.join(", ")}`,
        };
      }

      const outputPath = FileHandler.ensureOutputDirectory();
      const inputImageBase64 = await FileHandler.readImageAsBase64(
        fileResult.filePath!,
      );

      const sourceLang = request.sourceLanguage || "zh";
      const targetLang = request.targetLanguage || "vi";
      const context = request.context || "general";
      const sourceLanguageName = this.getLanguageName(sourceLang);
      const targetLanguageName = this.getLanguageName(targetLang);
      const contextGuidelines = this.getContextGuidelines(context);

      const translationPrompt = `You are an expert image translator. Your task is to translate ALL text in this image from ${sourceLanguageName} to ${targetLanguageName}.

CONTENT TYPE: ${context.toUpperCase()}
${contextGuidelines}

CRITICAL REQUIREMENTS:
1. PRESERVE THE ORIGINAL IMAGE: Keep at least 95% of the original image unchanged - same layout, colors, graphics, icons, logos, backgrounds, and all visual elements
2. ONLY CHANGE THE TEXT: Replace all ${sourceLanguageName} text with accurate ${targetLanguageName} translations
3. MATCH TEXT STYLE: The translated text must match the original text's:
   - Font style (bold, italic, etc.)
   - Font size (proportional to space)
   - Text color
   - Text position and alignment
   - Text effects (shadows, outlines, etc.)
4. QUALITY: Ensure translations are natural and contextually appropriate for ${context} content
5. COMPLETENESS: Translate ALL visible text, including:
   - Main headings and titles
   - Body text and paragraphs
   - Labels and captions
   - Buttons and UI elements
   - Watermarks and small text

Generate a new image that is virtually identical to the original, with only the text translated to ${targetLanguageName}.`;

      let resultImageBase64: string | undefined;

      if (this.useLocalProxy) {
        const result = await this.callLocalProxyAPI(
          translationPrompt,
          inputImageBase64,
          request.temperature,
        );
        if (result.imageData) {
          resultImageBase64 = result.imageData;
          console.error("DEBUG - Found translated image from local proxy");
        } else if (result.error) {
          return {
            success: false,
            message: "Failed to translate image",
            error: result.error,
          };
        }
      } else {
        const response = await this.ai!.models.generateContent({
          model: this.modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: translationPrompt },
                {
                  inlineData: {
                    data: inputImageBase64,
                    mimeType: "image/png",
                  },
                },
              ],
            },
          ],
        });

        console.error(
          "DEBUG - Translation API Response structure:",
          JSON.stringify(response, null, 2),
        );

        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              resultImageBase64 = part.inlineData.data;
              console.error("DEBUG - Found translated image in inlineData");
              break;
            } else if (part.text && this.isValidBase64ImageData(part.text)) {
              resultImageBase64 = part.text;
              console.error(
                "DEBUG - Found translated image in text field (fallback)",
              );
              break;
            }
          }
        }
      }

      if (resultImageBase64) {
        const generatedFiles: string[] = [];
        const filename = FileHandler.generateFilename(
          `translated_${sourceLang}_to_${targetLang}`,
          "png",
          0,
        );
        const fullPath = await FileHandler.saveImageFromBase64(
          resultImageBase64,
          outputPath,
          filename,
        );
        generatedFiles.push(fullPath);
        console.error("DEBUG - Translated image saved to:", fullPath);

        if (
          request.preview &&
          !request.noPreview &&
          generatedFiles.length > 0
        ) {
          await this.openImagePreview(generatedFiles[0]);
        }

        return {
          success: true,
          message: `Successfully translated image from ${sourceLanguageName} to ${targetLanguageName}`,
          generatedFiles,
        };
      }

      return {
        success: false,
        message: "Failed to translate image",
        error: "No image data in response",
      };
    } catch (error: unknown) {
      console.error("DEBUG - Error in translateImage:", error);
      return {
        success: false,
        message: "Failed to translate image",
        error: this.handleApiError(error),
      };
    }
  }
}
