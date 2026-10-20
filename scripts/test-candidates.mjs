import fs from 'node:fs';

const testSlugs = [
  // Air Jordan 1
  "Air-Jordan-1-Retro-High-OG-Chicago-Reimagined",
  "Air-Jordan-1-Retro-High-Dark-Mocha",
  "Air-Jordan-1-Retro-High-Travis-Scott",
  "Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Reverse-Mocha",
  "Air-Jordan-1-Low-Travis-Scott-Black-Phantom",
  "Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Canary-W",
  "Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Medium-Olive",
  "Air-Jordan-1-Retro-High-OG-University-Blue",
  "Air-Jordan-1-Retro-High-OG-Taxi",
  "Air-Jordan-1-Retro-High-OG-Bred-Patent",
  "Air-Jordan-1-Retro-High-OG-Hyper-Royal",
  "Air-Jordan-1-Retro-High-OG-Palomino",
  "Air-Jordan-1-Retro-High-OG-Royal-Reimagined",
  "Air-Jordan-1-Low-Wolf-Grey-W",
  "Air-Jordan-1-Low-White-Black-W",
  "Air-Jordan-1-Low-Mocha",
  "Air-Jordan-1-Low-Travis-Scott-Fragment",

  // Air Jordan 3
  "Air-Jordan-3-Retro-White-Cement-Reimagined",
  "Air-Jordan-3-Retro-Fire-Red-2022",
  "Air-Jordan-3-Retro-Black-Cement-2018",
  "Air-Jordan-3-Retro-Midnight-Navy",
  "Air-Jordan-3-Retro-Palomino",
  "Air-Jordan-3-Retro-Desert-Elephant",
  "Air-Jordan-3-Retro-J Balvin-Medellin-Sunset",

  // Air Jordan 4
  "Air-Jordan-4-Retro-Military-Black",
  "Air-Jordan-4-Retro-Bred-Reimagined",
  "Air-Jordan-4-Retro-SB-Pine-Green",
  "Air-Jordan-4-Retro-Black-Cat-2020",
  "Air-Jordan-4-Retro-Red-Cement",
  "Air-Jordan-4-Retro-Midnight-Navy",
  "Air-Jordan-4-Retro-Thunder-2023",
  "Air-Jordan-4-Retro-University-Blue",
  "Air-Jordan-4-Retro-White-Oreo-2021",
  "Air-Jordan-4-Retro-Infrared",
  "Air-Jordan-4-Retro-Military-Blue-2024",
  "Air-Jordan-4-Retro-Wet-Cement-Paris-Olympics",

  // Air Jordan 5, 6, 11
  "Air-Jordan-5-Retro-UNC",
  "Air-Jordan-6-Retro-Carmine-2021",
  "Air-Jordan-11-Retro-Concord-2018",
  "Air-Jordan-11-Retro-Bred-2019",
  "Air-Jordan-11-Retro-Cool-Grey-2021",
  "Air-Jordan-11-Retro-Cherry-2022",
  "Air-Jordan-11-Retro-Gratitude-Defining-Moments-Pack-2023",

  // Nike Dunk Low & SB Dunk
  "Nike-Dunk-Low-Retro-White-Black-2021",
  "Nike-Dunk-Low-Grey-Fog",
  "Nike-Dunk-Low-Medium-Olive",
  "Nike-Dunk-Low-Valerian-Blue",
  "Nike-Dunk-Low-Photon-Dust-W",
  "Nike-Dunk-Low-Rose-Whisper-W",
  "Nike-Dunk-Low-Cacao-Wow-W",
  "Nike-Dunk-Low-Polar-Blue",
  "Nike-Dunk-Low-Court-Purple",
  "Nike-SB-Dunk-Low-Los-Angeles-Dodgers",
  "Nike-SB-Dunk-Low-Why-So-Sad",
  "Nike-SB-Dunk-Low-Pro-Jarritos",
  "Nike-SB-Dunk-Low-Born-x-Raised-One-Block-at-a-Time",
  "Nike-SB-Dunk-Low-Tightbooth",
  "Nike-SB-Dunk-Low-Yuto-Horigome",

  // Nike Air Force 1 & Air Max & Vomero
  "Nike-Air-Force-1-Low-White-07",
  "Nike-Air-Force-1-Low-07-Black",
  "Nike-Air-Force-1-Low-Supreme-White",
  "Nike-Air-Force-1-Low-Drake-NOCTA-Certified-Lover-Boy",
  "Nike-Air-Max-1-Travis-Scott-Wheat",
  "Nike-Air-Max-1-Travis-Scott-Baroque-Brown",
  "Nike-Air-Max-1-Patta-Waves-Noise-Aqua-without-Bracelet",
  "Nike-Air-Max-1-86-Original-Big-Bubble-Red",
  "Nike-Air-Max-95-OG-Neon-2020",
  "Nike-Air-Max-97-Silver-Bullet-2022",
  "Nike-Zoom-Vomero-5-Photon-Dust-Metallic-Silver",
  "Nike-Zoom-Vomero-5-Cobblestone-Flat-Pewter",
  "Nike-Zoom-Vomero-5-Oatmeal",
  "Nike-Zoom-Vomero-5-Triple-Black",
  "Nike-Kobe-6-Protro-Reverse-Grinch",
  "Nike-Kobe-6-Protro-Grinch-2020",
  "Nike-Kobe-8-Protro-Halo",

  // adidas Yeezy
  "adidas-Yeezy-Boost-350-V2-Zebra",
  "adidas-Yeezy-Boost-350-V2-Onyx",
  "adidas-Yeezy-Boost-350-V2-Bred",
  "adidas-Yeezy-Boost-350-V2-Beluga-Reflective",
  "adidas-Yeezy-Boost-350-V2-Bone",
  "adidas-Yeezy-Boost-350-V2-Dazzling-Blue",
  "adidas-Yeezy-Boost-350-V2-Slate",
  "adidas-Yeezy-Boost-350-V2-Core-Black-Red-2016-2022",
  "adidas-Yeezy-Wave-Runner-700-Solid-Grey",
  "adidas-Yeezy-Boost-700-V2-Static",
  "adidas-Yeezy-700-V3-Azael-2023",
  "adidas-Yeezy-500-Blush",
  "adidas-Yeezy-500-Utility-Black",
  "adidas-Yeezy-Slide-Bone-2022",
  "adidas-Yeezy-Slide-Onyx-2022",
  "adidas-Yeezy-Slide-Pure",
  "adidas-Yeezy-Slide-Slate-Grey",
  "adidas-Yeezy-Slide-Resin-2022",
  "adidas-Yeezy-Slide-Flax",
  "adidas-Yeezy-Foam-RNNR-Onyx",
  "adidas-Yeezy-Foam-RNNR-Sand",
  "adidas-Yeezy-Foam-RNNR-Stone-Sage",
  "adidas-Yeezy-Foam-RNNR-Carbon",
  "adidas-Yeezy-Foam-RNNR-Clay-Taupe",

  // adidas Originals
  "adidas-Samba-OG-Cloud-White-Core-Black",
  "adidas-Samba-OG-Core-Black-Cloud-White",
  "adidas-Gazelle-Indoor-Blue-Fusion-Gum",
  "adidas-Gazelle-Indoor-Collegiate-Green",
  "adidas-Handball-Spezial-Light-Blue",
  "adidas-Handball-Spezial-Aluminum-Core-Black",
  "adidas-Campus-00s-Core-Black",
  "adidas-Campus-00s-Grey-Gum",
  "adidas-Forum-Low-Bad-Bunny-Easter-Egg",

  // New Balance
  "New-Balance-550-White-Grey",
  "New-Balance-550-Aime-Leon-Dore-White-Green",
  "New-Balance-2002R-Protection-Pack-Rain-Cloud",
  "New-Balance-2002R-Protection-Pack-Phantom",
  "New-Balance-1906R-Protection-Pack-Castlerock",
  "New-Balance-1906R-Silver-Metallic",
  "New-Balance-9060-Sea-Salt",
  "New-Balance-9060-Rain-Cloud-Grey",
  "New-Balance-990v3-MiUSA-JJJJound-Olive",
  "New-Balance-990v6-MiUSA-Grey",

  // ASICS
  "Asics-Gel-Kayano-14-Cream-Black",
  "Asics-Gel-Kayano-14-Silver-Cream",
  "Asics-Gel-Kayano-14-JJJJound-Silver-White",
  "Asics-GT-2160-White-Pure-Silver",
  "Asics-Gel-NYC-Cream-Oyster-Grey",
  "Asics-Gel-1130-White-Black"
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
  console.log(`Testing ${testSlugs.length} candidate slugs...`);
  const working = [];
  const failed = [];
  for (const s of testSlugs) {
    const ok = await checkSlug(s);
    if (ok) {
      working.push(s);
      process.stdout.write('+');
    } else {
      failed.push(s);
      process.stdout.write('-');
    }
  }
  console.log(`\n\nResults: ${working.length} passed, ${failed.length} failed.`);
  fs.writeFileSync('scripts/working-slugs.json', JSON.stringify(working, null, 2));
  fs.writeFileSync('scripts/failed-slugs.json', JSON.stringify(failed, null, 2));
}

main();
