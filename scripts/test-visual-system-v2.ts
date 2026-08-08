import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const layout = source("app/layout.tsx");
const homePage = source("app/page.tsx");
const homeConcierge = source("components/home/home-concierge-hub.tsx");
const homeLiveStatus = source("components/home/home-live-status.tsx");
const mapPage = source("app/map/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const conciergePage = source("app/concierge/page.tsx");
const missionMode = source("components/concierge/mission-mode.tsx");
const communityPage = source("app/community/page.tsx");
const communityPostPage = source("app/community/[postId]/page.tsx");
const experiencesPage = source("app/experiences/page.tsx");
const offersPage = source("app/offers/page.tsx");
const offerDetailPage = source("app/offers/[offerId]/page.tsx");
const savedPage = source("app/saved/page.tsx");
const savedBoard = source("components/place/saved-places-board.tsx");
const savedPlaces = source("lib/saved-places.ts");
const partnersPage = source("app/partners/page.tsx");
const partnerApplyPage = source("app/partners/apply/page.tsx");
const partnerStatusPage = source("app/partners/status/page.tsx");
const plusPage = source("app/plus/page.tsx");
const profileScreen = source("components/profile/traveler-profile-screen.tsx");
const notificationCenter = source("components/notifications/notification-center.tsx");
const loginScreen = source("components/login-screen.tsx");
const offerVisual = source("lib/offers/offer-visual.ts");
const visualLayer = source("app/experience-system.css");
const header = source("components/brand/vi-public-header.tsx");
const navigation = source("components/app-navigation.tsx");
const brand = source("components/brand/vi-brand-mark.tsx");
const mapWorkspace = source("components/explorer/territory-map-workspace.tsx");
const mapStoryRail = source("components/explorer/territory-intelligence-rail.tsx");
const directoryCard = source("components/directory/directory-card.tsx");
const detailShell = source("components/place/premium-detail-shell.tsx");
const placeActionBar = source("components/place/place-action-bar.tsx");

assert.match(layout, /experience-system\.css/);
assert.match(layout, /themeColor: "#032f2d"/);

assert.match(homePage, /QUICK\.map\(\(\{ label, detail, href, image, alt, icon: Icon \}\)/);
assert.match(homePage, /src=\{image\}/);
assert.match(homePage, /alt=\{alt\}/);
assert.match(homeConcierge, /PROMPTS\.map\(\(\{ label, href, image, alt, icon: Icon \}\)/);
assert.match(homeConcierge, /One-tap idea/);
assert.match(homeConcierge, /king-christian-hotel\.jpg/);
assert.match(homeLiveStatus, /STATUS_ITEMS\.map\(\(\{ label, value, icon: Icon, href, image, alt, tag \}\)/);
assert.match(homeLiveStatus, /Today in the Virgin Islands/);
assert.match(homeLiveStatus, /Open in VI Guide/);
assert.match(homeLiveStatus, /red-hook-ferry-terminal-1\.jpg/);
assert.match(homeLiveStatus, /magens-bay-1\.jpg/);

assert.match(mapPage, /ViPublicHeader/);
assert.match(mapPage, /VI Guide Living Map/);
assert.match(mapPage, /connected day/);
assert.match(mapPage, /Open trip/);
assert.match(mapPage, /Ask Concierge/);

assert.match(mapWorkspace, /territory-map-stage/);
assert.match(mapWorkspace, /Explore the island, not a dashboard/);
assert.match(mapWorkspace, /Choose a map lens/);
assert.match(mapWorkspace, /Select a marker to turn the map into a trip decision/);
assert.match(mapWorkspace, /Browse the island by estate/);

assert.match(mapStoryRail, /territory-story-rail/);
assert.match(mapStoryRail, /Local story/);
assert.match(mapStoryRail, /Your movement line/);
assert.match(mapStoryRail, /Nearby island areas/);

assert.match(directoryCard, /directory-story-card/);
assert.match(directoryCard, /VI Guide verified/);
assert.match(directoryCard, /Open the story/);
assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);
assert.match(directoryCard, /savedImage/);
assert.match(directoryCard, /image: savedImage/);

assert.match(detailShell, /place-story-page/);
assert.match(detailShell, /place-story-hero/);
assert.match(detailShell, /PlaceActionBar/);
assert.match(placeActionBar, /place-decision-bar/);
assert.match(placeActionBar, /Decide what happens next/);
assert.match(placeActionBar, /Ask Concierge/);
assert.match(placeActionBar, /Book \/ request/);

assert.match(tripsPage, /Your island story/);
assert.match(tripsPage, /Readiness protected/);
assert.match(tripsPage, /Map connected/);
assert.match(tripsPage, /Concierge aware/);

assert.match(conciergePage, /VI Concierge intelligence/);
assert.match(conciergePage, /Ask once/);
assert.match(conciergePage, /Open Living Map/);
assert.match(conciergePage, /concierge-workspace/);

assert.match(missionMode, /VI Concierge · Mission Mode/);
assert.match(missionMode, /ViPublicHeader/);
assert.match(missionMode, /Nine fast ways into a complete island plan\./);
assert.match(missionMode, /src=\{mission\.image\}/);
assert.match(missionMode, /alt=\{mission\.imageAlt\}/);
assert.match(missionMode, /magens-bay-1\.jpg/);
assert.match(missionMode, /red-hook-ferry-terminal-1\.jpg/);
assert.match(missionMode, /Build my mission/);
assert.match(missionMode, /router\.push\(`\/map\?\$\{params\.toString\(\)\}`\)/);

assert.match(communityPage, /Community · local context/);
assert.match(communityPage, /Know the islands/);
assert.match(communityPage, /Not another feed\. A local intelligence layer\./);
assert.match(communityPage, /href="\/map"/);
assert.match(communityPage, /ISLAND_STORIES\.map/);
assert.match(communityPostPage, /This story is not published yet\./);
assert.match(communityPostPage, /ViPublicHeader/);
assert.match(communityPostPage, /href="\/map"/);

assert.match(experiencesPage, /Tours & experiences · connected booking/);
assert.match(experiencesPage, /ViPublicHeader/);
assert.match(experiencesPage, /EXPERIENCE_IMAGES/);
assert.match(experiencesPage, /src=\{visual\.image\}/);
assert.match(experiencesPage, /alt=\{visual\.alt\}/);
assert.match(experiencesPage, /trunk-bay-overlook-1\.jpg/);
assert.match(experiencesPage, /king-christian-hotel\.jpg/);
assert.match(experiencesPage, /Map island/);
assert.match(experiencesPage, /Plan around this/);
assert.match(experiencesPage, /Request booking/);

assert.match(offersPage, /ViPublicHeader/);
assert.match(offersPage, /Live island packages/);
assert.match(offersPage, /getOfferVisual\(offer\)/);
assert.match(offersPage, /visual\.sourceLabel/);
assert.match(offersPage, /Explore Living Map/);
assert.match(offersPage, /href="\/map"/);
assert.doesNotMatch(offersPage, /href="\/explore"/);
assert.match(offerDetailPage, /getOfferVisual\(offer\)/);
assert.match(offerDetailPage, /The hero is island context, not a merchant-supplied package photo/);
assert.match(offerDetailPage, /Ask Concierge/);
assert.match(offerDetailPage, /See the island/);
assert.match(offerVisual, /ALL_PUBLIC_TRAVEL_KNOWLEDGE/);
assert.match(offerVisual, /source: "listing"/);
assert.match(offerVisual, /source: "island"/);
assert.match(offerVisual, /sourceLabel: "Listing photo"/);

assert.match(savedPage, /Saved places · your shortlist/);
assert.match(savedPage, /ViPublicHeader/);
assert.match(savedPage, /New saves from Explore now carry their image/);
assert.match(savedBoard, /ISLAND_BACKDROPS/);
assert.match(savedBoard, /From Explore/);
assert.match(savedBoard, /Island context/);
assert.match(savedBoard, /place\.image/);
assert.match(savedBoard, /Your shortlist starts with one save\./);
assert.match(savedPlaces, /image\?: string/);
assert.match(savedPlaces, /boundedInternalImage/);
assert.match(savedPlaces, /normalized\.startsWith\("\/\/"\)/);

assert.match(partnersPage, /VI Guide business network/);
assert.match(partnersPage, /ViPublicHeader/);
assert.match(partnersPage, /Put local businesses/);
assert.match(partnersPage, /inside the traveler journey\./);
assert.match(partnersPage, /Apply to join the network/);
assert.match(partnersPage, /Check the public review stage/);
assert.match(partnersPage, /NETWORK_BENEFITS/);
assert.match(partnerApplyPage, /ViPublicHeader/);
assert.match(partnerApplyPage, /actionHref="\/partners\/status"/);
assert.match(partnerApplyPage, /secondaryHref="\/partners"/);
assert.match(partnerStatusPage, /ViPublicHeader/);
assert.match(partnerStatusPage, /actionHref="\/partners\/apply"/);
assert.match(partnerStatusPage, /secondaryHref="\/partners"/);

assert.match(plusPage, /VI Guide Traveler Plus/);
assert.match(plusPage, /ViPublicHeader/);
assert.match(plusPage, /trunk-bay-overlook-1\.jpg/);
assert.match(plusPage, /Put VI Guide/);
assert.match(plusPage, /on your trip team\./);
assert.match(plusPage, /More continuity, not more clutter\./);
assert.match(plusPage, /Join Traveler Plus — \$99\/year/);
assert.match(plusPage, /\/api\/membership\/status/);
assert.match(plusPage, /\/api\/membership\/checkout/);
assert.match(plusPage, /\/api\/membership\/portal/);
assert.match(plusPage, /ALREADY_SUBSCRIBED/);
assert.match(plusPage, /Stripe handles subscription checkout/);

assert.match(profileScreen, /Traveler intelligence profile/);
assert.match(profileScreen, /ViPublicHeader/);
assert.match(profileScreen, /usvi-harbor-hero\.jpg/);
assert.match(profileScreen, /You decide what VI Guide remembers\./);
assert.match(profileScreen, /Memory continuity/);
assert.match(profileScreen, /Concierge aware/);
assert.match(profileScreen, /Trip connected/);
assert.match(profileScreen, /Protection controlled/);
assert.match(profileScreen, /Profile → Concierge/);
assert.match(profileScreen, /replaceIntelligenceMemory\(memoryFromForm\(form, memory\)\)/);
assert.match(profileScreen, /replaceIntelligenceMemory\(\{\}\)/);
assert.match(profileScreen, /memoryFromForm/);
assert.match(profileScreen, /tripMonitoring: form\.tripMonitoring/);
assert.match(profileScreen, /email: form\.emailAlerts/);
assert.match(profileScreen, /notifyOnRecovery: form\.notifyOnRecovery/);

assert.match(notificationCenter, /ViPublicHeader/);
assert.match(notificationCenter, /Private traveler alerts/);
assert.match(notificationCenter, /red-hook-ferry-terminal-1\.jpg/);
assert.match(notificationCenter, /Stay ahead of what changes the trip\./);
assert.match(notificationCenter, /Profile-connected protection/);
assert.match(notificationCenter, /Manage alerts/);
assert.match(notificationCenter, /window\.setInterval/);
assert.match(notificationCenter, /30_000/);
assert.match(notificationCenter, /getIdToken/);
assert.match(notificationCenter, /\/api\/notifications/);
assert.match(notificationCenter, /method: "PATCH"/);
assert.match(notificationCenter, /JSON\.stringify\(\{ read \}\)/);
assert.match(notificationCenter, /markAllRead/);

assert.match(loginScreen, /ViBrandMark/);
assert.match(loginScreen, /usvi-harbor-hero\.jpg/);
assert.match(loginScreen, /Carry your island plans with you\./);
assert.match(loginScreen, /Secure account entry/);
assert.match(loginScreen, /Trips stay connected/);
assert.match(loginScreen, /Private trip alerts/);
assert.match(loginScreen, /GoogleAuthProvider/);
assert.match(loginScreen, /createUserWithEmailAndPassword/);
assert.match(loginScreen, /signInWithEmailAndPassword/);
assert.match(loginScreen, /signInWithPopup/);
assert.match(loginScreen, /getIdToken\(true\)/);
assert.match(loginScreen, /fetch\("\/api\/auth\/session"/);
assert.match(loginScreen, /JSON\.stringify\(\{ idToken \}\)/);
assert.match(loginScreen, /safeInternalDestination\(params\.get\("next"\), window\.location\.origin\)/);
assert.match(loginScreen, /router\.replace/);
assert.match(loginScreen, /hasFirebaseClientConfiguration/);

assert.match(visualLayer, /developer-oriented workflow masthead/);
assert.match(visualLayer, /map-customer-page/);
assert.match(visualLayer, /concierge-product-page/);
assert.match(visualLayer, /territory-map-stage/);
assert.match(visualLayer, /territory-story-rail/);
assert.match(visualLayer, /place-story-hero/);

assert.match(header, /Virgin Islands travel OS/);
assert.match(navigation, /app-nav__item--map/);
assert.match(navigation, /"\/mission"/);
assert.match(navigation, /"\/saved"/);
assert.match(navigation, /"\/today"/);
assert.match(navigation, /"\/trip-planning"/);
assert.match(navigation, /"\/checkout"/);
assert.match(navigation, /"\/shared-trip"/);
assert.match(brand, /vi-brand-mark/);

console.log("VI Guide visible traveler visual-system contracts passed.");