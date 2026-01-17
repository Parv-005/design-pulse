/**
 * ============================================================================
 * Sandbox Helpers - design-pulse
 * ============================================================================
 * 
 * This module contains helper functions for the document sandbox:
 * - Color extraction from nodes
 * - Fill/stroke extraction
 * - Text property extraction
 * - Shape property extraction
 * 
 * These are used by the layer extraction and brand checking functions.
 * 
 * Usage:
 * import * as helpers from './helpers.js';
 * const color = helpers.extractColor(node.fill.color);
 */

/**
 * Round a number to 2 decimal places
 * @param {number} value - The value to round
 * @returns {number|null} Rounded value or null if invalid
 */
export const round2 = (value) => {
    if (value === null || value === undefined || value === "unknown") return null;
    return Math.round(value * 100) / 100;
};

/**
 * Convert decimal color (0-1) to RGB 0-255
 * @param {number} value - Color value 0-1
 * @returns {number} Color value 0-255
 */
export const toRGB255 = (value) => Math.round(value * 255);

/**
 * Convert decimal color to hex string
 * @param {number} value - Color value 0-1
 * @returns {string} Two-character hex string
 */
export const toHex = (value) => {
    const hex = toRGB255(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
};

/**
 * Safely extract color information (hex + alpha only)
 * @param {Object} color - Color object with red, green, blue, alpha
 * @returns {Object|null} { hex: "#RRGGBB", alpha: 0-1 }
 */
export const extractColor = (color) => {
    if (!color) return null;
    const a = color.alpha !== undefined ? Math.round(color.alpha * 100) / 100 : 1;
    return {
        hex: `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`,
        alpha: a
    };
};

/**
 * Safely extract fill information from a node
 * @param {Object} node - Scene node
 * @returns {Object|null} { type, color }
 */
export const extractFill = (node) => {
    try {
        // Standard fill property for most FillableNodes
        if (node.fill) {
            return {
                type: node.fill.type || "unknown",
                color: extractColor(node.fill.color)
            };
        }

        // SolidColorShape doesn't extend FillableNode - it may have different color access
        // Try to access color directly if it's a SolidColorShape
        if (node.type === 'SolidColorShape' || node.type === 'ab:SolidColorShape') {
            // Log available properties for debugging
            console.log(`[extractFill] SolidColorShape found, checking properties...`);

            // Try various potential color properties
            if (node.color) {
                console.log(`[extractFill] Found node.color`);
                return {
                    type: 'Color',
                    color: extractColor(node.color)
                };
            }

            // Check if it has a fillColor property
            if (node.fillColor) {
                console.log(`[extractFill] Found node.fillColor`);
                return {
                    type: 'Color',
                    color: extractColor(node.fillColor)
                };
            }

            // Log all enumerable properties for debugging
            console.log(`[extractFill] SolidColorShape keys:`, Object.keys(node));
        }
    } catch (e) {
        console.error(`[extractFill] Error:`, e);
    }
    return null;
};


/**
 * Safely extract stroke information from a node
 * @param {Object} node - Scene node
 * @returns {Object|null} { color, width, dashPattern, dashOffset }
 */
export const extractStroke = (node) => {
    try {
        if (node.stroke) {
            return {
                color: extractColor(node.stroke.color),
                width: node.stroke.width || null,
                dashPattern: node.stroke.dashPattern || null,
                dashOffset: node.stroke.dashOffset || null
            };
        }
    } catch (e) { }
    return null;
};

/**
 * Extract visual effects (outline, shadow, etc.) from a text node
 * @param {Object} node - Text node
 * @returns {Array|null} Array of effect objects
 */
export const extractTextVisualEffects = (node) => {
    const effects = [];
    try {
        if (node.visualEffects) {
            for (const effect of node.visualEffects) {
                if (typeof effect === 'string') {
                    effects.push({
                        type: effect,
                        note: "Effect properties (color, width) not accessible via current API"
                    });
                } else if (typeof effect === 'object' && effect !== null) {
                    const effectData = { type: effect.type || "unknown" };
                    if (effect.color !== undefined) effectData.color = extractColor(effect.color);
                    if (effect.strokeColor !== undefined) effectData.strokeColor = extractColor(effect.strokeColor);
                    if (effect.outlineColor !== undefined) effectData.outlineColor = extractColor(effect.outlineColor);
                    if (effect.width !== undefined) effectData.width = effect.width;
                    if (effect.strokeWidth !== undefined) effectData.strokeWidth = effect.strokeWidth;
                    if (effect.outlineWidth !== undefined) effectData.outlineWidth = effect.outlineWidth;
                    if (effect.size !== undefined) effectData.size = effect.size;
                    if (effect.offsetX !== undefined) effectData.offsetX = effect.offsetX;
                    if (effect.offsetY !== undefined) effectData.offsetY = effect.offsetY;
                    if (effect.blur !== undefined) effectData.blur = effect.blur;
                    if (effect.blurRadius !== undefined) effectData.blurRadius = effect.blurRadius;
                    if (effect.shadowColor !== undefined) effectData.shadowColor = extractColor(effect.shadowColor);
                    effects.push(effectData);
                } else {
                    effects.push({ type: String(effect) });
                }
            }
        }
    } catch (e) {
        console.error("[extractTextVisualEffects] Error:", e);
    }
    return effects.length > 0 ? effects : null;
};

/**
 * Extract text-specific properties including character and paragraph styles
 * @param {Object} node - Text node
 * @returns {Object} { text, fullText, characterStyles, paragraphStyles }
 */
export const extractTextProperties = (node) => {
    try {
        const textProps = {
            text: null,
            fullText: null,
            characterStyles: []
        };

        // Get text content - prefer fullContent over deprecated .text
        if (node.fullContent) {
            textProps.fullText = node.fullContent.text || null;
            textProps.text = node.fullContent.text || null;

            // Get character styles
            if (node.fullContent.characterStyleRanges) {
                for (const range of node.fullContent.characterStyleRanges) {
                    const styleInfo = {
                        fontFamily: null,
                        fontStyle: null,
                        fontSize: round2(range.fontSize),
                        fontColor: extractColor(range.color),
                        letterSpacing: round2(range.letterSpacing),
                        underline: range.underline || null,
                        strikethrough: range.strikethrough || null
                    };

                    if (range.font) {
                        styleInfo.fontFamily = range.font.family || null;
                        styleInfo.fontStyle = range.font.style || null;
                        styleInfo.fontPostScriptName = range.font.postScriptName || null;
                    }

                    textProps.characterStyles.push(styleInfo);
                }
            }

            // Get paragraph styles
            if (node.fullContent.paragraphStyleRanges) {
                const paraStyles = [];
                for (const range of node.fullContent.paragraphStyleRanges) {
                    paraStyles.push({
                        alignment: range.alignment || null,
                        lineSpacing: round2(range.lineSpacing)
                    });
                }
                textProps.paragraphStyles = paraStyles;
            }
        } else if (node.text) {
            textProps.text = node.text;
            textProps.fullText = node.text;
        }

        return textProps;
    } catch (e) {
        console.error("[extractTextProperties] Error:", e);
        return { text: node.text || null, error: e.message };
    }
};

/**
 * Extract shape-specific properties (position, size, rotation, etc.)
 * @param {Object} node - Shape node (Rectangle, Ellipse, Polygon, Path)
 * @returns {Object} Shape properties
 */
export const extractShapeProperties = (node) => {
    const props = {};
    try {
        if (node.width !== undefined) props.width = round2(node.width);
        if (node.height !== undefined) props.height = round2(node.height);
        if (node.rotation !== undefined) props.rotation = round2(node.rotation);
        if (node.opacity !== undefined) props.opacity = round2(node.opacity);
        if (node.blendMode !== undefined) props.blendMode = node.blendMode;
        if (node.translation) {
            props.position = {
                x: round2(node.translation.x),
                y: round2(node.translation.y)
            };
        }
        if (node.rx !== undefined) props.radiusX = round2(node.rx);
        if (node.ry !== undefined) props.radiusY = round2(node.ry);
        if (node.cornerCount !== undefined) props.cornerCount = node.cornerCount;
        if (node.cornerRadii !== undefined) props.cornerRadii = node.cornerRadii;
    } catch (e) { }
    return props;
};

/**
 * Extract line-specific properties
 * @param {Object} node - Line node
 * @returns {Object} Line properties (startX, startY, endX, endY, stroke)
 */
export const extractLineProperties = (node) => {
    const props = {};
    try {
        if (node.startX !== undefined) props.startX = round2(node.startX);
        if (node.startY !== undefined) props.startY = round2(node.startY);
        if (node.endX !== undefined) props.endX = round2(node.endX);
        if (node.endY !== undefined) props.endY = round2(node.endY);
        if (node.stroke) props.stroke = extractStroke(node);
    } catch (e) { }
    return props;
};

/**
 * Extract media container properties
 * @param {Object} node - Media container node
 * @returns {Object} Media properties (type, dimensions, position)
 */
export const extractMediaProperties = (node) => {
    const props = {};
    try {
        if (node.mediaRectangle) {
            props.mediaType = node.mediaRectangle.type || "unknown";
            props.width = round2(node.mediaRectangle.width);
            props.height = round2(node.mediaRectangle.height);
        }
        if (node.translation) {
            props.position = {
                x: round2(node.translation.x),
                y: round2(node.translation.y)
            };
        }
    } catch (e) { }
    return props;
};
