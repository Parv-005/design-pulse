"""
Gemini API Utilities for Design Pulse

This module provides helper functions for interacting with Google's Gemini API.
Uses the deprecated google-generativeai package for backward compatibility.

Author: Design Pulse Team
"""

import time
from typing import Tuple, Optional, List

# Note: Using deprecated package for compatibility
# TODO: Migrate to google.genai when ready
try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("WARNING: google-generativeai not installed. Gemini features disabled.")


def generate_gemini_response(
    api_key: str,
    system_prompt: str,
    user_message: str
) -> Tuple[Optional[str], Optional[str]]:
    """
    Generate a response from Gemini API with automatic model discovery and retry logic.
    
    Args:
        api_key: Google Gemini API key
        system_prompt: System instruction for the model
        user_message: The user's message/query
    
    Returns:
        Tuple of (response_text, error_message)
        - On success: (text, None)
        - On failure: (None, error_message)
    """
    if genai is None:
        return None, "google-generativeai package not installed"
    
    try:
        genai.configure(api_key=api_key)
        
        # 1. Dynamic Model Discovery
        candidates = []
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    candidates.append(m.name)
        except Exception as e:
            return None, f"Failed to list models: {str(e)}"

        if not candidates:
            return None, "No Gemini models available for this API key."
            
        print(f"[GEMINI] Found models: {candidates}")

        # 2. Sort by preference (flash > pro > others)
        def sort_key(name):
            if 'flash' in name: return 0
            if 'pro' in name: return 1
            return 2
        
        candidates.sort(key=sort_key)

        # 3. Try each model until success
        response = None
        last_error = None

        for model_name in candidates:
            try:
                print(f"[GEMINI] Trying model: {model_name}")
                model = genai.GenerativeModel(model_name, system_instruction=system_prompt)
                response = model.generate_content(user_message)
                print(f"[GEMINI] Success with: {model_name}")
                break
            except Exception as e:
                err_str = str(e)
                print(f"[GEMINI] {model_name} failed: {err_str}")
                
                if "429" in err_str:
                    print("[GEMINI] Rate limited. Waiting 5s...")
                    time.sleep(5)
                
                last_error = e
                continue

        if not response:
            return None, f"All models failed. Last error: {str(last_error)}"
        
        # 4. Clean up response (remove markdown code blocks)
        text = response.text
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            text = "\n".join(lines)
            
        return text.strip(), None

    except Exception as e:
        return None, f"Unexpected error: {str(e)}"


def analyze_design_with_rules(
    api_key: str,
    brand_rules_text: str,
    design_data: str
) -> Tuple[Optional[str], Optional[str]]:
    """
    Analyze a design against brand rules using Gemini.
    
    Args:
        api_key: Gemini API key
        brand_rules_text: Text containing brand guidelines
        design_data: JSON string of design layer data
    
    Returns:
        Tuple of (json_response, error_message)
    """
    system_prompt = f"""
You are a helpful, friendly design assistant.
Your goal is to help a freelancer fix their design to match the brand rules.

BRAND RULES:
{brand_rules_text[:15000]}

TASK:
Compare the Design against the Rules.
For every issue, provide a "Fix" that is SIMPLE and ACTIONABLE.
Avoid technical jargon.
Instead say: "Replace the custom shape with the official Logo." or "Change the Orange text to Purple."

OUTPUT FORMAT (JSON ONLY):
{{
    "score": number (0-100),
    "summary": "1 sentence friendly summary",
    "issues": [
        {{ "severity": "High"|"Medium"|"Low", "message": "Short description of problem", "fix": "Simple step-by-step instruction" }}
    ]
}}
"""
    user_message = f"CURRENT DESIGN DATA:\n{design_data}"
    return generate_gemini_response(api_key, system_prompt, user_message)


def describe_template(
    api_key: str,
    design_data: dict
) -> Tuple[Optional[str], Optional[str]]:
    """
    Generate a structured description of a design template using Gemini.
    
    Args:
        api_key: Gemini API key
        design_data: Dictionary of design layer data
    
    Returns:
        Tuple of (json_response, error_message)
    """
    import json
    
    system_prompt = """
You are a senior brand designer and UX strategist.
You receive a single design template from a design tool (JSON layer export).
Your job is to analyse this one template and output a structured description.

For every template, respond only in valid JSON with these fields:
- name: short human‑friendly name.
- one_line_summary: 1–2 line summary.
- recommended_use_cases: array of concrete use cases.
- visual_style_keywords: 5–10 keywords.
- primary_colors_hex: array of main colors in hex.
- typography: array of objects { "font_name": "...", "role": "heading/body/logo" }.
- brand_personality: short paragraph describing the vibe/feel.
- layout_notes: short notes about composition.
- dos_and_donts: array of guidelines about how to customize this template without breaking the brand.

Use only information that can be inferred from the provided template.
"""
    user_message = json.dumps(design_data)
    return generate_gemini_response(api_key, system_prompt, user_message)
