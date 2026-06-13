from pathlib import Path

from PIL import Image


BASE_DIR = Path(__file__).parent / "assets" / "dori"
NAMES = ["detection", "observation", "recognition", "identification"]
SIZE = (320, 180)


def main():
    for name in NAMES:
        source = BASE_DIR / f"{name}.png"
        target = BASE_DIR / f"{name}-thumb.webp"

        image = Image.open(source).convert("RGB")
        image.thumbnail(SIZE, Image.Resampling.LANCZOS)

        canvas = Image.new("RGB", SIZE, (245, 248, 250))
        x = (SIZE[0] - image.width) // 2
        y = (SIZE[1] - image.height) // 2
        canvas.paste(image, (x, y))
        canvas.save(target, "WEBP", quality=72, method=6)

        print(f"{source.name}: {source.stat().st_size} -> {target.name}: {target.stat().st_size}")


if __name__ == "__main__":
    main()
