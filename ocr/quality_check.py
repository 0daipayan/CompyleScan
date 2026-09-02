"""
quality_check.py
-----------------
Two-part quality strategy:

  1. sanity_check() -- runs BEFORE any processing. Catches only truly
     broken input (corrupt file, unreadable, or absurdly tiny) where
     no amount of correction could help. This does NOT reject images
     for being blurry/dark/low-res -- those are potentially fixable,
     so preprocess.generate_variants() gets a chance to correct them
     first.

  2. evaluate_final_result() -- runs AFTER OCR has been attempted across
     multiple auto-corrected variants (see preprocess.generate_variants +
     ocr_engine.extract_best_across_variants). Decides pass/fail based on
     the BEST confidence actually achieved, not a guess made in advance.
     This is what makes the pipeline adaptive: an image that looks
     "bad" by raw pixel stats but still OCRs well after correction is
     accepted; one that looks "fine" but OCRs badly is correctly flagged.
"""

import cv2
import numpy as np

MIN_CONFIDENCE_TO_ACCEPT = 40.0   # below this, even the best variant isn't trustworthy
LOW_CONFIDENCE_WARNING = 65.0     # above MIN but below this -> accept, but flag for review
MIN_FIELDS_TO_ACCEPT = 2          # need at least this many real fields found, not just confident noise
GOOD_FIELD_COMPLETENESS = 50.0    # % of expected fields found, above this -> stronger trust


def evaluate_final_result(best_ocr_confidence: float, field_completeness: float = None) -> dict:
    """
    Decides, based on what OCR actually achieved after trying every
    auto-correction variant, whether the result is usable.

    Uses TWO signals, not one:
      - field_completeness: did we actually find the fields we need
        (MRP, mfg date, manufacturer, etc)? This is the primary signal --
        it directly answers "is this the right kind of document, read
        correctly" rather than just "was the OCR engine confident."
      - ocr_confidence: secondary signal, catches cases where fields
        were pattern-matched but the underlying text read is shaky.

    This catches the case a raw-confidence-only check misses: a clean,
    high-confidence OCR read of a watermark or wrong document type,
    which would score well on confidence but find zero real fields.

    Returns:
      {"status": "success"}                          -- confident, trust it
      {"status": "needs_review", "reason": "..."}     -- usable but flag for manual check
      {"status": "rejected", "reason": "..."}         -- even best effort wasn't good enough
    """
    if field_completeness is not None:
        fields_found_count = round(field_completeness / 100 * 9)
        if fields_found_count < MIN_FIELDS_TO_ACCEPT:
            return {
                "status": "rejected",
                "reason": (
                    f"Only found {fields_found_count} of the expected label fields "
                    f"(confidence was {best_ocr_confidence:.1f}%, but that doesn't mean much "
                    f"if the fields aren't actually there -- may be the wrong document type, "
                    f"a watermark, or an unreadable label). Please check the photo."
                ),
            }

        if field_completeness < GOOD_FIELD_COMPLETENESS or best_ocr_confidence < LOW_CONFIDENCE_WARNING:
            return {
                "status": "needs_review",
                "reason": (
                   f"Found {fields_found_count}/9 expected fields "
                    f"(completeness: {field_completeness:.1f}%, OCR confidence: {best_ocr_confidence:.1f}%). "
                    f"Recommend manual verification of missing fields."
                ),
            }
        return {"status": "success", "reason": None}

    # Fallback: no field-completeness info provided, use confidence alone
    if best_ocr_confidence < MIN_CONFIDENCE_TO_ACCEPT:
        return {
            "status": "rejected",
            "reason": (
                f"Could not extract reliable text even after trying multiple "
                f"correction methods (best confidence: {best_ocr_confidence:.1f}%). "
                f"Please retake the photo with better lighting/focus."
            ),
        }
    if best_ocr_confidence < LOW_CONFIDENCE_WARNING:
        return {
            "status": "needs_review",
            "reason": f"Text extracted but confidence is moderate ({best_ocr_confidence:.1f}%). Recommend manual verification.",
        }
    return {"status": "success", "reason": None}


def sanity_check(image_path: str) -> dict:
    """Catches only unfixable input: corrupt file or genuinely unusable size.
    Returns {"passed": bool, "reason": str|None}"""
    image = cv2.imread(image_path)
    if image is None:
        return {"passed": False, "reason": "Could not read image file (corrupt or unsupported format)."}

    h, w = image.shape[:2]
    if w < 50 or h < 50:
        return {"passed": False, "reason": "Image is too small to process (under 50px)."}

    return {"passed": True, "reason": None}


def measure_raw_scores(image_path: str) -> dict:
    """Informational only -- NOT used to reject. Useful for logging/debugging
    and for showing the user *why* a variant needed correction."""
    image = cv2.imread(image_path)
    if image is None:
        return {}
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    h, w = image.shape[:2]
    return {
        "blur": round(cv2.Laplacian(gray, cv2.CV_64F).var(), 2),
        "brightness": round(float(np.mean(gray)), 2),
        "width": w,
        "height": h,
    }