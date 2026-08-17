import fs from "node:fs";
import path from "node:path";

describe("place-to-mobility handoff contract", () => {
  const helper = fs.readFileSync(path.join(process.cwd(), "lib/mobility/ride-links.ts"), "utf8");
  const journeyButton = fs.readFileSync(path.join(process.cwd(), "components/journey/add-to-journey-button.tsx"), "utf8");

  it("carries destination context without inventing a tariff estate", () => {
    expect(helper).toContain("destinationName");
    expect(helper).toContain("toLat");
    expect(helper).toContain("toLng");
    expect(helper).toContain("estateGeoid");
    expect(helper).toContain("#book");
  });

  it("preserves a mobility handoff when a place is added to My Trip", () => {
    expect(journeyButton).toContain("buildMobilityRideHref");
    expect(journeyButton).toContain('source: "planner"');
    expect(journeyButton).toContain('returnTo: "/planner"');
    expect(journeyButton).toContain("addStopToJourney(journeyStop)");
  });
});
