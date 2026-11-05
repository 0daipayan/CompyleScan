import json
import re
from pathlib import Path

from .rule_loader import load_rules

from .validators.format_validator import validate_required
from .validators.quantity_validator import validate_quantity
from .validators.mrp_validator import validate_mrp
from .validators.date_validator import validate_date
from .validators.contact_validator import validate_contact
from .validators.unit_price_validator import validate_unit_price

# ============================================================
# OCR CONFIDENCE POLICY
# ============================================================

# Below this -> OCR is too uncertain for automatic decision
LOW_CONFIDENCE = 0.65


def sanitize_manufacture_date(raw_date_str):
    """
    Validate/normalize a manufacture-date value without applying
    product-specific OCR substitutions.

    Important: values such as 18/24 or 19/24 are NOT silently changed
    to 08/24 or 09/24. If OCR produced an invalid month, the value is
    left untouched so the compliance layer can mark it for review.
    """
    if not raw_date_str:
        return None

    text = str(raw_date_str).strip()
    match = re.search(
        r"(?<!\d)(\d{1,2})[./-](\d{1,2}|\d{2,4})(?!\d)",
        text,
    )
    if not match:
        return text

    first, second = match.groups()

    # Month-year form: 1/2026 or 01/26
    if len(second) in (2, 4):
        try:
            first_num = int(first)
        except ValueError:
            return text

        if len(second) == 4 or (len(second) == 2 and first_num <= 12):
            if first_num <= 12:
                return f"{first_num:02d}/{second}"

    # Full date is kept in its original DD/MM/YYYY-style form.
    return text.replace(".", "/").replace("-", "/")

# Field alias mapping table to match alternate OCR output keys
FIELD_ALIASES = {
    "manufacture_date": ["manufacture_date", "mfg_date", "date_of_manufacture", "mfg"],
    "mrp": ["mrp", "max_retail_price", "price", "retail_price"],
    "net_quantity": ["net_quantity", "net_qty", "quantity", "net_weight", "net_wt"],
    "manufacturer": ["manufacturer", "packer", "importer", "manufacturer_details", "mfd_by"],
    "country_of_origin": ["country_of_origin", "origin_country", "made_in"],
    "consumer_care": ["consumer_care", "customer_care", "contact", "email", "phone"],
    "product_name": ["product_name", "product", "product_title", "name"],
    "best_before": ["best_before", "best_before_date", "use_by", "expiry", "expiry_date", "exp_date"],
}


# ============================================================
# FIELD HELPERS
# ============================================================

def _field_value(ocr_data, field):
    """
    Reads field values from root, extracted_fields nested dictionary,
    or through field aliases. Handles dictionary formats with units.
    """
    value = ocr_data.get(field)

    if value is None and isinstance(ocr_data.get("extracted_fields"), dict):
        value = ocr_data["extracted_fields"].get(field)

    if value is None and field in FIELD_ALIASES:
        for alias in FIELD_ALIASES[field]:
            value = ocr_data.get(alias)
            if value is None and isinstance(ocr_data.get("extracted_fields"), dict):
                value = ocr_data["extracted_fields"].get(alias)
            if value is not None:
                break

    if isinstance(value, dict):
        # Consumer-care is a structured object (phone/email/website).
        # Preserve the dictionary so validators and the UI can use
        # whichever contact details were actually detected.
        if field == "consumer_care":
            return value

        raw_value = value.get("value")
        unit = value.get("unit")

        if field == "net_quantity" and raw_value is not None and unit:
            return f"{raw_value} {unit}"

        return raw_value

    return value


def _field_confidence(ocr_data, field):
    """
    Return field confidence in the 0..1 range.
    """
    value = ocr_data.get(field)

    if value is None and isinstance(ocr_data.get("extracted_fields"), dict):
        value = ocr_data["extracted_fields"].get(field)

    if isinstance(value, dict) and value.get("confidence") is not None:
        try:
            confidence = float(value["confidence"])
            return confidence / 100 if confidence > 1 else confidence
        except (ValueError, TypeError):
            pass

    meta = ocr_data.get("_meta", {})

    field_conf = meta.get("field_confidence", {}).get(field)

    if field_conf is not None:
        try:
            confidence = float(field_conf)
            return confidence / 100 if confidence > 1 else confidence
        except (ValueError, TypeError):
            pass

    global_conf = meta.get("ocr_confidence")

    if global_conf is not None:
        try:
            confidence = float(global_conf)
            return confidence / 100 if confidence > 1 else confidence
        except (ValueError, TypeError):
            pass

    return None


def _product_text(ocr_data):
    return str(_field_value(ocr_data, "product_name") or "").lower()


# ============================================================
# RAW OCR FIELD EXTRACTION
# ============================================================

def _extract_fields_from_raw_ocr(raw_text, existing=None):
    """
    Parse raw OCR text into normalized fields.

    Tolerates common OCR errors and fills only missing fields:
    - "mi" is normalized to "ml" for net quantity.
    - Manufacture-date prefixes such as "Mfd in" / "Mfg" are supported.
    - URLs/domains are extracted from messy OCR text.
    - Product name falls back to the first meaningful OCR line.
    """
    extracted = dict(existing or {})

    if not raw_text:
        return extracted

    raw_text = str(raw_text)
    compact_text = re.sub(r"[ \t]+", " ", raw_text)

    # 1. NET QUANTITY
    # Prefer an explicit NET WEIGHT / NET QTY declaration.
    # For expressions such as:
    #   "NET WEIGHT: 184 g + 50 g Extra = 234 g"
    # the declared total (234 g) is the value we want, not the first
    # component (184 g or 50 g).
    if not extracted.get("net_quantity"):
        net_total_patterns = [
            re.compile(
                r"net\s*(?:weight|qty|quantity)\s*[:\-]?[^\n]{0,100}?"
                r"(?:=|equals|total\s*(?:net\s*)?(?:weight|quantity)?\s*[:\-]?)\s*"
                r"(\d+(?:[.,]\d+)?)\s*(kg|g|mg|ml|l|litre|litres|liter|liters)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"net\s*(?:weight|qty|quantity)\s*[:\-]?[^\n]{0,100}?"
                r"(?:=|equals)\s*(\d+(?:[.,]\d+)?)\s*"
                r"(kg|g|mg|ml|l|litre|litres|liter|liters)\b",
                re.IGNORECASE,
            ),
        ]

        net_match = None
        for pattern in net_total_patterns:
            net_match = pattern.search(compact_text)
            if net_match:
                break

        if net_match:
            val, unit = net_match.groups()
            val = val.replace(",", ".")
            unit = unit.lower()
            extracted["net_quantity"] = f"{val} {unit}"
        else:
            # Next preference: a quantity immediately following the NET
            # label, e.g. "NET QTY: 500 ml" or "NET WEIGHT 234 g".
            explicit_net = re.search(
                r"net\s*(?:weight|qty|quantity)\s*[:\-]?\s*"
                r"(\d+(?:[.,]\d+)?)\s*"
                r"(ml|l|litre|litres|liter|liters|kg|g|mg|unit|units|piece|pieces|pc|pcs)\b",
                compact_text,
                re.IGNORECASE,
            )
            if explicit_net:
                val, unit = explicit_net.groups()
                val = val.replace(",", ".")
                unit = "ml" if unit.lower() == "mi" else unit.lower()
                extracted["net_quantity"] = f"{val} {unit}"
            else:
                # Last resort: search quantity-like tokens, but prefer
                # larger declared quantities over tiny "extra" components.
                candidates = re.findall(
                    r"(\d+(?:[.,]\d+)?)\s*"
                    r"(mi|ml|l|litre|litres|liter|liters|kg|g|mg|unit|units|piece|pieces|pc|pcs)\b",
                    compact_text,
                    re.IGNORECASE,
                )
                if candidates:
                    parsed = []
                    for val, unit in candidates:
                        try:
                            number = float(val.replace(",", "."))
                        except ValueError:
                            continue
                        normalized_unit = "ml" if unit.lower() == "mi" else unit.lower()
                        parsed.append((number, normalized_unit, val))

                    if parsed:
                        # Do not simply take the first OCR number. For a
                        # normal package declaration the largest plausible
                        # mass/volume is a safer fallback than "50 g Extra".
                        number, unit, original = max(parsed, key=lambda x: x[0])
                        extracted["net_quantity"] = f"{original.replace(',', '.')} {unit}"

    # 2. MANUFACTURE DATE
    # Handles "Mfd in 12/2024", "Mfg 12/24", "Mfd: 12-2024",
    # month-year forms, and full numeric dates.
    mfg_pattern = re.compile(
        r"(?:mfd|mfg|manufactured|manufacture|manufacturing|"
        r"date\s*of\s*manufacture|manufacture\s*date)"
        r"(?:\s*(?:in|on|date|dt\.?))?\s*[:\-]?\s*"
        r"(\d{1,2}[/-]\d{4}|\d{1,2}[/-]\d{2}\b|"
        r"\d{4}[/-]\d{1,2}\b|"
        r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|"
        r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|"
        r"May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|"
        r"Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4})",
        re.IGNORECASE
    )

    match = mfg_pattern.search(compact_text)
    if match and not extracted.get("manufacture_date"):
        extracted["manufacture_date"] = sanitize_manufacture_date(
            match.group(1).strip()
        )
    elif extracted.get("manufacture_date"):
        extracted["manufacture_date"] = sanitize_manufacture_date(
            str(extracted["manufacture_date"])
        )

    # 3. BEST BEFORE / USE BY / EXPIRY
    # These are separate from PKD/packing date. We never treat PKD as
    # manufacture date automatically.
    if not extracted.get("best_before"):
        best_before_pattern = re.compile(
            r"(?:best\s*before|use\s*by|expiry|exp\.?\s*date|exp\.?|bbd|bb\s*date)"
            r"\s*[:\-]?\s*"
            r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-]\d{2,4}|"
            r"\d{4}[/-]\d{1,2})",
            re.IGNORECASE,
        )
        best_match = best_before_pattern.search(compact_text)
        if best_match:
            extracted["best_before"] = best_match.group(1).strip()

    # 4. CONSUMER CARE / WEBSITE
    # Extract URLs or common domains from messy OCR text.
    url_pattern = re.compile(
        r"(https?://\S+|www\.\S+|"
        r"\b[a-zA-Z0-9-]+\.(?:com|in|co\.in|org|net|biz)\b)",
        re.IGNORECASE
    )

    match = url_pattern.search(compact_text)

    phones = re.findall(r"\\b1800\\d{6,7}\\b|\\b\\d{10}\\b", compact_text)
    emails = re.findall(
        r"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",
        compact_text,
    )

    consumer_care = extracted.get("consumer_care")
    if isinstance(consumer_care, str):
        consumer_care = {
            "phone": consumer_care,
            "email": None,
            "website": None,
        }
    elif not isinstance(consumer_care, dict):
        consumer_care = {}

    if phones and not consumer_care.get("phone"):
        consumer_care["phone"] = phones[0]
    if emails and not consumer_care.get("email"):
        consumer_care["email"] = emails[0]
    if match and not consumer_care.get("website"):
        consumer_care["website"] = match.group(1).rstrip(".,;:)]}")

    if any(consumer_care.values()):
        extracted["consumer_care"] = consumer_care

    # 5. PRODUCT NAME FALLBACK
    # Never use an arbitrary first OCR line as the product name. That can
    # turn an address, ingredients line, or regulatory text into a product.
    # Only use a strongly structured label pattern.
    if not extracted.get("product_name"):
        product_match = re.search(
            r"^\s*([A-Za-z][A-Za-z0-9&'()./ -]{1,80}?)\s+"
            r"(?:net\s*(?:weight|qty|quantity))\s*[:\-]?",
            raw_text,
            re.IGNORECASE | re.MULTILINE,
        )
        if product_match:
            candidate = re.sub(r"\s+", " ", product_match.group(1)).strip(" :,-")
            if candidate and len(candidate) >= 3:
                extracted["product_name"] = candidate

    return extracted


def extract_fields_from_ocr_data(ocr_data):
    """
    Enrich an OCR dictionary from raw_ocr_text/raw_text/ocr_text.

    Existing extracted values are preserved. Regex extraction only fills
    fields that are missing, preventing valid OCR values such as
    "12/2024" from being overwritten by None.
    """
    if not isinstance(ocr_data, dict):
        raise ValueError("OCR data must be a dictionary.")

    raw_text = (
        ocr_data.get("raw_ocr_text")
        or ocr_data.get("raw_text")
        or ocr_data.get("ocr_text")
        or ""
    )

    extracted_fields = ocr_data.get("extracted_fields")
    if not isinstance(extracted_fields, dict):
        extracted_fields = {}

    enriched = _extract_fields_from_raw_ocr(raw_text, extracted_fields)
    ocr_data["extracted_fields"] = enriched

    # Preserve compatibility with code that reads root-level fields.
    for field, value in enriched.items():
        if field == "manufacture_date" and value is not None:
            value = sanitize_manufacture_date(str(value))
            enriched[field] = value
        if ocr_data.get(field) is None and value is not None:
            ocr_data[field] = value

    return ocr_data


# ============================================================
# APPLICABILITY
# ============================================================

def _infer_applicability(condition, ocr_data):
    """
    Decide whether a conditional rule applies.
    True  -> rule applies
    False -> NOT_APPLICABLE
    None  -> unable to determine -> REVIEW
    """
    explicit = ocr_data.get("applicability", {})

    if condition in explicit:
        return explicit[condition]

    # Manufacturer / packer / importer information
    if condition == "manufacturer_packer_importer_status":
        return True

    # Imported product / Country of Origin requirement
    if condition == "product_is_imported":
        country = _field_value(ocr_data, "country_of_origin")
        if country is not None:
            return True
        imported = ocr_data.get("imported")
        if isinstance(imported, bool):
            return imported
        return True

    # Manufacture date
    if condition == "rule_6_1_d_applies":
        explicit_value = ocr_data.get("rule_6_1_d_applies")
        if isinstance(explicit_value, bool):
            return explicit_value
        return True

    # Shelf life
    if condition == "commodity_has_applicable_shelf_life_requirement":
        explicit_value = ocr_data.get("shelf_life_applicable")
        if isinstance(explicit_value, bool):
            return explicit_value

        text = _product_text(ocr_data)
        perishable_keywords = (
            "food", "milk", "juice", "snack", "biscuit",
            "chocolate", "cosmetic", "cream", "shampoo",
            "medicine", "tablet", "capsule", "pharma"
        )
        return any(word in text for word in perishable_keywords)

    # Unit sale price
    if condition == "rule_6_11_applies":
        explicit_value = ocr_data.get("rule_6_11_applies")
        if isinstance(explicit_value, bool):
            return explicit_value

        text = _product_text(ocr_data)
        non_unit_price_keywords = (
            "boat", "earphone", "airpod", "airpods", "headphone", "headset",
            "mobile", "phone", "charger", "laptop", "computer", "keyboard",
            "mouse", "speaker", "electronics", "appliance", "wn", "cable", "watch"
        )
        return not any(word in text for word in non_unit_price_keywords)

    return None


# ============================================================
# VALUE SANITY CHECK
# ============================================================

def _sanity_check(field, value):
    if value is None or value == "":
        return None

    # MRP
    if field in ["mrp", "max_retail_price"]:
        try:
            numeric_text = re.sub(r"[^0-9.]", "", str(value))
            numeric = float(numeric_text) if numeric_text else 0.0

            if numeric <= 0:
                return "FAIL"
            return None
        except (ValueError, TypeError):
            return "REVIEW"

    # NET QUANTITY
    if field == "net_quantity":
        text = str(value).strip().lower()
        quantity_pattern = re.compile(
            r"^\s*\d+(?:\.\d+)?\s*"
            r"(unit|units|piece|pieces|pc|pcs|g|kg|mg|"
            r"ml|l|litre|litres|liter|liters|cm|m)\s*$",
            re.IGNORECASE
        )
        if quantity_pattern.match(text):
            return None
        return "REVIEW"

    # MANUFACTURE DATE
    if field in ["manufacture_date", "mfg_date"]:
        text = str(value).strip()
        valid_date_patterns = [
            r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$",
            r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{4}$",
            r"^\d{1,2}/\d{4}$",
            r"^\d{1,2}-\d{4}$",
            r"^\d{4}-\d{1,2}$",
            r"^\d{4}/\d{1,2}$",
            r"^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$"
        ]

        for pattern in valid_date_patterns:
            if re.match(pattern, text, re.IGNORECASE):
                return None
        return "REVIEW"

    return None


# ============================================================
# OCR CONFIDENCE GATE
# ============================================================

def _confidence_gate(field, value, ocr_data):
    if value is None or value == "":
        return None

    confidence = _field_confidence(ocr_data, field)

    if confidence is not None and confidence < LOW_CONFIDENCE:
        return "REVIEW"

    sanity = _sanity_check(field, value)
    if sanity:
        return sanity

    return None


# ============================================================
# VALIDATORS
# ============================================================

def validate_field(validation_type, value):
    if validation_type in ["required", "conditional_required"]:
        return validate_required(value)

    elif validation_type == "required_with_unit":
        result = validate_quantity(value)
        if result["status"] != "PASS":
            text = str(value or "").strip()
            quantity_pattern = re.compile(
                r"^\s*\d+(?:\.\d+)?\s*"
                r"(unit|units|piece|pieces|pc|pcs|g|kg|mg|"
                r"ml|l|litre|litres|liter|liters|cm|m)\s*$",
                re.IGNORECASE
            )
            if quantity_pattern.match(text):
                return {
                    "status": "PASS",
                    "message": "Net quantity declaration is present and has a valid unit."
                }
        return result

    elif validation_type == "required_currency":
        return validate_mrp(value)

    elif validation_type in ["required_date", "conditional_required_date"]:
        result = validate_date(value)
        if result["status"] != "PASS":
            text = str(value or "").strip()
            month_year = re.compile(
                r"^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$",
                re.IGNORECASE
            )
            short_month_year = re.compile(
                r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{4}$",
                re.IGNORECASE
            )
            numeric_date = re.compile(
                r"^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$|^\d{1,2}/\d{4}$"
            )

            if month_year.match(text) or short_month_year.match(text) or numeric_date.match(text):
                return {
                    "status": "PASS",
                    "message": "Manufacture date is present in a valid month-year format."
                }
        return result

    elif validation_type == "required_contact":
        if isinstance(value, dict):
            has_contact = any(
                str(value.get(key) or "").strip()
                for key in ("phone", "email", "website")
            )
            if not has_contact:
                return {
                    "status": "FAIL",
                    "message": "Consumer care contact details are missing."
                }

            # Validate the phone when present; email/website are still
            # accepted as valid contact declarations when no phone exists.
            phone = value.get("phone")
            if phone:
                result = validate_contact(phone)
                if result.get("status") == "PASS":
                    return result

            if value.get("email") or value.get("website"):
                return {
                    "status": "PASS",
                    "message": "Consumer care contact details are present."
                }

            return {
                "status": "REVIEW",
                "message": "Consumer care contact details need review."
            }

        return validate_contact(value)

    elif validation_type == "conditional_unit_price":
        return validate_unit_price(value)

    return {
        "status": "REVIEW",
        "message": f"No validator implemented for validation type: {validation_type}"
    }


# ============================================================
# CHECK ONE RULE
# ============================================================

def check_rule(rule, ocr_data):
    rule_id = rule["rule_id"]
    field = rule["field"]
    validation = rule.get("validation", {})
    validation_type = validation.get("type")

    value = _field_value(ocr_data, field)
    applicability = rule.get("applicability", {})
    applicability_type = applicability.get("type", "general")
    condition = applicability.get("condition")

    # STEP 1 — APPLICABILITY
    if applicability_type == "conditional" and condition:
        applicable = _infer_applicability(condition, ocr_data)

        if applicable is False:
            return {
                "rule_id": rule_id,
                "field": field,
                "status": "NOT_APPLICABLE",
                "value": value,
                "message": "Rule is not applicable to the identified product."
            }

        if applicable is None:
            return {
                "rule_id": rule_id,
                "field": field,
                "status": "REVIEW",
                "value": value,
                "message": f"Unable to determine whether the {field.replace('_', ' ')} requirement applies."
            }

    # STEP 2 — EXTRACTION TRUST
    gate = _confidence_gate(field, value, ocr_data)

    if gate == "REVIEW":
        return {
            "rule_id": rule_id,
            "field": field,
            "status": "REVIEW",
            "value": value,
            "message": "The declaration was detected, but OCR/extraction confidence is too low for automatic validation."
        }

    if gate == "FAIL":
        return {
            "rule_id": rule_id,
            "field": field,
            "status": "FAIL",
            "value": value,
            "message": "Detected declaration contains an invalid value."
        }

    # STEP 3 — LEGAL FORMAT VALIDATION
    validation_result = validate_field(validation_type, value)

    return {
        "rule_id": rule_id,
        "field": field,
        "status": validation_result["status"],
        "value": value,
        "message": validation_result["message"]
    }


# ============================================================
# COMPLETE COMPLIANCE CHECK
# ============================================================

def check_compliance(ocr_data):
    rule_data = load_rules()
    rules = rule_data["rules"]

    results = []
    for rule in rules:
        results.append(check_rule(rule, ocr_data))

    return results


# ============================================================
# LOAD OCR JSON
# ============================================================

def load_ocr_json(json_path):
    json_path = Path(json_path)

    if not json_path.exists():
        raise FileNotFoundError(f"OCR JSON file not found: {json_path}")

    with open(json_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError("OCR JSON must contain a JSON object.")

    # Enrich missing fields from raw OCR text before compliance checks.
    return extract_fields_from_ocr_data(data)

# ============================================================
# FINAL TARGETED ACCURACY PATCH
# ============================================================
# This section intentionally overrides only the parts that need
# field-specific reconciliation. The original rule engine above is
# preserved unchanged.

def _normalize_compact_numeric_date(value):
    """Normalize OCR date separators without inventing date values."""
    if value is None:
        return value

    text = str(value).strip()
    compact = re.sub(r"\s+", "", text)
    compact = compact.replace(".", "/").replace("-", "/")

    # OCR can drop the separator between MM and YY in DD/MMYY.
    # Only normalize this unambiguous 6-digit structure.
    match = re.fullmatch(r"(\d{1,2})/(\d{4})", compact)
    if match:
        first, tail = match.groups()
        # A DD/MMYY form has exactly four digits after the first slash.
        # Interpret as DD/MM/YY only when DD is > 12; otherwise leave
        # it alone because it could legitimately be MM/YYYY.
        if len(first) == 2 and int(first) > 12:
            return f"{first}/{tail[:2]}/{tail[2:]}"
    return compact


def _raw_text_from_ocr(ocr_data):
    if not isinstance(ocr_data, dict):
        return ""
    return str(
        ocr_data.get("raw_ocr_text")
        or ocr_data.get("raw_text")
        or ocr_data.get("ocr_text")
        or ""
    )


def _extract_labeled_date(raw_text, labels):
    """
    Extract a date immediately associated with a label.
    Allows OCR whitespace around separators, e.g. 13/1 /26.
    Does not convert an unlabeled date into a legal declaration.
    """
    if not raw_text:
        return None

    label_pattern = "|".join(labels)
    pattern = re.compile(
        rf"(?:{label_pattern})\s*[:.\-]?\s*"
        rf"(\d{{1,2}}\s*[/-]\s*\d{{1,2}}\s*[/-]\s*\d{{2,4}}|"
        rf"\d{{1,2}}\s*[/-]\s*\d{{4}}|"
        rf"\d{{4}}\s*[/-]\s*\d{{1,2}})",
        re.IGNORECASE,
    )
    match = pattern.search(raw_text)
    if not match:
        return None

    value = re.sub(r"\s+", "", match.group(1))
    return value.replace(".", "/")


def _extract_manufacturer_from_raw(raw_text):
    """
    Recover a company declaration from OCR when the structured extractor
    selected a visibly corrupted candidate. This is generic: it does not
    hardcode a product or company name.
    """
    if not raw_text:
        return None

    # Prefer declarations containing Industries + Ltd/Limited.
    patterns = [
        re.compile(
            r"\b([A-Za-z][A-Za-z0-9&.,' -]{1,70}\bIndustries\s+"
            r"(?:Limited|Ltd\.?))\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"(?:marketed|manufactured|manufactured\s+by|mfd\.?\s*by|"
            r"manufactured\s+at|queries.*?write\s+to\s+us\s+at)"
            r".{0,30}?\b([A-Za-z][A-Za-z0-9&.,' -]{1,70}\b"
            r"(?:Limited|Ltd\.?))\b",
            re.IGNORECASE,
        ),
    ]

    candidates = []
    for pattern in patterns:
        for match in pattern.finditer(raw_text):
            candidate = re.sub(r"\s+", " ", match.group(1)).strip(" ,.:;-")
            if len(candidate) >= 5:
                candidates.append(candidate)

    if not candidates:
        return None

    # Prefer the candidate containing "Industries"; preserve original
    # capitalization where OCR provided it.
    candidates.sort(
        key=lambda x: (
            "industries" in x.lower(),
            "limited" in x.lower() or "ltd" in x.lower(),
            -len(x),
        ),
        reverse=True,
    )
    return candidates[0]


def _repair_rule_input_fields(ocr_data):
    """
    Repair only strong, context-labelled extraction errors before rules run.
    The function mutates the supplied dictionary so the same corrected
    values are visible to rule results and downstream report generation.
    """
    if not isinstance(ocr_data, dict):
        return ocr_data

    raw_text = _raw_text_from_ocr(ocr_data)

    extracted = ocr_data.get("extracted_fields")
    if not isinstance(extracted, dict):
        extracted = {}
        ocr_data["extracted_fields"] = extracted

    # 1. Manufacturer: if raw OCR contains a clear company declaration,
    # prefer it over a short corrupted OCR candidate such as "Ost Industries".
    raw_manufacturer = _extract_manufacturer_from_raw(raw_text)
    current_manufacturer = _field_value(ocr_data, "manufacturer")
    if raw_manufacturer:
        current_text = str(current_manufacturer or "").strip().lower()
        raw_text_lower = raw_manufacturer.lower()

        # Replace only when the raw declaration is substantially stronger
        # than a missing/short/corrupted value.
        if (
            not current_text
            or current_text not in raw_text.lower()
            or len(current_text) < max(8, len(raw_text_lower) * 0.45)
        ):
            extracted["manufacturer"] = raw_manufacturer
            ocr_data["manufacturer"] = raw_manufacturer

    # 2. Manufacture/packing date: normalize a compact DD/MMYY OCR form.
    mfg_value = _field_value(ocr_data, "manufacture_date")
    if mfg_value:
        normalized = _normalize_compact_numeric_date(mfg_value)
        extracted["manufacture_date"] = normalized
        ocr_data["manufacture_date"] = normalized

    # If an explicit MFG/MFD declaration exists, use that labelled evidence.
    labelled_mfg = _extract_labeled_date(
        raw_text,
        [
            r"mfd",
            r"mfg",
            r"manufactured",
            r"date\s+of\s+manufacture",
            r"manufacture\s+date",
        ],
    )
    if labelled_mfg:
        labelled_mfg = _normalize_compact_numeric_date(labelled_mfg)
        extracted["manufacture_date"] = labelled_mfg
        ocr_data["manufacture_date"] = labelled_mfg

    # 3. Best-before / expiry: ONLY use a date attached to USE BY / EXP /
    # BEST BEFORE. This prevents a PKD date from becoming best-before.
    labelled_best = _extract_labeled_date(
        raw_text,
        [
            r"best\s*before",
            r"use\s*by",
            r"expiry",
            r"exp\.?\s*date",
            r"exp\.?",
            r"bbd",
            r"bb\s*date",
        ],
    )
    if labelled_best:
        labelled_best = _normalize_compact_numeric_date(labelled_best)
        extracted["best_before"] = labelled_best
        ocr_data["best_before"] = labelled_best

    return ocr_data


def _final_infer_applicability(condition, ocr_data):
    """
    Final applicability override.

    For product_is_imported:
      - explicit country declaration -> applicable
      - explicit imported=True -> applicable
      - explicit imported=False -> not applicable
      - explicit "Made in India" -> not applicable
      - otherwise -> REVIEW, because OCR cannot establish import status.
    """
    explicit = ocr_data.get("applicability", {})
    if isinstance(explicit, dict) and condition in explicit:
        return explicit[condition]

    if condition == "product_is_imported":
        country = _field_value(ocr_data, "country_of_origin")
        if country is not None and str(country).strip():
            return True

        imported = ocr_data.get("imported")
        if isinstance(imported, bool):
            return imported

        raw_text = _raw_text_from_ocr(ocr_data).lower()
        if re.search(r"\bmade\s+in\s+india\b|\bcountry\s+of\s+origin\s*[:\-]?\s*india\b", raw_text):
            return False

        # Unknown is not the same as "imported".
        return None

    return _infer_applicability(condition, ocr_data)


def _final_check_rule(rule, ocr_data):
    """Same original rule flow, using the final applicability resolver."""
    rule_id = rule["rule_id"]
    field = rule["field"]
    validation = rule.get("validation", {})
    validation_type = validation.get("type")

    value = _field_value(ocr_data, field)
    applicability = rule.get("applicability", {})
    applicability_type = applicability.get("type", "general")
    condition = applicability.get("condition")

    if applicability_type == "conditional" and condition:
        applicable = _final_infer_applicability(condition, ocr_data)

        if applicable is False:
            return {
                "rule_id": rule_id,
                "field": field,
                "status": "NOT_APPLICABLE",
                "value": value,
                "message": "Rule is not applicable to the identified product.",
            }

        if applicable is None:
            return {
                "rule_id": rule_id,
                "field": field,
                "status": "REVIEW",
                "value": value,
                "message": f"Unable to determine whether the {field.replace('_', ' ')} requirement applies.",
            }

    gate = _confidence_gate(field, value, ocr_data)

    if gate == "REVIEW":
        return {
            "rule_id": rule_id,
            "field": field,
            "status": "REVIEW",
            "value": value,
            "message": "The declaration was detected, but OCR/extraction confidence is too low for automatic validation.",
        }

    if gate == "FAIL":
        return {
            "rule_id": rule_id,
            "field": field,
            "status": "FAIL",
            "value": value,
            "message": "Detected declaration contains an invalid value.",
        }

    validation_result = validate_field(validation_type, value)

    return {
        "rule_id": rule_id,
        "field": field,
        "status": validation_result["status"],
        "value": value,
        "message": validation_result["message"],
    }


def check_rule(rule, ocr_data):
    """
    Final public rule-check entry point.
    Preserves the original validator architecture while applying the
    field-specific repair layer first.
    """
    _repair_rule_input_fields(ocr_data)
    return _final_check_rule(rule, ocr_data)


def check_compliance(ocr_data):
    """
    Final compliance entry point. All rules are evaluated; no result is
    filtered out based on status.
    """
    _repair_rule_input_fields(ocr_data)

    rule_data = load_rules()
    rules = rule_data["rules"]

    results = []
    for rule in rules:
        results.append(_final_check_rule(rule, ocr_data))

    return results
