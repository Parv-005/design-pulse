/**
 * ============================================================================
 * Color Utilities - design-pulse
 * ============================================================================
 * 
 * This module contains utility functions for color manipulation:
 * - RGB to Hex conversion
 * - Hex to RGB conversion
 * - Color extraction from Adobe Express nodes
 * 
 * Usage:
 * import { rgbToHex, hexToRgb, toRGB255, toHex } from '../utils/colorUtils.js';
 */

/**
 * Convert RGB values (0-255) to hex color string
 * @param {number} r - Red value 0-255
 * @param {number} g - Green value 0-255
 * @param {number} b - Blue value 0-255
 * @returns {string} Hex color string like "#RRGGBB"
 */
export function rgbToHex(r, g, b) {
    const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color string to RGB object
 * @param {string} hex - Hex color string like "#RRGGBB" or "RRGGBB"
 * @returns {Object|null} { r, g, b } or null if invalid
 */
export function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return null;

    return {
        r: parseInt(cleanHex.substr(0, 2), 16),
        g: parseInt(cleanHex.substr(2, 2), 16),
        b: parseInt(cleanHex.substr(4, 2), 16)
    };
}

/**
 * Convert decimal color (0-1) to RGB 0-255
 * Used for Adobe Express color values which are 0-1
 * @param {number} value - Color value 0-1
 * @returns {number} Color value 0-255
 */
export function toRGB255(value) {
    return Math.round(value * 255);
}

/**
 * Convert decimal color to hex string (two characters)
 * @param {number} value - Color value 0-1
 * @returns {string} Two-character hex string
 */
export function toHex(value) {
    const hex = toRGB255(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

/**
 * Safely extract color information from Adobe Express color object
 * @param {Object} color - Color object with red, green, blue, alpha (0-1 values)
 * @returns {Object|null} { hex: "#RRGGBB", alpha: 0-1 }
 */
export function extractColor(color) {
    if (!color) return null;

    const a = color.alpha !== undefined ? Math.round(color.alpha * 100) / 100 : 1;

    return {
        hex: `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`,
        alpha: a
    };
}

/**
 * Round a number to 2 decimal places
 * @param {number} value - The value to round
 * @returns {number|null} Rounded value or null if invalid
 */
export function round2(value) {
    if (value === null || value === undefined || value === "unknown") return null;
    return Math.round(value * 100) / 100;
}
