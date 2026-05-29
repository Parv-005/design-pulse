# Design Pulse

**Design Pulse** is an AI-powered brand consistency engine for Adobe Express that automates compliance by instantly extracting rules from PDFs and logos to audit active designs.

## Screenshots

**Intelligent Brand Onboarding & Color Extraction**
![Extract Colours from Logo](screenshots/extract%20colours%20from%20logo%20feature%20image.jpg)

**Design Health Audit**
![Sample Design](screenshots/sample%20design%20image.png)

**Smart Fix Suggestions**
![Smart Fix Suggestions](screenshots/sample%20design%20smart%20fx%20suggestions%20image%20one%20click%20fix.png)

**One-Click Fix Applied**
![One-Click Fix Applied](screenshots/sample%20image%20one%20click%20fix%20applied%20image.png)

**Suggestions Panel**
![Suggestions Panel](screenshots/suggestions%20image.jpg)

**Main Interface Overview**
![Main Interface](screenshots/Screenshot%20From%202026-05-29%2015-32-22.png)

## Features

-   **Intelligent Brand Onboarding**: Automatically extract typography, color palettes, and taglines directly from brand guideline PDFs and logo images.
-   **Automated Design Health Audit**: Scans Express document layers in real-time to detect violations in font families, font sizes, colors, and tagline usage. 
-   **Selective One-Click Fixes**: Leverages AI to generate brand-compliant remediation steps. Review each suggestion and programmatically apply only the changes you require.
-   **Smart Suggestions Panel**: Any skipped fixes are preserved in a dedicated suggestions panel for future consideration.
-   **Modern UI/UX**: Built with Spectrum Web Components featuring smooth page transitions and a creative Adobe-themed loading animation.

## Tech Stack

-   **Frontend**: Adobe Express Add-on SDK, LitElement, Spectrum Web Components (Vanilla CSS).
-   **Backend**: Python (Flask), Google GenAI SDK (Gemini 2.0 Flash).
-   **Utilities**: `pypdf` for guideline extraction, `Pillow` for image processing.

## Setup Instructions

### 1. Backend Server (Python)
The backend handles PDF extraction and AI-driven analysis.

```bash
cd server
pip install -r requirements.txt
# Add your GEMINI_API_KEY to .env file
python server.py
```

### 2. Adobe Express Add-on

```bash
# Install dependencies
npm install

# Start development server
npm run start
```

## Project Structure

-   `src/ui/`: Contains the LitElement components and application logic.
-   `src/sandbox/`: Contains Document Sandbox code for direct document manipulation.
-   `server/`: Python Flask server and AI utility modules.

---
*Created for the Adobe Express Hackathon 2026. Ensuring brand consistency at the speed of thought.*
