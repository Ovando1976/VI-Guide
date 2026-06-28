export type HistoricalKnowledgeType =
  | "place"
  | "person"
  | "company"
  | "ship"
  | "infrastructure"
  | "event"
  | "occupation"
  | "law"
  | "industry"
  | "document"
  | "navigation"
  | "labor"
  | "economic_shift";

export type HistoricalKnowledgeRecord = {
  id: string;
  title: string;
  type: HistoricalKnowledgeType;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  relatedPlaces: string[];
  dateRange?: string;
  summary: string;
  significance: string;
  relatedIds: string[];
  searchTerms: string[];
  source: {
    title: string;
    author: string;
    publication: string;
    year: number;
    pages: string;
  };
};

const sourceBase = {
  title:
    "Management of the Port of Saint Thomas, Danish West Indies, during the Nineteenth and Early Twentieth Centuries",
  author: "Erik Goebel",
  publication: "The Northern Mariner / Le Marin du nord",
  year: 1997,
};

export const stThomasPortKnowledge: HistoricalKnowledgeRecord[] = [
  {
    id: "stt-port-charlotte-amalie-harbor",
    title: "Charlotte Amalie Harbor",
    type: "place",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie", "Hassel Island", "Longbay", "Buck Island"],
    dateRange: "1800s–1917",
    summary:
      "Charlotte Amalie Harbor was one of the Caribbean’s most important ports during the Danish colonial period. Its natural harbor, free-port status, coaling stations, repair facilities, floating dock, and steamship traffic made St. Thomas a major maritime hub.",
    significance:
      "The harbor shaped the economy and identity of St. Thomas and helped earn the island the title 'Emporium of the Antilles.'",
    relatedIds: [
      "stt-port-free-port-status",
      "stt-port-harbour-master",
      "stt-port-coaling-industry",
      "stt-port-floating-dock",
      "stt-port-west-indian-company",
    ],
    searchTerms: [
      "Charlotte Amalie Harbor",
      "St. Thomas Harbor",
      "Emporium of the Antilles",
      "Danish West Indies port",
    ],
    source: { ...sourceBase, pages: "45-46" },
  },
  {
    id: "stt-port-free-port-status",
    title: "Free Port Status of St. Thomas",
    type: "law",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1764–1917",
    summary:
      "St. Thomas operated as a free port, allowing ships of many nations to call and trade. Customs supervision was reduced over time, and low duties helped attract international shipping.",
    significance:
      "Free-port status was one of the main reasons St. Thomas became a regional trading and shipping center.",
    relatedIds: ["stt-port-charlotte-amalie-harbor", "stt-port-harbour-board-1906"],
    searchTerms: ["free port", "customs", "trade", "transit duty", "Danish free port"],
    source: { ...sourceBase, pages: "46" },
  },
  {
    id: "stt-port-harbour-master",
    title: "Harbour Master of St. Thomas",
    type: "occupation",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1803–1917",
    summary:
      "The Harbour Master handled daily port operations, assigned anchorages, inspected vessels, forwarded customs papers, supervised ballast disposal, monitored quarantine rules, and maintained order in the harbor.",
    significance:
      "This office was central to keeping St. Thomas functional as a busy international harbor.",
    relatedIds: [
      "stt-port-carl-gottlieb-fleischer",
      "stt-port-levin-joergen-rohde",
      "stt-port-pilot-service",
      "stt-port-quarantine",
      "stt-port-harbor-boatmen",
    ],
    searchTerms: ["Harbour Master", "Harbor Master", "port official", "anchorage", "quarantine"],
    source: { ...sourceBase, pages: "46-48" },
  },
  {
    id: "stt-port-carl-gottlieb-fleischer",
    title: "Carl Gottlieb Fleischer",
    type: "person",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1803–1800s",
    summary:
      "Carl Gottlieb Fleischer was the first Harbour Master of St. Thomas after the post was established by Governor General Frederik von Walterstorff.",
    significance:
      "His appointment marked the beginning of formal harbor management in St. Thomas.",
    relatedIds: ["stt-port-harbour-master", "stt-port-frederik-von-walterstorff"],
    searchTerms: ["Carl Gottlieb Fleischer", "first Harbour Master"],
    source: { ...sourceBase, pages: "46" },
  },
  {
    id: "stt-port-frederik-von-walterstorff",
    title: "Frederik von Walterstorff",
    type: "person",
    island: "st_thomas",
    relatedPlaces: ["Danish West Indies", "Charlotte Amalie Harbor"],
    dateRange: "1803",
    summary:
      "Governor General Frederik von Walterstorff established the Harbour Master post in 1803.",
    significance:
      "This decision created a formal system for regulating harbor order, ballast, quarantine, vessel inspection, and port activity.",
    relatedIds: ["stt-port-harbour-master", "stt-port-carl-gottlieb-fleischer"],
    searchTerms: ["Frederik von Walterstorff", "Governor General", "Harbour Master established"],
    source: { ...sourceBase, pages: "46" },
  },
  {
    id: "stt-port-levin-joergen-rohde",
    title: "Levin Joergen Rohde",
    type: "person",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1821–1854",
    summary:
      "Levin Joergen Rohde was a naval officer and Harbour Master of St. Thomas. His large personal perquisites became controversial, and he was dismissed in 1854 after refusing a reduction.",
    significance:
      "His case shows how profitable the Harbour Master position once was and how port revenue reforms shifted earnings into the public purse.",
    relatedIds: ["stt-port-harbour-master", "stt-port-harbour-master-fees"],
    searchTerms: ["Levin Joergen Rohde", "Harbour Master fees", "perquisites"],
    source: { ...sourceBase, pages: "47" },
  },
  {
    id: "stt-port-harbour-master-fees",
    title: "Harbour Master Fees and Perquisites",
    type: "economic_shift",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "The Harbour Master originally earned considerable personal income from vessel fees. Later reforms replaced this with fixed salaries and redirected fees into public revenue.",
    significance:
      "This reflects the modernization of port administration and a move away from personal fee-based colonial offices.",
    relatedIds: ["stt-port-harbour-master", "stt-port-levin-joergen-rohde"],
    searchTerms: ["perquisites", "harbor dues", "port fees", "Harbour Master salary"],
    source: { ...sourceBase, pages: "47-48" },
  },
  {
    id: "stt-port-pilot-service",
    title: "Pilot Service of St. Thomas Harbor",
    type: "navigation",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s–1917",
    summary:
      "Harbour assistants piloted vessels in and out of the harbor. Pilotage was optional, but many arriving square-riggers used local pilots.",
    significance:
      "Pilot service helped vessels safely navigate the harbor and supported St. Thomas’s reputation as a reliable port of call.",
    relatedIds: ["stt-port-harbour-master", "stt-port-scorpion-rock", "stt-port-rupert-rock"],
    searchTerms: ["pilotage", "pilots", "harbor navigation", "square-riggers"],
    source: { ...sourceBase, pages: "51" },
  },
  {
    id: "stt-port-harbor-boatmen",
    title: "Harbor Boatmen of St. Thomas",
    type: "labor",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "Licensed harbor boatmen transported passengers and goods between shore and vessels anchored in the harbor. Before emancipation, many of these boats were operated by enslaved workers.",
    significance:
      "The boat service was one of the everyday systems that made the harbor efficient and internationally respected.",
    relatedIds: ["stt-port-harbour-master", "stt-port-dock-laborers"],
    searchTerms: ["boatmen", "bumboats", "ferryboats", "harbor transport", "St. Thomas H.M."],
    source: { ...sourceBase, pages: "48" },
  },
  {
    id: "stt-port-dock-laborers",
    title: "Dock Laborers of St. Thomas Harbor",
    type: "labor",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "Dock laborers required permits from the police to work in the harbor and were identified by numbered plates. Coal laborers were treated differently from other harbor workers.",
    significance:
      "The labor permit system shows how port labor was regulated and controlled in the Danish colonial harbor economy.",
    relatedIds: ["stt-port-harbor-boatmen", "stt-port-coal-women"],
    searchTerms: ["dock laborers", "harbor workers", "permits", "labor regulation"],
    source: { ...sourceBase, pages: "48" },
  },
  {
    id: "stt-port-vice-gouverneur-berg",
    title: "Vice Gouverneur Berg",
    type: "ship",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1864–1883",
    summary:
      "Vice Gouverneur Berg was an iron screw tugboat built in Copenhagen in 1864. After service with the Royal Danish Navy, it was sent to St. Thomas and used in and around the harbor until 1883.",
    significance:
      "The tugboat reflects the modernization of St. Thomas harbor infrastructure during the steam era.",
    relatedIds: ["stt-port-hans-henrik-berg", "stt-port-harbour-vessels"],
    searchTerms: ["Vice Gouverneur Berg", "tugboat", "Baumgarten and Burmeister", "steam tug"],
    source: { ...sourceBase, pages: "48-50" },
  },
  {
    id: "stt-port-hans-henrik-berg",
    title: "Hans Henrik Berg",
    type: "person",
    island: "st_thomas",
    relatedPlaces: ["Danish West Indies", "Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "Hans Henrik Berg was a prominent official in St. Thomas. The tugboat Vice Gouverneur Berg was named after him after his death.",
    significance:
      "His name remained attached to one of the harbor’s important nineteenth-century service vessels.",
    relatedIds: ["stt-port-vice-gouverneur-berg"],
    searchTerms: ["Hans Henrik Berg", "Vice Gouverneur Berg"],
    source: { ...sourceBase, pages: "49" },
  },
  {
    id: "stt-port-muehlenfels-point-lighthouse",
    title: "Muehlenfels Point Lighthouse",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Muehlenfels Point", "Charlotte Amalie Harbor"],
    dateRange: "1844–1917",
    summary:
      "A light was first lit at Muehlenfels Point in 1844 at the eastern entrance of the harbor. It was later replaced and upgraded, including a stronger flash light in 1912.",
    significance:
      "The light helped guide vessels into one of the busiest harbors in the Caribbean.",
    relatedIds: ["stt-port-buck-island-lighthouse", "stt-port-navigation-aids"],
    searchTerms: ["Muehlenfels Point", "lighthouse", "harbor light", "approach beacon"],
    source: { ...sourceBase, pages: "49-50" },
  },
  {
    id: "stt-port-buck-island-lighthouse",
    title: "Buck Island Lighthouse",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Buck Island", "Charlotte Amalie Harbor"],
    dateRange: "1916",
    summary:
      "A lighthouse on Buck Island was put into service in August 1916, with a flash light visible for twenty-three nautical miles.",
    significance:
      "The Buck Island light improved maritime approach safety shortly before the 1917 transfer to the United States.",
    relatedIds: ["stt-port-muehlenfels-point-lighthouse", "stt-port-navigation-aids"],
    searchTerms: ["Buck Island Lighthouse", "flash light", "navigation"],
    source: { ...sourceBase, pages: "49" },
  },
  {
    id: "stt-port-navigation-aids",
    title: "Navigation Aids of St. Thomas Harbor",
    type: "navigation",
    island: "st_thomas",
    relatedPlaces: ["Scorpion Rock", "Rupert Rock", "Muehlenfels Point", "Longbay"],
    dateRange: "1800s–1917",
    summary:
      "Navigation aids included buoys, beacons, range lights, warping rings, mooring anchors, and lighthouse systems around the harbor entrance and basin.",
    significance:
      "These aids made the harbor safer for large commercial vessels and steamship lines.",
    relatedIds: [
      "stt-port-scorpion-rock",
      "stt-port-rupert-rock",
      "stt-port-muehlenfels-point-lighthouse",
    ],
    searchTerms: ["buoys", "beacons", "range lights", "mooring anchors", "warping rings"],
    source: { ...sourceBase, pages: "49-51" },
  },
  {
    id: "stt-port-scorpion-rock",
    title: "Scorpion Rock",
    type: "place",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "Scorpion Rock was a navigational hazard in or near the harbor approach. Marker systems and later range lights helped ships pass safely east of it.",
    significance:
      "The rock appears repeatedly in harbor management history because safe navigation around it was essential for large vessels.",
    relatedIds: ["stt-port-navigation-aids", "stt-port-pilot-service"],
    searchTerms: ["Scorpion Rock", "harbor hazard", "range lights"],
    source: { ...sourceBase, pages: "49-51" },
  },
  {
    id: "stt-port-rupert-rock",
    title: "Rupert Rock",
    type: "place",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s",
    summary:
      "Rupert Rock was one of the harbor hazards referenced in the placement of buoys, beacons, and range lights.",
    significance:
      "It was part of the navigational geography that shaped harbor safety planning.",
    relatedIds: ["stt-port-navigation-aids", "stt-port-pilot-service"],
    searchTerms: ["Rupert Rock", "Prince Rupert Rock", "navigation hazard"],
    source: { ...sourceBase, pages: "49-51" },
  },
  {
    id: "stt-port-dredging-programs",
    title: "Dredging of St. Thomas Harbor",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor", "Longbay", "Hassel Island"],
    dateRange: "1850s–1913",
    summary:
      "The harbor basin gradually lost depth, leading to major dredging and blasting programs. Work included removing reefs, shoals, mud, coral, and rock to support larger steamers.",
    significance:
      "Dredging was essential to keeping St. Thomas competitive as steamships grew larger and required deeper water.",
    relatedIds: [
      "stt-port-carmichael-osgood-excavator",
      "stt-port-standard-dredging-company",
      "stt-port-baumgarten-burmeister",
    ],
    searchTerms: ["dredging", "harbor deepening", "shoals", "coral rock", "steam dredger"],
    source: { ...sourceBase, pages: "51-54" },
  },
  {
    id: "stt-port-carmichael-osgood-excavator",
    title: "Carmichael and Osgood Underwater Excavator",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1850s",
    summary:
      "Carmichael and Osgood proposed a steam-powered underwater excavator that could remove large quantities of material from the harbor basin.",
    significance:
      "The proposal shows the scale of the harbor’s depth problem and the technological options considered in the mid-nineteenth century.",
    relatedIds: ["stt-port-dredging-programs"],
    searchTerms: ["Carmichael and Osgood", "underwater excavator", "steam dredger"],
    source: { ...sourceBase, pages: "52" },
  },
  {
    id: "stt-port-baumgarten-burmeister",
    title: "Baumgarten and Burmeister",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Copenhagen", "Charlotte Amalie Harbor"],
    dateRange: "1860s",
    summary:
      "Baumgarten and Burmeister of Copenhagen built harbor equipment for St. Thomas, including the tug Vice Gouverneur Berg, a steam dredger, lighters, and a diving bell.",
    significance:
      "The company connected Danish engineering directly to the modernization of St. Thomas Harbor.",
    relatedIds: [
      "stt-port-vice-gouverneur-berg",
      "stt-port-dredging-programs",
      "stt-port-diving-bell",
    ],
    searchTerms: ["Baumgarten and Burmeister", "Copenhagen shipyard", "dredger", "tugboat"],
    source: { ...sourceBase, pages: "48-54" },
  },
  {
    id: "stt-port-diving-bell",
    title: "Floating Diving Bell",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1865",
    summary:
      "A floating diving bell built by Baumgarten and Burmeister arrived in St. Thomas in 1865 and allowed work at depths up to twenty-four feet.",
    significance:
      "It supported underwater harbor improvement work during the dredging and blasting era.",
    relatedIds: ["stt-port-baumgarten-burmeister", "stt-port-dredging-programs"],
    searchTerms: ["diving bell", "underwater work", "Maillefert system"],
    source: { ...sourceBase, pages: "53" },
  },
  {
    id: "stt-port-standard-dredging-company",
    title: "Standard Dredging Company",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor", "Wilmington Delaware"],
    dateRange: "1910–1912",
    summary:
      "The American Standard Dredging Company contracted to deepen a defined section of St. Thomas Harbor to thirty feet below low-water mark.",
    significance:
      "Its work formed part of the final major harbor improvement efforts under Danish rule.",
    relatedIds: ["stt-port-dredging-programs"],
    searchTerms: ["Standard Dredging Company", "Mascot dredge", "Chief tug", "harbor deepening"],
    source: { ...sourceBase, pages: "54" },
  },
  {
    id: "stt-port-marine-repairing-slip",
    title: "Saint Thomas Marine Repairing Slip",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Hassel Island", "Charlotte Amalie Harbor"],
    dateRange: "1843–1900s",
    summary:
      "The Saint Thomas Marine Repairing Slip opened on Hassel Island in 1843 and used steam-powered machinery to haul vessels for repair.",
    significance:
      "It was one of the harbor’s earliest major industrial facilities and helped make St. Thomas attractive to Royal Mail and other steamship operators.",
    relatedIds: [
      "stt-port-royal-mail-steam-packet-company",
      "stt-port-floating-dock",
      "stt-port-hassel-island",
    ],
    searchTerms: ["Marine Repairing Slip", "Hassel Island", "ship repair", "marine railway"],
    source: { ...sourceBase, pages: "54" },
  },
  {
    id: "stt-port-floating-dock",
    title: "Floating Dock of St. Thomas",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Hassel Island", "Careening Cove", "Charlotte Amalie Harbor"],
    dateRange: "1867–1918",
    summary:
      "The iron floating dock served large vessels in St. Thomas Harbor. Though its first trial in 1867 failed and hurricanes delayed success, it later became a major repair facility.",
    significance:
      "From 1875 to 1918, it lifted more than 1,100 large ships and strengthened St. Thomas’s role as a repair center.",
    relatedIds: [
      "stt-port-floating-dock-company",
      "stt-port-st-thomas-dock-engineering-coaling-company",
      "stt-port-marine-repairing-slip",
    ],
    searchTerms: ["floating dock", "Careening Cove", "ship repair", "Hassel Island"],
    source: { ...sourceBase, pages: "55-56" },
  },
  {
    id: "stt-port-floating-dock-company",
    title: "Floating Dock Company of Saint Thomas",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Hassel Island", "Careening Cove"],
    dateRange: "1863–1900",
    summary:
      "The Floating Dock Company of Saint Thomas operated the floating dock under concession and later received a twenty-one-year monopoly in 1897.",
    significance:
      "The company controlled one of the most valuable repair facilities in the harbor.",
    relatedIds: ["stt-port-floating-dock", "stt-port-st-thomas-dock-engineering-coaling-company"],
    searchTerms: ["Floating Dock Company", "dock monopoly", "Careening Cove"],
    source: { ...sourceBase, pages: "55-56" },
  },
  {
    id: "stt-port-st-thomas-dock-engineering-coaling-company",
    title: "Saint Thomas Dock, Engineering and Coaling Company Ltd.",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Hassel Island", "Charlotte Amalie Harbor"],
    dateRange: "1900–1918",
    summary:
      "After taking over Royal Mail’s wharf and factory on Hassel Island in 1900, the combined operation became known as Saint Thomas Dock, Engineering and Coaling Company Ltd.",
    significance:
      "It represented the merger of repair, engineering, wharf, and coaling services into a major industrial harbor enterprise.",
    relatedIds: ["stt-port-floating-dock", "stt-port-royal-mail-steam-packet-company"],
    searchTerms: ["Saint Thomas Dock Engineering and Coaling Company", "Hassel Island factory"],
    source: { ...sourceBase, pages: "56" },
  },
  {
    id: "stt-port-coaling-industry",
    title: "Coaling Industry of St. Thomas",
    type: "industry",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor", "Longbay", "Hassel Island"],
    dateRange: "1823–1917",
    summary:
      "Coal became a major commodity after steamships began calling at St. Thomas. Coaling depots served British, German, French, Danish, and other international steamship lines.",
    significance:
      "Coaling shifted the harbor economy toward bunkering, provisioning, and ship repair.",
    relatedIds: [
      "stt-port-coal-women",
      "stt-port-royal-mail-steam-packet-company",
      "stt-port-hamburg-american-packet-company",
      "stt-port-broendsted-and-co",
      "stt-port-west-indian-coal-depot",
    ],
    searchTerms: ["coaling", "coal depot", "bunkering", "steamships", "coal wharves"],
    source: { ...sourceBase, pages: "56-57" },
  },
  {
    id: "stt-port-coal-women",
    title: "Coal Women of St. Thomas",
    type: "labor",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s–early 1900s",
    summary:
      "The coal women carried baskets of coal on their heads from shore to steamers, often singing while they worked. Their speed and endurance made rapid coaling possible.",
    significance:
      "They were essential workers in St. Thomas’s steamship economy and remain one of the most important labor groups in the island’s maritime history.",
    relatedIds: ["stt-port-coaling-industry", "stt-port-dock-laborers"],
    searchTerms: ["coal women", "coal carriers", "women laborers", "coaling songs"],
    source: { ...sourceBase, pages: "56" },
  },
  {
    id: "stt-port-royal-mail-steam-packet-company",
    title: "Royal Mail Steam Packet Company",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor", "Hassel Island"],
    dateRange: "1851–1870",
    summary:
      "The Royal Mail Steam Packet Company maintained its Caribbean headquarters in St. Thomas from 1851 to 1870 and used the harbor’s repair, coaling, and docking facilities.",
    significance:
      "Royal Mail’s presence confirmed St. Thomas’s importance as a regional steamship hub.",
    relatedIds: [
      "stt-port-marine-repairing-slip",
      "stt-port-floating-dock",
      "stt-port-coaling-industry",
    ],
    searchTerms: ["Royal Mail", "Royal Mail Steam Packet Company", "steamship headquarters"],
    source: { ...sourceBase, pages: "45-46, 54-56" },
  },
  {
    id: "stt-port-hamburg-american-packet-company",
    title: "Hamburg-American Packet Company",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1873–1914",
    summary:
      "The Hamburg-American Packet Company maintained Caribbean headquarters in St. Thomas from 1873 to 1914.",
    significance:
      "Its presence demonstrates the harbor’s international importance and St. Thomas’s connection to German transatlantic shipping.",
    relatedIds: ["stt-port-coaling-industry", "stt-port-charlotte-amalie-harbor"],
    searchTerms: ["Hamburg-American", "German steamship", "Hamburg-American Packet Company"],
    source: { ...sourceBase, pages: "45" },
  },
  {
    id: "stt-port-broendsted-and-co",
    title: "Broendsted and Co.",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s–early 1900s",
    summary:
      "Broendsted and Co. operated major coal wharves in St. Thomas and advertised high-quality steam coal for supplying vessels.",
    significance:
      "The firm was part of the harbor’s coaling infrastructure that served international steamship traffic.",
    relatedIds: ["stt-port-coaling-industry", "stt-port-west-indian-coal-depot"],
    searchTerms: ["Broendsted", "Broendsted and Co", "coal wharf", "steam coal"],
    source: { ...sourceBase, pages: "56-57" },
  },
  {
    id: "stt-port-west-indian-coal-depot",
    title: "West Indian Coal Depot",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s–early 1900s",
    summary:
      "The West Indian Coal Depot was described as one of the largest and best-equipped coaling depots in the West Indies, with capacity to store large quantities of coal and coal multiple steamers.",
    significance:
      "It helped make St. Thomas a major bunkering station for steamships.",
    relatedIds: ["stt-port-coaling-industry", "stt-port-broendsted-and-co"],
    searchTerms: ["West Indian Coal Depot", "coal depot", "steam coal", "bunkering"],
    source: { ...sourceBase, pages: "57" },
  },
  {
    id: "stt-port-harbour-board-1906",
    title: "Harbour Board of St. Thomas",
    type: "law",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1906–1917",
    summary:
      "A 1906 law reorganized St. Thomas Harbor administration under a local Harbour Board, chaired by the Governor and overseen by the Minister of Finance in Copenhagen.",
    significance:
      "The reform attempted to make the harbor more efficient and commercially competitive after failed Danish attempts to sell the islands to the United States.",
    relatedIds: ["stt-port-free-port-status", "stt-port-west-indian-company"],
    searchTerms: ["Harbour Board", "1906 law", "port administration", "Danish reforms"],
    source: { ...sourceBase, pages: "57-58" },
  },
  {
    id: "stt-port-west-indian-company",
    title: "West Indian Company",
    type: "company",
    island: "st_thomas",
    relatedPlaces: ["Longbay", "Charlotte Amalie Harbor"],
    dateRange: "1912–1993",
    summary:
      "The West Indian Company was organized in 1912 as an offspring of the Danish East Asiatic Company and completed major harbor works in Longbay in 1916.",
    significance:
      "Its pier, coal capacity, oil tanks, warehouses, power plant, and machine shop represented one of the largest private harbor investments in Danish St. Thomas.",
    relatedIds: ["stt-port-longbay-pier", "stt-port-harbour-board-1906"],
    searchTerms: ["West Indian Company", "WICO", "Longbay", "Danish East Asiatic Company"],
    source: { ...sourceBase, pages: "57-58" },
  },
  {
    id: "stt-port-longbay-pier",
    title: "West Indian Company Longbay Pier",
    type: "infrastructure",
    island: "st_thomas",
    relatedPlaces: ["Longbay", "Charlotte Amalie Harbor"],
    dateRange: "1916",
    summary:
      "The West Indian Company completed a major pier at Longbay in 1916, with deep water, coal storage, conveyors, warehouses, oil tanks, water supply, power plant, machine shop, lighters, and waterboats.",
    significance:
      "This was one of the most ambitious modern harbor projects in St. Thomas before the U.S. transfer.",
    relatedIds: ["stt-port-west-indian-company"],
    searchTerms: ["Longbay pier", "WICO pier", "coal conveyors", "oil tanks", "harbor works"],
    source: { ...sourceBase, pages: "57-58" },
  },
  {
    id: "stt-port-1917-transfer",
    title: "Transfer of the Danish West Indies to the United States",
    type: "event",
    island: "st_thomas",
    relatedPlaces: ["Danish West Indies", "Charlotte Amalie Harbor"],
    dateRange: "1917",
    summary:
      "The Danish West Indies, including St. Thomas, St. John, and St. Croix, were transferred to the United States on March 31, 1917.",
    significance:
      "The transfer ended Danish rule and preserved certain harbor concessions, including rights granted to the West Indian Company.",
    relatedIds: ["stt-port-west-indian-company", "stt-port-charlotte-amalie-harbor"],
    searchTerms: ["1917 transfer", "Danish West Indies", "United States Virgin Islands", "WICO concession"],
    source: { ...sourceBase, pages: "58" },
  },
  {
    id: "stt-port-economic-transition",
    title: "Economic Transition of St. Thomas Harbor",
    type: "economic_shift",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1800s–early 1900s",
    summary:
      "St. Thomas shifted from profitable transit trade to commission business and later to bunkering, provisioning, and ship repair.",
    significance:
      "This transition explains the changing role of the harbor and the decline of St. Thomas as steamship routes, engines, telegraphs, and Caribbean competition evolved.",
    relatedIds: [
      "stt-port-coaling-industry",
      "stt-port-floating-dock",
      "stt-port-panama-canal-impact",
    ],
    searchTerms: ["transit trade", "commission business", "bunkering", "economic decline"],
    source: { ...sourceBase, pages: "46, 59" },
  },
  {
    id: "stt-port-panama-canal-impact",
    title: "Panama Canal Impact on St. Thomas Harbor",
    type: "economic_shift",
    island: "st_thomas",
    relatedPlaces: ["Charlotte Amalie Harbor"],
    dateRange: "1914–early 1900s",
    summary:
      "The opening of the Panama Canal did not benefit St. Thomas as expected. Steamers increasingly bypassed the harbor.",
    significance:
      "The canal, improved steam engines, telegraphs, and competition from other Caribbean ports contributed to the decline of St. Thomas’s maritime economy.",
    relatedIds: ["stt-port-economic-transition", "stt-port-charlotte-amalie-harbor"],
    searchTerms: ["Panama Canal", "steamship routes", "harbor decline", "bypassed St. Thomas"],
    source: { ...sourceBase, pages: "59" },
  },
];

export function getStThomasPortRecordById(id: string) {
  return stThomasPortKnowledge.find((record) => record.id === id) ?? null;
}

export function searchStThomasPortKnowledge(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return stThomasPortKnowledge;

  return stThomasPortKnowledge.filter((record) => {
    const haystack = [
      record.title,
      record.type,
      record.summary,
      record.significance,
      ...record.relatedPlaces,
      ...record.searchTerms,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}