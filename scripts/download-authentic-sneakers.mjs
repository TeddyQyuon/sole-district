import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../public/assets/sneakers');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sneakers = [
  { id: 'jordan-1-chicago-reimagined', slug: 'Air-Jordan-1-Retro-High-OG-Chicago-Reimagined' },
  { id: 'jordan-4-military-black', slug: 'Air-Jordan-4-Retro-Military-Black' },
  { id: 'jordan-4-bred-reimagined', slug: 'Air-Jordan-4-Retro-Bred-Reimagined' },
  { id: 'jordan-1-dark-mocha', slug: 'Air-Jordan-1-Retro-High-Dark-Mocha' },
  { id: 'jordan-1-low-travis-scott-reverse-mocha', slug: 'Air-Jordan-1-Retro-Low-OG-SP-Travis-Scott-Reverse-Mocha' },
  { id: 'jordan-3-white-cement-reimagined', slug: 'Air-Jordan-3-Retro-White-Cement-Reimagined' },
  { id: 'jordan-11-concord', slug: 'Air-Jordan-11-Retro-Concord-2018' },
  { id: 'jordan-1-low-wolf-grey', slug: 'Air-Jordan-1-Low-Wolf-Grey-W' },
  { id: 'nike-dunk-low-panda', slug: 'Nike-Dunk-Low-Retro-White-Black-2021' },
  { id: 'nike-dunk-low-grey-fog', slug: 'Nike-Dunk-Low-Grey-Fog' },
  { id: 'nike-air-force-1-triple-white', slug: 'Nike-Air-Force-1-Low-White-07' },
  { id: 'nike-sb-dunk-low-dodgers', slug: 'Nike-SB-Dunk-Low-Los-Angeles-Dodgers' },
  { id: 'nike-air-max-1-travis-scott-wheat', slug: 'Nike-Air-Max-1-Travis-Scott-Wheat' },
  { id: 'yeezy-boost-350-v2-zebra', slug: 'adidas-Yeezy-Boost-350-V2-Zebra' },
  { id: 'yeezy-boost-350-v2-onyx', slug: 'adidas-Yeezy-Boost-350-V2-Onyx' },
  { id: 'yeezy-boost-700-wave-runner', slug: 'adidas-Yeezy-Wave-Runner-700-Solid-Grey' },
  { id: 'yeezy-slide-bone', slug: 'adidas-Yeezy-Slide-Bone-2022' },
  { id: 'yeezy-foam-runner-onyx', slug: 'adidas-Yeezy-Foam-RNNR-Onyx' },
  { id: 'yeezy-foam-runner-sand', slug: 'adidas-Yeezy-Foam-RNNR-Sand' }
];

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) {
    throw new Error(`Failed HTTP ${res.status} for ${url}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
}

async function run() {
  console.log(`Downloading ${sneakers.length} sneaker photos to ${outDir}...`);
  for (const s of sneakers) {
    const file1 = path.join(outDir, `${s.id}-1.jpg`);
    const file2 = path.join(outDir, `${s.id}-2.jpg`);
    const url1 = `https://images.stockx.com/360/${s.slug}/Images/${s.slug}/Lv2/img01.jpg`;
    const url2 = `https://images.stockx.com/360/${s.slug}/Images/${s.slug}/Lv2/img08.jpg`;

    try {
      if (!fs.existsSync(file1) || fs.statSync(file1).size === 0) {
        await download(url1, file1);
      }
      if (!fs.existsSync(file2) || fs.statSync(file2).size === 0) {
        await download(url2, file2);
      }
      const s1 = fs.statSync(file1).size;
      const s2 = fs.statSync(file2).size;
      console.log(`✓ ${s.id} (angle 1: ${s1}B, angle 2: ${s2}B)`);
    } catch (err) {
      console.error(`✗ Error on ${s.id}: ${err.message}`);
    }
  }
  console.log('Finished downloading authentic sneaker images.');
}

run();
