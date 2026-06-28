from pathlib import Path
import json
import numpy as np
import rasterio
from scipy.ndimage import gaussian_filter
from PIL import Image

RAW = Path("data/raw/usvi")
OUT = Path("public/data/splats")
OUT.mkdir(parents=True, exist_ok=True)

ISLANDS = {
    "stt-stj": {
        "dem": RAW / "stt_stj_dem.nc",
        "bbox": [-65.15, 18.17, -64.55, 18.50],
    },
    "stx": {
        "dem": RAW / "stx_dem.nc",
        "bbox": [-64.95, 17.60, -64.50, 17.85],
    },
}

def normalize(arr: np.ndarray) -> np.ndarray:
    arr = np.nan_to_num(arr, nan=0.0)
    lo, hi = np.percentile(arr, [2, 98])
    arr = np.clip((arr - lo) / max(hi - lo, 1e-9), 0, 1)
    return arr

def save_png(arr: np.ndarray, path: Path):
    img = (normalize(arr) * 255).astype(np.uint8)
    Image.fromarray(img, mode="L").save(path)

manifest = {
    "type": "usvi-gaussian-splat-manifest",
    "version": 1,
    "layers": [],
}

for island_id, cfg in ISLANDS.items():
    with rasterio.open(cfg["dem"]) as src:
        dem = src.read(1).astype("float32")
        transform = src.transform
        crs = str(src.crs)

    terrain = gaussian_filter(dem, sigma=3)
    terrain_png = OUT / f"{island_id}-terrain.png"
    save_png(terrain, terrain_png)

    highland = np.where(dem > 50, 1.0, 0.0)
    highland_splat = gaussian_filter(highland, sigma=8)
    highland_png = OUT / f"{island_id}-highland.png"
    save_png(highland_splat, highland_png)

    manifest["layers"].extend([
        {
            "id": f"{island_id}-terrain",
            "island": island_id,
            "kind": "terrain",
            "url": f"/data/splats/{terrain_png.name}",
            "bbox": cfg["bbox"],
            "crs": crs,
        },
        {
            "id": f"{island_id}-highland",
            "island": island_id,
            "kind": "gaussian-splat",
            "url": f"/data/splats/{highland_png.name}",
            "bbox": cfg["bbox"],
            "crs": crs,
        },
    ])

(OUT / "usvi-splat-manifest.json").write_text(json.dumps(manifest, indent=2))
print("Built splat manifest:", OUT / "usvi-splat-manifest.json")