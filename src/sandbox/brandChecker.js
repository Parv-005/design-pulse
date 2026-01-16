/**
 * ============================================================================
 * Brand Checker - design-pulse sandbox
 * ============================================================================
 * 
 * This module contains functions for checking designs against brand guidelines:
 * - checkBrandGuidelines: Validates font sizes with ratio scaling
 * - checkFontFamily: Validates fonts against allowed list
 * - runAllBrandChecks: Runs all checks and returns combined results
 * 
 * Usage:
 * import { checkBrandGuidelines, checkFontFamily, runAllBrandChecks } from './brandChecker.js';
 * const result = runAllBrandChecks(layers, brandGuidelines);
 */

/**
 * Check text layers against brand guidelines for FONT SIZE
 * Uses ratio-based scaling to adjust allowed sizes based on canvas dimensions
 * 
 * @param {Array} layersData - Layers from getAllLayersData()
 * @param {Object} brandGuidelines - Brand guidelines object:
 *   {
 *     referenceImageSize: 500,  // min(width, height) of reference canvas
 *     typography: {
 *       fontSizeRange: [18, 36]  // [min, max] font sizes for reference
 *     }
 *   }
 * 
 * @returns {Array} Array of issues:
 *   {
 *     type: "FONT_SIZE",
 *     elementId: "abc-123",
 *     elementText: "Hello World",
 *     message: "Font size 12px is below minimum 28.8px",
 *     expected: { min: 28.8, max: 57.6 },
 *     actual: 12
 *   }
 */
export function checkBrandGuidelines(layersData, brandGuidelines) {
    const LOG_PREFIX = "[checkBrandGuidelines]";
    const issues = [];

    // Validate inputs
    if (!layersData || !Array.isArray(layersData)) {
        console.error(`${LOG_PREFIX} Invalid layersData`);
        return issues;
    }
    if (!brandGuidelines || !brandGuidelines.referenceImageSize) {
        console.error(`${LOG_PREFIX} Invalid brandGuidelines or missing referenceImageSize`);
        return issues;
    }

    // Get current artboard dimensions to calculate reference image size
    let currentReferenceImageSize = 0;
    const artboard = layersData.find(layer => layer.type === "ab:Artboard");
    if (artboard && artboard.width && artboard.height) {
        currentReferenceImageSize = Math.min(artboard.width, artboard.height);
    } else {
        console.error(`${LOG_PREFIX} Could not find artboard dimensions`);
        return issues;
    }

    // Calculate scaling ratio
    const ratio = currentReferenceImageSize / brandGuidelines.referenceImageSize;
    console.log(`${LOG_PREFIX} Ratio: ${ratio} (current: ${currentReferenceImageSize}, reference: ${brandGuidelines.referenceImageSize})`);

    // Get font size range from brand guidelines
    const fontSizeRange = brandGuidelines.typography?.fontSizeRange;
    if (!fontSizeRange || fontSizeRange.length < 2) {
        console.warn(`${LOG_PREFIX} No fontSizeRange defined in brand guidelines`);
        return issues;
    }

    // Scale the font size range
    const scaledMinFontSize = fontSizeRange[0] * ratio;
    const scaledMaxFontSize = fontSizeRange[1] * ratio;
    console.log(`${LOG_PREFIX} Scaled font size range: [${scaledMinFontSize.toFixed(2)}, ${scaledMaxFontSize.toFixed(2)}]`);

    // Check each text layer
    for (const layer of layersData) {
        if (layer.type !== "Text") continue;

        if (layer.characterStyles && Array.isArray(layer.characterStyles)) {
            for (const style of layer.characterStyles) {
                const fontSize = style.fontSize;
                if (fontSize === null || fontSize === undefined) continue;

                if (fontSize < scaledMinFontSize || fontSize > scaledMaxFontSize) {
                    issues.push({
                        type: "FONT_SIZE",
                        elementId: layer.id,
                        elementType: "Text",
                        elementText: layer.text || layer.fullText || "",
                        message: fontSize < scaledMinFontSize
                            ? `Font size ${fontSize.toFixed(2)}px is below minimum ${scaledMinFontSize.toFixed(2)}px`
                            : `Font size ${fontSize.toFixed(2)}px is above maximum ${scaledMaxFontSize.toFixed(2)}px`,
                        expected: {
                            min: parseFloat(scaledMinFontSize.toFixed(2)),
                            max: parseFloat(scaledMaxFontSize.toFixed(2))
                        },
                        actual: parseFloat(fontSize.toFixed(2))
                    });
                }
            }
        }
    }

    console.log(`${LOG_PREFIX} Complete. Found ${issues.length} font size issues`);
    return issues;
}

/**
 * Check that fonts used in text layers are in the brand's allowed font list
 * 
 * @param {Array} layersData - Layers from getAllLayersData()
 * @param {Object} brandGuidelines - Brand guidelines object:
 *   {
 *     typography: {
 *       brandFonts: ["Arial", "Roboto"]  // Can also be [{name: "Arial"}, ...]
 *     }
 *   }
 * 
 * @returns {Array} Array of issues:
 *   {
 *     type: "FONT_FAMILY",
 *     elementId: "abc-123",
 *     elementText: "Hello World",
 *     message: "Font 'Comic Sans' is not in the brand's allowed font list",
 *     expected: ["arial", "roboto"],
 *     actual: "Comic Sans"
 *   }
 */
export function checkFontFamily(layersData, brandGuidelines) {
    const LOG_PREFIX = "[checkFontFamily]";
    const issues = [];

    // Validate inputs
    if (!layersData || !Array.isArray(layersData)) {
        console.error(`${LOG_PREFIX} Invalid layersData`);
        return issues;
    }
    if (!brandGuidelines) {
        console.error(`${LOG_PREFIX} Invalid brandGuidelines`);
        return issues;
    }

    // Get allowed font names from brand guidelines
    const brandFonts = brandGuidelines.typography?.brandFonts;
    if (!brandFonts || !Array.isArray(brandFonts) || brandFonts.length === 0) {
        console.warn(`${LOG_PREFIX} No brandFonts defined in brand guidelines`);
        return issues;
    }

    // Extract allowed font names (case-insensitive comparison)
    // Supports both formats:
    // - String array: ["Arial", "Roboto"]
    // - Object array: [{name: "Arial"}, {name: "Roboto"}]
    const allowedFontNames = brandFonts
        .map(font => {
            if (typeof font === 'string') {
                return font.toLowerCase();
            } else if (typeof font === 'object' && font.name) {
                return font.name.toLowerCase();
            }
            return null;
        })
        .filter(name => name);

    console.log(`${LOG_PREFIX} Allowed fonts:`, allowedFontNames);

    // Check each text layer
    for (const layer of layersData) {
        if (layer.type !== "Text") continue;

        if (layer.characterStyles && Array.isArray(layer.characterStyles)) {
            for (const style of layer.characterStyles) {
                const fontFamily = style.fontFamily;
                if (!fontFamily) continue;

                const isAllowed = allowedFontNames.includes(fontFamily.toLowerCase());

                if (!isAllowed) {
                    issues.push({
                        type: "FONT_FAMILY",
                        elementId: layer.id,
                        elementType: "Text",
                        elementText: layer.text || layer.fullText || "",
                        message: `Font "${fontFamily}" is not in the brand's allowed font list`,
                        expected: allowedFontNames,
                        actual: fontFamily
                    });
                }
            }
        }
    }

    console.log(`${LOG_PREFIX} Complete. Found ${issues.length} font family issues`);
    return issues;
}

/**
 * Run all brand guideline checks and return combined results
 * 
 * @param {Array} layersData - Layers from getAllLayersData()
 * @param {Object} brandGuidelines - Complete brand guidelines object
 * 
 * @returns {Object} Result object:
 *   {
 *     fontSizeIssues: [...],
 *     fontFamilyIssues: [...],
 *     allIssues: [...],  // Combined array
 *     summary: {
 *       totalIssues: 3,
 *       fontSizeIssueCount: 1,
 *       fontFamilyIssueCount: 2
 *     }
 *   }
 */
export function runAllBrandChecks(layersData, brandGuidelines) {
    const LOG_PREFIX = "[runAllBrandChecks]";
    console.log(`${LOG_PREFIX} Starting all brand checks...`);

    const fontSizeIssues = checkBrandGuidelines(layersData, brandGuidelines);
    const fontFamilyIssues = checkFontFamily(layersData, brandGuidelines);

    const result = {
        fontSizeIssues: fontSizeIssues,
        fontFamilyIssues: fontFamilyIssues,
        allIssues: [...fontSizeIssues, ...fontFamilyIssues],
        summary: {
            totalIssues: fontSizeIssues.length + fontFamilyIssues.length,
            fontSizeIssueCount: fontSizeIssues.length,
            fontFamilyIssueCount: fontFamilyIssues.length
        }
    };

    console.log(`${LOG_PREFIX} Complete. Summary:`, result.summary);
    return result;
}
