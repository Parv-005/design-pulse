"""
Modern GenAI Client for Design Pulse

This module provides a simple interface to call Google's new GenAI SDK.
Uses the google-genai package (modern SDK).

Author: Design Pulse Team
"""

import os
import json
from typing import Optional, Dict, Any, Union
from PIL import Image
import io
import base64

# Import the modern genai SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    GENAI_AVAILABLE = False
    print("WARNING: google-genai not installed. GenAI features disabled.")


class GenAIClient:
    """
    A simple wrapper for Google's GenAI SDK.
    
    Usage:
        client = GenAIClient(api_key="your-api-key")
        response = client.generate_text("Hello, how are you?")
        response = client.analyze_image(image, "Describe this image")
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.0-flash"):
        """
        Initialize the GenAI client.
        
        Args:
            api_key: Google API key. If not provided, reads from GEMINI_API_KEY env var.
            model: Model name to use. Default is gemini-2.0-flash.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model
        self._client = None
        
        if not self.api_key:
            raise ValueError("API key required. Set GEMINI_API_KEY or pass api_key parameter.")
        
        if GENAI_AVAILABLE:
            self._client = genai.Client(api_key=self.api_key)
    
    def is_available(self) -> bool:
        """Check if the GenAI client is available."""
        return self._client is not None
    
    def generate_text(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate text from a prompt.
        
        Args:
            prompt: The user's prompt/question
            system_instruction: Optional system instruction
            **kwargs: Additional parameters for the API
        
        Returns:
            Dict with 'success', 'text', and optional 'error' keys
        """
        if not self.is_available():
            return {"success": False, "error": "GenAI client not available"}
        
        try:
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            
            response = self._client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config
            )
            
            return {
                "success": True,
                "text": response.text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_image(
        self,
        image: Union[Image.Image, str, bytes],
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze an image with a prompt.
        
        Args:
            image: PIL Image, base64 string, or bytes
            prompt: Text prompt for analysis
            system_instruction: Optional system instruction
        
        Returns:
            Dict with 'success', 'text', and optional 'error' keys
        """
        if not self.is_available():
            return {"success": False, "error": "GenAI client not available"}
        
        try:
            # Convert image to PIL if needed
            if isinstance(image, str):
                # Base64 string
                if ',' in image:
                    image = image.split(',')[1]
                image_data = base64.b64decode(image)
                pil_image = Image.open(io.BytesIO(image_data))
            elif isinstance(image, bytes):
                pil_image = Image.open(io.BytesIO(image))
            else:
                pil_image = image
            
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            
            response = self._client.models.generate_content(
                model=self.model,
                contents=[prompt, pil_image],
                config=config
            )
            
            return {
                "success": True,
                "text": response.text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate and parse JSON response.
        
        Args:
            prompt: The user's prompt
            system_instruction: Optional system instruction
        
        Returns:
            Dict with 'success', 'data' (parsed JSON), and optional 'error' keys
        """
        result = self.generate_text(prompt, system_instruction)
        
        if not result["success"]:
            return result
        
        text = result["text"]
        
        # Clean up markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            text = "\n".join(lines)
        
        try:
            data = json.loads(text.strip())
            return {
                "success": True,
                "data": data
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"Failed to parse JSON: {e}",
                "raw_text": text
            }


# Convenience function for quick calls
def call_genai(
    prompt: str,
    api_key: Optional[str] = None,
    system_instruction: Optional[str] = None,
    image: Optional[Union[Image.Image, str, bytes]] = None
) -> Dict[str, Any]:
    """
    Quick function to call GenAI.
    
    Args:
        prompt: The prompt to send
        api_key: Optional API key (defaults to GEMINI_API_KEY env var)
        system_instruction: Optional system instruction
        image: Optional image for vision tasks
    
    Returns:
        Dict with 'success', 'text', and optional 'error' keys
    
    Example:
        result = call_genai("What is 2+2?")
        if result["success"]:
            print(result["text"])
    """
    try:
        client = GenAIClient(api_key=api_key)
        
        if image:
            return client.analyze_image(image, prompt, system_instruction)
        else:
            return client.generate_text(prompt, system_instruction)
    except Exception as e:
        return {"success": False, "error": str(e)}
