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
    merge useful fields from OCR candidates
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
from json_formatter import (
    build_structured_json,
    reconcile_ocr_fields_from_texts,
)


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
# Recalculate metadata after cross-variant field recovery
# ---------------------------------------------------------------------------

def _finalize_merged_structured(structured: dict) -> dict:
    """
    Rebuild the metadata that depends on the final merged 9-field payload.

    Important: the winning OCR candidate may be missing fields that are
    recovered from another preprocessing/PSM candidate.  The original
    candidate's _meta therefore cannot be left unchanged after the merge.
    """
    expected_fields = [
        "manufacturer",
        "country_of_origin",
        "product_name",
        "net_quantity",
        "manufacture_date",
        "best_before",
        "mrp",
        "consumer_care",
        "unit_sale_price",
    ]

    def _valid(value):
        if value is None:
            return False
        if isinstance(value, str):
            return bool(value.strip())
        if isinstance(value, dict):
            return any(
                isinstance(v, str) and v.strip()
                for v in value.values()
            )
        return True

    fields_found = sum(
        1 for field in expected_fields
        if _valid(structured.get(field))
    )

    meta = dict(structured.get("_meta") or {})
    old_notes = meta.get("extraction_notes") or []

    # Keep useful notes that are not merely stale "not detected" messages.
    stale_prefixes = tuple(
        f"{field} not detected" for field in expected_fields
    )
    notes = [
        note for note in old_notes
        if not any(str(note).startswith(prefix) for prefix in stale_prefixes)
    ]

    for field in expected_fields:
        if not _valid(structured.get(field)):
            notes.append(f"{field} not detected, needs manual review")

    meta["fields_found"] = fields_found
    meta["fields_expected"] = len(expected_fields)
    meta["field_completeness"] = round(
        fields_found / len(expected_fields) * 100, 1
    )
    meta["extraction_notes"] = notes

    structured["_meta"] = meta
    return structured


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
            # Run a focused preprocessing pass on the detected label.
            # The label is already perspective-corrected, so keep only the
            # primary view and one adaptive fallback.
            label_variants = generate_variants(temp_label_path)

            preferred_label_names = (
                "rot0_quality_primary",
                "rot0_quality_adaptive",
            )

            added_label = 0
            for preferred_name in preferred_label_names:
                img = label_variants.get(preferred_name)
                if img is None:
                    continue

                variants[f"label_{preferred_name}"] = img
                added_label += 1

            # Compatibility fallback for custom variant names.
            if added_label == 0 and label_variants:
                name, img = next(iter(label_variants.items()))
                variants[f"label_{name}"] = img

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
    # Step 8: Select best overall result
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
    # Step 8B: Merge fields across ALL OCR candidates
    # -----------------------------------------------------------------------

    merged_structured = dict(best_structured)

    fields_to_merge = [
        "manufacturer",
        "country_of_origin",
        "product_name",
        "net_quantity",
        "manufacture_date",
        "best_before",
        "mrp",
        "consumer_care",
        "unit_sale_price",
    ]

    # -----------------------------------------------------------------------
    # FINAL FIELD-SPECIFIC EVIDENCE RECONCILIATION
    # -----------------------------------------------------------------------
    # Reconcile ALL preprocessing/PSM OCR texts before finalizing fields.
    # This is intentionally allowed to correct an already-populated field:
    # a plausible OCR value such as 730 MRP can still be wrong.
    evidence_texts = [
        str(vr.get("text", "") or "")
        for _, vr, _ in scored
        if isinstance(vr, dict) and str(vr.get("text", "") or "").strip()
    ]

    reconciled_fields = reconcile_ocr_fields_from_texts(
        evidence_texts,
        seed=merged_structured,
    )

    for field in fields_to_merge:
        value = reconciled_fields.get(field)
        if value is not None:
            merged_structured[field] = value

    for field in fields_to_merge:

        # If the winning candidate already contains this field,
        # leave it untouched for now.
        if merged_structured.get(field) is not None:
            continue

        # Search all OCR candidates for this missing field.
        for score_key, variant_result, structured in scored:

            candidate_value = structured.get(field)

            # Ignore missing/empty candidates.
            if candidate_value is None:
                continue

            if isinstance(candidate_value, str):
                if not candidate_value.strip():
                    continue

            # --- MRP Sanity Guard ---
            if field == "mrp" and isinstance(candidate_value, (int, float)):
                # If OCR dropped the decimal point (e.g. 299000 instead of 2990.00)
                if candidate_value > 50000:
                    val_str = str(int(candidate_value))
                    if val_str.endswith("00"):
                        candidate_value = candidate_value / 100.0
                    else:
                        # Reject corrupted integer read from low-quality OCR variant
                        continue

            # Recover the field.
            merged_structured[field] = candidate_value

            print(
                f"OCR field recovered: "
                f"{field} = {candidate_value} "
                f"from {variant_result['variant']}"
            )

            break

    # Use the merged result from this point onward.
    # Recalculate completeness because recovered fields changed the payload.
    best_structured = _finalize_merged_structured(
        merged_structured
    )

    best_completeness = best_structured["_meta"]["field_completeness"]

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
    # Step 10B: Sticker / label evidence guard
    # -----------------------------------------------------------------------
    # Do not reject an image solely because structured field completeness
    # is 0% when OCR clearly found label/sticker markers. Continue the
    # pipeline and mark the result for review instead.
    combined_raw_ocr = " ".join(
        str(vr.get("text", ""))
        for vr in all_variant_results
        if isinstance(vr, dict)
    )

    has_sticker_data = any(
        keyword in combined_raw_ocr.upper()
        for keyword in ["MFG", "MRP", "B.NO", "USP", "RS."]
    )

    if (
        best_completeness == 0
        and has_sticker_data
        and verdict.get("status") == "rejected"
    ):
        verdict = {
            **verdict,
            "status": "needs_review",
            "reason": (
                "Label/sticker evidence detected, but no structured "
                "fields were confidently extracted. Manual review required."
            )
        }

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

        "has_sticker_data":
            has_sticker_data,

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