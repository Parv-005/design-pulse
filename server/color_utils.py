"""
Color Extraction Utilities for Design Pulse

This module provides functions to extract dominant colors from logo images.
Used by the /extract_colors endpoint in server.py.

Author: Design Pulse Team
"""

import base64
import io
from PIL import Image
import numpy as np
from collections import Counter
from typing import List, Tuple


def extract_logo_colors_from_base64(
    base64_data: str,
    min_fraction: float = 0.02,
    merge_distance: int = 25,
    skip_white_black: bool = True
) -> List[Tuple[int, int, int]]:
    """
    Extract dominant colors from a base64-encoded logo/image.
    
    Args:
        base64_data: Base64 encoded image string (with or without data URI prefix)
        min_fraction: Minimum fraction of total pixels for a color to be considered dominant
        merge_distance: Maximum distance to merge similar colors (0-255 scale)
        skip_white_black: Whether to skip near-white and near-black colors
    
    Returns:
        List of RGB tuples representing dominant colors
    """
    # Strip data URI prefix if present
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    
    # Decode and open image
    image_data = base64.b64decode(base64_data)
    img = Image.open(io.BytesIO(image_data)).convert("RGBA")

    # Get pixel data, removing transparent pixels
    pixels = np.array(img)
    pixels = pixels[pixels[:, :, 3] > 0][:, :3]

    if len(pixels) == 0:
        return []

    # Quantize to reduce colors (adaptive palette)
    qimg = Image.fromarray(pixels.reshape(-1, 1, 3), "RGB") \
        .convert("P", palette=Image.ADAPTIVE, colors=12) \
        .convert("RGB")

    qpixels = list(qimg.getdata())
    counts = Counter(qpixels)
    total = sum(counts.values())

    # Sort by frequency
    sorted_colors = sorted(counts.items(), key=lambda x: x[1], reverse=True)

    # Merge similar colors
    merged = []
    for color, count in sorted_colors:
        if skip_white_black and _is_white_or_black(color):
            continue

        merged_into_existing = False
        for i, (m_color, m_count) in enumerate(merged):
            if _color_distance(color, m_color) < merge_distance:
                merged[i] = (m_color, m_count + count)
                merged_into_existing = True
                break

        if not merged_into_existing:
            merged.append((color, count))

    # Filter by minimum fraction
    dominant_colors = [
        color for color, count in merged
        if count / total >= min_fraction
    ]

    return dominant_colors


def extract_logo_colors_from_file(
    file_path: str,
    min_fraction: float = 0.02,
    merge_distance: int = 25,
    skip_white_black: bool = True
) -> List[Tuple[int, int, int]]:
    """
    Extract dominant colors from an image file path.
    
    Args:
        file_path: Path to the image file
        min_fraction: Minimum fraction of total pixels for a color to be considered dominant
        merge_distance: Maximum distance to merge similar colors
        skip_white_black: Whether to skip near-white and near-black colors
    
    Returns:
        List of RGB tuples representing dominant colors
    """
    img = Image.open(file_path).convert("RGBA")
    
    # Get pixel data
    pixels = np.array(img)
    pixels = pixels[pixels[:, :, 3] > 0][:, :3]

    if len(pixels) == 0:
        return []

    # Quantize
    qimg = Image.fromarray(pixels.reshape(-1, 1, 3), "RGB") \
        .convert("P", palette=Image.ADAPTIVE, colors=12) \
        .convert("RGB")

    qpixels = list(qimg.getdata())
    counts = Counter(qpixels)
    total = sum(counts.values())

    sorted_colors = sorted(counts.items(), key=lambda x: x[1], reverse=True)

    merged = []
    for color, count in sorted_colors:
        if skip_white_black and _is_white_or_black(color):
            continue
        
        merged_into_existing = False
        for i, (m_color, m_count) in enumerate(merged):
            if _color_distance(color, m_color) < merge_distance:
                merged[i] = (m_color, m_count + count)
                merged_into_existing = True
                break

        if not merged_into_existing:
            merged.append((color, count))

    dominant_colors = [
        color for color, count in merged
        if count / total >= min_fraction
    ]

    return dominant_colors


def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex string."""
    return "#%02x%02x%02x" % tuple(rgb)


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex string to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def colors_to_hex(colors: List[Tuple[int, int, int]]) -> List[str]:
    """Convert list of RGB tuples to list of hex strings."""
    return [rgb_to_hex(c) for c in colors]


# --- Private Helper Functions ---

def _is_white_or_black(c: Tuple[int, int, int]) -> bool:
    """Check if color is near white or near black."""
    return all(v > 245 for v in c) or all(v < 10 for v in c)


def _color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    """Calculate Euclidean distance between two colors."""
    return np.linalg.norm(np.array(c1) - np.array(c2))
