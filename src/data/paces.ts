import stThomasRestaurants from "./restaurants-st-thomas.json";
import stJohnRestaurants from "./restaurants-st-john.json";
import stCroixRestaurants from "./restaurants-st-croix.json";
import waterIslandRestaurants from "./restaurants-water-island.json";
import attractions from "./attractions.json";
import transportation from "./transportation.json";
import ferryTerminals from "./ferry-terminals.json";
import cruisePorts from "./cruise-ports.json";
import shopping from "./shopping.json";
import nightlife from "./nightlife.json";
import hikingTrails from "./hiking-trails.json";
import historicSites from "./historic-sites.json";

export const PLACES = [
  ...stThomasRestaurants,
  ...stJohnRestaurants,
  ...stCroixRestaurants,
  ...waterIslandRestaurants,
  ...attractions,
  ...transportation,
  ...ferryTerminals,
  ...cruisePorts,
  ...shopping,
  ...nightlife,
  ...hikingTrails,
  ...historicSites,
];

export default PLACES;
