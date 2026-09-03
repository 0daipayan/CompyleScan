def generate_violations(results):
    """
    Extract violations and uncertain rule results
    from the compliance checking results.

    FAIL results are treated as actual violations.
    REVIEW results are treated as issues requiring
    manual review.

    NOT_APPLICABLE results are ignored.
    PASS results are ignored.
    """

    violations = []

    for result in results:

        status = result.get("status")

        # --------------------------------------------------
        # Failed legal rule
        # --------------------------------------------------

        if status == "FAIL":

            violations.append({
                "rule_id": result.get("rule_id"),
                "field": result.get("field"),
                "status": "FAIL",
                "value": result.get("value"),
                "message": result.get("message")
            })

        # --------------------------------------------------
        # Uncertain result requiring review
        # --------------------------------------------------

        elif status == "REVIEW":

            violations.append({
                "rule_id": result.get("rule_id"),
                "field": result.get("field"),
                "status": "REVIEW",
                "value": result.get("value"),
                "message": result.get("message")
            })

    return violations

# if __name__ == "__main__":

#     test_results = [
#         {
#             "rule_id": "LM001",
#             "field": "manufacturer",
#             "status": "PASS",
#             "value": "Tata Consumer Products",
#             "message": "Required declaration is present."
#         },
#         {
#             "rule_id": "LM002",
#             "field": "country_of_origin",
#             "status": "NOT_APPLICABLE",
#             "value": "India",
#             "message": "Rule is not applicable."
#         },
#         {
#             "rule_id": "LM005",
#             "field": "manufacture_date",
#             "status": "FAIL",
#             "value": "",
#             "message": "Date declaration is missing."
#         },
#         {
#             "rule_id": "LM007",
#             "field": "mrp",
#             "status": "FAIL",
#             "value": "",
#             "message": "MRP is missing."
#         },
#         {
#             "rule_id": "LM008",
#             "field": "consumer_care",
#             "status": "REVIEW",
#             "value": "1800-123-4567",
#             "message": "Contact format is uncertain."
#         }
#     ]

#     violations = generate_violations(test_results)

#     print("\nVIOLATIONS")
#     print("=" * 50)

#     for violation in violations:

#         print(
#             f"{violation['rule_id']} | "
#             f"{violation['field']} | "
#             f"{violation['status']}"
#         )

#         print(
#             f"   Value   : {violation['value']}"
#         )

#         print(
#             f"   Message : {violation['message']}"
#         )

#         print()