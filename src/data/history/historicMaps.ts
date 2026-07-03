import type { IslandCode } from "../../types";

export type HistoricMapStatus =
  | "identified"
  | "needs-image"
  | "downloaded"
  | "needs-georeference"
  | "ready";

export type HistoricMapRecord = {
  id: string;
  archiveCode?: string;
  title: string;
  shortTitle: string;
  island: IslandCode | "all";
  yearLabel: string;
  dateStart?: number;
  dateEnd?: number;
  archive: "Rigsarkivet" | "Royal Danish Library" | "NARA" | "Local archive" | "Other";
  collection: string;
  creator?: string;
  description: string;
  evidenceUse: string[];
  status: HistoricMapStatus;
  sourceUrl?: string;
  viewerUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  aoImageId?: string;
  bsid?: string;
  tags: string[];
  notes?: string;
};

export const historicMapRecords: HistoricMapRecord[] = [
  {
    "id": "337-8-kort-over-st-croix-1898-tegnet-af-e-e",
    "archiveCode": "337 8",
    "title": "Kort over St. Croix 1898, tegnet af E. E.",
    "shortTitle": "St. Croix 1898",
    "island": "st_croix",
    "yearLabel": "1898",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "E. E.",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282887",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282887",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-8",
      "st_croix",
      "1898"
    ],
    "bsid": "282887",
    "aoImageId": "55098907",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098907"
  },
  {
    "id": "337-10-bykort-over-christiansted-p-aring-st-croix-1856-tegnet-af-christian-ludvig-schellerup",
    "archiveCode": "337 10",
    "title": "Bykort over Christiansted på St. Croix 1856, tegnet af Christian Ludvig Schellerup",
    "shortTitle": "Christiansted på St. Croix 1856",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Ludvig Schellerup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Town plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282889",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282889",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-10",
      "st_croix",
      "1856"
    ],
    "bsid": "282889",
    "aoImageId": "55098909",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098909"
  },
  {
    "id": "337-11-bykort-over-frederiksted-p-aring-st-croix-1863-tegner-uoplyst",
    "archiveCode": "337 11",
    "title": "Bykort over Frederiksted på St. Croix 1863, tegner uoplyst",
    "shortTitle": "Frederiksted på St. Croix 1863",
    "island": "st_croix",
    "yearLabel": "1863",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Town plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282890",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282890",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-11",
      "st_croix",
      "1863"
    ],
    "bsid": "282890",
    "aoImageId": "55098910",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098910"
  },
  {
    "id": "337-12-bykort-over-frederiksted-p-aring-st-croix-1856-christian-ludvig-schellerup",
    "archiveCode": "337 12",
    "title": "Bykort over Frederiksted på St. Croix 1856, Christian Ludvig Schellerup",
    "shortTitle": "Frederiksted på St. Croix 1856, Christian Ludvig Schellerup",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Town plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282891",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282891",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-12",
      "st_croix",
      "1856"
    ],
    "bsid": "282891",
    "aoImageId": "55098911",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098911"
  },
  {
    "id": "337-16-kort-over-st-thomas-havn-indsat-nederst-er-landtoning-af-indsejlingen-opm-aring-lt-1851-trykt-1853-tegnet-af-g-b-lawranc",
    "archiveCode": "337 16",
    "title": "Kort over St. Thomas havn, indsat nederst er landtoning af indsejlingen Opmålt 1851, trykt 1853, tegnet af G. B. Lawrance",
    "shortTitle": "St. Thomas havn, indsat nederst er landtoning af indsejlingen Opmålt 1851, trykt 1853",
    "island": "st_thomas",
    "yearLabel": "1851–1853",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "G. B. Lawrance",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282895",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282895",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-16",
      "st_thomas",
      "1851-1853"
    ],
    "bsid": "282895",
    "aoImageId": "55098915",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098915"
  },
  {
    "id": "337-17-kort-over-st-thomas-by-1871-tegnet-af-th-thorsen",
    "archiveCode": "337 17",
    "title": "Kort over St. Thomas by 1871, tegnet af Th. Thorsen",
    "shortTitle": "St. Thomas by 1871",
    "island": "st_thomas",
    "yearLabel": "1871",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Th. Thorsen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282896",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282896",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-17",
      "st_thomas",
      "1871"
    ],
    "bsid": "282896",
    "aoImageId": "55098916",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098916"
  },
  {
    "id": "337-33-kort-over-dansk-vestindien-puerto-rico-og-de-britiske-jomfru-oslash-er-indsat-er-kort-over-st-thomas-havn-1849-rettet-ti",
    "archiveCode": "337 33",
    "title": "Kort over Dansk Vestindien, Puerto Rico og de britiske Jomfruøer, indsat er kort over St. Thomas havn 1849, rettet til 1894, tegner uoplyst",
    "shortTitle": "Dansk Vestindien, Puerto Rico og de britiske Jomfruøer, indsat er kort over St. Th...",
    "island": "st_thomas",
    "yearLabel": "1849–1894",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282910",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282910",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-33",
      "st_thomas",
      "1849-1894"
    ],
    "bsid": "282910",
    "aoImageId": "55098930",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098930"
  },
  {
    "id": "337-34-kort-over-st-thomas-havn-indsat-nederst-er-landtoning-af-indsejlingen-opm-aring-lt-1851-korrigeret-1864-og-1873-og-1875-",
    "archiveCode": "337 34",
    "title": "Kort over St. Thomas havn, indsat nederst er landtoning af indsejlingen Opmålt 1851, korrigeret 1864 og 1873 og 1875 og 1885, tegnet af G. B. Lawrance (1851) og Nares (1873)",
    "shortTitle": "St. Thomas havn, indsat nederst er landtoning af indsejlingen Opmålt 1851, korriger...",
    "island": "st_thomas",
    "yearLabel": "1851–1885",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "G. B. Lawrance (1851) og Nares (1873)",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282911",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282911",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-34",
      "st_thomas",
      "1851-1885"
    ],
    "bsid": "282911",
    "aoImageId": "55098931",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098931"
  },
  {
    "id": "337-35-foto-af-havnen-i-charlotte-amalie-p-aring-st-thomas-udateret",
    "archiveCode": "337 35",
    "title": "Foto af havnen i Charlotte Amalie på St. Thomas Udateret",
    "shortTitle": "Photo of havnen i Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Historic photo"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282912",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282912",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-35",
      "st_thomas",
      "undated"
    ],
    "bsid": "282912",
    "aoImageId": "55098932",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098932"
  },
  {
    "id": "337-36-kort-over-st-croix-trykt-1894-udsendt-1906-tegnet-af-l-f-von-wimpffen-og-a-klakring",
    "archiveCode": "337 36",
    "title": "Kort over St. Croix Trykt 1894, udsendt 1906, tegnet af L. F. von Wimpffen og A. Klakring",
    "shortTitle": "St. Croix Trykt 1894, udsendt 1906",
    "island": "st_croix",
    "yearLabel": "1894–1906",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "L. F. von Wimpffen og A. Klakring",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282913",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282913",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-36",
      "st_croix",
      "1894-1906"
    ],
    "bsid": "282913",
    "aoImageId": "55098933",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098933"
  },
  {
    "id": "337-38-kort-over-st-croix-projekteret-jernbane-anf-oslash-rt-med-r-oslash-dt-udarbejdet-1794-trykt-1799-med-nyere-tilf-oslash-j",
    "archiveCode": "337 38",
    "title": "Kort over St. Croix, projekteret jernbane anført med rødt Udarbejdet 1794, trykt 1799, med nyere tilføjelse, tegnet af Peter Lotharius Oxholm",
    "shortTitle": "St. Croix, projekteret jernbane anført med rødt Udarbejdet 1794, trykt 1799...",
    "island": "st_croix",
    "yearLabel": "1794–1799",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Peter Lotharius Oxholm",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Railway evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282915",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282915",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-38",
      "st_croix",
      "1794-1799"
    ],
    "bsid": "282915",
    "aoImageId": "55098935",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098935"
  },
  {
    "id": "337-39-foto-af-gendarmerikasernen-p-aring-havnen-i-charlotte-amalie-p-aring-st-thomas-udateret-efter-1874-hvor-kasernen-blev-by",
    "archiveCode": "337 39",
    "title": "Foto af gendarmerikasernen på havnen i Charlotte Amalie på St. Thomas Udateret (efter 1874, hvor kasernen blev bygget)",
    "shortTitle": "Photo of gendarmerikasernen på havnen i Charlotte Amalie på St. Thomas Udater...",
    "island": "st_thomas",
    "yearLabel": "1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Historic photo"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282916",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282916",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-39",
      "st_thomas",
      "1874"
    ],
    "bsid": "282916",
    "aoImageId": "55098936",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098936"
  },
  {
    "id": "337-40-kort-over-st-croix-indsat-er-kort-over-havnen-i-christiansted-desuden-seks-landtoninger-af-nordkysten-1856-tegnet-af-joh",
    "archiveCode": "337 40",
    "title": "Kort over St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordkysten 1856, tegnet af John Parsons",
    "shortTitle": "St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordk...",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "John Parsons",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282917",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282917",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-40",
      "st_croix",
      "1856"
    ],
    "bsid": "282917",
    "aoImageId": "55098937",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098937"
  },
  {
    "id": "337-41-kort-over-st-croix-indsat-er-kort-over-havnen-i-christiansted-desuden-seks-landtoninger-af-nordkysten-1856-med-nyere-p-a",
    "archiveCode": "337 41",
    "title": "Kort over St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordkysten 1856 (med nyere påtegninger formentlig angående påtænkt jernbane), tegnet af John Parsons",
    "shortTitle": "St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordk...",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "John Parsons",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile",
      "Railway evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282918",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282918",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-41",
      "st_croix",
      "1856"
    ],
    "bsid": "282918",
    "aoImageId": "55098938",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098938"
  },
  {
    "id": "337-42-kort-over-st-croix-indsat-er-kort-over-havnen-i-christiansted-desuden-seks-landtoninger-af-nordkysten-1856-med-nyere-p-a",
    "archiveCode": "337 42",
    "title": "Kort over St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordkysten 1856 (med nyere påtegninger formentlig angående påtænkt jernbane), tegnet af John Parsons",
    "shortTitle": "St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordk...",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "John Parsons",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile",
      "Railway evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282919",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282919",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-42",
      "st_croix",
      "1856"
    ],
    "bsid": "282919",
    "aoImageId": "55098939",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55098939"
  },
  {
    "id": "337-233-kort-over-atlanten-med-transatlantisk-telegraflinie-udarbejdet-1852-oprindelig-trykt-1854-korrigeret-1859-1861-tegnet-af",
    "archiveCode": "337 233",
    "title": "Kort over Atlanten med transatlantisk telegraflinie Udarbejdet 1852, oprindelig trykt 1854, korrigeret 1859-1861, tegnet af P. Daussy",
    "shortTitle": "Atlanten med transatlantisk telegraflinie Udarbejdet 1852, oprindelig trykt 1854, korrige...",
    "island": "all",
    "yearLabel": "1852–1861",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "P. Daussy",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282989",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282989",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-233",
      "all",
      "1852-1861"
    ],
    "bsid": "282989",
    "aoImageId": "55099009",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099009"
  },
  {
    "id": "337-234-tavle-med-forklaring-til-forl-oslash-bet-af-transatlantisk-telegraflinie-udateret-skrevet-af-albert-balestrini",
    "archiveCode": "337 234",
    "title": "Tavle med forklaring til forløbet af transatlantisk telegraflinie Udateret, skrevet af Albert Balestrini",
    "shortTitle": "Tavle med forklaring til forløbet af transatlantisk telegraflinie Udateret, skreve...",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Albert Balestrini",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282990",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#282990",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-234",
      "all",
      "undated"
    ],
    "bsid": "282990",
    "aoImageId": "55099010",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099010"
  },
  {
    "id": "337-407-kingshill-politi-og-milit-aelig-rstation-situationsplan-1882-tegnet-af-j-andersen",
    "archiveCode": "337 407",
    "title": "Kingshill politi- og militærstation, situationsplan 1882, tegnet af J. Andersen",
    "shortTitle": "Kingshill politi- og militærstation, situationsplan 1882",
    "island": "all",
    "yearLabel": "1882",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283041",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283041",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-407",
      "all",
      "1882"
    ],
    "bsid": "283041",
    "aoImageId": "55099061",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099061"
  },
  {
    "id": "337-408-kort-over-det-nordvestligste-af-st-croix-veje-og-vandl-oslash-b-1891-tegnet-af-anders-peter-j-oslash-rgensen",
    "archiveCode": "337 408",
    "title": "Kort over det nordvestligste af St. Croix, veje og vandløb 1891, tegnet af Anders Peter Jørgensen",
    "shortTitle": "det nordvestligste af St. Croix, veje og vandløb 1891",
    "island": "st_croix",
    "yearLabel": "1891",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Anders Peter Jørgensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283042",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283042",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-408",
      "st_croix",
      "1891"
    ],
    "bsid": "283042",
    "aoImageId": "55099062",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099062"
  },
  {
    "id": "337-409-nivellement-af-midterste-gut-i-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 409",
    "title": "Nivellement af midterste gut i Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "Nivellement af midterste gut i Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Elevation / leveling evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283043",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283043",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-409",
      "st_thomas",
      "undated"
    ],
    "bsid": "283043",
    "aoImageId": "55099063",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099063"
  },
  {
    "id": "337-410-beskrivelse-af-indretning-og-funktion-af-fyret-p-aring-buck-island-skrevet-1916-a-f",
    "archiveCode": "337 410",
    "title": "Beskrivelse af indretning og funktion af fyret på Buck Island Skrevet 1916 a-f",
    "shortTitle": "Beskrivelse af indretning og funktion af fyret på Buck Island Skrevet 1916 a-f",
    "island": "all",
    "yearLabel": "1916",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283044",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283044",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-410",
      "all",
      "1916"
    ],
    "bsid": "283044",
    "aoImageId": "55099064",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099064"
  },
  {
    "id": "337-411-fyret-p-aring-buck-island-bl-aring-tryk-af-snit-og-plan-af-lanterne-1915-formentlig-tegnet-af-hans-viggo-ravn",
    "archiveCode": "337 411",
    "title": "Fyret på Buck Island, blåtryk af snit og plan af lanterne 1915, formentlig tegnet af Hans Viggo Ravn",
    "shortTitle": "Fyret på Buck Island, blåtryk af snit og plan af lanterne 1915, formentlig te...",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Hans Viggo Ravn",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283045",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283045",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-411",
      "all",
      "1915"
    ],
    "bsid": "283045",
    "aoImageId": "55099065",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099065"
  },
  {
    "id": "337-412-fyret-p-aring-buck-island-bl-aring-tryk-af-plan-og-snit-af-fundament-formentlig-1915-tegner-uoplyst",
    "archiveCode": "337 412",
    "title": "Fyret på Buck Island, blåtryk af plan og snit af fundament Formentlig 1915, tegner uoplyst",
    "shortTitle": "Fyret på Buck Island, blåtryk af plan og snit af fundament Formentlig 1915",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283046",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283046",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-412",
      "all",
      "1915"
    ],
    "bsid": "283046",
    "aoImageId": "55099066",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099066"
  },
  {
    "id": "337-413-fyret-p-aring-buck-island-bl-aring-tryk-af-plan-af-fyrapparatet-1915-tegnet-af-c-seydner",
    "archiveCode": "337 413",
    "title": "Fyret på Buck Island, blåtryk af plan af fyrapparatet 1915, tegnet af C. Seydner",
    "shortTitle": "Fyret på Buck Island, blåtryk af plan af fyrapparatet 1915",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "C. Seydner",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283047",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283047",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-413",
      "all",
      "1915"
    ],
    "bsid": "283047",
    "aoImageId": "55099067",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099067"
  },
  {
    "id": "337-414-fyret-p-aring-buck-island-bl-aring-tryk-af-plan-og-snit-af-ventilationsd-oslash-r-i-lanterne-formentlig-1915-tegner-uopl",
    "archiveCode": "337 414",
    "title": "Fyret på Buck Island, blåtryk af plan og snit af ventilationsdør i lanterne Formentlig 1915, tegner uoplyst",
    "shortTitle": "Fyret på Buck Island, blåtryk af plan og snit af ventilationsdør i lan...",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283048",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283048",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-414",
      "all",
      "1915"
    ],
    "bsid": "283048",
    "aoImageId": "55099068",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099068"
  },
  {
    "id": "337-415-fyret-p-aring-buck-island-bl-aring-tryk-af-plan-og-snit-af-ventilationsd-oslash-r-i-lanterne-formentlig-1915-tegner-uopl",
    "archiveCode": "337 415",
    "title": "Fyret på Buck Island, blåtryk af plan og snit af ventilationsdør i lanterne Formentlig 1915, tegner uoplyst",
    "shortTitle": "Fyret på Buck Island, blåtryk af plan og snit af ventilationsdør i lan...",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Lighthouse evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283049",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283049",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-415",
      "all",
      "1915"
    ],
    "bsid": "283049",
    "aoImageId": "55099069",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099069"
  },
  {
    "id": "337-416-hestestald-plan-og-snit-og-facader-udateret-tegner-uoplyst",
    "archiveCode": "337 416",
    "title": "Hestestald, plan og snit og facader Udateret, tegner uoplyst",
    "shortTitle": "Hestestald, plan og snit og facader Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283050",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283050",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-416",
      "all",
      "undated"
    ],
    "bsid": "283050",
    "aoImageId": "55099070",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099070"
  },
  {
    "id": "337-417-vaskebassin-ved-kasernen-i-charlotte-amalie-p-aring-st-thomas-plan-og-snit-1882-tegnet-af-j-andersen",
    "archiveCode": "337 417",
    "title": "Vaskebassin ved kasernen i Charlotte Amalie på St. Thomas, plan og snit 1882, tegnet af J. Andersen",
    "shortTitle": "Vaskebassin ved kasernen i Charlotte Amalie på St. Thomas, plan og snit 1882",
    "island": "st_thomas",
    "yearLabel": "1882",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283051",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283051",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-417",
      "st_thomas",
      "1882"
    ],
    "bsid": "283051",
    "aoImageId": "55099071",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099071"
  },
  {
    "id": "337-418-bro-ved-la-grange-snit-og-facade-1889-tegnet-af-anders-peter-j-oslash-rgensen",
    "archiveCode": "337 418",
    "title": "Bro ved La Grange, snit og facade 1889, tegnet af Anders Peter Jørgensen",
    "shortTitle": "Bro ved La Grange, snit og facade 1889",
    "island": "all",
    "yearLabel": "1889",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Anders Peter Jørgensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283052",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283052",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-418",
      "all",
      "1889"
    ],
    "bsid": "283052",
    "aoImageId": "55099072",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099072"
  },
  {
    "id": "337-419-skitse-til-aring-ben-torvehal-p-aring-st-thomas-udateret-tegnerens-initialer-st-aring-r-til-venstre-i-midten-men-er-ikke",
    "archiveCode": "337 419",
    "title": "Skitse til åben torvehal på St. Thomas Udateret, Tegnerens initialer står til venstre i midten, men er ikke umiddelbart læselige",
    "shortTitle": "Skitse til åben torvehal på St. Thomas Udateret, Tegnerens initialer st&aring...",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283053",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283053",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-419",
      "st_thomas",
      "undated"
    ],
    "bsid": "283053",
    "aoImageId": "55099073",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099073"
  },
  {
    "id": "337-420-plan-for-opfyldning-og-udvidelse-af-havnepladsen-i-charlotte-amalie-p-aring-st-thomas-med-oslash-konomiske-overslag-1864",
    "archiveCode": "337 420",
    "title": "Plan for opfyldning og udvidelse af havnepladsen i Charlotte Amalie på St. Thomas, med økonomiske overslag 1864, tegnet af Nicolai Jacobsen",
    "shortTitle": "Plan for opfyldning og udvidelse af havnepladsen i Charlotte Amalie på St. Thomas,...",
    "island": "st_thomas",
    "yearLabel": "1864",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Nicolai Jacobsen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283054",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283054",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-420",
      "st_thomas",
      "1864"
    ],
    "bsid": "283054",
    "aoImageId": "55099074",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099074"
  },
  {
    "id": "337-421-musikpavillon-i-emancipation-garden-i-charlotte-amalie-p-aring-st-thomas-1879-tegnet-af-j-andersen",
    "archiveCode": "337 421",
    "title": "Musikpavillon i Emancipation Garden i Charlotte Amalie på St. Thomas 1879, tegnet af J. Andersen",
    "shortTitle": "Musikpavillon i Emancipation Garden i Charlotte Amalie på St. Thomas 1879",
    "island": "st_thomas",
    "yearLabel": "1879",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283055",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283055",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-421",
      "st_thomas",
      "1879"
    ],
    "bsid": "283055",
    "aoImageId": "55099075",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099075"
  },
  {
    "id": "337-422-k-oslash-kkenbygning-grundplan-og-snit-formentlig-1875-formentlig-tegnet-af-j-andersen",
    "archiveCode": "337 422",
    "title": "Køkkenbygning, grundplan og snit Formentlig 1875, formentlig tegnet af J. Andersen",
    "shortTitle": "Køkkenbygning, grundplan og snit Formentlig 1875, formentlig tegnet af J. Andersen",
    "island": "all",
    "yearLabel": "1875",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283056",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283056",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-422",
      "all",
      "1875"
    ],
    "bsid": "283056",
    "aoImageId": "55099076",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099076"
  },
  {
    "id": "337-423-plan-til-regulering-af-veje-p-aring-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-kort-og-nivellement-1877-tegne",
    "archiveCode": "337 423",
    "title": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Thomas, kort og nivellement 1877, tegnet af J. Andersen",
    "shortTitle": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Tho...",
    "island": "st_thomas",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Elevation / leveling evidence",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283057",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283057",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-423",
      "st_thomas",
      "1877"
    ],
    "bsid": "283057",
    "aoImageId": "55099077",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099077"
  },
  {
    "id": "337-424-ubekendt-bygning-grundplan-udateret-tegner-uoplyst",
    "archiveCode": "337 424",
    "title": "Ubekendt bygning, grundplan Udateret, tegner uoplyst",
    "shortTitle": "Ubekendt bygning, grundplan Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283058",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283058",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-424",
      "all",
      "undated"
    ],
    "bsid": "283058",
    "aoImageId": "55099078",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099078"
  },
  {
    "id": "337-425-bykort-over-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 425",
    "title": "Bykort over Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Town plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283059",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283059",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-425",
      "st_thomas",
      "undated"
    ],
    "bsid": "283059",
    "aoImageId": "55099079",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099079"
  },
  {
    "id": "337-425-bykort-over-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst-a",
    "archiveCode": "337 425",
    "title": "Bykort over Charlotte Amalie på St. Thomas Udateret, tegner uoplyst a",
    "shortTitle": "Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Town plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283060",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283060",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-425",
      "st_thomas",
      "undated"
    ],
    "bsid": "283060",
    "aoImageId": "55099080",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099080"
  },
  {
    "id": "337-426-kort-over-en-del-af-inderhavnen-i-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 426",
    "title": "Kort over en del af inderhavnen i Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "en del af inderhavnen i Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283061",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283061",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-426",
      "st_thomas",
      "undated"
    ],
    "bsid": "283061",
    "aoImageId": "55099081",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099081"
  },
  {
    "id": "337-427-kort-over-st-croix-vestlige-del-udarbejdet-1794-trykt-1799-med-tilf-oslash-jelse-1904-tegnet-af-peter-lotharius-oxholm",
    "archiveCode": "337 427",
    "title": "Kort over St. Croix' vestlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904, tegnet af Peter Lotharius Oxholm",
    "shortTitle": "St. Croix' vestlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904",
    "island": "st_croix",
    "yearLabel": "1794–1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Peter Lotharius Oxholm",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283062",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283062",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-427",
      "st_croix",
      "1794-1904"
    ],
    "bsid": "283062",
    "aoImageId": "55099082",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099082"
  },
  {
    "id": "337-428-forslag-til-regulering-af-b-aring-dehavnen-ved-kongev-aelig-rftet-i-charlotte-amalie-p-aring-st-thomas-1873-tegnet-af-wi",
    "archiveCode": "337 428",
    "title": "Forslag til regulering af bådehavnen ved Kongeværftet i Charlotte Amalie på St. Thomas 1873, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til regulering af bådehavnen ved Kongeværftet i Charlotte Amalie p&ar...",
    "island": "st_thomas",
    "yearLabel": "1873",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283063",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283063",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-428",
      "st_thomas",
      "1873"
    ],
    "bsid": "283063",
    "aoImageId": "55099083",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099083"
  },
  {
    "id": "337-429-projekt-til-gendarmerikaserne-facade-1914-tegner-uoplyst",
    "archiveCode": "337 429",
    "title": "Projekt til gendarmerikaserne, facade 1914, tegner uoplyst",
    "shortTitle": "Projekt til gendarmerikaserne, facade 1914",
    "island": "all",
    "yearLabel": "1914",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283064",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283064",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-429",
      "all",
      "1914"
    ],
    "bsid": "283064",
    "aoImageId": "55099084",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099084"
  },
  {
    "id": "337-430-haveplan-vedr-oslash-rende-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 430",
    "title": "Haveplan vedrørende Kommandantbakken i Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "Haveplan vedrørende Kommandantbakken i Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283065",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283065",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-430",
      "st_thomas",
      "undated"
    ],
    "bsid": "283065",
    "aoImageId": "55099085",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099085"
  },
  {
    "id": "337-431-plan-til-regulering-af-veje-p-aring-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-kort-og-nivellementer-1877-teg",
    "archiveCode": "337 431",
    "title": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Thomas, kort og nivellementer 1877, tegnet af J. Andersen",
    "shortTitle": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Tho...",
    "island": "st_thomas",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Elevation / leveling evidence",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283066",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283066",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-431",
      "st_thomas",
      "1877"
    ],
    "bsid": "283066",
    "aoImageId": "55099086",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099086"
  },
  {
    "id": "337-432-plan-til-regulering-af-veje-p-aring-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-arbejdstegning-formentlig-1877",
    "archiveCode": "337 432",
    "title": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Thomas, arbejdstegning Formentlig 1877, formentlig tegnet af J. Andersen",
    "shortTitle": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Tho...",
    "island": "st_thomas",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283067",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283067",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-432",
      "st_thomas",
      "1877"
    ],
    "bsid": "283067",
    "aoImageId": "55099087",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099087"
  },
  {
    "id": "337-433-vejbro-syd-for-corn-hill-p-aring-st-croix-front-snit-plan-nivellementer-1906-tegnet-af-v-boserup",
    "archiveCode": "337 433",
    "title": "Vejbro syd for Corn Hill på St. Croix, front, snit, plan, nivellementer 1906, tegnet af V. Boserup",
    "shortTitle": "Vejbro syd for Corn Hill på St. Croix, front, snit, plan, nivellementer 1906",
    "island": "st_croix",
    "yearLabel": "1906",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "V. Boserup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Elevation / leveling evidence",
      "Road / street plan",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283068",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283068",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-433",
      "st_croix",
      "1906"
    ],
    "bsid": "283068",
    "aoImageId": "55099088",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099088"
  },
  {
    "id": "337-434-kort-over-st-croix-oslash-stlige-del-udarbejdet-1794-trykt-1799-med-tilf-oslash-jelse-1904-tegnet-af-peter-lotharius-oxh",
    "archiveCode": "337 434",
    "title": "Kort over St. Croix' østlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904, tegnet af Peter Lotharius Oxholm",
    "shortTitle": "St. Croix' østlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904",
    "island": "st_croix",
    "yearLabel": "1794–1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Peter Lotharius Oxholm",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283069",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283069",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-434",
      "st_croix",
      "1794-1904"
    ],
    "bsid": "283069",
    "aoImageId": "55099089",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099089"
  },
  {
    "id": "337-435-kort-over-st-croix-oslash-stlige-del-udarbejdet-1794-trykt-1799-med-tilf-oslash-jelse-1904-tegnet-af-peter-lotharius-oxh",
    "archiveCode": "337 435",
    "title": "Kort over St. Croix' østlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904, tegnet af Peter Lotharius Oxholm",
    "shortTitle": "St. Croix' østlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904",
    "island": "st_croix",
    "yearLabel": "1794–1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Peter Lotharius Oxholm",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283070",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283070",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-435",
      "st_croix",
      "1794-1904"
    ],
    "bsid": "283070",
    "aoImageId": "55099090",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099090"
  },
  {
    "id": "337-436-gendarmerikasernen-i-charlotte-amalie-p-aring-st-thomas-grundplan-af-stueetage-udateret-tegner-uoplyst",
    "archiveCode": "337 436",
    "title": "Gendarmerikasernen i Charlotte Amalie på St. Thomas, grundplan af stueetage Udateret, tegner uoplyst",
    "shortTitle": "Gendarmerikasernen i Charlotte Amalie på St. Thomas, grundplan af stueetage Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283071",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283071",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-436",
      "st_thomas",
      "undated"
    ],
    "bsid": "283071",
    "aoImageId": "55099091",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099091"
  },
  {
    "id": "337-437-projekt-til-gendarmerikaserne-plan-snit-og-facade-1915-tegner-uoplyst",
    "archiveCode": "337 437",
    "title": "Projekt til gendarmerikaserne, plan, snit og facade 1915, tegner uoplyst",
    "shortTitle": "Projekt til gendarmerikaserne, plan, snit og facade 1915",
    "island": "all",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283072",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283072",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-437",
      "all",
      "1915"
    ],
    "bsid": "283072",
    "aoImageId": "55099092",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099092"
  },
  {
    "id": "337-438-gendarmerikaserne-facade-udateret-tegner-uoplyst",
    "archiveCode": "337 438",
    "title": "Gendarmerikaserne, facade Udateret, tegner uoplyst",
    "shortTitle": "Gendarmerikaserne, facade Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283073",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283073",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-438",
      "all",
      "undated"
    ],
    "bsid": "283073",
    "aoImageId": "55099093",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099093"
  },
  {
    "id": "337-439-kort-over-st-croix-indsat-er-kort-over-havnen-i-christiansted-desuden-seks-landtoninger-af-nordkysten-1856-tegnet-af-joh",
    "archiveCode": "337 439",
    "title": "Kort over St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordkysten 1856, tegnet af John Parsons",
    "shortTitle": "St. Croix, indsat er kort over havnen i Christiansted, desuden seks landtoninger af nordk...",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "John Parsons",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence",
      "Coastal profile"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283074",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283074",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-439",
      "st_croix",
      "1856"
    ],
    "bsid": "283074",
    "aoImageId": "55099094",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099094"
  },
  {
    "id": "337-440-skitse-til-vejanl-aelig-g-p-aring-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 440",
    "title": "Skitse til vejanlæg på Kommandantbakken i Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "Skitse til vejanlæg på Kommandantbakken i Charlotte Amalie på St. Thoma...",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283075",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283075",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-440",
      "st_thomas",
      "undated"
    ],
    "bsid": "283075",
    "aoImageId": "55099095",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099095"
  },
  {
    "id": "337-441-tegning-af-landingsbro-i-cruz-bay-p-aring-st-jan-1884-tegner-uoplyst",
    "archiveCode": "337 441",
    "title": "Tegning af landingsbro i Cruz Bay på St. Jan 1884, tegner uoplyst",
    "shortTitle": "Tegning af landingsbro i Cruz Bay på St. Jan 1884",
    "island": "st_john",
    "yearLabel": "1884",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283076",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283076",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-441",
      "st_john",
      "1884"
    ],
    "bsid": "283076",
    "aoImageId": "55099096",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099096"
  },
  {
    "id": "337-442-to-grundtegninger-af-n-oslash-rregade-i-charlotte-amalie-p-aring-st-thomas-1869-tegnet-af-j-jensen",
    "archiveCode": "337 442",
    "title": "To grundtegninger af Nørregade i Charlotte Amalie på St. Thomas 1869, tegnet af J. Jensen",
    "shortTitle": "To grundtegninger af Nørregade i Charlotte Amalie på St. Thomas 1869",
    "island": "st_thomas",
    "yearLabel": "1869",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Jensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283077",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283077",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-442",
      "st_thomas",
      "1869"
    ],
    "bsid": "283077",
    "aoImageId": "55099097",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099097"
  },
  {
    "id": "337-443-plan-til-forh-oslash-jelse-af-skorsten-i-k-oslash-kkenbygning-1875-tegnet-af-j-andersen",
    "archiveCode": "337 443",
    "title": "Plan til forhøjelse af skorsten i køkkenbygning 1875, tegnet af J. Andersen",
    "shortTitle": "Plan til forhøjelse af skorsten i køkkenbygning 1875",
    "island": "all",
    "yearLabel": "1875",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283078",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283078",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-443",
      "all",
      "1875"
    ],
    "bsid": "283078",
    "aoImageId": "55099098",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099098"
  },
  {
    "id": "337-444-plan-til-lig-og-obduktionsstue-p-aring-kommunehospitalet-i-charlotte-amalie-p-aring-st-thomas-1890-tegnet-af-j-andersen",
    "archiveCode": "337 444",
    "title": "Plan til lig- og obduktionsstue på Kommunehospitalet i Charlotte Amalie på St. Thomas 1890, tegnet af J. Andersen",
    "shortTitle": "Plan til lig- og obduktionsstue på Kommunehospitalet i Charlotte Amalie på St...",
    "island": "st_thomas",
    "yearLabel": "1890",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283079",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283079",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-444",
      "st_thomas",
      "1890"
    ],
    "bsid": "283079",
    "aoImageId": "55099099",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099099"
  },
  {
    "id": "337-445-plan-over-adventure-guts-passage-af-centerline-road-p-aring-st-croix-1889-tegnet-af-ander-peter-j-oslash-rgensen",
    "archiveCode": "337 445",
    "title": "Plan over Adventure Guts passage af Centerline Road på St. Croix 1889, tegnet af Ander Peter Jørgensen",
    "shortTitle": "Plan over Adventure Guts passage af Centerline Road på St. Croix 1889",
    "island": "st_croix",
    "yearLabel": "1889",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Ander Peter Jørgensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283080",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283080",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-445",
      "st_croix",
      "1889"
    ],
    "bsid": "283080",
    "aoImageId": "55099100",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099100"
  },
  {
    "id": "337-446-plan-for-lemmestiftelse-og-lighus-p-aring-peter-farm-p-aring-st-croix-grundplaner-1885-tegnet-af-christian-vilhelm-meyer",
    "archiveCode": "337 446",
    "title": "Plan for lemmestiftelse og lighus på Peter Farm på St. Croix, grundplaner 1885, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Plan for lemmestiftelse og lighus på Peter Farm på St. Croix, grundplaner 1885",
    "island": "st_croix",
    "yearLabel": "1885",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283081",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283081",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-446",
      "st_croix",
      "1885"
    ],
    "bsid": "283081",
    "aoImageId": "55099101",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099101"
  },
  {
    "id": "337-447-plan-for-lemmestiftelse-ved-peter-farm-p-aring-st-croix-plan-og-snit-1885-tegnet-af-christian-vilhelm-meyer",
    "archiveCode": "337 447",
    "title": "Plan for lemmestiftelse ved Peter Farm på St. Croix, plan og snit 1885, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Plan for lemmestiftelse ved Peter Farm på St. Croix, plan og snit 1885",
    "island": "st_croix",
    "yearLabel": "1885",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283082",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283082",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-447",
      "st_croix",
      "1885"
    ],
    "bsid": "283082",
    "aoImageId": "55099102",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099102"
  },
  {
    "id": "337-448-plan-til-regulering-af-veje-p-aring-kommandantbakken-i-charlotte-amalie-p-aring-st-thomas-kort-og-nivellementer-1877-teg",
    "archiveCode": "337 448",
    "title": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Thomas, kort og nivellementer 1877, tegnet af J. Andersen",
    "shortTitle": "Plan til regulering af veje på Kommandantbakken i Charlotte Amalie på St. Tho...",
    "island": "st_thomas",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Elevation / leveling evidence",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283083",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283083",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-448",
      "st_thomas",
      "1877"
    ],
    "bsid": "283083",
    "aoImageId": "55099103",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099103"
  },
  {
    "id": "337-449-forslag-til-udvidelse-af-havnekaj-udateret-tegner-uoplyst",
    "archiveCode": "337 449",
    "title": "Forslag til udvidelse af havnekaj Udateret, tegner uoplyst",
    "shortTitle": "Forslag til udvidelse af havnekaj Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283084",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283084",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-449",
      "all",
      "undated"
    ],
    "bsid": "283084",
    "aoImageId": "55099104",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099104"
  },
  {
    "id": "337-451-toldbod-i-frederiksted-p-aring-st-croix-snit-og-planer-samt-tagbj-aelig-lkelag-1881-tegnet-af-j-andersen",
    "archiveCode": "337 451",
    "title": "Toldbod i Frederiksted på St. Croix, snit og planer samt tagbjælkelag 1881, tegnet af J. Andersen",
    "shortTitle": "Toldbod i Frederiksted på St. Croix, snit og planer samt tagbjælkelag 1881",
    "island": "st_croix",
    "yearLabel": "1881",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283086",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283086",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-451",
      "st_croix",
      "1881"
    ],
    "bsid": "283086",
    "aoImageId": "55099106",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099106"
  },
  {
    "id": "337-461-tegning-til-overd-aelig-kket-indgangsbygning-til-kirkeg-aring-rd-formentlig-ved-charlotte-amalie-p-aring-st-thomas-1885-",
    "archiveCode": "337 461",
    "title": "Tegning til overdækket indgangsbygning til kirkegård (formentlig ved Charlotte Amalie på St. Thomas) 1885, tegnet af J. Andersen",
    "shortTitle": "Tegning til overdækket indgangsbygning til kirkegård (formentlig ved Charlott...",
    "island": "st_thomas",
    "yearLabel": "1885",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283096",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283096",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-461",
      "st_thomas",
      "1885"
    ],
    "bsid": "283096",
    "aoImageId": "55099116",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099116"
  },
  {
    "id": "337-462-udkast-til-mur-og-indgangsparti-p-aring-ny-kirkeg-aring-rd-formentlig-ved-charlotte-amalie-p-aring-st-thomas-udateret-te",
    "archiveCode": "337 462",
    "title": "Udkast til mur og indgangsparti på ny kirkegård (formentlig ved Charlotte Amalie på St. Thomas) Udateret, tegner uoplyst",
    "shortTitle": "Udkast til mur og indgangsparti på ny kirkegård (formentlig ved Charlotte Ama...",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283097",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283097",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-462",
      "st_thomas",
      "undated"
    ],
    "bsid": "283097",
    "aoImageId": "55099117",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099117"
  },
  {
    "id": "337-463-kort-over-christiansted-havn-p-aring-st-croix-med-indsat-landkending-af-indsejlingen-opm-aring-lt-1906-trykt-1907-tegner",
    "archiveCode": "337 463",
    "title": "Kort over Christiansted Havn på St. Croix, med indsat landkending af indsejlingen Opmålt 1906, trykt 1907, tegner uoplyst",
    "shortTitle": "Christiansted Havn på St. Croix, med indsat landkending af indsejlingen Opmål...",
    "island": "st_croix",
    "yearLabel": "1906–1907",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283098",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283098",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-463",
      "st_croix",
      "1906-1907"
    ],
    "bsid": "283098",
    "aoImageId": "55099118",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099118"
  },
  {
    "id": "337-464-forslag-til-opf-oslash-relse-af-vaskehus-og-kogehus-ved-kasernen-i-christiansted-p-aring-st-croix-1883-tegnet-af-christi",
    "archiveCode": "337 464",
    "title": "Forslag til opførelse af vaskehus og kogehus ved kasernen i Christiansted på St. Croix 1883, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Forslag til opførelse af vaskehus og kogehus ved kasernen i Christiansted på...",
    "island": "st_croix",
    "yearLabel": "1883",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283099",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283099",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-464",
      "st_croix",
      "1883"
    ],
    "bsid": "283099",
    "aoImageId": "55099119",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099119"
  },
  {
    "id": "337-465-kort-over-charlotte-amalie-p-aring-st-thomas-med-indtegnet-forslag-til-vandledning-til-byen-fra-staabi-og-john-duncko-gu",
    "archiveCode": "337 465",
    "title": "Kort over Charlotte Amalie på St. Thomas med indtegnet forslag til vandledning til byen fra Staabi og John Duncko gutter 1873, tegnet af William A. Thulstrup",
    "shortTitle": "Charlotte Amalie på St. Thomas med indtegnet forslag til vandledning til byen fra S...",
    "island": "st_thomas",
    "yearLabel": "1873",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283100",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283100",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-465",
      "st_thomas",
      "1873"
    ],
    "bsid": "283100",
    "aoImageId": "55099120",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099120"
  },
  {
    "id": "337-466-forslag-til-genopf-oslash-relse-af-skolebygningen-p-aring-kingshill-p-aring-st-croix-planer-og-snit-1884-tegnet-af-chris",
    "archiveCode": "337 466",
    "title": "Forslag til genopførelse af skolebygningen på Kingshill på St. Croix, planer og snit 1884, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Forslag til genopførelse af skolebygningen på Kingshill på St. Croix,...",
    "island": "st_croix",
    "yearLabel": "1884",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283101",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283101",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-466",
      "st_croix",
      "1884"
    ],
    "bsid": "283101",
    "aoImageId": "55099121",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099121"
  },
  {
    "id": "337-467-forslag-til-aelig-ndring-af-bygning-for-veneriske-patienter-p-aring-frederiksted-hospital-p-aring-st-croix-facade-1851-t",
    "archiveCode": "337 467",
    "title": "Forslag til ændring af bygning for veneriske patienter på Frederiksted Hospital på St. Croix, facade 1851, tegnet af Frederik Herman Møller",
    "shortTitle": "Forslag til ændring af bygning for veneriske patienter på Frederiksted Hospit...",
    "island": "st_croix",
    "yearLabel": "1851",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Frederik Herman Møller",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283102",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283102",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-467",
      "st_croix",
      "1851"
    ],
    "bsid": "283102",
    "aoImageId": "55099122",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099122"
  },
  {
    "id": "337-468-hospitalet-i-frederiksted-p-aring-st-croix-facade-1851-tegnet-af-frederik-herman-m-oslash-ller",
    "archiveCode": "337 468",
    "title": "Hospitalet i Frederiksted på St. Croix, facade 1851, tegnet af Frederik Herman Møller",
    "shortTitle": "Hospitalet i Frederiksted på St. Croix, facade 1851",
    "island": "st_croix",
    "yearLabel": "1851",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Frederik Herman Møller",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283103",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283103",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-468",
      "st_croix",
      "1851"
    ],
    "bsid": "283103",
    "aoImageId": "55099123",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099123"
  },
  {
    "id": "337-469-hospitalet-i-frederiksted-p-aring-st-croix-facader-1851-tegnet-af-frederik-herman-m-oslash-ller",
    "archiveCode": "337 469",
    "title": "Hospitalet i Frederiksted på St. Croix, facader 1851, tegnet af Frederik Herman Møller",
    "shortTitle": "Hospitalet i Frederiksted på St. Croix, facader 1851",
    "island": "st_croix",
    "yearLabel": "1851",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Frederik Herman Møller",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283104",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283104",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-469",
      "st_croix",
      "1851"
    ],
    "bsid": "283104",
    "aoImageId": "55099124",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099124"
  },
  {
    "id": "337-470-trappe-udateret-tegner-uoplyst",
    "archiveCode": "337 470",
    "title": "Trappe Udateret, tegner uoplyst",
    "shortTitle": "Trappe Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283105",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283105",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-470",
      "all",
      "undated"
    ],
    "bsid": "283105",
    "aoImageId": "55099125",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099125"
  },
  {
    "id": "337-474-skole-og-kirke-formentlig-betania-p-aring-st-jan-facader-grundplan-og-snit-1877-tegnet-af-j-andersen",
    "archiveCode": "337 474",
    "title": "Skole og kirke (formentlig Betania) på St. Jan, facader, grundplan og snit 1877, tegnet af J. Andersen",
    "shortTitle": "Skole og kirke (formentlig Betania) på St. Jan, facader, grundplan og snit 1877",
    "island": "st_john",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283109",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283109",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-474",
      "st_john",
      "1877"
    ],
    "bsid": "283109",
    "aoImageId": "55099129",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099129"
  },
  {
    "id": "337-475-f-aelig-ngslet-og-hospitalet-ved-richmond-p-aring-st-croix-planer-og-snit-1882-tegnet-af-christian-vilhelm-meyer",
    "archiveCode": "337 475",
    "title": "Fængslet og hospitalet ved Richmond på St. Croix, planer og snit 1882, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Fængslet og hospitalet ved Richmond på St. Croix, planer og snit 1882",
    "island": "st_croix",
    "yearLabel": "1882",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283110",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283110",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-475",
      "st_croix",
      "1882"
    ],
    "bsid": "283110",
    "aoImageId": "55099130",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099130"
  },
  {
    "id": "337-476-kort-over-st-croix-vestlige-del-udarbejdet-1794-trykt-1799-med-tilf-oslash-jelse-1904-tegnet-af-peter-lotharius-oxholm",
    "archiveCode": "337 476",
    "title": "Kort over St. Croix' vestlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904, tegnet af Peter Lotharius Oxholm",
    "shortTitle": "St. Croix' vestlige del Udarbejdet 1794, trykt 1799, med tilføjelse 1904",
    "island": "st_croix",
    "yearLabel": "1794–1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Peter Lotharius Oxholm",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283111",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283111",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-476",
      "st_croix",
      "1794-1904"
    ],
    "bsid": "283111",
    "aoImageId": "55099131",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099131"
  },
  {
    "id": "337-477-kontorbygning-i-charlotte-amalie-p-aring-st-thomas-for-post-told-lods-og-havnemyndigheder-facader-og-grundplaner-1870-mo",
    "archiveCode": "337 477",
    "title": "Kontorbygning i Charlotte Amalie på St. Thomas for post-, told-, lods- og havnemyndigheder, facader og grundplaner 1870, modificeret 1872, tegnet af NN og William A. Thulstrup",
    "shortTitle": "Kontorbygning i Charlotte Amalie på St. Thomas for post-, told-, lods- og havnemynd...",
    "island": "st_thomas",
    "yearLabel": "1870–1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "NN og William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283112",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283112",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-477",
      "st_thomas",
      "1870-1872"
    ],
    "bsid": "283112",
    "aoImageId": "55099132",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099132"
  },
  {
    "id": "337-478-n-oslash-rregade-og-domini-tv-aelig-rgade-i-charlotte-amalie-p-aring-st-thomas-gadeforl-oslash-b-og-nivellement-1874-teg",
    "archiveCode": "337 478",
    "title": "Nørregade og Domini Tværgade i Charlotte Amalie på St. Thomas, gadeforløb og nivellement 1874, tegnet af William A. Thulstrup",
    "shortTitle": "Nørregade og Domini Tværgade i Charlotte Amalie på St. Thomas, gadefor...",
    "island": "st_thomas",
    "yearLabel": "1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Elevation / leveling evidence",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283113",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283113",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-478",
      "st_thomas",
      "1874"
    ],
    "bsid": "283113",
    "aoImageId": "55099133",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099133"
  },
  {
    "id": "337-501-kasernen-i-charlotte-amalie-p-aring-st-thomas-situationsplan-og-grundplaner-1904-tegnet-af-carl-frederik-suhr-schouboe",
    "archiveCode": "337 501",
    "title": "Kasernen i Charlotte Amalie på St. Thomas, situationsplan og grundplaner 1904, tegnet af Carl Frederik Suhr Schouboe",
    "shortTitle": "Kasernen i Charlotte Amalie på St. Thomas, situationsplan og grundplaner 1904",
    "island": "st_thomas",
    "yearLabel": "1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Carl Frederik Suhr Schouboe",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283117",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283117",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-501",
      "st_thomas",
      "1904"
    ],
    "bsid": "283117",
    "aoImageId": "55099137",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099137"
  },
  {
    "id": "337-502-kasernen-i-charlotte-amalie-p-aring-st-thomas-facade-og-snit-1904-tegnet-af-carl-frederik-suhr-schouboe",
    "archiveCode": "337 502",
    "title": "Kasernen i Charlotte Amalie på St. Thomas, facade og snit 1904, tegnet af Carl Frederik Suhr Schouboe",
    "shortTitle": "Kasernen i Charlotte Amalie på St. Thomas, facade og snit 1904",
    "island": "st_thomas",
    "yearLabel": "1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Carl Frederik Suhr Schouboe",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283118",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283118",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-502",
      "st_thomas",
      "1904"
    ],
    "bsid": "283118",
    "aoImageId": "55099138",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099138"
  },
  {
    "id": "337-503-kasernen-i-charlotte-amalie-p-aring-st-thomas-grundplaner-1904-tegnet-af-carl-frederik-suhr-schouboe",
    "archiveCode": "337 503",
    "title": "Kasernen i Charlotte Amalie på St. Thomas, grundplaner 1904, tegnet af Carl Frederik Suhr Schouboe",
    "shortTitle": "Kasernen i Charlotte Amalie på St. Thomas, grundplaner 1904",
    "island": "st_thomas",
    "yearLabel": "1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Carl Frederik Suhr Schouboe",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283119",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283119",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-503",
      "st_thomas",
      "1904"
    ],
    "bsid": "283119",
    "aoImageId": "55099139",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099139"
  },
  {
    "id": "337-504-kasernen-i-charlotte-amalie-p-aring-st-thomas-grundplaner-1905-tegnet-af-albert-jensen",
    "archiveCode": "337 504",
    "title": "Kasernen i Charlotte Amalie på St. Thomas, grundplaner 1905, tegnet af Albert Jensen",
    "shortTitle": "Kasernen i Charlotte Amalie på St. Thomas, grundplaner 1905",
    "island": "st_thomas",
    "yearLabel": "1905",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Albert Jensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283120",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283120",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-504",
      "st_thomas",
      "1905"
    ],
    "bsid": "283120",
    "aoImageId": "55099140",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099140"
  },
  {
    "id": "337-505-hospitalsomr-aring-de-skitse-til-situationsplan-udateret-tegner-uoplyst",
    "archiveCode": "337 505",
    "title": "Hospitalsområde, skitse til situationsplan Udateret, tegner uoplyst",
    "shortTitle": "Hospitalsområde, skitse til situationsplan Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283121",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283121",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-505",
      "all",
      "undated"
    ],
    "bsid": "283121",
    "aoImageId": "55099141",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099141"
  },
  {
    "id": "337-506-ny-afdeling-for-sindssyge-ved-hospitalet-p-aring-richmond-p-aring-st-croix-situationsplan-grundplaner-og-snit-1909-tegne",
    "archiveCode": "337 506",
    "title": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, situationsplan, grundplaner og snit 1909, tegnet af Ejnar Kærn",
    "shortTitle": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, situations...",
    "island": "st_croix",
    "yearLabel": "1909",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Ejnar Kærn",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283122",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283122",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-506",
      "st_croix",
      "1909"
    ],
    "bsid": "283122",
    "aoImageId": "55099142",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099142"
  },
  {
    "id": "337-507-ny-afdeling-for-sindssyge-ved-hospitalet-p-aring-richmond-p-aring-st-croix-facade-grundplaner-og-snit-1909-tegnet-af-ejn",
    "archiveCode": "337 507",
    "title": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, facade, grundplaner og snit 1909, tegnet af Ejnar Kærn",
    "shortTitle": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, facade, gr...",
    "island": "st_croix",
    "yearLabel": "1909",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Ejnar Kærn",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283123",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283123",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-507",
      "st_croix",
      "1909"
    ],
    "bsid": "283123",
    "aoImageId": "55099143",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099143"
  },
  {
    "id": "337-508-ny-afdeling-for-sindssyge-ved-hospitalet-p-aring-richmond-p-aring-st-croix-situationsplan-facade-grundplaner-og-snit-190",
    "archiveCode": "337 508",
    "title": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, situationsplan, facade, grundplaner og snit 1909, tegnet af Ejnar Kærn",
    "shortTitle": "Ny afdeling for sindssyge ved hospitalet på Richmond på St. Croix, situations...",
    "island": "st_croix",
    "yearLabel": "1909",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Ejnar Kærn",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283124",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283124",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-508",
      "st_croix",
      "1909"
    ],
    "bsid": "283124",
    "aoImageId": "55099144",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099144"
  },
  {
    "id": "337-509-kort-over-indsejlingen-til-christiansted-havn-p-aring-st-croix-1905-1906-tegnet-af-einar-jessen",
    "archiveCode": "337 509",
    "title": "Kort over indsejlingen til Christiansted havn på St. Croix 1905-1906, tegnet af Einar Jessen",
    "shortTitle": "indsejlingen til Christiansted havn på St. Croix 1905-1906",
    "island": "st_croix",
    "yearLabel": "1905–1906",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Einar Jessen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283125",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283125",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-509",
      "st_croix",
      "1905-1906"
    ],
    "bsid": "283125",
    "aoImageId": "55099145",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099145"
  },
  {
    "id": "337-510-forslag-til-regulering-af-pladsen-ved-christiansfort-i-charlotte-amalie-p-aring-st-thomas-situationsplan-og-snit-1872-te",
    "archiveCode": "337 510",
    "title": "Forslag til regulering af pladsen ved Christiansfort i Charlotte Amalie på St. Thomas, situationsplan og snit 1872, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til regulering af pladsen ved Christiansfort i Charlotte Amalie på St. Thom...",
    "island": "st_thomas",
    "yearLabel": "1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283126",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283126",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-510",
      "st_thomas",
      "1872"
    ],
    "bsid": "283126",
    "aoImageId": "55099146",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099146"
  },
  {
    "id": "337-511-enkebolig-facader-1866-tegnet-af-vilhelm-petersen",
    "archiveCode": "337 511",
    "title": "Enkebolig, facader 1866, tegnet af Vilhelm Petersen",
    "shortTitle": "Enkebolig, facader 1866",
    "island": "all",
    "yearLabel": "1866",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Vilhelm Petersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283127",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283127",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-511",
      "all",
      "1866"
    ],
    "bsid": "283127",
    "aoImageId": "55099147",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099147"
  },
  {
    "id": "337-512-enkebolig-facader-og-snit-1866-tegnet-af-vilhelm-petersen",
    "archiveCode": "337 512",
    "title": "Enkebolig, facader og snit 1866, tegnet af Vilhelm Petersen",
    "shortTitle": "Enkebolig, facader og snit 1866",
    "island": "all",
    "yearLabel": "1866",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Vilhelm Petersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283128",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283128",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-512",
      "all",
      "1866"
    ],
    "bsid": "283128",
    "aoImageId": "55099148",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099148"
  },
  {
    "id": "337-513-enkebolig-grundplaner-1866-tegnet-af-vilhelm-petersen",
    "archiveCode": "337 513",
    "title": "Enkebolig, grundplaner 1866, tegnet af Vilhelm Petersen",
    "shortTitle": "Enkebolig, grundplaner 1866",
    "island": "all",
    "yearLabel": "1866",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Vilhelm Petersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283129",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283129",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-513",
      "all",
      "1866"
    ],
    "bsid": "283129",
    "aoImageId": "55099149",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099149"
  },
  {
    "id": "337-514-enkebolig-snit-og-k-aelig-ldergrundplan-1866-tegnet-af-vilhelm-petersen",
    "archiveCode": "337 514",
    "title": "Enkebolig, snit og kældergrundplan 1866, tegnet af Vilhelm Petersen",
    "shortTitle": "Enkebolig, snit og kældergrundplan 1866",
    "island": "all",
    "yearLabel": "1866",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Vilhelm Petersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283130",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283130",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-514",
      "all",
      "1866"
    ],
    "bsid": "283130",
    "aoImageId": "55099150",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099150"
  },
  {
    "id": "337-515-forslag-til-gaderegulering-i-charlotte-amalie-p-aring-st-thomas-planer-tv-aelig-rprofiler-og-nivelleringer-1872-tegnet-a",
    "archiveCode": "337 515",
    "title": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, planer, tværprofiler og nivelleringer 1872, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, planer, tværprof...",
    "island": "st_thomas",
    "yearLabel": "1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283131",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283131",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-515",
      "st_thomas",
      "1872"
    ],
    "bsid": "283131",
    "aoImageId": "55099151",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099151"
  },
  {
    "id": "337-516-batterier-ved-cowell-point-og-kasernen-i-charlotte-amalie-p-aring-st-thomas-planer-og-snit-1884-tegnet-af-christian-vilh",
    "archiveCode": "337 516",
    "title": "Batterier ved Cowell Point og kasernen i Charlotte Amalie på St. Thomas, planer og snit 1884, tegnet af Christian Vilhelm Meyer",
    "shortTitle": "Batterier ved Cowell Point og kasernen i Charlotte Amalie på St. Thomas, planer og...",
    "island": "st_thomas",
    "yearLabel": "1884",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Vilhelm Meyer",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283132",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283132",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-516",
      "st_thomas",
      "1884"
    ],
    "bsid": "283132",
    "aoImageId": "55099152",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099152"
  },
  {
    "id": "337-517-situationsplan-over-st-thomas-b-aring-dehavn-og-n-aelig-rmest-liggende-arealer-1873-tegnet-af-william-a-thulstrup",
    "archiveCode": "337 517",
    "title": "Situationsplan over St. Thomas bådehavn og nærmest liggende arealer 1873, tegnet af William A. Thulstrup",
    "shortTitle": "Situationsplan over St. Thomas bådehavn og nærmest liggende arealer 1873",
    "island": "st_thomas",
    "yearLabel": "1873",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283133",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283133",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-517",
      "st_thomas",
      "1873"
    ],
    "bsid": "283133",
    "aoImageId": "55099153",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099153"
  },
  {
    "id": "337-518-christiansfort-i-charlotte-amalie-p-aring-st-thomas-facade-grundplaner-og-snit-1872-tegnet-af-william-a-thulstrup",
    "archiveCode": "337 518",
    "title": "Christiansfort i Charlotte Amalie på St. Thomas, facade, grundplaner og snit 1872, tegnet af William A. Thulstrup",
    "shortTitle": "Christiansfort i Charlotte Amalie på St. Thomas, facade, grundplaner og snit 1872",
    "island": "st_thomas",
    "yearLabel": "1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283134",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283134",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-518",
      "st_thomas",
      "1872"
    ],
    "bsid": "283134",
    "aoImageId": "55099154",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099154"
  },
  {
    "id": "337-522-tekstdokument-overslag-over-udgifter-ved-opf-oslash-relsen-af-en-bygning-til-havnekontor-i-st-thomas-1883-af-j-andersen-",
    "archiveCode": "337 522",
    "title": "Tekstdokument, Overslag over Udgifter ved Opførelsen af en Bygning til Havnekontor i St. Thomas 1883, af J. Andersen 522-522a",
    "shortTitle": "Tekstdokument, Overslag over Udgifter ved Opførelsen af en Bygning til Havnekontor...",
    "island": "st_thomas",
    "yearLabel": "1883",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283138",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283138",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-522",
      "st_thomas",
      "1883"
    ],
    "bsid": "283138",
    "aoImageId": "55099158",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099158"
  },
  {
    "id": "337-523-tekstdokument-translation-estimate-of-costs-of-erecting-a-building-to-serve-as-harbour-office-in-st-thomas-1883-af-j-and",
    "archiveCode": "337 523",
    "title": "Tekstdokument, Translation, Estimate of costs of erecting a building to serve as Harbour Office in St. Thomas 1883, af J. Andersen 523-523a",
    "shortTitle": "Tekstdokument, Translation, Estimate of costs of erecting a building to serve as Harbour...",
    "island": "st_thomas",
    "yearLabel": "1883",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283139",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283139",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-523",
      "st_thomas",
      "1883"
    ],
    "bsid": "283139",
    "aoImageId": "55099159",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099159"
  },
  {
    "id": "337-524-tekstdokument-udgiftsberegning-vedr-oslash-rende-regulering-af-gader-i-charlotte-amalie-p-aring-st-thomas-1874-af-willia",
    "archiveCode": "337 524",
    "title": "Tekstdokument, Udgiftsberegning vedrørende regulering af gader i Charlotte Amalie på St. Thomas 1874, af William A. Thulstrup 524-524a",
    "shortTitle": "Tekstdokument, Udgiftsberegning vedrørende regulering af gader i Charlotte Amalie...",
    "island": "st_thomas",
    "yearLabel": "1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283140",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283140",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-524",
      "st_thomas",
      "1874"
    ],
    "bsid": "283140",
    "aoImageId": "55099160",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099160"
  },
  {
    "id": "337-525-tekstdokument-udgiftsberegning-vedr-oslash-rende-regulering-af-gade-i-charlotte-amalie-p-aring-st-thomas-1875-forfatter-",
    "archiveCode": "337 525",
    "title": "Tekstdokument, Udgiftsberegning vedrørende regulering af gade i Charlotte Amalie på St. Thomas 1875, forfatter uoplyst",
    "shortTitle": "Tekstdokument, Udgiftsberegning vedrørende regulering af gade i Charlotte Amalie p...",
    "island": "st_thomas",
    "yearLabel": "1875",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283141",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283141",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-525",
      "st_thomas",
      "1875"
    ],
    "bsid": "283141",
    "aoImageId": "55099161",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099161"
  },
  {
    "id": "337-526-projekt-til-oml-aelig-gning-af-n-oslash-rregade-i-charlotte-amalie-p-aring-st-thomas-profiler-af-rendestene-m-v-1869-til",
    "archiveCode": "337 526",
    "title": "Projekt til omlægning af Nørregade i Charlotte Amalie på St. Thomas, profiler af rendestene m.v. 1869, tilføjelser 1873 og 1874, tegnet af J. Jensen",
    "shortTitle": "Projekt til omlægning af Nørregade i Charlotte Amalie på St. Thomas, p...",
    "island": "st_thomas",
    "yearLabel": "1869–1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Jensen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283142",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283142",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-526",
      "st_thomas",
      "1869-1874"
    ],
    "bsid": "283142",
    "aoImageId": "55099162",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099162"
  },
  {
    "id": "337-527-oslash-verste-etage-i-ubekendt-bygning-grundplan-udateret-tegner-uoplyst",
    "archiveCode": "337 527",
    "title": "Øverste etage i ubekendt bygning, grundplan Udateret, tegner uoplyst",
    "shortTitle": "Øverste etage i ubekendt bygning, grundplan Udateret",
    "island": "all",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283143",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283143",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-527",
      "all",
      "undated"
    ],
    "bsid": "283143",
    "aoImageId": "55099163",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099163"
  },
  {
    "id": "337-528-tekstdokument-anl-aelig-g-og-drift-af-en-bane-mellem-christiansted-og-frederiksted-paa-st-croix-1904-af-holger-petersen-",
    "archiveCode": "337 528",
    "title": "Tekstdokument, Anlæg og Drift af en Bane mellem Christiansted og Frederiksted paa St. Croix 1904, af Holger Petersen, bestyrelsen for Plantageselskabet Dansk Vestindien 528, 528a, 528b",
    "shortTitle": "Tekstdokument, Anlæg og Drift af en Bane mellem Christiansted og Frederiksted paa S...",
    "island": "st_croix",
    "yearLabel": "1904",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283144",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283144",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-528",
      "st_croix",
      "1904"
    ],
    "bsid": "283144",
    "aoImageId": "55099164",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099164"
  },
  {
    "id": "337-529-forslag-til-nyt-salutbatteri-ved-kasernen-p-aring-havnen-i-charlotte-amalie-p-aring-st-thomas-situationsplan-og-snit-187",
    "archiveCode": "337 529",
    "title": "Forslag til nyt salutbatteri ved kasernen på havnen i Charlotte Amalie på St. Thomas, situationsplan og snit 1873, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til nyt salutbatteri ved kasernen på havnen i Charlotte Amalie på St....",
    "island": "st_thomas",
    "yearLabel": "1873",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283145",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283145",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-529",
      "st_thomas",
      "1873"
    ],
    "bsid": "283145",
    "aoImageId": "55099165",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099165"
  },
  {
    "id": "337-530-plan-for-regulering-af-pladsen-ved-christiansfort-i-charlotte-amalie-p-aring-st-thomas-situationsplan-1875-tegnet-af-j-a",
    "archiveCode": "337 530",
    "title": "Plan for regulering af pladsen ved Christiansfort i Charlotte Amalie på St. Thomas, situationsplan 1875, tegnet af J. Andersen",
    "shortTitle": "Plan for regulering af pladsen ved Christiansfort i Charlotte Amalie på St. Thomas,...",
    "island": "st_thomas",
    "yearLabel": "1875",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283146",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283146",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-530",
      "st_thomas",
      "1875"
    ],
    "bsid": "283146",
    "aoImageId": "55099166",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099166"
  },
  {
    "id": "337-531-kort-over-den-sydlige-halvdel-af-hassel-island-i-havnen-i-charlotte-amalie-p-aring-st-thomas-1851-tegner-uoplyst",
    "archiveCode": "337 531",
    "title": "Kort over den sydlige halvdel af Hassel Island i havnen i Charlotte Amalie på St. Thomas 1851, tegner uoplyst",
    "shortTitle": "den sydlige halvdel af Hassel Island i havnen i Charlotte Amalie på St. Thomas 1851",
    "island": "st_thomas",
    "yearLabel": "1851",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283147",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283147",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-531",
      "st_thomas",
      "1851"
    ],
    "bsid": "283147",
    "aoImageId": "55099167",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099167"
  },
  {
    "id": "337-532-vindeltrappe-i-de-nye-guvernementskontorer-formentlig-i-charlotte-amalie-p-aring-st-thomas-1884-tegnet-af-j-andersen",
    "archiveCode": "337 532",
    "title": "Vindeltrappe i de nye guvernementskontorer (formentlig i Charlotte Amalie på St. Thomas) 1884, tegnet af J. Andersen",
    "shortTitle": "Vindeltrappe i de nye guvernementskontorer (formentlig i Charlotte Amalie på St. Th...",
    "island": "st_thomas",
    "yearLabel": "1884",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283148",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283148",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-532",
      "st_thomas",
      "1884"
    ],
    "bsid": "283148",
    "aoImageId": "55099168",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099168"
  },
  {
    "id": "337-533-opmudringsfelt-i-havnen-i-charlotte-amalie-p-aring-st-thomas-udateret-tegner-uoplyst",
    "archiveCode": "337 533",
    "title": "Opmudringsfelt i havnen i Charlotte Amalie på St. Thomas Udateret, tegner uoplyst",
    "shortTitle": "Opmudringsfelt i havnen i Charlotte Amalie på St. Thomas Udateret",
    "island": "st_thomas",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283149",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283149",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-533",
      "st_thomas",
      "undated"
    ],
    "bsid": "283149",
    "aoImageId": "55099169",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099169"
  },
  {
    "id": "337-534-plan-til-udt-oslash-rring-af-lagunen-ved-long-bay-i-havnen-i-charlotte-amalie-p-aring-st-croix-1867-tegnet-af-nn",
    "archiveCode": "337 534",
    "title": "Plan til udtørring af lagunen ved Long Bay i havnen i Charlotte Amalie på St. Croix 1867, tegnet af NN",
    "shortTitle": "Plan til udtørring af lagunen ved Long Bay i havnen i Charlotte Amalie på St...",
    "island": "st_croix",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "NN",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283150",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283150",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-534",
      "st_croix",
      "1867"
    ],
    "bsid": "283150",
    "aoImageId": "55099170",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099170"
  },
  {
    "id": "337-535-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-plan-og-snit-udateret-en-flydedok-l-aring-i-havnen-fra-1867-water",
    "archiveCode": "337 535",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, plan og snit Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, plan og snit Udateret (En flyde...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283151",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283151",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-535",
      "st_thomas",
      "1867"
    ],
    "bsid": "283151",
    "aoImageId": "55099171",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099171"
  },
  {
    "id": "337-536-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-planer-udateret-en-flydedok-l-aring-i-havnen-fra-1867-waterlow-so",
    "archiveCode": "337 536",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, planer Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, planer Udateret (En flydedok l&...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283152",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283152",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-536",
      "st_thomas",
      "1867"
    ],
    "bsid": "283152",
    "aoImageId": "55099172",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099172"
  },
  {
    "id": "337-537-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-snit-udateret-en-flydedok-l-aring-i-havnen-fra-1867-waterlow-sons",
    "archiveCode": "337 537",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, snit Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, snit Udateret (En flydedok l&ar...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283153",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283153",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-537",
      "st_thomas",
      "1867"
    ],
    "bsid": "283153",
    "aoImageId": "55099173",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099173"
  },
  {
    "id": "337-538-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wa",
    "archiveCode": "337 538",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283154",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283154",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-538",
      "st_thomas",
      "1867"
    ],
    "bsid": "283154",
    "aoImageId": "55099174",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099174"
  },
  {
    "id": "337-539-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegning-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wate",
    "archiveCode": "337 539",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegning Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegning Udateret (En flyd...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283155",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283155",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-539",
      "st_thomas",
      "1867"
    ],
    "bsid": "283155",
    "aoImageId": "55099175",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099175"
  },
  {
    "id": "337-540-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wa",
    "archiveCode": "337 540",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283156",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283156",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-540",
      "st_thomas",
      "1867"
    ],
    "bsid": "283156",
    "aoImageId": "55099176",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099176"
  },
  {
    "id": "337-541-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wa",
    "archiveCode": "337 541",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283157",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283157",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-541",
      "st_thomas",
      "1867"
    ],
    "bsid": "283157",
    "aoImageId": "55099177",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099177"
  },
  {
    "id": "337-542-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wa",
    "archiveCode": "337 542",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283158",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283158",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-542",
      "st_thomas",
      "1867"
    ],
    "bsid": "283158",
    "aoImageId": "55099178",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099178"
  },
  {
    "id": "337-543-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-detailtegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867-wa",
    "archiveCode": "337 543",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En flydedok lå i havnen fra 1867), Waterlow & Sons, Lithographers",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, detailtegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283159",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283159",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-543",
      "st_thomas",
      "1867"
    ],
    "bsid": "283159",
    "aoImageId": "55099179",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099179"
  },
  {
    "id": "337-544-flydedok-i-havnen-i-charlotte-amalie-p-aring-st-thomas-maskintegninger-udateret-en-flydedok-l-aring-i-havnen-fra-1867",
    "archiveCode": "337 544",
    "title": "Flydedok i havnen i Charlotte Amalie på St. Thomas, maskintegninger Udateret (En flydedok lå i havnen fra 1867)",
    "shortTitle": "Flydedok i havnen i Charlotte Amalie på St. Thomas, maskintegninger Udateret (En fl...",
    "island": "st_thomas",
    "yearLabel": "1867",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283160",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283160",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-544",
      "st_thomas",
      "1867"
    ],
    "bsid": "283160",
    "aoImageId": "55099180",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099180"
  },
  {
    "id": "337-545-plan-for-havnekontor-i-charlotte-amalie-p-aring-st-thomas-grundplan-facader-og-snit-1883-tegnet-af-j-andersen",
    "archiveCode": "337 545",
    "title": "Plan for havnekontor i Charlotte Amalie på St. Thomas, grundplan, facader og snit 1883, tegnet af J. Andersen",
    "shortTitle": "Plan for havnekontor i Charlotte Amalie på St. Thomas, grundplan, facader og snit 1883",
    "island": "st_thomas",
    "yearLabel": "1883",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283161",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283161",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-545",
      "st_thomas",
      "1883"
    ],
    "bsid": "283161",
    "aoImageId": "55099181",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099181"
  },
  {
    "id": "337-546-plan-til-brol-aelig-gning-af-det-vestlige-gut-i-charlotte-amalie-p-aring-st-thomas-nivellement-og-snit-1883-tegnet-af-j-",
    "archiveCode": "337 546",
    "title": "Plan til brolægning af det vestlige gut i Charlotte Amalie på St. Thomas, nivellement og snit 1883, tegnet af J. Andersen",
    "shortTitle": "Plan til brolægning af det vestlige gut i Charlotte Amalie på St. Thomas, niv...",
    "island": "st_thomas",
    "yearLabel": "1883",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Elevation / leveling evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283162",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283162",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-546",
      "st_thomas",
      "1883"
    ],
    "bsid": "283162",
    "aoImageId": "55099182",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099182"
  },
  {
    "id": "337-547-forslag-til-gaderegulering-i-charlotte-amalie-p-aring-st-thomas-planer-og-snit-1872-tegnet-af-william-a-thulstrup",
    "archiveCode": "337 547",
    "title": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, planer og snit 1872, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, planer og snit 1872",
    "island": "st_thomas",
    "yearLabel": "1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283163",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283163",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-547",
      "st_thomas",
      "1872"
    ],
    "bsid": "283163",
    "aoImageId": "55099183",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099183"
  },
  {
    "id": "337-548-forslag-til-gaderegulering-i-charlotte-amalie-p-aring-st-thomas-plan-snit-og-nivellement-1874-tegnet-af-william-a-thulst",
    "archiveCode": "337 548",
    "title": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, plan, snit og nivellement 1874, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, plan, snit og nivellem...",
    "island": "st_thomas",
    "yearLabel": "1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Elevation / leveling evidence",
      "Road / street plan",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283164",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283164",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-548",
      "st_thomas",
      "1874"
    ],
    "bsid": "283164",
    "aoImageId": "55099184",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099184"
  },
  {
    "id": "337-549-forslag-til-gaderegulering-i-charlotte-amalie-p-aring-st-thomas-plan-tv-aelig-rprofiler-og-nivelleringer-1872-tegnet-af-",
    "archiveCode": "337 549",
    "title": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, plan, tværprofiler og nivelleringer 1872, tegnet af William A. Thulstrup",
    "shortTitle": "Forslag til gaderegulering i Charlotte Amalie på St. Thomas, plan, tværprofil...",
    "island": "st_thomas",
    "yearLabel": "1872",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "William A. Thulstrup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283165",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283165",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-549",
      "st_thomas",
      "1872"
    ],
    "bsid": "283165",
    "aoImageId": "55099185",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099185"
  },
  {
    "id": "337-551-kort-over-havnen-i-charlotte-amalie-p-aring-st-thomas-planer-for-uddybninger-opm-aring-lt-1906-trykt-1907-tilf-oslash-je",
    "archiveCode": "337 551",
    "title": "Kort over havnen i Charlotte Amalie på St. Thomas, planer for uddybninger Opmålt 1906, trykt 1907, tilføjelser 1909",
    "shortTitle": "havnen i Charlotte Amalie på St. Thomas, planer for uddybninger Opmålt 1906,...",
    "island": "st_thomas",
    "yearLabel": "1906–1909",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence",
      "Harbor evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283166",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283166",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-551",
      "st_thomas",
      "1906-1909"
    ],
    "bsid": "283166",
    "aoImageId": "55099186",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099186"
  },
  {
    "id": "337-552-fyret-p-aring-buck-island-uden-for-indsejlingen-til-havnen-i-charlotte-amalie-p-aring-st-thomas-bl-aring-tryk-af-facader",
    "archiveCode": "337 552",
    "title": "Fyret på Buck Island uden for indsejlingen til havnen i Charlotte Amalie på St. Thomas, blåtryk af facader 1915, formentlig tegnet af Hans Viggo Ravn",
    "shortTitle": "Fyret på Buck Island uden for indsejlingen til havnen i Charlotte Amalie på S...",
    "island": "st_thomas",
    "yearLabel": "1915",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Hans Viggo Ravn",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Harbor evidence",
      "Lighthouse evidence",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283167",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283167",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-552",
      "st_thomas",
      "1915"
    ],
    "bsid": "283167",
    "aoImageId": "55099187",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099187"
  },
  {
    "id": "337-553-bro-ved-long-bay-sidetegning-og-plan-1879-tegnet-af-j-andersen",
    "archiveCode": "337 553",
    "title": "Bro ved Long Bay, sidetegning og plan 1879, tegnet af J. Andersen",
    "shortTitle": "Bro ved Long Bay, sidetegning og plan 1879",
    "island": "all",
    "yearLabel": "1879",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283168",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283168",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-553",
      "all",
      "1879"
    ],
    "bsid": "283168",
    "aoImageId": "55099188",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099188"
  },
  {
    "id": "337-554-plads-oslash-st-for-christiansfort-i-charlotte-amalie-p-aring-st-thomas-1875-tegnet-af-j-andersen",
    "archiveCode": "337 554",
    "title": "Plads øst for Christiansfort i Charlotte Amalie på St. Thomas 1875, tegnet af J. Andersen",
    "shortTitle": "Plads øst for Christiansfort i Charlotte Amalie på St. Thomas 1875",
    "island": "st_thomas",
    "yearLabel": "1875",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283169",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283169",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-554",
      "st_thomas",
      "1875"
    ],
    "bsid": "283169",
    "aoImageId": "55099189",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099189"
  },
  {
    "id": "337-555-kort-over-to-parceller-solgt-fra-ross-estate-p-aring-st-thomas-1877-tegnet-af-j-andersen",
    "archiveCode": "337 555",
    "title": "Kort over to parceller solgt fra Ross Estate på St. Thomas 1877, tegnet af J. Andersen",
    "shortTitle": "to parceller solgt fra Ross Estate på St. Thomas 1877",
    "island": "st_thomas",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "J. Andersen",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283170",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283170",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-555",
      "st_thomas",
      "1877"
    ],
    "bsid": "283170",
    "aoImageId": "55099190",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099190"
  },
  {
    "id": "337-601-plan-til-tilbygning-for-sovestue-i-fort-frederiksv-aelig-rn-i-frederiksted-p-aring-st-croix-1849-tegnet-af-frederik-herm",
    "archiveCode": "337 601",
    "title": "Plan til tilbygning for sovestue i Fort Frederiksværn i Frederiksted på St. Croix 1849, tegnet af Frederik Herman Møller",
    "shortTitle": "Plan til tilbygning for sovestue i Fort Frederiksværn i Frederiksted på St. C...",
    "island": "st_croix",
    "yearLabel": "1849",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Frederik Herman Møller",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283171",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283171",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-601",
      "st_croix",
      "1849"
    ],
    "bsid": "283171",
    "aoImageId": "55099191",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099191"
  },
  {
    "id": "337-608-hospitalet-i-frederiksted-p-aring-st-croix-facader-1851-tegnet-af-frederik-herman-m-oslash-ller",
    "archiveCode": "337 608",
    "title": "Hospitalet i Frederiksted på St. Croix, facader 1851, tegnet af Frederik Herman Møller",
    "shortTitle": "Hospitalet i Frederiksted på St. Croix, facader 1851",
    "island": "st_croix",
    "yearLabel": "1851",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Frederik Herman Møller",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283178",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283178",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-608",
      "st_croix",
      "1851"
    ],
    "bsid": "283178",
    "aoImageId": "55099198",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099198"
  },
  {
    "id": "337-616-jernr-aelig-kv-aelig-rk-til-trappe-ved-ny-vejerbod-i-christiansted-p-aring-st-croix-1856-tegnet-af-christian-ludvig-sche",
    "archiveCode": "337 616",
    "title": "Jernrækværk til trappe ved ny vejerbod i Christiansted på St. Croix 1856, tegnet af Christian Ludvig Schellerup",
    "shortTitle": "Jernrækværk til trappe ved ny vejerbod i Christiansted på St. Croix 1856",
    "island": "st_croix",
    "yearLabel": "1856",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Christian Ludvig Schellerup",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Road / street plan"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283186",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283186",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-616",
      "st_croix",
      "1856"
    ],
    "bsid": "283186",
    "aoImageId": "55099206",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099206"
  },
  {
    "id": "337-619-officerskvarterer-p-aring-kaserne-ubestemt-grundplan-1877-formentlig-tegnet-af-henrik-andreas-raupach",
    "archiveCode": "337 619",
    "title": "Officerskvarterer på kaserne, ubestemt, grundplan 1877, formentlig tegnet af Henrik Andreas Raupach",
    "shortTitle": "Officerskvarterer på kaserne, ubestemt, grundplan 1877, formentlig tegnet af Henrik...",
    "island": "all",
    "yearLabel": "1877",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Henrik Andreas Raupach",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283189",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283189",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-619",
      "all",
      "1877"
    ],
    "bsid": "283189",
    "aoImageId": "55099209",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099209"
  },
  {
    "id": "337-628-christiansv-aelig-rn-fort-i-christiansted-p-aring-st-croix-grundplan-udateret-tegnet-af-alslev",
    "archiveCode": "337 628",
    "title": "Christiansværn Fort i Christiansted på St. Croix, grundplan Udateret, tegnet af Alslev",
    "shortTitle": "Christiansværn Fort i Christiansted på St. Croix, grundplan Udateret",
    "island": "st_croix",
    "yearLabel": "Undated",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Alslev",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283199",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283199",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-628",
      "st_croix",
      "undated"
    ],
    "bsid": "283199",
    "aoImageId": "55099219",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099219"
  },
  {
    "id": "337-632-skitse-til-ubekendt-bygning-facade-udateret-muligvis-udkast-til-kasernen-opf-oslash-rt-1874-i-charlotte-amalie-p-aring-s",
    "archiveCode": "337 632",
    "title": "Skitse til ubekendt bygning, facade Udateret (muligvis udkast til kasernen, opført 1874 i Charlotte Amalie på St. Thomas), tegner uoplyst",
    "shortTitle": "Skitse til ubekendt bygning, facade Udateret (muligvis udkast til kasernen, opført...",
    "island": "st_thomas",
    "yearLabel": "1874",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "Unknown",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Island geography",
      "Architectural drawing"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283203",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283203",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-632",
      "st_thomas",
      "1874"
    ],
    "bsid": "283203",
    "aoImageId": "55099223",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099223"
  },
  {
    "id": "337-701-oversigt-over-guineiske-kort",
    "archiveCode": "337 701",
    "title": "Oversigt over guineiske kort",
    "shortTitle": "Oversigt over guineiske kort",
    "island": "all",
    "yearLabel": "Unknown",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate",
      "Map evidence"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283206",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283206",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-701",
      "all",
      "unknown"
    ],
    "bsid": "283206",
    "aoImageId": "55099226",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099226"
  },
  {
    "id": "337-709-egnen-omkring-kongensten-og-voltaflodens-udl-oslash-b-1849-tegnet-af-h-mossin-efter-w-svedstrups-tegning-1847",
    "archiveCode": "337 709",
    "title": "Egnen omkring Kongensten og Voltaflodens udløb 1849, tegnet af H. Mossin, efter W. Svedstrups tegning 1847",
    "shortTitle": "Egnen omkring Kongensten og Voltaflodens udløb 1849",
    "island": "all",
    "yearLabel": "1847–1849",
    "archive": "Rigsarkivet",
    "collection": "Central Directorate for the Colonies, The Colonial Office: Maps and drawings (West Indies), 1760–1916",
    "creator": "H. Mossin",
    "description": "Rigsarkivet Arkivalieronline catalogue record from Maps and drawings (West Indies).",
    "evidenceUse": [
      "Historic source image",
      "Atlas crosswalk candidate"
    ],
    "status": "identified",
    "sourceUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283212",
    "viewerUrl": "https://arkivalieronline.rigsarkivet.dk/en/billedviser?epid=20104126#283212",
    "tags": [
      "rigsarkivet",
      "west-indies-maps",
      "337-709",
      "all",
      "1847-1849"
    ],
    "bsid": "283212",
    "aoImageId": "55099232",
    "imageUrl": "https://api.rigsarkivet.dk/ao/v1/images/55099232"
  }
] as HistoricMapRecord[];

export function islandName(value: HistoricMapRecord["island"]) {
  if (value === "st_thomas") return "St. Thomas";
  if (value === "st_john") return "St. John";
  if (value === "st_croix") return "St. Croix";
  if (value === "water_island") return "Water Island";
  return "All islands";
}

export function statusLabel(value: HistoricMapStatus) {
  if (value === "identified") return "Identified";
  if (value === "needs-image") return "Needs image";
  if (value === "downloaded") return "Downloaded";
  if (value === "needs-georeference") return "Needs georeference";
  return "Ready";
}
