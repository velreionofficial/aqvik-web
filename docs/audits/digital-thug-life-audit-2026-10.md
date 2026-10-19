# Digital Thug Life, Season 1 — Editorial, Legal-Risk and Fact-Check Audit

**Audit date:** 19 October 2026
**Scope:** The complete *Digital Thug Life* book in this repository, in both Hinglish and Hindi.
**Status:** An internal working document. It is not legal advice, and it does not certify the book as risk-free, plagiarism-free or "100% safe".

---

## A. Executive summary

**Overall assessment.**
- The book is a fictional public-awareness work.
- The safety guidance is generally accurate.
- Every "Ye asli hai" box links to a real report that supports what the box says, after the small corrections listed below.
- The most important legal claim — the RBI compensation rule in Case 2 — turned out to be **real**. The RBI's own notification confirms it. However, the book left out one material limit (the compensation only covers frauds in the first year) and cited a law-firm summary instead of the RBI. Both points are now fixed.
- One continuity error (a wrong rupee amount in Case 3) and several overstated statements were corrected.
- No copied text was found. The checks were limited (see section B).

**Scope actually inspected:**

| Item | Count |
|---|---|
| Cases | 10 |
| Parts | 21 (Case 1 has 3 parts; Cases 2–10 have 2 each) |
| Hinglish pages | 213 |
| Hindi pages | 213 |
| Content files | 42 `.md` files plus `src/content/books/index.ts` |
| Image files on disk | 41 (cover + 40 illustrations) |
| Illustrations referenced in the text | 40, all present (the 16 for Cases 6–10 were added after the audit, see D) |

- **Where things live:** the book text is in `src/content/books/digital-thug-life/`. The images are in `public/books/digital-thug-life/`. The audit brief named only the `public/` path, but the text does not live there.
- **Reading method:**
  - Cases 4–10 were drafted in this working session, so their full text was already in view.
  - For Cases 1–3, the full lesson and summary pages were read, plus every legal, regulatory or monetary line found by searching. Not every narrative paragraph of Cases 1–3 was re-read word by word.
  - Hindi/Hinglish consistency was checked by script (pages, closing pages, screens, images, source links, helpline numbers, all rupee amounts) and by reading the lines that were changed.

**Findings by priority** (these are internal priorities, not a formal legal risk rating):

| Priority | Found | Fixed in repository | Still open |
|---|---|---|---|
| P0 — critical | 0 | — | — |
| P1 — high | 1 | 1 | 0 |
| P2 — medium | 11 | 9 | 2 (trademark clearance; image provenance) |
| P3 — low | 9 | 5 | 4 (name-similarity items; generic business names; no copyright notice; minor uniform marks in images) |

**External sources checked:**
- About 35 pages were fetched and read during this audit (RBI, SEBI, PIB, DoT and news sources, listed in section C).
- About 20 more news sources for Cases 5–10 were fetched and checked earlier in the same session, while those cases were written.

**Tests run:** see section E3. In short: all 219 tests pass, type-checking shows only an old unrelated error, and lint is clean. `next build` could not be run in this environment.

---

## B. Copyright and originality report

### B1. Authorship (what the records show)
- **Who wrote the text:**
  - The story text was drafted by an AI assistant (Claude), at the direction of AQVIK's founder, over a series of working sessions.
  - Plot rules (fictional names, real-scale amounts, a safety section in every case, no step-by-step scam manual) came from the founder's brief.
  - The working record available to this audit shows no third-party book, script or article being supplied as a base text.
  - The audit could not independently check sessions before this one's summary — see F1.
- **The "Ye asli hai" boxes:**
  - These are short summaries, written in the book's own words, of facts from cited news reports, with links.
  - Facts and news events are not protected expression.
  - No sentence from any source article was reproduced.
- **The cover:**
  - It was made from an HTML/CSS layout written in this project and rendered to an image.
  - It contains no AI image and no third-party artwork.
  - Its font is Inter, which uses the SIL Open Font License.

### B2. Originality checks done
- Web searches were run for distinctive phrases and for the title:
  - "Ek ₹150 ka sach"
  - "Jo tip free mein mile, uski keemat sabse mehngi hoti hai"
  - "Chehra tera tha. Kaam tera nahi"
  - "Tum darwaaza the / Ab chowkidaar bano"
  - "Bruno ka biscuit"
  - the title "Digital Thug Life"
- **Result:** NO ISSUE IDENTIFIED for any of these phrases. None returned a matching text.
- **Limits:**
  - Web search covers only indexed pages and is not an exact-phrase plagiarism database.
  - Paywalled, print and unindexed works were not searched.
  - This was a **limited spot check, not a full plagiarism scan.**
  - No originality percentage is given, because none can honestly be calculated.

### B3. Shared ideas and tropes
- All ten cases describe common Indian fraud patterns: digital arrest, OTP, fake KYC APK, UPI collect requests, ATM card swaps, task jobs, fake trading apps, loan-app blackmail, voice cloning and mule accounts.
- These are ideas and real-world facts, not protected expression.
- Characters, dialogue, families, places and plot turns are original to the book. One example is the Case 10 court meeting that links back to Case 6.

### B4. The title
- "Thug Life" is a common phrase, and it is used by other works (including a 2025 Indian feature film of that name).
- Copyright generally does not protect a title.
- Trademark use is a separate question: **UNVERIFIED — needs a professional trademark search before any merchandise, print edition or brand use** (see F3).

---

## C. Legal and factual claims register

Abbreviations: V = verified, V-sec = verified only through reputable secondary sources, Q = qualified or corrected, U = unverified.

| # | File / page | Claim (original) | Authority checked | Status | Action | Priority | Counsel? |
|---|---|---|---|---|---|---|---|
| 1 | case-2/part-2, p.9 box (both languages) | From 1 Jan 2027: 5-day reporting window; 85% or ₹25,000 (whichever is lower) for frauds up to ₹50,000, once in a lifetime, if reported to the bank and 1930/NCRP within 5 days; bank must prove customer fault. Source given: a law-firm summary. | RBI notification RBI/2026-27/167, *Commercial Banks – Responsible Business Conduct Third Amendment Directions, 2026*, 24 June 2026 — paras 3(2), 76K, 76M, 76T(1), 76U ([RBI](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13543&Mode=0)); RBI press release, 24 June 2026 ([RBI](https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=63011)) | V, but incomplete | Rewritten: "5 **calendar** days", applies to transactions **on or after** 1 Jan 2027, compensation covers frauds **in the first year from 1 Jan 2027** (para 76U), compensation is not automatic, and the RBI is now cited directly. The burden-of-proof point is no longer presented as new, since the 2017 circular already had it. | P1 | Optional |
| 2 | case-2/part-2, p.5 (both) | "If the fault is the bank's **or the system's**, and you report within 3 working days, liability is zero." | RBI circular RBI/2017-18/15, 6 July 2017 ([RBI](https://www.rbi.org.in/commonman/english/scripts/Notification.aspx?Id=2336)) | Q | The two cases were merged into one. Corrected to: bank's fault → zero liability whenever reported; third-party breach → zero if reported within 3 working days of the bank's alert; if the customer shared OTP/PIN → the customer bears the loss until reporting. | P2 | No |
| 3 | case-2/part-2, p.9 box (both) | 2017 rule summary, cited to Business Standard | RBI circular, 6 July 2017 (as above) | V | Citation changed to the RBI. "From the bank's alert" and "burden of proof on the bank" added. | P3 | No |
| 4 | case-2/part-2, p.5 note (both) | "RBI has announced new rules from 1 Jan 2027 … some compensation" | As in #1 | V | Wording made precise ("issued June 2026; applies to transactions on/after 1 Jan 2027; conditions apply"). Clarified that Imran's case predates it. | P3 | No |
| 5 | case-5/part-2, p.3 flag + p.10 (both) | 3 working days → zero liability for third-party breach | RBI 2017 circular | V | Added "from the bank's alert" and a note that the window becomes 5 calendar days from 1 Jan 2027. | P3 | No |
| 6 | case-5/part-2, p.3 | Bank credits the money back within about 10 days | RBI 2017 circular (credit within 10 working days of notification) | V | None | — | No |
| 7 | case-1 (all parts) | "There is no 'digital arrest' in law"; "Ruko, Socho, Action lo" | Mann Ki Baat, 27 Oct 2024, via [News On AIR](https://newsonair.gov.in/pm-modi-shares-his-thought-in-mann-ki-baat-programme-on-akashvani) (government broadcaster), [OdishaBytes](https://odishabytes.com/pm-modi-flags-digital-arrest-in-mann-ki-baat-spells-mantra-to-combat-cybercrimes/amp/), Hindi wording via [The India Moves](https://www.theindiamoves.com/story/115th-edition-of-the-program,-talk-about-digital-arrest); MHA/PIB alert, 14 May 2024 ([PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2020570)) | V / V-sec | None. Note: this is a public statement by the Prime Minister, not a statutory provision. The book presents it as a statement, which is accurate. | — | No |
| 8 | case-1/part-3 box (both) | "Supreme Court ordered a nationwide CBI probe" (1 Dec 2025) | [Onmanorama, 1 Dec 2025](https://www.onmanorama.com/news/india/2025/12/01/digital-arrest-scams-cbi-investigation-sc-order.amp.html) | Q | Overstated. The court directed a CBI probe and sought states' consent for a nationwide probe. Wording corrected. | P2 | No |
| 9 | case-1/part-3 box | Bengaluru ₹31.83 crore, 187 transfers; Sahibganj ₹1.2 crore; ₹22,495 crore lost in 2025, 9% to digital arrest | [DT Next](https://www.dtnext.in/news/national/bengaluru-woman-loses-rs-3183-cr-in-months-long-digital-arrest-scam-involving-fake-cbi-officers-853424), [Business Today](https://www.businesstoday.in/trending/story/saved-rs-1-2-crore-for-daughters-wedding-man-loses-it-to-digital-arrest-scam-552989-2026-09-03), [ThePrint](https://theprint.in/india/cybercrime-saw-24-spike-in-2025-indians-lost-rs-22495-crore-mainly-in-investment-scams/2859930/) | V | None. The 9% is a share of money lost, which matches the book's wording. | — | No |
| 10 | case-2/part-2 box | Bengaluru OTP ₹2.94 lakh (Apr 2025); reward-points ₹1.5 lakh (Dec 2022) | Deccan Herald (both) | V / partly V | None. The ₹1.5 lakh figure appears in the article's description, not in the extracted body. | — | No |
| 11 | case-3/part-2 box (both) | Fatorda, Goa: "a girl" | [The Goan, 18 Jun 2026](https://www.thegoan.net/goa-news/fake-kyc-app-scam-costs-fatorda-family-rs-102-lakh/149800.html) | Q | The source says "woman". Corrected. Amounts verified. | P3 | No |
| 12 | case-3/part-2 box | Hingoli ₹1.9 lakh (Aug 2025); Kerala and Himachal e-challan APK warnings | [Outlook Money](https://www.outlookmoney.com/news/whatsapp-wedding-invite-scam-maharashtra-govt-employee-loses-rs-190000), [ThePrint, 26 Sep 2026](https://theprint.in/india/keralam-police-warn-of-malicious-apk-scam-via-fake-e-challan-sms/3053993/), [Tribune, 25 Jul 2025](https://www.tribuneindia.com/news/himachal/challan-scam-alert-fraudsters-use-whatsapp-apk-links-to-loot-money) | V | None | — | No |
| 13 | case-4/part-2 box | Kharar ₹5 lakh; Tamil Nadu "gang busted"; Delhi Police army-buyer QR warning | [The420](https://the420.in/kharar-olx-fraud-army-impersonation-arrest/), [TNM, 7 Mar 2020](https://www.thenewsminute.com/tamil-nadu/duping-buyers-across-india-posing-army-officers-olx-tn-cops-crack-scam-119709), [Delhi Police](https://cyber.delhipolice.gov.in/OLX.html) | V / Q | "Gang busted" → "two accused from the gang caught in Rajasthan" (the source reports two arrests). | P3 | No |
| 14 | case-5/part-2 box | "Jabalpur, MP (Mar 2026)" | [The Hitavada](https://www.thehitavada.com/Encyc/2026/3/12/fraudster-held-for-swapping-atm-cards-withdrawing-money-from-many-accounts.html) | Q | The article does not name the city; Jabalpur was inferred from police-station names. Changed to "Madhya Pradesh". | P3 | No |
| 15 | case-5 to case-10 boxes | Namakkal, Shahdara, Mohali; Chennai, Wagholi, Kalamboli; Bhopal ₹3.91 cr, Pune ₹4.43 cr, UP STF Nagpur arrest; Visakhapatnam, Chandigarh loan apps; Delhi and Powai voice calls; Erumely, Chandigarh, Pimpri-Chinchwad mule cases | Sources fetched while drafting these cases (links in each box) | V | None. Wording was matched to each source at drafting time (for example, the Powai item does not claim AI was proven, and the Mohali year is left out because the source does not give it). | — | No |
| 16 | case-7 | SEBI "@valid" UPI handles and "SEBI Check" (Oct 2025) | [SEBI press release PR 64/2025, 1 Oct 2025](https://www.sebi.gov.in/media-and-notifications/press-releases/oct-2025/sebi-rolls-out-validated-upi-handles-and-sebi-check-for-secure-investor-payments_97020.html) (title and date); [SEBI Check page](https://www.sebi.gov.in/sebi_check.html) (UPI ID and bank-account verification); "@valid" format via [Outlook Money](https://www.outlookmoney.com/invest/sebi-launches-validated-upi-handles-sebi-check-to-curb-payment-fraud) and [Moneylife](https://www.moneylife.in/article/sebi-launches-at-valid-upi-handles-and-checking-tool-to-curb-payment-frauds/78469.html) | V / V-sec | Citation changed to SEBI's own press release. The "@valid" format is confirmed by reputable secondary sources; the SEBI PDF was not opened. | P3 | No |
| 17 | case-7 | IPO applications only through ASBA or a broker's UPI; holdings are shown in the CDSL/NSDL statement (CAS); SEBI SCORES for complaints | General market structure | V (not separately fetched) | None | — | No |
| 18 | case-8 box + p.3 | "RBI directory: check whether any app is genuine" | [RBI press release, 8 May 2025](https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=60403); [RBI (Digital Lending) Directions 2025](https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12848&Mode=0), para 17 | Q | Overclaimed. The directory shows apps that regulated lenders have reported, without further RBI validation. Reworded to "check whether an app is linked to an RBI-regulated lender", with a note that the list comes from the lenders themselves. Citation changed to the RBI. | P2 | No |
| 19 | case-8 | Loan apps should not access contacts, photos or files; lenders give a Key Fact Statement | RBI Digital Lending Directions 2025, paras 12(i) and 8(i)/(iii) | V | None | — | No |
| 20 | case-8 | "More than 1,000% a year" (₹2,220 fee on ₹3,780 received, repaid in 7 days) | Arithmetic: about 59% for 7 days, roughly 3,000% simple annual rate | V | None | — | No |
| 21 | case-8 | Tele-MANAS 14416: free, 24×7, choice of language | [PIB, 10 Oct 2022](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1866498&reg=48&lang=2) | V | None | — | No |
| 22 | case-8 | RBI Sachet portal for complaints about unregistered lenders | sachet.rbi.org.in (an RBI domain) | V (the domain belongs to the RBI; the page was not opened) | None | — | No |
| 23 | all cases | 1930 helpline and cybercrime.gov.in | [MHA/PIB, 14 May 2024](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2020570) (cybercrime.gov.in blocks automated fetching) | V | None | — | No |
| 24 | all cases | Report fraud numbers on Sanchar Saathi (Chakshu) | [sancharsaathi.gov.in](https://sancharsaathi.gov.in/) (DoT) — Chakshu takes reports of calls, SMS and WhatsApp messages | V | None | — | No |
| 25 | case-1 | Call 112 if afraid | National emergency number (ERSS) | V (general knowledge; not fetched in this audit) | None | — | No |
| 26 | case-10, p.2 (both) | "The law treats you as part of the fraud — and of organised crime." | BNS s.111 lists "economic offence" and "cyber-crimes" among organised-crime activities ([secondary text](https://vidhijudicial.com/section-111-of-the-bharatiya-nyaya-sanhita-(bns)-of-2023.html)); police practice of naming account holders as accused ([FPJ, Jul 2026](https://www.freepressjournal.in/pune/dont-rent-your-bank-account-pimpri-chinchwad-police-warn-students-and-youth-as-cyber-fraud-cases-rise); [Onmanorama, Mar 2026](https://www.onmanorama.com/news/kerala/2026/03/07/bank-account-rental-cyber-fraud-arrest.html)) | Q | A definite legal conclusion was stated as fact. Reworded to: "In such cases police also charge the account holder with fraud, and with organised crime if a gang is involved. The court decides — but the case runs in your name." The BNS text was read through a secondary source, not India Code. | P2 | **Yes** (light review) |
| 27 | case-10, p.10 (both) | "A freeze can reach **all** accounts in your name." | No primary source establishes this as a general rule | U → Q | Softened to "during an investigation, your other accounts may also be restricted". | P2 | No |
| 28 | case-6 | "Real TDS is deducted from earnings; it is never asked for separately." | General tax practice | V (editorial simplification) | None | — | No |
| 29 | case-4, case-9 | "A PIN is never needed to receive money"; "police never take 'settlement' money over UPI or phone" | NPCI safety guidance (general); PM's statement in #7 | V (safety guidance) | None | — | No |
| 30 | site copy (`index.ts`, `home.ts`, cover) | "Real stories of online scams" / "Online scam ki asli kahaniyan" | — | Q | The stories are fiction inspired by real cases. Changed to "Stories inspired by real online scams" in all three languages, and the cover image was re-rendered. | P2 | No |
| 31 | `index.ts` disclaimer (both) | "All characters, names, **places**, companies and institutions are fictional." | — | Q | Inaccurate: real cities and real institutions (RBI, SEBI, police, 1930) appear. Rewritten — see section E. | P2 | No |

**Points to update after 1 January 2027:**
- From that date, the 2017-rule wording in Case 2 and Case 5 becomes historical. Those passages should be revised.
- After the compensation window ends (frauds up to 31 Dec 2027, under para 76U), the compensation line should be revised again.

---

## D. Image and trademark report

### D1. Image inventory

| Asset | Used on | Provenance on record | Visible text | Logos, emblems, real people | Notes |
|---|---|---|---|---|---|
| cover.webp | Book page and home card | Made from HTML/CSS in this project (`Digital-Thug-Life-cover.html`), rendered with Chromium | Yes — title, tagline, "10 CASES", "INSPIRED BY REAL EVENTS", "HELPLINE 1930", "WRITTEN BY AQVIK", and a mock "YOU ARE UNDER DIGITAL ARREST" phone screen | None; the "Cyber Crime Dept." caller label is fictional | Re-rendered with the corrected tagline. The mock screen is clearly part of a book cover, not an official notice. |
| c1p1-bank … c1p3-wedding (9 files) | Case 1, parts 1–3 | Cut from two AI-generated image grids the founder supplied. He described them as generated with Claude. **Tool, account and date are not recorded.** | No legible text | No real logos. Police and "officer" figures wear generic khaki with small, unreadable shoulder/badge marks; no state emblem is legible. | Fictional depiction; not presented as photographs. |
| c2p1-gang … c5p2-class (15 files) | Cases 2–5 | Cut from one AI-generated grid the founder supplied on 19 Oct 2026. **Tool is not recorded.** | Unreadable pseudo-text only (the monitor in c3p1-dashboard, the wall chart in c4p1-gang, the chalkboard in c5p2-class) | No real logos. Energy-drink cans in c3p1-dashboard have abstract artwork with no readable brand. Khaki uniforms in c2p2-raid and c5p2-cctv are generic. | — |
| c6p1-mukesh … c10p2-ghat (16 files) | Cases 6–10 | Cut from four alternative AI-generated grids that the founder supplied on 19 Oct 2026; one version of each image was chosen for fit with the story and absence of branding. **Tool not recorded.** | Only unreadable scribble (whiteboard in c6p1-mukesh, laptop/monitor graphs, a phone photo of a fictional child) | No real logos in the chosen versions. In one rejected version of c8p1-dhaba, the delivery box carried a logo-like mark, so a version with a plain green box was used instead. Police in c10p1-raid wear generic khaki. | Chosen versions are recorded in the changelog (E). |

- **Footer:** reads "Illustrations are AI-generated", which is accurate.
- **Check against existing works:** no image was found to resemble a known copyrighted illustration or character. This was a visual check only; no reverse-image search was available.

### D2. Fictional names — preliminary web search
- **IP India's trademark database was not accessed.** It is interactive and was not reachable by the tools available. Every row below is therefore a web search only, not a trademark search.

| Name | Role in the book | Similar real names found | Assessment / action |
|---|---|---|---|
| PayNow UPI | Payment app shown on UPI screens (Cases 4, 9) | **PayNow** is Singapore's national payment service | **Renamed to "PayChakra UPI"** — no web match found. P2, fixed. |
| TitanEdge Capital | The fake trading brand's next identity (Case 7) | "Titan Capital" (an Indian VC fund) and the Titan brand | **Renamed to "TrendVeer Capital"** — no web match found. P2, fixed. |
| ChatBox | Messaging app used across the book (built into the phone-screen component) | Several unrelated products called "Chatbox/ChatBox" (including AI apps and a messaging SaaS) | The book shows it as a neutral platform, not as the wrongdoer. Low risk. **Not changed**, because renaming touches every case and a component. Flag for professional search (F3). |
| VidCall | Video-call app (Case 1) | A small iOS app named "VidCall" | Descriptive, generic name; neutral role. Low risk. Flag (F3). |
| BechDo | Second-hand marketplace (Case 4) | "BechDe" (a similar app) | Neutral role. Low risk. Flag (F3). |
| QuickRupee | Predatory loan app (Case 8) | No exact match; "RapidRupee" exists | The role is negative, so similarity matters more. No exact match was found. Flag (F3). |
| PaisaTurant, BullMax Pro, StarBoost Digital, BrightLike Media, Jaldhara Green Energy, ClipGram, SwiftParcel, Avadh National Bank | Various | No exact matches found ("SwiftPac" exists) | No action. Flag the group for a professional search before any commercial or print edition. |
| Shree Ganesh Traders, Maa Durga Enterprises, Shiv Shakti Enterprises | Scammers' mule accounts | Very common real Indian business names | Being generic reduces identifiability, and the disclaimer covers them. P3. Optional: replace with clearly invented names. |
| Real institutions (RBI, SEBI, police, CBI, 1930, NCRP, Chakshu, Play Store/App Store) | Named for factual reference only | — | No logos are used and no endorsement is implied. The disclaimer now says AQVIK is not affiliated. |

---

## E. Changelog

All changes below are in `apps/web/`. A copy of the files before the audit was kept outside the repository for comparison.

| File | What changed | Why | Evidence | Type |
|---|---|---|---|---|
| `src/content/books/digital-thug-life/case-2/part-2.md`, `.hi.md` | p.5: liability explanation split into "bank's fault" vs "third-party breach within 3 working days of the alert". p.5 note made precise. p.9 box: both RBI bullets rewritten with the RBI's own citations, calendar days, the transaction-date rule, the one-year compensation window and "not automatic". | Legal accuracy | Register #1–#4 | Legal-risk / factual |
| `case-1/part-3.md`, `.hi.md` | Supreme Court bullet: "nationwide CBI probe ordered" → "CBI probe directed; consent sought from states for a nationwide probe" | Overstatement | #8 | Factual |
| `case-3/part-1.md` | p.8 "Raat ka khel": ₹49,000 → **₹24,785** | Contradicted Part 2 (₹1,95,000 + ₹1,95,000 + ₹24,785 = ₹4,14,785); the Hindi file already had ₹24,785 | Internal arithmetic | Factual / continuity |
| `case-3/part-2.md`, `.hi.md` | Goa bullet: "girl" → "woman" | Matches the source | #11 | Factual |
| `case-4/part-2.md`, `.hi.md` | Tamil Nadu bullet: "gang busted" → "two accused caught in Rajasthan" | Matches the source | #13 | Factual |
| `case-4/part-1.md`, `.hi.md`; `case-9/part-1.md`, `.hi.md` | "PayNow UPI" → "PayChakra UPI" | Avoids a real payment brand | D2 | Legal-risk (trademark/confusion) |
| `case-5/part-2.md`, `.hi.md` | "Jabalpur" → "Madhya Pradesh". p.10: "from the bank's alert" added, plus a note that the window becomes 5 calendar days from 1 Jan 2027. | Removes an inference; keeps the rule current | #5, #14 | Factual |
| `case-7/part-2.md`, `.hi.md` | SEBI citation → SEBI press release. "TitanEdge Capital" → "TrendVeer Capital". | Primary source; avoids a real brand | #16, D2 | Factual / legal-risk |
| `case-8/part-2.md`, `.hi.md` | RBI directory bullet reworded; citation → RBI press release | The original overclaimed what the directory proves | #18 | Factual |
| `case-10/part-2.md`, `.hi.md` | p.2: legal conclusion qualified. p.10: "freeze reaches all accounts" softened. | Unsupported definite legal claims | #26, #27 | Legal-risk |
| `src/content/books/index.ts` | Taglines (Hinglish, Hindi, English) say "inspired by real scams". Disclaimer (both languages) rewritten: stories are fiction; names of characters, families, villages, banks, apps and companies are invented; real institutions are mentioned for information only, with no affiliation; not legal or financial advice; reporting does not guarantee recovery; corrections to support@aqvik.com. | The old text was inaccurate ("places are fictional") and missing key notices | #30, #31 | Legal-risk / editorial |
| `src/content/home.ts` | Book card label: "asli kahaniyan" → "asli online scam se prerit kahaniyan" | Same as above | #30 | Editorial |
| `public/books/digital-thug-life/c6p1-mukesh.webp` … `c10p2-ghat.webp` (16 new) | Illustrations for Cases 6–10, cut from the founder's grids (versions chosen: grid 1 for c6p1-night, c8p1-dhaba, c9p2-assembly, c10p1-kit, c10p1-raid; grid 2 for c7p2-daughter, c8p2-family, c10p2-ghat; grid 3 for the rest), 1000px wide WebP | The story referenced these images | D1 | Technical |
| `public/books/digital-thug-life/cover.webp` | Re-rendered with the corrected tagline. Nothing else changed. | Same as above | #30 | Editorial |
| `src/lib/books/parse.test.ts` | New test: each Hindi file must cite the same source links, the same helpline numbers (1930/112/14416) and the same rupee amounts as its Hinglish original | Bilingual consistency (this check would have caught the Case 3 error) | — | Technical |
| `docs/audits/digital-thug-life-audit-2026-10.md` | This report (new) | Deliverable | — | Documentation |

### E2. New disclaimer text (Hinglish)
> Ye kahaniyan asli ghatnaon se prerit hain, lekin kaalpanik hain. Kirdaar, parivaar, gaon, bank, app aur company ke naam kaalpanik hain; kisi asli vyakti ya sanstha se samaanta sanyog hai. RBI, SEBI, police aur 1930 jaisi asli sansthaon ka zikr sirf jaankari ke liye hai — AQVIK unse juda nahi hai. Ye kanooni ya vitteey salaah nahi hai, aur shikayat karne se paisa wapas milne ki guarantee nahi hoti. Koi galti dikhe to support@aqvik.com pe batayein.

- **No copyright notice was added.** Section F2 explains why.

### E3. Tests and verification

| Check | Result |
|---|---|
| `npm test` (book parser and content tests, including the new bilingual test) | 219 passed, 0 failed |
| `tsc --noEmit` | Only one error: the existing `globals.css` side-effect import in `layout.tsx`, which is unrelated and existed before the audit |
| ESLint on `src/components/books`, `src/lib/books`, `src/content/books/index.ts`, `src/content/home.ts`, `src/app/books` | Clean |
| Rendering | Changed pages were checked by server-side render plus a headless-browser screenshot |
| Asset existence | All 40 referenced illustrations exist |
| `next build` | **Not run.** The Linux build binary is unavailable here and the package registry is blocked. Run it locally before deploying. |
| Diff against the pre-audit copy | Only the files listed above changed. No content was deleted beyond the replaced sentences. |

No commit, push or deployment was made.

### E4. Follow-up, 19 Oct 2026: linking policies

- **Finding:** RBI's website terms ask for written notice before linking to its home page and for permission before linking to any inner page. The Income Tax Department asks for prior permission before any link. SEBI and the GST Council allow links without permission but ask to be informed, and neither allows framing.
- **Change:** The three RBI hyperlinks in Cases 2 and 8 (both languages) were replaced with plain-text citations giving the notification number, date and "rbi.org.in".
- **Test:** A new test fails if any book file links to rbi.org.in or incometaxindia.gov.in.
- **Remaining links:** The SEBI and Delhi Police links were kept. SEBI permits linking; the Delhi Police cyber page states no linking policy.

---

## F. Unresolved items needing human review

1. **Drafting history before this session.** Confirm that no third-party book, article, script or transcript was pasted into the AI as source text in earlier drafting sessions. Only the author can confirm this.
2. **Copyright and ownership notice.**
   - The text and images were produced with AI assistance.
   - Under Indian law, whether AI-assisted text or images can be copyrighted, and who holds the rights, is not settled.
   - Before adding a "© AQVIK" line or claiming ownership in a commercial edition, get advice. Keep records of the human creative contribution (the brief, edits, selection).
3. **Trademark clearance (needed before print, merchandise or app/brand use).** Have a professional search IP India and other databases for:
   - "Digital Thug Life"
   - ChatBox, VidCall, BechDo, QuickRupee, Avadh National Bank, SwiftParcel, PaisaTurant, BullMax Pro, ClipGram
   - the new names PayChakra and TrendVeer
4. **Image provenance.**
   - Record which tool or service made the Case 1 and Case 2–5 grids, which account was used and on what date.
   - Confirm that the tool's terms at that time allowed commercial use.
   - Confirm that no reference photo of a real person was uploaded.
5. **Legal review (light).**
   - Case 10's description of criminal exposure for mule-account holders (#26).
   - The RBI rule summaries in Cases 2 and 5, before any print edition.
   - Schedule an update in January 2027.
6. **Optional:** replace the generic real-sounding business names (Shree Ganesh Traders, Maa Durga Enterprises, Shiv Shakti Enterprises) with clearly invented ones.

---

## G. Publication recommendation

**READY AFTER SPECIFIC CORRECTIONS. The corrections are now made in the repository.**

**Free web edition.** Once the changes above are deployed, the free web edition is suitable for normal editorial publication, subject to the limits stated in this report:
- the originality check was a spot check;
- the trademark check was a web search only;
- image provenance is not documented.

**Print, paid, merchandise or brand extension.** **Hold** these until items F2–F4 are resolved:
- professional trademark clearance;
- advice on rights and ownership;
- confirmation of image-tool terms.
