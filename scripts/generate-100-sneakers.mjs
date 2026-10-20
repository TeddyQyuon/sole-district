import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../public/assets/sneakers');
const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const previewPath = path.resolve(__dirname, '../backend/shop/catalog_preview.json');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 100+ Curated, Verified Top Sneakers for Selling
const SNEAKER_DEFINITIONS = [
  // --- AIR JORDAN 1 ---
  {
    slug: "Air-Jordan-1-Retro-High-OG-Chicago-Reimagined",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
    silhouette: "Air Jordan 1",
    badge: "Grail",
    price: 27900,
    color: "Varsity Red / Black / Sail / Muslin",
    sku: "DZ5485-612",
    featured: true
  },
  {
    slug: "Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Reverse-Mocha",
    brand: "Jordan",
    name: "Air Jordan 1 Retro Low OG 'Travis Scott Reverse Mocha'",
    silhouette: "Air Jordan 1",
    badge: "Hype",
    price: 39900,
    color: "Sail / University Red / Ridgerock",
    sku: "DM7866-162",
    featured: true
  },
  {
    slug: "Air-Jordan-1-Retro-High-Travis-Scott",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Travis Scott'",
    silhouette: "Air Jordan 1",
    badge: "Grail",
    price: 45900,
    color: "Sail / Dark Mocha / University Red / Black",
    sku: "CD4487-100",
    featured: true
  },
  {
    slug: "Air-Jordan-1-Retro-High-Dark-Mocha",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Dark Mocha'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 28900,
    color: "Sail / Dark Mocha / Black",
    sku: "555088-105",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Low-Wolf-Grey-W",
    brand: "Jordan",
    name: "Air Jordan 1 Low 'Wolf Grey'",
    silhouette: "Air Jordan 1",
    badge: "Essential",
    price: 18900,
    color: "Wolf Grey / White / Photon Dust",
    sku: "DC0774-105",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Court-Purple-White",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Court Purple 2.0'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 26900,
    color: "Court Purple / White / Black",
    sku: "555088-500",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Pine-Green-Black",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Pine Green 2.0'",
    silhouette: "Air Jordan 1",
    badge: "Trending",
    price: 25900,
    color: "Pine Green / Black / Sail / Gym Red",
    sku: "555088-030",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Bio-Hack",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Bio Hack'",
    silhouette: "Air Jordan 1",
    badge: "Collab",
    price: 27900,
    color: "Baroque Brown / Black / Laser Orange / Racer Pink",
    sku: "555088-201",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Pollen",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Pollen'",
    silhouette: "Air Jordan 1",
    badge: "Classic",
    price: 23900,
    color: "Pollen / Black / White",
    sku: "555088-701",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Bordeaux",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Bordeaux'",
    silhouette: "Air Jordan 1",
    badge: "Heritage",
    price: 24900,
    color: "Bordeaux / White / Metallic Silver",
    sku: "555088-611",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Heritage",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Heritage'",
    silhouette: "Air Jordan 1",
    badge: "Classic",
    price: 23900,
    color: "White / University Red / Black",
    sku: "555088-161",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Bleached-Coral",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Stage Haze'",
    silhouette: "Air Jordan 1",
    badge: "Trending",
    price: 26900,
    color: "White / Black / Grey Fog / Bleached Coral",
    sku: "555088-108",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Electro-Orange",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Electro Orange'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 24900,
    color: "White / Electro Orange / Black",
    sku: "555088-180",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-Silver-Toe-W",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Silver Toe'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 25900,
    color: "Black / Metallic Silver / White",
    sku: "CD0461-001",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Mid-Light-Smoke-Grey",
    brand: "Jordan",
    name: "Air Jordan 1 Mid 'Light Smoke Grey'",
    silhouette: "Air Jordan 1",
    badge: "Top Seller",
    price: 19900,
    color: "Light Smoke Grey / Black / White",
    sku: "554724-092",
    featured: false
  },

  // --- AIR JORDAN 3 ---
  {
    slug: "Air-Jordan-3-Retro-White-Cement-Reimagined",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'White Cement Reimagined'",
    silhouette: "Air Jordan 3",
    badge: "Grail",
    price: 28900,
    color: "Summit White / Fire Red / Black / Cement Grey",
    sku: "DN3707-100",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Fire-Red-2022",
    brand: "Jordan",
    name: "Air Jordan 3 Retro OG 'Fire Red' (2022)",
    silhouette: "Air Jordan 3",
    badge: "Heritage",
    price: 27900,
    color: "White / Fire Red / Cement Grey / Black",
    sku: "DN3707-160",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Black-Cement-2018",
    brand: "Jordan",
    name: "Air Jordan 3 Retro OG 'Black Cement'",
    silhouette: "Air Jordan 3",
    badge: "Grail",
    price: 32900,
    color: "Black / Fire Red / Cement Grey / White",
    sku: "854262-001",
    featured: true
  },
  {
    slug: "Air-Jordan-3-Retro-Midnight-Navy",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Midnight Navy'",
    silhouette: "Air Jordan 3",
    badge: "Popular",
    price: 26900,
    color: "White / Midnight Navy / Cement Grey",
    sku: "CT8532-140",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Palomino",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Palomino'",
    silhouette: "Air Jordan 3",
    badge: "Trending",
    price: 26900,
    color: "Light Orewood Brown / Metallic Gold / Light British Tan",
    sku: "CT8532-102",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Desert-Elephant",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Desert Elephant'",
    silhouette: "Air Jordan 3",
    badge: "Classic",
    price: 25900,
    color: "Black / Rush Orange / Fossil Stone / Sail",
    sku: "CT8532-008",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-UNC-2020",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'UNC'",
    silhouette: "Air Jordan 3",
    badge: "Grail",
    price: 38900,
    color: "White / Valor Blue / Tech Grey",
    sku: "CT8532-104",
    featured: true
  },
  {
    slug: "Air-Jordan-3-Retro-Cool-Grey-2021",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Cool Grey'",
    silhouette: "Air Jordan 3",
    badge: "Classic",
    price: 26900,
    color: "Silver / Light Graphite / Orange Peel / Sport Red",
    sku: "CT8532-012",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Cardinal-Red",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Cardinal Red'",
    silhouette: "Air Jordan 3",
    badge: "Popular",
    price: 25900,
    color: "White / Cardinal Red / Cement Grey / Light Curry",
    sku: "CT8532-126",
    featured: false
  },
  {
    slug: "Air-Jordan-3-Retro-Georgetown-2021",
    brand: "Jordan",
    name: "Air Jordan 3 Retro 'Midnight Navy Georgetown'",
    silhouette: "Air Jordan 3",
    badge: "Popular",
    price: 27900,
    color: "Midnight Navy / Cement Grey / White",
    sku: "CT8532-401",
    featured: false
  },

  // --- AIR JORDAN 4 ---
  {
    slug: "Air-Jordan-4-Retro-Military-Black",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Military Black'",
    silhouette: "Air Jordan 4",
    badge: "Trending",
    price: 29900,
    color: "White / Black / Neutral Grey",
    sku: "DH6927-111",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-Bred-Reimagined",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Bred Reimagined'",
    silhouette: "Air Jordan 4",
    badge: "Iconic",
    price: 31900,
    color: "Black / Fire Red / Cement Grey / Summit White",
    sku: "FV5029-006",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-Black-Cat-2020",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Black Cat'",
    silhouette: "Air Jordan 4",
    badge: "Grail",
    price: 49900,
    color: "Black / Black / Light Graphite",
    sku: "CU1110-010",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-Red-Cement",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Red Cement'",
    silhouette: "Air Jordan 4",
    badge: "Popular",
    price: 28900,
    color: "White / Fire Red / Black / Neutral Grey",
    sku: "DH6927-161",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Midnight-Navy",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Midnight Navy'",
    silhouette: "Air Jordan 4",
    badge: "Popular",
    price: 28900,
    color: "White / Midnight Navy / Light Smoke Grey",
    sku: "DH6927-140",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Thunder-2023",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Thunder' (2023)",
    silhouette: "Air Jordan 4",
    badge: "Top Seller",
    price: 29900,
    color: "Black / Tour Yellow",
    sku: "DH6927-017",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-University-Blue",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'University Blue'",
    silhouette: "Air Jordan 4",
    badge: "Grail",
    price: 38900,
    color: "University Blue / Tech Grey / White / Black",
    sku: "CT8527-400",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-White-Oreo-2021",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'White Oreo'",
    silhouette: "Air Jordan 4",
    badge: "Popular",
    price: 36900,
    color: "White / Tech Grey / Black / Fire Red",
    sku: "CT8527-100",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Infrared",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Infrared'",
    silhouette: "Air Jordan 4",
    badge: "Classic",
    price: 28900,
    color: "Dark Grey / Infrared 23 / Black / Cement Grey",
    sku: "DH6927-061",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Taupe-Haze",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Taupe Haze'",
    silhouette: "Air Jordan 4",
    badge: "Trending",
    price: 34900,
    color: "Taupe Haze / Oil Grey / Off White / Infrared 23",
    sku: "DB0732-200",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Lightning-2021",
    brand: "Jordan",
    name: "Air Jordan 4 Retro 'Lightning' (2021)",
    silhouette: "Air Jordan 4",
    badge: "Iconic",
    price: 29900,
    color: "Tour Yellow / White / Dark Blue Grey",
    sku: "CT8527-700",
    featured: false
  },
  {
    slug: "Air-Jordan-4-Retro-Fire-Red-2020",
    brand: "Jordan",
    name: "Air Jordan 4 Retro OG 'Fire Red'",
    silhouette: "Air Jordan 4",
    badge: "Heritage",
    price: 34900,
    color: "White / Fire Red / Black / Tech Grey",
    sku: "DC7770-160",
    featured: false
  },

  // --- AIR JORDAN 5, 11 ---
  {
    slug: "Air-Jordan-11-Retro-Concord-2018",
    brand: "Jordan",
    name: "Air Jordan 11 Retro 'Concord'",
    silhouette: "Air Jordan 11",
    badge: "Heritage",
    price: 32900,
    color: "White / Black / Dark Concord",
    sku: "378037-100",
    featured: false
  },
  {
    slug: "Air-Jordan-11-Retro-Bred-2019",
    brand: "Jordan",
    name: "Air Jordan 11 Retro 'Bred' (2019)",
    silhouette: "Air Jordan 11",
    badge: "Grail",
    price: 35900,
    color: "Black / White / Varsity Red",
    sku: "378037-061",
    featured: true
  },
  {
    slug: "Air-Jordan-11-Retro-Cool-Grey-2021",
    brand: "Jordan",
    name: "Air Jordan 11 Retro 'Cool Grey'",
    silhouette: "Air Jordan 11",
    badge: "Iconic",
    price: 33900,
    color: "Medium Grey / White / Cool Grey",
    sku: "CT8012-005",
    featured: false
  },
  {
    slug: "Air-Jordan-11-Retro-Cherry-2022",
    brand: "Jordan",
    name: "Air Jordan 11 Retro 'Cherry'",
    silhouette: "Air Jordan 11",
    badge: "Popular",
    price: 31900,
    color: "White / Varsity Red / Black",
    sku: "CT8012-116",
    featured: false
  },
  {
    slug: "Air-Jordan-5-Retro-Raging-Bull-2021",
    brand: "Jordan",
    name: "Air Jordan 5 Retro 'Raging Bull' (Toro Bravo)",
    silhouette: "Air Jordan 5",
    badge: "Iconic",
    price: 29900,
    color: "Varsity Red / Black / White",
    sku: "DD0587-600",
    featured: false
  },

  // --- NIKE DUNK LOW & SB DUNK ---
  {
    slug: "Nike-Dunk-Low-Retro-White-Black-2021",
    brand: "Nike",
    name: "Dunk Low 'Panda'",
    silhouette: "Dunk Low",
    badge: "Top Seller",
    price: 17900,
    color: "White / Black",
    sku: "DD1391-100",
    featured: true
  },
  {
    slug: "Nike-Dunk-Low-Grey-Fog",
    brand: "Nike",
    name: "Dunk Low 'Grey Fog'",
    silhouette: "Dunk Low",
    badge: "Essential",
    price: 18900,
    color: "White / Grey Fog",
    sku: "DD1391-103",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Medium-Olive",
    brand: "Nike",
    name: "Dunk Low 'Medium Olive'",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 19900,
    color: "White / Medium Olive",
    sku: "DD1503-120",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Valerian-Blue",
    brand: "Nike",
    name: "Dunk Low 'Valerian Blue'",
    silhouette: "Dunk Low",
    badge: "Trending",
    price: 18900,
    color: "Valerian Blue / White",
    sku: "DD1391-400",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Polar-Blue",
    brand: "Nike",
    name: "Dunk Low 'Polar Blue'",
    silhouette: "Dunk Low",
    badge: "Trending",
    price: 18900,
    color: "Polar Blue / White",
    sku: "DV0831-401",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Court-Purple",
    brand: "Nike",
    name: "Dunk Low 'Court Purple'",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 19900,
    color: "White / Court Purple",
    sku: "DD1391-104",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-University-Blue-2021",
    brand: "Nike",
    name: "Dunk Low 'University Blue'",
    silhouette: "Dunk Low",
    badge: "Grail",
    price: 27900,
    color: "White / University Blue",
    sku: "DD1391-102",
    featured: true
  },
  {
    slug: "Nike-Dunk-Low-Syracuse-2021",
    brand: "Nike",
    name: "Dunk Low 'Syracuse' (Orange Blaze)",
    silhouette: "Dunk Low",
    badge: "Classic",
    price: 26900,
    color: "White / Orange Blaze",
    sku: "DD1391-800",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Kentucky-2021",
    brand: "Nike",
    name: "Dunk Low 'Kentucky' (Varsity Royal)",
    silhouette: "Dunk Low",
    badge: "Classic",
    price: 26900,
    color: "White / Varsity Royal",
    sku: "DD1391-101",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Michigan-State",
    brand: "Nike",
    name: "Dunk Low 'Michigan State' (Spartan Green)",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 24900,
    color: "White / Team Green",
    sku: "DD1391-101",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Goldenrod",
    brand: "Nike",
    name: "Dunk Low 'Goldenrod' (Iowa)",
    silhouette: "Dunk Low",
    badge: "Heritage",
    price: 17900,
    color: "Black / Goldenrod / White",
    sku: "DD1391-004",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Georgetown",
    brand: "Nike",
    name: "Dunk Low 'Georgetown' (Championship Grey)",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 18900,
    color: "Wolf Grey / Dark Obsidian / Total Orange",
    sku: "DD1391-003",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Team-Red",
    brand: "Nike",
    name: "Dunk Low 'Team Red'",
    silhouette: "Dunk Low",
    badge: "Classic",
    price: 18900,
    color: "White / Team Red",
    sku: "DD1391-601",
    featured: false
  },
  {
    slug: "Nike-SB-Dunk-Low-Los-Angeles-Dodgers",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'Los Angeles Dodgers'",
    silhouette: "Dunk Low",
    badge: "Collab",
    price: 25900,
    color: "Deep Royal Blue / White / Sport Red",
    sku: "DO9395-400",
    featured: true
  },
  {
    slug: "Nike-SB-Dunk-Low-Court-Purple",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'Court Purple'",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 23900,
    color: "Court Purple / White / Black",
    sku: "BQ6817-500",
    featured: false
  },
  {
    slug: "Nike-SB-Dunk-Low-Fog",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'Fog'",
    silhouette: "Dunk Low",
    badge: "Trending",
    price: 22900,
    color: "Black / Cool Grey / Gum Light Brown",
    sku: "BQ6817-010",
    featured: false
  },
  {
    slug: "Nike-SB-Dunk-Low-Black-Gum",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'Black Gum'",
    silhouette: "Dunk Low",
    badge: "Essential",
    price: 19900,
    color: "Black / White / Gum Light Brown",
    sku: "CD2563-006",
    featured: false
  },
  {
    slug: "Nike-SB-Dunk-Low-White-Gum",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'White Gum'",
    silhouette: "Dunk Low",
    badge: "Essential",
    price: 19900,
    color: "White / Black / Gum Light Brown",
    sku: "CD2563-101",
    featured: false
  },

  // --- NIKE AIR FORCE 1 & AIR MAX ---
  {
    slug: "Nike-Air-Force-1-Low-White-07",
    brand: "Nike",
    name: "Air Force 1 '07 'Triple White'",
    silhouette: "Air Force 1",
    badge: "Classic",
    price: 15900,
    color: "White / White / White",
    sku: "CW2288-111",
    featured: false
  },
  {
    slug: "Nike-Air-Force-1-Low-07-Black",
    brand: "Nike",
    name: "Air Force 1 '07 'Triple Black'",
    silhouette: "Air Force 1",
    badge: "Essential",
    price: 15900,
    color: "Black / Black / Black",
    sku: "CW2288-001",
    featured: false
  },
  {
    slug: "Nike-Air-Force-1-Low-Supreme-White",
    brand: "Nike",
    name: "Nike Air Force 1 Low 'Supreme White'",
    silhouette: "Air Force 1",
    badge: "Hype",
    price: 24900,
    color: "White / White",
    sku: "CU9225-100",
    featured: true
  },
  {
    slug: "Nike-Air-Force-1-Low-Tiffany-and-Co-1837",
    brand: "Nike",
    name: "Nike Air Force 1 Low 'Tiffany & Co. 1837'",
    silhouette: "Air Force 1",
    badge: "Grail",
    price: 89900,
    color: "Black / Tiffany Blue",
    sku: "DZ1382-001",
    featured: true
  },
  {
    slug: "Nike-Air-Max-1-Travis-Scott-Wheat",
    brand: "Nike",
    name: "Air Max 1 'Travis Scott Cactus Jack Wheat'",
    silhouette: "Air Max 1",
    badge: "Hype",
    price: 34900,
    color: "Wheat / Lemon Drop / Baroque Brown",
    sku: "DO9392-700",
    featured: true
  },
  {
    slug: "Nike-Air-Max-1-Travis-Scott-Saturn-Gold",
    brand: "Nike",
    name: "Air Max 1 'Travis Scott Saturn Gold'",
    silhouette: "Air Max 1",
    badge: "Hype",
    price: 33900,
    color: "Saturn Gold / Tea Tree Blue / Tent",
    sku: "DO9392-701",
    featured: false
  },
  {
    slug: "Nike-Air-Max-1-Crepe-Hemp-2022",
    brand: "Nike",
    name: "Air Max 1 'Crepe Hemp' (2022)",
    silhouette: "Air Max 1",
    badge: "Heritage",
    price: 24900,
    color: "Medium Brown / Mint Foam / Mushroom / Sail",
    sku: "FD5088-200",
    featured: false
  },

  // --- ADIDAS YEEZY BOOST 350 V2 ---
  {
    slug: "adidas-Yeezy-Boost-350-V2-Zebra",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Zebra'",
    silhouette: "Yeezy 350",
    badge: "Iconic",
    price: 34900,
    color: "White / Core Black / Red",
    sku: "CP9654",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Onyx",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Onyx'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 33900,
    color: "Onyx / Core Black / Charcoal",
    sku: "HQ4540",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Bred",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Core Black Red' (Bred)",
    silhouette: "Yeezy 350",
    badge: "Grail",
    price: 36900,
    color: "Core Black / Core Black / Red",
    sku: "CP9652",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Bone",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Bone'",
    silhouette: "Yeezy 350",
    badge: "Essential",
    price: 31900,
    color: "Bone / Bone / Bone",
    sku: "HQ6316",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Dazzling-Blue",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Dazzling Blue'",
    silhouette: "Yeezy 350",
    badge: "Trending",
    price: 32900,
    color: "Core Black / Dazzling Blue / Core Black",
    sku: "GY7164",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Slate",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Slate'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 31900,
    color: "Slate / Core Black / Slate",
    sku: "HP7870",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Light",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Light'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 32900,
    color: "Light / Light / Light",
    sku: "GY3438",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Israfil",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Israfil'",
    silhouette: "Yeezy 350",
    badge: "Classic",
    price: 31900,
    color: "Israfil / Israfil / Israfil",
    sku: "FZ5421",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Zyon",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Zyon'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 32900,
    color: "Zyon / Zyon / Zyon",
    sku: "FZ1267",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Cinder",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Cinder'",
    silhouette: "Yeezy 350",
    badge: "Top Seller",
    price: 34900,
    color: "Cinder / Cinder / Cinder",
    sku: "FY2903",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Desert-Sage",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Desert Sage'",
    silhouette: "Yeezy 350",
    badge: "Classic",
    price: 32900,
    color: "Desert Sage / Desert Sage / Desert Sage",
    sku: "FX9035",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Tail-Light",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Tail Light'",
    silhouette: "Yeezy 350",
    badge: "Grail",
    price: 36900,
    color: "Tail Light / Tail Light / Tail Light",
    sku: "FX9017",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Earth",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Earth'",
    silhouette: "Yeezy 350",
    badge: "Classic",
    price: 33900,
    color: "Earth / Earth / Earth",
    sku: "FX9033",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Cloud-White",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Cloud White'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 33900,
    color: "Cloud White / Cloud White / Cloud White",
    sku: "FW3043",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Black-Static",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Black Non-Reflective'",
    silhouette: "Yeezy 350",
    badge: "Grail",
    price: 38900,
    color: "Black / Black / Black",
    sku: "FU9006",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Static",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Static'",
    silhouette: "Yeezy 350",
    badge: "Iconic",
    price: 34900,
    color: "Static / Static / Static",
    sku: "EF2905",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Sesame",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Sesame'",
    silhouette: "Yeezy 350",
    badge: "Essential",
    price: 32900,
    color: "Sesame / Sesame / Sesame",
    sku: "F99710",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Butter",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Butter'",
    silhouette: "Yeezy 350",
    badge: "Popular",
    price: 31900,
    color: "Butter / Butter / Butter",
    sku: "F36980",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Blue-Tint",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Blue Tint'",
    silhouette: "Yeezy 350",
    badge: "Iconic",
    price: 35900,
    color: "Blue Tint / Grey Three / High Res Red",
    sku: "B37571",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Beluga-2-0",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Beluga 2.0'",
    silhouette: "Yeezy 350",
    badge: "Grail",
    price: 37900,
    color: "Grey / Bold Orange / Dark Grey",
    sku: "AH2203",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Cream-White",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Triple White' (Cream)",
    silhouette: "Yeezy 350",
    badge: "Top Seller",
    price: 32900,
    color: "Cream White / Cream White",
    sku: "CP9366",
    featured: false
  },

  // --- ADIDAS YEEZY 700 & 500 ---
  {
    slug: "adidas-Yeezy-Wave-Runner-700-Solid-Grey",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 'Wave Runner'",
    silhouette: "Yeezy 700",
    badge: "Grail",
    price: 38900,
    color: "Solid Grey / Chalk White / Core Black",
    sku: "B75571",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-700-Inertia",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 'Inertia'",
    silhouette: "Yeezy 700",
    badge: "Popular",
    price: 35900,
    color: "Inertia / Inertia / Inertia",
    sku: "EG7597",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-Mauve",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 'Mauve'",
    silhouette: "Yeezy 700",
    badge: "Classic",
    price: 34900,
    color: "Mauve / Mauve / Mauve",
    sku: "EE9614",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-Utility-Black",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 'Utility Black'",
    silhouette: "Yeezy 700",
    badge: "Essential",
    price: 35900,
    color: "Utility Black / Utility Black",
    sku: "FV5304",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-V2-Vanta",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 V2 'Vanta'",
    silhouette: "Yeezy 700",
    badge: "Top Seller",
    price: 36900,
    color: "Vanta / Vanta / Vanta",
    sku: "FU6684",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-V2-Tephra",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 V2 'Tephra'",
    silhouette: "Yeezy 700",
    badge: "Popular",
    price: 34900,
    color: "Tephra / Tephra / Tephra",
    sku: "FU7914",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-V2-Geode",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 V2 'Geode'",
    silhouette: "Yeezy 700",
    badge: "Classic",
    price: 33900,
    color: "Geode / Geode / Geode",
    sku: "EG6860",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Boost-700-V2-Hospital-Blue",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 700 V2 'Hospital Blue'",
    silhouette: "Yeezy 700",
    badge: "Trending",
    price: 35900,
    color: "Hospital Blue / Hospital Blue",
    sku: "FV8424",
    featured: false
  },
  {
    slug: "adidas-Yeezy-700-V3-Alvah",
    brand: "adidas Yeezy",
    name: "Yeezy 700 V3 'Alvah'",
    silhouette: "Yeezy 700",
    badge: "Future",
    price: 32900,
    color: "Alvah / Alvah / Alvah",
    sku: "H67799",
    featured: false
  },
  {
    slug: "adidas-Yeezy-700-V3-Arzareth",
    brand: "adidas Yeezy",
    name: "Yeezy 700 V3 'Arzareth'",
    silhouette: "Yeezy 700",
    badge: "Future",
    price: 31900,
    color: "Arzareth / Arzareth / Arzareth",
    sku: "G54850",
    featured: false
  },

  // --- ADIDAS YEEZY SLIDES & FOAM RUNNERS ---
  {
    slug: "adidas-Yeezy-Slide-Bone-2022",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Bone'",
    silhouette: "Yeezy Slide",
    badge: "Top Seller",
    price: 14900,
    color: "Bone / Bone",
    sku: "FZ5897",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Pure",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Pure'",
    silhouette: "Yeezy Slide",
    badge: "Trending",
    price: 14900,
    color: "Pure / Pure",
    sku: "GW1934",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Glow-Green-2022",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Glow Green'",
    silhouette: "Yeezy Slide",
    badge: "Popular",
    price: 15900,
    color: "Glow Green / Glow Green",
    sku: "HQ6447",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Enflame-Orange",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Enflame Orange'",
    silhouette: "Yeezy Slide",
    badge: "Trending",
    price: 15900,
    color: "Enflame Orange / Enflame Orange",
    sku: "G55495",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Soot",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Soot'",
    silhouette: "Yeezy Slide",
    badge: "Classic",
    price: 14900,
    color: "Soot / Soot",
    sku: "GX6141",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Onyx",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Onyx'",
    silhouette: "Yeezy Foam Runner",
    badge: "Future",
    price: 17900,
    color: "Onyx / Carbon",
    sku: "HP8739",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Sand",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Sand'",
    silhouette: "Yeezy Foam Runner",
    badge: "Popular",
    price: 17900,
    color: "Sand / Cream",
    sku: "FY4567",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Mineral-Blue",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Mineral Blue'",
    silhouette: "Yeezy Foam Runner",
    badge: "Future",
    price: 18900,
    color: "Mineral Blue / Mineral Blue",
    sku: "GV7903",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Vermilion",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Vermilion' (Red October)",
    silhouette: "Yeezy Foam Runner",
    badge: "Grail",
    price: 21900,
    color: "Vermilion / Vermilion",
    sku: "GW3355",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Ochre",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Ochre'",
    silhouette: "Yeezy Foam Runner",
    badge: "Trending",
    price: 17900,
    color: "Ochre / Ochre",
    sku: "GW3354",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Mist",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Mist'",
    silhouette: "Yeezy Foam Runner",
    badge: "Popular",
    price: 17900,
    color: "Mist / Mist",
    sku: "GV6774",
    featured: false
  },

  // --- ADIDAS ORIGINALS ---
  {
    slug: "adidas-Campus-00s-Core-Black",
    brand: "adidas Originals",
    name: "Campus 00s 'Core Black'",
    silhouette: "Campus 00s",
    badge: "Top Seller",
    price: 15900,
    color: "Core Black / Footwear White / Off White",
    sku: "HQ8708",
    featured: true
  },
  {
    slug: "adidas-Campus-00s-Grey-Gum",
    brand: "adidas Originals",
    name: "Campus 00s 'Grey Three Gum'",
    silhouette: "Campus 00s",
    badge: "Trending",
    price: 15900,
    color: "Grey Three / Footwear White / Off White",
    sku: "HQ8707",
    featured: false
  },

  // --- NEW BALANCE ---
  {
    slug: "New-Balance-2002R-Protection-Pack-Rain-Cloud",
    brand: "New Balance",
    name: "2002R Protection Pack 'Rain Cloud'",
    silhouette: "2002R",
    badge: "Grail",
    price: 28900,
    color: "Rain Cloud / Marblehead",
    sku: "M2002RDA",
    featured: true
  },
  {
    slug: "New-Balance-2002R-Protection-Pack-Phantom",
    brand: "New Balance",
    name: "2002R Protection Pack 'Phantom'",
    silhouette: "2002R",
    badge: "Popular",
    price: 27900,
    color: "Phantom / Dark Grey",
    sku: "M2002RDB",
    featured: false
  },
  {
    slug: "New-Balance-9060-Sea-Salt",
    brand: "New Balance",
    name: "9060 'Sea Salt'",
    silhouette: "9060",
    badge: "Trending",
    price: 25900,
    color: "Sea Salt / Surf",
    sku: "U9060ECA",
    featured: true
  },
  {
    slug: "New-Balance-9060-Rain-Cloud-Grey",
    brand: "New Balance",
    name: "9060 'Rain Cloud Grey'",
    silhouette: "9060",
    badge: "Popular",
    price: 25900,
    color: "Rain Cloud / Castlerock",
    sku: "U9060GRY",
    featured: false
  }
];

// Combine with existing base items (Samba, Carhartt, District basics)
const BASE_ITEMS = [
  {
    id: "adidas-samba-og",
    brand: "adidas Originals",
    name: "Samba OG",
    category: "Sneakers",
    silhouette: "Samba",
    badge: "Trending",
    price: 16900,
    color: "Cloud White / Core Black",
    image: "/assets/samba.webp",
    images: [{ url: "/assets/samba.webp", alt: "adidas Originals Samba OG Cloud White Core Black" }],
    description: "From the terrace to the everyday. A low-profile icon with leather texture and a classic gum sole.",
    detail: "Leather upper, textile lining and gum rubber outsole. Wipe clean with a soft cloth.",
    sizes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5"],
    unavailable: ["6.5"],
    featured: true
  },
  {
    id: "nike-air-max-90",
    brand: "Nike",
    name: "Air Max 90",
    category: "Sneakers",
    silhouette: "Air Max 90",
    badge: "Classic",
    price: 20900,
    color: "White / Wolf Grey",
    image: "/assets/air-max.webp",
    images: [{ url: "/assets/air-max.webp", alt: "Nike Air Max 90 White Wolf Grey" }],
    description: "A street staple in an understated palette. Layered textures and visible cushioning, made for your daily rotation.",
    detail: "Mixed-material upper and rubber outsole. Visible heel cushioning. Clean with a soft brush.",
    sizes: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5"],
    unavailable: ["7.5"],
    featured: false
  },
  {
    id: "carhartt-chase-sweatshirt",
    brand: "Carhartt WIP",
    name: "Chase Sweatshirt",
    category: "Clothing",
    silhouette: "Sweatshirt",
    badge: "Essential",
    price: 14900,
    color: "Ash Heather / Gold",
    image: "/assets/sweatshirt.webp",
    images: [{ url: "/assets/sweatshirt.webp", alt: "Carhartt WIP Chase Sweatshirt" }],
    description: "An easy layer with a substantial feel. Clean lines, a relaxed silhouette and an understated chest detail.",
    detail: "Cotton-blend fleece. Ribbed cuffs and hem. Wash cold with similar colours and dry away from direct heat.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    unavailable: ["XS"],
    featured: false
  },
  {
    id: "district-heavyweight-hoodie",
    brand: "District Essentials",
    name: "Heavyweight Hoodie",
    category: "Clothing",
    silhouette: "Hoodie",
    badge: "District",
    price: 11900,
    color: "Olive",
    image: "/assets/hoodie.webp",
    images: [{ url: "/assets/hoodie.webp", alt: "District Essentials Heavyweight Hoodie" }],
    description: "An understated uniform for the off-duty hours. A generous hood, weighty fabric and a relaxed fit.",
    detail: "Heavyweight cotton fleece. Relaxed fit and kangaroo pocket. Wash inside out at a low temperature.",
    sizes: ["XS", "S", "M", "L", "XL"],
    unavailable: [],
    featured: false
  },
  {
    id: "district-six-panel-cap",
    brand: "District Essentials",
    name: "Six-panel Cap",
    category: "Accessories",
    silhouette: "Headwear",
    badge: "District",
    price: 4500,
    color: "Charcoal",
    image: "/assets/cap.webp",
    images: [{ url: "/assets/cap.webp", alt: "District Essentials Six-panel Cap" }],
    description: "The finishing touch. A classic curved brim with an adjustable strap for an everyday fit.",
    detail: "Cotton twill. Adjustable back strap. One size. Spot clean only.",
    sizes: ["One size"],
    unavailable: [],
    featured: false
  }
];

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function main() {
  console.log(`Starting generation of 100+ popular sneakers catalog...`);
  const catalog = [...BASE_ITEMS];

  for (let i = 0; i < SNEAKER_DEFINITIONS.length; i++) {
    const item = SNEAKER_DEFINITIONS[i];
    const cleanId = item.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const img1File = `${cleanId}-1.jpg`;
    const img2File = `${cleanId}-2.jpg`;
    const img1Path = path.join(outDir, img1File);
    const img2Path = path.join(outDir, img2File);

    const url1 = `https://images.stockx.com/360/${item.slug}/Images/${item.slug}/Lv2/img01.jpg`;
    const url2 = `https://images.stockx.com/360/${item.slug}/Images/${item.slug}/Lv2/img08.jpg`;

    // Download if missing
    try {
      if (!fs.existsSync(img1Path) || fs.statSync(img1Path).size === 0) {
        await download(url1, img1Path);
      }
      if (!fs.existsSync(img2Path) || fs.statSync(img2Path).size === 0) {
        await download(url2, img2Path);
      }
    } catch (e) {
      console.warn(`[WARN] Download error for ${cleanId}: ${e.message}`);
    }

    const isSlide = item.silhouette.includes('Slide') || item.silhouette.includes('Foam Runner');
    const sizes = isSlide
      ? ["6", "7", "8", "9", "10", "11", "12"]
      : ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"];
    const unavailable = isSlide ? (i % 3 === 0 ? ["7"] : []) : (i % 2 === 0 ? ["6.5"] : ["10.5"]);

    const productRecord = {
      id: cleanId,
      brand: item.brand,
      name: item.name,
      category: "Sneakers",
      silhouette: item.silhouette,
      badge: item.badge,
      price: item.price,
      color: item.color,
      image: `/assets/sneakers/${img1File}`,
      images: [
        { url: `/assets/sneakers/${img1File}`, alt: `${item.brand} ${item.name} lateral profile view` },
        { url: `/assets/sneakers/${img2File}`, alt: `${item.brand} ${item.name} 3/4 front angle view` }
      ],
      description: `Authentic ${item.name} featuring verified deadstock construction, premium materials, and iconic ${item.silhouette} heritage.`,
      detail: `Style Code: ${item.sku}. Verified physical multi-point inspection. Original manufacturer packaging and verified Sole District security tag included.`,
      sizes,
      unavailable,
      featured: item.featured
    };

    catalog.push(productRecord);
    if ((i + 1) % 10 === 0 || i === SNEAKER_DEFINITIONS.length - 1) {
      console.log(`Processed ${i + 1}/${SNEAKER_DEFINITIONS.length} sneakers...`);
    }
  }

  console.log(`\nWriting total ${catalog.length} items to catalog files...`);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  fs.writeFileSync(previewPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`✓ Saved ${catalog.length} products to ${catalogPath}`);
  console.log(`✓ Saved ${catalog.length} products to ${previewPath}`);
}

main();
