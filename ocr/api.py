import base64
import os
import tempfile

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from main import process_product_image


app = FastAPI(
    title="CompyleScan OCR API",
    version="1.0.0"
)


# ---------------------------------------------------------
# Request format
# ---------------------------------------------------------

class ExtractRequest(BaseModel):
    images: list[str]


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "CompyleScan OCR"
    }


# ---------------------------------------------------------
# Convert OCR result to backend format
# ---------------------------------------------------------

def make_field(value, confidence, unit=None):
    return {
        "value": value,
        "unit": unit,
        "confidence": round(float(confidence) / 100, 4)
        if confidence is not None else 0
    }


def convert_to_backend_format(result):
    data = result.get("data", {})

    confidence = data.get("_meta", {}).get(
        "ocr_confidence",
        result.get("ocr_confidence", 0)
    )

    net_quantity = data.get("net_quantity")

    quantity_value = None
    quantity_unit = None

    if net_quantity:
        parts = str(net_quantity).split()

        if len(parts) >= 2:
            try:
                quantity_value = float(parts[0])
                quantity_unit = " ".join(parts[1:])
            except ValueError:
                quantity_value = net_quantity
        else:
            quantity_value = net_quantity

    return {
        "product_name": make_field(
            data.get("product_name"),
            confidence
        ),

        "manufacturer": make_field(
            data.get("manufacturer"),
            confidence
        ),

        "country_of_origin": make_field(
            data.get("country_of_origin"),
            confidence
        ),

        "net_quantity": make_field(
            quantity_value,
            confidence,
            quantity_unit
        ),

        "manufacture_date": make_field(
            data.get("manufacture_date"),
            confidence
        ),

        "best_before": make_field(
            data.get("best_before"),
            confidence
        ),

        "mrp": make_field(
            data.get("mrp"),
            confidence,
            "INR"
        ),

        "consumer_care": make_field(
            data.get("consumer_care"),
            confidence
        ),

        "unit_sale_price": make_field(
            data.get("unit_sale_price"),
            confidence
        )
    }


# ---------------------------------------------------------
# Base64 image decoder
# ---------------------------------------------------------

def save_base64_image(image_data: str) -> str:

    if not image_data:
        raise ValueError("Empty image data.")

    if "," in image_data and image_data.startswith("data:"):

        header, encoded = image_data.split(",", 1)

        if "image/png" in header:
            suffix = ".png"

        elif "image/webp" in header:
            suffix = ".webp"

        else:
            suffix = ".jpg"

    else:
        encoded = image_data
        suffix = ".jpg"

    try:
        image_bytes = base64.b64decode(encoded)

    except Exception as exc:
        raise ValueError(
            "Invalid Base64 image data."
        ) from exc

    if not image_bytes:
        raise ValueError("Decoded image is empty.")

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    )

    try:
        temp_file.write(image_bytes)
        temp_file.close()

    except Exception:

        temp_file.close()

        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)

        raise

    return temp_file.name


# ---------------------------------------------------------
# OCR extraction endpoint
# ---------------------------------------------------------

@app.post("/extract")
def extract(request: ExtractRequest):

    if not request.images:

        raise HTTPException(
            status_code=400,
            detail="At least one image is required."
        )

    results = []

    for image_data in request.images:

        temp_path = None

        try:

            temp_path = save_base64_image(
                image_data
            )

            result = process_product_image(
                temp_path
            )

            backend_data = convert_to_backend_format(
                result
            )

            results.append({
                "status": result.get("status"),
                **backend_data,
                "_meta": result.get(
                    "data",
                    {}
                ).get("_meta", {})
            })

        except Exception as exc:

            results.append({
                "status": "reject",
                "error": str(exc)
            })

        finally:

            if temp_path and os.path.exists(temp_path):

                try:
                    os.remove(temp_path)

                except OSError:
                    pass

    valid_results = [
        result
        for result in results
        if result.get("status") in (
            "success",
            "needs_review"
        )
    ]

    if not valid_results:

        raise HTTPException(
            status_code=422,
            detail={
                "message":
                    "OCR could not process any supplied image.",
                "results": results
            }
        )

    best_result = max(
        valid_results,
        key=lambda result: (
            result.get("_meta", {}).get(
                "field_completeness",
                0
            ),

            result.get("_meta", {}).get(
                "ocr_confidence",
                0
            )
        )
    )

    return best_resultgit add . ..\.gitignore