import re


def validate_quantity(value):
    """
    Validate the basic structure of a net quantity declaration.

    Examples of recognizable quantities:
        500 g
        1 kg
        250 ml
        1 L
        12 pieces

    This is a format validator.
    It does not determine complete legal applicability.
    """

    if value is None:
        return {
            "status": "FAIL",
            "message": "Net quantity is missing."
        }

    value = str(value).strip()

    if not value:
        return {
            "status": "FAIL",
            "message": "Net quantity is missing."
        }

    # Number + recognized unit
    pattern = r"^\s*\d+(?:\.\d+)?\s*(kg|g|mg|l|ml|L|KG|G|MG|mL|piece|pieces|pcs)\s*$"

    if re.match(pattern, value, re.IGNORECASE):

        return {
            "status": "PASS",
            "message": "Net quantity has a recognizable number and unit.",
            "value": value
        }

    return {
        "status": "REVIEW",
        "message": "Net quantity format could not be confidently interpreted.",
        "value": value
    }