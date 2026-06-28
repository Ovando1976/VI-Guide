from pathlib import Path
import json
import requests
import numpy as np
import rasterio
from scipy.ndimage import gaussian_filter
from PIL import Image

RAW = Path("data/raw/usvi")
OUT = Path("public/data/splats")
RAW.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = {
    "stt-stj": {
        "url": "https://www.ngdc.noaa.gov/thredds/fileServer/regional/st_thomas_st_john_13_mhw_2014.nc",
        "file": RAW / "st_thomas_st_john_13_mhw_2014.nc",
        "bbox": [-65.15, 18.17, -64.55, 18.50],
    },
    "stx": {
        "url": "https://www.ngdc.noaa.gov/thredds/fileServer/regional/st_croix_13_mhw_2014.nc",
        "file": RAW / "st_croix_13_mhw_2014.nc",
        "bbox": [-64.95, 17.60, -64.50, 17.85],
    },
}

def download(url, out):
    if out.exists() and out.stat().st_size > 1000:
        print(f"Using existing {out}")
        return
    print(f"Downloading {url}")
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    out.write_bytes(r.content)
    print(f"Wrote {out}")

def normalize(arr):
    arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
    lo, hi = np.percentile(arr, [2, 98])
    return np.clip((arr - lo) / max(hi - lo, 0.000001), 0, 1)

def save_png(arr, out):
    img = (normalize(arr) * 255).astype(np.uint8)
    Image.fromarray(img, mode="L").save(out)
    print(f"Wrote {out}")

manifest = {
    "type": "usvi-gaussian-splat-manifest",
    "version": 1,
    "layers": [],
}

for island, cfg in SOURCES.items():
    download(cfg["url"], cfg["file"])

    with rasterio.open(cfg["file"]) as src:
        dem = src.read(1).astype("float32")
        crs = str(src.crs)

    terrain = gaussian_filter(dem, sigma=3)
    terrain_out = OUT / f"{island}-terrain.png"
    save_png(terrain, terrain_out)

    highland_mask = np.where(dem > 40, 1.0, 0.0)
    highland = gaussian_filter(highland_mask, sigma=10)
    highland_out = OUT / f"{island}-highland.png"
    save_png(highland, highland_out)

    manifest["layers"].append({
        "id": f"{island}-terrain",
        "kind": "terrain",
        "url": f"/data/splats/{terrain_out.name}",
        "bbox": cfg["bbox"],
        "crs": crs,
    })

    manifest["layers"].append({
        "id": f"{island}-highland",
        "kind": "gaussian-splat",
        "url": f"/data/splats/{highland_out.name}",
        "bbox": cfg["bbox"],
        "crs": crs,
    })

(OUT / "usvi-splat-manifest.json").write_text(json.dumps(manifest, indent=2))
print("Done.")
