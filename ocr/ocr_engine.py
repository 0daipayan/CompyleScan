"""
ocr_engine.py
-------------
Runs OCR on the preprocessed image and returns text + a confidence score.

IMPORTANT NOTE FOR YOUR TEAM:
Your plan specifies PaddleOCR. This module uses Tesseract (pytesseract)
as the working backend for now, because it's already installed and
proven in this environment, and it returns per-word confidence the
same way PaddleOCR does. The function signature and return format
(extract_text_with_confidence -> {"text", "confidence", "words"}) is
deliberately written so switching to PaddleOCR later means replacing
the inside of ONE function, not restructuring the whole pipeline.

To swap to PaddleOCR later:
  from paddleocr import PaddleOCR
  ocr = PaddleOCR(use_angle_cls=True, lang='en')
  result = ocr.ocr(image_path)
  # result gives you [ [box, (text, confidence)], ... ] per detected line
  # map that into the same {"text","confidence","words"} shape below.
"""

import pytesseract
from pytesseract import Output
import cv2
import numpy as np


def _try_psm_modes(image: np.ndarray, psm_modes=(6, 4, 11, 3)) -> dict:
    """
    Tries several Tesseract Page Segmentation Modes and keeps whichever
    gives the highest average confidence. This directly answers the
    "how do we get the best OCR output" question -- different PSM modes
    suit different label layouts (single block vs scattered text vs sparse).

    PSM reference:
      3  = fully automatic page segmentation (default)
      4  = assume a single column of text of variable sizes
      6  = assume a single uniform block of text
      11 = sparse text, find as much text as possible, no particular order
    """
    best = {"text": "", "confidence": 0.0, "psm": None, "words": []}

    for psm in psm_modes:
        config = f"--oem 3 --psm {psm}"
        try:
            data = pytesseract.image_to_data(image, config=config, output_type=Output.DICT)
        except pytesseract.TesseractError:
            continue

        confidences = [float(c) for c in data["conf"] if c not in ("-1", -1)]
        if not confidences:
            continue

        avg_conf = sum(confidences) / len(confidences)

        if avg_conf > best["confidence"]:
            words = [w for w in data["text"] if w.strip()]
            best = {
                "text": " ".join(words),
                "confidence": round(avg_conf, 2),
                "psm": psm,
                "words": words,
            }

    return best

def _rotate_image(image: np.ndarray, angle: int) -> np.ndarray:
    """
    Rotate image by 0, 90, 180, or 270 degrees.
    """

    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    raise ValueError("Angle must be 0, 90, 180, or 270.")

def extract_all_orientations(image: np.ndarray) -> list:
    """
    Runs OCR at all four possible orientations.

    Returns one OCR result for each orientation.
    """

    results = []

    for angle in (0, 90, 180, 270):

        rotated = _rotate_image(image, angle)

        result = _try_psm_modes(rotated)

        results.append({
            "orientation": angle,
            "psm": result["psm"],
            "confidence": result["confidence"],
            "text": result["text"],
            "words": result["words"],
        })

    return results

def extract_text_with_confidence(image: np.ndarray) -> dict:
    """
    Main entry point: takes a preprocessed image (numpy array, as returned
    by preprocess.process_image), tries multiple PSM modes, and returns
    the best result.

    Returns:
      {
        "text": str,          # full extracted text, space-joined
        "confidence": float,  # 0-100, average word confidence of best run
        "psm": int,           # which PSM mode won, for debugging/logging
        "words": list[str],   # individual detected words
      }
    """
    return _try_psm_modes(image)


def extract_all_variants(variants: dict) -> list:
    """
    Runs OCR on every preprocessed variant and returns ALL results
    (not just the best one) so the caller can score them by field
    completeness, not just raw OCR confidence.

    Raw OCR confidence measures "how sure is the OCR engine about the
    characters it read" -- it does NOT measure "did we actually find
    the fields we care about." A blurry watermark can OCR with high
    confidence while containing zero useful fields. Field-completeness
    scoring (done in main.py via json_formatter) is what actually
    answers the question that matters for this project.

    Returns: [{"variant": str, "psm": int, "confidence": float, "text": str}, ...]
    """
    results = []
    for variant_name, variant_image in variants.items():
        result = _try_psm_modes(variant_image)
        results.append({
            "variant": variant_name,
            "psm": result["psm"],
            "confidence": result["confidence"],
            "text": result["text"],
        })
    return results


def extract_best_across_variants(variants: dict) -> dict:
    """
    Simple version: picks the variant with the highest raw OCR confidence.
    Kept for backward compatibility / simple use cases.
    For field-aware selection (recommended), use extract_all_variants()
    combined with json_formatter in main.py instead.
    """
    all_results = extract_all_variants(variants)
    best = max(all_results, key=lambda r: r["confidence"])
    all_scores = {r["variant"]: r["confidence"] for r in all_results}
    return {**best, "all_scores": all_scores}

if __name__ == "__main__":

    image = cv2.imread("input/test_difficult.png")

    if image is None:
        raise ValueError("Could not read test image.")

    results = extract_all_orientations(image)

    for result in results:

        print(
            f"Orientation: {result['orientation']}° | "
            f"PSM: {result['psm']} | "
            f"Confidence: {result['confidence']}"
        )

        print(
            f"Text preview: {result['text'][:150]}"
        )

        print("-" * 60)