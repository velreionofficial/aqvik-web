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
  tagline: "Asli online scam se prerit kahaniyan — aur unse bachne ka tareeka",
  taglineHi: "असली ऑनलाइन स्कैम से प्रेरित कहानियाँ — और उनसे बचने का तरीक़ा",
  taglineEn: "Stories inspired by real online scams, and how to stay safe",
  description:
    "Free story book in Hinglish and Hindi: ten cases inspired by real online scams in India — digital arrest, OTP, fake KYC, UPI, ATM, task jobs, fake trading apps, loan apps, voice clones and money mules — and how to stay safe.",
  language: "Hinglish · हिंदी",
  cover: "/books/digital-thug-life/cover.webp",
  disclaimer:
    "Ye kahaniyan asli ghatnaon se prerit hain, lekin kaalpanik hain. Kirdaar, parivaar, gaon, bank, app aur company ke naam kaalpanik hain; kisi asli vyakti ya sanstha se samaanta sanyog hai. RBI, SEBI, police aur 1930 jaisi asli sansthaon ka zikr sirf jaankari ke liye hai — AQVIK unse juda nahi hai. Ye kanooni ya vitteey salaah nahi hai, aur shikayat karne se paisa wapas milne ki guarantee nahi hoti. Koi galti dikhe to support@aqvik.com pe batayein.",
  disclaimerHi:
    "ये कहानियाँ असली घटनाओं से प्रेरित हैं, लेकिन काल्पनिक हैं। किरदार, परिवार, गाँव, बैंक, ऐप और कंपनी के नाम काल्पनिक हैं; किसी असली व्यक्ति या संस्था से समानता संयोग है। RBI, SEBI, पुलिस और 1930 जैसी असली संस्थाओं का ज़िक्र सिर्फ़ जानकारी के लिए है — AQVIK उनसे जुड़ा नहीं है। ये क़ानूनी या वित्तीय सलाह नहीं है, और शिकायत करने से पैसा वापस मिलने की गारंटी नहीं होती। कोई ग़लती दिखे तो support@aqvik.com पर बताएँ।",
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
    {
      slug: "case-6",
      n: 6,
      title: "Like karo, kamao",
      titleHi: "लाइक करो, कमाओ",
      scam: "Part-time \"task\" job aur prepaid task ka jaal",
      hook: "Teen like, ₹150 ki pehli kamaai, aur shaadi ke ₹3,92,000.",
      hookHi: "तीन लाइक, ₹150 की पहली कमाई, और शादी के ₹3,92,000।",
      parts: [
        { slug: "part-1", n: 1, title: "Hi dear!", titleHi: "हाय डियर!", files: { hinglish: "digital-thug-life/case-6/part-1.md", hindi: "digital-thug-life/case-6/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Papa ko kaise bataun?", titleHi: "पापा को कैसे बताऊँ?", files: { hinglish: "digital-thug-life/case-6/part-2.md", hindi: "digital-thug-life/case-6/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-7",
      n: 7,
      title: "Sure-shot tip",
      titleHi: "श्योर-शॉट टिप",
      scam: "Stock tips group aur nakli trading app",
      hook: "Ek \"Professor\", ek app, aur screen pe ₹2.31 crore jo kabhi the hi nahi.",
      hookHi: "एक \"प्रोफ़ेसर\", एक ऐप, और स्क्रीन पर ₹2.31 करोड़ जो कभी थे ही नहीं।",
      parts: [
        { slug: "part-1", n: 1, title: "Professor ki class", titleHi: "प्रोफ़ेसर की क्लास", files: { hinglish: "digital-thug-life/case-7/part-1.md", hindi: "digital-thug-life/case-7/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Paisa kahan hai?", titleHi: "पैसा कहाँ है?", files: { hinglish: "digital-thug-life/case-7/part-2.md", hindi: "digital-thug-life/case-7/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-8",
      n: 8,
      title: "Loan app",
      titleHi: "लोन ऐप",
      scam: "Nakli instant loan app, dhamki aur morphed photo",
      hook: "₹6,000 ka loan, nau app, ₹1,38,000 — aur ek photo jo 412 logon tak pahunchi.",
      hookHi: "₹6,000 का लोन, नौ ऐप, ₹1,38,000 — और एक फोटो जो 412 लोगों तक पहुँची।",
      parts: [
        { slug: "part-1", n: 1, title: "Allow", titleHi: "Allow", files: { hinglish: "digital-thug-life/case-8/part-1.md", hindi: "digital-thug-life/case-8/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Ek message, 412 log", titleHi: "एक मैसेज, 412 लोग", files: { hinglish: "digital-thug-life/case-8/part-2.md", hindi: "digital-thug-life/case-8/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-9",
      n: 9,
      title: "Papa, main musibat mein hoon",
      titleHi: "पापा, मैं मुसीबत में हूँ",
      scam: "AI se banayi nakli awaaz — \"beta musibat mein hai\"",
      hook: "Bete ki roti hui awaaz, ek \"Inspector\", aur 40 minute mein ₹2,70,000.",
      hookHi: "बेटे की रोती हुई आवाज़, एक \"इंस्पेक्टर\", और 40 मिनट में ₹2,70,000।",
      parts: [
        { slug: "part-1", n: 1, title: "Bruno ka biscuit", titleHi: "ब्रूनो का बिस्किट", files: { hinglish: "digital-thug-life/case-9/part-1.md", hindi: "digital-thug-life/case-9/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Asli awaaz", titleHi: "असली आवाज़", files: { hinglish: "digital-thug-life/case-9/part-2.md", hindi: "digital-thug-life/case-9/part-2.hi.md" } },
      ],
    },
    {
      slug: "case-10",
      n: 10,
      title: "Account kiraye pe",
      titleHi: "खाता किराए पर",
      scam: "Money mule — apna bank khaata thagon ko kiraye pe dena",
      hook: "₹5,000 mahina, ek bhura lifaafa, aur 41 parivaaron ka paisa ek student ke naam se.",
      hookHi: "₹5,000 महीना, एक भूरा लिफ़ाफ़ा, और 41 परिवारों का पैसा एक स्टूडेंट के नाम से।",
      parts: [
        { slug: "part-1", n: 1, title: "₹5,000 mahina", titleHi: "₹5,000 महीना", files: { hinglish: "digital-thug-life/case-10/part-1.md", hindi: "digital-thug-life/case-10/part-1.hi.md" } },
        { slug: "part-2", n: 2, title: "Kiska paisa tha?", titleHi: "किसका पैसा था?", files: { hinglish: "digital-thug-life/case-10/part-2.md", hindi: "digital-thug-life/case-10/part-2.hi.md" } },
      ],
    },
  ],
  upcoming: [
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
