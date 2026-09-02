"""
main.py
-------
Complete adaptive OCR pipeline.

Flow:

    input image
        ↓
    sanity check
        ↓
    optional label/box detection
        ↓
    multiple preprocessing variants
        ↓
    OCR with multiple PSM modes
        ↓
    field-aware scoring
        ↓
    best OCR result
        ↓
    final quality decision
        ↓
    structured JSON

The label detector is OPTIONAL.
If it cannot confidently detect a label, the original image
continues through the normal OCR pipeline.

Usage:

    python main.py input/test.png

    python main.py input/test.png --debug
"""

import sys
import json
import os
import cv2
import numpy as np

from quality_check import (
    sanity_check,
    measure_raw_scores,
    evaluate_final_result,
)

from preprocessing.preprocess import (
    generate_variants,
    detect_and_warp_label,
    read_image,
    resize_image,
)

from ocr_engine import extract_all_variants
from json_formatter import build_structured_json


# ---------------------------------------------------------------------------
# Score one OCR candidate
# ---------------------------------------------------------------------------

def _score_variant(variant_result: dict) -> tuple:
    """
    Score an OCR candidate.

    Priority:

        1. Field completeness
        2. Validation warnings
        3. OCR confidence

    Field completeness is the most important because a high OCR
    confidence does not necessarily mean useful product information
    was extracted.
    """

    structured = build_structured_json(
        variant_result["text"],
        variant_result["confidence"],
    )

    completeness = structured["_meta"]["field_completeness"]

    warnings = structured["_meta"].get(
        "validation_warnings",
        []
    )

    warning_count = len(warnings)

    score = (
        completeness,
        -warning_count,
        variant_result["confidence"],
    )

    return score, structured


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def process_product_image(
    image_path: str,
    debug_dir: str = None
) -> dict:

    """
    Main entry point for the OCR pipeline.

    Possible statuses:

        success
        needs_review
        rejected
        error
    """

    # -----------------------------------------------------------------------
    # Step 1: Check that file exists
    # -----------------------------------------------------------------------

    if not os.path.exists(image_path):
        return {
            "status": "error",
            "reason": f"File not found: {image_path}",
        }

    # -----------------------------------------------------------------------
    # Step 2: Sanity check
    # -----------------------------------------------------------------------

    sanity = sanity_check(image_path)

    if not sanity["passed"]:
        return {
            "status": "error",
            "reason": sanity["reason"],
        }

    raw_scores = measure_raw_scores(image_path)

    # -----------------------------------------------------------------------
    # Step 3: Generate normal preprocessing variants
    # -----------------------------------------------------------------------

    variants = generate_variants(image_path)

    # -----------------------------------------------------------------------
    # Step 4: OPTIONAL label / box detection
    # -----------------------------------------------------------------------

    try:

        label_image = detect_and_warp_label(image_path)

        # The detector returns the resized original image when
        # no reliable label is detected.

        original_image = read_image(image_path)

        original_resized = resize_image(
            original_image,
            target_width=1200
        )

        # Check whether detector actually produced a different image.
        label_detected = not np.array_equal(
            label_image,
            original_resized
        )

        if label_detected:

            print(
                "Reliable label region detected."
            )

            print(
                "Adding perspective-corrected image "
                "as an OCR candidate."
            )

            # ---------------------------------------------------------------
            # Save temporary corrected image
            # ---------------------------------------------------------------

            os.makedirs(
                "output",
                exist_ok=True
            )

            temp_label_path = os.path.join(
                "output",
                "_auto_detected_label.png"
            )

            cv2.imwrite(
                temp_label_path,
                label_image
            )

            # ---------------------------------------------------------------
            # Run our normal preprocessing on the detected label
            # ---------------------------------------------------------------

            label_variants = generate_variants(
                temp_label_path
            )

            # ---------------------------------------------------------------
            # Add them to the main candidate collection
            # ---------------------------------------------------------------

            for name, img in label_variants.items():

                variants[
                    f"label_{name}"
                ] = img

            # ---------------------------------------------------------------
            # Remove temporary file
            # ---------------------------------------------------------------

            try:
                os.remove(
                    temp_label_path
                )

            except OSError:
                pass

        else:

            print(
                "No reliable label detected. "
                "Continuing with original-image OCR."
            )

    except Exception as e:

        # Label detection must NEVER break OCR.

        print(
            f"Label detection skipped: {e}"
        )

    # -----------------------------------------------------------------------
    # Step 5: Save debug images if requested
    # -----------------------------------------------------------------------

    if debug_dir:

        os.makedirs(
            debug_dir,
            exist_ok=True
        )

        base = os.path.splitext(
            os.path.basename(image_path)
        )[0]

        for name, img in variants.items():

            cv2.imwrite(
                os.path.join(
                    debug_dir,
                    f"{base}_{name}.png"
                ),
                img
            )

    # -----------------------------------------------------------------------
    # Step 6: OCR every candidate
    # -----------------------------------------------------------------------

    all_variant_results = extract_all_variants(
        variants
    )

    # -----------------------------------------------------------------------
    # Step 7: Score every OCR result
    # -----------------------------------------------------------------------

    scored = []

    for vr in all_variant_results:

        score_key, structured = _score_variant(
            vr
        )

        scored.append(
            (
                score_key,
                vr,
                structured
            )
        )

    # -----------------------------------------------------------------------
    # Step 8: Select best result
    # -----------------------------------------------------------------------

    if not scored:

        return {
            "status": "error",
            "reason": "OCR produced no usable results.",
        }

    scored.sort(
        key=lambda x: x[0],
        reverse=True
    )

    (
        best_score,
        best_variant_result,
        best_structured
    ) = scored[0]

    best_completeness = best_score[0]

    best_confidence = best_score[2]

    # -----------------------------------------------------------------------
    # Step 9: Build scores for every variant
    # -----------------------------------------------------------------------

    all_variant_scores = {}

    for vr in all_variant_results:

        score_key, _ = _score_variant(
            vr
        )

        all_variant_scores[
            vr["variant"]
        ] = {
            "ocr_confidence": vr["confidence"],
            "field_completeness": score_key[0],
        }

    # -----------------------------------------------------------------------
    # Step 10: Final quality decision
    # -----------------------------------------------------------------------

    verdict = evaluate_final_result(
        best_confidence,
        best_completeness
    )

    # -----------------------------------------------------------------------
    # Step 11: Build response
    # -----------------------------------------------------------------------

    response = {

        "status": verdict["status"],

        "raw_image_scores": raw_scores,

        "winning_variant":
            best_variant_result["variant"],

        "winning_psm":
            best_variant_result["psm"],

        "ocr_confidence":
            best_confidence,

        "field_completeness":
            best_completeness,

        "all_variant_scores":
            all_variant_scores,
    }

    # -----------------------------------------------------------------------
    # Rejected result
    # -----------------------------------------------------------------------

    if verdict["status"] == "rejected":

        response["reason"] = verdict["reason"]

        return response

    # -----------------------------------------------------------------------
    # Successful / review result
    # -----------------------------------------------------------------------

    response["data"] = best_structured

    response["raw_ocr_text"] = (
        best_variant_result["text"]
    )

    if verdict["reason"]:

        response["review_note"] = (
            verdict["reason"]
        )

    return response


# ---------------------------------------------------------------------------
# Command-line entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "Usage: python main.py "
            "<image_path> [--debug]"
        )

        sys.exit(1)

    image_path = sys.argv[1]

    debug = "--debug" in sys.argv

    debug_dir = (
        "output/debug"
        if debug
        else None
    )

    result = process_product_image(
        image_path,
        debug_dir=debug_dir
    )

    print(
        json.dumps(
            result,
            indent=2
        )
    )