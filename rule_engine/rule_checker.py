import json
from pathlib import Path

from rule_loader import load_rules

from validators.format_validator import validate_required
from validators.quantity_validator import validate_quantity
from validators.mrp_validator import validate_mrp
from validators.date_validator import validate_date
from validators.contact_validator import validate_contact
from validators.unit_price_validator import validate_unit_price


def validate_field(validation_type, value):
    """
    Select the correct validator based on the
    validation type defined in the YAML rules.
    """

    # Basic required field
    if validation_type == "required":
        return validate_required(value)

    # Quantity such as: 1 kg, 500 g, 250 ml
    elif validation_type == "required_with_unit":
        return validate_quantity(value)

    # MRP such as: ₹30, Rs. 30
    elif validation_type == "required_currency":
        return validate_mrp(value)

    # Date / shelf-life
    elif validation_type in [
        "required_date",
        "conditional_required_date"
    ]:
        return validate_date(value)

    # Consumer-care information
    elif validation_type == "required_contact":
        return validate_contact(value)

    # Unit sale price such as: ₹30 per kg
    elif validation_type == "conditional_unit_price":
        return validate_unit_price(value)

    # Unknown validation type
    return {
        "status": "REVIEW",
        "message": (
            f"No validator implemented for "
            f"validation type: {validation_type}"
        )
    }


def check_rule(rule, ocr_data):
    """
    Check one legal rule against OCR data.
    """

    rule_id = rule["rule_id"]
    field = rule["field"]

    validation = rule.get("validation", {})
    validation_type = validation.get("type")

    value = ocr_data.get(field)

    # --------------------------------------------------
    # Conditional required rules
    # --------------------------------------------------

    if validation_type == "conditional_required":

        # Country of origin
        if field == "country_of_origin":

            imported = ocr_data.get("imported")

            # Product is not imported
            if imported is False:

                return {
                    "rule_id": rule_id,
                    "field": field,
                    "status": "NOT_APPLICABLE",
                    "value": value,
                    "message": (
                        "Country of origin rule is not applicable "
                        "because the product is not identified as imported."
                    )
                }

            # Product is imported
            if imported is True:

                validation_result = validate_required(value)

                return {
                    "rule_id": rule_id,
                    "field": field,
                    "status": validation_result["status"],
                    "value": value,
                    "message": validation_result["message"]
                }

            # Import status is unknown
            return {
                "rule_id": rule_id,
                "field": field,
                "status": "REVIEW",
                "value": value,
                "message": (
                    "Unable to determine whether the product is imported."
                )
            }

        # Other conditional-required fields
        # such as manufacturer
        validation_result = validate_required(value)

        return {
            "rule_id": rule_id,
            "field": field,
            "status": validation_result["status"],
            "value": value,
            "message": validation_result["message"]
        }

    # --------------------------------------------------
    # Normal validation
    # --------------------------------------------------

    validation_result = validate_field(
        validation_type,
        value
    )

    return {
        "rule_id": rule_id,
        "field": field,
        "status": validation_result["status"],
        "value": value,
        "message": validation_result["message"]
    }


def check_compliance(ocr_data):
    """
    Run all legal rules against OCR data.
    """

    rule_data = load_rules()

    rules = rule_data["rules"]

    results = []

    for rule in rules:

        result = check_rule(
            rule,
            ocr_data
        )

        results.append(result)

    return results


def load_ocr_json(json_path):
    """
    Load OCR output from an external JSON file.
    """

    json_path = Path(json_path)

    if not json_path.exists():
        raise FileNotFoundError(
            f"OCR JSON file not found: {json_path}"
        )

    with open(
        json_path,
        "r",
        encoding="utf-8"
    ) as file:

        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(
            "OCR JSON must contain a JSON object."
        )

    return data


if __name__ == "__main__":

    ocr_file = (
        Path(__file__).parent
        / "test_data"
        / "sample_ocr.json"
    )

    try:

        ocr_data = load_ocr_json(
            ocr_file
        )

        results = check_compliance(
            ocr_data
        )

        print()
        print("LEGAL METROLOGY COMPLIANCE RESULT")
        print("=" * 60)

        for result in results:

            print(
                f"{result['rule_id']} | "
                f"{result['field']} | "
                f"{result['status']}"
            )

            print(
                f"   Value   : {result['value']}"
            )

            print(
                f"   Message : {result['message']}"
            )

            print()

    except Exception as error:

        print()
        print("ERROR")
        print("=" * 60)
        print(error)