from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent))

from json_formatter import format_ocr_text


sample_text = """
Nutrition Facts

Calories 412 kcal
Total Fat 20 g 12%
Saturated Fat 8 g
Cholesterol 4 g 21%
Sodium 2 g 0.5%
Total Carbohydrate 15 g 2%
Protein 12 g 2%
"""


result = format_ocr_text(sample_text)

print("----- FORMATTED DATA -----")
print(result)