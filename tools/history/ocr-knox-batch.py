from pathlib import Path
import json
import subprocess
import sys

if len(sys.argv) < 2:
    raise SystemExit("Usage: python3 tools/history/ocr-knox-batch.py docs/history/knox/ocr-batches/batch-093-102.json")

manifest_path = Path(sys.argv[1])
manifest = json.loads(manifest_path.read_text())

out_dir = Path("docs/history/knox/ocr-text")
out_dir.mkdir(parents=True, exist_ok=True)

range_label = manifest["range"]
out_file = out_dir / f"batch-{range_label}.txt"

parts = []
for image in manifest["images"]:
    image_path = Path(image)
    page = image_path.stem.split("-")[-1]

    result = subprocess.run(
        ["tesseract", str(image_path), "stdout", "--psm", "6"],
        check=False,
        text=True,
        capture_output=True,
    )

    text = result.stdout.strip()
    parts.append(f"\n\n--- PAGE {page} ---\n\n{text}")

out_file.write_text("\n".join(parts))
print(f"Wrote {out_file}")
