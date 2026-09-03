import re


def validate_mrp(value):
    """
    Validate whether the OCR-extracted MRP
    contains an interpretable monetary amount.
    """

    if value is None:
        return {
            "status": "FAIL",
            "message": "MRP is missing."
        }

    value = str(value).strip()

    if not value:
        return {
            "status": "FAIL",
            "message": "MRP is missing."
        }

    # Examples:
    # ₹120
    # Rs 120
    # Rs. 120
    # MRP ₹120
    # MRP Rs. 120

    pattern = (
        r"(?:MRP\s*)?"
        r"(?:₹|Rs\.?|INR)?\s*"
        r"\d+(?:\.\d{1,2})?"
    )

    if re.search(pattern, value, re.IGNORECASE):

        return {
            "status": "PASS",
            "message": "MRP contains an interpretable monetary amount.",
            "value": value
        }

    return {
        "status": "REVIEW",
        "message": "MRP could not be confidently interpreted.",
        "value": value
    }