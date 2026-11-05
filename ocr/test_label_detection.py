import sys

from preprocessing.preprocess import detect_and_warp_label


input_path = sys.argv[1]

output_path = "debug_detected_label.png"

detect_and_warp_label(
    input_path,
    output_path
)

print(f"Saved detected label to: {output_path}")