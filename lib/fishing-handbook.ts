import handbookData from "@/data/fishing/fisher-handbook-2024.json";

export type FishingHandbookPage = {
  id: string;
  pdfPage: number;
  handbookPage: number | null;
  section: string;
  title: string;
  text: string;
};

export type FishingEvidence = Pick<
  FishingHandbookPage,
  "pdfPage" | "handbookPage" | "section" | "title"
> & {
  excerpt: string;
  sourceHref: string;
};

const handbook = handbookData as typeof handbookData & {
  pages: FishingHandbookPage[];
};

const STOP_WORDS = new Set([
  "about", "after", "before", "could", "fishing", "from", "have", "help",
  "island", "please", "regulation", "regulations", "that", "their", "there",
  "these", "this", "virgin", "waters", "what", "where", "which", "with",
]);

const FISHING_TERMS = /\b(fish|fishing|fisher|catch|harvest|hook|line|trap|pot|net|seine|spear|bait|lobster|conch|whelk|shrimp|coral|turtle|marine reserve|sanctuary|season|closure|size limit|bag limit|permit|license|territorial waters|federal waters|buck island|hurricane hole|mangrove lagoon)\b/i;

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function isFishingQuestion(value: string) {
  return FISHING_TERMS.test(value);
}

export function getFishingHandbook() {
  return handbook;
}

export function searchFishingHandbook(query: string, limit = 6): FishingEvidence[] {
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return [];

  return handbook.pages
    .map((page) => {
      const title = `${page.section} ${page.title}`.toLowerCase();
      const body = page.text.toLowerCase();
      const score = queryTokens.reduce((total, token) => {
        const titleScore = title.includes(token) ? 8 : 0;
        const bodyMatches = body.split(token).length - 1;
        return total + titleScore + Math.min(bodyMatches, 8);
      }, 0);
      return { page, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.page.pdfPage - b.page.pdfPage)
    .slice(0, Math.max(1, Math.min(limit, 8)))
    .map(({ page }) => ({
      pdfPage: page.pdfPage,
      handbookPage: page.handbookPage,
      section: page.section,
      title: page.title,
      excerpt: page.text.slice(0, 2200),
      sourceHref: `${handbook.sourceFile}#page=${page.pdfPage}`,
    }));
}

