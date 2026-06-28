export type DictionaryCoordinate = {
  entryId: string;
  sourceName: string;
  lat: number;
  lng: number;
  rawLat: string;
  rawLng: string;
  linkedEstateGeoid: string;
  linkedEstateName: string;
  confidence: number;
  source: "Geographic Dictionary of the Virgin Islands";
  description: string;
};

export function getDictionaryCoordinatesByEstateGeoid(geoid: string) {
  return dictionaryCoordinates.filter((coord) => String(coord.linkedEstateGeoid) === String(geoid));
}

export const dictionaryCoordinates = [
  {
    "entryId": "mary-ridge",
    "sourceName": "Mary Ridge",
    "lat": 18.3725,
    "lng": -64.7475,
    "rawLat": "18 22 21",
    "rawLng": "64 44 51",
    "linkedEstateGeoid": "1982",
    "linkedEstateName": "ANNABERG",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Mary Ridge; Triangulation station, summit of p n i n s u l a ending a t Mary Point. Ridge 1s 578 feet high, 75 mile long; position of summit, lat. 18\" 22' 21. 227\" (652. 6 metere), long. 64\" 44' 51. 534\" (1, 512. 8m. ). --O. R. 73713 I."
  },
  {
    "entryId": "leinster-hill",
    "sourceName": "Leinster Hill",
    "lat": 18.3663889,
    "lng": -64.7130556,
    "rawLat": "18 21 59",
    "rawLng": "64 42 47",
    "linkedEstateGeoid": "1990",
    "linkedEstateName": "BROWNS BAY",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Leinster Hill; 477 feet high, 325 yards from northern coast a t Threudneedle Point, St. John. lat. 18\" 21' 59. 84\" (1839. 7). long. 64\" 42' 47\" (1, 378 m. ). -T. 3783, D. R."
  },
  {
    "entryId": "belier",
    "sourceName": "Belier",
    "lat": 18.3044444,
    "lng": -64.7016667,
    "rawLat": "18 18 16",
    "rawLng": "64 42 06",
    "linkedEstateGeoid": "1625",
    "linkedEstateName": "CONCORDIA A",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Belier; Spanish, Punta Carnero; by Lasscu, \" Sydspidsen af St. Jan. \" Ram Hill: 288 feet high; lat. 18\" 18' 16. 4\" (503. 9 meters), long. 64\" 42' 06. 6\" (103. 8 meters); 540 yicrfls north-nclrtheaut of Ram Heid, Coral-Bay Quarter, S. J. -0. R. 73713 I. Ram'8 Ilcnd: Ram Head, St. John. -P. D. J. : Mort."
  },
  {
    "entryId": "qift-hill",
    "sourceName": "Qift Hill",
    "lat": 18.325,
    "lng": -64.7730556,
    "rawLat": "18 19 30",
    "rawLng": "64 46 23",
    "linkedEstateGeoid": "1988",
    "linkedEstateName": "GIFFT & REGENBACK",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Qift Hill; Summit, altitude 827 feet, lat. 18\" 19' 30\" (1, 201. 4in. ), long. 64\" 46' 23\" (669 m. ), % mlle north of Rendezvous I h y; top of mountain mass 1 mile wide between Bans Gut and Fish Bay, on boundtiry between Cruz Bny and Reef Bny Qunrtcrs, southwest portion of St. John Island. Locally known as Sessman Hill. ."
  },
  {
    "entryId": "white-point",
    "sourceName": "White Point",
    "lat": 18.3161111,
    "lng": -64.7325,
    "rawLat": "18 18 58",
    "rawLng": "64 43 57",
    "linkedEstateGeoid": "1624",
    "linkedEstateName": "REEF BAY",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "White Point; Salient knob, 78 feet high, forming acute angle of southern shore of St. John, between Lameshur Bay and Reef Bay. Q. P. \" L a m \" : lat. 18\" 18' 58'' (1, 787 meters), long. 64\" 43' 57\" (1, 683 meters). Name Lameshur Point, claimable by two other points : this cnlled. White Pynt in eighteenth century; Spanish, Punta Blanca. See \" Wliite Cliffs. \""
  },
  {
    "entryId": "camelberg",
    "sourceName": "Camelberg",
    "lat": 18.3388889,
    "lng": -64.7536111,
    "rawLat": "18 20 20",
    "rawLng": "64 45 13",
    "linkedEstateGeoid": "1623",
    "linkedEstateName": "RUSTENBERG & ADVENTURE",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Camelberg; Peak, 1, 192 feet high; lat. 18\" 20' 20. 19'' (621 m. ); long. 64\" 45' 13. 82\" (406 m. ); near center of St. John Island; conspicuous from sea. Also spelled '' Camel, \" \" Cameelberg, \" \" Kamelberg, \" ''Kamelbjerg, \" and locally known as \"Makombi. \" Air at summit, cool and bracing."
  },
  {
    "entryId": "wave-book",
    "sourceName": "Wave Book",
    "lat": 18.3111111,
    "lng": -64.9533333,
    "rawLat": "18 18 40",
    "rawLng": "64 57 12",
    "linkedEstateGeoid": "1790",
    "linkedEstateName": "WATER ISLAND",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Wave Book; 16 feet high. 16 yards wide: lat. 18\" 18' 40. 3\" (1, 289 m. ), long. 64\" 57' 12\" (381 m. ); at base of &foot cliff and 203-fuot hill, east shore of south end of Water I&nnd. -O. R, 73800-48; T. 3771,"
  },
  {
    "entryId": "wintberg",
    "sourceName": "Wintberg",
    "lat": 18.3494444,
    "lng": -64.9036111,
    "rawLat": "18 20 58",
    "rawLng": "64 54 13",
    "linkedEstateGeoid": "2033",
    "linkedEstateName": "WINTBERG",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Wintberg; Ruined Estate, on col of mnin ridge of St. Thomas, a t 710 feet elevation, lat. 18\" 20' 58\" (1, 776 meters), long. 64\" 54' 13\" (882 meters); 6OQ yards northeast of Wintberg P e a k. 4 R. 73600-49; T. 8771. Leas correctly, Winberg, Windberg. Named for colonial family De Wint; several members on record: Oerd, Ian, Anna, etc."
  },
  {
    "entryId": "mount-fancy",
    "sourceName": "Mount Fancy",
    "lat": 17.725,
    "lng": -64.6402778,
    "rawLat": "17 43 30",
    "rawLng": "64 38 25",
    "linkedEstateGeoid": "1877",
    "linkedEstateName": "GREAT POND",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Mount Fancy; 245 feet high, lat. 17\" 43' 30\" (924 meters), long. 64\" 38' 25\" (729 meters). Con:. icuons double hill, forming east point of Great Pond Bay, southwest of Cottongrove, Eastend A Qr. , 8. coast of St. Oroir. Stock farm attached to Cottongrove. -8corpion."
  },
  {
    "entryId": "sight-mill",
    "sourceName": "Sight Mill",
    "lat": 17.7422222,
    "lng": -64.6688889,
    "rawLat": "17 44 32",
    "rawLng": "64 40 08",
    "linkedEstateGeoid": "1946",
    "linkedEstateName": "MARIENHOJ",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Sight Mill; Prominent object observed by navigntors entering Buck Island Channel, north b? St. Croix. Mill 1s 2% miles east of Christinnsted, in lat. 17\" 44' 32. 01'' (1, 012 meters), long. 64\" 40' 08. 45\" (249 meters), on summit of 180-foot hill commanding view or I' sight \" of both north nnd south coasts, and in sight of mhriners off either: 175 yards east is 200-foot summlt; 260 yards east, 140-foot co1, where road across Island passes gap."
  },
  {
    "entryId": "beverhoudt",
    "sourceName": "Beverhoudt",
    "lat": 17.7444444,
    "lng": -64.6411111,
    "rawLat": "17 44 40",
    "rawLng": "64 38 28",
    "linkedEstateGeoid": "1778",
    "linkedEstateName": "PLEASANT VALLEY",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Beverhoudt; Plantage, either of 2 estntes of General Kriegs-Commissaire Lucas van Beverhoudt; viz : Cottongrove in Eastend, and Work-and-Rest in Company Quarter, St. Croix. -Bellin; Beck. Also spelled Beverhout. I n the northern edge of the Beverhoudt estate, near eastern boundnry of Eastend A Quarter is the highest summit on St. Croix, east of Christians t e d; altitude 850 feet, lat. 17\" 44' 40. 2\" (1, 235 m. ), long. 64\" 38' 28. 8\" (849 m). Van Beverhoudt family &ill resident. -Holst."
  },
  {
    "entryId": "washington",
    "sourceName": "Washington",
    "lat": 17.7444444,
    "lng": -64.6411111,
    "rawLat": "17 44 40",
    "rawLng": "64 38 28",
    "linkedEstateGeoid": "1778",
    "linkedEstateName": "PLEASANT VALLEY",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Washington; 640-foOt peak f40 yards east; FGO-foot peak % mile east, marked G. P. \"Seven\"; 740-foot bench north of last; Pole Hill, 573 feet high, to northwest; and two other summit+ of 554 and 507 feet, respectlvely, on $pur recurving westward. G. P. , \" Seven \"; lat. 17\" 44' 40. 17\" (1, 235meters), long. 64\" 38' 28. 81\" (849 meters)."
  },
  {
    "entryId": "moirnb-f-w-y-hdiall",
    "sourceName": "Moirnb F w y HdIall",
    "lat": 17.7397222,
    "lng": -64.8666667,
    "rawLat": "17 43 83",
    "rawLng": "64 52 00",
    "linkedEstateGeoid": "1731",
    "linkedEstateName": "PUNCH",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Moirnb F w y HdIall; Ridge, 303 feet hfgh, extending noTthntar8 from Mount Fancy Point, St. Croix. Name better restricted to %Ri-foothill at point. Ji&&t4?mw P d n t; Snore foot af Mount Fancy, east of Gireatpomi Bay, St. Croix. Mount Ztagctui~Hill, 393 feet high, lat. 17\" 43'83. 5'' (1, 029m. ), long. 64\"52' 00\" ( 4 m. ), immediately south of Little Lagrange E&ite-village, St, Croix. N&medrfor 6 Mhjor Fibgan, resident proprietor, 80 year8 BgO."
  },
  {
    "entryId": "punch-hill",
    "sourceName": "Punch Hill",
    "lat": 17.7441667,
    "lng": -64.8752778,
    "rawLat": "17 44 39",
    "rawLng": "64 52 31",
    "linkedEstateGeoid": "1658",
    "linkedEstateName": "SPRATT HALL",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Punch Hill; 704 feet high, lat. 17\" 44' 39\" (1, 204meters), long. 64\" 52' 31\" (922 meters); 710 yards west of Punch Mill, on old Sebodker or Soebetker Estate, St. Croix."
  },
  {
    "entryId": "mount-lookout",
    "sourceName": "Mount Lookout",
    "lat": 17.73,
    "lng": -64.8338889,
    "rawLat": "17 43 48",
    "rawLng": "64 50 02",
    "linkedEstateGeoid": "1741",
    "linkedEstateName": "SPRINGFIELD",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Mount Lookout; Ridge rising steeply on eastern side of Prosperity Garden, St. Crdia, and commanding. a Ane view. Peak at western brow rises to 404 feet; another, 3/8 mile northeast, to fbbt. . Name sbportecl espeoially applicable to last: 1 b u n t iMoWilllam; ZZoak. ehaped ridge, with doubIe peak, elevations 763 and 777 feet, latter in lat. 17\" 43' 48. 7\" (1, 403m. ), long. 64\" 50' 02. 0\" (Sa m. ), on bordex of Two-Friendsand St. George Estate$ mi& noshwest of Grove Place, St. Croix. Named in honor of sa prominent and papular resident OP SO years ago. Y0zan. t:Xberg;. Ptdge south of Crequis Valley, in northern edge of Williams"
  },
  {
    "entryId": "canegarden-hill",
    "sourceName": "Canegarden Hill",
    "lat": 17.7072222,
    "lng": -64.8086111,
    "rawLat": "17 42 26",
    "rawLng": "64 48 31",
    "linkedEstateGeoid": "1971",
    "linkedEstateName": "VICORP LAND",
    "confidence": 100,
    "source": "Geographic Dictionary of the Virgin Islands",
    "description": "Canegarden Hill; 120 feet hlgh, lat. 17\" 42' 26. 96\"; long. 64\" 48' 31. 14\"; 330 yards from bay, crowned by Estatehouse, both BO called."
  }
];
