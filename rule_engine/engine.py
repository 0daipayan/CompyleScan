import json
from pathlib import Path
from datetime import datetime, timezone

from .rule_checker import check_compliance
from .scorer import calculate_score


# ============================================================
# COMPLETE COMPLIANCE PIPELINE
# ============================================================

def run_compliance_check(ocr_data):
    """
    Runs the complete compliance evaluation pipeline.

    OCR data
        ↓
    Rule checking
        ↓
    Score calculation
        ↓
    Final compliance report
    """

    # --------------------------------------------------------
    # 1. Run all legal/metrology rules
    # --------------------------------------------------------
    results = check_compliance(ocr_data)

    # --------------------------------------------------------
    # 2. Calculate overall score and status
    # --------------------------------------------------------
    score_data = calculate_score(results)

    # --------------------------------------------------------
    # 3. Collect failed/review items as violations
    # --------------------------------------------------------
    violations = []

    for result in results:
        status = result.get("status")

        if status in ["FAIL", "REVIEW"]:
            violations.append({
                "rule_id": result.get("rule_id", ""),
                "field": result.get("field", ""),
                "status": status,
                "value": result.get("value"),
                "message": result.get(
                    "message",
                    "No description provided."
                )
            })

    # --------------------------------------------------------
    # 4. Build final report
    # --------------------------------------------------------
    report = generate_report(
        results=results,
        score_data=score_data,
        violations=violations
    )

    return report


# ============================================================
# REPORT GENERATION
# ============================================================

def generate_report(results, score_data, violations):
    """
    Combines rule validation results, scoring details,
    and violations into a structured final report.
    """

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),

        # Overall score/status
        "summary": score_data,

        # Failed + review items
        "violations": violations,

        # Complete rule-by-rule results
        "detailed_results": results,

        # Also expose results under rule_results because
        # the Node backend supports this structure.
        "rule_results": results
    }


# ============================================================
# PRINT REPORT
# ============================================================

def print_report(report):
    """
    Prints a formatted human-readable summary
    of the compliance report.
    """

    summary = report.get("summary", {})
    violations = report.get("violations", [])

    print("\n" + "=" * 60)
    print(" COMPLIANCE EVALUATION REPORT")
    print("=" * 60)

    print(f" Timestamp      : {report.get('timestamp')}")
    print(f" Overall Score  : {summary.get('score', 0)}%")
    print(
        f" Overall Status : "
        f"{summary.get('overall_status', 'UNKNOWN')}"
    )

    print("-" * 60)

    print(f" Total Rules    : {summary.get('total_rules', 0)}")
    print(f" Passed         : {summary.get('passed', 0)}")
    print(f" Failed         : {summary.get('failed', 0)}")
    print(f" Needs Review   : {summary.get('review', 0)}")
    print(
        f" Not Applicable : "
        f"{summary.get('not_applicable', 0)}"
    )

    print("=" * 60)

    if violations:
        print("\nACTION ITEMS / VIOLATIONS:")

        for idx, item in enumerate(violations, start=1):
            field = item.get("field", "Unknown Field")
            status = item.get("status", "REVIEW")
            message = item.get(
                "message",
                "No description provided."
            )

            print(
                f"  {idx}. [{status}] "
                f"{field.upper()}: {message}"
            )

    else:
        print("\nNo violations or review items flagged.")

    print("=" * 60 + "\n")


# ============================================================
# SAVE JSON REPORT
# ============================================================

def save_report(report, output_path):
    """
    Saves the report dictionary as a JSON file.
    """

    destination = Path(output_path)
    destination.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        destination,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False
        )

    return str(destination)


# ============================================================
# SAVE PDF REPORT
# ============================================================

def save_pdf_report(report, output_path):
    """
    Saves the compliance report to a PDF document.
    """

    destination = Path(output_path)
    destination.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        c = canvas.Canvas(
            str(destination),
            pagesize=letter
        )

        c.setFont("Helvetica-Bold", 16)
        c.drawString(
            50,
            750,
            "Compliance Evaluation Report"
        )

        c.setFont("Helvetica", 10)

        c.drawString(
            50,
            730,
            f"Timestamp: {report.get('timestamp')}"
        )

        summary = report.get("summary", {})

        c.drawString(
            50,
            700,
            f"Overall Score: "
            f"{summary.get('score', 0)}%"
        )

        c.drawString(
            50,
            685,
            f"Overall Status: "
            f"{summary.get('overall_status', 'UNKNOWN')}"
        )

        c.drawString(
            50,
            670,
            f"Passed: {summary.get('passed', 0)} | "
            f"Failed: {summary.get('failed', 0)} | "
            f"Review: {summary.get('review', 0)}"
        )

        y = 630

        c.setFont(
            "Helvetica-Bold",
            12
        )

        c.drawString(
            50,
            y,
            "Violations & Review Items:"
        )

        y -= 20

        c.setFont(
            "Helvetica",
            9
        )

        for item in report.get("violations", []):

            if y < 50:
                c.showPage()
                y = 750

            line = (
                f"- [{item.get('status')}] "
                f"{item.get('field')}: "
                f"{item.get('message')}"
            )

            c.drawString(
                50,
                y,
                line[:100]
            )

            y -= 15

        c.save()

    except ImportError:

        txt_fallback = destination.with_suffix(
            ".pdf.txt"
        )

        with open(
            txt_fallback,
            "w",
            encoding="utf-8"
        ) as file:

            file.write(
                "COMPLIANCE REPORT\n"
                f"Score: "
                f"{report.get('summary', {}).get('score')}\n"
            )

        return str(txt_fallback)

    return str(destination)


# ============================================================
# LOAD OCR JSON
# ============================================================

def load_ocr_json(json_path):
    """
    Loads OCR data from a JSON file.
    """

    json_path = Path(json_path)

    if not json_path.exists():
        raise FileNotFoundError(
            f"OCR JSON file not found: {json_path}"
        )

    with open(
        json_path,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(
            "OCR JSON must contain a JSON object."
        )

    return data