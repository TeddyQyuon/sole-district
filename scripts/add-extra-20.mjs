import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../public/assets/sneakers');
const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const previewPath = path.resolve(__dirname, '../backend/shop/catalog_preview.json');

const EXTRA_20 = [
  {
    slug: "Air-Jordan-4-Retro-SB-Pine-Green",
    brand: "Jordan",
    name: "Nike SB x Air Jordan 4 Retro 'Pine Green'",
    silhouette: "Air Jordan 4",
    badge: "Grail",
    price: 44900,
    color: "Sail / Pine Green / Neutral Grey / White",
    sku: "DR5415-103",
    featured: true
  },
  {
    slug: "Air-Jordan-4-Retro-Military-Blue-2024",
    brand: "Jordan",
    name: "Air Jordan 4 Retro OG 'Military Blue' (2024)",
    silhouette: "Air Jordan 4",
    badge: "Iconic",
    price: 31900,
    color: "Off-White / Military Blue / Neutral Grey",
    sku: "FV5029-141",
    featured: true
  },
  {
    slug: "Air-Jordan-1-Retro-High-OG-Palomino",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Palomino'",
    silhouette: "Air Jordan 1",
    badge: "Trending",
    price: 27900,
    color: "Black / Palomino / Sail / Metallic Gold",
    sku: "DZ5485-020",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-OG-Bred-Patent",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Patent Bred'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 28900,
    color: "Black / White / Varsity Red",
    sku: "555088-063",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Retro-High-OG-Royal-Reimagined",
    brand: "Jordan",
    name: "Air Jordan 1 Retro High OG 'Royal Reimagined'",
    silhouette: "Air Jordan 1",
    badge: "Classic",
    price: 26900,
    color: "Black / Royal Blue / White",
    sku: "DZ5485-042",
    featured: false
  },
  {
    slug: "Air-Jordan-1-Low-Mocha",
    brand: "Jordan",
    name: "Air Jordan 1 Low 'Mocha'",
    silhouette: "Air Jordan 1",
    badge: "Popular",
    price: 19900,
    color: "Light Chocolate / Crimson Bliss / White / Black",
    sku: "DC6991-200",
    featured: false
  },
  {
    slug: "Nike-SB-Dunk-Low-Yuto-Horigome",
    brand: "Nike",
    name: "Nike SB Dunk Low Pro 'Yuto Horigome'",
    silhouette: "Dunk Low",
    badge: "Collab",
    price: 36900,
    color: "Wolf Grey / Iron Grey / Sail",
    sku: "FQ1180-001",
    featured: true
  },
  {
    slug: "Nike-Dunk-Low-Photon-Dust-W",
    brand: "Nike",
    name: "Dunk Low 'Photon Dust'",
    silhouette: "Dunk Low",
    badge: "Essential",
    price: 18900,
    color: "White / Photon Dust",
    sku: "DD1503-103",
    featured: false
  },
  {
    slug: "Nike-Dunk-Low-Rose-Whisper-W",
    brand: "Nike",
    name: "Dunk Low 'Rose Whisper'",
    silhouette: "Dunk Low",
    badge: "Popular",
    price: 18900,
    color: "White / Rose Whisper",
    sku: "DD1503-118",
    featured: false
  },
  {
    slug: "Nike-Air-Max-1-Travis-Scott-Baroque-Brown",
    brand: "Nike",
    name: "Air Max 1 'Travis Scott Baroque Brown'",
    silhouette: "Air Max 1",
    badge: "Hype",
    price: 37900,
    color: "Baroque Brown / Lemon Drop / Wheat / Chile Red",
    sku: "DO9392-200",
    featured: true
  },
  {
    slug: "Nike-Air-Max-95-OG-Neon-2020",
    brand: "Nike",
    name: "Air Max 95 OG 'Neon' (2020)",
    silhouette: "Air Max 95",
    badge: "Grail",
    price: 32900,
    color: "Black / Neon Yellow / Light Graphite",
    sku: "CT1689-001",
    featured: true
  },
  {
    slug: "Nike-Kobe-6-Protro-Reverse-Grinch",
    brand: "Nike",
    name: "Kobe 6 Protro 'Reverse Grinch'",
    silhouette: "Kobe",
    badge: "Grail",
    price: 49900,
    color: "Bright Crimson / Black / Electric Green",
    sku: "FV9676-600",
    featured: true
  },
  {
    slug: "adidas-Yeezy-Boost-350-V2-Beluga-Reflective",
    brand: "adidas Yeezy",
    name: "Yeezy Boost 350 V2 'Beluga Reflective'",
    silhouette: "Yeezy 350",
    badge: "Grail",
    price: 36900,
    color: "Beluga / Reflective / Solar Red",
    sku: "GW1229",
    featured: true
  },
  {
    slug: "adidas-Yeezy-500-Blush",
    brand: "adidas Yeezy",
    name: "Yeezy 500 'Blush' (Desert Rat)",
    silhouette: "Yeezy 500",
    badge: "Classic",
    price: 32900,
    color: "Blush / Blush / Blush",
    sku: "DB2908",
    featured: false
  },
  {
    slug: "adidas-Yeezy-500-Utility-Black",
    brand: "adidas Yeezy",
    name: "Yeezy 500 'Utility Black'",
    silhouette: "Yeezy 500",
    badge: "Essential",
    price: 33900,
    color: "Utility Black / Utility Black",
    sku: "F36640",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Slate-Grey",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Slate Grey'",
    silhouette: "Yeezy Slide",
    badge: "Trending",
    price: 14900,
    color: "Slate Grey / Slate Grey",
    sku: "ID2350",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Slide-Resin-2022",
    brand: "adidas Yeezy",
    name: "Yeezy Slide 'Resin'",
    silhouette: "Yeezy Slide",
    badge: "Popular",
    price: 14900,
    color: "Resin / Resin",
    sku: "FZ5904",
    featured: false
  },
  {
    slug: "adidas-Yeezy-Foam-RNNR-Stone-Sage",
    brand: "adidas Yeezy",
    name: "Yeezy Foam Runner 'Stone Sage'",
    silhouette: "Yeezy Foam Runner",
    badge: "Popular",
    price: 17900,
    color: "Stone Sage / Stone Sage",
    sku: "GX4472",
    featured: false
  },
  {
    slug: "adidas-Gazelle-Indoor-Collegiate-Green",
    brand: "adidas Originals",
    name: "Gazelle Indoor 'Collegiate Green'",
    silhouette: "Gazelle",
    badge: "Trending",
    price: 17900,
    color: "Collegiate Green / Lucid Pink / Gum",
    sku: "IG5929",
    featured: true
  },
  {
    slug: "adidas-Handball-Spezial-Light-Blue",
    brand: "adidas Originals",
    name: "Handball Spezial 'Light Blue'",
    silhouette: "Handball Spezial",
    badge: "Trending",
    price: 16900,
    color: "Light Blue / Footwear White / Gum",
    sku: "BD7632",
    featured: true
  }
];

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buf));
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Current catalog count: ${catalog.length}. Adding ${EXTRA_20.length} additional verified sneakers...`);

  for (const item of EXTRA_20) {
    const cleanId = item.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const img1File = `${cleanId}-1.jpg`;
    const img2File = `${cleanId}-2.jpg`;
    const img1Path = path.join(outDir, img1File);
    const img2Path = path.join(outDir, img2File);

    const url1 = `https://images.stockx.com/360/${item.slug}/Images/${item.slug}/Lv2/img01.jpg`;
    const url2 = `https://images.stockx.com/360/${item.slug}/Images/${item.slug}/Lv2/img08.jpg`;

    try {
      if (!fs.existsSync(img1Path) || fs.statSync(img1Path).size === 0) {
        await download(url1, img1Path);
      }
      try {
        if (!fs.existsSync(img2Path) || fs.statSync(img2Path).size === 0) {
          await download(url2, img2Path);
        }
      } catch {
        fs.copyFileSync(img1Path, img2Path);
      }

      const isSlide = item.silhouette.includes('Slide') || item.silhouette.includes('Foam Runner');
      const sizes = isSlide
        ? ["6", "7", "8", "9", "10", "11", "12"]
        : ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"];

      catalog.push({
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
        unavailable: isSlide ? ["7"] : ["6.5", "10.5"],
        featured: item.featured
      });
      console.log(`✓ Added ${cleanId}`);
    } catch (e) {
      console.warn(`[WARN] Failed to download ${cleanId}: ${e.message}`);
    }
  }

  console.log(`\nNew total verified products: ${catalog.length}`);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(previewPath, JSON.stringify(catalog, null, 2), 'utf8');
}

main();
