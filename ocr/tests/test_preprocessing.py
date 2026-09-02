import cv2
import pytesseract


pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


images = [
    "output/grayscale.png",
    "output/otsu.png",
    "output/adaptive.png"
]


for image_path in images:
    image = cv2.imread(image_path)

    text = pytesseract.image_to_string(image)

    print("\n" + "=" * 60)
    print(image_path)
    print("=" * 60)
    print(text)