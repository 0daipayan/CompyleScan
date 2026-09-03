def is_empty(value):
    """
    Check whether a value is missing or empty.
    """

    if value is None:
        return True

    if isinstance(value, str) and value.strip() == "":
        return True

    return False


def validate_required(value):
    """
    Validate whether a required OCR field is present.
    """

    if is_empty(value):
        return {
            "status": "FAIL",
            "message": "Required declaration is missing."
        }

    return {
        "status": "PASS",
        "message": "Required declaration is present.",
        "value": value
    }