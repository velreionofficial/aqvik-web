import type { ToolCopyWithNote } from "@/content/tools";

/**
 * Copy for the income tax regime calculator and the GST rate changes page.
 * Figures here were checked against official sources on 19 Oct 2026; see the
 * comments beside each block. Update them when the law changes.
 */

export const incomeTaxTool: ToolCopyWithNote = {
  slug: "income-tax-calculator",
  name: "Old vs New Regime Tax Calculator",
  cardLine: "Your income tax for 2026-27 under both regimes, and which one costs less.",
  title: "Income Tax Calculator 2026-27 — Old vs New Regime | AQVIK",
  description:
    "Compare your income tax for tax year 2026-27 under the old and the new regime, with standard deduction, rebate, surcharge and cess, and see which costs less.",
  h1: "Old vs new regime tax calculator",
  intro:
    "Enter your salary, other income and, for the old regime, your deductions. See the tax under both regimes for tax year 2026-27 (1 April 2026 to 31 March 2027) and which one costs less.",
  how: [
    "Tax year 2026-27 under the Income-tax Act, 2025, which applies from 1 April 2026. Budget 2026 kept the slabs unchanged.",
    "New regime: nil up to ₹4 lakh, 5% to ₹8 lakh, 10% to ₹12 lakh, 15% to ₹16 lakh, 20% to ₹20 lakh, 25% to ₹24 lakh and 30% above. A standard deduction of ₹75,000 applies to salary or pension. If taxable income is ₹12 lakh or less, a rebate of up to ₹60,000 makes the tax nil; just above ₹12 lakh, the tax cannot exceed the income above ₹12 lakh (marginal relief).",
    "Old regime: nil up to ₹2.5 lakh (₹3 lakh at age 60–79, ₹5 lakh at 80 or more), 5% to ₹5 lakh, 20% to ₹10 lakh and 30% above. Standard deduction ₹50,000. A rebate of up to ₹12,500 applies if taxable income is ₹5 lakh or less. Deductions you enter are capped where the law sets a single limit: ₹1.5 lakh for 80C-type savings, ₹2 lakh for self-occupied home-loan interest and ₹50,000 for your extra NPS contribution.",
    "Surcharge: 10% above ₹50 lakh, 15% above ₹1 crore, 25% above ₹2 crore and 37% above ₹5 crore (the new regime stops at 25%), with marginal relief at each step. Then 4% health and education cess on tax plus surcharge.",
    "Results are rounded to the rupee; returns round taxable income and tax to the nearest ₹10, so your return may differ by a few rupees.",
  ],
  faqs: [
    {
      question: "Which regime should I choose?",
      answer:
        "The one that costs you less tax for your own income and deductions. The new regime is the default. Salaried people can choose each year when filing the return; people with business income have fewer chances to switch. Confirm your case with a chartered accountant.",
    },
    {
      question: "What does this calculator leave out?",
      answer:
        "Capital gains and other income taxed at special rates, agricultural income, employer NPS contributions, deductions with income-based limits (such as donations), and the rules for non-residents. If any of these apply to you, the result will not be complete.",
    },
    {
      question: "Why are the section numbers different from 80C, 87A and 115BAC?",
      answer:
        "The Income-tax Act, 2025 replaced the 1961 Act from 1 April 2026 and renumbered most sections. This page uses the familiar names so the fields are easy to recognise; the limits are the same.",
    },
  ],
  note: "An estimate for a resident individual, based only on what you enter. It is not tax advice. Check your return or ask a chartered accountant before you decide.",
};

export const gstRatesTool: ToolCopyWithNote = {
  slug: "gst-rate-changes",
  name: "GST Rate Changes 2025",
  cardLine: "What GST was before 22 September 2025 and what it is now, for everyday goods and services.",
  title: "GST Rate Changes 2025 — Old vs New Rates List | AQVIK",
  description:
    "Search common goods and services and see the GST rate before and after 22 September 2025, with the official notification for each change.",
  h1: "GST rate changes: before and after 22 September 2025",
  intro:
    "From 22 September 2025, most goods moved to two main GST rates, 5% and 18%, with 40% for a few luxury and harmful goods. Search an item to see what it was and what it is now.",
  how: [
    "Rates come from the recommendations of the 56th GST Council meeting (3 September 2025), given effect by CBIC rate notifications dated 17 September 2025, including Notification No. 9/2025-Central Tax (Rate) for goods. The new rates apply from 22 September 2025.",
    "The rate shown is the total GST (CGST + SGST, or IGST). Many entries depend on conditions in the notification, such as \"pre-packaged and labelled\", an engine size, a length or a price limit.",
    "Tobacco, pan masala and similar products are left out because their tax changed separately and on different dates.",
    "For a supply that spans 22 September 2025, the rate depends on the dates of supply, invoice and payment (time of supply rules).",
  ],
  faqs: [
    {
      question: "How do I find the exact rate for my product?",
      answer:
        "The rate depends on the product's HSN code and the conditions in the notification. Use this list as a guide, then confirm the HSN code and rate with a chartered accountant or the official CBIC notification.",
    },
    {
      question: "Did every price fall after 22 September 2025?",
      answer:
        "No. Most everyday goods moved to a lower rate, but some, such as coal and large cars and motorcycles, moved to a higher one. Whether a shop's price changed also depends on the seller.",
    },
  ],
  note: "For information only. The official notifications are what apply; this list is not tax advice.",
};

export const gstRatesDisclaimer =
  "For information only. Rates and conditions are summarised from official sources and may change; the official notifications are what apply. This is not tax or legal advice.";

/** Source for the GST list (GST Council press release; the GST Council allows linking without prior permission). */
export const gstRatesSource = {
  label: "GST Council: recommendations of the 56th meeting (3 Sep 2025)",
  href: "https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau_0.pdf",
} as const;

export type GstChange = { item: string; group: string; before: string; after: string; keywords?: string };

/**
 * Everyday items, before → after 22 Sep 2025. From the 56th GST Council
 * press release annexures and PIB FAQs (checked 19 Oct 2026). Conditions are
 * kept in the item text; tobacco and pan masala are left out on purpose.
 */
export const gstChanges: readonly GstChange[] = [
  // Food
  { group: "Food", item: "UHT milk", before: "5%", after: "Nil", keywords: "doodh dudh" },
  { group: "Food", item: "Paneer / chena (pre-packaged and labelled)", before: "5%", after: "Nil" },
  { group: "Food", item: "Roti, chapati, khakhra, pizza bread", before: "5%", after: "Nil" },
  { group: "Food", item: "Paratha, parotta and other Indian breads", before: "18%", after: "Nil" },
  { group: "Food", item: "Butter, ghee, butter oil, cheese, condensed milk", before: "12%", after: "5%", keywords: "makhan" },
  { group: "Food", item: "Namkeen, bhujia, mixture (pre-packaged)", before: "12% / 18%", after: "5%", keywords: "snacks" },
  { group: "Food", item: "Dry fruits and nuts, pasta, corn flakes, chocolates, coffee extracts", before: "12% / 18%", after: "5%", keywords: "badam kaju meva" },
  { group: "Food", item: "Packaged drinking water in 20-litre bottles", before: "18%", after: "5%", keywords: "paani jar" },
  { group: "Food", item: "Soya milk drinks, milk-based beverages", before: "18%", after: "5%" },
  { group: "Food", item: "Aerated and caffeinated drinks (soft drinks)", before: "28%", after: "40%", keywords: "cold drink soda" },
  // Daily use
  { group: "Daily use", item: "Hair oil, shampoo, toothpaste, toilet soap, shaving cream, talcum powder", before: "18%", after: "5%", keywords: "sabun tel" },
  { group: "Daily use", item: "Toothbrushes", before: "18%", after: "5%" },
  { group: "Daily use", item: "Tooth powder, candles, matches, umbrellas", before: "12%", after: "5%", keywords: "machis chhata" },
  { group: "Daily use", item: "Kitchenware and tableware (wood, metal, porcelain)", before: "12%", after: "5%", keywords: "bartan" },
  { group: "Daily use", item: "Feeding bottles, baby napkins, clinical diapers", before: "12%", after: "5%" },
  { group: "Daily use", item: "Sewing machines", before: "12%", after: "5%", keywords: "silai" },
  { group: "Daily use", item: "Bicycles and their parts", before: "12%", after: "5%", keywords: "cycle" },
  // Health
  { group: "Health", item: "Most medicines and drugs (listed)", before: "12%", after: "5%", keywords: "dawai dawa" },
  { group: "Health", item: "33 listed life-saving drugs", before: "12%", after: "Nil" },
  { group: "Health", item: "Diagnostic kits, glucometers, bandages and dressings", before: "12%", after: "5%" },
  { group: "Health", item: "Medical thermometers", before: "18%", after: "5%" },
  { group: "Health", item: "Medical, surgical and dental instruments", before: "12% / 18%", after: "5%" },
  { group: "Health", item: "Medical-grade oxygen", before: "12%", after: "5%" },
  // Insurance and services
  { group: "Insurance & services", item: "Individual life insurance (term, ULIP, endowment)", before: "18%", after: "Nil (exempt)", keywords: "bima policy" },
  { group: "Insurance & services", item: "Individual health insurance (incl. family floater, senior citizen)", before: "18%", after: "Nil (exempt)", keywords: "mediclaim bima" },
  { group: "Insurance & services", item: "Hotel rooms up to ₹7,500 a night", before: "12%", after: "5% (no input tax credit)" },
  { group: "Insurance & services", item: "Gyms, salons, barbers, yoga and fitness centres", before: "18%", after: "5% (no input tax credit)", keywords: "parlour nai" },
  // Education
  { group: "Education", item: "Erasers", before: "5%", after: "Nil" },
  { group: "Education", item: "Pencils, sharpeners, exercise books, maps", before: "12%", after: "Nil", keywords: "copy kitaab stationery" },
  { group: "Education", item: "Geometry boxes, colour boxes", before: "12%", after: "5%" },
  // Farming
  { group: "Farming", item: "Tractors (except road tractors above 1800 cc)", before: "12%", after: "5%" },
  { group: "Farming", item: "Tractor tyres, tubes and listed parts", before: "18%", after: "5%" },
  { group: "Farming", item: "Harvesting and threshing machinery, sprinklers, drip irrigation, hand pumps", before: "12%", after: "5%", keywords: "kheti kisan" },
  { group: "Farming", item: "Listed bio-pesticides and micronutrients", before: "12%", after: "5%" },
  // Appliances and vehicles
  { group: "Appliances & vehicles", item: "Air conditioners", before: "28%", after: "18%", keywords: "ac" },
  { group: "Appliances & vehicles", item: "Television sets (all sizes)", before: "18% (up to 32\") / 28%", after: "18%", keywords: "tv led" },
  { group: "Appliances & vehicles", item: "Household dishwashers", before: "28%", after: "18%" },
  { group: "Appliances & vehicles", item: "Small cars (petrol/CNG/LPG ≤1200 cc, diesel ≤1500 cc, length ≤4 m)", before: "28%", after: "18%", keywords: "gaadi car" },
  { group: "Appliances & vehicles", item: "Bigger cars above those limits", before: "28%", after: "40%" },
  { group: "Appliances & vehicles", item: "Motorcycles up to 350 cc", before: "28%", after: "18%", keywords: "bike scooter" },
  { group: "Appliances & vehicles", item: "Motorcycles above 350 cc", before: "28%", after: "40%", keywords: "bike" },
  { group: "Appliances & vehicles", item: "Three-wheelers and ambulances", before: "28%", after: "18%", keywords: "auto rickshaw" },
  { group: "Appliances & vehicles", item: "Goods vehicles and buses for 10 or more people", before: "28%", after: "18%", keywords: "truck" },
  // Construction and energy
  { group: "Construction & energy", item: "Cement", before: "28%", after: "18%" },
  { group: "Construction & energy", item: "Marble and granite blocks", before: "12%", after: "5%" },
  { group: "Construction & energy", item: "Solar water heaters, solar cookers and listed renewable devices", before: "12%", after: "5%" },
  { group: "Construction & energy", item: "Coal, lignite, peat", before: "5%", after: "18%", keywords: "koyla" },
];
