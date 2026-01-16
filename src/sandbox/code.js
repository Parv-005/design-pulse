console.log("importing sandbox");
import addOnSandboxSdk from "add-on-sdk-document-sandbox";
console.log("imported sandbox");
import { editor } from "express-document-sdk";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start() {
    // APIs to be exposed to the UI runtime
    // i.e., to the `App.js` file of this add-on.
    const sandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();

            // Define rectangle dimensions.
            rectangle.width = 240;
            rectangle.height = 180;

            // Define rectangle position.
            rectangle.translation = { x: 10, y: 10 };

            // Define rectangle color.
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };

            // Fill the rectangle with the color.
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Add the rectangle to the document.
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        
        // Save brand data from the form
        saveBrandData: async (brandData) => {
            console.log("Received brand data in sandbox:", brandData);
            
            // Here you can process the brand data
            // For example, store it, validate it, or use it to update the document
            // You can also make API calls to your backend server here
            
            try {
                // Example: You could store brand data or send to external API
                // await fetch('https://your-api-endpoint.com/brands', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(brandData)
                // });
                
                // For now, just log and return success
                return { success: true, message: "Brand data saved successfully" };
            } catch (error) {
                console.error("Error processing brand data:", error);
                throw error;
            }
        },
        
        // Check if a brand exists and receive brand data
        checkBrand: async (brandData) => {
            console.log("Checking brand with data:", brandData);
            console.log("isExistingBrand:", brandData.isExistingBrand);
            
            // Here you can process the brand data
            // If isExistingBrand is true, use the provided brand data
            // You could also make an API call to your backend server
            
            // Example API call:
            // const response = await fetch('https://your-api-endpoint.com/brands/check', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(brandData)
            // });
            
            return { success: true, brandData };
        },
        
        // Upload logo file
        uploadLogo: async (dataUrl, fileName, fileType) => {
            console.log("Received logo upload:", { fileName, fileType, dataUrlLength: dataUrl.length });
            
            // Here you can:
            // 1. Convert dataUrl to blob and upload to your server
            // 2. Store it in the document
            // 3. Save it for later use
            
            // Example: Convert dataUrl to blob
            // const response = await fetch(dataUrl);
            // const blob = await response.blob();
            // Then upload blob to your server
            
            return { success: true, message: "Logo uploaded successfully" };
        },
        
        // Extract brand data from PDF
        extractBrandDataFromPdf: async (pdfDataUrl, fileName) => {
            console.log("Extracting brand data from PDF:", fileName);
            
            // Here you would integrate with a PDF parsing library or API
            // to extract brand guidelines from the PDF
            
            // Example structure of what to extract:
            // - Brand Name
            // - Tagline
            // - Brand Logo (if embedded as image)
            // - Fonts used
            // - Min/Max font sizes
            // - Primary/Secondary colors
            // - Letter spacing
            // - Line spacing
            
            // For now, return a placeholder structure
            // In production, you would use a library like pdf.js or call an API
            
            try {
                // Example: You could use pdf.js to parse the PDF
                // const pdf = await pdfjsLib.getDocument({ data: atob(pdfDataUrl.split(',')[1]) }).promise;
                // Parse pages and extract text/images
                
                // Placeholder extracted data structure
                const extractedData = {
                    brandName: "", // Extract from PDF
                    tagline: "", // Extract from PDF
                    logo: null, // Extract logo image if present
                    selectedFonts: [], // Extract font names
                    minSize: 12, // Extract minimum font size
                    maxSize: 72, // Extract maximum font size
                    colors: [ // Extract brand colors
                        { name: "Primary", value: "#000000", priority: 1 },
                        { name: "Secondary", value: "#FFFFFF", priority: 2 }
                    ],
                    letterSpacing: 0, // Extract letter spacing
                    lineHeight: 1.2 // Extract line height
                };
                
                console.log("Extracted brand data:", extractedData);
                return extractedData;
            } catch (error) {
                console.error("Error extracting data from PDF:", error);
                throw new Error("Failed to extract brand data from PDF");
            }
        }
    };

    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
