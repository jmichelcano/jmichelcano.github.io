#!/usr/bin/env python3
"""
prep_media.py — get phone photos and videos ready for the website.

What it does to every file you give it:
  * Photos: fixes rotation, shrinks to web size (longest side 1600 px),
    saves as a compressed JPEG, and REMOVES ALL METADATA (GPS location,
    phone model, timestamps).
  * Videos (needs ffmpeg installed): shrinks to 720p H.264 MP4, removes
    audio (unless --keep-audio), strips metadata, and saves a poster image.

Then it prints a ready-to-paste "gallery:" block for the project's .md file.

Usage (run from the site folder):
  python tools/prep_media.py q50-engine-swap  path/to/photos/*.jpg
  python tools/prep_media.py q50-engine-swap  clip.mov --trim 0-45
  python tools/prep_media.py lunar-mushroom-galley video.mp4 --keep-audio

One-time setup:
  pip install pillow pillow-heif        (pillow-heif lets it read iPhone .HEIC)
  ffmpeg: https://ffmpeg.org/download.html  (only needed for videos)
"""
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is missing. Run:  pip install pillow pillow-heif")

try:  # optional: iPhone HEIC support
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff"}
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}
SITE_ROOT = Path(__file__).resolve().parent.parent


def clean_name(stem: str) -> str:
    name = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return name or "file"


def prep_photo(src: Path, out_dir: Path, max_px: int, quality: int) -> Path:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)          # apply phone rotation first
        im = im.convert("RGB")
        im.thumbnail((max_px, max_px), Image.LANCZOS)
        dst = out_dir / f"{clean_name(src.stem)}.jpg"
        # A fresh save with no exif= argument writes zero metadata.
        im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    return dst


def prep_video(src: Path, out_dir: Path, keep_audio: bool, trim: str | None) -> tuple[Path, Path]:
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is not installed, so videos can't be processed. "
                 "Install it from https://ffmpeg.org/download.html")
    stem = clean_name(src.stem)
    dst = out_dir / f"{stem}.mp4"
    poster = out_dir / f"{stem}-poster.jpg"
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if trim:
        start, end = trim.split("-")
        cmd += ["-ss", start, "-to", end]
    cmd += ["-i", str(src),
            "-vf", "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-map_metadata", "-1", "-map_chapters", "-1",
            "-map", "0:v:0"]
    cmd += (["-map", "0:a:0?", "-c:a", "aac", "-b:a", "96k"] if keep_audio else ["-an"])
    cmd.append(str(dst))
    subprocess.run(cmd, check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", str(dst),
                    "-frames:v", "1", "-q:v", "4", str(poster)], check=True)
    return dst, poster


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="project folder name, e.g. q50-engine-swap (same as the .md file name)")
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--max", type=int, default=1600, help="longest photo side in pixels (default 1600)")
    ap.add_argument("--quality", type=int, default=82, help="JPEG quality 1-95 (default 82)")
    ap.add_argument("--keep-audio", action="store_true", help="keep video sound (off by default)")
    ap.add_argument("--trim", help="keep only part of a video, in seconds, e.g. 0-45")
    args = ap.parse_args()

    out_dir = SITE_ROOT / "assets" / "projects" / clean_name(args.project)
    out_dir.mkdir(parents=True, exist_ok=True)

    gallery, videos = [], []
    for f in args.files:
        if not f.exists():
            print(f"  skip (not found): {f}")
            continue
        ext = f.suffix.lower()
        if ext in PHOTO_EXT:
            dst = prep_photo(f, out_dir, args.max, args.quality)
            gallery.append(dst.name)
        elif ext in VIDEO_EXT:
            dst, poster = prep_video(f, out_dir, args.keep_audio, args.trim)
            videos.append((dst.name, poster.name))
        else:
            print(f"  skip (unknown type): {f}")
            continue
        print(f"  {f.name}  ->  {dst.relative_to(SITE_ROOT)}  ({dst.stat().st_size // 1024} KB)")

    print(f"\nDone. Files are in {out_dir.relative_to(SITE_ROOT)}/")
    print("Paste into the project's .md file (between the --- lines) and write the captions:\n")
    if gallery:
        print("gallery:")
        for name in gallery:
            print(f"  - file: {name}\n    caption: \"\"")
    if videos:
        print("videos:")
        for name, poster in videos:
            print(f"  - file: {name}\n    poster: {poster}\n    caption: \"\"")


if __name__ == "__main__":
    main()
