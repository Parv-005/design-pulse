/**
 * DocumentSandboxApi - TypeScript interface for sandbox functions
 * 
 * This interface declares all the APIs that the document sandbox runtime
 * (code.js) exposes to the UI/iframe runtime (App.js)
 */
export interface DocumentSandboxApi {
    // ========================================================================
    // LAYER EXTRACTION
    // ========================================================================

    /**
     * Get all layers from the current document with detailed properties
     * @returns Array of layer objects with type-specific properties
     */
    getAllLayersData(): any[];

    // ========================================================================
    // BRAND GUIDELINE CHECKING
    // ========================================================================

    /**
     * Check text layers against brand guidelines for font SIZE
     * Uses ratio-based scaling to adjust allowed sizes
     */
    checkBrandGuidelines(layersData: any[], brandGuidelines: any): any[];

    /**
     * Check that fonts used in text layers are in the brand's allowed list
     */
    checkFontFamily(layersData: any[], brandGuidelines: any): any[];

    /**
     * Run all brand checks and return combined results
     */
    runAllBrandChecks(layersData: any[], brandGuidelines: any): {
        fontSizeIssues: any[];
        fontFamilyIssues: any[];
        allIssues: any[];
        summary: {
            totalIssues: number;
            fontSizeIssueCount: number;
            fontFamilyIssueCount: number;
        };
    };

    // ========================================================================
    // BRAND DATA MANAGEMENT
    // ========================================================================

    /**
     * Save brand data for persistence
     */
    saveBrandData(brandData: any): Promise<{ success: boolean; message: string }>;

    /**
     * MAIN ENTRY POINT: Check design against brand guidelines
     * Automatically gets layers and runs all checks
     */
    checkBrand(brandGuidelines: any): Promise<{
        success: boolean;
        layers: any[];
        issues: any[];
        fontSizeIssues: any[];
        fontFamilyIssues: any[];
        summary: {
            totalIssues: number;
            fontSizeIssueCount: number;
            fontFamilyIssueCount: number;
        };
        brandGuidelines: any;
        error?: string;
    }>;

    /**
     * Upload logo file
     */
    uploadLogo(dataUrl: string, fileName: string, fileType: string): Promise<{ success: boolean; message: string }>;

    /**
     * Extract brand data from PDF file
     */
    extractBrandDataFromPdf(pdfDataUrl: string, fileName: string): Promise<any>;
}
