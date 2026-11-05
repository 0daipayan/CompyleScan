"""
preprocess.py
-------------
Image preprocessing pipeline for CompyleScan OCR.

Pipeline:

    input image
        -> orientation handling
        -> resize
        -> grayscale
        -> noise reduction
        -> contrast / brightness correction
        -> thresholding
        -> OCR-ready variants

Also includes conservative label/box detection and
perspective correction.
"""

import cv2
import numpy as np

def preprocess_tube_image(image_path_or_array):
    if isinstance(image_path_or_array, str):
        img = cv2.imread(image_path_or_array, cv2.IMREAD_GRAYSCALE)
    else:
        img = image_path_or_array

    # CLAHE contrast enhancement for reflective surfaces
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)
    
    # Adaptive Thresholding to separate curved text
    thresh = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    return thresh

# ============================================================
# BASIC IMAGE FUNCTIONS
# ============================================================

def read_image(image_path: str) -> np.ndarray:
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image at {image_path}"
        )

    return image


def resize_image(
    image: np.ndarray,
    target_width: int = 1200
) -> np.ndarray:

    h, w = image.shape[:2]

    if w == target_width:
        return image

    scale = target_width / w

    new_size = (
        target_width,
        int(h * scale)
    )

    interpolation = (
        cv2.INTER_CUBIC
        if scale > 1
        else cv2.INTER_AREA
    )

    return cv2.resize(
        image,
        new_size,
        interpolation=interpolation
    )


def to_grayscale(
    image: np.ndarray
) -> np.ndarray:

    if len(image.shape) == 2:
        return image

    return cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )


def reduce_noise(
    gray_image: np.ndarray
) -> np.ndarray:

    return cv2.fastNlMeansDenoising(
        gray_image,
        h=8,
        templateWindowSize=7,
        searchWindowSize=21
    )


# ============================================================
# CONTRAST / BRIGHTNESS
# ============================================================

def enhance_contrast(
    gray_image: np.ndarray
) -> np.ndarray:
    """
    CLAHE improves local contrast.
    """

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    return clahe.apply(gray_image)


def gamma_correction(
    gray_image: np.ndarray,
    gamma: float
) -> np.ndarray:
    """
    Gamma correction.

    gamma < 1 -> brightens dark images
    gamma > 1 -> darkens bright images
    """

    gamma = max(
        0.3,
        min(float(gamma), 3.0)
    )

    table = np.array(
        [
            ((i / 255.0) ** gamma) * 255
            for i in range(256)
        ],
        dtype=np.uint8
    )

    return cv2.LUT(
        gray_image,
        table
    )


def auto_correct_brightness(
    gray_image: np.ndarray
) -> np.ndarray:
    """
    Automatically correct image brightness.
    """

    mean_brightness = float(
        np.mean(gray_image)
    )

    if mean_brightness <= 1:
        return gray_image.copy()

    target = 125.0

    denominator = np.log(
        (mean_brightness / 255.0) + 1e-6
    )

    if abs(denominator) < 1e-6:
        return gray_image.copy()

    gamma = np.log(
        target / 255.0
    ) / denominator

    gamma = np.clip(
        gamma,
        0.45,
        2.2
    )

    corrected = gamma_correction(
        gray_image,
        gamma
    )

    return corrected


def low_light_enhancement(
    gray_image: np.ndarray
) -> np.ndarray:
    """
    Stronger recovery path for dark / unevenly illuminated
    photographs.
    """

    mean_brightness = float(
        np.mean(gray_image)
    )

    if mean_brightness < 100:
        gamma = 0.55
    elif mean_brightness < 125:
        gamma = 0.70
    else:
        gamma = 0.90

    bright = gamma_correction(
        gray_image,
        gamma
    )

    clahe = cv2.createCLAHE(
        clipLimit=3.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        bright
    )

    background = cv2.GaussianBlur(
        enhanced,
        (0, 0),
        sigmaX=21
    )

    normalized = cv2.divide(
        enhanced,
        background,
        scale=180
    )

    return cv2.normalize(
        normalized,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    ).astype(np.uint8)


# ============================================================
# THRESHOLDING
# ============================================================

def adaptive_threshold(
    gray_image: np.ndarray
) -> np.ndarray:

    return cv2.adaptiveThreshold(
        gray_image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=15
    )


def adaptive_threshold_strong(
    gray_image: np.ndarray
) -> np.ndarray:

    return cv2.adaptiveThreshold(
        gray_image,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=41,
        C=11
    )


def otsu_threshold(
    gray_image: np.ndarray
) -> np.ndarray:

    _, result = cv2.threshold(
        gray_image,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    return result


# ============================================================
# SHARPENING
# ============================================================

def sharpen(
    gray_image: np.ndarray
) -> np.ndarray:

    blurred = cv2.GaussianBlur(
        gray_image,
        (0, 0),
        sigmaX=3
    )

    return cv2.addWeighted(
        gray_image,
        1.5,
        blurred,
        -0.5,
        0
    )


# ============================================================
# DESKEW
# ============================================================

def deskew(
    gray_image: np.ndarray
) -> np.ndarray:
    """
    Corrects small angular skew.

    Large rotations are handled separately by
    generate_variants().
    """

    coords = np.column_stack(
        np.where(gray_image < 245)
    )

    if len(coords) < 20:
        return gray_image

    angle = cv2.minAreaRect(
        coords
    )[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    if abs(angle) < 0.5:
        return gray_image

    h, w = gray_image.shape[:2]

    center = (
        w // 2,
        h // 2
    )

    matrix = cv2.getRotationMatrix2D(
        center,
        angle,
        1.0
    )

    return cv2.warpAffine(
        gray_image,
        matrix,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )


# ============================================================
# UPSCALING
# ============================================================

def upscale_if_small(
    image: np.ndarray,
    min_width: int = 1000
) -> np.ndarray:

    h, w = image.shape[:2]

    if w >= min_width:
        return image

    scale = min_width / w

    new_size = (
        min_width,
        int(h * scale)
    )

    return cv2.resize(
        image,
        new_size,
        interpolation=cv2.INTER_CUBIC
    )
def upscale_for_ocr(
    image: np.ndarray,
    target_width: int = 1400
) -> np.ndarray:

    h, w = image.shape[:2]

    if w >= target_width:
        return image

    scale = target_width / w

    new_size = (
        target_width,
        int(h * scale)
    )

    return cv2.resize(
        image,
        new_size,
        interpolation=cv2.INTER_CUBIC
    )


# ============================================================
# ADAPTIVE OCR VARIANT GENERATION
# ============================================================

def generate_variants(
    image_path: str
) -> dict:
    """
    Generates OCR candidates using:

        4 orientations
        ×
        7 preprocessing strategies

    Strategies:

        1. contrast + adaptive threshold
        2. brightness correction
        3. sharpening
        4. Otsu threshold
        5. minimal processing
        6. inverted text
        7. low-light recovery

    The OCR stage later decides which candidate actually
    extracted the most useful fields.
    """

    image = read_image(
        image_path
    )

    # --------------------------------------------------------
    # Four possible orientations
    # --------------------------------------------------------

    orientations = {
        "rot0": image,

        "rot90": cv2.rotate(
            image,
            cv2.ROTATE_90_CLOCKWISE
        ),

        "rot180": cv2.rotate(
            image,
            cv2.ROTATE_180
        ),

        "rot270": cv2.rotate(
            image,
            cv2.ROTATE_90_COUNTERCLOCKWISE
        ),
    }

    variants = {}

    for orientation_name, oriented_image in orientations.items():

        # ----------------------------------------------------
        # Resize
        # ----------------------------------------------------

        resized = resize_image(
            oriented_image,
            target_width=1200
        )

        resized = upscale_if_small(
            resized,
            min_width=1000
        )

        # ----------------------------------------------------
        # Grayscale
        # ----------------------------------------------------

        gray = to_grayscale(
            resized
        )

        # ----------------------------------------------------
        # Noise reduction
        # ----------------------------------------------------

        denoised = reduce_noise(
            gray
        )

        # ====================================================
        # VARIANT 1
        # Normal contrast + adaptive threshold
        # ====================================================

        v1 = enhance_contrast(
            denoised
        )

        v1 = deskew(
            v1
        )

        variants[
            f"{orientation_name}_contrast_adaptive"
        ] = adaptive_threshold(
            v1
        )

        # ====================================================
        # VARIANT 2
        # Automatic brightness correction
        # ====================================================

        v2 = auto_correct_brightness(
            denoised
        )

        v2 = enhance_contrast(
            v2
        )

        v2 = deskew(
            v2
        )

        variants[
            f"{orientation_name}_brightness_corrected"
        ] = adaptive_threshold(
            v2
        )

        # ====================================================
        # VARIANT 3
        # Sharpened
        # ====================================================

        v3 = sharpen(
            denoised
        )

        v3 = enhance_contrast(
            v3
        )

        v3 = deskew(
            v3
        )

        variants[
            f"{orientation_name}_sharpened"
        ] = adaptive_threshold(
            v3
        )

        # ====================================================
        # VARIANT 4
        # Otsu
        # ====================================================

        v4 = enhance_contrast(
            denoised
        )

        v4 = deskew(
            v4
        )

        variants[
            f"{orientation_name}_otsu"
        ] = otsu_threshold(
            v4
        )

        # ====================================================
        # VARIANT 5
        # Minimal processing
        # ====================================================

        variants[
            f"{orientation_name}_minimal"
        ] = deskew(
            denoised
        )

        # ====================================================
        # VARIANT 6
        # Inverted text
        #
        # Useful for dark packages with white text.
        #
        # Converts:
        #
        #     white text on black
        #
        # into:
        #
        #     black text on white
        # ====================================================

        inverted = cv2.bitwise_not(
            denoised
        )

        inverted = deskew(
            inverted
        )

        variants[
            f"{orientation_name}_inverted"
        ] = adaptive_threshold(
            inverted
        )

        # ====================================================
        # VARIANT 7
        # Low-light recovery
        # ====================================================

        low_light = low_light_enhancement(
            denoised
        )

        low_light = deskew(
            low_light
        )

        variants[
            f"{orientation_name}_low_light"
        ] = adaptive_threshold_strong(
            low_light
        )

    return variants


# ============================================================
# SIMPLE SINGLE-PASS PIPELINE
# ============================================================

def process_image(
    image_path: str,
    save_debug_path: str = None
) -> np.ndarray:

    image = read_image(
        image_path
    )

    image = resize_image(
        image
    )

    gray = to_grayscale(
        image
    )

    gray = reduce_noise(
        gray
    )

    gray = enhance_contrast(
        gray
    )

    gray = deskew(
        gray
    )

    final = adaptive_threshold(
        gray
    )

    if save_debug_path:
        cv2.imwrite(
            save_debug_path,
            final
        )

    return final


# ============================================================
# LABEL DETECTION / PERSPECTIVE CORRECTION
# ============================================================

def order_points(
    points: np.ndarray
) -> np.ndarray:
    """
    Orders four points as:

        top-left
        top-right
        bottom-right
        bottom-left
    """

    points = np.asarray(
        points,
        dtype=np.float32
    )

    ordered = np.zeros(
        (4, 2),
        dtype=np.float32
    )

    s = points.sum(
        axis=1
    )

    diff = np.diff(
        points,
        axis=1
    ).reshape(4)

    ordered[0] = points[
        np.argmin(s)
    ]

    ordered[2] = points[
        np.argmax(s)
    ]

    ordered[1] = points[
        np.argmin(diff)
    ]

    ordered[3] = points[
        np.argmax(diff)
    ]

    return ordered


def _quad_quality(
    contour,
    image_shape
):
    """
    Scores a quadrilateral candidate.
    """

    image_h, image_w = image_shape[:2]

    image_area = image_h * image_w

    area = cv2.contourArea(
        contour
    )

    if area <= 0:
        return 0.0

    area_ratio = area / image_area

    # Ignore tiny regions.
    if area_ratio < 0.10:
        return 0.0

    # Ignore almost the entire photograph.
    if area_ratio > 0.82:
        return 0.0

    # --------------------------------------------------------
    # Area score
    # --------------------------------------------------------

    if 0.18 <= area_ratio <= 0.65:
        area_score = 1.0

    elif 0.10 <= area_ratio < 0.18:
        area_score = 0.55

    else:
        area_score = 0.75

    # --------------------------------------------------------
    # Rectangularity
    # --------------------------------------------------------

    perimeter = cv2.arcLength(
        contour,
        True
    )

    if perimeter <= 0:
        return 0.0

    approx = cv2.approxPolyDP(
        contour,
        0.035 * perimeter,
        True
    )

    if len(approx) != 4:
        return 0.0

    approx_area = cv2.contourArea(
        approx
    )

    if approx_area <= 0:
        return 0.0

    rectangularity = min(
        area / approx_area,
        1.0
    )

    # --------------------------------------------------------
    # Aspect ratio
    # --------------------------------------------------------

    x, y, w, h = cv2.boundingRect(
        approx
    )

    if w <= 0 or h <= 0:
        return 0.0

    aspect = max(
        w / h,
        h / w
    )

    if aspect > 5.0:
        return 0.0

    if aspect <= 2.8:
        aspect_score = 1.0

    elif aspect <= 4.0:
        aspect_score = 0.70

    else:
        aspect_score = 0.45

    # --------------------------------------------------------
    # Border penalty
    # --------------------------------------------------------

    touches_border = (
        x <= image_w * 0.015 or
        y <= image_h * 0.015 or
        x + w >= image_w * 0.985 or
        y + h >= image_h * 0.985
    )

    border_score = (
        0.35
        if touches_border
        else 1.0
    )

    # --------------------------------------------------------
    # Final quality
    # --------------------------------------------------------

    quality = (
        area_score * 0.25 +
        rectangularity * 0.35 +
        aspect_score * 0.20 +
        border_score * 0.20
    )

    return round(
        float(quality),
        3
    )


def _rectangle_quality(
    box: np.ndarray,
    image_shape
):
    """
    Scores a rotated rectangle fallback.

    Useful when the package boundary is visible but too
    broken for approxPolyDP() to produce exactly four points.
    """

    image_h, image_w = image_shape[:2]

    image_area = image_h * image_w

    box = np.asarray(
        box,
        dtype=np.float32
    )

    area = cv2.contourArea(
        box
    )

    if area <= 0:
        return 0.0

    area_ratio = area / image_area

    if area_ratio < 0.12:
        return 0.0

    if area_ratio > 0.78:
        return 0.0

    x, y, w, h = cv2.boundingRect(
        box.astype(np.int32)
    )

    if w <= 0 or h <= 0:
        return 0.0

    aspect = max(
        w / h,
        h / w
    )

    if aspect > 5.0:
        return 0.0

    # Prefer medium/large regions.
    if 0.20 <= area_ratio <= 0.65:
        area_score = 1.0
    else:
        area_score = 0.65

    # --------------------------------------------------------
    # Border penalty
    # --------------------------------------------------------

    border_hits = 0

    for px, py in box:

        if (
            px <= image_w * 0.015 or
            py <= image_h * 0.015 or
            px >= image_w * 0.985 or
            py >= image_h * 0.985
        ):
            border_hits += 1

    if border_hits >= 2:
        border_score = 0.30

    elif border_hits == 1:
        border_score = 0.60

    else:
        border_score = 1.0

    # --------------------------------------------------------
    # Aspect score
    # --------------------------------------------------------

    if aspect <= 2.8:
        aspect_score = 1.0

    elif aspect <= 4.0:
        aspect_score = 0.70

    else:
        aspect_score = 0.40

    # --------------------------------------------------------
    # Final quality
    # --------------------------------------------------------

    quality = (
        area_score * 0.45 +
        aspect_score * 0.30 +
        border_score * 0.25
    )

    return round(
        float(quality),
        3
    )


def _perspective_warp(
    image: np.ndarray,
    points: np.ndarray
) -> np.ndarray:
    """
    Perspective-warps a four-point region.
    """

    corners = order_points(
        points
    )

    tl, tr, br, bl = corners

    width_top = np.linalg.norm(
        tr - tl
    )

    width_bottom = np.linalg.norm(
        br - bl
    )

    height_left = np.linalg.norm(
        bl - tl
    )

    height_right = np.linalg.norm(
        br - tr
    )

    max_width = int(
        max(
            width_top,
            width_bottom
        )
    )

    max_height = int(
        max(
            height_left,
            height_right
        )
    )

    max_width = max(
        100,
        min(
            max_width,
            2000
        )
    )

    max_height = max(
        100,
        min(
            max_height,
            2500
        )
    )

    destination = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype=np.float32)

    matrix = cv2.getPerspectiveTransform(
        corners,
        destination
    )

    warped = cv2.warpPerspective(
        image,
        matrix,
        (
            max_width,
            max_height
        ),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

    return warped


def detect_and_warp_label(
    image_path: str,
    output_path: str = None
) -> np.ndarray:
    """
    Detects the main package/label panel and applies
    perspective correction.

    Detection has two stages:

        1. clean quadrilateral detection
        2. rotated-rectangle fallback

    If both are unreliable, the original image is returned.
    """

    image = read_image(
        image_path
    )

    image = resize_image(
        image,
        target_width=1200
    )

    original = image.copy()

    h, w = image.shape[:2]

    gray = to_grayscale(
        image
    )

    # --------------------------------------------------------
    # Prepare edges
    # --------------------------------------------------------

    blurred = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )

    edges1 = cv2.Canny(
        blurred,
        30,
        100
    )

    edges2 = cv2.Canny(
        blurred,
        60,
        160
    )

    edges = cv2.bitwise_or(
        edges1,
        edges2
    )

    # Connect broken package edges.
    kernel_large = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (9, 9)
    )

    edges = cv2.morphologyEx(
        edges,
        cv2.MORPH_CLOSE,
        kernel_large,
        iterations=2
    )

    edges = cv2.dilate(
        edges,
        np.ones(
            (3, 3),
            np.uint8
        ),
        iterations=1
    )

    # --------------------------------------------------------
    # Find contours
    # --------------------------------------------------------

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_LIST,
        cv2.CHAIN_APPROX_SIMPLE
    )

    quad_candidates = []
    rectangle_candidates = []

    for contour in contours:

        area = cv2.contourArea(
            contour
        )

        if area <= 0:
            continue

        # ----------------------------------------------------
        # Candidate A: actual quadrilateral
        # ----------------------------------------------------

        perimeter = cv2.arcLength(
            contour,
            True
        )

        if perimeter > 0:

            approx = cv2.approxPolyDP(
                contour,
                0.035 * perimeter,
                True
            )

            if len(approx) == 4:

                quality = _quad_quality(
                    approx,
                    image.shape
                )

                if quality > 0:

                    quad_candidates.append({
                        "quality": quality,
                        "points": approx.reshape(
                            4,
                            2
                        ).astype(
                            np.float32
                        )
                    })

        # ----------------------------------------------------
        # Candidate B: rotated rectangle fallback
        # ----------------------------------------------------

        rect = cv2.minAreaRect(
            contour
        )

        rect_w, rect_h = rect[1]

        if rect_w < 100 or rect_h < 100:
            continue

        box = cv2.boxPoints(
            rect
        )

        quality = _rectangle_quality(
            box,
            image.shape
        )

        if quality > 0:

            rectangle_candidates.append({
                "quality": quality,
                "points": box.astype(
                    np.float32
                )
            })

    # --------------------------------------------------------
    # Prefer genuine quadrilaterals
    # --------------------------------------------------------

    if quad_candidates:

        quad_candidates.sort(
            key=lambda c: c["quality"],
            reverse=True
        )

        best = quad_candidates[0]

        print(
            f"Best quadrilateral quality: "
            f"{best['quality']:.3f}"
        )

        if best["quality"] >= 0.55:

            warped = _perspective_warp(
                original,
                best["points"]
            )

            if warped.size > 0:

                crop_area = (
                    warped.shape[0]
                    * warped.shape[1]
                )
                warped = upscale_for_ocr(
    warped,
    target_width=1400
)

                original_area = (
                    h * w
                )

                if crop_area >= original_area * 0.08:

                    if output_path:
                        cv2.imwrite(
                            output_path,
                            warped
                        )

                    print(
                        "Label region accepted "
                        "using quadrilateral detection: "
                        f"{warped.shape[1]} x "
                        f"{warped.shape[0]}"
                    )

                    return warped

    # --------------------------------------------------------
    # Rotated rectangle fallback
    # --------------------------------------------------------

    if rectangle_candidates:

        rectangle_candidates.sort(
            key=lambda c: c["quality"],
            reverse=True
        )

        best = rectangle_candidates[0]

        print(
            f"Quadrilateral detection was uncertain. "
            f"Best rectangle fallback quality: "
            f"{best['quality']:.3f}"
        )

        if best["quality"] >= 0.62:

            warped = _perspective_warp(
                original,
                best["points"]
            )
            warped = upscale_for_ocr(
    warped,
    target_width=1400
)

            if warped.size > 0:

                crop_area = (
                    warped.shape[0]
                    * warped.shape[1]
                )

                original_area = (
                    h * w
                )

                if crop_area >= original_area * 0.08:

                    if output_path:
                        cv2.imwrite(
                            output_path,
                            warped
                        )

                    print(
                        "Label region accepted "
                        "using rectangle fallback: "
                        f"{warped.shape[1]} x "
                        f"{warped.shape[0]}"
                    )

                    return warped

    # --------------------------------------------------------
    # Nothing reliable
    # --------------------------------------------------------

    print(
        "No reliable label region detected. "
        "Using original image."
    )

    if output_path:
        cv2.imwrite(
            output_path,
            original
        )

    return original
# ============================================================
# OCR IMAGE IMPROVEMENT
# ============================================================

def _gray_world_balance(image):
    """
    Mild color/illumination correction.

    Useful for photographs with a warm/cool lighting cast.
    Keeps the correction conservative so text is not damaged.
    """

    image = image.astype(np.float32)

    mean_b = np.mean(image[:, :, 0])
    mean_g = np.mean(image[:, :, 1])
    mean_r = np.mean(image[:, :, 2])

    mean_gray = (mean_b + mean_g + mean_r) / 3.0

    image[:, :, 0] *= mean_gray / max(mean_b, 1.0)
    image[:, :, 1] *= mean_gray / max(mean_g, 1.0)
    image[:, :, 2] *= mean_gray / max(mean_r, 1.0)

    return np.clip(image, 0, 255).astype(np.uint8)


def correct_illumination(gray):
    """
    Flatten uneven lighting.

    This is particularly useful for photographs where one side
    of the package is darker than the other.
    """

    # Estimate the slowly changing background illumination.
    background = cv2.GaussianBlur(
        gray,
        (0, 0),
        sigmaX=25,
        sigmaY=25
    )

    background = np.maximum(
        background,
        1
    )

    normalized = cv2.divide(
        gray,
        background,
        scale=255
    )

    return normalized


def upscale_for_improvement(
    image,
    target_height=1800
):
    """
    Upscale small label images so small printed characters
    occupy more pixels for Tesseract.
    """

    h, w = image.shape[:2]

    if h >= target_height:
        return image

    scale = target_height / float(h)

    new_w = int(w * scale)
    new_h = int(h * scale)

    return cv2.resize(
        image,
        (new_w, new_h),
        interpolation=cv2.INTER_CUBIC
    )


def sharpen_for_ocr(gray):
    """
    Mild unsharp masking.

    Avoids aggressive sharpening because that can turn
    characters such as I, l, 1, and punctuation into noise.
    """

    blurred = cv2.GaussianBlur(
        gray,
        (0, 0),
        sigmaX=1.2
    )

    sharpened = cv2.addWeighted(
        gray,
        1.35,
        blurred,
        -0.35,
        0
    )

    return np.clip(
        sharpened,
        0,
        255
    ).astype(np.uint8)


def crop_ocr_borders(image, margin_ratio=0.015):
    """
    Remove a very small border around the detected label.

    We deliberately keep this conservative because useful text
    can sometimes be close to the package edge.
    """

    h, w = image.shape[:2]

    mx = int(w * margin_ratio)
    my = int(h * margin_ratio)

    if w <= 2 * mx or h <= 2 * my:
        return image

    return image[
        my:h - my,
        mx:w - mx
    ]


def improve_label_image(label_image):
    """
    Main Phase-1 OCR image improvement.

    Input:
        BGR label/package image produced by detect_and_warp_label()

    Output:
        A small set of deliberate OCR candidates.

    Candidates:
        primary
        high_contrast
        threshold
    """

    if label_image is None:
        raise ValueError(
            "label_image cannot be None"
        )

    # --------------------------------------------------------
    # 1. Mild color correction
    # --------------------------------------------------------

    balanced = _gray_world_balance(
        label_image
    )

    # --------------------------------------------------------
    # 2. Convert to grayscale
    # --------------------------------------------------------

    gray = to_grayscale(
        balanced
    )

    # --------------------------------------------------------
    # 3. Mild noise reduction
    # --------------------------------------------------------

    gray = cv2.GaussianBlur(
        gray,
        (3, 3),
        0
    )

    # --------------------------------------------------------
    # 4. Flatten uneven illumination
    # --------------------------------------------------------

    flat = correct_illumination(
        gray
    )

    # --------------------------------------------------------
    # 5. Local contrast enhancement
    # --------------------------------------------------------

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        flat
    )

    # --------------------------------------------------------
    # 6. Mild sharpening
    # --------------------------------------------------------

    sharpened = sharpen_for_ocr(
        enhanced
    )

    # --------------------------------------------------------
    # 7. Remove tiny unnecessary border
    # --------------------------------------------------------

    sharpened = crop_ocr_borders(
        sharpened
    )

    # --------------------------------------------------------
    # 8. Upscale
    # --------------------------------------------------------

    primary = upscale_for_improvement(
    sharpened,
    target_height=1800
)

    # --------------------------------------------------------
    # Candidate 2: stronger contrast
    # --------------------------------------------------------

    high_contrast = cv2.normalize(
        primary,
        None,
        alpha=0,
        beta=255,
        norm_type=cv2.NORM_MINMAX
    )

    # --------------------------------------------------------
    # Candidate 3: adaptive threshold
    # --------------------------------------------------------

    threshold = cv2.adaptiveThreshold(
        primary,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

    return {
        "primary": primary,
        "high_contrast": high_contrast,
        "threshold": threshold,
    }


# ============================================================
# PHASE-2 OCR ROBUSTNESS UPGRADE
# ============================================================
# Appended to the existing pipeline so all original functions and
# variants remain available. Targets blur, glare, uneven lighting,
# small text and coloured/reflective packaging.
# ============================================================

def assess_image_quality(image):
    """Return conservative image-quality measurements."""
    if image is None:
        return {
            "brightness": 0.0, "contrast": 0.0,
            "sharpness": 0.0, "glare_ratio": 0.0,
            "width": 0, "height": 0
        }

    gray = to_grayscale(image)
    h, w = gray.shape[:2]

    return {
        "brightness": float(np.mean(gray)),
        "contrast": float(np.std(gray)),
        "sharpness": float(
            cv2.Laplacian(gray, cv2.CV_64F).var()
        ),
        "glare_ratio": float(np.mean(gray >= 250)),
        "width": w,
        "height": h
    }


def correct_glare(gray):
    """
    Conservative reduction of strong reflection regions.
    Completely hidden text cannot be reconstructed, so this only
    handles small/medium highlights and otherwise preserves input.
    """
    if gray is None:
        return gray

    bright_mask = cv2.inRange(gray, 248, 255)

    if float(np.mean(bright_mask > 0)) < 0.005:
        return gray.copy()

    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (5, 5)
    )

    mask = cv2.dilate(
        bright_mask,
        kernel,
        iterations=1
    )

    if float(np.mean(mask > 0)) > 0.18:
        return gray.copy()

    return cv2.inpaint(
        gray,
        mask,
        3,
        cv2.INPAINT_TELEA
    )


def local_illumination_correction(gray):
    """Flatten gradual lighting differences across a package."""
    if gray is None:
        return gray

    background = cv2.GaussianBlur(
        gray,
        (0, 0),
        sigmaX=31,
        sigmaY=31
    )

    background = np.maximum(
        background.astype(np.float32),
        8.0
    )

    normalized = cv2.divide(
        gray.astype(np.float32),
        background,
        scale=180.0
    )

    return cv2.normalize(
        normalized,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    ).astype(np.uint8)


def mild_deblur(gray):
    """
    Mild edge recovery for soft photographs.
    Avoids aggressive deconvolution that can manufacture digits.
    """
    if gray is None:
        return gray

    blur_score = float(
        cv2.Laplacian(gray, cv2.CV_64F).var()
    )

    if blur_score >= 45:
        return gray.copy()

    soft = cv2.GaussianBlur(
        gray,
        (0, 0),
        sigmaX=1.0
    )

    return cv2.addWeighted(
        gray,
        1.25,
        soft,
        -0.25,
        0
    )


def resize_for_text(
    image,
    min_dimension=1400,
    max_dimension=2600
):
    """
    Resolution-aware enlargement. Does not enlarge already-large
    images unnecessarily.
    """
    if image is None:
        return image

    h, w = image.shape[:2]
    smallest = min(h, w)

    if smallest >= min_dimension:
        return image

    scale = min_dimension / float(max(1, smallest))

    if max(h, w) * scale > max_dimension:
        scale = max_dimension / float(max(h, w))

    if scale <= 1.01:
        return image

    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))

    return cv2.resize(
        image,
        (new_w, new_h),
        interpolation=cv2.INTER_CUBIC
    )


def make_ocr_ready_candidates(image):
    """
    Produce additional OCR candidates for difficult photographs.
    Candidate selection remains the responsibility of ocr_engine.py.
    """
    if image is None:
        return {}

    quality = assess_image_quality(image)

    working = image.copy()

    if len(working.shape) == 3:
        working = _gray_world_balance(working)

    gray = to_grayscale(working)

    gray = cv2.GaussianBlur(
        gray,
        (3, 3),
        0
    )

    glare_reduced = correct_glare(gray)

    illumination = local_illumination_correction(
        glare_reduced
    )

    deblurred = mild_deblur(
        illumination
    )

    clahe = cv2.createCLAHE(
        clipLimit=2.2,
        tileGridSize=(8, 8)
    )

    contrast = clahe.apply(
        deblurred
    )

    contrast = resize_for_text(
        contrast
    )

    candidates = {
        "quality_primary": contrast,
        "quality_sharp": sharpen_for_ocr(contrast)
    }

    candidates["quality_adaptive"] = cv2.adaptiveThreshold(
        contrast,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9
    )

    _, otsu = cv2.threshold(
        contrast,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    candidates["quality_otsu"] = otsu

    inverted = cv2.bitwise_not(contrast)

    candidates["quality_inverted"] = cv2.adaptiveThreshold(
        inverted,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9
    )

    candidates["quality_local_strong"] = cv2.adaptiveThreshold(
        contrast,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        41,
        13
    )

    # Metadata is retained internally but does not alter the
    # existing generate_variants() dictionary contract.
    candidates["_quality"] = quality

    return candidates


# Preserve the complete original implementation.
_legacy_generate_variants = generate_variants


def generate_variants(image_path: str) -> dict:
    """
    Upgraded generator: original variants + quality-aware variants.
    """
    variants = _legacy_generate_variants(image_path)

    image = read_image(image_path)

    orientations = {
        "quality_rot0": image,
        "quality_rot90": cv2.rotate(
            image,
            cv2.ROTATE_90_CLOCKWISE
        ),
        "quality_rot180": cv2.rotate(
            image,
            cv2.ROTATE_180
        ),
        "quality_rot270": cv2.rotate(
            image,
            cv2.ROTATE_90_COUNTERCLOCKWISE
        )
    }

    for orientation_name, oriented in orientations.items():
        try:
            extra = make_ocr_ready_candidates(oriented)
        except Exception:
            # Experimental processing must never break the original path.
            continue

        for candidate_name, candidate_image in extra.items():
            if candidate_name == "_quality":
                continue
            if candidate_image is None:
                continue

            variants[
                f"{orientation_name}_{candidate_name}"
            ] = candidate_image

    return variants


def preprocess_tube_image(image_path_or_array):
    """
    Preserve the public function used by ocr_engine.py while using
    the improved primary OCR candidate.
    """
    if isinstance(image_path_or_array, str):
        img = cv2.imread(
            image_path_or_array,
            cv2.IMREAD_COLOR
        )
    else:
        img = image_path_or_array

    if img is None:
        return None

    candidates = make_ocr_ready_candidates(img)

    primary = candidates.get("quality_primary")

    if primary is not None:
        return primary

    return to_grayscale(img)



# ---------------------------------------------------------------------------
# PERFORMANCE PATCH: focused OCR candidate set
# ---------------------------------------------------------------------------
# The full adaptive generator is intentionally retained above.  For the live
# API path we use a smaller evidence set so Tesseract is not run hundreds of
# times per uploaded image.

def generate_variants(image_path: str) -> dict:
    """Generate a focused set of high-value OCR candidates.

    Keeps the quality-aware preprocessing, but avoids the combinatorial
    explosion of legacy variants x 4 rotations x quality variants.
    """
    image = read_image(image_path)
    if image is None:
        return {}

    orientations = {
        "rot0": image,
        "rot90": cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE),
        "rot180": cv2.rotate(image, cv2.ROTATE_180),
        "rot270": cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE),
    }

    variants = {}

    for orientation_name, oriented in orientations.items():
        try:
            candidates = make_ocr_ready_candidates(oriented)
        except Exception:
            candidates = {}

        # Three complementary candidates are enough for the live path:
        # natural/quality image, adaptive threshold, and Otsu.
        for key in ("quality_primary", "quality_adaptive", "quality_otsu"):
            candidate = candidates.get(key)
            if candidate is not None:
                variants[f"{orientation_name}_{key}"] = candidate

    return variants

# ============================================================================
# ULTRA-FAST LIVE OCR OVERRIDE
# ============================================================================
# The previous FAST patch still produced 12 variants (4 rotations x 3
# preprocessings).  For normal mobile package photos this is unnecessary and
# was multiplying Tesseract calls.  The live path now uses only the natural
# orientation.  The existing preprocessing functions remain available for
# debugging/backward compatibility.

def generate_variants(image_path: str) -> dict:
    """Return only the three highest-value live OCR candidates."""
    image = read_image(image_path)
    if image is None:
        return {}

    try:
        candidates = make_ocr_ready_candidates(image)
    except Exception:
        candidates = {}

    variants = {}
    for key in ("quality_primary", "quality_adaptive", "quality_otsu"):
        candidate = candidates.get(key)
        if candidate is not None:
            variants[f"rot0_{key}"] = candidate

    # Guaranteed fallback: one grayscale image if the quality builder fails.
    if not variants:
        gray = to_grayscale(image)
        if gray is not None:
            variants["rot0_gray"] = gray

    return variants
