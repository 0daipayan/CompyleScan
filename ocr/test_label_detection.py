from preprocessing.preprocess import detect_and_warp_label

input_path = "input/test_dark.png"
output_path = "output/detected_label.png"

detect_and_warp_label(
    input_path,
    output_path
)