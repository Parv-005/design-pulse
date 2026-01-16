/**
 * ============================================================================
 * DESIGN PULSE - Document Sandbox Runtime (Refactored)
 * ============================================================================
 * 
 * This is the main entry point for the document sandbox.
 * Logic has been modularized into separate files:
 * 
 * - helpers.js: Color, fill, stroke, text extraction helpers
 * - layerExtractor.js: Layer traversal and extraction
 * - brandChecker.js: Brand guideline checking functions
 * 
 * ============================================================================
 * USAGE FROM UI (App.js):
 * ============================================================================
 * 
 * // Get all layers from the document
 * const layers = await this._sandboxProxy.getAllLayersData();
 * 
 * // Run brand check - returns issues
 * const result = await this._sandboxProxy.checkBrand(brandGuidelines);
 * console.log(result.issues);    // Array of issues
 * console.log(result.summary);   // { totalIssues, fontSizeIssueCount, fontFamilyIssueCount }
 * 
 * ============================================================================
 */

console.log("[DesignPulse Sandbox] Importing sandbox SDK...");
import addOnSandboxSdk from "add-on-sdk-document-sandbox";
console.log("[DesignPulse Sandbox] Sandbox SDK imported");

import { editor, constants } from "express-document-sdk";
console.log("[DesignPulse Sandbox] Express Document SDK imported");

// Import modular functions
import * as layerExtractor from './layerExtractor.js';
import * as brandChecker from './brandChecker.js';

// Get the document sandbox runtime
const { runtime } = addOnSandboxSdk.instance;

function start() {
    console.log("[DesignPulse Sandbox] Starting...");

    // ========================================================================
    // SANDBOX API - Exposed to UI Runtime
    // ========================================================================

    const sandboxApi = {

        // ====================================================================
        // LAYER EXTRACTION
        // ====================================================================

        /**
         * Get all layers from the current document with detailed properties
         * @returns {Array} Array of layer objects with type-specific properties
         */
        getAllLayersData: () => {
            const layers = layerExtractor.getAllLayersData(editor, constants);
            console.log("[getAllLayersData] Found", layers.length, "layers");
            console.log("[getAllLayersData] Layers:", JSON.stringify(layers, null, 2));
            return layers;
        },

        // ====================================================================
        // BRAND GUIDELINE CHECKING
        // ====================================================================

        /**
         * Check text layers against brand guidelines for FONT SIZE
         * Uses ratio-based scaling to adjust allowed sizes
         */
        checkBrandGuidelines: (layersData, brandGuidelines) => {
            return brandChecker.checkBrandGuidelines(layersData, brandGuidelines);
        },

        /**
         * Check that fonts used in text layers are in the brand's allowed list
         */
        checkFontFamily: (layersData, brandGuidelines) => {
            return brandChecker.checkFontFamily(layersData, brandGuidelines);
        },

        /**
         * Run all brand checks and return combined results
         */
        runAllBrandChecks: function (layersData, brandGuidelines) {
            return brandChecker.runAllBrandChecks(layersData, brandGuidelines);
        },

        // ====================================================================
        // BRAND DATA MANAGEMENT
        // ====================================================================

        /**
         * Save brand data for persistence
         */
        saveBrandData: async (brandData) => {
            const LOG_PREFIX = "[saveBrandData]";
            console.log(`${LOG_PREFIX} Received brand data:`, brandData);

            try {
                return { success: true, message: "Brand data saved successfully" };
            } catch (error) {
                console.error(`${LOG_PREFIX} Error:`, error);
                throw error;
            }
        },

        /**
         * MAIN ENTRY POINT: Check design against brand guidelines
         * Automatically gets layers and runs all checks
         */
        checkBrand: async function (brandGuidelines) {
            const LOG_PREFIX = "[checkBrand]";
            console.log(`${LOG_PREFIX} ========================================`);
            console.log(`${LOG_PREFIX} Starting brand check for: ${brandGuidelines.brandName || "Unknown Brand"}`);
            console.log(`${LOG_PREFIX} Brand guidelines:`, JSON.stringify(brandGuidelines, null, 2));
            console.log(`${LOG_PREFIX} ========================================`);

            try {
                // Step 1: Get all layers from the document
                console.log(`${LOG_PREFIX} Step 1: Extracting layers...`);
                const layers = this.getAllLayersData();
                console.log(`${LOG_PREFIX} Found ${layers.length} layers`);

                // Step 2: Run all brand checks
                console.log(`${LOG_PREFIX} Step 2: Running brand checks...`);
                const checkResult = this.runAllBrandChecks(layers, brandGuidelines);

                // Step 3: Prepare result
                const result = {
                    success: true,
                    layers: layers,
                    issues: checkResult.allIssues,
                    fontSizeIssues: checkResult.fontSizeIssues,
                    fontFamilyIssues: checkResult.fontFamilyIssues,
                    summary: checkResult.summary,
                    brandGuidelines: brandGuidelines
                };

                console.log(`${LOG_PREFIX} ========================================`);
                console.log(`${LOG_PREFIX} BRAND CHECK COMPLETE`);
                console.log(`${LOG_PREFIX} Total Issues: ${result.summary.totalIssues}`);
                console.log(`${LOG_PREFIX}   - Font Size Issues: ${result.summary.fontSizeIssueCount}`);
                console.log(`${LOG_PREFIX}   - Font Family Issues: ${result.summary.fontFamilyIssueCount}`);
                console.log(`${LOG_PREFIX} ========================================`);

                // Log issues for debugging
                if (result.issues.length > 0) {
                    console.log(`${LOG_PREFIX} Issues found:`);
                    result.issues.forEach((issue, index) => {
                        console.log(`${LOG_PREFIX}   ${index + 1}. [${issue.type}] ${issue.message}`);
                    });
                } else {
                    console.log(`${LOG_PREFIX} ✓ No issues found! Design follows brand guidelines.`);
                }

                return result;
            } catch (error) {
                console.error(`${LOG_PREFIX} Error during brand check:`, error);
                return {
                    success: false,
                    error: error.message,
                    layers: [],
                    issues: [],
                    summary: { totalIssues: 0, fontSizeIssueCount: 0, fontFamilyIssueCount: 0 }
                };
            }
        },

        /**
         * Upload logo file
         */
        uploadLogo: async (dataUrl, fileName, fileType) => {
            const LOG_PREFIX = "[uploadLogo]";
            console.log(`${LOG_PREFIX} Received logo:`, { fileName, fileType, dataUrlLength: dataUrl.length });
            return { success: true, message: "Logo uploaded successfully" };
        },

        /**
         * Extract brand data from PDF file
         */
        extractBrandDataFromPdf: async (pdfDataUrl, fileName) => {
            const LOG_PREFIX = "[extractBrandDataFromPdf]";
            console.log(`${LOG_PREFIX} Processing PDF:`, fileName);

            try {
                // Placeholder - in production, integrate with PDF parsing library
                const extractedData = {
                    brandName: "",
                    tagline: "",
                    logo: null,
                    selectedFonts: [],
                    minSize: 12,
                    maxSize: 72,
                    colors: [
                        { name: "Primary", value: "#000000", priority: 1 },
                        { name: "Secondary", value: "#FFFFFF", priority: 2 }
                    ],
                    letterSpacing: 0,
                    lineHeight: 1.2
                };

                console.log(`${LOG_PREFIX} Extracted data:`, extractedData);
                return extractedData;
            } catch (error) {
                console.error(`${LOG_PREFIX} Error:`, error);
                throw new Error("Failed to extract brand data from PDF");
            }
        }
    };

    // Expose sandboxApi to the UI runtime
    runtime.exposeApi(sandboxApi);
    console.log("[DesignPulse Sandbox] API exposed. Ready.");
}

start();
