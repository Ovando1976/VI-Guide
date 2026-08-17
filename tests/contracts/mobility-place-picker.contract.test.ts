import fs from "node:fs";
import path from "node:path";

describe("mobility traveler place search contract", () => {
  const picker = fs.readFileSync(path.join(process.cwd(), "components/mobility-place-picker.tsx"), "utf8");
  const routeFields = fs.readFileSync(path.join(process.cwd(), "components/mobility-route-fields.tsx"), "utf8");

  it("uses geography search but only selects a mapped official estate GEOID", () => {
    expect(picker).toContain("/api/geography/search");
    expect(picker).toContain("relatedEstateGeoids");
    expect(picker).toContain("onChange(mappedGeoid)");
    expect(picker).toContain("fare area needs review");
  });

  it("presents traveler-facing pickup and destination labels", () => {
    expect(routeFields).toContain("> Pickup");
    expect(routeFields).toContain("> Destination");
    expect(routeFields).toContain("Search airport, hotel, beach, ferry");
    expect(routeFields).toContain("Search beach, hotel, town, harbor");
  });
});
