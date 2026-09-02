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