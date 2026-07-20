from pathlib import Path
import re


path = Path("components/estate-map.tsx")
if not path.exists():
    raise SystemExit("Run this from the project root; components/estate-map.tsx was not found.")

text = path.read_text()

if 'name={`estate-hit-${estate.geoid}`}' not in text:
    if 'name="territory-vectors"' in text:
        print("The iPad map fix is already installed.")
        raise SystemExit(0)
    raise SystemExit("This EstateMap version is not recognized; no files were changed.")

text = text.replace(
    "  const [showEstateLabels, setShowEstateLabels] = useState(true);",
    '''  const [showEstateLabels, setShowEstateLabels] = useState(false);

  const constrainedTouchDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;

    const looksLikeIPad =
      /iPad/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    return looksLikeIPad || (deviceMemory !== undefined && deviceMemory <= 4);
  }, []);''',
)

text = text.replace(
    '''          doubleClickZoom={false}
        >''',
    '''          doubleClickZoom={false}
          zoomAnimation={!constrainedTouchDevice}
          fadeAnimation={!constrainedTouchDevice}
          markerZoomAnimation={!constrainedTouchDevice}
          inertia={!constrainedTouchDevice}
        >''',
)

text = text.replace(
    '''          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <Pane name="demand-glow" style={{ zIndex: 350 }} />
          <Pane name="estate-polygons" style={{ zIndex: 400 }} />
          <Pane name="places" style={{ zIndex: 500 }} />
          <Pane name="drivers" style={{ zIndex: 550 }} />
          <Pane name="route-glow" style={{ zIndex: 600 }} />
          <Pane name="route-core" style={{ zIndex: 650 }} />''',
    '''          <Pane name="territory-vectors" style={{ zIndex: 400 }} />
          <Pane name="drivers" style={{ zIndex: 550 }} />
          <Pane name="route" style={{ zIndex: 650 }} />''',
)

for style in ("dark_all", "light_all"):
    text = text.replace(
        f'''                url="https://{{s}}.basemaps.cartocdn.com/{style}/{{z}}/{{x}}/{{y}}{{r}}.png"
              />''',
        f'''                url="https://{{s}}.basemaps.cartocdn.com/{style}/{{z}}/{{x}}/{{y}}{{r}}.png"
                updateWhenIdle
                updateWhenZooming={{false}}
                keepBuffer={{1}}
              />''',
    )

text = text.replace(
    "\n            const focusEstate = () => onSelectEstate(estate);\n", ""
)

text = re.sub(
    r'''              <Pane key=\{estate\.geoid\} name=\{`estate-hit-\$\{estate\.geoid\}`\}>\n'''
    r'''[\s\S]*?'''
    r'''                <Polygon\n                  pane="estate-polygons"''',
    '''              <Polygon
                key={estate.geoid}
                pane="territory-vectors"''',
    text,
    count=1,
)

text = text.replace("click: focusEstate,", "click: () => onSelectEstate(estate),")
text = re.sub(
    r'''\n                    mouseover: \(e\) => \{[\s\S]*?\n                    \},\n                    mouseout: \(e\) => \{[\s\S]*?\n                    \},''',
    "",
    text,
    count=1,
)
text = text.replace(
    '''                </Polygon>
              </Pane>''',
    '''              </Polygon>''',
    1,
)

text = text.replace("{showEstateLabels ? (", "{showEstateLabels || isSelected ? (")
text = text.replace(
    "sticky={!isSelected}", "sticky={!isSelected && !constrainedTouchDevice}"
)
text = text.replace('pane="places"', 'pane="territory-vectors"')
text = text.replace('pane="route-glow"', 'pane="route"')
text = text.replace('pane="route-core"', 'pane="route"')
text = text.replace('pane="demand-glow"', 'pane="territory-vectors"')

text = text.replace(
    '''            routeFocusNonce={routeFocusNonce}
          />''',
    '''            routeFocusNonce={routeFocusNonce}
            animate={!constrainedTouchDevice}
          />''',
)
text = text.replace(
    '''  routeFocusNonce,
}: {
  island: IslandCode;''',
    '''  routeFocusNonce,
  animate,
}: {
  island: IslandCode;''',
)
text = text.replace(
    '''  routeFocusNonce: number;
}) {''',
    '''  routeFocusNonce: number;
  animate: boolean;
}) {''',
)
text = text.replace("animate: true,", "animate,")
text = text.replace(
    "}, [island, islandBounds, map]);", "}, [animate, island, islandBounds, map]);"
)
text = text.replace(
    "}, [map, selectedEstateBounds, routeLatLngs, routeFocusNonce]);",
    "}, [animate, map, selectedEstateBounds, routeLatLngs, routeFocusNonce]);",
)

checks = {
    "estate-specific panes remain": 'name={`estate-hit-${estate.geoid}`}' not in text,
    "shared renderer missing": 'name="territory-vectors"' in text,
    "dark basemap is still duplicated": text.count("dark_all/{z}/{x}/{y}{r}.png") == 1,
    "iPad animation guard missing": "zoomAnimation={!constrainedTouchDevice}" in text,
}
failed = [message for message, passed in checks.items() if not passed]
if failed:
    raise SystemExit("Patch validation failed: " + "; ".join(failed))

path.write_text(text)
print("Installed the iPad Safari map stability fix in components/estate-map.tsx")
