import type { HistoricSite, IslandCode } from "./historicSites";

const source = "National Park Service — Virgin Islands National Register of Historic Places list";

type NrhpSeed = {
  id: string;
  name: string;
  island: IslandCode;
  estate: string;
  listedYear?: number;
  type: string;
  tags: string[];
};

const nrhpSeeds: NrhpSeed[] = [
  { id: "nrhp-stj-annaberg-historic-district", name: "Annaberg Historic District", island: "st_john", estate: "Leinster Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stx-bethlehem-middle-works-historic-district", name: "Bethlehem Middle Works Historic District", island: "st_croix", estate: "Bethlehem", listedYear: 1988, type: "historic-district", tags: ["nrhp", "industrial", "sugar", "st-croix"] },
  { id: "nrhp-stt-bordeaux", name: "Bordeaux", island: "st_thomas", estate: "Bordeaux", listedYear: 1978, type: "historic-site", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stj-brown-bay-plantation-historic-district", name: "Brown Bay Plantation Historic District", island: "st_john", estate: "Brown Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-catherineberg-jockumsdahl-herman-farm", name: "Catherineberg-Jockumsdahl-Herman Farm", island: "st_john", estate: "Catherineberg", listedYear: 1978, type: "plantation-ruins", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stt-charlotte-amalie-historic-district", name: "Charlotte Amalie Historic District", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1976, type: "historic-district", tags: ["nrhp", "urban-history", "st-thomas"] },
  { id: "nrhp-stx-christiansted-historic-district", name: "Christiansted Historic District", island: "st_croix", estate: "Christiansted", listedYear: 1976, type: "historic-district", tags: ["nrhp", "urban-history", "st-croix"] },
  { id: "nrhp-stx-christiansted-national-historic-site", name: "Christiansted National Historic Site", island: "st_croix", estate: "Christiansted", listedYear: 1966, type: "national-historic-site", tags: ["nrhp", "nps", "st-croix"] },
  { id: "nrhp-stj-cinnamon-bay-plantation", name: "Cinnamon Bay Plantation", island: "st_john", estate: "Cinnamon Bay", listedYear: 1978, type: "plantation-ruins", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stx-coakley-bay-estate", name: "Coakley Bay Estate", island: "st_croix", estate: "Coakley Bay", listedYear: 1976, type: "plantation-site", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-columbus-landing-site", name: "Columbus Landing Site", island: "st_croix", estate: "Salt River Bay", listedYear: 1966, type: "archaeological-site", tags: ["nrhp", "salt-river", "st-croix"] },
  { id: "nrhp-stx-danish-west-india-and-guinea-company-warehouse", name: "Danish West India and Guinea Company Warehouse", island: "st_croix", estate: "Christiansted", listedYear: 1974, type: "warehouse", tags: ["nrhp", "danish", "commerce", "st-croix"] },
  { id: "nrhp-stj-dennis-bay-historic-district", name: "Dennis Bay Historic District", island: "st_john", estate: "Dennis Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stx-diamond-school", name: "Diamond School", island: "st_croix", estate: "Diamond", listedYear: 1976, type: "school", tags: ["nrhp", "school", "st-croix"] },
  { id: "nrhp-stj-emmaus-moravian-church-and-manse", name: "Emmaus Moravian Church and Manse", island: "st_john", estate: "Coral Bay", listedYear: 1977, type: "church", tags: ["nrhp", "moravian", "st-john"] },
  { id: "nrhp-stj-enighed", name: "Enighed", island: "st_john", estate: "Cruz Bay", listedYear: 1976, type: "historic-site", tags: ["nrhp", "estate", "st-john"] },
  { id: "nrhp-stj-estate-beverhoudt", name: "Estate Beverhoudt", island: "st_john", estate: "Beverhoudt", listedYear: 1978, type: "plantation-site", tags: ["nrhp", "estate", "st-john"] },
  { id: "nrhp-stt-estate-botany-bay", name: "Estate Botany Bay", island: "st_thomas", estate: "Botany Bay", listedYear: 1976, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stt-estate-brewers-bay", name: "Estate Brewers Bay", island: "st_thomas", estate: "Brewers Bay", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stx-estate-butlers-bay", name: "Estate Butler's Bay", island: "st_croix", estate: "Butler's Bay", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stj-estate-carolina-sugar-plantation", name: "Estate Carolina Sugar Plantation", island: "st_john", estate: "Carolina", listedYear: 1976, type: "plantation-ruins", tags: ["nrhp", "sugar", "st-john"] },
  { id: "nrhp-stx-estate-grove-place", name: "Estate Grove Place", island: "st_croix", estate: "Grove Place", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stt-estate-hafensight", name: "Estate Hafensight", island: "st_thomas", estate: "Havensight", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stx-estate-hogansborg", name: "Estate Hogansborg", island: "st_croix", estate: "Hogansborg", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-judiths-fancy", name: "Estate Judith's Fancy", island: "st_croix", estate: "Judith's Fancy", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-la-reine", name: "Estate La Reine", island: "st_croix", estate: "La Reine", listedYear: 1980, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-little-princess", name: "Estate Little Princess", island: "st_croix", estate: "Little Princess", listedYear: 1980, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-mount-victory", name: "Estate Mount Victory", island: "st_croix", estate: "Mount Victory", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stt-estate-neltjeberg", name: "Estate Neltjeberg", island: "st_thomas", estate: "Neltjeberg", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stt-estate-niesky", name: "Estate Niesky", island: "st_thomas", estate: "Niesky", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stt-estate-perseverance", name: "Estate Perseverance", island: "st_thomas", estate: "Perseverance", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stx-estate-prosperity", name: "Estate Prosperity", island: "st_croix", estate: "Prosperity", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-saint-george-historic-district", name: "Estate Saint George Historic District", island: "st_croix", estate: "Saint George", listedYear: 1986, type: "historic-district", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-estate-st-john", name: "Estate St. John", island: "st_croix", estate: "St. John", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stx-fort-frederick", name: "Fort Frederick", island: "st_croix", estate: "Frederiksted", listedYear: 1996, type: "fort", tags: ["nrhp", "fort", "st-croix"] },
  { id: "nrhp-stj-fortsberg", name: "Fortsberg", island: "st_john", estate: "Coral Bay", listedYear: 1976, type: "fort", tags: ["nrhp", "fort", "st-john"] },
  { id: "nrhp-stx-frederiksted-historic-district", name: "Frederiksted Historic District", island: "st_croix", estate: "Frederiksted", listedYear: 1976, type: "historic-district", tags: ["nrhp", "urban-history", "st-croix"] },
  { id: "nrhp-stx-friedensfeld-midlands-moravian-church-and-manse", name: "Friedensfeld Midlands Moravian Church and Manse", island: "st_croix", estate: "Midlands", listedYear: 1976, type: "church", tags: ["nrhp", "moravian", "st-croix"] },
  { id: "nrhp-stx-friedensthal-mission", name: "Friedensthal Mission", island: "st_croix", estate: "Christiansted", listedYear: 1978, type: "mission", tags: ["nrhp", "moravian", "st-croix"] },
  { id: "nrhp-stx-ft-frederik-of-us-virgin-islands", name: "Ft. Frederik of US Virgin Islands", island: "st_croix", estate: "Frederiksted", listedYear: 1997, type: "fort", tags: ["nrhp", "fort", "st-croix"] },
  { id: "nrhp-stx-green-kay", name: "Green Kay", island: "st_croix", estate: "Christiansted", listedYear: 1976, type: "island", tags: ["nrhp", "archaeology", "st-croix"] },
  { id: "nrhp-stt-hamburg-america-shipping-line-administrative-offices", name: "Hamburg-America Shipping Line Administrative Offices", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1978, type: "historic-building", tags: ["nrhp", "maritime", "commerce", "st-thomas"] },
  { id: "nrhp-stt-hassel-island", name: "Hassel Island", island: "st_thomas", estate: "Hassel Island", listedYear: 1976, type: "historic-district", tags: ["nrhp", "maritime", "military", "st-thomas"] },
  { id: "nrhp-stt-hassel-island-boundary-increase", name: "Hassel Island Historic District (Boundary Increase)", island: "st_thomas", estate: "Hassel Island", listedYear: 1978, type: "historic-district", tags: ["nrhp", "maritime", "military", "st-thomas"] },
  { id: "nrhp-stj-hermitage-plantation-historic-district", name: "Hermitage Plantation Historic District", island: "st_john", estate: "Hurricane Hole", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-jossie-gut-historic-district", name: "Jossie Gut Historic District", island: "st_john", estate: "Reef Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-lesperance-historic-district", name: "L'Esperance Historic District", island: "st_john", estate: "Reef Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stx-la-grande-princesse-school", name: "La Grande Princesse School", island: "st_croix", estate: "La Grande Princesse", listedYear: 1976, type: "school", tags: ["nrhp", "school", "st-croix"] },
  { id: "nrhp-stj-lameshur-plantation", name: "Lameshur Plantation", island: "st_john", estate: "Lameshur", listedYear: 1978, type: "plantation-ruins", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-liever-marches-bay-historic-district", name: "Liever Marches Bay Historic District", island: "st_john", estate: "Brown Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-lind-point-fort", name: "Lind Point Fort", island: "st_john", estate: "Cruz Bay", listedYear: 1981, type: "fort", tags: ["nrhp", "fort", "st-john"] },
  { id: "nrhp-stx-little-la-grange", name: "Little La Grange", island: "st_croix", estate: "Little La Grange", listedYear: 1976, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stt-mafolie-great-house", name: "Mafolie Great House", island: "st_thomas", estate: "Mafolie", listedYear: 1978, type: "great-house", tags: ["nrhp", "great-house", "st-thomas"] },
  { id: "nrhp-stj-mary-point-estate", name: "Mary Point Estate", island: "st_john", estate: "Mary Point", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-john"] },
  { id: "nrhp-stj-more-hill-historic-district", name: "More Hill Historic District", island: "st_john", estate: "East End", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stt-new-herrnhut-moravian-church", name: "New Herrnhut Moravian Church", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1976, type: "church", tags: ["nrhp", "moravian", "st-thomas"] },
  { id: "nrhp-stj-reef-bay-great-house-historic-district", name: "Reef Bay Great House Historic District", island: "st_john", estate: "Reef Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stj-reef-bay-sugar-factory-historic-district", name: "Reef Bay Sugar Factory Historic District", island: "st_john", estate: "Reef Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "sugar", "st-john"] },
  { id: "nrhp-stx-richmond-prison-detention-and-workhouse", name: "Richmond Prison Detention and Workhouse", island: "st_croix", estate: "Richmond", listedYear: 1978, type: "prison", tags: ["nrhp", "institutional", "st-croix"] },
  { id: "nrhp-stj-rustenberg-plantation-south-historic-district", name: "Rustenberg Plantation South Historic District", island: "st_john", estate: "Cinnamon Bay", listedYear: 1981, type: "historic-district", tags: ["nrhp", "plantation", "st-john"] },
  { id: "nrhp-stx-sion-hill", name: "Sion Hill", island: "st_croix", estate: "Sion Hill", listedYear: 1976, type: "estate", tags: ["nrhp", "estate", "st-croix"] },
  { id: "nrhp-stt-skytsborg", name: "Skytsborg", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1991, type: "tower", tags: ["nrhp", "tower", "st-thomas"] },
  { id: "nrhp-stx-slob-historic-district", name: "Slob Historic District", island: "st_croix", estate: "Christiansted", listedYear: 1987, type: "historic-district", tags: ["nrhp", "district", "st-croix"] },
  { id: "nrhp-stt-st-thomas-synagogue", name: "St. Thomas Synagogue", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1997, type: "synagogue", tags: ["nrhp", "synagogue", "jewish-history", "st-thomas"] },
  { id: "nrhp-stt-st-thomas-synagogue-beracha", name: "St. Thomas Synagogue--Beracha Veshalom Vegemiluth Hasadim", island: "st_thomas", estate: "Charlotte Amalie", listedYear: 1997, type: "synagogue", tags: ["nrhp", "synagogue", "jewish-history", "st-thomas"] },
  { id: "nrhp-stx-strawberry-hill-historic-district", name: "Strawberry Hill Historic District", island: "st_croix", estate: "Strawberry Hill", listedYear: 1987, type: "historic-district", tags: ["nrhp", "district", "st-croix"] },
  { id: "nrhp-stj-trunk-bay-sugar-factory", name: "Trunk Bay Sugar Factory", island: "st_john", estate: "Trunk Bay", listedYear: 1981, type: "sugar-factory", tags: ["nrhp", "sugar", "st-john"] },
  { id: "nrhp-stt-tutu-plantation-house", name: "Tutu Plantation House", island: "st_thomas", estate: "Tutu", listedYear: 1976, type: "plantation-house", tags: ["nrhp", "plantation", "st-thomas"] },
  { id: "nrhp-stt-venus-hill", name: "Venus Hill", island: "st_thomas", estate: "Venus Hill", listedYear: 1978, type: "estate", tags: ["nrhp", "estate", "st-thomas"] },
  { id: "nrhp-stx-whim", name: "Whim", island: "st_croix", estate: "Whim", listedYear: 1976, type: "plantation-museum", tags: ["nrhp", "plantation", "museum", "st-croix"] },
];

export const expandedNationalRegisterHistoricSites: HistoricSite[] = nrhpSeeds.map((site) => ({
  id: site.id,
  name: site.name,
  island: site.island,
  type: site.type,
  category: "historic",
  estate: site.estate,
  description: `${site.name} is listed in the National Register of Historic Places for the U.S. Virgin Islands.`,
  history: site.listedYear
    ? `National Register of Historic Places listing year: ${site.listedYear}.`
    : "National Register of Historic Places listing; details should be reviewed against the official nomination record.",
  significance: "Official National Register historic resource; enrich with nomination text, coordinates, images, and local interpretation.",
  coordinates: null,
  imageUrl: `/images/historicSite/${site.id}.jpg`,
  coverImage: `/images/historicSite/${site.id}.jpg`,
  thumbnailUrl: `/images/historicSite/${site.id}.jpg`,
  relatedEstates: site.estate ? [site.estate] : [],
  relatedArchives: ["National Register of Historic Places", "National Park Service"],
  tags: site.tags,
  source,
}));
