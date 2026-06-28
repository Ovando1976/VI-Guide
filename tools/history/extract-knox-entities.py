from pathlib import Path
import re
import json

SRC_DIR = Path("src/data/history/sources")
OUT = Path("src/data/history/generated/knoxExtractedEntities.ts")

records_text = "\n".join(p.read_text() for p in sorted(SRC_DIR.glob("knoxOcrRecords*.ts")))

def uniq(items):
    seen = set()
    out = []
    for item in items:
        clean = re.sub(r"\s+", " ", item).strip(" ,.;:-")
        key = clean.lower()
        if clean and key not in seen:
            seen.add(key)
            out.append(clean)
    return out

people = uniq(re.findall(r"\b(?:[A-Z][a-zA-Z’.'-]+)\s+(?:[A-Z][a-zA-Z’.'-]+)(?:\s+[A-Z][a-zA-Z’.'-]+)?\b", records_text))

places = uniq([
    name for name in [
        "St. Thomas",
        "St. Croix",
        "St. John",
        "Coral Bay",
        "Creuse Bay",
        "Cruz Bay",
        "Government House",
        "Copenhagen",
        "Christiansted",
        "Charlotte Amalie",
    ]
    if name.lower() in records_text.lower()
])

organizations = uniq([
    name for name in [
        "Royal Council in St. Thomas",
        "Burgher Council in St. Croix",
        "Danish West India Company",
        "Royal Danish West India Company",
        "Moravian Mission",
        "Quarantine Commission",
    ]
    if name.lower() in records_text.lower()
])

entities = {
    "people": [{"id": f"knox-person-{i+1:04d}", "name": name, "source": "Knox OCR"} for i, name in enumerate(people)],
    "places": [{"id": f"knox-place-{i+1:04d}", "name": name, "source": "Knox OCR"} for i, name in enumerate(places)],
    "organizations": [{"id": f"knox-org-{i+1:04d}", "name": name, "source": "Knox OCR"} for i, name in enumerate(organizations)],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "export const knoxExtractedEntities = "
    + json.dumps(entities, indent=2, ensure_ascii=False)
    + ";\n"
)

print("People:", len(entities["people"]))
print("Places:", len(entities["places"]))
print("Organizations:", len(entities["organizations"]))
print("Wrote", OUT)
