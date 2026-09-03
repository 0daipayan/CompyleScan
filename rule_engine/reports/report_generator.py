import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)


# ============================================================
# 1. CREATE COMPLETE REPORT DATA
# ============================================================

def generate_report(
    results,
    score_data,
    violations
):
    """
    Generate the complete compliance report.

    Parameters:
        results      -> Individual rule-checking results
        score_data   -> Score and overall status from scorer.py
        violations   -> Violations/review items from
                        violation_generator.py

    Returns:
        Dictionary containing the complete report.
    """

    report = {
        "summary": {
            "total_rules": score_data["total_rules"],
            "passed": score_data["passed"],
            "failed": score_data["failed"],
            "review": score_data["review"],
            "not_applicable": score_data["not_applicable"],
            "score": score_data["score"],
            "overall_status": score_data["overall_status"]
        },

        "violations": violations,

        "rule_results": results
    }

    return report


# ============================================================
# 2. SAVE JSON REPORT
# ============================================================

def save_report(report, output_path):
    """
    Save the compliance report as a JSON file.
    """

    output_path = Path(output_path)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False
        )

    return output_path


# ============================================================
# 3. PRINT REPORT IN TERMINAL
# ============================================================

def print_report(report):
    """
    Print a human-readable compliance report
    in the terminal.
    """

    summary = report["summary"]

    print()
    print("COMPLIANCE REPORT")
    print("=" * 50)

    print(
        f"Total Rules       : "
        f"{summary['total_rules']}"
    )

    print(
        f"Passed            : "
        f"{summary['passed']}"
    )

    print(
        f"Failed            : "
        f"{summary['failed']}"
    )

    print(
        f"Needs Review      : "
        f"{summary['review']}"
    )

    print(
        f"Not Applicable    : "
        f"{summary['not_applicable']}"
    )

    print(
        f"Score             : "
        f"{summary['score']}%"
    )

    print(
        f"Overall Status    : "
        f"{summary['overall_status']}"
    )

    # --------------------------------------------------
    # Rule Results
    # --------------------------------------------------

    print()
    print("Rule Results")
    print("-" * 50)

    for result in report["rule_results"]:

        print(
            f"{result['rule_id']} | "
            f"{result['field']} | "
            f"{result['status']}"
        )

        print(
            f"   Value   : "
            f"{result['value']}"
        )

        print(
            f"   Message : "
            f"{result['message']}"
        )

        print()

    # --------------------------------------------------
    # Violations
    # --------------------------------------------------

    print("Violations / Review Items")
    print("-" * 50)

    if not report["violations"]:

        print(
            "No violations or review items."
        )

        return

    for violation in report["violations"]:

        print(
            f"{violation['rule_id']} | "
            f"{violation['field']} | "
            f"{violation['status']}"
        )

        print(
            f"   Value   : "
            f"{violation['value']}"
        )

        print(
            f"   Message : "
            f"{violation['message']}"
        )

        print()


# ============================================================
# 4. GENERATE PDF REPORT
# ============================================================

def save_pdf_report(report, output_path):
    """
    Generate and save a formatted PDF compliance report.

    Paragraph objects are used inside table cells so that
    long values and messages wrap within the table borders.
    """

    output_path = Path(output_path)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    document = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=35,
        bottomMargin=35
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=16,
        leading=20,
        spaceAfter=15
    )

    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        spaceBefore=12,
        spaceAfter=8
    )

    normal_style = ParagraphStyle(
        "ReportNormal",
        parent=styles["Normal"],
        fontSize=9,
        leading=12
    )

    table_text_style = ParagraphStyle(
        "TableText",
        parent=styles["Normal"],
        fontSize=7,
        leading=9,
        wordWrap="CJK"
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontSize=7,
        leading=9
    )

    story = []
    summary = report["summary"]

    # --------------------------------------------------
    # TITLE
    # --------------------------------------------------

    story.append(
        Paragraph(
            "LEGAL METROLOGY COMPLIANCE REPORT",
            title_style
        )
    )

    # --------------------------------------------------
    # PRODUCT INFORMATION
    # --------------------------------------------------

    # Product name comes dynamically from OCR/rule results.
    # Nothing is hardcoded for a particular product.
    product_name = "Unknown Product"

    for result in report["rule_results"]:
        if result.get("field") == "product_name":
            value = result.get("value")

            if value:
                product_name = str(value)

            break

    story.append(
        Paragraph(
            f"<b>Product Name:</b> {product_name}",
            normal_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Overall Status:</b> {summary['overall_status']}",
            normal_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Compliance Score:</b> {summary['score']}%",
            normal_style
        )
    )

    story.append(Spacer(1, 12))

    # --------------------------------------------------
    # COMPLIANCE SUMMARY
    # --------------------------------------------------

    story.append(
        Paragraph("COMPLIANCE SUMMARY", heading_style)
    )

    summary_data = [
        [
            Paragraph("<b>Metric</b>", table_header_style),
            Paragraph("<b>Result</b>", table_header_style)
        ],
        [Paragraph("Total Rules", table_text_style), Paragraph(str(summary["total_rules"]), table_text_style)],
        [Paragraph("Passed", table_text_style), Paragraph(str(summary["passed"]), table_text_style)],
        [Paragraph("Failed", table_text_style), Paragraph(str(summary["failed"]), table_text_style)],
        [Paragraph("Needs Review", table_text_style), Paragraph(str(summary["review"]), table_text_style)],
        [Paragraph("Not Applicable", table_text_style), Paragraph(str(summary["not_applicable"]), table_text_style)],
        [Paragraph("Score", table_text_style), Paragraph(f"{summary['score']}%", table_text_style)],
        [Paragraph("Overall Status", table_text_style), Paragraph(summary["overall_status"], table_text_style)]
    ]

    summary_table = Table(
        summary_data,
        colWidths=[220, 220]
    )

    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    story.append(summary_table)
    story.append(Spacer(1, 15))

    # --------------------------------------------------
    # RULE RESULTS
    # --------------------------------------------------

    story.append(
        Paragraph("RULE RESULTS", heading_style)
    )

    rule_data = [[
        Paragraph("<b>Rule ID</b>", table_header_style),
        Paragraph("<b>Field</b>", table_header_style),
        Paragraph("<b>Status</b>", table_header_style),
        Paragraph("<b>Value</b>", table_header_style),
        Paragraph("<b>Message</b>", table_header_style)
    ]]

    for result in report["rule_results"]:
        value = result.get("value") or ""

        rule_data.append([
            Paragraph(str(result["rule_id"]), table_text_style),
            Paragraph(str(result["field"]), table_text_style),
            Paragraph(str(result["status"]), table_text_style),
            Paragraph(str(value), table_text_style),
            Paragraph(str(result["message"]), table_text_style)
        ])

    rule_table = Table(
        rule_data,
        colWidths=[48, 72, 58, 85, 177],
        repeatRows=1
    )

    rule_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    story.append(rule_table)
    story.append(Spacer(1, 15))

    # --------------------------------------------------
    # VIOLATIONS / REVIEW ITEMS
    # --------------------------------------------------

    story.append(
        Paragraph("VIOLATIONS / REVIEW ITEMS", heading_style)
    )

    if not report["violations"]:
        story.append(
            Paragraph(
                "No violations or review items.",
                normal_style
            )
        )
    else:
        violation_data = [[
            Paragraph("<b>Rule ID</b>", table_header_style),
            Paragraph("<b>Field</b>", table_header_style),
            Paragraph("<b>Status</b>", table_header_style),
            Paragraph("<b>Value</b>", table_header_style),
            Paragraph("<b>Message</b>", table_header_style)
        ]]

        for violation in report["violations"]:
            value = violation.get("value") or ""

            violation_data.append([
                Paragraph(str(violation["rule_id"]), table_text_style),
                Paragraph(str(violation["field"]), table_text_style),
                Paragraph(str(violation["status"]), table_text_style),
                Paragraph(str(value), table_text_style),
                Paragraph(str(violation["message"]), table_text_style)
            ])

        violation_table = Table(
            violation_data,
            colWidths=[48, 72, 58, 85, 177],
            repeatRows=1
        )

        violation_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
            ])
        )

        story.append(violation_table)

    # --------------------------------------------------
    # BUILD PDF
    # --------------------------------------------------

    document.build(story)

    return output_path
