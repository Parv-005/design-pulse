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

import { editor, constants, fonts, colorUtils } from "express-document-sdk";
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
                console.log(`${LOG_PREFIX} Input:`, JSON.stringify(brandGuidelines));

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
         * Apply fixes to the document using Express Document SDK
         * @param {Array} fixes - Array of fix objects from Gemini
         */
        applyFixes: async function (fixes) {
            const LOG_PREFIX = "[applyFixes]";
            console.log(`${LOG_PREFIX} Starting to apply ${fixes.length} fixes...`);

            const results = [];
            const allNodes = [];

            // Use editor.documentRoot.pages like getAllLayersData does
            const pages = editor.documentRoot.pages;
            console.log(`${LOG_PREFIX} Found ${pages ? pages.length : 0} pages`);

            // Collect all nodes from all pages
            const collectNodes = (node) => {
                if (!node) return;
                allNodes.push(node);
                // Try artboards first (for pages)
                if (node.artboards) {
                    for (const artboard of node.artboards) {
                        collectNodes(artboard);
                    }
                }
                // Then try allChildren
                if (node.allChildren) {
                    for (const child of node.allChildren) {
                        collectNodes(child);
                    }
                }
            };

            for (const page of pages) {
                collectNodes(page);
            }

            console.log(`${LOG_PREFIX} Found ${allNodes.length} nodes in document`);

            // Extended font name to PostScript name mapping
            const fontNameMap = {
                // Common web fonts available in Adobe Express
                'arial': 'ArialMT',
                'arial black': 'Arial-Black',
                'calibri': 'Calibri',
                'times new roman': 'TimesNewRomanPSMT',
                'georgia': 'Georgia',
                'verdana': 'Verdana',
                'tahoma': 'Tahoma',
                'trebuchet ms': 'TrebuchetMS',
                'impact': 'Impact',
                'comic sans ms': 'ComicSansMS',
                'courier new': 'CourierNewPSMT',
                'palatino linotype': 'PalatinoLinotype-Roman',
                // Adobe fonts commonly available
                'source sans pro': 'SourceSansPro-Regular',
                'source sans 3': 'SourceSans3-Regular',
                'adobe clean': 'AdobeClean-Regular',
                'myriad pro': 'MyriadPro-Regular',
                'minion pro': 'MinionPro-Regular',
                'helvetica': 'Helvetica',
                'helvetica neue': 'HelveticaNeue',
                'futura': 'Futura-Medium',
                'avenir': 'Avenir-Roman',
                'open sans': 'OpenSans-Regular',
                'roboto': 'Roboto-Regular',
                'lato': 'Lato-Regular',
                'montserrat': 'Montserrat-Regular',
                'raleway': 'Raleway-Regular',
                'oswald': 'Oswald-Regular',
                'poppins': 'Poppins-Regular',
                'playfair display': 'PlayfairDisplay-Regular',
                'merriweather': 'Merriweather-Regular',
                'nunito': 'Nunito-Regular',
                'inter': 'Inter-Regular'
            };

            for (const [index, fix] of fixes.entries()) {
                try {
                    console.log(`${LOG_PREFIX} Applying fix ${index + 1}/${fixes.length}:`, fix);

                    // Find the element by ID
                    const element = allNodes.find(n => n.id === fix.elementId);

                    if (!element) {
                        console.warn(`${LOG_PREFIX} Element not found: ${fix.elementId}`);
                        results.push({ elementId: fix.elementId, success: false, error: "Element not found" });
                        continue;
                    }

                    // Apply the fix based on action type
                    switch (fix.action) {
                        case 'CHANGE_FONT':
                            if (element.type === 'Text') {
                                console.log(`${LOG_PREFIX} Changing font to: ${fix.newValue}`);
                                try {
                                    const fontKey = fix.newValue.toLowerCase();
                                    // Try mapped name first, then derive PostScript name
                                    let postScriptName = fontNameMap[fontKey];
                                    if (!postScriptName) {
                                        // Try common patterns: "Font Name" -> "FontName-Regular"
                                        postScriptName = fix.newValue.replace(/\s+/g, '') + '-Regular';
                                    }

                                    console.log(`${LOG_PREFIX} Looking up font with PostScript name: ${postScriptName}`);

                                    // Get font by PostScript name
                                    const fontObj = await fonts.fromPostscriptName(postScriptName);

                                    if (fontObj) {
                                        console.log(`${LOG_PREFIX} Found font: ${fontObj.family}`);

                                        // Queue async edit for document mutation after await
                                        editor.queueAsyncEdit(() => {
                                            element.fullContent.applyCharacterStyles({
                                                font: fontObj
                                            });
                                        });

                                        results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_FONT', newValue: fontObj.family });
                                        console.log(`${LOG_PREFIX} ✅ Font changed to ${fontObj.family}`);
                                    } else {
                                        console.error(`${LOG_PREFIX} Font not found: ${postScriptName}`);
                                        results.push({ elementId: fix.elementId, success: false, action: 'CHANGE_FONT', error: `Font ${fix.newValue} not found in Adobe Express` });
                                    }
                                } catch (fontErr) {
                                    console.error(`${LOG_PREFIX} Font change failed:`, fontErr);
                                    results.push({ elementId: fix.elementId, success: false, action: 'CHANGE_FONT', error: fontErr.message });
                                }
                            }
                            break;



                        case 'CHANGE_SIZE':
                            if (element.type === 'Text') {
                                const newSize = parseFloat(fix.newValue);
                                if (!isNaN(newSize)) {
                                    console.log(`${LOG_PREFIX} Changing size to: ${newSize}`);
                                    // Queue async edit for consistency
                                    editor.queueAsyncEdit(() => {
                                        element.fullContent.applyCharacterStyles({
                                            fontSize: newSize
                                        });
                                    });
                                    results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_SIZE', newValue: newSize });
                                    console.log(`${LOG_PREFIX} ✅ Font size changed to ${newSize}`);
                                } else {
                                    throw new Error(`Invalid font size: ${fix.newValue}`);
                                }
                            }
                            break;

                        case 'CHANGE_COLOR':
                            console.log(`${LOG_PREFIX} Changing color to: ${fix.newValue}`);
                            try {
                                // Parse hex color to RGB values (0-1 range)
                                const hexColor = fix.newValue.replace('#', '');
                                const r = parseInt(hexColor.substring(0, 2), 16) / 255;
                                const g = parseInt(hexColor.substring(2, 4), 16) / 255;
                                const b = parseInt(hexColor.substring(4, 6), 16) / 255;
                                console.log(`${LOG_PREFIX} Parsed RGB: ${r.toFixed(2)}, ${g.toFixed(2)}, ${b.toFixed(2)}`);

                                // Create color object using colorUtils
                                const newColor = colorUtils.fromRGB(r, g, b);
                                console.log(`${LOG_PREFIX} Created color object`);

                                // Determine what type of color change to make based on colorType
                                const colorType = fix.colorType || 'fill';
                                console.log(`${LOG_PREFIX} Color type: ${colorType}`);

                                if (colorType === 'fontColor' && element.type === 'Text') {
                                    // Change text font color - queue async edit
                                    editor.queueAsyncEdit(() => {
                                        element.fullContent.applyCharacterStyles({
                                            color: newColor
                                        });
                                    });
                                    results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_COLOR', colorType: 'fontColor', newValue: fix.newValue });
                                    console.log(`${LOG_PREFIX} ✅ Font color changed to ${fix.newValue}`);
                                } else if (colorType === 'fill') {
                                    // SolidColorShape has .color property, not .fill
                                    if (element.type === 'SolidColorShape') {
                                        console.log(`${LOG_PREFIX} Detected SolidColorShape - setting .color directly`);
                                        editor.queueAsyncEdit(() => {
                                            element.color = newColor;
                                        });
                                        results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_COLOR', colorType: 'fill', newValue: fix.newValue });
                                        console.log(`${LOG_PREFIX} ✅ SolidColorShape color changed to ${fix.newValue}`);
                                    } else {
                                        // Change fill color for regular shapes (Rectangle, Ellipse, etc.)
                                        const fillColor = editor.makeColorFill(newColor);
                                        editor.queueAsyncEdit(() => {
                                            element.fill = fillColor;
                                        });
                                        results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_COLOR', colorType: 'fill', newValue: fix.newValue });
                                        console.log(`${LOG_PREFIX} ✅ Fill color changed to ${fix.newValue}`);
                                    }
                                } else if (colorType === 'background') {
                                    // Change artboard background color
                                    console.log(`${LOG_PREFIX} Detected background color change for Artboard`);
                                    const fillColor = editor.makeColorFill(newColor);
                                    editor.queueAsyncEdit(() => {
                                        element.fill = fillColor;
                                    });
                                    results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_COLOR', colorType: 'background', newValue: fix.newValue });
                                    console.log(`${LOG_PREFIX} ✅ Background color changed to ${fix.newValue}`);
                                } else if (colorType === 'stroke') {
                                    // Change stroke color - queue async edit
                                    const strokeWidth = element.stroke?.width || 1;
                                    const newStroke = editor.makeStroke({ color: newColor, width: strokeWidth });
                                    editor.queueAsyncEdit(() => {
                                        element.stroke = newStroke;
                                    });
                                    results.push({ elementId: fix.elementId, success: true, action: 'CHANGE_COLOR', colorType: 'stroke', newValue: fix.newValue });
                                    console.log(`${LOG_PREFIX} ✅ Stroke color changed to ${fix.newValue}`);
                                } else {
                                    console.warn(`${LOG_PREFIX} Unknown color type: ${colorType}`);
                                    results.push({ elementId: fix.elementId, success: false, action: 'CHANGE_COLOR', error: `Unknown color type: ${colorType}` });
                                }
                            } catch (colorErr) {
                                console.error(`${LOG_PREFIX} Color change failed:`, colorErr);
                                results.push({ elementId: fix.elementId, success: false, action: 'CHANGE_COLOR', error: colorErr.message });
                            }
                            break;

                        default:
                            console.warn(`${LOG_PREFIX} Unknown action: ${fix.action}`);
                            results.push({ elementId: fix.elementId, success: false, error: `Unknown action: ${fix.action}` });
                    }
                } catch (err) {
                    console.error(`${LOG_PREFIX} Error applying fix:`, err);
                    results.push({ elementId: fix.elementId, success: false, error: err.message });
                }
            }

            console.log(`${LOG_PREFIX} Completed. Results:`, results);
            return { success: true, results };
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
