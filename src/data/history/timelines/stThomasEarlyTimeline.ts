import { historicalAccountStThomasFacts } from "../sources";

export type HistoricalTimelineEvent = {
  id: string;
  year?: number;
  yearRange?: string;
  title: string;
  summary: string;
  places: string[];
  people: string[];
  sourceTitle: string;
  sourcePage: string;
};

export const stThomasEarlyTimeline: HistoricalTimelineEvent[] =
  historicalAccountStThomasFacts
    .filter((fact) => fact.year || fact.yearRange)
    .map((fact) => ({
      id: fact.id,
      year: fact.year,
      yearRange: fact.yearRange,
      title: fact.title,
      summary: fact.summary,
      places: fact.places,
      people: fact.people,
      sourceTitle: fact.source.book,
      sourcePage: fact.source.page,
    }))
    .sort((a, b) => {
      const ay = a.year ?? Number.parseInt(a.yearRange ?? "0", 10);
      const by = b.year ?? Number.parseInt(b.yearRange ?? "0", 10);
      return ay - by;
    });