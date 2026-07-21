export type GovernorAuthority =
  | "danish-company"
  | "danish-crown"
  | "british-occupation"
  | "united-states-navy"
  | "united-states-appointed"
  | "usvi-elected";

export type VirginIslandsGovernor = {
  id: string;
  name: string;
  office: string;
  termStart: string;
  termEnd: string | null;
  authority: GovernorAuthority;
  scope: "st_thomas" | "st_thomas_st_john" | "st_croix" | "territory";
  acting?: boolean;
  note?: string;
};

type Row = [
  id: string,
  name: string,
  office: string,
  termStart: string,
  termEnd: string | null,
  authority: GovernorAuthority,
  scope: VirginIslandsGovernor["scope"],
  acting?: boolean,
  note?: string,
];

const rows: Row[] = [
  ["erik-nielsen-smit","Erik Nielsen Smit","Governor of St. Thomas","1665-05-06","1666-06-12","danish-company","st_thomas"],
  ["jesper-hoyer","Jesper Høyer","Acting Governor of St. Thomas","1666-06-16","1667","danish-company","st_thomas",true],
  ["kjeld-jensen-slagelse","Kjeld Jensen Slagelse","Acting Governor of St. Thomas","1667","1668","danish-company","st_thomas",true],
  ["jorgen-iversen-dyppel","Jørgen Iversen Dyppel","Governor of St. Thomas","1672-05-25","1680-07-05","danish-company","st_thomas"],
  ["nicolai-esmit","Nicolai Esmit","Governor of St. Thomas","1680-07-05","1682-11","danish-company","st_thomas"],
  ["adolph-esmit-1","Adolph Esmit","Governor of St. Thomas","1682-11","1684-05-07","danish-company","st_thomas"],
  ["gabriel-milan","Gabriel Milan","Governor of St. Thomas and St. John","1684-05-07","1686-02-27","danish-company","st_thomas_st_john"],
  ["mikkel-mikkelsen","Mikkel Mikkelsen","Interim Governor of St. Thomas and St. John","1686-02-27","1686-06-29","danish-company","st_thomas_st_john",true],
  ["christopher-heins-1","Christopher Heins","Governor of St. Thomas and St. John","1686-06-29","1687-03","danish-company","st_thomas_st_john"],
  ["adolph-esmit-2","Adolph Esmit","Interim Governor of St. Thomas and St. John","1687-03","1688-10","danish-company","st_thomas_st_john",true],
  ["christopher-heins-2","Christopher Heins","Governor of St. Thomas and St. John","1688-10","1689-10","danish-company","st_thomas_st_john"],
  ["johan-lorensen-1","Johan Lorensen","Governor of St. Thomas and St. John","1689-10","1692-09-17","danish-company","st_thomas_st_john"],
  ["frans-de-la-vigne","Frans de la Vigne","Governor of St. Thomas and St. John","1692-09-17","1693-04-07","danish-company","st_thomas_st_john"],
  ["johan-lorensen-2","Johan Lorensen","Governor of St. Thomas and St. John","1693-04-07","1702-02-19","danish-company","st_thomas_st_john"],
  ["claus-hansen","Claus Hansen","Governor of St. Thomas and St. John","1702-02-19","1706-02-08","danish-company","st_thomas_st_john"],
  ["joachim-melchior-von-holten","Joachim Melchior von Holten","Governor of St. Thomas and St. John","1706-02-08","1708-12-21","danish-company","st_thomas_st_john"],
  ["diderich-mogensen","Diderich Mogensen","Interim Governor of St. Thomas and St. John","1708-12-21","1710","danish-company","st_thomas_st_john",true],
  ["mikkel-knudsen-crone","Mikkel Knudsen Crone","Governor of St. Thomas and St. John","1710","1716-08-08","danish-company","st_thomas_st_john"],
  ["erich-bredal","Erich Bredal","Governor of St. Thomas and St. John","1716-08-08","1724-04","danish-company","st_thomas_st_john",false,"St. John was occupied during his administration in 1718."],
  ["friderich-moth-sttj-1","Friderich Moth","Governor of St. Thomas and St. John","1724-04","1727-05","danish-company","st_thomas_st_john"],
  ["hendrich-von-suhm","Hendrich von Suhm","Governor of St. Thomas and St. John","1727-05","1733-02-21","danish-company","st_thomas_st_john"],
  ["phillip-gardelin","Phillip Gardelin","Governor of St. Thomas and St. John","1733-02-21","1736-02-21","danish-company","st_thomas_st_john",false,"The 1733 St. John revolt occurred during his administration."],
  ["frederik-moth-stx","Frederik Moth","Governor of St. Croix","1735","1736","danish-company","st_croix"],
  ["gregers-hoeg-nissen","Gregers Høeg Nissen","Interim Governor of St. Croix","1736","1744","danish-company","st_croix",true],
  ["friderich-moth-sttj-2","Friderich Moth","Governor of St. Thomas and St. John","1736-02-21","1744-04-13","danish-company","st_thomas_st_john"],
  ["jacob-schonemann","Jacob Schönemann","Governor of St. Thomas and St. John","1740","1744","danish-company","st_thomas_st_john"],
  ["poul-jensen-lindemark","Poul Jensen Lindemark","Interim Governor of St. Croix","1744","1747","danish-company","st_croix",true],
  ["christian-von-schweder","Christian von Schweder","Governor of St. Thomas and St. John","1744-04-13","1747-04-25","danish-company","st_thomas_st_john"],
  ["jens-hansen","Jens Hansen","Governor of St. Croix","1747","1751","danish-company","st_croix"],
  ["christian-suhm","Christian Suhm","Governor of St. Thomas and St. John","1747-04-25","1758","danish-company","st_thomas_st_john"],
  ["peter-clausen-stx","Peter Clausen","Governor of St. Croix","1751","1755","danish-company","st_croix"],
  ["christian-leberecht-von-prock","Christian Leberecht von Prøck","Governor-General of the Danish West Indies","1755","1766","danish-crown","territory"],
  ["peter-clausen-2","Peter Clausen","Governor-General of the Danish West Indies","1766","1770","danish-crown","territory"],
  ["frederik-christian-moth","Frederik Christian Moth","Governor-General of the Danish West Indies","1770","1772","danish-crown","territory"],
  ["ulrich-wilhelm-von-roepstorff","Ulrich Wilhelm von Roepstorff","Governor-General of the Danish West Indies","1772","1773","danish-crown","territory"],
  ["henrik-von-schimmelmann-1","Henrik Ludvig Ernst von Schimmelmann","Governor-General of the Danish West Indies","1773","1773","danish-crown","territory"],
  ["peter-clausen-3","Peter Clausen","Governor-General of the Danish West Indies","1773","1784","danish-crown","territory"],
  ["henrik-von-schimmelmann-2","Henrik Ludvig Ernst von Schimmelmann","Governor-General of the Danish West Indies","1784","1787","danish-crown","territory"],
  ["ernst-frederik-von-walterstorff-1","Ernst Frederik von Walterstorff","Governor-General of the Danish West Indies","1787","1794","danish-crown","territory"],
  ["wilhelm-anton-lindemann-1","Wilhelm Anton Lindemann","Governor-General of the Danish West Indies","1794","1796","danish-crown","territory"],
  ["thomas-de-malleville","Thomas de Malleville","Governor-General of the Danish West Indies","1796","1798","danish-crown","territory"],
  ["wilhelm-anton-lindemann-2","Wilhelm Anton Lindemann","Governor-General of the Danish West Indies","1798","1801","danish-crown","territory"],
  ["francis-fuller","Francis Fuller","British Governor during occupation","1801","1802","british-occupation","territory"],
  ["ernst-von-walterstorff-2","Ernst Frederik von Walterstorff","Governor-General of the Danish West Indies","1802","1803","danish-crown","territory"],
  ["balthazar-von-muhlenfels","Balthazar Frederik von Mühlenfels","Governor-General of the Danish West Indies","1802","1807","danish-crown","territory"],
  ["hans-christopher-lillienskjold","Hans Christopher Lillienskjøld","Governor-General of the Danish West Indies","1807","1807","danish-crown","territory"],
  ["henry-bowyer","Henry Bowyer","British Governor during occupation","1807","1808","british-occupation","territory"],
  ["george-william-richard-harcourt","George William Richard Harcourt","British Governor during occupation","1808","1812","british-occupation","territory"],
  ["edward-scott","Edward Scott","Acting British Governor during occupation","1812","1813","british-occupation","territory",true],
  ["george-william-ramsay","George William Ramsay","British Governor during occupation","1813","1815","british-occupation","territory"],
  ["peter-lotharius-von-oxholm","Peter Lotharius von Oxholm","Governor-General of the Danish West Indies","1815","1816","danish-crown","territory"],
  ["johan-von-stabel-1","Johan Henrik Christian von Stabel","Governor-General of the Danish West Indies","1816","1816","danish-crown","territory"],
  ["adrian-benjamin-bentzon","Adrian Benjamin Bentzon","Governor-General of the Danish West Indies","1816","1819","danish-crown","territory"],
  ["johan-von-stabel-2","Johan Henrik Christian von Stabel","Governor-General of the Danish West Indies","1819","1820","danish-crown","territory"],
  ["carl-adolph-rothe","Carl Adolph Rothe","Governor-General of the Danish West Indies","1820","1822","danish-crown","territory"],
  ["johan-frederik-bardenfleth","Johan Frederik Bardenfleth","Governor-General of the Danish West Indies","1822","1827","danish-crown","territory"],
  ["peter-von-scholten-1","Peter Carl Frederik von Scholten","Acting Governor-General of the Danish West Indies","1827","1831","danish-crown","territory",true],
  ["johannes-sobotker-1","Johannes Søbøtker","Acting Governor-General of the Danish West Indies","1831","1832","danish-crown","territory",true],
  ["peter-von-scholten-2","Peter Carl Frederik von Scholten","Acting Governor-General of the Danish West Indies","1832","1834","danish-crown","territory",true],
  ["johannes-sobotker-2","Johannes Søbøtker","Governor-General of the Danish West Indies","1834","1836","danish-crown","territory"],
  ["peter-von-scholten-3","Peter Carl Frederik von Scholten","Governor-General of the Danish West Indies","1836","1848-07-06","danish-crown","territory",false,"Proclaimed emancipation on July 3, 1848."],
  ["frederik-von-oxholm","Frederik von Oxholm","Acting Governor-General of the Danish West Indies","1848","1848","danish-crown","territory",true],
  ["peder-hansen","Peder Hansen","Governor-General of the Danish West Indies","1848","1851","danish-crown","territory"],
  ["hans-ditmar-feddersen","Hans Ditmar Frederik Feddersen","Governor-General of the Danish West Indies","1851","1855","danish-crown","territory"],
  ["johan-frederik-schlegel","Johan Frederik Schlegel","Governor-General of the Danish West Indies","1855","1861","danish-crown","territory"],
  ["wilhelm-ludvig-birch","Wilhelm Ludvig Birch","Governor-General of the Danish West Indies","1861","1871","danish-crown","territory"],
  ["john-christmas","John Christmas","Governor-General of the Danish West Indies","1871","1871","danish-crown","territory"],
  ["frantz-ernst-bille","Frantz Ernst Bille","Acting Governor-General of the Danish West Indies","1871","1872","danish-crown","territory",true],
  ["johan-august-stakeman","Johan August Stakeman","Acting Governor-General of the Danish West Indies","1872","1872","danish-crown","territory",true],
  ["janus-august-garde-1","Janus August Garde","Governor-General of the Danish West Indies","1872","1876","danish-crown","territory"],
  ["carl-hattensen","Carl Anton Frederik Christian Hattensen","Acting Governor-General of the Danish West Indies","1876","1876","danish-crown","territory",true],
  ["janus-august-garde-2","Janus August Garde","Governor-General of the Danish West Indies","1876","1881","danish-crown","territory"],
  ["christian-henrik-arendrup-1","Christian Henrik Arendrup","Governor-General of the Danish West Indies","1881","1884","danish-crown","territory"],
  ["peter-mathias-andersen-1","Peter Mathias Simonsen Andersen","Acting Governor-General of the Danish West Indies","1884","1885","danish-crown","territory",true],
  ["christian-henrik-arendrup-2","Christian Henrik Arendrup","Governor-General of the Danish West Indies","1885","1888","danish-crown","territory"],
  ["peter-mathias-andersen-2","Peter Mathias Simonsen Andersen","Acting Governor-General of the Danish West Indies","1888","1889","danish-crown","territory",true],
  ["christian-henrik-arendrup-3","Christian Henrik Arendrup","Governor-General of the Danish West Indies","1889","1893","danish-crown","territory"],
  ["carl-emil-hedemann","Carl Emil Hedemann","Governor-General of the Danish West Indies","1893","1903","danish-crown","territory"],
  ["herman-august","Herman August","Governor-General of the Danish West Indies","1903","1904","danish-crown","territory"],
  ["frederik-nordlien","Frederik Theodor Martin Mortensen Nordlien","Governor-General of the Danish West Indies","1904","1905","danish-crown","territory"],
  ["christian-thestrup-cold","Christian Magdalus Thestrup Cold","Governor-General of the Danish West Indies","1905","1908","danish-crown","territory"],
  ["peter-carl-limpricht","Peter Carl Limpricht","Governor-General of the Danish West Indies","1908","1911","danish-crown","territory"],
  ["lars-helweg-larsen-1","Lars Christian Helweg-Larsen","Governor-General of the Danish West Indies","1911","1915","danish-crown","territory"],
  ["reimund-baumann","Reimund Baumann","Acting Governor-General of the Danish West Indies","1915","1915","danish-crown","territory",true],
  ["lars-helweg-larsen-2","Lars Christian Helweg-Larsen","Governor-General of the Danish West Indies","1915","1916","danish-crown","territory"],
  ["henning-staerdahl","Henning G. H. Stærdahl","Governor of the Danish West Indies","1916","1917-03-31","danish-crown","territory",false,"Last Danish governor at Transfer."],
  ["henri-konow","Henri Konow","Acting Governor of the Danish West Indies","1916-12","1917-03-31","danish-crown","territory",true,"Assisted with the transfer to U.S. sovereignty."],
  ["edwin-taylor-pollock","Edwin Taylor Pollock","Acting Governor of the U.S. Virgin Islands","1917-03-31","1917-04-20","united-states-navy","territory",true],
  ["james-harrison-oliver","James Harrison Oliver","Naval Governor of the U.S. Virgin Islands","1917-04-20","1919-04-08","united-states-navy","territory"],
  ["joseph-wallace-oman","Joseph Wallace Oman","Naval Governor of the U.S. Virgin Islands","1919-04-08","1921-04-26","united-states-navy","territory"],
  ["sumner-ely-wetmore-kittelle","Sumner Ely Wetmore Kittelle","Naval Governor of the U.S. Virgin Islands","1921-04-26","1922-09-16","united-states-navy","territory"],
  ["henry-hughes-hough","Henry Hughes Hough","Naval Governor of the U.S. Virgin Islands","1922-09-16","1923-12-03","united-states-navy","territory"],
  ["philip-williams","Philip Williams","Naval Governor of the U.S. Virgin Islands","1923-12-03","1925-09-11","united-states-navy","territory"],
  ["martin-edward-trench","Martin Edward Trench","Naval Governor of the U.S. Virgin Islands","1925-09-12","1927-01-06","united-states-navy","territory"],
  ["waldo-a-evans","Waldo A. Evans","Naval Governor of the U.S. Virgin Islands","1927-01-19","1931-03-18","united-states-navy","territory"],
  ["paul-martin-pearson","Paul Martin Pearson","Appointed Civilian Governor of the U.S. Virgin Islands","1931-03-18","1935-07-23","united-states-appointed","territory"],
  ["lawrence-william-cramer","Lawrence William Cramer","Appointed Governor of the U.S. Virgin Islands","1935-08-21","1940-12-14","united-states-appointed","territory"],
  ["charles-harwood","Charles Harwood","Appointed Governor of the U.S. Virgin Islands","1941-02-03","1946-05-17","united-states-appointed","territory"],
  ["william-h-hastie","William H. Hastie","Appointed Governor of the U.S. Virgin Islands","1946-05-17","1949-10-21","united-states-appointed","territory",false,"First Black governor of the U.S. Virgin Islands."],
  ["morris-f-de-castro","Morris Fidanque de Castro","Appointed Governor of the U.S. Virgin Islands","1949-10-21","1954-04-09","united-states-appointed","territory",false,"First native-born Virgin Islander to serve as governor."],
  ["archie-alexander","Archie Alexander","Appointed Governor of the U.S. Virgin Islands","1954-04-09","1955-08-18","united-states-appointed","territory"],
  ["walter-a-gordon","Walter A. Gordon","Appointed Governor of the U.S. Virgin Islands","1955-10-17","1958-09-25","united-states-appointed","territory"],
  ["john-david-merwin","John David Merwin","Appointed Governor of the U.S. Virgin Islands","1958-09-25","1961-04-05","united-states-appointed","territory"],
  ["ralph-m-paiewonsky","Ralph Moses Paiewonsky","Appointed Governor of the U.S. Virgin Islands","1961-04-05","1969-02-12","united-states-appointed","territory"],
  ["cyril-e-king-acting","Cyril E. King","Acting Governor of the U.S. Virgin Islands","1969-02-12","1969-07-01","united-states-appointed","territory",true],
  ["melvin-h-evans-appointed","Melvin H. Evans","Appointed Governor of the U.S. Virgin Islands","1969-07-01","1971-01-04","united-states-appointed","territory"],
  ["melvin-h-evans-elected","Melvin H. Evans","1st Elected Governor of the U.S. Virgin Islands","1971-01-04","1975-01-06","usvi-elected","territory",false,"Won the first popular gubernatorial election held November 3, 1970."],
  ["cyril-e-king-elected","Cyril E. King","2nd Elected Governor of the U.S. Virgin Islands","1975-01-06","1978-01-02","usvi-elected","territory",false,"Died in office; Lieutenant Governor Juan F. Luis succeeded him."],
  ["juan-f-luis","Juan Francisco Luis","3rd Elected Governor of the U.S. Virgin Islands","1978-01-02","1987-01-05","usvi-elected","territory"],
  ["alexander-a-farrelly","Alexander A. Farrelly","4th Elected Governor of the U.S. Virgin Islands","1987-01-05","1995-01-02","usvi-elected","territory"],
  ["roy-l-schneider","Roy Lester Schneider","5th Elected Governor of the U.S. Virgin Islands","1995-01-02","1999-01-04","usvi-elected","territory"],
  ["charles-w-turnbull","Charles Wesley Turnbull","6th Elected Governor of the U.S. Virgin Islands","1999-01-04","2007-01-01","usvi-elected","territory"],
  ["john-p-de-jongh-jr","John P. de Jongh Jr.","7th Elected Governor of the U.S. Virgin Islands","2007-01-01","2015-01-05","usvi-elected","territory"],
  ["kenneth-e-mapp","Kenneth E. Mapp","8th Elected Governor of the U.S. Virgin Islands","2015-01-05","2019-01-07","usvi-elected","territory"],
  ["albert-bryan-jr","Albert Bryan Jr.","9th Elected Governor of the U.S. Virgin Islands","2019-01-07",null,"usvi-elected","territory"],
];

export const VIRGIN_ISLANDS_GOVERNORS: VirginIslandsGovernor[] = rows.map(
  ([id, name, office, termStart, termEnd, authority, scope, acting, note]) => ({
    id,
    name,
    office,
    termStart,
    termEnd,
    authority,
    scope,
    ...(acting ? { acting: true } : {}),
    ...(note ? { note } : {}),
  }),
);

export const GOVERNOR_AUTHORITIES: Array<{
  id: GovernorAuthority | "all";
  label: string;
}> = [
  { id: "all", label: "All administrations" },
  { id: "danish-company", label: "Danish company" },
  { id: "danish-crown", label: "Danish Crown" },
  { id: "british-occupation", label: "British occupation" },
  { id: "united-states-navy", label: "U.S. Navy" },
  { id: "united-states-appointed", label: "Appointed civilian" },
  { id: "usvi-elected", label: "Elected governors" },
];

export const GOVERNOR_SOURCES = [
  "https://www.archives.gov/research/guide-fed-records/groups/055.html",
  "https://www.heritage.vi/governors-of-the-virgin-islands/",
  "https://www.nga.org/states/virgin-islands/",
  "https://www.law.cornell.edu/uscode/text/48/1591",
  "https://www.worldstatesmen.org/Virgin_Islands.html",
] as const;
