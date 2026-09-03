import re


def validate_date(value):
    """
    Validate common date/month formats extracted by OCR.
    """

    if value is None:
        return {
            "status": "FAIL",
            "message": "Date declaration is missing."
        }

    value = str(value).strip()

    if not value:
        return {
            "status": "FAIL",
            "message": "Date declaration is missing."
        }

    patterns = [
        r"\b\d{1,2}/\d{4}\b",
        r"\b\d{1,2}-\d{4}\b",
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{4}\b",
        r"\b\d{4}-\d{1,2}-\d{1,2}\b"
    ]

    for pattern in patterns:

        if re.search(pattern, value):

            return {
                "status": "PASS",
                "message": "Date declaration has a recognizable date format.",
                "value": value
            }

    # Text such as "12 months from manufacture"
    if re.search(
        r"\b\d+\s*(month|months|year|years)\b",
        value,
        re.IGNORECASE
    ):

        return {
            "status": "PASS",
            "message": "Shelf-life declaration is recognizable.",
            "value": value
        }

    return {
        "status": "REVIEW",
        "message": "Date declaration could not be confidently interpreted.",
        "value": value
    }