from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import base64
import io
import os
import json
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for Adobe Express add-on (allow all origins for development)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not set. Please set it in .env file or environment variable.")
    client = None
else:
    client = genai.Client(api_key=api_key)

# System prompt for structured JSON response
ANALYSIS_PROMPT = """You are a brand consistency analyzer for design documents. 
Analyze the provided design image and layer data for brand consistency.

The layer data contains information about all elements in the design including:
- Text elements with font family, size, color (hex), and styles
- Shape elements with fill colors and strokes
- Media containers with dimensions and positions

Analyze and respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):

{
  "brandHealthScore": <number 1-100>,
  "analysis": {
    "colors": {
      "score": <number 1-100>,
      "colorsFound": ["#hex1", "#hex2"],
      "issues": ["issue1", "issue2"],
      "suggestions": ["suggestion1"]
    },
    "typography": {
      "score": <number 1-100>,
      "fontsFound": ["Font1", "Font2"],
      "issues": ["issue1"],
      "suggestions": ["suggestion1"]
    },
    "layout": {
      "score": <number 1-100>,
      "issues": ["issue1"],
      "suggestions": ["suggestion1"]
    }
  },
  "recommendations": [
    {
      "elementId": "<id from layers>",
      "elementType": "text|shape|media",
      "issue": "description of issue",
      "suggestion": "what to change"
    }
  ],
  "summary": "Brief overall assessment"
}

Provide actionable, specific recommendations based on the actual layer data provided."""


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "gemini_configured": api_key is not None})


@app.route('/analyze', methods=['POST'])
def analyze_design():
    """
    Analyze design for brand consistency.
    Expects:
    - image: PNG/JPG file (multipart form)
    - layers: JSON string with layer data
    """
    try:
        print("=" * 50)
        print("Received analyze request")
        print(f"Files in request: {list(request.files.keys())}")
        print(f"Form data keys: {list(request.form.keys())}")
        
        # Get image from request
        if 'image' not in request.files:
            print("ERROR: No image in request")
            return jsonify({"success": False, "error": "No image provided"}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        print(f"Image size: {len(image_data)} bytes")
        
        # Get layers data
        layers_json = request.form.get('layers', '[]')
        try:
            layers_data = json.loads(layers_json)
        except json.JSONDecodeError:
            layers_data = []
        
        # Create PIL Image for Gemini
        image = Image.open(io.BytesIO(image_data))
        
        # Build the prompt with layer data
        full_prompt = f"""{ANALYSIS_PROMPT}

Layer Data:
{json.dumps(layers_data, indent=2)}

Analyze this design:"""

        # Check if client is configured
        if client is None:
            return jsonify({"success": False, "error": "Gemini API key not configured"}), 500

        # Call Gemini API using new SDK
        print("Calling Gemini API...")
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                full_prompt,
                image
            ]
        )
        print("Gemini API response received")
        
        # Parse the response as JSON
        response_text = response.text.strip()
        
        # Clean up response if it has markdown code blocks
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
                    
        try:
            analysis_result = json.loads(response_text)
        except json.JSONDecodeError:
            # If Gemini didn't return valid JSON, wrap the response
            analysis_result = {
                "brandHealthScore": 0,
                "analysis": {},
                "recommendations": [],
                "summary": response_text,
                "parseError": "Gemini response was not valid JSON"
            }
        
        return jsonify({
            "success": True,
            **analysis_result
        })

    except Exception as e:
        import traceback
        print("=" * 50)
        print(f"ERROR analyzing design: {e}")
        print("Full traceback:")
        traceback.print_exc()
        print("=" * 50)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Prompt for one-click fix - generates specific fix instructions
FIX_PROMPT = """You are a design automation assistant. Your job is to generate specific instructions to fix brand guideline violations in a design.

You will receive:
1. A list of issues found in the design (each with elementId, elementType, issue description, and actual values)
2. The brand guidelines that should be followed
3. An image of the current design for visual context

Your task is to generate a JSON response with EXACT fix instructions that can be programmatically applied.

RESPOND ONLY WITH VALID JSON (no markdown, no code blocks, just raw JSON) in this exact format:

{
  "success": true,
  "fixes": [
    {
      "elementId": "<exact element ID from the issue>",
      "elementType": "<Text|Shape|Rectangle|SolidColorShape|etc>",
      "issueType": "<FONT_SIZE|FONT_FAMILY|COLOR>",
      "action": "<CHANGE_FONT|CHANGE_SIZE|CHANGE_COLOR>",
      "currentValue": "<current value that is wrong>",
      "newValue": "<the new value to apply>",
      "colorType": "<fontColor|fill|stroke|background> (ONLY for COLOR issues, tells which color to change)",
      "reason": "<brief explanation>"
    }
  ],
  "summary": "<brief summary of all fixes>"
}

STRICT RULES:
1. For FONT_FAMILY issues: 
   - newValue MUST be EXACTLY one of the fonts specified in the brand guidelines
   - DO NOT suggest any fonts that are not explicitly listed in the brand guidelines
   - If no suitable brand font is available, DO NOT include that fix in the response
2. For FONT_SIZE issues: newValue must be a number within the allowed range (scaled appropriately)
3. For COLOR issues: 
   - newValue MUST be a hex color EXACTLY from the brand's primary or secondary colors list
   - DO NOT suggest any colors that are not explicitly listed in the brand guidelines
   - colorType must match the issue's colorType field (fontColor, fill, stroke, or background)
   - For fontColor, the element must be Text type
   - For background, the element must be an Artboard
4. Each fix must reference the exact elementId from the issues list
5. Only generate fixes for issues that were reported - don't add new ones
6. If a fix cannot be made with the designer-specified values, SKIP that fix entirely
7. Consolidate multiple issues for the same element when possible"""




@app.route('/fix', methods=['POST'])
def generate_fixes():
    """
    Generate one-click fix instructions using Gemini.
    Expects JSON body with:
    - issues: Array of issues from brand check
    - brandGuidelines: The brand guidelines object
    - designImage: Base64 encoded image of the design (optional)
    """
    try:
        print("=" * 50)
        print("Received fix request")
        
        # Get JSON data
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        issues = data.get('issues', [])
        brand_guidelines = data.get('brandGuidelines', {})
        design_image_b64 = data.get('designImage', None)
        
        print(f"Issues count: {len(issues)}")
        print(f"Brand: {brand_guidelines.get('brandName', 'Unknown')}")
        
        if len(issues) == 0:
            return jsonify({
                "success": True,
                "fixes": [],
                "summary": "No issues to fix"
            })
        
        # Build the prompt
        full_prompt = f"""{FIX_PROMPT}

BRAND GUIDELINES:
{json.dumps(brand_guidelines, indent=2)}

ISSUES TO FIX:
{json.dumps(issues, indent=2)}

Generate fix instructions for each issue above. Remember:
- For font family issues, use only fonts from: {brand_guidelines.get('typography', {}).get('brandFonts', [])}
- For font size issues, keep sizes within range: {brand_guidelines.get('typography', {}).get('fontSizeRange', [12, 72])}
- For color issues, use primary colors: {brand_guidelines.get('colors', {}).get('primary', [])} or secondary colors: {brand_guidelines.get('colors', {}).get('secondary', [])}

Generate the fix instructions:"""


        # Check if client is configured
        if client is None:
            return jsonify({"success": False, "error": "Gemini API key not configured"}), 500

        # Prepare content for Gemini
        contents = [full_prompt]
        
        # Add image if provided
        if design_image_b64:
            try:
                # Decode base64 image
                if ',' in design_image_b64:
                    design_image_b64 = design_image_b64.split(',')[1]
                image_data = base64.b64decode(design_image_b64)
                image = Image.open(io.BytesIO(image_data))
                contents.append(image)
                print("Design image included in request")
            except Exception as img_err:
                print(f"Could not process design image: {img_err}")
        
        # Call Gemini API
        print("Calling Gemini API for fix generation...")
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents
        )
        print("Gemini API response received")
        
        # Parse the response as JSON
        response_text = response.text.strip()
        
        # Clean up response if it has markdown code blocks
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            # Remove first line (```json) and last line (```)
            response_text = '\n'.join(lines[1:-1])
        
        try:
            fix_result = json.loads(response_text)
            print(f"Generated {len(fix_result.get('fixes', []))} fixes")
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Response text: {response_text[:500]}")
            fix_result = {
                "success": False,
                "fixes": [],
                "summary": "Failed to parse Gemini response",
                "rawResponse": response_text[:1000]
            }
        
        return jsonify({
            "success": True,
            **fix_result
        })

    except Exception as e:
        import traceback
        print("=" * 50)
        print(f"ERROR generating fixes: {e}")
        print("Full traceback:")
        traceback.print_exc()
        print("=" * 50)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --- COLOR EXTRACTION ENDPOINT ---
# Utilities imported from color_utils.py for modularity

from color_utils import extract_logo_colors_from_base64, colors_to_hex


@app.route('/extract_colors', methods=['POST'])
def extract_colors():
    """
    Extract dominant colors from an uploaded logo image.
    
    Expects JSON body with:
    - image_base64: Base64 encoded image (data:image/png;base64,... or raw base64)
    
    Returns:
    - success: boolean
    - colors: Array of hex color strings (e.g., ["#ff5733", "#33ff57"])
    """
    try:
        print("=" * 50)
        print("Received extract_colors request")
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        image_base64 = data.get('image_base64')
        if not image_base64:
            return jsonify({"success": False, "error": "Missing image_base64"}), 400
        
        # Extract colors using modular utility
        colors = extract_logo_colors_from_base64(image_base64)
        hex_colors = colors_to_hex(colors)
        
        print(f"Extracted {len(hex_colors)} colors: {hex_colors}")
        
        return jsonify({
            "success": True,
            "colors": hex_colors
        })
        
    except Exception as e:
        import traceback
        print("=" * 50)
        print(f"ERROR extracting colors: {e}")
        traceback.print_exc()
        print("=" * 50)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --- GEMINI LEGACY API ENDPOINTS ---
# These use the deprecated google-generativeai package for backward compatibility
# Import utilities from gemini_utils module

try:
    from gemini_utils import analyze_design_with_rules, describe_template as gemini_describe_template
    LEGACY_GEMINI_AVAILABLE = True
except ImportError:
    LEGACY_GEMINI_AVAILABLE = False
    print("WARNING: gemini_utils not available. Legacy Gemini endpoints disabled.")


@app.route('/analyze_rules', methods=['POST'])
def analyze_design_rules():
    """
    Analyze design against brand rules using legacy Gemini API.
    Expects JSON body with:
    - api_key: Gemini API key
    - brand_rules_text: Text of brand guidelines
    - design_data: JSON string of design layer data
    """
    if not LEGACY_GEMINI_AVAILABLE:
        return jsonify({"success": False, "error": "Legacy Gemini API not available"}), 500
    
    try:
        print("=" * 50)
        print("Received analyze_rules request")
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        api_key = data.get('api_key')
        brand_rules_text = data.get('brand_rules_text')
        design_data = data.get('design_data')
        
        if not api_key or not brand_rules_text or not design_data:
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        text, error = analyze_design_with_rules(api_key, brand_rules_text, design_data)
        
        if error:
            return jsonify({"success": False, "error": error}), 500
        
        # Parse and return JSON
        try:
            result = json.loads(text)
            return jsonify({"success": True, **result})
        except json.JSONDecodeError:
            return jsonify({"success": True, "raw_response": text})
            
    except Exception as e:
        import traceback
        print(f"ERROR in analyze_rules: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/describe_template_legacy', methods=['POST'])
def describe_template_endpoint():
    """
    Generate structured description of a design template using legacy Gemini API.
    Expects JSON body with:
    - api_key: Gemini API key
    - design_data: Dictionary of design layer data
    """
    if not LEGACY_GEMINI_AVAILABLE:
        return jsonify({"success": False, "error": "Legacy Gemini API not available"}), 500
    
    try:
        print("=" * 50)
        print("Received describe_template_legacy request")
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400
        
        api_key = data.get('api_key')
        design_data = data.get('design_data')
        
        if not api_key or not design_data:
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        text, error = gemini_describe_template(api_key, design_data)
        
        if error:
            return jsonify({"success": False, "error": error}), 500
        
        # Parse and return JSON
        try:
            result = json.loads(text)
            return jsonify({"success": True, **result})
        except json.JSONDecodeError:
            return jsonify({"success": True, "raw_response": text})
            
    except Exception as e:
        import traceback
        print(f"ERROR in describe_template_legacy: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("Design Pulse - Python Server")
    print("=" * 50)
    print(f"Gemini API configured: {api_key is not None}")
    print(f"Legacy Gemini available: {LEGACY_GEMINI_AVAILABLE}")
    print("Endpoints:")
    print("  GET  /health                  - Health check")
    print("  POST /analyze                 - Analyze design for brand consistency")
    print("  POST /fix                     - Generate one-click fix instructions")
    print("  POST /extract_colors          - Extract dominant colors from logo")
    print("  POST /analyze_rules           - Analyze with custom brand rules (legacy)")
    print("  POST /describe_template_legacy - Describe template (legacy)")
    print("Starting server on http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)




