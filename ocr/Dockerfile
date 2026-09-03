# Use an explicit python runtime base image matching your cpython development footprints
FROM python:3.13-slim

# Install system binaries required for image processing libraries (OpenCV, Pytesseract, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up our secure app execution context space
WORKDIR /app

# Copy dependency files first to leverage Docker's caching layer safely
COPY ocr/requirements.txt ./ocr_requirements.txt

# Install python execution packages natively
RUN pip install --no-cache-dir -r ocr_requirements.txt

# Copy all source assets over to runtime directory structures
COPY ocr/ /app/ocr/
COPY CompyleScan/rule_engine/ /app/rule_engine/

# Expose standard network boundary port used inside your api.py setup
EXPOSE 8000

# Fire up our unified FastAPI web worker instance
CMD ["uvicorn", "ocr.api:app", "--host", "0.0.0.0", "--port", "8000"]
