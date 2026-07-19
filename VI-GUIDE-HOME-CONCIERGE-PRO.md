# VI Guide professional homepage and concierge

## Install

```bash
tar -xzf public/vi-guide-home-concierge-pro.tar.gz -C .
rm -rf .next
npm run build
npm run dev
```

## Homepage

- Premium editorial hero and clearer visual hierarchy
- Strong map, official taxi, and accommodations journeys
- Island-specific positioning for St. Thomas, St. John, and St. Croix
- Concierge prompt starters and a connected discovery flow
- Responsive iPad, desktop, and mobile layouts

## Concierge

- Grounds recommendations in the live Firestore Places and Beaches directory
- Ranks directory evidence using the traveler request and selected estate
- Uses the current map, route, party, luggage, and island context
- Produces practical comparisons and realistic itineraries
- Uses a polished conversational interface with starter prompts and multiline input
- Retains safe, reversible estate and mobility actions
- Uses GPT-5.6 Sol by default with an environment-variable override

## Official taxi-system contract

- VI Guide is framed as regulated USVI taxi infrastructure, not dynamic-pricing rideshare.
- The app fare engine remains the only fare-calculation authority.
- The concierge cannot invent, negotiate, discount, surge, or promise rates.
- Taxi associations, authorized drivers, dispatchers, and fleets are first-class operating participants.
- Association, driver, vehicle, accessibility, pickup, and dispatch assignments remain unconfirmed until the operational workflow confirms them.

Authoritative operational references used for this contract:

- Virgin Islands Taxicab Commission: https://dpp.vi.gov/government-agencies/virgin-islands-taxicab-commission/
- USVI Bureau of Motor Vehicles taxi-operator endorsement: https://bmv.vi.gov/drivers-license/

The association/fleet dispatch data model is intentionally not changed by this package because those files were not part of the supplied source archive.
