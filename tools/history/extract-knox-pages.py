from pathlib import Path
from pypdf import PdfReader
import re
import json

PDF = Path("docs/misc_historical_accounting_of_st_thomas_west_indies_1852.pdf")
OUT_TEXT = Path("docs/history/knox/pages-93-264.txt")
OUT_TS = Path("src/data/history/sources/knoxGeneratedPages93To264.ts")

START_PAGE = 93
END_PAGE = 264

def slugify(value: str) -> str:
    value = value.lower().replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:70]

def clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "")
    return text.strip()

def detect_year(text: str):
    match = re.search(r"\b(16\d{2}|17\d{2}|18\d{2}|19\d{2})\b", text)
    return int(match.group(1)) if match else None

def classify_knox_record(text: str) -> str:
    lower = text.lower()

    botanical_markers = [
        "linn.",
        "cav.",
        "d.c.",
        "juss.",
        "rich.",
        "swartz",
        "elliptica",
        "glabratum",
        "macrocarpus",
    ]

    if sum(1 for marker in botanical_markers if marker in lower) >= 2:
        return "botanical_record"

    if "appendix" in lower:
        return "document"

    if "deed" in lower or "landholder" in lower or "plantation" in lower:
        return "document"

    if "governor" in lower or "ordinance" in lower or "law" in lower:
        return "law"

    if "ship" in lower or "vessel" in lower or "harbor" in lower:
        return "navigation"

    if "company" in lower:
        return "company"

    return "event"


def should_index_deed_alias(text: str) -> bool:
    lower = text.lower()
    return any(word in lower for word in ["deed", "deeds", "landholder", "landholders", "plantation boundary", "plantation boundaries"])

def looks_like_noise(text: str) -> bool:
    lower = text.lower()

    botanical_markers = [
        "linn.",
        "cav.",
        "d.c.",
        "juss.",
        "rich.",
        "swartz",
        "elliptica",
        "glabratum",
        "macrocarpus",
    ]

    if sum(1 for marker in botanical_markers if marker in lower) >= 2:
        return True

    if len(re.findall(r"[A-Z][a-z]+[a-z]*,", text)) >= 8:
        return True

    if len(re.findall(r"\b[A-Z][a-z]{3,}\b", text)) > 25 and "st. thomas" not in lower:
        return True

    return False


def split_records(text: str):
    chunks = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text)
    out = []
    current = ""

    for chunk in chunks:
        chunk = clean(chunk)
        if not chunk or looks_like_noise(chunk):
            continue

        if len(current) < 450:
            current = clean(f"{current} {chunk}")
        else:
            if not looks_like_noise(current):
                out.append(current)
            current = chunk

    if current and not looks_like_noise(current):
        out.append(current)

    return [item for item in out if len(item) > 120]

if not PDF.exists():
    raise SystemExit(f"Missing PDF: {PDF}")

reader = PdfReader(str(PDF))

pages = []
for page_num in range(START_PAGE, END_PAGE + 1):
    index = page_num - 1
    if index >= len(reader.pages):
        break

    text = reader.pages[index].extract_text() or ""
    pages.append(f"\n\n--- PAGE {page_num} ---\n\n{text}")

raw_text = "\n".join(pages)
OUT_TEXT.parent.mkdir(parents=True, exist_ok=True)
OUT_TEXT.write_text(raw_text)

records = []
for i, summary in enumerate(split_records(raw_text), 1):
    year = detect_year(summary)
    title_source = summary[:95].rstrip(" ,.;:")
    title = f"{year}: {title_source}" if year else title_source

    records.append({
        "id": f"knox-pages-93-264-{str(i).zfill(4)}-{slugify(title)}",
        "title": title,
        "type": classify_knox_record(summary),
        "year": year,
        "places": ["St. Thomas"],
        "people": [],
        "organizations": [],
        "estates": [],
        "historicSites": [],
        "summary": summary,
        "significance": "Generated from Knox pages 93–264 and queued for historical entity enrichment, estate linking, and source verification.",
        "source": {
            "book": "A Historical Account of St. Thomas, W.I.",
            "author": "John P. Knox",
            "page": "93–264",
            "section": "Generated Knox continuation import",
        },
    })

OUT_TS.write_text(
    "export const knoxGeneratedPages93To264 = "
    + json.dumps(records, indent=2, ensure_ascii=False)
    + ";\n"
)

print(f"PDF pages read: {START_PAGE}-{END_PAGE}")
print(f"Records generated: {len(records)}")
print(f"Wrote {OUT_TEXT}")
print(f"Wrote {OUT_TS}")
