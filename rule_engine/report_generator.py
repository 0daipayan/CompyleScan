import json
from pathlib import Path
from datetime import datetime, timezone

from rule_engine.scorer import calculate_score
from rule_engine.violation_generator import extract_violations


def generate_report(rule_results, metadata=None):
    """
    Consolidates rule validation results, computes overall score,
    filters violations, and structures the final report object.
    """
    # Calculate score metrics using scorer.py module
    score_details = calculate_score(rule_results)
    
    # Extract flagged non-compliant rules using violation_generator.py module
    violations = extract_violations(rule_results)

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
        "summary": score_details,
        "violations": violations,
        "detailed_results": rule_results
    }

    return report


def save_report(report_data, output_path):
    """
    Saves the structured report dictionary to a JSON file.
    """
    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)

    with open(destination, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=4, ensure_ascii=False)

    return str(destination)