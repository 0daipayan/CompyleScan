import os
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

# Force resolve paths so ocr can import modules from the sibling directory
sys.path.append(str(Path(__file__).resolve().parent.parent / "CompyleScan" / "rule_engine"))

from preprocessing.preprocess import clean_image  # Custom image adjustments
from ocr_engine import extract_text             # Structural dictionary extraction
from engine import run_compliance_check         # Your main engine processor pipeline

app = FastAPI(title="CompyleScan AI Core Service")

@app.post("/api/v1/analyze-package")
async def analyze_package(file: UploadFile = File(...)):
    try:
        # 1. Establish persistent local buffer directory inside docker scratchpad
        upload_dir = Path(__file__).parent / "input"
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        temp_input_path = upload_dir / file.filename
        with open(temp_input_path, "wb") as buffer:
            buffer.write(await file.read())

        # 2. Run your preprocessing pipeline steps
        processed_img_path = clean_image(str(temp_input_path))

        # 3. Pull extracted token metrics back out into structured dictionary format
        ocr_data = extract_text(processed_img_path)

        if not isinstance(ocr_data, dict):
            raise ValueError("Extracted text attributes failed formatting into a standard schema dict.")

        # 4. Drop standard dictionary directly into your core engine processor
        report_data = run_compliance_check(ocr_data)

        # 5. Return complete schema matrix back to Node.js backend proxy
        return JSONResponse(status_code=200, content=report_data)

    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Pipeline Execution Crash: {str(e)}")
