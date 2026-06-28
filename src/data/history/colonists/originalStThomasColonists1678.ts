import { knoxAppendixAColonists } from "../generated/knoxAppendixAColonists";

export type OriginalStThomasColonist1678 = {
  id: string;
  number: number;
  canonicalName: string;
  aliases: string[];
  island: "st_thomas";
  year: 1678;
  sourceRecordId: string;
  sourcePages: string;
  status: "readable" | "mutilated_unreadable";
};

export const originalStThomasColonists1678: OriginalStThomasColonist1678[] =
  knoxAppendixAColonists.map((colonist) => ({
    id: colonist.id,
    number: colonist.number,
    canonicalName: colonist.name,
    aliases: [colonist.name],
    island: "st_thomas",
    year: 1678,
    sourceRecordId: colonist.sourceRecordId,
    sourcePages: colonist.source.pages,
    status: "readable",
  }));

export const originalStThomasColonists1678Status = {
  source: "Knox Appendix A",
  readableNames: originalStThomasColonists1678.length,
  unreadableMutilatedNames: 8,
  totalKnownSlots: originalStThomasColonists1678.length + 8,
};
