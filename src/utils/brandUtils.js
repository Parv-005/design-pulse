/**
 * ============================================================================
 * Brand Utilities - design-pulse
 * ============================================================================
 * 
 * This module contains utility functions for brand data management:
 * - Converting form data to brand guidelines format
 * - Saving/loading brands from localStorage
 * - Validating brand data
 * 
 * Usage:
 * import { convertToBrandGuidelines, saveBrandsToStorage, loadBrandsFromStorage } from '../utils/brandUtils.js';
 */

const STORAGE_KEY = 'designPulseBrands';

/**
 * Convert form data to brand guidelines structure
 * This is used for compatibility with the brand checking functions
 * 
 * @param {Object} formData - Form data from _collectFormValues()
 * @param {Array} layersData - Layers data from getAllLayersData() to extract canvas size
 * @returns {Object} Brand guidelines in the standard format
 * 
 * @example
 * const formData = collectFormValues();
 * const layers = await sandboxProxy.getAllLayersData();
 * const guidelines = convertToBrandGuidelines(formData, layers);
 */
export function convertToBrandGuidelines(formData, layersData = []) {
    // Use saved referenceImageSize if available (from when brand was created)
    // Otherwise, calculate from current artboard dimensions
    let referenceImageSize = formData.referenceImageSize || 500;

    if (!formData.referenceImageSize && layersData.length > 0) {
        const artboard = layersData.find(layer => layer.type === "ab:Artboard");
        if (artboard && artboard.width && artboard.height) {
            referenceImageSize = Math.min(artboard.width, artboard.height);
        }
    }

    // Build brand fonts array as simple string array
    const brandFonts = formData.selectedFonts || [];

    // Separate colors by priority (1-2 = primary, rest = secondary)
    const sortedColors = [...(formData.colors || [])].sort((a, b) => a.priority - b.priority);
    const primaryColors = sortedColors.filter(c => c.priority <= 2).map(c => c.value);
    const secondaryColors = sortedColors.filter(c => c.priority > 2).map(c => c.value);

    // Build logo object if available
    let logoObj = {
        width: 0,
        height: 0,
        minWidth: 0,
        maxWidth: 0,
        aspectRatio: 0
    };

    if (formData.logo) {
        logoObj.dataUrl = formData.logo;
    }

    return {
        brandName: formData.brandName || "",
        referenceImageSize: referenceImageSize,
        logo: logoObj,
        tagline: formData.tagline || "",
        typography: {
            brandFonts: brandFonts,
            fontSizeRange: [
                formData.minSize || 12,
                formData.maxSize || 72
            ],
            lineSpacing: formData.lineHeight || 0,
            letterSpacing: formData.letterSpacing || 1.2
        },
        colors: {
            primary: primaryColors,
            secondary: secondaryColors
        }
    };
}

/**
 * Save brands array to localStorage
 * @param {Array} brands - Array of brand objects
 */
export function saveBrandsToStorage(brands) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
        console.log('[brandUtils] Saved', brands.length, 'brands to localStorage');
    } catch (e) {
        console.error('[brandUtils] Error saving brands:', e);
    }
}

/**
 * Load brands array from localStorage
 * @returns {Array} Array of brand objects, or empty array if none found
 */
export function loadBrandsFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const brands = JSON.parse(saved);
            console.log('[brandUtils] Loaded', brands.length, 'brands from localStorage');
            return brands;
        }
    } catch (e) {
        console.error('[brandUtils] Error loading brands:', e);
    }
    return [];
}

/**
 * Calculate referenceImageSize from artboard dimensions
 * @param {Array} layersData - Layers from getAllLayersData()
 * @returns {number} The minimum of artboard width/height, or 500 as fallback
 */
export function calculateReferenceImageSize(layersData) {
    const artboard = layersData.find(layer => layer.type === "ab:Artboard");
    if (artboard && artboard.width && artboard.height) {
        return Math.min(artboard.width, artboard.height);
    }
    return 500; // fallback
}

/**
 * Validate brand data has required fields
 * @param {Object} brandData - Brand data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateBrandData(brandData) {
    const errors = [];

    if (!brandData.brandName) {
        errors.push('Brand name is required');
    }

    // Add more validation as needed

    return {
        valid: errors.length === 0,
        errors
    };
}
