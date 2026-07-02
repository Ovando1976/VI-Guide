import fs from "node:fs";

export type GeographicDictionaryEntry = {
  id?: string;
  name?: string;
  type?: string;
  island?: string;
  islands?: string[];
  description?: string;
  coordinates?: any;
  [key: string]: any;
};

const file = new URL("./vi-dictionary.json", import.meta.url);
const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "[]";

export const dictionaryEntries = JSON.parse(raw) as GeographicDictionaryEntry[];
export const geographicDictionaryEntries = dictionaryEntries;
export default dictionaryEntries;
