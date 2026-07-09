from pathlib import Path
import json
import re
import struct
from collections import defaultdict

ROOT = Path(".")
SOURCE_FILES = [
    Path("src/data/generated/homepageImages.ts"),
    Path("src/components/VisitorHome.tsx"),
    Path("src/components/FeaturedIslandPicks.tsx"),
]

image_re = re.compile(r'["\'](/[^"\']+\.(?:jpg|jpeg|png|webp|gif|avif))["\']', re.I)

def read_dims(path: Path):
    data = path.read_bytes()

    # PNG
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        width, height = struct.unpack(">II", data[16:24])
        return width, height, "PNG"

    # GIF
    if data[:6] in (b"GIF87a", b"GIF89a") and len(data) >= 10:
        width, height = struct.unpack("<HH", data[6:10])
        return width, height, "GIF"

    # JPEG
    if data.startswith(b"\xff\xd8"):
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue

            marker = data[i + 1]
            i += 2

            while marker == 0xFF and i < len(data):
                marker = data[i]
                i += 1

            if marker in (0xD8, 0xD9):
                continue

            if i + 2 > len(data):
                break

            segment_len = struct.unpack(">H", data[i:i + 2])[0]
            if segment_len < 2:
                break

            # SOF markers
            if marker in {
                0xC0, 0xC1, 0xC2, 0xC3,
                0xC5, 0xC6, 0xC7,
                0xC9, 0xCA, 0xCB,
                0xCD, 0xCE, 0xCF,
            }:
                if i + 7 <= len(data):
                    height = struct.unpack(">H", data[i + 3:i + 5])[0]
                    width = struct.unpack(">H", data[i + 5:i + 7])[0]
                    return width, height, "JPEG"

            i += segment_len

        return None, None, "JPEG"

    # WEBP
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        chunk = data[12:16]

        # VP8 lossy
        if chunk == b"VP8 " and len(data) >= 30:
            # Frame header starts after 20-byte RIFF/chunk header.
            start = data.find(b"\x9d\x01\x2a")
            if start != -1 and start + 7 < len(data):
                width = struct.unpack("<H", data[start + 3:start + 5])[0] & 0x3FFF
                height = struct.unpack("<H", data[start + 5:start + 7])[0] & 0x3FFF
                return width, height, "WEBP"

        # VP8L lossless
        if chunk == b"VP8L" and len(data) >= 25:
            b0, b1, b2, b3 = data[21], data[22], data[23], data[24]
            width = 1 + (((b1 & 0x3F) << 8) | b0)
            height = 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
            return width, height, "WEBP"

        # VP8X extended
        if chunk == b"VP8X" and len(data) >= 30:
            width = 1 + int.from_bytes(data[24:27], "little")
            height = 1 + int.from_bytes(data[27:30], "little")
            return width, height, "WEBP"

        return None, None, "WEBP"

    if path.suffix.lower() == ".avif":
        return None, None, "AVIF"

    return None, None, path.suffix.lower().lstrip(".").upper()

records = []
seen = set()

for source in SOURCE_FILES:
    if not source.exists():
        continue

    text = source.read_text(errors="ignore")
    for line_no, line in enumerate(text.splitlines(), 1):
        for match in image_re.finditer(line):
            url = match.group(1)
            key = (str(source), line_no, url)
            if key in seen:
                continue
            seen.add(key)

            public_path = ROOT / "public" / url.lstrip("/")
            exists = public_path.exists()

            item = {
                "url": url,
                "source": str(source),
                "line": line_no,
                "publicPath": str(public_path),
                "exists": exists,
                "bytes": None,
                "kb": None,
                "width": None,
                "height": None,
                "format": None,
                "error": None,
            }

            if exists:
                try:
                    item["bytes"] = public_path.stat().st_size
                    item["kb"] = round(item["bytes"] / 1024, 1)
                    width, height, fmt = read_dims(public_path)
                    item["width"] = width
                    item["height"] = height
                    item["format"] = fmt
                except Exception as exc:
                    item["error"] = str(exc)

            records.append(item)

by_url = defaultdict(list)
by_basename = defaultdict(list)

for item in records:
    by_url[item["url"]].append(item)
    by_basename[Path(item["url"]).name].append(item)

missing = [r for r in records if not r["exists"]]
large = [r for r in records if r["bytes"] and r["bytes"] > 500 * 1024]
huge = [r for r in records if r["bytes"] and r["bytes"] > 1024 * 1024]
duplicate_urls = {k: v for k, v in by_url.items() if len(v) > 1}
basename_collisions = {
    k: v for k, v in by_basename.items()
    if len(set(item["url"] for item in v)) > 1
}

report = {
    "summary": {
        "totalReferences": len(records),
        "uniqueUrls": len(by_url),
        "missingCount": len(missing),
        "largeOver500KB": len(large),
        "hugeOver1MB": len(huge),
        "duplicateUrlReferences": len(duplicate_urls),
        "basenameCollisionGroups": len(basename_collisions),
    },
    "records": records,
    "missing": missing,
    "large": large,
    "huge": huge,
    "duplicateUrls": duplicate_urls,
    "basenameCollisions": basename_collisions,
}

Path("reports/homepage-image-audit.json").write_text(json.dumps(report, indent=2))

lines = []
lines.append("# Homepage Image Audit")
lines.append("")
lines.append("## Summary")
for key, value in report["summary"].items():
    lines.append(f"- **{key}**: {value}")

lines.append("")
lines.append("## Missing Images")
if missing:
    for item in missing:
        lines.append(f"- `{item['url']}` used in `{item['source']}:{item['line']}`")
else:
    lines.append("- None")

lines.append("")
lines.append("## Large Images Over 500 KB")
if large:
    for item in sorted(large, key=lambda x: x["bytes"] or 0, reverse=True):
        lines.append(
            f"- `{item['url']}` — {item['kb']} KB, {item['width']}×{item['height']}, used in `{item['source']}:{item['line']}`"
        )
else:
    lines.append("- None")

lines.append("")
lines.append("## Basename Collision Groups")
if basename_collisions:
    for basename, items in basename_collisions.items():
        lines.append(f"- `{basename}`")
        for item in items:
            lines.append(f"  - `{item['url']}` used in `{item['source']}:{item['line']}`")
else:
    lines.append("- None")

lines.append("")
lines.append("## All Image References")
for item in records:
    status = "OK" if item["exists"] else "MISSING"
    size = f"{item['kb']} KB" if item["kb"] is not None else "n/a"
    dims = f"{item['width']}×{item['height']}" if item["width"] else "n/a"
    lines.append(f"- **{status}** `{item['url']}` — {size}, {dims}, `{item['source']}:{item['line']}`")

Path("reports/homepage-image-audit.md").write_text("\n".join(lines) + "\n")

print(json.dumps(report["summary"], indent=2))
print("Wrote reports/homepage-image-audit.json")
print("Wrote reports/homepage-image-audit.md")
