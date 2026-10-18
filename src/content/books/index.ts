/**
 * Free books on aqvik.com. Each part's text lives in a .md file next to this one
 * (src/content/books/<book>/<case>/<part>.md) in the format described in lib/books/parse.ts.
 * Illustrations go in public/books/<book>/<image-id>.webp and appear once the file exists.
 */

export type BookPart = { slug: string; n: number; title: string; file: string };
export type BookCase = { slug: string; n: number; title: string; scam: string; hook: string; parts: BookPart[] };

export type Book = {
  slug: string;
  title: string;
  season: string;
  author: string;
  tagline: string;
  taglineEn: string;
  description: string;
  language: string;
  cover: string;
  disclaimer: string;
  imageNote: string;
  cases: BookCase[];
  /** Cases planned but not written yet, shown as "coming soon". */
  upcoming: { n: number; title: string; scam: string }[];
};

export const digitalThugLife: Book = {
  slug: "digital-thug-life",
  title: "Digital Thug Life",
  season: "Season 1",
  author: "AQVIK",
  tagline: "Online scam ki asli kahaniyan — aur unse bachne ka tareeka",
  taglineEn: "Real stories of online scams, and how to stay safe",
  description:
    "Free story book in Hinglish: ten cases inspired by real online scams in India — digital arrest, OTP, fake KYC, UPI, ATM, task jobs, fake trading apps, loan apps, voice clones and money mules — and how to stay safe.",
  language: "Hinglish",
  cover: "/books/digital-thug-life/cover.webp",
  disclaimer:
    "Ye kahaniyan asli ghatnaon se prerit hain. Saare kirdaar, naam, jagah, company aur sansthaayein kaalpanik hain; kisi asli vyakti ya sanstha se samaanta sanyog hai. Inka maksad sirf jaagrukta hai.",
  imageNote: "Illustrations are AI-generated.",
  cases: [
    {
      slug: "case-1",
      n: 1,
      title: "Digital Arrest",
      scam: "Video call pe nakli \"CBI officer\" aur nakli adalat",
      hook: "Ek courier call. Paanch din ek band kamra. Zindagi bhar ki kamai — ₹1.38 crore.",
      parts: [
        { slug: "part-1", n: 1, title: "Parcel", file: "digital-thug-life/case-1/part-1.md" },
        { slug: "part-2", n: 2, title: "Adalat", file: "digital-thug-life/case-1/part-2.md" },
        { slug: "part-3", n: 3, title: "Ruko, Socho, Action lo", file: "digital-thug-life/case-1/part-3.md" },
      ],
    },
  ],
  upcoming: [
    { n: 2, title: "OTP ka khel", scam: "OTP aur nakli bank call" },
    { n: 3, title: "Link pe click", scam: "Fake KYC link aur APK file" },
    { n: 4, title: "Paise lene ke liye PIN", scam: "UPI collect, QR aur OLX \"army officer\"" },
    { n: 5, title: "ATM ke bahar", scam: "ATM skimming aur card badalna" },
    { n: 6, title: "Like karo, kamao", scam: "Part-time task job scam" },
    { n: 7, title: "Sure-shot tip", scam: "WhatsApp stock tips aur fake trading app" },
    { n: 8, title: "Loan app", scam: "Loan app ki dhamki" },
    { n: 9, title: "Papa, main musibat mein hoon", scam: "AI voice clone" },
    { n: 10, title: "Account kiraye pe", scam: "Money mule" },
  ],
};

export const books: Book[] = [digitalThugLife];

export const findBook = (slug: string) => books.find((b) => b.slug === slug);

export function findPart(bookSlug: string, caseSlug: string, partSlug: string) {
  const book = findBook(bookSlug);
  const bookCase = book?.cases.find((c) => c.slug === caseSlug);
  const part = bookCase?.parts.find((p) => p.slug === partSlug);
  if (!book || !bookCase || !part) return null;
  return { book, bookCase, part };
}

/** Every readable part in reading order, for next/previous links and the sitemap. */
export function readingOrder(book: Book) {
  return book.cases.flatMap((c) => c.parts.map((p) => ({ bookCase: c, part: p, href: `/books/${book.slug}/${c.slug}/${p.slug}` })));
}
