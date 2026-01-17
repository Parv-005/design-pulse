// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/theme-light.js";

// To learn more about using "spectrum web components" visit:
// https://opensource.adobe.com/spectrum-web-components/
import "@spectrum-web-components/button/sp-button.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/picker/sp-picker.js";
import "@spectrum-web-components/field-label/sp-field-label.js";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/number-field/sp-number-field.js";
import "@spectrum-web-components/picker/sp-picker.js";
import "@spectrum-web-components/slider/sp-slider.js";
import "@spectrum-web-components/swatch/sp-swatch.js";
import "@spectrum-web-components/switch/sp-switch.js";
/*Icons */
import "@spectrum-web-components/icon/sp-icon.js";
/*dropdown menu*/
import "@spectrum-web-components/picker/sync/sp-picker.js";
/*add-circle */
import "@spectrum-web-components/icons-workflow/icons/sp-icon-add-circle.js";
/*Divider*/
import '@spectrum-web-components/divider/sp-divider.js';
/*Progress circle*/
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';


import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { style } from "./App.css.js";

import { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

// PDF.js for parsing PDF files
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

@customElement("add-on-app")
export class App extends LitElement {
    @property({ type: Object })
    addOnUISdk;

    @state()
    _sandboxProxy;

    @state()
    _showSecondPage = false;

    @state()
    _showThirdPage = false;

    @state()
    _selectedBrand = null;

    @state()
    _selectedFonts = [];

    @state()
    _savedBrands = [];

    @state()
    _brandColors = {
        primary: [],
        secondary: [],
        other: []
    };

    @state()
    _uploadedLogo = null;

    @state()
    _uploadedPdf = null;

    @state()
    _pdfFileName = null;

    @state()
    _editingColorId = null;

    @state()
    _showFontPicker = false;

    @state()
    _scanResults = null;  // Stores results from brand check

    @state()
    _isScanning = false;  // Loading state for scan button

    @state()
    _pendingFixes = null; // Stores fixes to be applied after user confirmation

    @state()
    _alertMessage = null; // Stores message for custom alert overlay

    // Common fonts supported by Adobe Express
    _expressFonts = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
        'Avant Garde', 'Baskerville', 'Bodoni MT', 'Bookman Old Style',
        'Bradley Hand', 'Brush Script MT', 'Calibri', 'Cambria',
        'Century Gothic', 'Comic Sans MS', 'Copperplate', 'Courier New',
        'Didot', 'Franklin Gothic Medium', 'Garamond', 'Georgia',
        'Gill Sans', 'Helvetica', 'Impact', 'Lucida Console',
        'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Monaco', 'Montserrat',
        'Palatino', 'Perpetua', 'Rockwell', 'Tahoma', 'Times New Roman',
        'Trebuchet MS', 'Verdana', 'Open Sans', 'Roboto', 'Lato',
        'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Poppins'
    ];

    static get styles() {
        return style;
    }

    async firstUpdated() {
        // Get the UI runtime.
        const { runtime } = this.addOnUISdk.instance;

        // Get the proxy object, which is required
        // to call the APIs defined in the Document Sandbox runtime
        // i.e., in the `code.ts` file of this add-on.
        this._sandboxProxy = await runtime.apiProxy(RuntimeType.documentSandbox);

        // Load saved brands from localStorage
        this._loadSavedBrands();

        // Add click outside handler to close edit menu and font picker
        document.addEventListener('click', (e) => {
            if (this._editingColorId && !e.target.closest('.edit-color')) {
                this._editingColorId = null;
                this.requestUpdate();
            }
            if (this._showFontPicker && !e.target.closest('.typography') && !e.target.closest('#addFontBtn')) {
                this._showFontPicker = false;
                this.requestUpdate();
            }
        });
    }

    _loadSavedBrands() {
        try {
            const saved = localStorage.getItem('savedBrands');
            if (saved) {
                this._savedBrands = JSON.parse(saved);
            }
        } catch (error) {
            console.error("Error loading saved brands:", error);
            this._savedBrands = [];
        }
    }

    _saveBrands() {
        try {
            localStorage.setItem('savedBrands', JSON.stringify(this._savedBrands));
        } catch (error) {
            console.error("Error saving brands:", error);
        }
    }

    _handleClick() {
        this._sandboxProxy.createRectangle();
    }

    _handleAddBrand() {
        // Show the second page, hide the first page
        console.log("Add new brand clicked");
        this._showSecondPage = true;
    }

    _handleBackToFirstPage() {
        console.log("Back to first page clicked");
        this._showSecondPage = false;
        this._showThirdPage = false;
    }

    _handleBrandSelection(event) {
        const selectedValue = event.target.value;
        this._selectedBrand = selectedValue;
        console.log("Selected brand:", selectedValue);

        // Load brand data when selected
        if (selectedValue) {
            const savedBrand = this._savedBrands.find(b => b.brandName === selectedValue);
            if (savedBrand) {
                // Populate form fields with saved data
                this._loadBrandData(savedBrand);
            }
        }
    }

    _loadBrandData(brandData) {
        const LOG = "[BRAND-LOAD]";
        console.log(`${LOG} Loading data for brand:`, brandData.brandName);
        // Populate brand colors - support both old array format and new category format
        if (brandData.colors) {
            if (Array.isArray(brandData.colors)) {
                // Old format - convert to new format (all colors go to 'other')
                this._brandColors = {
                    primary: [],
                    secondary: [],
                    other: brandData.colors.map((c, index) => ({
                        id: c.id || `color-${Date.now()}-${index}`,
                        value: c.value || c
                    }))
                };
            } else if (typeof brandData.colors === 'object') {
                // New format with categories
                this._brandColors = {
                    primary: (brandData.colors.primary || []).map((c, index) => ({
                        id: c.id || `primary-${Date.now()}-${index}`,
                        value: c.value || c
                    })),
                    secondary: (brandData.colors.secondary || []).map((c, index) => ({
                        id: c.id || `secondary-${Date.now()}-${index}`,
                        value: c.value || c
                    })),
                    other: (brandData.colors.other || []).map((c, index) => ({
                        id: c.id || `other-${Date.now()}-${index}`,
                        value: c.value || c
                    }))
                };
            }
        } else {
            this._brandColors = {
                primary: [],
                secondary: [],
                other: []
            };
        }

        // Populate fonts
        if (brandData.selectedFonts && Array.isArray(brandData.selectedFonts)) {
            this._selectedFonts = [...brandData.selectedFonts];
        }

        // Populate logo
        if (brandData.logo) {
            this._uploadedLogo = brandData.logo;
        }

        // Populate PDF
        if (brandData.pdf) {
            this._uploadedPdf = brandData.pdf;
        }
        if (brandData.pdfFileName) {
            this._pdfFileName = brandData.pdfFileName;
        }
    }

    async _handleDeleteBrand(brandName, event) {
        event.stopPropagation();
        event.preventDefault();

        // Use sweetAlert for confirmation
        const Swal = window.Swal;
        if (!Swal) {
            // Fallback to regular confirm if sweetAlert is not available
            if (confirm(`Are you sure you want to delete "${brandName}" and all its data?`)) {
                this._savedBrands = this._savedBrands.filter(b => b.brandName !== brandName);
                this._saveBrands();

                if (this._selectedBrand === brandName) {
                    this._selectedBrand = null;
                    this._resetForm();
                }

                console.log(`Brand "${brandName}" deleted`);
                this.requestUpdate();
            }
            return;
        }

        const result = await Swal.fire({
            title: 'Delete Brand?',
            text: `Are you sure you want to delete "${brandName}" and all its data? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            this._savedBrands = this._savedBrands.filter(b => b.brandName !== brandName);
            this._saveBrands();

            // If deleted brand was selected, clear selection
            if (this._selectedBrand === brandName) {
                this._selectedBrand = null;
                this._resetForm();
            }

            // Show success message
            await Swal.fire({
                title: 'Deleted!',
                text: `Brand "${brandName}" has been deleted.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            console.log(`Brand "${brandName}" deleted`);
            this.requestUpdate(); // Update UI to reflect changes
        }
    }

    async _handlePdfUpload(event) {
        const LOG = "[PDF-UPLOAD]";
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            alert("Please select a PDF file");
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB");
            return;
        }

        console.log(`${LOG} Processing PDF: ${file.name}`);
        this._pdfFileName = file.name;

        try {
            // Read file as ArrayBuffer for pdfjs
            const arrayBuffer = await file.arrayBuffer();
            console.log(`${LOG} PDF loaded, parsing...`);

            // Parse PDF with pdfjs-dist
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log(`${LOG} PDF has ${pdf.numPages} pages`);

            // Extract text from all pages
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + "\n";
            }

            console.log(`${LOG} Extracted ${fullText.length} characters from PDF`);

            // Store the extracted text
            this._uploadedPdf = fullText;
            this._pdfExtractedText = fullText;

            // Try to auto-extract some basic info
            const extractedData = this._parseExtractedPdfText(fullText);
            if (extractedData) {
                this._populateFormFromExtractedData(extractedData);
            }

            alert(`✅ PDF imported successfully! Extracted ${fullText.length} characters.`);
            this.requestUpdate();

        } catch (error) {
            console.error(`${LOG} Error:`, error);
            alert(`Error reading PDF: ${error.message}`);
        }
    }

    /**
     * Parse extracted PDF text to find brand data
     */
    _parseExtractedPdfText(text) {
        const data = {};
        const lowerText = text.toLowerCase();

        // Try to find brand name (usually near the start or after "brand name:")
        const brandMatch = text.match(/brand\s*name[:\s]+([A-Za-z0-9\s]+)/i);
        if (brandMatch) {
            data.brandName = brandMatch[1].trim().split(/\s+/).slice(0, 3).join(" ");
        }

        // Try to find colors (hex codes)
        const hexMatches = text.match(/#[A-Fa-f0-9]{6}\b/g);
        if (hexMatches && hexMatches.length > 0) {
            data.colors = [...new Set(hexMatches)].map((hex, i) => ({
                id: `pdf-color-${i}`,
                value: hex.toUpperCase()
            }));
        }

        // Try to find font names (common patterns)
        const fontPatterns = [
            /font[:\s]+([A-Za-z\s]+)/gi,
            /typeface[:\s]+([A-Za-z\s]+)/gi,
            /(Arial|Helvetica|Roboto|Open Sans|Montserrat|Lato|Poppins|Inter|Source Sans|Futura|Avenir)/gi
        ];
        const foundFonts = new Set();
        for (const pattern of fontPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const fontName = match[1]?.trim();
                if (fontName && fontName.length > 2 && fontName.length < 30) {
                    foundFonts.add(fontName);
                }
            }
        }
        if (foundFonts.size > 0) {
            data.selectedFonts = Array.from(foundFonts).slice(0, 5);
        }

        console.log("[PDF-PARSE] Extracted data:", data);
        return Object.keys(data).length > 0 ? data : null;
    }

    _populateFormFromExtractedData(extractedData) {
        // Populate brand name
        if (extractedData.brandName) {
            const brandNameInput = this.shadowRoot.querySelector('#newBrandName');
            if (brandNameInput) brandNameInput.value = extractedData.brandName;
        }

        // Populate tagline
        if (extractedData.tagline) {
            const taglineInput = this.shadowRoot.querySelector('#tagline');
            if (taglineInput) taglineInput.value = extractedData.tagline;
        }

        // Populate colors - support both old array format and new category format
        if (extractedData.colors) {
            if (Array.isArray(extractedData.colors)) {
                // Old format - convert to new format (all colors go to 'other')
                this._brandColors = {
                    primary: [],
                    secondary: [],
                    other: extractedData.colors.map((c, index) => ({
                        id: c.id || `extracted-${Date.now()}-${index}`,
                        value: c.value || c
                    }))
                };
            } else if (typeof extractedData.colors === 'object') {
                // New format with categories
                this._brandColors = {
                    primary: (extractedData.colors.primary || []).map((c, index) => ({
                        id: c.id || `extracted-primary-${Date.now()}-${index}`,
                        value: c.value || c
                    })),
                    secondary: (extractedData.colors.secondary || []).map((c, index) => ({
                        id: c.id || `extracted-secondary-${Date.now()}-${index}`,
                        value: c.value || c
                    })),
                    other: (extractedData.colors.other || []).map((c, index) => ({
                        id: c.id || `extracted-other-${Date.now()}-${index}`,
                        value: c.value || c
                    }))
                };
            }
        }

        // Populate fonts
        if (extractedData.selectedFonts && Array.isArray(extractedData.selectedFonts)) {
            this._selectedFonts = [...extractedData.selectedFonts];
        }

        // Populate logo
        if (extractedData.logo) {
            this._uploadedLogo = extractedData.logo;
        }

        // Populate font sizes
        if (extractedData.minSize !== undefined) {
            const minSizeInput = this.shadowRoot.querySelector('#minSize');
            if (minSizeInput) minSizeInput.value = extractedData.minSize;
        }

        if (extractedData.maxSize !== undefined) {
            const maxSizeInput = this.shadowRoot.querySelector('#maxSize');
            if (maxSizeInput) maxSizeInput.value = extractedData.maxSize;
        }

        // Populate letter spacing
        if (extractedData.letterSpacing !== undefined) {
            const letterSpacingInput = this.shadowRoot.querySelector('#letterSpacingSize');
            if (letterSpacingInput) letterSpacingInput.value = extractedData.letterSpacing;
        }

        // Populate line height
        if (extractedData.lineHeight !== undefined) {
            const lineHeightInput = this.shadowRoot.querySelector('#lineHeight');
            if (lineHeightInput) lineHeightInput.value = extractedData.lineHeight;
        }
    }

    _collectFormValues() {
        const formData = {};

        // If user selected an existing brand (first page)
        if (this._selectedBrand) {
            formData.brandName = this._selectedBrand;
            formData.isExistingBrand = true;
            // Load saved brand data if it exists
            const savedBrand = this._savedBrands.find(b => b.brandName === this._selectedBrand);
            if (savedBrand) {
                // Preserve isExistingBrand: true and merge saved data
                const { isExistingBrand: _, ...savedDataWithoutFlag } = savedBrand;
                return { ...savedDataWithoutFlag, ...formData }; // formData's isExistingBrand will override
            }
            return formData;
        }

        // If user is creating a new brand (second page)
        const brandNameInput = this.shadowRoot.querySelector('#newBrandName');
        const minSizeInput = this.shadowRoot.querySelector('#minSize');
        const maxSizeInput = this.shadowRoot.querySelector('#maxSize');
        const taglineInput = this.shadowRoot.querySelector('#tagline');
        const letterSpacingInput = this.shadowRoot.querySelector('#letterSpacingSize');
        const lineHeightInput = this.shadowRoot.querySelector('#lineHeight');

        formData.brandName = brandNameInput ? brandNameInput.value : '';
        formData.tagline = taglineInput ? taglineInput.value : '';
        formData.minSize = minSizeInput ? parseInt(minSizeInput.value) : null;
        formData.maxSize = maxSizeInput ? parseInt(maxSizeInput.value) : null;
        formData.letterSpacing = letterSpacingInput ? parseFloat(letterSpacingInput.value) : null;
        formData.lineHeight = lineHeightInput ? parseFloat(lineHeightInput.value) : null;
        // Collect colors from all categories
        formData.colors = {
            primary: this._brandColors.primary || [],
            secondary: this._brandColors.secondary || [],
            other: this._brandColors.other || []
        };
        formData.selectedFonts = this._selectedFonts;
        formData.logo = this._uploadedLogo;
        formData.pdf = this._uploadedPdf;
        formData.pdfFileName = this._pdfFileName;
        formData.isExistingBrand = false;

        return formData;
    }

    async _handleSubmitBrand() {
        const LOG = "[BRAND-SUBMIT]";
        const formData = this._collectFormValues();

        console.log(`${LOG} Submitting brand data:`, formData.brandName);

        // Validate form data
        if (!formData.isExistingBrand && !formData.brandName) {
            this._showAlert("Please enter a brand name");
            return;
        }

        try {
            // Save brand to localStorage and add to dropdown
            if (!formData.isExistingBrand) {
                // Check if brand already exists
                const existingIndex = this._savedBrands.findIndex(b => b.brandName === formData.brandName);
                if (existingIndex >= 0) {
                    this._savedBrands[existingIndex] = formData;
                    console.log(`${LOG} Updated existing brand: ${formData.brandName}`);
                } else {
                    this._savedBrands = [...this._savedBrands, formData];
                    console.log(`${LOG} Added new brand: ${formData.brandName}`);
                }
                this._saveBrands();
                console.log(`${LOG} Saved ${this._savedBrands.length} brands to localStorage`);
            } else {
                // Update existing brand
                const existingIndex = this._savedBrands.findIndex(b => b.brandName === formData.brandName);
                if (existingIndex >= 0) {
                    this._savedBrands[existingIndex] = formData;
                    this._saveBrands();
                    console.log(`${LOG} Updated existing brand: ${formData.brandName}`);
                }
            }

            // Also try to send to sandbox if available
            if (this._sandboxProxy && this._sandboxProxy.saveBrandData) {
                await this._sandboxProxy.saveBrandData(formData);
                console.log(`${LOG} Brand data also saved to sandbox`);
            }

            this._showAlert("Brand data saved successfully!");
            // Reset form and navigate back
            this._resetForm();
            this._showSecondPage = false;

            // Force re-render to update dropdown
            this.requestUpdate();
        } catch (error) {
            console.error(`${LOG} Error saving brand data:`, error);
            this._showAlert("Error saving brand data. Please try again.");
        }
    }

    _resetForm() {
        const brandNameInput = this.shadowRoot.querySelector('#newBrandName');
        const minSizeInput = this.shadowRoot.querySelector('#minSize');
        const maxSizeInput = this.shadowRoot.querySelector('#maxSize');
        const taglineInput = this.shadowRoot.querySelector('#tagline');
        const letterSpacingInput = this.shadowRoot.querySelector('#letterSpacingSize');
        const lineHeightInput = this.shadowRoot.querySelector('#lineHeight');

        if (brandNameInput) brandNameInput.value = '';
        if (taglineInput) taglineInput.value = '';
        if (minSizeInput) minSizeInput.value = '12';
        if (maxSizeInput) maxSizeInput.value = '72';
        if (letterSpacingInput) letterSpacingInput.value = '0';
        if (lineHeightInput) lineHeightInput.value = '1.2';

        this._brandColors = {
            primary: [],
            secondary: [],
            other: []
        };
        this._selectedFonts = [];
        this._uploadedLogo = null;
        this._uploadedPdf = null;
        this._pdfFileName = null;
    }

    /**
     * Convert form data to brand guidelines structure for checking
     */
    _convertToBrandGuidelines(formData, layersData = []) {
        let referenceImageSize = formData.referenceImageSize || 500;
        if (!formData.referenceImageSize && layersData.length > 0) {
            const artboard = layersData.find(layer => layer.type === "ab:Artboard");
            if (artboard && artboard.width && artboard.height) {
                referenceImageSize = Math.min(artboard.width, artboard.height);
            }
        }

        const brandFonts = formData.selectedFonts || [];

        // Extract colors from new category format
        const primaryColors = (formData.colors?.primary || []).map(c => c.value || c);
        const secondaryColors = (formData.colors?.secondary || []).map(c => c.value || c);

        return {
            brandName: formData.brandName || "",
            referenceImageSize: referenceImageSize,
            tagline: formData.tagline || "",
            typography: {
                brandFonts: brandFonts,
                fontSizeRange: [formData.minSize || 12, formData.maxSize || 72],
                lineSpacing: formData.lineHeight || 0,
                letterSpacing: formData.letterSpacing || 1.2
            },
            colors: { primary: primaryColors, secondary: secondaryColors }
        };
    }

    _handleCheckBrand() {
        if (!this._selectedBrand) {
            console.warn("[_handleCheckBrand] No brand selected");
            return;
        }
        console.log("[_handleCheckBrand] Navigating to scan results page for brand:", this._selectedBrand);
        this._scanResults = null;
        this._isScanning = false;
        this._showThirdPage = true;
    }

    _handleBackFromThirdPage() {
        this._showThirdPage = false;
        this._scanResults = null;
        this._isScanning = false;
    }

    async _handleScanDesign() {
        const LOG = "[DESIGN-SCAN]";
        if (!this._selectedBrand) {
            console.warn(`${LOG} No brand selected for scan`);
            return;
        }
        console.log(`${LOG} 🚀 Starting design scan for brand: ${this._selectedBrand}`);
        this._isScanning = true;
        this._scanResults = null;

        try {
            const formData = this._collectFormValues();
            const layers = await this._sandboxProxy.getAllLayersData();
            const brandGuidelines = this._convertToBrandGuidelines(formData, layers);
            console.log("[_handleScanDesign] Brand guidelines:", JSON.stringify(brandGuidelines, null, 2));

            const result = await this._sandboxProxy.checkBrand(brandGuidelines);
            this._scanResults = result;
            console.log("[_handleScanDesign] Total Issues:", result.summary.totalIssues);
            return result;
        } catch (error) {
            console.error("[_handleScanDesign] Error:", error);
            this._scanResults = { success: false, error: error.message, issues: [], summary: { totalIssues: 0 } };
        } finally {
            this._isScanning = false;
        }
    }

    async _handleTestScan() {
        const LOG = "[TEST-SCAN]";
        console.log(`${LOG} 🧪 Starting NovaTech brand test scan...`);
        const novatechBrand = {
            brandName: "NovaTech",
            referenceImageSize: 1200,
            typography: { brandFonts: ["Roboto", "Arial"], fontSizeRange: [12, 72], lineSpacing: 0, letterSpacing: 1.2 },
            colors: { primary: ["#4B2BEE"], secondary: ["#FF5D5D", "#1F2937"] }
        };
        this._isScanning = true;
        this._scanResults = null;
        try {
            const result = await this._sandboxProxy.checkBrand(novatechBrand);
            this._scanResults = result;
            console.log("[TEST] Total Issues:", result.summary.totalIssues);
            return result;
        } catch (error) {
            console.error("[TEST] Error:", error);
            this._scanResults = { success: false, error: error.message, issues: [], summary: { totalIssues: 0 } };
        } finally {
            this._isScanning = false;
        }
    }

    async _handleOneClickFix() {
        const LOG = "[ONE-CLICK-FIX]";
        console.log(`${LOG} ========================================`);
        console.log(`${LOG} 🚀 Starting One-Click Fix Process`);
        console.log(`${LOG} ========================================`);

        if (!this._scanResults?.issues?.length) {
            console.warn(`${LOG} ❌ No issues to fix - aborting`);
            alert("No issues to fix!");
            return;
        }

        console.log(`${LOG} 📋 Issues to fix: ${this._scanResults.issues.length}`);
        this._scanResults.issues.forEach((issue, i) => {
            console.log(`${LOG}   ${i + 1}. [${issue.type}] ${issue.elementText} - ${issue.message}`);
        });

        try {
            // Step 1: Get brand guidelines
            console.log(`${LOG} ----------------------------------------`);
            console.log(`${LOG} 📝 Step 1: Collecting form values...`);
            const formData = this._collectFormValues();
            console.log(`${LOG} ✅ Form data collected:`, formData.brandName);

            console.log(`${LOG} 📝 Step 2: Getting layers from document...`);
            const layers = await this._sandboxProxy.getAllLayersData();
            console.log(`${LOG} ✅ Got ${layers.length} layers`);

            console.log(`${LOG} 📝 Step 3: Converting to brand guidelines...`);
            const brandGuidelines = this._convertToBrandGuidelines(formData, layers);
            console.log(`${LOG} ✅ Brand guidelines:`, JSON.stringify(brandGuidelines, null, 2));

            // Step 2: Create rendition preview
            console.log(`${LOG} ----------------------------------------`);
            console.log(`${LOG} 🖼️ Step 4: Creating design rendition...`);
            let designImageBase64 = null;
            try {
                const addOnUISdk = this.addOnUISdk;
                console.log(`${LOG}   - Calling createRenditions API...`);
                const rendition = await addOnUISdk.app.document.createRenditions(
                    {
                        range: addOnUISdk.constants.Range.currentPage,
                        format: addOnUISdk.constants.RenditionFormat.png,
                    },
                    addOnUISdk.constants.RenditionIntent.preview
                );

                const imageBlob = rendition[0].blob;
                console.log(`${LOG}   - Rendition blob size: ${imageBlob.size} bytes`);

                console.log(`${LOG}   - Converting blob to base64...`);
                const reader = new FileReader();
                designImageBase64 = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageBlob);
                });
                console.log(`${LOG} ✅ Rendition created, base64 length: ${designImageBase64?.length || 0}`);
            } catch (renditionError) {
                console.warn(`${LOG} ⚠️ Could not create rendition:`, renditionError.message);
                console.warn(`${LOG}   - Continuing without image (Gemini will use text-only analysis)`);
            }

            // Step 3: Call the fix endpoint
            console.log(`${LOG} ----------------------------------------`);
            console.log(`${LOG} 🌐 Step 5: Calling /fix endpoint...`);
            console.log(`${LOG}   - URL: http://localhost:5000/fix`);
            console.log(`${LOG}   - Issues: ${this._scanResults.issues.length}`);
            console.log(`${LOG}   - Has image: ${designImageBase64 !== null}`);

            const requestBody = {
                issues: this._scanResults.issues,
                brandGuidelines: brandGuidelines,
                designImage: designImageBase64
            };
            console.log(`${LOG}   - Request body size: ${JSON.stringify(requestBody).length} bytes`);

            const response = await fetch('http://localhost:5000/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            console.log(`${LOG}   - Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`${LOG} ✅ Server response received`);
            console.log(`${LOG}   - Success: ${result.success}`);
            console.log(`${LOG}   - Fixes count: ${result.fixes?.length || 0}`);
            console.log(`${LOG}   - Summary: ${result.summary || 'N/A'}`);

            if (result.fixes?.length > 0) {
                console.log(`${LOG} 📋 Suggested fixes:`);
                result.fixes.forEach((fix, i) => {
                    console.log(`${LOG}   ${i + 1}. ${fix.action}: "${fix.currentValue}" → "${fix.newValue}"`);
                    console.log(`${LOG}      Element: ${fix.elementId} | Reason: ${fix.reason}`);
                });
            }

            // Step 4: Ask user for confirmation via custom modal
            console.log(`${LOG} ----------------------------------------`);
            console.log(`${LOG} 👤 Step 6: Showing confirmation modal...`);
            this._pendingFixes = {
                fixes: result.fixes,
                summary: result.summary,
                displayList: result.fixes.map((fix, i) =>
                    `${i + 1}. ${fix.action}: "${fix.currentValue}" → "${fix.newValue}" (${fix.reason})`
                )
            };
            this.requestUpdate();

        } catch (error) {
            console.error(`${LOG} ========================================`);
            console.error(`${LOG} ❌ ERROR in One-Click Fix`);
            console.error(`${LOG} Message: ${error.message}`);
            console.error(`${LOG} Stack:`, error.stack);
            console.error(`${LOG} ========================================`);
            this._showAlert(`Error generating fixes: ${error.message}`);
        }
    }

    _showAlert(message) {
        console.log(`[ALERT] ${message}`);
        this._alertMessage = message;
        this.requestUpdate();
    }

    async _handleConfirmFixes() {
        const LOG = "[ONE-CLICK-FIX]";
        if (!this._pendingFixes) return;

        const fixes = this._pendingFixes.fixes;
        this._pendingFixes = null; // Hide modal

        console.log(`${LOG} ✅ User confirmed fixes`);

        // Step 5: Apply fixes via sandbox
        console.log(`${LOG} ----------------------------------------`);
        console.log(`${LOG} 🔧 Step 7: Applying fixes via sandbox...`);
        if (this._sandboxProxy?.applyFixes) {
            console.log(`${LOG}   - Calling sandboxProxy.applyFixes()...`);
            try {
                const applyResult = await this._sandboxProxy.applyFixes(fixes);
                console.log(`${LOG} ✅ Fixes applied`);
                console.log(`${LOG}   - Result:`, applyResult);
                this._showAlert(`Applied ${fixes.length} fix(es)! Re-scan to verify.`);
            } catch (err) {
                console.error(`${LOG} ❌ Error applying fixes:`, err);
                this._showAlert(`Failed to apply fixes: ${err.message}`);
            }
        } else {
            console.warn(`${LOG} ⚠️ sandboxProxy.applyFixes not available`);
            this._showAlert(`Generated ${fixes.length} fix(es). Check console for manual application list.`);
        }

        console.log(`${LOG} ========================================`);
        console.log(`${LOG} ✅ One-Click Fix Process Complete`);
        console.log(`${LOG} ========================================`);
    }

    _handleCancelFixes() {
        console.log("[ONE-CLICK-FIX] ❌ User cancelled fixes");
        this._pendingFixes = null;
    }

    _handleFileUpload(event) {
        const LOG = "[LOGO-UPLOAD]";
        console.log(`${LOG} Starting logo upload...`);
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert("Please select a PNG, JPG, or JPEG file");
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB");
            return;
        }

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this._uploadedLogo = dataUrl;

            // Send to backend
            if (this._sandboxProxy && this._sandboxProxy.uploadLogo) {
                this._sandboxProxy.uploadLogo(dataUrl, file.name, file.type);
            }

            // Update UI to show the image
            this.requestUpdate();
        };
        reader.readAsDataURL(file);
    }

    async _handleAddColor(category = 'other') {
        const LOG = `[COLOR-ADD:${category.toUpperCase()}]`;
        console.log(`${LOG} Opening color picker...`);
        try {
            // Try to use Adobe's color picker API if available
            // Note: The actual API might differ - check Adobe Express SDK documentation
            let colorResult = null;

            if (this.addOnUISdk && this.addOnUISdk.app && this.addOnUISdk.app.ui) {
                // Try different possible API methods
                if (typeof this.addOnUISdk.app.ui.showColorPicker === 'function') {
                    colorResult = await this.addOnUISdk.app.ui.showColorPicker({
                        color: { red: 0.29, green: 0.18, blue: 0.93, alpha: 1 }
                    });
                } else if (typeof this.addOnUISdk.app.ui.pickColor === 'function') {
                    colorResult = await this.addOnUISdk.app.ui.pickColor({
                        color: { red: 0.29, green: 0.18, blue: 0.93, alpha: 1 }
                    });
                }
            }

            if (colorResult && colorResult.color) {
                const { red, green, blue } = colorResult.color;
                const hexColor = this._rgbToHex(
                    Math.round(red * 255),
                    Math.round(green * 255),
                    Math.round(blue * 255)
                );

                // Add new color to the specified category
                const newColor = {
                    id: `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    value: hexColor
                };

                this._brandColors = {
                    ...this._brandColors,
                    [category]: [...this._brandColors[category], newColor]
                };
                this.requestUpdate();
                return;
            }
        } catch (error) {
            console.log("Adobe color picker not available, using browser fallback:", error);
        }

        // Fallback: Use browser's native color picker (swatch)
        const input = document.createElement('input');
        input.type = 'color';
        input.value = '#4B2BEE';
        input.style.position = 'fixed';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';

        input.onchange = (e) => {
            const hexColor = e.target.value;
            const newColor = {
                id: `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                value: hexColor
            };
            this._brandColors = {
                ...this._brandColors,
                [category]: [...this._brandColors[category], newColor]
            };
            this.requestUpdate();
            document.body.removeChild(input);
        };

        input.oncancel = () => {
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    }

    _rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    async _handleExtractColorsFromLogo() {
        const LOG = "[EXTRACT-COLORS]";
        console.log(`${LOG} Starting color extraction from logo...`);

        if (!this._uploadedLogo) {
            alert("Please upload a logo first");
            return;
        }

        try {
            console.log(`${LOG} Calling /extract_colors endpoint...`);

            const response = await fetch('http://localhost:5000/extract_colors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: this._uploadedLogo
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`${LOG} Server response:`, result);

            if (result.success && result.colors && result.colors.length > 0) {
                // Convert hex colors to color objects
                const extractedColors = result.colors.map(hex => ({
                    id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    value: hex
                }));

                // Add extracted colors to "other" category
                this._brandColors = {
                    ...this._brandColors,
                    other: [...this._brandColors.other, ...extractedColors]
                };
                this.requestUpdate();
                alert(`✅ Extracted ${extractedColors.length} color(s) from logo`);
                console.log(`${LOG} Added ${extractedColors.length} colors to 'other' category`);
            } else {
                alert("Could not extract colors from logo");
                console.warn(`${LOG} No colors extracted:`, result);
            }
        } catch (error) {
            console.error(`${LOG} Error:`, error);
            alert(`Error extracting colors: ${error.message}`);
        }
    }

    async _handleColorSwatchClick(colorId, category) {
        const color = this._brandColors[category]?.find(c => c.id === colorId);
        if (!color) return;

        try {
            // Try to use Adobe's color picker API if available
            let colorResult = null;

            if (this.addOnUISdk && this.addOnUISdk.app && this.addOnUISdk.app.ui) {
                // Convert hex to RGB for Adobe API
                const hex = color.value.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16) / 255;
                const g = parseInt(hex.substr(2, 2), 16) / 255;
                const b = parseInt(hex.substr(4, 2), 16) / 255;

                if (typeof this.addOnUISdk.app.ui.showColorPicker === 'function') {
                    colorResult = await this.addOnUISdk.app.ui.showColorPicker({
                        color: { red: r, green: g, blue: b, alpha: 1 }
                    });
                } else if (typeof this.addOnUISdk.app.ui.pickColor === 'function') {
                    colorResult = await this.addOnUISdk.app.ui.pickColor({
                        color: { red: r, green: g, blue: b, alpha: 1 }
                    });
                }
            }

            if (colorResult && colorResult.color) {
                const { red, green, blue } = colorResult.color;
                const hexColor = this._rgbToHex(
                    Math.round(red * 255),
                    Math.round(green * 255),
                    Math.round(blue * 255)
                );

                // Update the color in the specific category
                this._brandColors = {
                    ...this._brandColors,
                    [category]: this._brandColors[category].map(c =>
                        c.id === colorId ? { ...c, value: hexColor } : c
                    )
                };
                this.requestUpdate();
                return;
            }
        } catch (error) {
            console.log("Adobe color picker not available, using browser fallback:", error);
        }

        // Fallback: Use browser's native color picker (swatch)
        const input = document.createElement('input');
        input.type = 'color';
        input.value = color.value;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';

        input.onchange = (e) => {
            const hexColor = e.target.value;
            // Update the color in the specific category
            this._brandColors = {
                ...this._brandColors,
                [category]: this._brandColors[category].map(c =>
                    c.id === colorId ? { ...c, value: hexColor } : c
                )
            };
            this.requestUpdate();
            document.body.removeChild(input);
        };

        input.oncancel = () => {
            document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
    }

    _handleEditColor(event, colorId, category) {
        event.stopPropagation();
        const fullId = `${category}-${colorId}`;
        this._editingColorId = this._editingColorId === fullId ? null : fullId;
    }

    _handleRemoveColor(colorId, category) {
        this._brandColors = {
            ...this._brandColors,
            [category]: this._brandColors[category].filter(c => c.id !== colorId)
        };
        this._editingColorId = null;
        this.requestUpdate();
    }

    _handleChangePriority(colorId, category, direction) {
        const categoryColors = this._brandColors[category] || [];
        const index = categoryColors.findIndex(c => c.id === colorId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categoryColors.length) return;

        const colors = [...categoryColors];
        [colors[index], colors[newIndex]] = [colors[newIndex], colors[index]];

        // Update the category
        this._brandColors = {
            ...this._brandColors,
            [category]: colors
        };

        this._editingColorId = null;
        this.requestUpdate();
    }

    _handleShiftColorCategory(colorId, fromCategory, toCategory) {
        // Find the color in the source category
        const sourceColors = this._brandColors[fromCategory] || [];
        const colorIndex = sourceColors.findIndex(c => c.id === colorId);

        if (colorIndex === -1) return;

        // Get the color object
        const color = sourceColors[colorIndex];

        // Remove from source category and add to target category
        this._brandColors = {
            ...this._brandColors,
            [fromCategory]: sourceColors.filter(c => c.id !== colorId),
            [toCategory]: [...(this._brandColors[toCategory] || []), color]
        };

        this._editingColorId = null;
        this.requestUpdate();
    }

    _handleShowFontPicker(event) {
        event.stopPropagation();
        this._showFontPicker = !this._showFontPicker;
    }

    _handleSelectFont(font) {
        if (!this._selectedFonts.includes(font)) {
            this._selectedFonts = [...this._selectedFonts, font];
        }
        // Don't close the picker - allow selecting multiple fonts
    }

    _handleRemoveFont(font) {
        this._selectedFonts = this._selectedFonts.filter(f => f !== font);
    }



    render() {
        // Please note that the below "<sp-theme>" component does not react to theme changes in Express.
        // You may use "this.addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
        return html`
      <sp-theme system="express" color="light" scale="medium">
        <section class="first-page" style="display: ${this._showSecondPage || this._showThirdPage ? 'none' : 'block'}">
            <div class="hero-icon">
            <div>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                height="72"
                viewBox="0 0 18 18"
                width="72"
                id="shield"
                style="fill: #0057FF"
                >
                <title>S Shield 18 N</title>
                <rect
                    id="Canvas"
                    fill="#ff13dc"
                    opacity="0"
                    width="18"
                    height="18"
                />
                <path
                    class="fill"
                    d="M15,1.5a.5.5,0,0,0-.5-.5H3.5a.5.5,0,0,0-.5.5V8.05a7.804,7.804,0,0,0,2.9285,6.0935l2.837,2.1775a.35.35,0,0,0,.4685,0l2.837-2.1775A7.804,7.804,0,0,0,15,8.05ZM4.861,11.1435A7.24092,7.24092,0,0,1,4,8V2H14Z"
                />
                </svg>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                height="18"
                viewBox="0 0 18 18"
                width="18"
                id="checkmark-circle"
                style="fill: #3A6FFF"
                >
                <title>S CheckmarkCircle 18 N</title>
                <rect
                    id="Canvas"
                    fill="#ff13dc"
                    opacity="0"
                    width="18"
                    height="18"
                />
                <path
                    class="fill"
                    d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm5.333,4.54L8.009,13.6705a.603.603,0,0,1-.4375.2305H7.535a.6.6,0,0,1-.4245-.1755L3.218,9.829a.6.6,0,0,1-.00147-.84853L3.218,8.979l.663-.6625A.6.6,0,0,1,4.72953,8.315L4.731,8.3165,7.4,10.991l5.257-6.7545a.6.6,0,0,1,.8419-.10586L13.5,4.1315l.7275.5685A.6.6,0,0,1,14.333,5.54Z"
                />
                </svg>
            </div>
            </div>
            <div class="hero-head">
            <h2>Brand Health Checker</h2>
            <div>
                <p>Analyse your designs against brand guidelines instantly</p>
            </div>
            </div>
            <div class="brand-box">
            <sp-field-label for="brandPicker" class="brand-choose-text"
                >Which brand are you designing for?</sp-field-label
            >
            <sp-picker id="brandPicker" label="Choose brand" @change=${this._handleBrandSelection}>
                ${this._savedBrands.length > 0
                ? this._savedBrands.map(brand =>
                    html`
                        <sp-menu-item value="${brand.brandName}" style="position: relative; display: flex; align-items: center; justify-content: space-between; padding-right: 30px;">
                            <span>${brand.brandName}</span>
                            <svg class="brand-delete-btn" xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 18 18" width="14" style="fill: #464646; cursor: pointer; position: absolute; right: 8px;" @click=${(e) => this._handleDeleteBrand(brand.brandName, e)} title="Delete brand" @mousedown=${(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <title>S Close 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
                                <path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm4.25,10.25a.5.5,0,0,1-.707.707L9,10.207,5.457,13.75a.5.5,0,0,1-.707-.707L8.293,9.5,4.75,5.957a.5.5,0,0,1,.707-.707L9,8.793l3.543-3.543a.5.5,0,0,1,.707.707L9.707,9.5Z" />
                            </svg>
                        </sp-menu-item>
                    `
                )
                : html`
                      <sp-menu-item value="Brand A">Brand A</sp-menu-item>
                      <sp-menu-item value="Brand B">Brand B</sp-menu-item>
                      <sp-menu-item value="Brand C">Brand C</sp-menu-item>
                    `
            }
            </sp-picker>
            <sp-button size="m" variant="accent" style="margin-top: 10px; width: 100%;" @click=${this._handleCheckBrand} ?disabled=${!this._selectedBrand} class="continue-button">
                <div class="continue-button-text">
                    Continue with Selected Brand
                </div>
            </sp-button>
            <div>
                <div class="line"></div>
                <p>OR</p>
                <div class="line"></div>
            </div>
            <sp-button size="m" @click=${this._handleAddBrand}>
                
                <svg
                xmlns="http://www.w3.org/2000/svg"
                height="21"
                viewBox="0 0 18 18"
                width="21"
                style="fill: #fff"
                >
                <title>S AddCircle 18 N</title>
                <rect
                    id="Canvas"
                    fill="#ff13dc"
                    opacity="0"
                    width="18"
                    height="18"
                />
                <path
                    class="fill"
                    d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm5,8.5a.5.5,0,0,1-.5.5H10v3.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V10H4.5A.5.5,0,0,1,4,9.5v-1A.5.5,0,0,1,4.5,8H8V4.5A.5.5,0,0,1,8.5,4h1a.5.5,0,0,1,.5.5V8h3.5a.5.5,0,0,1,.5.5Z"
                />
                </svg>
                Add a new brand
            </sp-button>
            </div>
        </section>
        <section class="second-page" style="display: ${this._showSecondPage && !this._showThirdPage ? 'block' : 'none'}">
            <div class="title">
                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill: #464646; cursor: pointer;" @click=${this._handleBackToFirstPage}>
                    <title>S ChevronLeft 18 N</title>
                    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M6,9a.994.994,0,0,0,.2925.7045l3.9915,3.99a1,1,0,1,0,1.4355-1.386l-.0245-.0245L8.4095,9l3.286-3.285A1,1,0,0,0,10.309,4.28l-.0245.0245L6.293,8.2945A.994.994,0,0,0,6,9Z" />
                </svg>
                <h3>New Brand Rules</h3>
                <div></div>
            </div>
            <div class="divider">
                <sp-divider></sp-divider>
            </div>
            <div class="guidelines">
                <h4>Import guidelines from pdf</h4>
                <input type="file" id="pdfInput" accept="application/pdf" style="display: none;" @change=${this._handlePdfUpload}>
                <sp-button size="m" id="pdfUpload" @click=${() => this.shadowRoot.querySelector('#pdfInput')?.click()}>
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 18 18" width="16" style="fill : #fff; transform: rotate(-90deg)">
                            <title>S Import 18 N</title>
                            <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M16.5,1H5.5a.5.5,0,0,0-.5.5v3a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,7,4.5V3h8V15H7V13.5a.5.5,0,0,0-.5-.5h-1a.5.5,0,0,0-.5.5v3a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V1.5A.5.5,0,0,0,16.5,1Z" />
                            <path class="fill" d="M8,12.6a.4.4,0,0,0,.4.4.39352.39352,0,0,0,.2635-.1l3.762-3.7225a.25.25,0,0,0,0-.35L8.666,5.1A.39352.39352,0,0,0,8.4025,5a.4.4,0,0,0-.4.4V8H1.5a.5.5,0,0,0-.5.5v1a.5.5,0,0,0,.5.5H8Z" />
                        </svg>
                        Upload
                    </div>
                </sp-button>
                <div class="pdf-preview">
                    ${this._pdfFileName ? html`
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background-color: #f3f3f3; border: 1px solid #b6b4b4; border-radius: 5px; margin-top: 10px;">
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill: #FF5D5D;">
                                <title>S File 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
                                <path class="fill" d="M15.5,1H2.5A.5.5,0,0,0,2,1.5v15a.5.5,0,0,0,.5.5h13a.5.5,0,0,0,.5-.5V1.5A.5.5,0,0,0,15.5,1Zm0,15H3V2H15Z" />
                                <path class="fill" d="M13,11.5H5a.5.5,0,0,1,0-1h8a.5.5,0,0,1,0,1Z" />
                                <path class="fill" d="M13,8.5H5a.5.5,0,0,1,0-1h8a.5.5,0,0,1,0,1Z" />
                                <path class="fill" d="M13,14.5H5a.5.5,0,0,1,0-1h8a.5.5,0,0,1,0,1Z" />
                            </svg>
                            <span style="flex: 1; font-size: 0.875rem; color: #464646;">${this._pdfFileName}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 18 18" width="14" style="fill: #464646; cursor: pointer;" @click=${() => { this._uploadedPdf = null; this._pdfFileName = null; this.requestUpdate(); }} title="Remove PDF">
                                <title>S Close 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
                                <path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm4.25,10.25a.5.5,0,0,1-.707.707L9,10.207,5.457,13.75a.5.5,0,0,1-.707-.707L8.293,9.5,4.75,5.957a.5.5,0,0,1,.707-.707L9,8.793l3.543-3.543a.5.5,0,0,1,.707.707L9.707,9.5Z" />
                            </svg>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="manual-add">
                <div class="divider">
                               
                    <sp-divider></sp-divider>
                </div>
                <h5>Or</h5>
                <div class="divider">
                    
                    <sp-divider></sp-divider>
                </div>

            </div>
            <div class="manual-heading">
                <h5>Add Manually</h5>
            </div>
            <div class="brand-name">
                <p>Brand Name</p>
                <input type="text" name="brand-name" id="newBrandName" placeholder="Enter brand name...">
            </div>
            <div class="brand-logo">
                <div class="brand-logo-text">
                    <h4>Brand Logo</h4>
                    <p>PNG or SVG, max 2MB</p>
                    <input type="file" id="fileInput" accept="image/png,image/jpeg,image/jpg" style="display: none;" @change=${this._handleFileUpload}>
                    <sp-button size = "m" id="upload" @click=${() => this.shadowRoot.querySelector('#fileInput')?.click()}>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 18 18" width="16" style="fill : #fff; transform: rotate(-90deg)">
                                <title>S Import 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M16.5,1H5.5a.5.5,0,0,0-.5.5v3a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,7,4.5V3h8V15H7V13.5a.5.5,0,0,0-.5-.5h-1a.5.5,0,0,0-.5.5v3a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5V1.5A.5.5,0,0,0,16.5,1Z" />
                                <path class="fill" d="M8,12.6a.4.4,0,0,0,.4.4.39352.39352,0,0,0,.2635-.1l3.762-3.7225a.25.25,0,0,0,0-.35L8.666,5.1A.39352.39352,0,0,0,8.4025,5a.4.4,0,0,0-.4.4V8H1.5a.5.5,0,0,0-.5.5v1a.5.5,0,0,0,.5.5H8Z" />
                            </svg>
                            Upload
                        </div>
                    </sp-button>
                </div>
                <div class="brand-logo-image">
                    ${this._uploadedLogo
                ? html`<img src="${this._uploadedLogo}" alt="Brand Logo" style="width: 100px; height: 100px; object-fit: contain; border-radius: 5px;">`
                : html`
                          <svg xmlns="http://www.w3.org/2000/svg" height="100" viewBox="0 0 18 18" width="100" style="fill : rgba(53, 51, 51, 0.5)" >
                              <title>S ImageAdd 18 N</title>
                              <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><circle class="fill" cx="11.9" cy="6.3" r="1.25" />
                              <path class="fill" d="M7.35,13.5a6.11347,6.11347,0,0,1,.631-2.7C6.927,9.621,5.8285,8,4.8925,8,3.5565,8,1,12,1,12V3H17V8.4465a6.183,6.183,0,0,1,1,.8715V2.5a.534.534,0,0,0-.5625-.5H.5625A.534.534,0,0,0,0,2.5v13a.534.534,0,0,0,.5625.5h7.322A6.12013,6.12013,0,0,1,7.35,13.5Z" />
                              <path class="fill" d="M13.5,9.05a4.45,4.45,0,1,0,4.45,4.45A4.45,4.45,0,0,0,13.5,9.05Zm2.5,4.7a.25.25,0,0,1-.25.25H14v1.75a.25.25,0,0,1-.25.25h-.5a.25.25,0,0,1-.25-.25V14H11.25a.25.25,0,0,1-.25-.25v-.5a.25.25,0,0,1,.25-.25H13V11.25a.25.25,0,0,1,.25-.25h.5a.25.25,0,0,1,.25.25V13h1.75a.25.25,0,0,1,.25.25Z" />
                          </svg>
                        `
            }
                </div>
            </div>
            <div class="tagline">
                <h4>Tagline</h4>
                <input type="text" name="tagline" id="tagline" placeholder="Enter tagline...">
            </div>
            <div class="typography" style="position: relative;">
                <h4>Typography</h4>
                <p>Allowed Fonts</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px;">
                    <sp-button size="s" class="add-font-btn" id="addFontBtn" @click=${this._handleShowFontPicker} style="position: relative;">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill : #111"> 
                                <title>S AddToSelection 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M12.08,2.7215l.514-.8885a7.97354,7.97354,0,0,0-2.7-.803V2.063A6.94168,6.94168,0,0,1,12.08,2.7215Z" />
                                <path class="fill" d="M14.765,5.033l.9-.5175a8.06649,8.06649,0,0,0-1.926-1.985l-.519.894A7.03319,7.03319,0,0,1,14.765,5.033Z" />
                                <path class="fill" d="M15.9665,8.3315H17a7.95519,7.95519,0,0,0-.6895-2.6455L15.415,6.2A6.95,6.95,0,0,1,15.9665,8.3315Z" />
                                <path class="fill" d="M15.9665,9.6685a6.95,6.95,0,0,1-.55,2.129l.8955.516A7.95513,7.95513,0,0,0,17,9.6685Z" />
                                <path class="fill" d="M13.22,14.5755l.5165.894a8.06544,8.06544,0,0,0,1.926-1.985l-.9-.5175A7.033,7.033,0,0,1,13.22,14.5755Z" />
                                <path class="fill" d="M9.8925,15.937V16.97a7.97354,7.97354,0,0,0,2.7-.803l-.5125-.8885A6.94146,6.94146,0,0,1,9.8925,15.937Z" />
                                <path class="fill" d="M6.269,15.447l-.514.8885A7.99637,7.99637,0,0,0,8.5535,17V15.9775A6.96845,6.96845,0,0,1,6.269,15.447Z" />
                                <path class="fill" d="M3.3695,13.1465l-.9.5175a8.06609,8.06609,0,0,0,2.107,2.031l.513-.8875A7.03548,7.03548,0,0,1,3.3695,13.1465Z" />
                                <path class="fill" d="M2.0335,9.6685H1a7.94984,7.94984,0,0,0,.787,2.847L2.6825,12A6.94449,6.94449,0,0,1,2.0335,9.6685Z" />
                                <path class="fill" d="M2.6825,6,1.787,5.4845A7.94984,7.94984,0,0,0,1,8.3315H2.0335A6.94449,6.94449,0,0,1,2.6825,6Z" />
                                <path class="fill" d="M5.092,3.192l-.513-.8875a8.06609,8.06609,0,0,0-2.107,2.031l.9.5175A7.03639,7.03639,0,0,1,5.092,3.192Z" />
                                <path class="fill" d="M8.5535,2.0225V1a7.99514,7.99514,0,0,0-2.8.6645l.5135.8885A6.96854,6.96854,0,0,1,8.5535,2.0225Z" />
                                <path class="fill" d="M14,9.5a.5.5,0,0,1-.5.5H10v3.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V10H4.5A.5.5,0,0,1,4,9.5v-1A.5.5,0,0,1,4.5,8H8V4.5A.5.5,0,0,1,8.5,4h1a.5.5,0,0,1,.5.5V8h3.5a.5.5,0,0,1,.5.5Z" />
                            </svg>
                            Add Font
                        </div>
                    </sp-button>
                    ${this._showFontPicker ? html`
                        <div style="position: absolute; left: 0; top: 100%; margin-top: 5px; background: white; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1002; max-height: 300px; overflow-y: auto; min-width: 200px; max-width: 250px;">
                            ${this._expressFonts.map(font => html`
                                <div 
                                    style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; font-family: '${font}', sans-serif; ${this._selectedFonts.includes(font) ? 'background-color: #f5f5f5;' : ''}"
                                    @click=${() => this._handleSelectFont(font)}
                                    @mouseover=${(e) => e.target.style.backgroundColor = '#f9f9f9'}
                                    @mouseout=${(e) => e.target.style.backgroundColor = this._selectedFonts.includes(font) ? '#f5f5f5' : 'white'}
                                >
                                    ${font} ${this._selectedFonts.includes(font) ? '✓' : ''}
                                </div>
                            `)}
                        </div>
                    ` : ''}
                    ${this._selectedFonts.map(font => html`
                        <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: #f3f3f3; border: 1px dashed #5258e4; border-radius: 17.5px; font-size: 0.875rem; font-family: '${font}', sans-serif;">
                            <span>${font}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 18 18" width="14" style="fill: #464646; cursor: pointer;" @click=${() => this._handleRemoveFont(font)}>
                                <title>S Close 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />
                                <path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm4.25,10.25a.5.5,0,0,1-.707.707L9,10.207,5.457,13.75a.5.5,0,0,1-.707-.707L8.293,9.5,4.75,5.957a.5.5,0,0,1,.707-.707L9,8.793l3.543-3.543a.5.5,0,0,1,.707.707L9.707,9.5Z" />
                            </svg>
                        </div>
                    `)}
                </div>
            </div>
            <div class="brand-size">
                <div class="min-size-div">
                    <sp-field-label>Min Size</sp-field-label>
                    <input type="number" name="min-size" id="minSize" value="12">
                </div>
                <div class="max-size-div">
                    <sp-field-label>Max Size</sp-field-label>
                    <input type="number" name="max-size" id="maxSize" value="72">
                </div>
            </div>
            <div class="brand-color">
                <h4>Brand Colors</h4>
                <div style="margin: 20px 5px;">
                    <sp-button size="m" variant="accent" style="width: 100%;" class="extract-colors-btn" @click=${this._handleExtractColorsFromLogo} >
                        <div>
                            Extract colors from logo
                        </div>
                    </sp-button>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px;">Primary Colors</h5>
                    ${(this._brandColors.primary || []).map((color, index) => {
                const fullId = `primary-${color.id}`;
                return html`
                            <div class="color" id="color-${fullId}" style="position: relative; z-index: ${this._editingColorId === fullId ? '1000' : '1'};">
                                <div class="color-info">
                                    <div class="show-color" style="background-color: ${color.value}; cursor: pointer;" @click=${() => this._handleColorSwatchClick(color.id, 'primary')} title="Click to change color"></div>
                                    <div class="color-info-text">
                                        <span>${color.value}</span>
                                    </div>
                                </div>
                                <div class="edit-color" @click=${(e) => this._handleEditColor(e, color.id, 'primary')} style="cursor: pointer; position: relative;">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill : #464646">
                                        <title>S Edit 18 N</title>
                                        <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M16.7835,4.1,13.9,1.216a.60751.60751,0,0,0-.433-.1765H13.45a.6855.6855,0,0,0-.4635.203L2.542,11.686a.49494.49494,0,0,0-.1255.211L1.0275,16.55c-.057.1885.2295.4255.3915.4255a.12544.12544,0,0,0,.031-.0035c.138-.0315,3.933-1.172,4.6555-1.389a.486.486,0,0,0,.207-.1245L16.7565,5.014a.686.686,0,0,0,.2-.4415A.61049.61049,0,0,0,16.7835,4.1ZM5.7,14.658c-1.0805.3245-2.431.7325-3.3645,1.011L3.34,12.304Z" />
                                    </svg>
                                    ${this._editingColorId === fullId ? html`
                                        <div style="position: absolute; right: 0; top: 25px; background: white; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1001; min-width: 180px;">
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleRemoveColor(color.id, 'primary')}>
                                                Remove Color
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'primary', 'secondary')}>
                                                Shift to Secondary
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'primary', 'other')}>
                                                Shift to Other
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === 0 ? 'opacity: 0.5;' : ''}" @click=${() => index > 0 && this._handleChangePriority(color.id, 'primary', 'up')}>
                                                Move Up ${index === 0 ? '(Already at top)' : ''}
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === (this._brandColors.primary || []).length - 1 ? 'opacity: 0.5;' : ''}" @click=${() => index < (this._brandColors.primary || []).length - 1 && this._handleChangePriority(color.id, 'primary', 'down')}>
                                                Move Down ${index === (this._brandColors.primary || []).length - 1 ? '(Already at bottom)' : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
            })}
                    <sp-button size="s" class="add-color-btn" @click=${() => this._handleAddColor('primary')}>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill :#5258e4">
                                <title>S AddCircle 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm5,8.5a.5.5,0,0,1-.5.5H10v3.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V10H4.5A.5.5,0,0,1,4,9.5v-1A.5.5,0,0,1,4.5,8H8V4.5A.5.5,0,0,1,8.5,4h1a.5.5,0,0,1,.5.5V8h3.5a.5.5,0,0,1,.5.5Z" />
                            </svg>
                            Add color
                        </div>
                    </sp-button>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px;">Secondary Colors</h5>
                    ${(this._brandColors.secondary || []).map((color, index) => {
                const fullId = `secondary-${color.id}`;
                return html`
                            <div class="color" id="color-${fullId}" style="position: relative; z-index: ${this._editingColorId === fullId ? '1000' : '1'};">
                                <div class="color-info">
                                    <div class="show-color" style="background-color: ${color.value}; cursor: pointer;" @click=${() => this._handleColorSwatchClick(color.id, 'secondary')} title="Click to change color"></div>
                                    <div class="color-info-text">
                                        <span>${color.value}</span>
                                    </div>
                                </div>
                                <div class="edit-color" @click=${(e) => this._handleEditColor(e, color.id, 'secondary')} style="cursor: pointer; position: relative;">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill : #464646">
                                        <title>S Edit 18 N</title>
                                        <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M16.7835,4.1,13.9,1.216a.60751.60751,0,0,0-.433-.1765H13.45a.6855.6855,0,0,0-.4635.203L2.542,11.686a.49494.49494,0,0,0-.1255.211L1.0275,16.55c-.057.1885.2295.4255.3915.4255a.12544.12544,0,0,0,.031-.0035c.138-.0315,3.933-1.172,4.6555-1.389a.486.486,0,0,0,.207-.1245L16.7565,5.014a.686.686,0,0,0,.2-.4415A.61049.61049,0,0,0,16.7835,4.1ZM5.7,14.658c-1.0805.3245-2.431.7325-3.3645,1.011L3.34,12.304Z" />
                                    </svg>
                                    ${this._editingColorId === fullId ? html`
                                        <div style="position: absolute; right: 0; top: 25px; background: white; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1001; min-width: 180px;">
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleRemoveColor(color.id, 'secondary')}>
                                                Remove Color
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'secondary', 'primary')}>
                                                Shift to Primary
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'secondary', 'other')}>
                                                Shift to Other
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === 0 ? 'opacity: 0.5;' : ''}" @click=${() => index > 0 && this._handleChangePriority(color.id, 'secondary', 'up')}>
                                                Move Up ${index === 0 ? '(Already at top)' : ''}
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === (this._brandColors.secondary || []).length - 1 ? 'opacity: 0.5;' : ''}" @click=${() => index < (this._brandColors.secondary || []).length - 1 && this._handleChangePriority(color.id, 'secondary', 'down')}>
                                                Move Down ${index === (this._brandColors.secondary || []).length - 1 ? '(Already at bottom)' : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
            })}
                    <sp-button size="s" class="add-color-btn" @click=${() => this._handleAddColor('secondary')}>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill :#5258e4">
                                <title>S AddCircle 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm5,8.5a.5.5,0,0,1-.5.5H10v3.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V10H4.5A.5.5,0,0,1,4,9.5v-1A.5.5,0,0,1,4.5,8H8V4.5A.5.5,0,0,1,8.5,4h1a.5.5,0,0,1,.5.5V8h3.5a.5.5,0,0,1,.5.5Z" />
                            </svg>
                            Add color
                        </div>
                    </sp-button>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 10px;">Other Colors</h5>
                    ${(this._brandColors.other || []).map((color, index) => {
                const fullId = `other-${color.id}`;
                return html`
                            <div class="color" id="color-${fullId}" style="position: relative; z-index: ${this._editingColorId === fullId ? '1000' : '1'};">
                                <div class="color-info">
                                    <div class="show-color" style="background-color: ${color.value}; cursor: pointer;" @click=${() => this._handleColorSwatchClick(color.id, 'other')} title="Click to change color"></div>
                                    <div class="color-info-text">
                                        <span>${color.value}</span>
                                    </div>
                                </div>
                                <div class="edit-color" @click=${(e) => this._handleEditColor(e, color.id, 'other')} style="cursor: pointer; position: relative;">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill : #464646">
                                        <title>S Edit 18 N</title>
                                        <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M16.7835,4.1,13.9,1.216a.60751.60751,0,0,0-.433-.1765H13.45a.6855.6855,0,0,0-.4635.203L2.542,11.686a.49494.49494,0,0,0-.1255.211L1.0275,16.55c-.057.1885.2295.4255.3915.4255a.12544.12544,0,0,0,.031-.0035c.138-.0315,3.933-1.172,4.6555-1.389a.486.486,0,0,0,.207-.1245L16.7565,5.014a.686.686,0,0,0,.2-.4415A.61049.61049,0,0,0,16.7835,4.1ZM5.7,14.658c-1.0805.3245-2.431.7325-3.3645,1.011L3.34,12.304Z" />
                                    </svg>
                                    ${this._editingColorId === fullId ? html`
                                        <div style="position: absolute; right: 0; top: 25px; background: white; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1001; min-width: 180px;">
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleRemoveColor(color.id, 'other')}>
                                                Remove Color
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'other', 'primary')}>
                                                Shift to Primary
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" @click=${() => this._handleShiftColorCategory(color.id, 'other', 'secondary')}>
                                                Shift to Secondary
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === 0 ? 'opacity: 0.5;' : ''}" @click=${() => index > 0 && this._handleChangePriority(color.id, 'other', 'up')}>
                                                Move Up ${index === 0 ? '(Already at top)' : ''}
                                            </div>
                                            <div style="padding: 8px 12px; cursor: pointer; ${index === (this._brandColors.other || []).length - 1 ? 'opacity: 0.5;' : ''}" @click=${() => index < (this._brandColors.other || []).length - 1 && this._handleChangePriority(color.id, 'other', 'down')}>
                                                Move Down ${index === (this._brandColors.other || []).length - 1 ? '(Already at bottom)' : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
            })}
                    <sp-button size="s" class="add-color-btn" @click=${() => this._handleAddColor('other')}>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill :#5258e4">
                                <title>S AddCircle 18 N</title>
                                <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M9,1a8,8,0,1,0,8,8A8,8,0,0,0,9,1Zm5,8.5a.5.5,0,0,1-.5.5H10v3.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V10H4.5A.5.5,0,0,1,4,9.5v-1A.5.5,0,0,1,4.5,8H8V4.5A.5.5,0,0,1,8.5,4h1a.5.5,0,0,1,.5.5V8h3.5a.5.5,0,0,1,.5.5Z" />
                            </svg>
                            Add color
                        </div>
                    </sp-button>
                </div>
            </div>
            
            <div class="layout-spacing">
                <h4>Layout & Spacing</h4>
                    
                <div class="layout-spacing-item">
                    <div class="letter-spacing">
                        <sp-field-label>Letter Spacing</sp-field-label>
                        <input type="number" name="letter-spacing-size" id="letterSpacingSize" value="0">
                    </div>
                    <div class="line-spacing">
                        <sp-field-label>Line Spacing</sp-field-label>
                        <input type="number" name="line-spacing-size" id="lineHeight" value="1.2">
                    </div>
                </div>

            </div>
            <div style="margin: 20px 5px;">
                <sp-button size="m" variant="accent" style="width: 100%;" @click=${this._handleSubmitBrand} class="save-brand-rules-btn">
                    Save Brand Rules
                </sp-button>
            </div>            
        </section>
        <section class="third-page" style="display: ${this._showThirdPage ? 'block' : 'none'}; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18" style="fill: #464646; cursor: pointer;" @click=${this._handleBackFromThirdPage}>
                    <title>Back</title>
                    <rect fill="#ff13dc" opacity="0" width="18" height="18" /><path class="fill" d="M6,9a.994.994,0,0,0,.2925.7045l3.9915,3.99a1,1,0,1,0,1.4355-1.386l-.0245-.0245L8.4095,9l3.286-3.285A1,1,0,0,0,10.309,4.28l-.0245.0245L6.293,8.2945A.994.994,0,0,0,6,9Z" />
                </svg>
                <h3 style="margin: 0;">Brand Check: ${this._selectedBrand || 'Unknown'}</h3>
            </div>

            <sp-button size="m" variant="accent" style="width: 100%; margin-bottom: 16px;" @click=${this._handleScanDesign} ?disabled=${this._isScanning}>
                ${this._isScanning ? 'Scanning...' : 'Scan Design'}
            </sp-button>

            <sp-button size="m" variant="secondary" style="width: 100%; margin-bottom: 16px;" @click=${this._handleTestScan} ?disabled=${this._isScanning}>
                🧪 Test NovaTech Scan
            </sp-button>

            <div style="min-height: 200px; border: 1px dashed #ccc; border-radius: 8px; padding: 16px; background: #f9f9f9;">
                ${this._scanResults === null
                ? html`<p style="color: #666; text-align: center;">Click "Scan Design" to check your design against brand guidelines.</p>`
                : this._scanResults.success
                    ? html`
                            <h4 style="margin-top: 0;">Scan Results</h4>
                            <p><strong>Total Issues:</strong> ${this._scanResults.summary?.totalIssues || 0}</p>
                            <p>Font Size Issues: ${this._scanResults.summary?.fontSizeIssueCount || 0}</p>
                            <p>Font Family Issues: ${this._scanResults.summary?.fontFamilyIssueCount || 0}</p>
                            ${this._scanResults.issues?.length > 0
                            ? html`
                                    <div style="margin-top: 12px;">
                                        <h5>Issues Found:</h5>
                                        ${this._scanResults.issues.map(issue => html`
                                            <div style="padding: 8px; margin: 4px 0; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px;">
                                                <strong>[${issue.type}]</strong> ${issue.message}
                                                <br/><small style="color: #666;">Element: "${issue.elementText}"</small>
                                            </div>
                                        `)}
                                    </div>
                                `
                            : html`<p style="color: green;">✓ No issues! Design follows brand guidelines.</p>`
                        }
                        `
                    : html`<p style="color: red;">Error: ${this._scanResults.error || 'Unknown error'}</p>`
            }
            </div>

            ${this._scanResults?.issues?.length > 0
                ? html`
                    <sp-button size="m" variant="primary" style="width: 100%; margin-top: 16px;" @click=${this._handleOneClickFix}>
                        One-Click Fix (${this._scanResults.issues.length} issues)
                    </sp-button>
                `
                : ''
            }
            ${this._renderModals()}
        </section>
      </sp-theme>
    `;
    }

    _renderModals() {
        return html`
            <!-- Fix Confirmation Modal -->
            ${this._pendingFixes ? html`
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; max-width: 100%; max-height: 80%; overflow-y: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                        <h3 style="margin-top: 0; color: #291ee1;">Gemini Suggests ${this._pendingFixes.fixes.length} Fixes</h3>
                        <p style="font-size: 13px; color: #666; font-style: italic;">${this._pendingFixes.summary}</p>
                        <div style="margin: 15px 0; max-height: 300px; overflow-y: auto; border-top: 1px solid #eee; padding-top: 10px;">
                            ${this._pendingFixes.displayList.map(item => html`
                                <div style="font-size: 12px; margin-bottom: 8px; padding: 5px; background: #f9f9f9; border-left: 3px solid #291ee1;">${item}</div>
                            `)}
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <sp-button variant="accent" @click=${this._handleConfirmFixes}>Apply All Fixes</sp-button>
                            <sp-button variant="secondary" @click=${this._handleCancelFixes}>Cancel</sp-button>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Alert Modal -->
            ${this._alertMessage ? html`
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1001; display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.3); text-align: center;">
                        <p style="margin-bottom: 20px;">${this._alertMessage}</p>
                        <sp-button variant="primary" @click=${() => this._alertMessage = null}>OK</sp-button>
                    </div>
                </div>
            ` : ''}
        `;
    }
}
