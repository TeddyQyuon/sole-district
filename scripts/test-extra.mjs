import fs from 'node:fs';

const extraSlugs = [
  "Air-Jordan-1-Retro-High-Court-Purple-White",
  "Air-Jordan-1-Retro-High-Pine-Green-Black",
  "Air-Jordan-1-Retro-High-Bio-Hack",
  "Air-Jordan-1-Retro-High-Pollen",
  "Air-Jordan-1-Retro-High-Bordeaux",
  "Air-Jordan-1-Retro-High-Heritage",
  "Air-Jordan-1-Retro-High-Bleached-Coral",
  "Air-Jordan-1-Retro-High-Electro-Orange",
  "Air-Jordan-1-Retro-High-Midnight-Navy-COJP-2020",
  "Air-Jordan-1-Retro-High-Silver-Toe-W",
  "Air-Jordan-1-Mid-Light-Smoke-Grey",
  "Air-Jordan-1-Mid-Bred",
  "Air-Jordan-4-Retro-Taupe-Haze",
  "Air-Jordan-4-Retro-Lightning-2021",
  "Air-Jordan-4-Retro-Shimmer-W",
  "Air-Jordan-4-Retro-Fire-Red-2020",
  "Air-Jordan-3-Retro-UNC-2020",
  "Air-Jordan-3-Retro-Cool-Grey-2021",
  "Air-Jordan-3-Retro-Cardinal-Red",
  "Air-Jordan-3-Retro-Georgetown-2021",
  "Air-Jordan-5-Retro-Raging-Bull-2021",
  "Air-Jordan-5-Retro-Fire-Red-Silver-Tongue-2020",
  "Air-Jordan-11-Retro-Low-Legend-Blue",
  "Air-Jordan-11-Retro-Low-72-10",
  "Nike-Dunk-Low-University-Blue-2021",
  "Nike-Dunk-Low-Syracuse-2021",
  "Nike-Dunk-Low-Kentucky-2021",
  "Nike-Dunk-Low-Michigan-State",
  "Nike-Dunk-Low-Goldenrod",
  "Nike-Dunk-Low-Georgetown",
  "Nike-Dunk-Low-Team-Red",
  "Nike-SB-Dunk-Low-Court-Purple",
  "Nike-SB-Dunk-Low-Fog",
  "Nike-SB-Dunk-Low-Black-Gum",
  "Nike-SB-Dunk-Low-White-Gum",
  "Nike-Air-Force-1-Low-Tiffany-and-Co-1837",
  "Nike-Air-Max-1-Travis-Scott-Saturn-Gold",
  "Nike-Air-Max-1-Crepe-Hemp-2022",
  "adidas-Yeezy-Boost-350-V2-Light",
  "adidas-Yeezy-Boost-350-V2-Mono-Ice",
  "adidas-Yeezy-Boost-350-V2-Ash-Stone",
  "adidas-Yeezy-Boost-350-V2-Ash-Blue",
  "adidas-Yeezy-Boost-350-V2-Israfil",
  "adidas-Yeezy-Boost-350-V2-Zyon",
  "adidas-Yeezy-Boost-350-V2-Cinder",
  "adidas-Yeezy-Boost-350-V2-Desert-Sage",
  "adidas-Yeezy-Boost-350-V2-Tail-Light",
  "adidas-Yeezy-Boost-350-V2-Earth",
  "adidas-Yeezy-Boost-350-V2-Citrin",
  "adidas-Yeezy-Boost-350-V2-Cloud-White",
  "adidas-Yeezy-Boost-350-V2-Lundmark",
  "adidas-Yeezy-Boost-350-V2-Synth",
  "adidas-Yeezy-Boost-350-V2-Black-Static",
  "adidas-Yeezy-Boost-350-V2-Glow",
  "adidas-Yeezy-Boost-350-V2-Clay",
  "adidas-Yeezy-Boost-350-V2-Static",
  "adidas-Yeezy-Boost-350-V2-Sesame",
  "adidas-Yeezy-Boost-350-V2-Butter",
  "adidas-Yeezy-Boost-350-V2-Blue-Tint",
  "adidas-Yeezy-Boost-350-V2-Semi-Frozen-Yellow",
  "adidas-Yeezy-Boost-350-V2-Beluga-2-0",
  "adidas-Yeezy-Boost-350-V2-Cream-White",
  "adidas-Yeezy-Boost-350-V2-Beluga",
  "adidas-Yeezy-Boost-700-Inertia",
  "adidas-Yeezy-Boost-700-Mauve",
  "adidas-Yeezy-Boost-700-Utility-Black",
  "adidas-Yeezy-Boost-700-V2-Vanta",
  "adidas-Yeezy-Boost-700-V2-Tephra",
  "adidas-Yeezy-Boost-700-V2-Geode",
  "adidas-Yeezy-Boost-700-V2-Hospital-Blue",
  "adidas-Yeezy-700-V3-Alvah",
  "adidas-Yeezy-700-V3-Arzareth",
  "adidas-Yeezy-Slide-Glow-Green-2022",
  "adidas-Yeezy-Slide-Enflame-Orange",
  "adidas-Yeezy-Slide-Soot",
  "adidas-Yeezy-Foam-RNNR-Mineral-Blue",
  "adidas-Yeezy-Foam-RNNR-Vermilion",
  "adidas-Yeezy-Foam-RNNR-Ochre",
  "adidas-Yeezy-Foam-RNNR-Mist",
  "adidas-Yeezy-Foam-RNNR-Desert-Sand"
];

async function checkSlug(slug) {
  const url = `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img01.jpg`;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const prior = JSON.parse(fs.readFileSync('scripts/working-slugs.json', 'utf8'));
  console.log(`Starting with ${prior.length} verified slugs. Testing ${extraSlugs.length} additional...`);
  const workingSet = new Set(prior);

  for (const s of extraSlugs) {
    if (workingSet.has(s)) continue;
    const ok = await checkSlug(s);
    if (ok) {
      workingSet.add(s);
      process.stdout.write('+');
    } else {
      process.stdout.write('-');
    }
  }

  const combined = Array.from(workingSet);
  console.log(`\n\nTotal verified slugs now: ${combined.length}`);
  fs.writeFileSync('scripts/working-slugs.json', JSON.stringify(combined, null, 2));
}

main();
