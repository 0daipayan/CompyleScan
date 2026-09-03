import json
from pathlib import Path

from rule_checker import check_compliance
from scorer import calculate_score
from violation_generator import generate_violations

from reports.report_generator import (
    generate_report,
    save_report,
    print_report,
    save_pdf_report
)


def run_compliance_check(ocr_data):
    """
    Run the complete compliance pipeline.

    Flow:
        OCR data
            ↓
        Rule Checker
            ↓
        Scorer
            ↓
        Violation Generator
            ↓
        Report Generator
    """

    # --------------------------------------------------
    # 1. Run all legal rule validations
    # --------------------------------------------------

    results = check_compliance(ocr_data)

    # --------------------------------------------------
    # 2. Calculate score and overall status
    # --------------------------------------------------

    score_data = calculate_score(results)

    # --------------------------------------------------
    # 3. Generate violations / review items
    # --------------------------------------------------

    violations = generate_violations(results)

    # --------------------------------------------------
    # 4. Generate complete report
    # --------------------------------------------------

    report = generate_report(
        results,
        score_data,
        violations
    )

    return report


def load_ocr_json(json_path):
    """
    Load OCR output from a JSON file.
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


def main():

    # --------------------------------------------------
    # TEMPORARY OCR TEST FILE
    # --------------------------------------------------
    #
    # Later this will NOT be sample_ocr.json.
    #
    # The actual OCR/AI pipeline will provide
    # ocr_data directly to run_compliance_check().
    #

    ocr_file = (
        Path(__file__).parent
        / "test_data"
        / "sample_ocr.json"
    )

    try:

        # --------------------------------------------------
        # 1. Load OCR data
        # --------------------------------------------------

        ocr_data = load_ocr_json(
            ocr_file
        )

        # --------------------------------------------------
        # 2. Run complete compliance engine
        # --------------------------------------------------

        report = run_compliance_check(
            ocr_data
        )

        # --------------------------------------------------
        # 3. Display report in terminal
        # --------------------------------------------------

        print_report(
            report
        )

        # --------------------------------------------------
        # 4. Save JSON report
        # --------------------------------------------------

        report_file = (
            Path(__file__).parent
            / "reports"
            / "generated"
            / "compliance_report.json"
        )

        saved_path = save_report(
            report,
            report_file
        )

        print(
            f"JSON report saved to: {saved_path}"
        )

        # --------------------------------------------------
        # 5. Save PDF report
        # --------------------------------------------------

        pdf_file = (
            Path(__file__).parent
            / "reports"
            / "generated"
            / "compliance_report.pdf"
        )

        pdf_path = save_pdf_report(
            report,
            pdf_file
        )

        print(
            f"PDF report saved to: {pdf_path}"
        )

    except Exception as error:

        print()
        print("ERROR")
        print("=" * 50)
        print(error)


if __name__ == "__main__":
    main()