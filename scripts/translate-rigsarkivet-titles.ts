// @ts-nocheck

import { readFileSync, writeFileSync } from "node:fs";

const JSON_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.json";
const TS_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.ts";

function decodeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&aring;", "å")
    .replaceAll("&Aring;", "Å")
    .replaceAll("&aelig;", "æ")
    .replaceAll("&AElig;", "Æ")
    .replaceAll("&oslash;", "ø")
    .replaceAll("&Oslash;", "Ø")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

const phraseReplacements: Array<[RegExp, string]> = [
  [/\bKort over\b/gi, "Map of"],
  [/\bBykort over\b/gi, "Town map of"],
  [/\bFoto af\b/gi, "Photograph of"],
  [/\bTegning af\b/gi, "Drawing of"],
  [/\bSkitse til\b/gi, "Sketch for"],
  [/\bPlan for\b/gi, "Plan for"],
  [/\bPlan til\b/gi, "Plan for"],
  [/\bForslag til\b/gi, "Proposal for"],
  [/\bProjekt til\b/gi, "Project for"],
  [/\bSituationsplan over\b/gi, "Site plan of"],
  [/\bsituationsplan\b/gi, "site plan"],
  [/\bgrundplaner\b/gi, "floor plans"],
  [/\bgrundplan\b/gi, "floor plan"],
  [/\bplaner\b/gi, "plans"],
  [/\bplan\b/gi, "plan"],
  [/\bsnit\b/gi, "section"],
  [/\bsnit og\b/gi, "section and"],
  [/\bfacader\b/gi, "elevations"],
  [/\bfacade\b/gi, "elevation"],
  [/\bblåtryk\b/gi, "blueprint"],
  [/\bTavle med forklaring til\b/gi, "Plate explaining"],
  [/\bTekstdokument\b/gi, "Text document"],
  [/\bOverslag over Udgifter ved\b/gi, "Cost estimate for"],
  [/\bUdgiftsberegning vedrørende\b/gi, "Cost calculation concerning"],
  [/\bAnlæg og Drift af\b/gi, "Construction and operation of"],
  [/\bOpmål[t]?/gi, "Surveyed"],
  [/\btrykt\b/gi, "printed"],
  [/\budsendt\b/gi, "issued"],
  [/\brettet til\b/gi, "corrected to"],
  [/\bkorrigeret\b/gi, "corrected"],
  [/\bUdarbejdet\b/gi, "Prepared"],
  [/\boprindelig trykt\b/gi, "originally printed"],
  [/\bmed nyere tilføjelse\b/gi, "with later addition"],
  [/\bmed tilføjelse\b/gi, "with addition"],
  [/\bmed nyere påtegninger\b/gi, "with later annotations"],
  [/\bindsat er\b/gi, "inset is"],
  [/\bindsat nederst er\b/gi, "inset at bottom is"],
  [/\bdesuden\b/gi, "also"],
  [/\bformentlig\b/gi, "probably"],
  [/\bUdateret\b/gi, "undated"],
  [/\btegnet af\b/gi, "drawn by"],
  [/\btegner uoplyst\b/gi, "draftsman unknown"],
  [/\bTegnerens initialer står til venstre i midten, men er ikke umiddelbart læselige\b/gi, "the draftsman's initials appear at center left but are not immediately legible"],
  [/\bskrevet af\b/gi, "written by"],
  [/\bforfatter uoplyst\b/gi, "author unknown"],
  [/\baf\b/gi, "by"],
];

const placeAndTermReplacements: Array<[RegExp, string]> = [
  [/\bDansk Vestindien\b/gi, "the Danish West Indies"],
  [/\bde britiske Jomfruøer\b/gi, "the British Virgin Islands"],
  [/\bJomfruøer\b/gi, "Virgin Islands"],
  [/\bSt\. Jan\b/gi, "St. John"],
  [/\bSt\. Croix\b/gi, "St. Croix"],
  [/\bSt\. Thomas\b/gi, "St. Thomas"],
  [/\bCharlotte Amalie\b/gi, "Charlotte Amalie"],
  [/\bChristiansted\b/gi, "Christiansted"],
  [/\bFrederiksted\b/gi, "Frederiksted"],
  [/\bCruz Bay\b/gi, "Cruz Bay"],
  [/\bKingshill\b/gi, "Kingshill"],
  [/\bBuck Island\b/gi, "Buck Island"],
  [/\bHassel Island\b/gi, "Hassel Island"],
  [/\bLa Grange\b/gi, "La Grange"],
  [/\bLong Bay\b/gi, "Long Bay"],
  [/\bRoss Estate\b/gi, "Ross Estate"],
  [/\bRichmond\b/gi, "Richmond"],
  [/\bPeter Farm\b/gi, "Peter Farm"],
  [/\bCowell Point\b/gi, "Cowell Point"],
  [/\bKommandantbakken\b/gi, "Government Hill"],
  [/\bChristiansfort\b/gi, "Christian's Fort"],
  [/\bChristiansværn Fort\b/gi, "Fort Christiansværn"],
  [/\bFort Frederiksværn\b/gi, "Fort Frederik"],
  [/\bEmancipation Garden\b/gi, "Emancipation Garden"],
  [/\bNørregade\b/gi, "Nørregade"],
  [/\bDomini Tværgade\b/gi, "Domini Tværgade"],

  [/\bhavn\b/gi, "harbor"],
  [/\bhavnen\b/gi, "the harbor"],
  [/\binderhavnen\b/gi, "inner harbor"],
  [/\bbådehavn\b/gi, "boat harbor"],
  [/\blandtoning\b/gi, "coastal profile"],
  [/\blandtoninger\b/gi, "coastal profiles"],
  [/\blandkending\b/gi, "landfall profile"],
  [/\bindsejlingen\b/gi, "harbor entrance"],
  [/\bnordkysten\b/gi, "north coast"],
  [/\bveje\b/gi, "roads"],
  [/\bvej\b/gi, "road"],
  [/\bgader\b/gi, "streets"],
  [/\bgade\b/gi, "street"],
  [/\bgadeforløb\b/gi, "street alignment"],
  [/\bregulering\b/gi, "regulation"],
  [/\bgaderegulering\b/gi, "street regulation"],
  [/\bvejbro\b/gi, "road bridge"],
  [/\bbro\b/gi, "bridge"],
  [/\blandingsbro\b/gi, "landing pier"],
  [/\bhavnekaj\b/gi, "harbor quay"],
  [/\bhavnepladsen\b/gi, "harbor square"],
  [/\bhavnekontor\b/gi, "harbor office"],
  [/\btoldbod\b/gi, "custom house"],
  [/\blods-/gi, "pilot-"],
  [/\bhavnemyndigheder\b/gi, "harbor authorities"],
  [/\bpost-/gi, "postal-"],
  [/\btold-/gi, "customs-"],

  [/\bkasernen\b/gi, "the barracks"],
  [/\bkaserne\b/gi, "barracks"],
  [/\bgendarmerikasernen\b/gi, "the gendarmerie barracks"],
  [/\bgendarmerikaserne\b/gi, "gendarmerie barracks"],
  [/\bpoliti- og militærstation\b/gi, "police and military station"],
  [/\bofficerskvarterer\b/gi, "officers' quarters"],
  [/\bsalutbatteri\b/gi, "salute battery"],
  [/\bbatterier\b/gi, "batteries"],
  [/\bfyret\b/gi, "the lighthouse"],
  [/\bfyr\b/gi, "lighthouse"],
  [/\blanterne\b/gi, "lantern"],
  [/\bfyrapparatet\b/gi, "lighting apparatus"],
  [/\bfundament\b/gi, "foundation"],
  [/\bventilationsdør\b/gi, "ventilation door"],

  [/\bhospitalet\b/gi, "the hospital"],
  [/\bhospital\b/gi, "hospital"],
  [/\bKommunehospitalet\b/gi, "Municipal Hospital"],
  [/\bsindssyge\b/gi, "mentally ill patients"],
  [/\bveneriske patienter\b/gi, "venereal disease patients"],
  [/\blig- og obduktionsstue\b/gi, "mortuary and autopsy room"],
  [/\blemmestiftelse\b/gi, "poorhouse"],
  [/\blighus\b/gi, "mortuary"],
  [/\bskolebygningen\b/gi, "the school building"],
  [/\bskole\b/gi, "school"],
  [/\bkirke\b/gi, "church"],
  [/\bkirkegård\b/gi, "cemetery"],
  [/\bindgangsbygning\b/gi, "entrance building"],
  [/\bindgangsparti\b/gi, "entrance section"],
  [/\bmur\b/gi, "wall"],

  [/\bkøkkenbygning\b/gi, "kitchen building"],
  [/\bskorsten\b/gi, "chimney"],
  [/\bvaskehus\b/gi, "wash house"],
  [/\bkogehus\b/gi, "cookhouse"],
  [/\bvaskebassin\b/gi, "washing basin"],
  [/\bhestestald\b/gi, "horse stable"],
  [/\bmusikpavillon\b/gi, "bandstand"],
  [/\btorvehal\b/gi, "market hall"],
  [/\båben torvehal\b/gi, "open market hall"],
  [/\bkontorbygning\b/gi, "office building"],
  [/\bguvernementskontorer\b/gi, "government offices"],
  [/\benkebolig\b/gi, "widows' residence"],
  [/\bubekendt bygning\b/gi, "unknown building"],
  [/\bøverste etage\b/gi, "upper floor"],
  [/\bkældergrundplan\b/gi, "basement floor plan"],
  [/\btagbjælkelag\b/gi, "roof beam structure"],
  [/\bjernrækværk\b/gi, "iron railing"],
  [/\btrappe\b/gi, "staircase"],
  [/\bvindeltrappe\b/gi, "spiral staircase"],

  [/\bopfyldning\b/gi, "landfill"],
  [/\budvidelse\b/gi, "expansion"],
  [/\budtørring\b/gi, "drainage"],
  [/\blagunen\b/gi, "the lagoon"],
  [/\bopmudringsfelt\b/gi, "dredging area"],
  [/\buddybninger\b/gi, "deepening works"],
  [/\bbrolægning\b/gi, "paving"],
  [/\bnivellement\b/gi, "leveling survey"],
  [/\bnivellementer\b/gi, "leveling surveys"],
  [/\bnivelleringer\b/gi, "leveling surveys"],
  [/\btværprofiler\b/gi, "cross sections"],
  [/\bprofiler\b/gi, "profiles"],
  [/\brendestene\b/gi, "gutters"],
  [/\bsidetegning\b/gi, "side drawing"],
  [/\bdetailtegninger\b/gi, "detail drawings"],
  [/\bdetailtegning\b/gi, "detail drawing"],
  [/\bmaskintegninger\b/gi, "machine drawings"],
  [/\bflydedok\b/gi, "floating dock"],
  [/\bvandledning\b/gi, "water pipeline"],
  [/\bjernbane\b/gi, "railway"],
  [/\btelegraflinie\b/gi, "telegraph line"],
  [/\btransatlantisk\b/gi, "transatlantic"],
  [/\bforløbet\b/gi, "the route"],
  [/\bsydlige halvdel\b/gi, "southern half"],
  [/\bnordvestligste\b/gi, "northwesternmost part"],
  [/\bøstlige del\b/gi, "eastern part"],
  [/\bvestlige del\b/gi, "western part"],
  [/\bsyd for\b/gi, "south of"],
  [/\bparceller\b/gi, "parcels"],
  [/\bsolgt fra\b/gi, "sold from"],

  [/\bGuineiske kort\b/gi, "Guinean maps"],
  [/\bOversigt over\b/gi, "Overview of"],
  [/\bEgnen omkring\b/gi, "The area around"],
  [/\bVoltaflodens udløb\b/gi, "the mouth of the Volta River"],
  [/\bKongensten\b/gi, "Kongensten"],
];

function cleanupEnglish(value: string) {
  return value
    .replace(/\s+,/g, ",")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/\bMap of the harbor in\b/gi, "Map of the harbor of")
    .replace(/\bMap of the harbor entrance to\b/gi, "Map of the entrance to")
    .replace(/\bMap of St\. Thomas harbor\b/gi, "Map of St. Thomas Harbor")
    .replace(/\bMap of Christiansted Harbor\b/gi, "Map of Christiansted Harbor")
    .replace(/\bMap of Charlotte Amalie\b/gi, "Map of Charlotte Amalie")
    .replace(/\bthe the\b/gi, "the")
    .replace(/\bof of\b/gi, "of")
    .replace(/\s+/g, " ")
    .trim();
}

function translateTitle(value: string) {
  let title = decodeHtml(value);

  for (const [pattern, replacement] of phraseReplacements) {
    title = title.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of placeAndTermReplacements) {
    title = title.replace(pattern, replacement);
  }

  title = cleanupEnglish(title);

  return title;
}

function englishDescription(record: any) {
  const bits = [
    record.yearLabel ? `Date: ${record.yearLabel}.` : "",
    record.creator ? `Creator: ${record.creator}.` : "",
    record.places?.length ? `Places: ${record.places.join(", ")}.` : "",
    record.imageIds?.length ? `Images/pages: ${record.imageIds.length}.` : "",
    record.viewerItemId ? `Rigsarkivet viewer item: ${record.viewerItemId}.` : "",
  ].filter(Boolean);

  return bits.join(" ");
}

const records = JSON.parse(readFileSync(JSON_PATH, "utf8"));

const translated = records.map((record: any) => {
  const originalTitle = decodeHtml(record.originalTitle || record.title);
  const englishTitle = translateTitle(originalTitle);

  return {
    ...record,
    title: originalTitle,
    originalTitle,
    englishTitle,
    displayTitle: englishTitle,
    englishDescription: englishDescription({
      ...record,
      originalTitle,
      englishTitle,
    }),
  };
});

writeFileSync(JSON_PATH, JSON.stringify(translated, null, 2) + "\n");

const ts = `/* Auto-generated archive data. */
/* eslint-disable */

export const rigsarkivetMapsAndDrawings = ${JSON.stringify(translated, null, 2)} as const;

export type RigsarkivetMapAndDrawing = typeof rigsarkivetMapsAndDrawings[number];
`;

writeFileSync(TS_PATH, ts);

console.log(`Translated ${translated.length} Rigsarkivet titles.`);
console.log("\nSample translations:");
for (const record of translated.slice(0, 20)) {
  console.log({
    archiveRef: record.archiveRef,
    originalTitle: record.originalTitle,
    englishTitle: record.englishTitle,
  });
}
