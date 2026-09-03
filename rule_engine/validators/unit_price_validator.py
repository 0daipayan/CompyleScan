import re


def validate_unit_price(value):
    """
    Validate the basic structure of a unit sale price.

    Examples:
        ₹30 per kg
        ₹0.20 per g
        Rs. 50 per litre
        ₹100/kg

    This validator checks whether the value contains
    an interpretable price and a unit reference.

    It does not determine complete legal applicability.
    """

    if value is None:
        return {
            "status": "FAIL",
            "message": "Unit sale price is missing."
        }

    value = str(value).strip()

    if not value:
        return {
            "status": "FAIL",
            "message": "Unit sale price is missing."
        }

    # Price + unit
    pattern = (
        r"(?:₹|Rs\.?|INR)?\s*"
        r"\d+(?:\.\d{1,2})?"
        r"\s*"
        r"(?:per\s*)?"
        r"(kg|g|mg|l|ml|litre|liter|"
        r"litres|liters|piece|pieces|pcs)"
    )

    if re.search(pattern, value, re.IGNORECASE):

        return {
            "status": "PASS",
            "message": (
                "Unit sale price contains an interpretable "
                "price and unit."
            ),
            "value": value
        }

    return {
        "status": "REVIEW",
        "message": (
            "Unit sale price could not be confidently interpreted."
        ),
        "value": value
    }