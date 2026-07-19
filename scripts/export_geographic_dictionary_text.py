from pathlib import Path
from pypdf import PdfReader

ROOT = Path.cwd()
pdf_path = ROOT / "data" / "Geographic Dictionary of the Virgin Islands.pdf"
out_path = ROOT / "data" / "geographic-dictionary.txt"

reader = PdfReader(str(pdf_path))

chunks = []
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    chunks.append(f"<PARSED TEXT FOR PAGE: {i} / {len(reader.pages)}>\n{text}\n")

out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text("\n".join(chunks), encoding="utf-8")

print(f"Wrote {out_path}")