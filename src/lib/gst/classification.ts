/**
 * Every kind of goods and services, organised the way GST classifies them:
 * goods by HSN chapter (all 96 chapters, 01–97; 77 is reserved) grouped into
 * the 21 HSN sections, and services by all SAC headings (9954–9999).
 *
 * The item picker uses this so any Indian business can find its category.
 * A category never sets a GST rate. For services it fills the 4-digit SAC
 * heading (a category is exactly a heading); for goods it only states the
 * chapter the HSN code must start with, because the full code depends on the
 * exact product. Example items are suggestions; users can type anything.
 *
 * No imports, so the tests can run this file directly with Node.
 */

export type Category = {
  /** "hsn-25" or "sac-9965" */
  id: string;
  kind: "goods" | "service";
  /** Chapter (2 digits) or SAC heading (4 digits) the code must start with. */
  prefix: string;
  name: string;
  group: string;
  unit: string;
  pricing: "rate" | "amount";
  items: readonly string[];
  note?: string;
};

type ChapterRow = [code: string, name: string, items?: readonly string[], unit?: string];

const HSN_SECTIONS: readonly { group: string; chapters: readonly ChapterRow[] }[] = [
  {
    group: "Animals and animal products",
    chapters: [
      ["01", "Live animals", ["Cattle", "Goats", "Poultry (live)"]],
      ["02", "Meat", ["Chicken", "Mutton"], "KGS"],
      ["03", "Fish and seafood", ["Fish", "Prawns"], "KGS"],
      ["04", "Dairy, eggs and honey", ["Milk", "Curd", "Paneer", "Butter", "Ghee", "Eggs", "Honey"]],
      ["05", "Other animal products", ["Bones", "Feathers"]],
    ],
  },
  {
    group: "Vegetable products",
    chapters: [
      ["06", "Live plants and flowers", ["Plants", "Flowers"]],
      ["07", "Vegetables", ["Potato", "Onion", "Tomato", "Fresh vegetables"], "KGS"],
      ["08", "Fruits and nuts", ["Fresh fruits", "Dry fruits", "Cashew"], "KGS"],
      ["09", "Coffee, tea and spices", ["Tea", "Coffee", "Spices", "Turmeric", "Chilli"], "KGS"],
      ["10", "Cereals", ["Rice", "Wheat", "Maize"], "KGS"],
      ["11", "Flour and milling products", ["Wheat flour (Atta)", "Maida", "Suji", "Besan"], "KGS"],
      ["12", "Oil seeds and fodder", ["Mustard seeds", "Groundnut", "Soybean", "Seeds for sowing"], "KGS"],
      ["13", "Lac, gums and resins", ["Lac", "Gum"]],
      ["14", "Vegetable plaiting materials", ["Bamboo", "Cane"]],
    ],
  },
  {
    group: "Fats and oils",
    chapters: [["15", "Animal and vegetable fats and oils", ["Mustard oil", "Refined oil", "Vanaspati"], "LTR"]],
  },
  {
    group: "Prepared food, beverages and tobacco",
    chapters: [
      ["16", "Meat and fish preparations", ["Processed meat"]],
      ["17", "Sugar and confectionery", ["Sugar", "Jaggery (Gur)", "Sugar confectionery (toffees)"], "KGS"],
      ["18", "Cocoa and chocolate", ["Chocolate"]],
      ["19", "Bakery and cereal preparations", ["Biscuits", "Bread", "Cakes", "Noodles", "Breakfast cereals"]],
      ["20", "Vegetable and fruit preparations", ["Pickles", "Jam", "Fruit juice", "Potato chips"]],
      ["21", "Miscellaneous food preparations", ["Namkeen", "Sauces and ketchup", "Ice cream", "Food supplements", "Indian sweets (mithai)"]],
      ["22", "Beverages and water", ["Packaged drinking water", "Soft drinks", "Soda"]],
      ["23", "Animal feed and residues", ["Cattle feed", "Poultry feed", "Oil cake"], "KGS"],
      [
        "24", "Tobacco products", ["Tobacco", "Bidi", "Cigarettes"],
      ],
    ],
  },
  {
    group: "Mineral products",
    chapters: [
      ["25", "Salt, sand, stone, lime and cement", ["Sand (Balu)", "Stone chips (Gitti)", "Stone dust", "Boulders", "Morrum", "Soil / Mitti", "Cement", "Lime", "Salt", "Gypsum"], "MTS"],
      ["26", "Ores, slag and ash", ["Iron ore", "Fly ash"], "MTS"],
      ["27", "Mineral fuels, coal and petroleum", ["Coal", "Diesel", "Petrol", "Bitumen", "LPG", "Kerosene"], "MTS"],
    ],
  },
  {
    group: "Chemicals and pharmaceuticals",
    chapters: [
      ["28", "Inorganic chemicals", ["Industrial gases", "Acids"]],
      ["29", "Organic chemicals", ["Solvents", "Alcohols (industrial)"]],
      ["30", "Pharmaceutical products", ["Medicines", "Ayurvedic medicines", "Bandages", "Vaccines"]],
      ["31", "Fertilisers", ["Urea", "DAP", "Organic fertiliser"], "BAG"],
      ["32", "Paints, dyes and inks", ["Paint", "Distemper", "Putty", "Printing ink"]],
      ["33", "Cosmetics and perfumes", ["Shampoo", "Hair oil", "Cream and lotion", "Perfume", "Toothpaste"]],
      ["34", "Soap, detergents and wax", ["Soap", "Detergent", "Floor cleaner", "Candles"]],
      ["35", "Glues and starches", ["Adhesive / glue", "Starch"]],
      ["36", "Explosives and matches", ["Matches", "Fireworks"]],
      ["37", "Photographic goods", ["Photographic film", "X-ray film"]],
      ["38", "Miscellaneous chemical products", ["Pesticides", "Ready-mix concrete", "Admixtures", "Sanitiser"]],
    ],
  },
  {
    group: "Plastics and rubber",
    chapters: [
      ["39", "Plastics and plastic articles", ["PVC pipes", "Plastic sheets", "Plastic containers", "Water tank"]],
      ["40", "Rubber and rubber articles", ["Tyres", "Tubes", "Rubber products"]],
    ],
  },
  {
    group: "Leather and leather goods",
    chapters: [
      ["41", "Raw hides and leather", ["Leather"]],
      ["42", "Leather goods, bags and travel goods", ["Bags", "Suitcases", "Wallets", "Belts"]],
      ["43", "Fur and fur articles", ["Fur products"]],
    ],
  },
  {
    group: "Wood and wood products",
    chapters: [
      ["44", "Wood and wooden articles", ["Timber", "Plywood", "Doors and windows (wooden)"]],
      ["45", "Cork", ["Cork products"]],
      ["46", "Basketware and wickerwork", ["Baskets", "Mats"]],
    ],
  },
  {
    group: "Paper and printing",
    chapters: [
      ["47", "Wood pulp and waste paper", ["Waste paper"]],
      ["48", "Paper and paperboard", ["Paper", "Cartons / boxes", "Notebooks", "Tissue paper"]],
      ["49", "Printed books and printed matter", ["Books", "Newspapers", "Calendars"]],
    ],
  },
  {
    group: "Textiles and garments",
    chapters: [
      ["50", "Silk", ["Silk fabric"]],
      ["51", "Wool", ["Woollen yarn"]],
      ["52", "Cotton", ["Cotton yarn", "Cotton fabric"]],
      ["53", "Jute and other vegetable fibres", ["Jute", "Jute fabric"]],
      ["54", "Man-made filaments", ["Polyester yarn", "Synthetic fabric"]],
      ["55", "Man-made staple fibres", ["Viscose fabric"]],
      ["56", "Wadding, felt, ropes and nets", ["Ropes", "Nets"]],
      ["57", "Carpets and floor coverings", ["Carpets", "Durries"]],
      ["58", "Special woven fabrics and embroidery", ["Lace", "Embroidery"]],
      ["59", "Coated and industrial textiles", ["Tarpaulin"]],
      ["60", "Knitted fabrics", ["Knitted fabric"]],
      ["61", "Knitted garments", ["T-shirts", "Innerwear", "Sweaters"], "PCS"],
      ["62", "Garments (not knitted)", ["Shirts", "Trousers", "Sarees", "Suits", "Kurtas"], "PCS"],
      ["63", "Made-up textiles", ["Bedsheets", "Curtains", "Towels", "Sacks / bags (woven)"], "PCS"],
    ],
  },
  {
    group: "Footwear, umbrellas and accessories",
    chapters: [
      ["64", "Footwear", ["Shoes", "Sandals", "Slippers"], "PRS"],
      ["65", "Headgear", ["Caps", "Helmets"]],
      ["66", "Umbrellas and walking sticks", ["Umbrellas"]],
      ["67", "Artificial flowers and wigs", ["Artificial flowers"]],
    ],
  },
  {
    group: "Stone, ceramics and glass articles",
    chapters: [
      ["68", "Articles of stone, cement and plaster", ["Marble slabs", "Granite", "Cement blocks", "Fly ash bricks", "AC sheets", "Paver blocks"]],
      ["69", "Ceramic products", ["Bricks", "Tiles", "Sanitaryware"]],
      ["70", "Glass and glassware", ["Glass sheets", "Glass bottles", "Mirrors"]],
    ],
  },
  {
    group: "Jewellery and precious metals",
    chapters: [["71", "Jewellery, gold, silver and precious stones", ["Gold jewellery", "Silver jewellery", "Diamonds", "Imitation jewellery"]]],
  },
  {
    group: "Base metals and metal articles",
    chapters: [
      ["72", "Iron and steel", ["TMT steel bars (Sariya)", "MS sheets", "Angles and channels", "Binding wire", "Steel scrap"], "MTS"],
      ["73", "Articles of iron and steel", ["Steel pipes", "Nuts and bolts", "Steel doors and grills", "Steel structures", "Nails"]],
      ["74", "Copper and copper articles", ["Copper wire", "Copper utensils"]],
      ["75", "Nickel", ["Nickel products"]],
      ["76", "Aluminium and aluminium articles", ["Aluminium sections", "Aluminium utensils"]],
      ["78", "Lead", ["Lead products"]],
      ["79", "Zinc", ["Zinc products"]],
      ["80", "Tin", ["Tin products"]],
      ["81", "Other base metals", ["Other metals"]],
      ["82", "Tools and cutlery", ["Hand tools", "Knives", "Spoons and cutlery"]],
      ["83", "Miscellaneous metal articles", ["Locks", "Hinges and fittings"]],
    ],
  },
  {
    group: "Machinery and electrical",
    chapters: [
      ["84", "Machinery and mechanical appliances", ["Pump set", "Engine", "Compressor", "Fans", "Computers and laptops", "Printers", "Air conditioner", "Weighing machines", "Machinery spare parts"], "NOS"],
      ["85", "Electrical machinery and electronics", ["Wires and cables", "Switches and sockets", "LED lamps", "Electric motors", "Mobile phones", "Television", "CCTV cameras", "Batteries", "Solar panels", "Generator", "Transformer"], "NOS"],
    ],
  },
  {
    group: "Vehicles and transport equipment",
    chapters: [
      ["86", "Railway equipment", ["Railway parts"]],
      ["87", "Vehicles and parts", ["Two-wheeler", "Car", "Tractor", "Truck", "E-rickshaw", "Bicycle", "Vehicle spare parts"], "NOS"],
      ["88", "Aircraft and parts", ["Drones", "Aircraft parts"]],
      ["89", "Ships and boats", ["Boats"]],
    ],
  },
  {
    group: "Instruments, clocks and music",
    chapters: [
      ["90", "Optical, medical and measuring instruments", ["Spectacles", "Medical equipment", "Measuring instruments"]],
      ["91", "Clocks and watches", ["Watches", "Clocks"]],
      ["92", "Musical instruments", ["Musical instruments"]],
    ],
  },
  {
    group: "Arms and ammunition",
    chapters: [["93", "Arms and ammunition", ["Arms", "Ammunition"]]],
  },
  {
    group: "Miscellaneous manufactured articles",
    chapters: [
      ["94", "Furniture, bedding and lighting", ["Furniture", "Mattress", "Office chairs", "Light fittings", "Prefabricated buildings"]],
      ["95", "Toys, games and sports goods", ["Toys", "Sports goods", "Gym equipment"]],
      ["96", "Miscellaneous articles (pens, brushes, buttons)", ["Pens", "Brushes", "Sanitary pads", "Diapers"]],
    ],
  },
  {
    group: "Art and antiques",
    chapters: [["97", "Works of art and antiques", ["Paintings", "Sculptures"]]],
  },
];

type HeadingRow = [code: string, name: string, items: readonly string[], note?: string];

const SAC_HEADINGS: readonly { group: string; headings: readonly HeadingRow[] }[] = [
  {
    group: "Construction and real estate",
    headings: [
      ["9954", "Construction services", ["Civil construction work", "Road work", "Earth work", "Building repair work", "Electrical installation work", "Plumbing work", "Painting work"]],
      ["9972", "Real estate services", ["Shop / office rent", "Commercial property rent", "Property brokerage"]],
    ],
  },
  {
    group: "Trade, hotels and food",
    headings: [
      ["9961", "Wholesale trade services (commission)", ["Commission agent services"]],
      ["9962", "Retail trade services (commission)", ["Retail commission"]],
      ["9963", "Accommodation, food and beverage services", ["Hotel room charges", "Accommodation charges", "Restaurant bill", "Catering services", "Canteen services"]],
    ],
  },
  {
    group: "Transport, storage and courier",
    headings: [
      ["9964", "Passenger transport services", ["Bus / taxi service", "Tour transport", "Passenger transport"]],
      [
        "9965", "Goods transport services", ["Freight charges", "Transportation charges (trip)", "Transportation charges (monthly)"],
        "If you issue a consignment note (you are a Goods Transport Agency), GST on freight is often paid by a registered recipient under reverse charge unless you have opted to pay it yourself. If the recipient pays, set \"Tax payable on reverse charge\" to Yes. Add the vehicle number and the from/to places under \"Order and transport details\".",
      ],
      [
        "9966", "Rental of transport vehicles with operator", ["Truck / tipper hire with driver (monthly)", "Truck / tipper hire with driver (daily)", "Car / bus hire with driver"],
        "Hiring out a vehicle with a driver is a different service from transporting goods (GTA), with its own rate. Check the exact SAC and rate for your service on the GST portal.",
      ],
      ["9967", "Supporting services in transport", ["Loading and unloading charges", "Warehousing / storage", "Cargo handling", "Parking charges", "Toll charges"]],
      ["9968", "Postal and courier services", ["Courier charges", "Local delivery charges"]],
    ],
  },
  {
    group: "Utilities",
    headings: [
      ["9969", "Electricity, gas and water distribution", ["Electricity distribution", "Water supply"]],
      ["9994", "Sewage, waste collection and disposal", ["Waste collection", "Sewage cleaning"]],
    ],
  },
  {
    group: "Finance, leasing and rental",
    headings: [
      ["9971", "Financial and related services", ["Financial services", "Insurance services", "Loan processing charges"]],
      ["9973", "Leasing or rental without operator", ["Machinery / equipment hire (without operator)", "Vehicle rent (without driver)", "Furniture / tent rent", "Generator hire (without operator)", "Scaffolding hire"]],
    ],
  },
  {
    group: "Professional and business services",
    headings: [
      ["9981", "Research and development services", ["Research services"]],
      ["9982", "Legal and accounting services", ["Legal services", "Accounting and bookkeeping", "Audit services", "Tax consultancy"]],
      ["9983", "Other professional, technical and business services", ["Consultancy fees", "Architect services", "Engineering services", "Software development", "Website design", "IT support", "Advertising and marketing", "Photography"]],
      ["9984", "Telecom, broadcasting and information services", ["Internet services", "Cable / DTH services", "Online content"]],
      ["9985", "Support services", ["Manpower supply", "Security services", "Housekeeping / cleaning", "Travel agency services", "Event management", "Labour charges"]],
      ["9986", "Support services to agriculture, mining and utilities", ["Agriculture support services", "Mining support services", "Drilling services"]],
    ],
  },
  {
    group: "Repair, job work and manufacturing",
    headings: [
      ["9987", "Maintenance, repair and installation", ["Vehicle repair", "Machinery repair", "AMC charges", "Installation charges", "Electronics repair"]],
      ["9988", "Manufacturing on others' inputs (job work)", ["Job work charges", "Stitching / tailoring job work", "Fabrication job work"]],
      ["9989", "Other manufacturing, printing and recycling services", ["Printing services", "Publishing services", "Recycling services"]],
    ],
  },
  {
    group: "Education, health and community",
    headings: [
      ["9991", "Public administration services", ["Government services"]],
      ["9992", "Education services", ["Coaching / tuition fees", "Training fees", "Course fees"]],
      ["9993", "Human health and social care", ["Medical consultation", "Diagnostic / lab tests", "Hospital services"]],
      ["9995", "Services of membership organisations", ["Membership fees", "Association / club fees"]],
      ["9996", "Recreational, cultural and sporting services", ["Entertainment / event tickets", "Sports and gym services"]],
    ],
  },
  {
    group: "Personal and other services",
    headings: [
      ["9997", "Other services (laundry, beauty, wellness)", ["Laundry / dry cleaning", "Beauty parlour / salon", "Fitness / wellness"]],
      ["9998", "Domestic services", ["Domestic help services"]],
      ["9999", "Services by extraterritorial organisations", ["Services by international bodies"]],
    ],
  },
];

const TOBACCO_NOTE =
  "Tobacco products may still attract compensation cess, which this tool does not support yet. Do not use it for items that carry cess.";

export const GOODS_CATEGORIES: readonly Category[] = HSN_SECTIONS.flatMap((section) =>
  section.chapters.map(([code, name, items = [], unit = "NOS"]) => ({
    id: `hsn-${code}`,
    kind: "goods" as const,
    prefix: code,
    name: `${code} · ${name}`,
    group: section.group,
    unit,
    pricing: "rate" as const,
    items,
    ...(code === "24" ? { note: TOBACCO_NOTE } : {}),
  })),
);

export const SERVICE_CATEGORIES: readonly Category[] = SAC_HEADINGS.flatMap((section) =>
  section.headings.map(([code, name, items, note]) => ({
    id: `sac-${code}`,
    kind: "service" as const,
    prefix: code,
    name: `${code} · ${name}`,
    group: section.group,
    unit: "OTH",
    pricing: "amount" as const,
    items,
    ...(note ? { note } : {}),
  })),
);

export const ALL_CATEGORIES: readonly Category[] = [...GOODS_CATEGORIES, ...SERVICE_CATEGORIES];

export function findCategory(id: string): Category | undefined {
  return ALL_CATEGORIES.find((category) => category.id === id);
}

/** The category whose example list contains this exact item name, if any. */
export function categoryForItem(description: string): Category | undefined {
  const text = description.trim().toLowerCase();
  if (!text) return undefined;
  return ALL_CATEGORIES.find((category) => category.items.some((item) => item.toLowerCase() === text));
}
