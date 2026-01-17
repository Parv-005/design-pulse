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
    const LOG_PREFIX = "[SANDBOX:FONT-SIZE]";
    console.log(`${LOG_PREFIX} Checking font sizes...`);
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
    const LOG_PREFIX = "[SANDBOX:FONT-FAMILY]";
    console.log(`${LOG_PREFIX} Checking font families...`);
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
 * Check that colors used in text and shapes are in the brand's allowed color list
 * 
 * @param {Array} layersData - Layers from getAllLayersData()
 * @param {Object} brandGuidelines - Brand guidelines object:
 *   {
 *     colors: {
 *       primary: ["#FF0000", "#00FF00"],  // Primary brand colors
 *       secondary: ["#0000FF"]  // Secondary brand colors
 *     }
 *   }
 * 
 * @returns {Array} Array of issues:
 *   {
 *     type: "COLOR",
 *     elementId: "abc-123",
 *     elementText: "Hello World",
 *     colorType: "fontColor" | "fill" | "stroke",
 *     message: "Color #123456 is not in the brand's allowed color list",
 *     expected: ["#ff0000", "#00ff00"],
 *     actual: "#123456"
 *   }
 */
export function checkColor(layersData, brandGuidelines) {
    const LOG_PREFIX = "[SANDBOX:COLOR]";
    console.log(`${LOG_PREFIX} Checking colors...`);
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

    // Get allowed colors from brand guidelines
    const brandColors = brandGuidelines.colors;
    if (!brandColors) {
        console.warn(`${LOG_PREFIX} No colors defined in brand guidelines`);
        return issues;
    }

    // Combine primary and secondary colors into a single list (lowercase for comparison)
    const primaryColors = (brandColors.primary || []).map(c => c.toLowerCase());
    const secondaryColors = (brandColors.secondary || []).map(c => c.toLowerCase());
    const allowedColors = [...primaryColors, ...secondaryColors];

    if (allowedColors.length === 0) {
        console.warn(`${LOG_PREFIX} No brand colors defined (primary or secondary)`);
        return issues;
    }

    console.log(`${LOG_PREFIX} Allowed colors:`, allowedColors);

    // Helper function to check if a color is allowed (with tolerance for slight variations)
    const isColorAllowed = (hexColor) => {
        if (!hexColor) return true; // No color = no issue
        const normalizedColor = hexColor.toLowerCase();
        return allowedColors.includes(normalizedColor);
    };

    // Helper function to get display name for element
    const getElementDisplayName = (layer) => {
        if (layer.text || layer.fullText) {
            return layer.text || layer.fullText;
        }
        return layer.name || layer.type || 'Unknown';
    };

    // Check each layer
    for (const layer of layersData) {
        // Skip pages only (we'll check artboard backgrounds)
        if (layer.type === 'Page') continue;

        // Check artboard background color
        if (layer.type === 'ab:Artboard') {
            if (layer.fill && layer.fill.type === 'Color' && layer.fill.color?.hex) {
                const backgroundColor = layer.fill.color.hex;
                if (!isColorAllowed(backgroundColor)) {
                    issues.push({
                        type: "COLOR",
                        elementId: layer.id,
                        elementType: "Artboard",
                        elementText: "Background",
                        colorType: "background",
                        message: `Background color "${backgroundColor}" is not in the brand's allowed color list`,
                        expected: allowedColors,
                        actual: backgroundColor
                    });
                }
            }
            continue; // Don't check other properties for artboards
        }

        // Check text layers for font colors
        if (layer.type === 'Text' && layer.characterStyles && Array.isArray(layer.characterStyles)) {
            for (const style of layer.characterStyles) {
                const fontColor = style.fontColor?.hex;
                if (fontColor && !isColorAllowed(fontColor)) {
                    issues.push({
                        type: "COLOR",
                        elementId: layer.id,
                        elementType: "Text",
                        elementText: getElementDisplayName(layer),
                        colorType: "fontColor",
                        message: `Font color "${fontColor}" is not in the brand's allowed color list`,
                        expected: allowedColors,
                        actual: fontColor
                    });
                }
            }
        }

        // Check shapes for fill colors
        if (layer.fill && layer.fill.type === 'Color' && layer.fill.color?.hex) {
            const fillColor = layer.fill.color.hex;
            if (!isColorAllowed(fillColor)) {
                issues.push({
                    type: "COLOR",
                    elementId: layer.id,
                    elementType: layer.type,
                    elementText: getElementDisplayName(layer),
                    colorType: "fill",
                    message: `Fill color "${fillColor}" is not in the brand's allowed color list`,
                    expected: allowedColors,
                    actual: fillColor
                });
            }
        }

        // Check shapes for stroke colors
        if (layer.stroke && layer.stroke.color?.hex) {
            const strokeColor = layer.stroke.color.hex;
            if (!isColorAllowed(strokeColor)) {
                issues.push({
                    type: "COLOR",
                    elementId: layer.id,
                    elementType: layer.type,
                    elementText: getElementDisplayName(layer),
                    colorType: "stroke",
                    message: `Stroke color "${strokeColor}" is not in the brand's allowed color list`,
                    expected: allowedColors,
                    actual: strokeColor
                });
            }
        }
    }

    console.log(`${LOG_PREFIX} Complete. Found ${issues.length} color issues`);
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
 *     colorIssues: [...],
 *     allIssues: [...],  // Combined array
 *     summary: {
 *       totalIssues: 4,
 *       fontSizeIssueCount: 1,
 *       fontFamilyIssueCount: 2,
 *       colorIssueCount: 1
 *     }
 *   }
 */
export function runAllBrandChecks(layersData, brandGuidelines) {
    const LOG_PREFIX = "[SANDBOX:BRAND-CHECK]";
    console.log(`${LOG_PREFIX} 🚀 Starting combined brand checks...`);

    const fontSizeIssues = checkBrandGuidelines(layersData, brandGuidelines);
    const fontFamilyIssues = checkFontFamily(layersData, brandGuidelines);
    const colorIssues = checkColor(layersData, brandGuidelines);

    const result = {
        fontSizeIssues: fontSizeIssues,
        fontFamilyIssues: fontFamilyIssues,
        colorIssues: colorIssues,
        allIssues: [...fontSizeIssues, ...fontFamilyIssues, ...colorIssues],
        summary: {
            totalIssues: fontSizeIssues.length + fontFamilyIssues.length + colorIssues.length,
            fontSizeIssueCount: fontSizeIssues.length,
            fontFamilyIssueCount: fontFamilyIssues.length,
            colorIssueCount: colorIssues.length
        }
    };

    console.log(`${LOG_PREFIX} Complete. Summary:`, result.summary);

    // Log complete issues list for verification using console.warn (bypasses Adobe's filter)
    console.warn(`${LOG_PREFIX} ========== COMPLETE ISSUES LIST (${result.allIssues.length} issues) ==========`);
    for (let i = 0; i < result.allIssues.length; i++) {
        const issue = result.allIssues[i];
        let expectedStr = '';
        if (issue.type === 'FONT_SIZE') {
            expectedStr = `min: ${issue.expected.min}, max: ${issue.expected.max}`;
        } else if (Array.isArray(issue.expected)) {
            expectedStr = issue.expected.join(', ');
        } else {
            expectedStr = String(issue.expected);
        }
        const elemText = issue.elementText ? `"${issue.elementText}"` : issue.elementType;
        console.warn(`${LOG_PREFIX} [${i + 1}] ${issue.type} | ${elemText} | ${issue.message} | actual: ${issue.actual} | expected: ${expectedStr}`);
    }
    console.warn(`${LOG_PREFIX} ============================================================`);

    return result;
}
