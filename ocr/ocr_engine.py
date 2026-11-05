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
import re
from preprocessing.preprocess import preprocess_tube_image
def process_image_and_get_text(image_path: str) -> str:
    enhanced_img = preprocess_tube_image(image_path)
    if enhanced_img is not None:
        ocr_text = pytesseract.image_to_string(enhanced_img, config="--psm 11")
        return _clean_ocr_artifacts(ocr_text)
    return ""

def _clean_ocr_artifacts(text: str) -> str:
    """
    Normalizes common OCR artifacts found on packaging labels,
    curved surfaces, and rotated text before pattern matching.
    """
    if not text:
        return ""

    # 1. Normalize currency symbol artifacts preceding numbers
    # Replaces 'MRP e 99', 'MRP % 99', 'Price f 99' with 'MRP ₹ 99'
    text = re.sub(r'\b(MRP|Price|Rs\.?)\s*[:\s.%\-]*[eEfF%]\s*(\d)', r'\1 ₹ \2', text, flags=re.IGNORECASE)

    # 2. Convert standalone percentage signs placed in front of prices (e.g. '% 99.00' -> '₹ 99.00')
    text = re.sub(r'%\s*(\d+(?:\.\d{1,2})?)', r'₹ \1', text)

    # 3. Strip non-ASCII noise glyphs while preserving standard characters & Rupee symbol
    text = re.sub(r"[^\x00-\x7F₹]", " ", text)

    # 4. Collapse multiple spaces into single spaces
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def _group_words_into_lines(words, y_tolerance=12):
    """
    Reconstruct OCR words into visual text lines.

    Words with similar vertical positions are grouped together.
    Within each line, words are sorted from left to right.
    """

    if not words:
        return []

    # Sort approximately from top to bottom.
    words = sorted(
        words,
        key=lambda w: (w["y"], w["x"])
    )

    lines = []

    for word in words:

        placed = False

        word_center_y = (
            word["y"] + word["height"] / 2
        )

        for line in lines:

            line_center_y = sum(
                item["y"] + item["height"] / 2
                for item in line
            ) / len(line)

            if abs(
                word_center_y - line_center_y
            ) <= y_tolerance:

                line.append(word)
                placed = True
                break

        if not placed:

            lines.append([word])

    # Sort words horizontally within every line.
    for line in lines:

        line.sort(
            key=lambda w: w["x"]
        )

    # Convert word dictionaries into strings.
    result = []

    for line in lines:

        text = " ".join(
            word["text"]
            for word in line
        )

        text = _clean_ocr_artifacts(text)

        if text.strip():

            result.append(
                text.strip()
            )

    return result


def _try_psm_modes(image: np.ndarray, psm_modes=(6, 11)) -> dict:
    """
    Try several Tesseract PSM modes.

    Preserves word-level positional information so OCR text can
    later be reconstructed into readable lines.
    """

    best = {
        "text": "",
        "confidence": 0.0,
        "psm": None,
        "words": [],
        "lines": []
    }

    for psm in psm_modes:

        config = f"--oem 3 --psm {psm}"

        try:
            data = pytesseract.image_to_data(
                image,
                config=config,
                output_type=Output.DICT
            )
        except pytesseract.TesseractError:
            continue

        words = []
        confidences = []

        # ---------------------------------------------------------
        # Collect useful OCR tokens
        # ---------------------------------------------------------

        for i in range(len(data["text"])):

            text = data["text"][i].strip()

            try:
                conf = float(data["conf"][i])
            except (ValueError, TypeError):
                continue

            if not text or conf < 0:
                continue

            x = int(data["left"][i])
            y = int(data["top"][i])
            w = int(data["width"][i])
            h = int(data["height"][i])

            words.append({
                "text": text,
                "confidence": conf,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "block": data["block_num"][i],
                "paragraph": data["par_num"][i],
                "line": data["line_num"][i],
            })

            confidences.append(conf)

        # ---------------------------------------------------------
        # Reject useless OCR candidates
        # ---------------------------------------------------------

        meaningful_text = " ".join(
            word["text"]
            for word in words
        )

        alphanumeric_count = sum(
            char.isalnum()
            for char in meaningful_text
        )

        if not words or alphanumeric_count < 3:
            continue

        # ---------------------------------------------------------
        # Calculate confidence
        # ---------------------------------------------------------

        avg_conf = sum(confidences) / len(confidences)

        if len(words) == 1:
            avg_conf *= 0.75

        avg_conf = round(avg_conf, 2)

        # ---------------------------------------------------------
        # Reconstruct lines
        # ---------------------------------------------------------

        lines = _group_words_into_lines(words)
        cleaned_text = _clean_ocr_artifacts("\n".join(lines))

        # ---------------------------------------------------------
        # Keep best candidate
        # ---------------------------------------------------------

        if avg_conf > best["confidence"]:

            best = {
                "text": cleaned_text,
                "confidence": avg_conf,
                "psm": psm,
                "words": words,
                "lines": lines,
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
            "words": result["words"],
            "lines": result["lines"],
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
# ============================================================================
# COMPYLESCAN OCR QUALITY UPGRADE
# ============================================================================
# This layer is intentionally appended so the existing OCR API and pipeline
# remain backward compatible.  It improves candidate selection rather than
# replacing the preprocessing/extraction architecture.

_IMPORTANT_LABELS = (
    "mrp", "m.r.p", "mfg", "mfd", "mfgd", "manufactured", "packed",
    "pkg", "pkd", "exp", "exd", "use by", "ub", "bbd", "best before",
    "net", "qty", "quantity", "content", "manufacturer", "country",
    "origin", "consumer", "customer", "care", "complaint", "helpline",
    "toll", "product", "brand", "rs", "inr", "₹"
)

_DATE_HINT_RE = re.compile(
    r"\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{1,2}[./-]\d{2,4}|"
    r"\d{1,2}[./-][A-Za-z]{3,9}[./-]?\d{2,4}|"
    r"[A-Za-z]{3,9}[./-]\d{2,4})\b",
    re.I,
)
_QUANTITY_HINT_RE = re.compile(
    r"\b\d+(?:\.\d+)?\s*(?:mg|g|gm|kg|ml|l|lt|ltr|litre|liter|pcs?|pieces?|unit|units|pack|pair|set)\b",
    re.I,
)
_PRICE_HINT_RE = re.compile(
    r"(?:₹|rs\.?|inr)\s*\d+(?:[.,]\d{1,2})?|\bmrp\b[^\n]{0,30}\d+(?:\.\d{1,2})?",
    re.I,
)
_CONTACT_HINT_RE = re.compile(
    r"(?:\+?91[\s-]?)?(?:\d[\s-]?){10}|\b(?:1800|1860)[\s-]?\d{3}[\s-]?\d{4}\b|\b\d{10}\b|@",
    re.I,
)


def _ocr_evidence_score(text: str) -> float:
    """Score OCR text for useful package-declaration evidence.

    This is deliberately conservative.  It is not a compliance decision and
    it never invents characters; it only helps choose among OCR candidates.
    """
    if not text:
        return 0.0

    low = text.lower()
    compact = re.sub(r"[^a-z0-9₹@]+", " ", low)
    score = 0.0

    # Explicit legal/label vocabulary is much more useful than generic OCR.
    for label in _IMPORTANT_LABELS:
        if label in low:
            score += 2.0 if len(label) >= 3 else 0.75

    # Structured evidence gets additional weight.
    score += min(len(_DATE_HINT_RE.findall(text)), 4) * 2.0
    score += min(len(_QUANTITY_HINT_RE.findall(text)), 4) * 1.75
    score += min(len(_PRICE_HINT_RE.findall(text)), 4) * 2.25
    score += min(len(_CONTACT_HINT_RE.findall(text)), 3) * 1.5

    # Penalize obvious garbage without penalizing short labels.
    alnum = sum(ch.isalnum() for ch in text)
    if alnum < 3:
        return 0.0

    token_count = len([t for t in compact.split() if t])
    if token_count:
        score += min(token_count, 30) * 0.12

    return round(score, 3)


def _candidate_quality(text: str, confidence: float, words: list) -> float:
    """Combine OCR confidence with declaration-specific evidence."""
    evidence = _ocr_evidence_score(text)
    word_count = len(words or [])

    # Confidence remains important, but it must not dominate useful-field
    # evidence.  This prevents a clean logo/watermark from beating a noisier
    # candidate that actually contains MRP/MFG/EXP/net-quantity information.
    quality = (float(confidence) * 0.62) + (evidence * 2.8)

    if word_count == 1:
        quality -= 8.0
    elif word_count >= 5:
        quality += min(word_count, 25) * 0.10

    return round(quality, 3)


def _try_psm_modes_quality(image: np.ndarray, psm_modes=(6, 4, 11, 12, 3)) -> dict:
    """Run several Tesseract layouts and select the most useful candidate."""
    candidates = []

    for psm in psm_modes:
        config = f"--oem 3 --psm {psm}"
        try:
            data = pytesseract.image_to_data(
                image,
                config=config,
                output_type=Output.DICT,
            )
        except Exception:
            continue

        words = []
        confidences = []

        for i in range(len(data.get("text", []))):
            text = str(data["text"][i]).strip()
            try:
                conf = float(data["conf"][i])
            except (ValueError, TypeError):
                continue

            if not text or conf < 0:
                continue

            word = {
                "text": text,
                "confidence": conf,
                "x": int(data["left"][i]),
                "y": int(data["top"][i]),
                "width": int(data["width"][i]),
                "height": int(data["height"][i]),
                "block": data.get("block_num", [0] * len(data["text"]))[i],
                "paragraph": data.get("par_num", [0] * len(data["text"]))[i],
                "line": data.get("line_num", [0] * len(data["text"]))[i],
            }
            words.append(word)
            confidences.append(conf)

        if not words:
            continue

        raw_text = " ".join(w["text"] for w in words)
        if sum(ch.isalnum() for ch in raw_text) < 3:
            continue

        avg_conf = sum(confidences) / len(confidences)
        if len(words) == 1:
            avg_conf *= 0.75

        lines = _group_words_into_lines(words)
        cleaned_text = _clean_ocr_artifacts("\n".join(lines))
        quality = _candidate_quality(cleaned_text, avg_conf, words)

        candidates.append({
            "text": cleaned_text,
            "confidence": round(avg_conf, 2),
            "psm": psm,
            "words": words,
            "lines": lines,
            "quality": quality,
            "evidence_score": _ocr_evidence_score(cleaned_text),
        })

    if not candidates:
        return {
            "text": "",
            "confidence": 0.0,
            "psm": None,
            "words": [],
            "lines": [],
            "quality": 0.0,
            "evidence_score": 0.0,
        }

    # Keep the highest-quality candidate, while using confidence as a stable
    # tie-breaker.  The old implementation selected confidence alone.
    candidates.sort(
        key=lambda c: (c["quality"], c["evidence_score"], c["confidence"]),
        reverse=True,
    )
    return candidates[0]


def _quality_ocr_prepass(image: np.ndarray) -> list:
    """Generate a few lightweight OCR views without replacing main variants."""
    views = [("input", image)]

    try:
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # OCR often benefits from a clean grayscale view even when the main
        # preprocessing candidate is already thresholded.
        views.append(("gray", gray))

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        views.append(("clahe", clahe.apply(gray)))

        # Mild unsharp mask only.  Strong sharpening can turn punctuation and
        # thin strokes into false characters.
        blur = cv2.GaussianBlur(gray, (0, 0), 1.2)
        sharp = cv2.addWeighted(gray, 1.25, blur, -0.25, 0)
        views.append(("mild_sharpen", sharp))
    except Exception:
        pass

    return views


def _try_quality_views(image: np.ndarray) -> dict:
    """Evaluate lightweight views and return the strongest OCR evidence."""
    best = None

    for view_name, view in _quality_ocr_prepass(image):
        result = _try_psm_modes_quality(view)
        if not result.get("text"):
            continue
        result["view"] = view_name

        if best is None or (
            result.get("quality", 0),
            result.get("evidence_score", 0),
            result.get("confidence", 0),
        ) > (
            best.get("quality", 0),
            best.get("evidence_score", 0),
            best.get("confidence", 0),
        ):
            best = result

    return best or {
        "text": "",
        "confidence": 0.0,
        "psm": None,
        "words": [],
        "lines": [],
        "quality": 0.0,
        "evidence_score": 0.0,
        "view": None,
    }


def extract_text_with_confidence(image: np.ndarray) -> dict:
    """Backward-compatible public OCR entry point with quality-aware choice."""
    return _try_quality_views(image)


def extract_all_variants(variants: dict) -> list:
    """OCR every preprocessing candidate and preserve all evidence."""
    results = []

    for variant_name, variant_image in variants.items():
        result = _try_quality_views(variant_image)
        results.append({
            "variant": variant_name,
            "psm": result.get("psm"),
            "confidence": result.get("confidence", 0.0),
            "quality": result.get("quality", 0.0),
            "evidence_score": result.get("evidence_score", 0.0),
            "view": result.get("view"),
            "text": result.get("text", ""),
            "words": result.get("words", []),
            "lines": result.get("lines", []),
        })

    return results


def extract_best_across_variants(variants: dict) -> dict:
    """Backward-compatible best-result helper using OCR usefulness quality."""
    all_results = extract_all_variants(variants)
    if not all_results:
        return {
            "text": "",
            "confidence": 0.0,
            "psm": None,
            "words": [],
            "lines": [],
            "all_scores": {},
        }

    best = max(
        all_results,
        key=lambda r: (
            r.get("quality", 0.0),
            r.get("evidence_score", 0.0),
            r.get("confidence", 0.0),
        ),
    )
    all_scores = {
        r["variant"]: r.get("quality", 0.0)
        for r in all_results
    }
    return {**best, "all_scores": all_scores}

# ============================================================================
# ULTRA-FAST LIVE OCR OVERRIDE
# ============================================================================
# The previous FAST selector evaluated 4 image views x 5 PSM modes for every
# preprocessing candidate.  That still caused hundreds of Tesseract calls
# once label candidates were added.  The live path below uses PSM 6 first and
# runs PSM 11 only when the first pass is weak.  This preserves the detailed
# word/line output expected by main.py.

def _run_single_psm(image: np.ndarray, psm: int) -> dict:
    """Run one Tesseract data pass and return the normal OCR result shape."""
    try:
        data = pytesseract.image_to_data(
            image,
            config=f"--oem 3 --psm {psm}",
            output_type=Output.DICT,
        )
    except Exception:
        return {
            "text": "",
            "confidence": 0.0,
            "psm": psm,
            "words": [],
            "lines": [],
            "quality": 0.0,
            "evidence_score": 0.0,
            "view": "single",
        }

    words = []
    confidences = []

    texts = data.get("text", [])
    for i in range(len(texts)):
        token = str(texts[i]).strip()
        try:
            conf = float(data["conf"][i])
        except (ValueError, TypeError, IndexError):
            continue

        if not token or conf < 0:
            continue

        def _get_num(key, default=0):
            try:
                return int(data.get(key, [default] * len(texts))[i])
            except (ValueError, TypeError, IndexError):
                return default

        words.append({
            "text": token,
            "confidence": conf,
            "x": _get_num("left"),
            "y": _get_num("top"),
            "width": _get_num("width"),
            "height": _get_num("height"),
            "block": _get_num("block_num"),
            "paragraph": _get_num("par_num"),
            "line": _get_num("line_num"),
        })
        confidences.append(conf)

    if not words:
        return {
            "text": "",
            "confidence": 0.0,
            "psm": psm,
            "words": [],
            "lines": [],
            "quality": 0.0,
            "evidence_score": 0.0,
            "view": "single",
        }

    avg_conf = sum(confidences) / len(confidences)
    if len(words) == 1:
        avg_conf *= 0.75

    lines = _group_words_into_lines(words)
    cleaned = _clean_ocr_artifacts("\n".join(lines))
    evidence = _ocr_evidence_score(cleaned)
    quality = _candidate_quality(cleaned, avg_conf, words)

    return {
        "text": cleaned,
        "confidence": round(avg_conf, 2),
        "psm": psm,
        "words": words,
        "lines": lines,
        "quality": quality,
        "evidence_score": evidence,
        "view": "single",
    }


def _try_quality_views(image: np.ndarray) -> dict:
    """Fast selector: one PSM-6 pass, PSM-11 fallback only when needed."""
    first = _run_single_psm(image, 6)

    text = first.get("text", "")
    evidence = first.get("evidence_score", 0.0)
    confidence = first.get("confidence", 0.0)

    # PSM 6 is usually best for printed package panels. PSM 11 is a
    # sparse-text fallback when PSM 6 did not recover useful declarations.
    needs_fallback = (
        not text
        or confidence < 42.0
        or evidence < 3.0
        or not re.search(
            r"\b(?:mrp|m\.?r\.?p|net|qty|quantity|weight|mfg|mfd|pkd|pkg|exp|"
            r"use\s*by|best\s*before|consumer|customer|care|marketed|packed|"
            r"manufactured|country|origin|rs\.?|inr)\b",
            text,
            re.I,
        )
    )

    if not needs_fallback:
        return first

    second = _run_single_psm(image, 11)
    candidates = [x for x in (first, second) if x.get("text")]
    if not candidates:
        return first

    # Prefer declaration evidence first; confidence breaks ties.
    return max(
        candidates,
        key=lambda x: (
            x.get("evidence_score", 0.0),
            x.get("quality", 0.0),
            x.get("confidence", 0.0),
        ),
    )


def extract_text_with_confidence(image: np.ndarray) -> dict:
    return _try_quality_views(image)


def extract_all_variants(variants: dict) -> list:
    """OCR each supplied candidate with the fast adaptive PSM strategy."""
    results = []
    for variant_name, variant_image in variants.items():
        result = _try_quality_views(variant_image)
        results.append({
            "variant": variant_name,
            "psm": result.get("psm"),
            "confidence": result.get("confidence", 0.0),
            "quality": result.get("quality", 0.0),
            "evidence_score": result.get("evidence_score", 0.0),
            "view": result.get("view"),
            "text": result.get("text", ""),
            "words": result.get("words", []),
            "lines": result.get("lines", []),
        })
    return results


def extract_best_across_variants(variants: dict) -> dict:
    all_results = extract_all_variants(variants)
    if not all_results:
        return {
            "text": "",
            "confidence": 0.0,
            "psm": None,
            "words": [],
            "lines": [],
            "all_scores": {},
        }
    best = max(
        all_results,
        key=lambda r: (
            r.get("quality", 0.0),
            r.get("evidence_score", 0.0),
            r.get("confidence", 0.0),
        ),
    )
    return {
        **best,
        "all_scores": {
            r["variant"]: r.get("quality", 0.0)
            for r in all_results
        },
    }
