"""Bouwt launcher-iconen en splash-bitmaps vanuit het officiële logo."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "assets", "branding", "pim-pam-pet-logo.png")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
PREVIEW = os.path.join(ROOT, "assets", "branding", "samsung-circle-preview.png")

# Adaptive safe zone is 66/108. Logo + glow blijven binnen die cirkel.
FOREGROUND_SCALE = 0.62
LEGACY_ROUND_SCALE = 0.86

MIPMAP = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

SPLASH = {
    "drawable": (480, 320),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}


def neon_background(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    cx = (w - 1) / 2
    cy = (h - 1) / 2
    sx = w / 2
    sy = h / 2
    for y in range(h):
        ny = (y - cy) / sy
        for x in range(w):
            nx = (x - cx) / sx
            falloff = max(0.0, 1 - (nx * nx + ny * ny) * 0.55)
            mag = max(0.0, -nx) * 0.55 * falloff
            cyn = max(0.0, nx) * 0.5 * falloff
            r = min(255, int(18 + mag * 170 + cyn * 16))
            g = min(255, int(8 + cyn * 150 + mag * 18))
            b = min(255, int(24 + mag * 110 + cyn * 190))
            px[x, y] = (r, g, b)
    return img


def fit_logo(logo, box):
    side = max(1, int(round(box)))
    return logo.resize((side, side), Image.Resampling.LANCZOS)


def paste_center(base, sprite):
    x = (base.width - sprite.width) // 2
    y = (base.height - sprite.height) // 2
    if base.mode != "RGBA":
        base = base.convert("RGBA")
    base.paste(sprite, (x, y), sprite)
    return base


def main():
    logo = Image.open(SRC).convert("RGBA")
    os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)

    bg432 = neon_background(432, 432)
    bg_dir = os.path.join(RES, "drawable-nodpi")
    os.makedirs(bg_dir, exist_ok=True)
    bg432.save(os.path.join(bg_dir, "ic_launcher_background.png"), "PNG")

    for density, (legacy, foreground) in MIPMAP.items():
        folder = os.path.join(RES, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)
        full = logo.resize((legacy, legacy), Image.Resampling.LANCZOS)
        full.save(os.path.join(folder, "ic_launcher.png"), "PNG")

        round_base = neon_background(legacy, legacy).convert("RGBA")
        round_logo = fit_logo(logo, legacy * LEGACY_ROUND_SCALE)
        round_icon = paste_center(round_base, round_logo)
        mask = Image.new("L", (legacy, legacy), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, legacy - 1, legacy - 1), fill=255)
        round_icon.putalpha(mask)
        round_icon.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")

        fg = Image.new("RGBA", (foreground, foreground), (0, 0, 0, 0))
        fg_logo = fit_logo(logo, foreground * FOREGROUND_SCALE)
        paste_center(fg, fg_logo).save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")

    for folder, (w, h) in SPLASH.items():
        path = os.path.join(RES, folder)
        os.makedirs(path, exist_ok=True)
        canvas = neon_background(w, h).convert("RGBA")
        mark = fit_logo(logo, min(w, h) * 0.46)
        paste_center(canvas, mark).convert("RGB").save(os.path.join(path, "splash.png"), "PNG")

    # Samsung-achtige cirkeluitsnede van het adaptive icoon (xxxhdpi).
    fg = Image.open(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_foreground.png")).convert("RGBA")
    composed = paste_center(bg432.convert("RGBA"), fg)
    circle = Image.new("L", composed.size, 0)
    ImageDraw.Draw(circle).ellipse((0, 0, composed.width - 1, composed.height - 1), fill=255)
    composed.putalpha(circle)
    sheet = Image.new("RGBA", (composed.width, composed.height), (20, 20, 24, 255))
    sheet.paste(composed, (0, 0), composed)
    sheet.save(PREVIEW, "PNG")
    print("OK: icons, splash, preview")


if __name__ == "__main__":
    main()
