import re


def validate_contact(value):
    """
    Validate whether consumer-care contact information
    contains a recognizable phone number or email address.
    """

    # --------------------------------------------------
    # Missing value
    # --------------------------------------------------

    if value is None:
        return {
            "status": "FAIL",
            "message": "Consumer-care information is missing."
        }

    value = str(value).strip()

    if not value:
        return {
            "status": "FAIL",
            "message": "Consumer-care information is missing."
        }

    # --------------------------------------------------
    # Phone number
    # --------------------------------------------------

    # Supports formats such as:
    # 18001234567
    # 1800-123-4567
    # 1800 123 4567
    # +91-9876543210
    # +91 9876543210
    # 9876543210

    phone_pattern = r"(?<!\d)(?:\+91[\s-]?)?(?:\d[\s-]?){7,14}\d(?!\d)"

    # --------------------------------------------------
    # Email address
    # --------------------------------------------------

    email_pattern = (
        r"[A-Za-z0-9._%+-]+"
        r"@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    )

    has_phone = re.search(
        phone_pattern,
        value
    )

    has_email = re.search(
        email_pattern,
        value
    )

    # --------------------------------------------------
    # Valid contact found
    # --------------------------------------------------

    if has_phone or has_email:
        return {
            "status": "PASS",
            "message": (
                "Recognizable consumer-care contact "
                "information is present."
            ),
            "value": value
        }

    # --------------------------------------------------
    # Contact exists but format is uncertain
    # --------------------------------------------------

    return {
        "status": "REVIEW",
        "message": (
            "Consumer-care information is present, "
            "but its format could not be confidently interpreted."
        ),
        "value": value
    }