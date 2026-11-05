def calculate_score(results):
    """Calculate score. REVIEW is not treated as FAIL."""

    total_rules = len(results)

    passed = sum(r.get("status") == "PASS" for r in results)
    failed = sum(r.get("status") == "FAIL" for r in results)
    review = sum(r.get("status") == "REVIEW" for r in results)
    not_applicable = sum(r.get("status") == "NOT_APPLICABLE" for r in results)

    applicable_rules = total_rules - not_applicable

    score = (
        (passed / applicable_rules) * 100
        if applicable_rules > 0
        else 100
    )

    if failed > 0:
        overall_status = "FAIL"
    elif review > 0:
        overall_status = "REVIEW"
    else:
        overall_status = "PASS"

    return {
        "total_rules": total_rules,
        "passed": passed,
        "failed": failed,
        "review": review,
        "not_applicable": not_applicable,
        "score": round(score, 2),
        "overall_status": overall_status,
    }
