/**
 * Free books on aqvik.com. Each part's text lives in a .md file next to this one
 * (src/content/books/<book>/<case>/<part>.md) in the format described in lib/books/parse.ts.
 * Illustrations go in public/books/<book>/<image-id>.webp and appear once the file exists.
 */

/** Hinglish is the default language (no URL suffix); Hindi lives at …/<part>/hindi. */
export type BookLang = "hinglish" | "hindi";
export const BOOK_LANGS: { lang: BookLang; label: string; htmlLang: string; suffix: string }[] = [
  { lang: "hinglish", label: "Hinglish", htmlLang: "hi-Latn", suffix: "" },
  { lang: "hindi", label: "हिंदी", htmlLang: "hi", suffix: "/hindi" },
];

export type BookPart = { slug: string; n: number; title: string; titleHi: string; files: Partial<Record<BookLang, string>> & { hinglish: string } };
export type BookCase = { slug: string; n: number; title: string; titleHi: string; scam: string; hook: string; hookHi: string; parts: BookPart[] };

export type Book = {
  slug: string;
  title: string;
  season: string;
  author: string;
  tagline: string;
  taglineHi: string;
  taglineEn: string;
  description: string;
  language: string;
  cover: string;
  disclaimer: string;
  disclaimerHi: string;
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
  taglineHi: "ऑनलाइन स्कैम की असली कहानियाँ — और उनसे बचने का तरीक़ा",
  taglineEn: "Real stories of online scams, and how to stay safe",
  description:
    "Free story book in Hinglish and Hindi: ten cases inspired by real online scams in India — digital arrest, OTP, fake KYC, UPI, ATM, task jobs, fake trading apps, loan apps, voice clones and money mules — and how to stay safe.",
  language: "Hinglish · हिंदी",
  cover: "/books/digital-thug-life/cover.webp",
  disclaimer:
    "Ye kahaniyan asli ghatnaon se prerit hain. Saare kirdaar, naam, jagah, company aur sansthaayein kaalpanik hain; kisi asli vyakti ya sanstha se samaanta sanyog hai. Inka maksad sirf jaagrukta hai.",
  disclaimerHi:
    "ये कहानियाँ असली घटनाओं से प्रेरित हैं। सारे किरदार, नाम, जगह, कंपनी और संस्थाएँ काल्पनिक हैं; किसी असली व्यक्ति या संस्था से समानता संयोग है। इनका मक़सद सिर्फ़ जागरूकता है।",
  imageNote: "Illustrations are AI-generated.",
  cases: [
    {
      slug: "case-1",
      n: 1,
      title: "Digital Arrest",
      titleHi: "डिजिटल अरेस्ट",
      scam: "Video call pe nakli \"CBI officer\" aur nakli adalat",
      hook: "Ek courier call. Paanch din ek band kamra. Zindagi bhar ki kamai — ₹1.38 crore.",
      hookHi: "एक कूरियर कॉल। पाँच दिन एक बंद कमरा। ज़िंदगी भर की कमाई — ₹1.38 करोड़।",
      parts: [
        { slug: "part-1", n: 1, title: "Parcel", titleHi: "पार्सल", files: { hinglish: "digital-thug-life/case-1/part-1.md", hindi: "digital-thug-life/case-1/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Adalat", titleHi: "अदालत", files: { hinglish: "digital-thug-life/case-1/part-2.md", hindi: "digital-thug-life/case-1/part-2.hi.md" } },
        { slug: "part-3", n: 3, title: "Ruko, Socho, Action lo", titleHi: "रुको, सोचो, एक्शन लो", files: { hinglish: "digital-thug-life/case-1/part-3.md", hindi: "digital-thug-life/case-1/part-3.hi.md" } },
      ],
    },
    {
      slug: "case-2",
      n: 2,
      title: "OTP ka khel",
      titleHi: "OTP का खेल",
      scam: "Nakli bank call, reward points aur OTP",
      hook: "\"Aapke 18,450 reward points aaj raat expire ho rahe hain.\" Teen OTP. Gyarah minute. ₹2,94,000.",
      hookHi: "\"आपके 18,450 रिवॉर्ड पॉइंट आज रात एक्सपायर हो रहे हैं।\" तीन OTP। ग्यारह मिनट। ₹2,94,000।",
      parts: [
        { slug: "part-1", n: 1, title: "Reward Points", titleHi: "रिवॉर्ड पॉइंट", files: { hinglish: "digital-thug-life/case-2/part-1.md", hindi: "digital-thug-life/case-2/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Galti kiski?", titleHi: "ग़लती किसकी?", files: { hinglish: "digital-thug-life/case-2/part-2.md", hindi: "digital-thug-life/case-2/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-3",
      n: 3,
      title: "Link pe click",
      titleHi: "लिंक पर क्लिक",
      scam: "Nakli KYC SMS aur .apk file",
      hook: "\"Aapka account aaj BLOCK ho jayega.\" Ek link, ek app, raat 2 baje 23 OTP — aur 312 logon tak pahuncha ek dhokha.",
      hookHi: "\"आपका खाता आज ब्लॉक हो जाएगा।\" एक लिंक, एक ऐप, रात 2 बजे 23 OTP — और 312 लोगों तक पहुँचा एक धोखा।",
      parts: [
        { slug: "part-1", n: 1, title: "KYC pending", titleHi: "KYC पेंडिंग", files: { hinglish: "digital-thug-life/case-3/part-1.md", hindi: "digital-thug-life/case-3/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "312 log", titleHi: "312 लोग", files: { hinglish: "digital-thug-life/case-3/part-2.md", hindi: "digital-thug-life/case-3/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-4",
      n: 4,
      title: "Paise lene ke liye PIN",
      titleHi: "पैसे लेने के लिए PIN",
      scam: "UPI collect request, QR aur nakli \"fauji\" khareedaar",
      hook: "Ek purani washing machine, ek \"Major\" Leh se, aur 47 minute mein ₹1,62,000.",
      hookHi: "एक पुरानी वॉशिंग मशीन, एक \"मेजर\" लेह से, और 47 मिनट में ₹1,62,000।",
      parts: [
        { slug: "part-1", n: 1, title: "Major Rana", titleHi: "मेजर राणा", files: { hinglish: "digital-thug-life/case-4/part-1.md", hindi: "digital-thug-life/case-4/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Paisa aata hai, PIN nahi", titleHi: "पैसा आता है, PIN नहीं", files: { hinglish: "digital-thug-life/case-4/part-2.md", hindi: "digital-thug-life/case-4/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-5",
      n: 5,
      title: "ATM ke bahar",
      titleHi: "ATM के बाहर",
      scam: "ATM pe \"madad\" ke bahaane card badalna aur skimming",
      hook: "Ek muskurata ladka, 47 second ki \"madad\", aur ek pension card jo kisi aur ka nikla.",
      hookHi: "एक मुस्कुराता लड़का, 47 सेकंड की \"मदद\", और एक पेंशन कार्ड जो किसी और का निकला।",
      parts: [
        { slug: "part-1", n: 1, title: "Aunty ji, main dikha doon?", titleHi: "आंटी जी, मैं दिखा दूँ?", files: { hinglish: "digital-thug-life/case-5/part-1.md", hindi: "digital-thug-life/case-5/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Card kiska hai?", titleHi: "कार्ड किसका है?", files: { hinglish: "digital-thug-life/case-5/part-2.md", hindi: "digital-thug-life/case-5/part-2.hi.md" } },
      ],
    },
  ],
  upcoming: [
    { n: 6, title: "Like karo, kamao", scam: "Part-time task job scam" },
    { n: 7, title: "Sure-shot tip", scam: "Stock tips group aur fake trading app" },
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

export const partHref = (book: Book, c: BookCase, p: BookPart, lang: BookLang = "hinglish") =>
  `/books/${book.slug}/${c.slug}/${p.slug}${BOOK_LANGS.find((l) => l.lang === lang)!.suffix}`;

/** Every readable part in reading order (in one language), for next/previous links and the sitemap. */
export function readingOrder(book: Book, lang: BookLang = "hinglish") {
  return book.cases.flatMap((c) =>
    c.parts.filter((p) => p.files[lang]).map((p) => ({ bookCase: c, part: p, href: partHref(book, c, p, lang) })),
  );
}

/** Words that change with the language, used by the reader and part pages. */
export const BOOK_UI: Record<BookLang, { page: string; lesson: string; next: string; prev: string; bookMode: string; scrollMode: string; partOf: (n: number, of: number) => string; allCases: string; caseLabel: string }> = {
  hinglish: { page: "Page", lesson: "Seekh", next: "Agla page", prev: "Pichhla page", bookMode: "Book", scrollMode: "Scroll", partOf: (n, of) => `Part ${n} of ${of}`, allCases: "Saare cases dekho", caseLabel: "Case" },
  hindi: { page: "पेज", lesson: "सीख", next: "अगला पेज", prev: "पिछला पेज", bookMode: "किताब", scrollMode: "स्क्रॉल", partOf: (n, of) => `भाग ${n} / ${of}`, allCases: "सारे केस देखो", caseLabel: "केस" },
};
