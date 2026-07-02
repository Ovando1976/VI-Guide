import dictionaryEntriesFile from "./dictionary/dictionaryEntries.json";

export type DictionaryEntry = {
  id?: string;
  name?: string;
  title?: string;
  type?: string;
  island?: string;
  description?: string;
  [key: string]: unknown;
};

export const dictionaryEntries = dictionaryEntriesFile as unknown as DictionaryEntry[];
