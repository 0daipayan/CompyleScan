import re


# ---------------------------------------------------------
# Helper
# ---------------------------------------------------------

def clean(value):
    if not value:
        return None

    value = re.sub(r"\s+", " ", value)
    value = value.strip(" .,;:-")

    return value if value else None


# ---------------------------------------------------------
# LM007 - MRP
# ---------------------------------------------------------

def extract_mrp(text: str):
    """Extract MRP / Maximum Retail Price / Retail Price."""

    patterns = [

        # MRP: ₹2990 / MRP % 2990
        r"MRP[:\s.%\-]*(?:Rs\.?|₹|INR|€)?\s*"
        r"([\d,]+(?:\.\d{1,2})?)",

        # Max. Retail Price ₹2990
        # Also handles OCR symbols such as %
        r"Max\.?\s*Retail\s*Price[:\s.%\-]*"
        r"(?:Rs\.?|₹|INR|€)?\s*"
        r"([\d,]+(?:\.\d{1,2})?)",

        # Retail Price ₹2990
        # Useful for noisy OCR:
        # "Retail Price ® 2,990.00"
        r"Retail\s*Price[:\s.%\-®©]*"
        r"(?:Rs\.?|₹|INR|€)?\s*"
        r"([\d,]+(?:\.\d{1,2})?)",

        # Rs 2990 / ₹2990
        r"(?:Rs\.?|₹|INR)\s*"
        r"([\d,]+(?:\.\d{1,2})?)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            value = match.group(1).replace(",", "")

            return (
                float(value)
                if "." in value
                else int(value)
            )

    return None


# ---------------------------------------------------------
# LM004 - Net Quantity
# ---------------------------------------------------------

def extract_net_quantity(text: str):
    """Extract net quantity such as 70 g, 1 kg, 500 ml, 1 unit."""

    # Normal spelling
    patterns = [

        r"(?:Net\s*Quantity|Net\s*Content)"
        r"[:\s.\-]*"
        r"(\d+(?:\.\d+)?)"
        r"\s*"
        r"(g|gm|gram|grams|kg|mg|ml|l|litre|liter|litres|unit|units)\b",

        # Common OCR mistakes:
        # Cuancity -> Quantity
        # Cuantity -> Quantity
        # Quantitv -> Quantity
        r"(?:Net\s*)?"
        r"(?:Cuancity|Cuantity|Quantitv|Quantit)"
        r"[:\s.\-]*"
        r"(\d+(?:\.\d+)?)"
        r"\s*"
        r"(g|gm|gram|grams|kg|mg|ml|l|litre|liter|litres|unit|units)\b",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            return (
                f"{match.group(1)} "
                f"{match.group(2).lower()}"
            )

    # Some packages contain:
    # "Net Content 1 UNIT"
    # but OCR may insert noise between number and unit.
    fallback = re.search(
        r"(?:Net\s*(?:Content|Quantity))"
        r"[:\s.\-]*"
        r"(\d+(?:\.\d+)?)"
        r"[^A-Za-z0-9]{0,5}"
        r"(?:s?UNIT|UNITS?)\b",
        text,
        re.IGNORECASE
    )

    if fallback:
        return f"{fallback.group(1)} unit"

    return None


# ---------------------------------------------------------
# LM005 - Manufacture Date
# ---------------------------------------------------------

def extract_manufacture_date(text):

    date_pattern = (
        r"("
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
        r"|"
        r"\d{1,2}[/-]\d{4}"
        r"|"
        r"[A-Za-z]{3,9}\.?\s+\d{4}"
        r")"
    )

    patterns = [

        # Manufactured Date: April 2024
        rf"(?:Manufactur(?:ed|ing)\s*Date|Mfg\.?\s*Date|Mfd\.?)"
        rf"\s*[:=\-]?\s*{date_pattern}",

        # Month & Year of April 2024
        rf"Month\s*&?\s*Year\s*(?:of)?\s*[:=\-]?\s*{date_pattern}",

        # Manufactured on April 2024
        rf"Manufactured\s*on\s*[:=\-]?\s*{date_pattern}",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            return clean(match.group(1))

    return None


# ---------------------------------------------------------
# LM006 - Best Before
# ---------------------------------------------------------

def extract_best_before(text):

    pattern = (
        r"(?:"
        r"Best\s*Before"
        r"|Use\s*Before"
        r"|Use\s*By"
        r"|Shelf\s*Life"
        r")"
        r"\s*[:=\-]?\s*"
        r"([A-Za-z0-9 /+\-]+)"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:

        value = clean(match.group(1))

        # Stop extraction if OCR has captured another field.
        if value:
            value = re.split(
                r"\b(?:MRP|Retail\s*Price|Max\.?\s*Retail\s*Price|"
                r"Manufactured|Country\s*of\s*Origin|"
                r"Consumer\s*Care|Customer\s*Care)\b",
                value,
                flags=re.IGNORECASE
            )[0]

        return clean(value)

    return None


# ---------------------------------------------------------
# LM001 - Manufacturer
# ---------------------------------------------------------

def extract_manufacturer(text):

    patterns = [

        r"(?:Manufactured\s*by)"
        r"\s*[:=\-]?\s*"
        r"([A-Za-z0-9 &.,()\-]{3,120})",

        r"(?:Manufacturer)"
        r"\s*[:=\-]?\s*"
        r"([A-Za-z0-9 &.,()\-]{3,120})",

        r"(?:Mfg\.?\s*by)"
        r"\s*[:=\-]?\s*"
        r"([A-Za-z0-9 &.,()\-]{3,120})",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            value = clean(match.group(1))

            if value:

                # Stop common OCR spillover
                value = re.split(
                    r"\b(?:India|www\.|Country\s*of\s*Origin|"
                    r"Month\s*&?\s*Year|Consumer\s*Care|"
                    r"Customer\s*Care|Warranty)\b",
                    value,
                    flags=re.IGNORECASE
                )[0]

                return clean(value)

    return None


# ---------------------------------------------------------
# LM002 - Country of Origin
# ---------------------------------------------------------

def extract_country_of_origin(text):

    pattern = (
        r"Country\s*of\s*Origin"
        r"\s*[:=\-]?\s*"
        r"([A-Za-z]{3,40})"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:

        return clean(match.group(1))

    return None


# ---------------------------------------------------------
# LM008 - Consumer Care
# ---------------------------------------------------------

def extract_consumer_care(text: str):
    """Extract consumer/customer care phone number."""

    # First try numbers near Consumer Care / Customer Care
    pattern = (
        r"(?:Consumer|Customer)\s*Care"
        r"[:\s.\-]*(?:No\.?|Number)?"
        r"[:\s.\-]*"
        r"(\+?\d[\d\s.\-]{7,20}\d)"
    )

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:

        number = match.group(1)

        # Clean spaces, dots and hyphens
        number = re.sub(
            r"[^\d+]",
            "",
            number
        )

        return number

    # Fallback for Indian toll-free numbers
    fallback = re.search(
        r"\b(1800[\s.\-]?\d{2,3}[\s.\-]?\d{3,4})\b",
        text
    )

    if fallback:

        return re.sub(
            r"[^\d+]",
            "",
            fallback.group(1)
        )

    # Fallback for normal 10-digit numbers
    fallback = re.search(
        r"\b\d{10}\b",
        text
    )

    if fallback:

        return fallback.group(0)

    return None


# ---------------------------------------------------------
# LM009 - Unit Sale Price
# ---------------------------------------------------------

def extract_unit_sale_price(text):

    patterns = [

        r"(?:Unit\s*Sale\s*Price|Unit\s*Price)"
        r"\s*[:=\-]?\s*"
        r"(?:Rs\.?|INR|₹)?\s*"
        r"(\d+(?:\.\d{1,2})?)"
        r"\s*(?:per|/)\s*"
        r"(kg|g|100g|l|litre|liter|ml)",

        r"(?:Rs\.?|INR|₹)\s*"
        r"(\d+(?:\.\d{1,2})?)"
        r"\s*(?:per|/)\s*"
        r"(kg|g|100g|l|litre|liter|ml)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            value = match.group(1)
            unit = match.group(2).lower()

            return f"{value} per {unit}"

    return None


# ---------------------------------------------------------
# LM003 - Product Name
# ---------------------------------------------------------

def extract_product_name(text):

    text = text.strip()

    if not text:
        return None

    # Best case:
    # Product Code boAt Airdopes 131
    match = re.search(
        r"Product\s*Code\s*[:=\-]?\s*"
        r"(.{2,60}?)"
        r"(?=\s+Net\s*(?:Quantity|Qty|Content)\b)",
        text,
        re.IGNORECASE
    )

    if match:

        value = clean(match.group(1))

        if value:

            # Remove common OCR junk at the end.
            # Example:
            # "boAt Airdopes 131 7"
            # -> "boAt Airdopes 131"
            value = re.sub(
                r"\s+\d+$",
                "",
                value
            )

            return clean(value)

    # Explicit Product Name
    match = re.search(
        r"Product\s*Name\s*[:=\-]\s*"
        r"([A-Za-z0-9 &.,()\-]{2,80})",
        text,
        re.IGNORECASE
    )

    if match:

        return clean(match.group(1))

    # Brand Name
    match = re.search(
        r"Brand\s*Name\s*[:=\-]\s*"
        r"([A-Za-z0-9 &.,()\-]{2,80})",
        text,
        re.IGNORECASE
    )

    if match:

        return clean(match.group(1))

    # Fallback
    words = text.split()

    if words:
        return " ".join(words[:5])

    return None


# ---------------------------------------------------------
# Expected fields
# ---------------------------------------------------------

EXPECTED_FIELDS = [
    "manufacturer",
    "country_of_origin",
    "product_name",
    "net_quantity",
    "manufacture_date",
    "best_before",
    "mrp",
    "consumer_care",
    "unit_sale_price",
]


# ---------------------------------------------------------
# Main formatter
# ---------------------------------------------------------

def build_structured_json(raw_text, confidence):

    result = {
        "manufacturer": extract_manufacturer(raw_text),
        "country_of_origin": extract_country_of_origin(raw_text),
        "product_name": extract_product_name(raw_text),
        "net_quantity": extract_net_quantity(raw_text),
        "manufacture_date": extract_manufacture_date(raw_text),
        "best_before": extract_best_before(raw_text),
        "mrp": extract_mrp(raw_text),
        "consumer_care": extract_consumer_care(raw_text),
        "unit_sale_price": extract_unit_sale_price(raw_text),

        "_meta": {
            "ocr_confidence": confidence,
            "extraction_notes": [],
        },
    }

    validation_warnings = validate_extracted_data(result)

    result["_meta"]["validation_warnings"] = validation_warnings

    fields_found = 0

    for field in EXPECTED_FIELDS:

        if result[field] is None:

            result["_meta"]["extraction_notes"].append(
                f"{field} not detected, needs manual review"
            )

        else:

            fields_found += 1

    result["_meta"]["fields_found"] = fields_found

    result["_meta"]["fields_expected"] = len(EXPECTED_FIELDS)

    result["_meta"]["field_completeness"] = round(
        fields_found / len(EXPECTED_FIELDS) * 100,
        1
    )

    return result


# ---------------------------------------------------------
# Validation
# ---------------------------------------------------------

def validate_extracted_data(data):

    warnings = []

    # MRP should be a positive number
    if data["mrp"] is not None:

        if not isinstance(data["mrp"], (int, float)):

            warnings.append(
                "MRP has an invalid format."
            )

        elif data["mrp"] <= 0:

            warnings.append(
                "MRP should be greater than zero."
            )

    # Net quantity should contain a number and a unit
    if data["net_quantity"] is not None:

        if not re.search(
            r"\d+(?:\.\d+)?\s*(kg|g|mg|ml|l|unit)",
            data["net_quantity"],
            re.IGNORECASE
        ):

            warnings.append(
                "Net quantity has an unusual format."
            )

    # Country should contain letters only
    if data["country_of_origin"] is not None:

        if not re.fullmatch(
            r"[A-Za-z ]+",
            data["country_of_origin"]
        ):

            warnings.append(
                "Country of origin has an unusual format."
            )

    # Consumer-care number should contain enough digits
    if data["consumer_care"] is not None:

        digit_count = len(
            re.sub(
                r"\D",
                "",
                data["consumer_care"]
            )
        )

        if digit_count < 8:

            warnings.append(
                "Consumer care number looks too short."
            )

    return warnings