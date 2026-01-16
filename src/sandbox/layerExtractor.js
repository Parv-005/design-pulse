/**
 * ============================================================================
 * Layer Extractor - design-pulse sandbox
 * ============================================================================
 * 
 * This module contains functions for extracting layer data from Adobe Express:
 * - extractNodeData: Extract data from a single node based on its type
 * - getAllLayers: Recursively traverse and collect layer data
 * - getAllLayersData: Main entry point - extracts all layers from document
 * 
 * Usage:
 * import { getAllLayersData } from './layerExtractor.js';
 * const layers = getAllLayersData(editor, constants);
 */

import * as helpers from './helpers.js';

/**
 * Extract node data based on its type
 * @param {Object} node - Any scene node
 * @param {Object} constants - Adobe Express constants object
 * @returns {Object|null} Extracted node data
 */
export function extractNodeData(node, constants) {
    if (!node) return null;

    const nodeType = node.type;
    const baseData = {
        id: node.id || null,
        type: nodeType || null,
        name: node.name || null
    };

    switch (nodeType) {
        case constants.SceneNodeType.text:
            return {
                ...baseData,
                ...helpers.extractTextProperties(node),
                fill: helpers.extractFill(node),
                stroke: helpers.extractStroke(node),
                visualEffects: helpers.extractTextVisualEffects(node),
                ...helpers.extractShapeProperties(node)
            };

        case constants.SceneNodeType.rectangle:
        case constants.SceneNodeType.ellipse:
        case constants.SceneNodeType.polygon:
        case constants.SceneNodeType.path:
        case constants.SceneNodeType.complexShape:
        case constants.SceneNodeType.solidColorShape:
        case constants.SceneNodeType.strokeShape:
            return {
                ...baseData,
                fill: helpers.extractFill(node),
                stroke: helpers.extractStroke(node),
                ...helpers.extractShapeProperties(node)
            };

        case constants.SceneNodeType.line:
            return {
                ...baseData,
                ...helpers.extractLineProperties(node)
            };

        case constants.SceneNodeType.mediaContainer:
        case constants.SceneNodeType.imageRectangle:
        case constants.SceneNodeType.gridCell:
            return {
                ...baseData,
                ...helpers.extractMediaProperties(node)
            };

        case constants.SceneNodeType.group:
        case constants.SceneNodeType.gridLayout:
            return {
                ...baseData,
                ...helpers.extractShapeProperties(node),
                childCount: node.children ? [...node.children].length : 0
            };

        case constants.SceneNodeType.artboard:
            return {
                ...baseData,
                width: node.width || null,
                height: node.height || null,
                fill: helpers.extractFill(node)
            };

        case constants.SceneNodeType.page:
            return {
                ...baseData,
                width: node.width || null,
                height: node.height || null
            };

        case constants.SceneNodeType.linkedAsset:
            return {
                ...baseData,
                ...helpers.extractShapeProperties(node)
            };

        default:
            return {
                ...baseData,
                ...helpers.extractShapeProperties(node),
                fill: helpers.extractFill(node),
                stroke: helpers.extractStroke(node)
            };
    }
}

/**
 * Recursively traverse nodes and collect layer data
 * @param {Object} node - Starting node
 * @param {Object} constants - Adobe Express constants object
 * @param {Array} layers - Array to collect layers into
 * @param {Set} visited - Set of visited node IDs to prevent infinite loops
 * @returns {Array} Array of layer objects
 */
export function getAllLayers(node, constants, layers = [], visited = new Set()) {
    if (!node) return layers;

    // Skip if already visited (prevent circular references)
    if (node.id && visited.has(node.id)) return layers;
    if (node.id) visited.add(node.id);

    // Extract and push current node data
    const nodeData = extractNodeData(node, constants);
    if (nodeData) layers.push(nodeData);

    // If it's a Page, traverse its artboards
    if (node.type === constants.SceneNodeType.page) {
        try {
            if (node.artboards) {
                for (const artboard of node.artboards) {
                    getAllLayers(artboard, constants, layers, visited);
                }
            }
        } catch (e) {
            console.error("[getAllLayers] Error traversing page artboards:", e);
        }
    }

    // Try to traverse children
    try {
        if (node.allChildren && node.allChildren.length > 0) {
            for (const child of node.allChildren) {
                getAllLayers(child, constants, layers, visited);
            }
        } else if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                getAllLayers(child, constants, layers, visited);
            }
        }
    } catch (e) {
        // Some nodes may not have children, that's fine
    }

    return layers;
}

/**
 * Get all layers from the current document with detailed properties
 * 
 * @param {Object} editor - Adobe Express editor object
 * @param {Object} constants - Adobe Express constants object
 * @returns {Array} Array of layer objects
 */
export function getAllLayersData(editor, constants) {
    const LOG_PREFIX = "[getAllLayersData]";
    console.log(`${LOG_PREFIX} Starting layer extraction...`);

    const allLayers = [];
    try {
        const pages = editor.documentRoot.pages;
        for (const page of pages) {
            getAllLayers(page, constants, allLayers, new Set());
        }
    } catch (err) {
        console.error(`${LOG_PREFIX} Error collecting layers:`, err);
    }

    console.log(`${LOG_PREFIX} Found ${allLayers.length} layers`);
    return allLayers;
}
