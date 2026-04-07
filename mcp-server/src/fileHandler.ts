/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import type { FileSearchResult } from "./types.js";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const WEBP_RIFF_SIGNATURE = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const WEBP_WEBP_SIGNATURE = Buffer.from([0x57, 0x45, 0x42, 0x50]);

export class FileHandler {
  private static readonly OUTPUT_DIR = "nanobanana-output";
  private static readonly SEARCH_PATHS = [
    process.cwd(),
    path.join(process.cwd(), "images"),
    path.join(process.cwd(), "input"),
    path.join(process.cwd(), this.OUTPUT_DIR),
    path.join(process.env.HOME || "~", "Downloads"),
    path.join(process.env.HOME || "~", "Desktop"),
  ];

  static ensureOutputDirectory(): string {
    const outputPath = path.join(process.cwd(), this.OUTPUT_DIR);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    return outputPath;
  }

  static findInputFile(filename: string): FileSearchResult {
    if (path.isAbsolute(filename) && fs.existsSync(filename)) {
      return {
        found: true,
        filePath: filename,
        searchedPaths: [],
      };
    }

    const searchPaths = this.SEARCH_PATHS;

    for (const searchPath of searchPaths) {
      const fullPath = path.join(searchPath, filename);
      if (fs.existsSync(fullPath)) {
        return {
          found: true,
          filePath: fullPath,
          searchedPaths: searchPaths,
        };
      }
    }

    return {
      found: false,
      searchedPaths: searchPaths,
    };
  }

  static generateFilename(
    prompt: string,
    format: "png" | "jpeg" = "png",
    index: number = 0,
  ): string {
    // Create user-friendly filename from prompt
    let baseName = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 32); // Limit to 32 characters

    if (!baseName) {
      baseName = "generated_image";
    }

    const extension = format === "jpeg" ? "jpg" : "png";

    // Check for existing files and add counter if needed
    const outputPath = this.ensureOutputDirectory();
    let fileName = `${baseName}.${extension}`;
    let counter = index > 0 ? index : 1;

    while (fs.existsSync(path.join(outputPath, fileName))) {
      fileName = `${baseName}_${counter}.${extension}`;
      counter++;
    }

    return fileName;
  }

  private static detectImageFormat(
    buffer: Buffer,
  ): "png" | "jpeg" | "webp" {
    if (buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return "png";
    }

    if (buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
      return "jpeg";
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(WEBP_RIFF_SIGNATURE) &&
      buffer.subarray(8, 12).equals(WEBP_WEBP_SIGNATURE)
    ) {
      return "webp";
    }

    return "png";
  }

  static async saveImageFromBase64(
    base64Data: string,
    outputPath: string,
    filename: string,
  ): Promise<string> {
    const buffer = Buffer.from(base64Data, "base64");
    const detectedFormat = this.detectImageFormat(buffer);
    const expectedExtension =
      detectedFormat === "jpeg"
        ? ".jpg"
        : detectedFormat === "webp"
          ? ".webp"
          : ".png";
    const parsed = path.parse(filename);
    const finalFilename = `${parsed.name}${expectedExtension}`;
    const fullPath = path.join(outputPath, finalFilename);

    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  }

  static async readImageAsBase64(filePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString("base64");
  }
}
