def calculate_score(results):
    """
    Calculate the compliance score and overall status
    from rule-checking results.
    """

    total_rules = len(results)

    passed = 0
    failed = 0
    review = 0
    not_applicable = 0

    for result in results:

        status = result.get("status")

        if status == "PASS":
            passed += 1

        elif status == "FAIL":
            failed += 1

        elif status == "REVIEW":
            review += 1

        elif status == "NOT_APPLICABLE":
            not_applicable += 1

    # Rules that actually apply to the product
    applicable_rules = total_rules - not_applicable

    # Calculate score
    if applicable_rules > 0:
        score = (passed / applicable_rules) * 100
    else:
        score = 0

    # Determine overall status
    if failed > 0:
        overall_status = "FAIL"

    elif review > 0:
        overall_status = "NEEDS_REVIEW"

    else:
        overall_status = "PASS"

    return {
        "total_rules": total_rules,
        "passed": passed,
        "failed": failed,
        "review": review,
        "not_applicable": not_applicable,
        "score": round(score, 2),
        "overall_status": overall_status
    }

# if __name__ == "__main__":

#     test_results = [
#         {"status": "PASS"},
#         {"status": "PASS"},
#         {"status": "PASS"},
#         {"status": "PASS"},
#         {"status": "PASS"},
#         {"status": "PASS"},
#         {"status": "FAIL"},
#         {"status": "FAIL"},
#         {"status": "NOT_APPLICABLE"}
#     ]

#     score = calculate_score(test_results)

#     print("\nSCORE")
#     print("=" * 40)

#     for key, value in score.items():
#         print(f"{key}: {value}")