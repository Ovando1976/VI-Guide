from pathlib import Path
import re
import json
import sys

if len(sys.argv) < 2:
    raise SystemExit("Usage: python3 tools/history/build-knox-records-from-ocr.py docs/history/knox/ocr-text/batch-093-102.txt")

src = Path(sys.argv[1])
text = src.read_text()

range_label = src.stem.replace("batch-", "")
export_name = "knoxOcrRecords" + range_label.replace("-", "To")
out = Path(f"src/data/history/sources/knoxOcrRecords{range_label.replace('-', 'To')}.ts")

def clean(value: str) -> str:
    value = value or ""
    value = re.sub(r"\bA HISTORICAL ACCOUNT OF\b", " ", value, flags=re.I)
    value = re.sub(r"\bST\.?\s+THOMAS,\s+W\.?\s*I\.?\b", " ", value, flags=re.I)
    value = re.sub(r"\bIN\s+ST\.?\s+THOMAS,\s+W\.?\s*I\.?\b", " ", value, flags=re.I)
    value = re.sub(r"\bSLAVERY\s+IN\s+THE\s+DANISH\s+ISLANDS\.?\b", " ", value, flags=re.I)
    value = re.sub(r"^\s*\d{1,3}\s+", " ", value)
    value = re.sub(r"^\s*[A-Z]{1,4}\s*\d{1,3}\s+", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def slugify(value: str) -> str:
    value = value.lower().replace("’", "").replace("'", "")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:72]

def detect_year(value: str):
    m = re.search(r"\b(16\d{2}|17\d{2}|18\d{2}|19\d{2})\b", value)
    return int(m.group(1)) if m else None

def title_clean(value: str) -> str:
    value = clean(value)
    value = re.sub(r"^(IN|OF)\s*\.\s*\d{1,3}\s+", "", value, flags=re.I)
    value = re.sub(r"^\d{1,3}\s+", "", value)
    value = re.sub(r"^\.\s*", "", value)
    value = re.sub(r"^(tirely|wards|ment|tion|ing|ed|ly)\b[\s\-.,;:]*", "", value, flags=re.I)
    return clean(value)

def smart_title(summary: str, year):
    lower = summary.lower()

    if "names of colonists" in lower and "1678" in lower:
        return "1678: Appendix A lists St. Thomas colonists and estate holders"

    if "government house" in lower and "guard" in lower:
        return "Government House guard and colonial security in St. Thomas"

    if "free port" in lower:
        return "St. Thomas declared a free port"

    if "creuse bay" in lower and "ferry" in lower:
        return "Creuse Bay storehouse and ferry established"

    if "christian vii" in lower or "christian viii" in lower or "christian viil" in lower:
        return f"{year}: Danish royal policy toward the Virgin Islands" if year else "Danish royal policy toward the Virgin Islands"

    if "all agreements contrary" in lower or "labor act" in lower:
        return "1849: Labor regulations after emancipation"

    title = title_clean(summary[:140]).rstrip(" ,.;:")
    return f"{year}: {title}" if year else title

def classify(value: str) -> str:
    lower = value.lower()
    if "free port" in lower or "port" in lower or "harbor" in lower:
        return "navigation"
    if "tax" in lower or "duties" in lower or "treasury" in lower:
        return "economic_shift"
    if "governor" in lower or "governor-general" in lower or "commandant" in lower:
        return "government"
    if "slaves" in lower or "slave" in lower:
        return "labor"
    if "commerce" in lower or "trade" in lower or "merchants" in lower:
        return "industry"
    if "appendix" in lower:
        return "document"
    return "event"

def detect_places(value: str):
    places = []
    candidates = [
        "St. Thomas",
        "St. Croix",
        "St. John",
        "Coral Bay",
        "Creuse Bay",
        "Cruz Bay",
        "Copenhagen",
        "Denmark",
        "Norway",
        "Sleswick",
        "Government House",
    ]
    lower = value.lower()
    for place in candidates:
        if place.lower() in lower and place not in places:
            places.append(place)
    return places or ["St. Thomas"]

def detect_people(value: str):
    people = []
    candidates = [
        "Abbé Raynal",
        "Harrien Felchenhauer",
        "Christian Suehm",
        "John George von John",
        "Peter von Gunthelberg",
        "Frederik V",
        "Christian VII",
        "Christian VIII",
        "Peter Clausen",
    ]
    lower = value.lower()
    for person in candidates:
        if person.lower() in lower and person not in people:
            people.append(person)
    return people

def detect_orgs(value: str):
    orgs = []
    lower = value.lower()
    if "royal council" in lower:
        orgs.append("Royal Council in St. Thomas")
    if "burgher council" in lower:
        orgs.append("Burgher Council in St. Croix")
    return orgs

def split_into_records(value: str):
    pages = re.split(r"\n--- PAGE\s+(\d+)\s+---\n", value)
    records = []

    for i in range(1, len(pages), 2):
        page = pages[i]
        body = clean(pages[i + 1])

        paragraphs = re.split(r"(?<=[.!?])\s+(?=[A-Z])", body)
        current = ""

        for para in paragraphs:
            para = clean(para)
            if not para:
                continue

            if len(current) < 650:
                current = clean(f"{current} {para}")
            else:
                records.append((page, current))
                current = para

        if current:
            records.append((page, current))

    return [(p, r) for p, r in records if len(r) > 180]

records = []
for i, (page, summary) in enumerate(split_into_records(text), 1):
    year = detect_year(summary)
    title = smart_title(summary, year)

    records.append({
        "id": f"knox-ocr-{range_label}-{str(i).zfill(3)}-{slugify(title)}",
        "title": title,
        "type": classify(summary),
        "year": year,
        "places": detect_places(summary),
        "people": detect_people(summary),
        "organizations": detect_orgs(summary),
        "estates": [],
        "historicSites": [],
        "summary": summary,
        "significance": "Extracted from OCR of John P. Knox's A Historical Account of St. Thomas, W.I. and prepared for VI Guide historical search, timelines, estate intelligence, and source-linked research.",
        "source": {
            "book": "A Historical Account of St. Thomas, W.I.",
            "author": "John P. Knox",
            "page": page,
            "section": f"OCR batch {range_label}",
        },
    })

out.write_text(
    f"export const {export_name} = "
    + json.dumps(records, indent=2, ensure_ascii=False)
    + ";\n"
)

print(f"Generated {len(records)} records")
print(f"Wrote {out}")
print(f"Export: {export_name}")
