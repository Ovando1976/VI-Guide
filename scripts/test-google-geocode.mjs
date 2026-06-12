const key = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;

if (!key) {
  console.error("Missing GOOGLE_MAPS_GEOCODING_API_KEY");
  process.exit(1);
}

const address =
  "Gladys Cafe, Charlotte Amalie, St. Thomas, U.S. Virgin Islands";

const params = new URLSearchParams({
  address,
  key,
  region: "vi",
});

const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;

const res = await fetch(url);
const json = await res.json();

console.log(JSON.stringify(json, null, 2));
