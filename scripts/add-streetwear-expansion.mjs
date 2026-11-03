import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sneakersDir = path.resolve(__dirname, '../public/assets/sneakers');
const apparelDir = path.resolve(__dirname, '../public/assets/apparel');
const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const previewPath = path.resolve(__dirname, '../backend/shop/catalog_preview.json');

fs.mkdirSync(sneakersDir, { recursive: true });
fs.mkdirSync(apparelDir, { recursive: true });

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/**
 * Candidate expansion items (~60 items across Clothing, Accessories, Sneakers)
 * Each item provides multiple StockX slug candidates to probe in order.
 */
const EXPANSION_CANDIDATES = [
  // =========================================================================
  // CLOTHING (~28 items)
  // Subcategories: "Hoodies & Sweats" | "Tees" | "Pants & Shorts" | "Outerwear"
  // =========================================================================
  {
    id: 'fog-essentials-hoodie-light-oatmeal',
    brand: 'Fear of God Essentials',
    name: 'Essentials Pullover Hoodie (Light Oatmeal)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Trending',
    price: 18500,
    retailPrice: 21500,
    color: 'Light Oatmeal / Black',
    slugs: [
      'Fear-of-God-Essentials-Hoodie-Light-Oatmeal',
      'FEAR-OF-GOD-ESSENTIALS-Pullover-Hoodie-Applique-Logo-Light-Oatmeal'
    ],
    description: 'Signature Fear of God Essentials boxy pullover hoodie in Light Oatmeal fleece with tonal rubberized chest branding and a double-layered hood.',
    detail: '80% cotton, 20% polyester heavyweight core fleece (380gsm). Rubberized logo patch at hood and chest. Dropped shoulders, rib-knit cuffs and waist hem. Hand wash cold, lay flat to dry.',
    unavailable: ['XS', 'XXL'],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['essentials', 'fleece', 'sale']
  },
  {
    id: 'fog-essentials-hoodie-desert-taupe',
    brand: 'Fear of God Essentials',
    name: 'Essentials Pullover Hoodie (Desert Taupe)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Essential',
    price: 18900,
    color: 'Desert Taupe / Earth Brown',
    slugs: [
      'Fear-of-God-Essentials-Hoodie-Desert-Taupe'
    ],
    description: 'The quintessential daily tonal hoodie from Jerry Lorenzo’s Essentials line in Desert Taupe, cut with dropped shoulders and minimal tonal branding.',
    detail: '80% cotton, 20% polyester heavyweight fleece. Kangaroo pocket, rubberized brand label on hood. Relaxed oversized fit—size down for a standard fit.',
    unavailable: ['XXL'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['essentials', 'fleece']
  },
  {
    id: 'fog-essentials-hoodie-smoke',
    brand: 'Fear of God Essentials',
    name: 'Essentials Pullover Hoodie (Smoke)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Popular',
    price: 18500,
    color: 'Smoke / Washed Charcoal',
    slugs: [
      'Fear-of-God-Essentials-Hoodie-Smoke'
    ],
    description: 'Washed Smoke grey pullover built with substantial cotton-blend fleece and signature architectural proportions.',
    detail: '80% cotton, 20% polyester fleece. Mock-neck hood entry, side seam pockets, and flocked tonal chest graphic.',
    unavailable: ['XS'],
    featured: false,
    addedAt: '2026-10-29',
    tags: ['essentials', 'fleece']
  },
  {
    id: 'fog-essentials-hoodie-coral',
    brand: 'Fear of God Essentials',
    name: 'Essentials Pullover Hoodie (Coral)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Sale',
    price: 16900,
    retailPrice: 20500,
    color: 'Washed Coral / Terracotta',
    slugs: [
      'Fear-of-God-Essentials-Hoodie-Coral'
    ],
    description: 'Sun-drenched Coral colorway meets Fear of God’s signature cropped-body, wide-shoulder fleece silhouette.',
    detail: '380gsm cotton-poly fleece. Ribbed cuffs and waist hem. Silicone branding at chest and crown of hood.',
    unavailable: ['XS', 'XL'],
    featured: false,
    addedAt: '2026-10-24',
    tags: ['essentials', 'sale']
  },
  {
    id: 'fog-essentials-hoodie-wood',
    brand: 'Fear of God Essentials',
    name: 'Essentials Pullover Hoodie (Wood)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: null,
    price: 18500,
    color: 'Wood / Taupe Brown',
    slugs: [
      'Fear-of-God-Essentials-Hoodie-Wood',
      'Fear-of-God-Essentials-Hoodie-Taupe',
      'Fear-of-God-Essentials-Hoodie-Harvest'
    ],
    description: 'Warm neutral Wood brown colorway crafted from brushed back fleece for effortless layered styling.',
    detail: '80% cotton, 20% polyester heavyweight fleece. Dropped shoulder seams and kangaroo pouch pocket.',
    unavailable: ['S'],
    featured: false,
    addedAt: '2026-10-21',
    tags: ['essentials']
  },
  {
    id: 'fog-essentials-tee-stretch-limo',
    brand: 'Fear of God Essentials',
    name: 'Essentials Boxy Tee (Stretch Limo)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Essential',
    price: 8900,
    color: 'Stretch Limo / Black',
    slugs: [
      'Fear-of-God-Essentials-Tee-Stretch-Limo',
      'FEAR-OF-GOD-ESSENTIALS-T-shirt-Black',
      'Fear-of-God-Essentials-Boxy-T-Shirt-Applique-Logo-Black'
    ],
    description: 'Heavyweight single-jersey cotton tee in Stretch Limo black with a high ribbed mock-neck collar and boxy drape.',
    detail: '100% cotton jersey (250gsm). High rib-knit crew neckline, dropped shoulders, rubberized back collar patch.',
    unavailable: ['XXL'],
    featured: false,
    addedAt: '2026-10-28',
    tags: ['essentials', 'tees']
  },
  {
    id: 'fog-essentials-sweatpants-desert-taupe',
    brand: 'Fear of God Essentials',
    name: 'Essentials Lounge Sweatpants (Desert Taupe)',
    category: 'Clothing',
    subcategory: 'Pants & Shorts',
    silhouette: 'Sweatpants',
    badge: 'Essential',
    price: 16500,
    color: 'Desert Taupe / Cream',
    slugs: [
      'Fear-of-God-Essentials-Sweatpants-Desert-Taupe'
    ],
    description: 'Tapered heavyweight fleece sweatpants with elongated cream drawstrings, gusseted drop-crotch construction, and elastic ankle cuffs.',
    detail: '80% cotton, 20% polyester fleece. Elasticized waist with extended drawcord, side seam pockets, rubberized logo patch at center front.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-27',
    tags: ['essentials', 'loungewear']
  },
  {
    id: 'supreme-box-logo-hoodie-black',
    brand: 'Supreme',
    name: 'Box Logo Hooded Sweatshirt (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Grail',
    price: 54900,
    color: 'Black / Red / White',
    slugs: [
      'Supreme-Box-Logo-Hooded-Sweatshirt-FW21-Black',
      'Supreme-Box-Logo-Hooded-Sweatshirt-FW23-Black',
      'Supreme-Box-Logo-Hooded-Sweatshirt-Black'
    ],
    description: 'The undisputed crown jewel of New York skateboarding history. Heavyweight crossgrain brushed-back fleece with the iconic embroidered Box Logo chest patch.',
    detail: 'Heavyweight cotton crossgrain fleece. Ribbed gussets, pouch pocket, and dense woven embroidery at chest. Verified authentic deadstock.',
    unavailable: ['XS', 'S', 'XXL'],
    featured: true,
    addedAt: '2026-11-03',
    tags: ['grail', 'limited', 'bogo']
  },
  {
    id: 'supreme-box-logo-hoodie-heather-grey',
    brand: 'Supreme',
    name: 'Box Logo Hooded Sweatshirt (Heather Grey)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Grail',
    price: 52900,
    color: 'Heather Grey / Red',
    slugs: [
      'Supreme-Box-Logo-Hooded-Sweatshirt-FW23-Ash-Grey',
      'Supreme-Box-Logo-Hooded-Sweatshirt-FW21-Charcoal',
      'Supreme-Box-Logo-Hooded-Sweatshirt-Heather-Grey',
      'Supreme-Box-Logo-Crewneck-FW22-Heather-Grey'
    ],
    description: 'Archival heather grey crossgrain fleece featuring the classic red embroidered Supreme Box Logo on the chest.',
    detail: 'Heavyweight cotton crossgrain fleece. Side rib panels for structure and zero shrinkage.',
    unavailable: ['XS', 'XL', 'XXL'],
    featured: true,
    addedAt: '2026-10-31',
    tags: ['grail', 'limited', 'bogo']
  },
  {
    id: 'supreme-box-logo-crewneck-black',
    brand: 'Supreme',
    name: 'Box Logo Crewneck (FW22 Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Sweatshirt',
    badge: 'Hype',
    price: 42900,
    color: 'Black / White',
    slugs: [
      'Supreme-Box-Logo-Crewneck-FW22-Black',
      'Supreme-Box-Logo-Crewneck-FW18-Black',
      'Supreme-Box-Logo-Hooded-Sweatshirt-FW21-White'
    ],
    description: 'Classic heavyweight crewneck sweatshirt from Supreme’s Fall/Winter collection with a crisp embroidered Box Logo at center chest.',
    detail: 'Heavyweight crossgrain cotton fleece with ribbed collar, cuffs, hem, and side panels.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-26',
    tags: ['limited', 'bogo']
  },
  {
    id: 'supreme-motion-logo-hoodie-black',
    brand: 'Supreme',
    name: 'Motion Logo Hooded Sweatshirt (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Popular',
    price: 32900,
    color: 'Black / White',
    slugs: [
      'Supreme-Motion-Logo-Hooded-Sweatshirt-SS23-Black'
    ],
    description: 'Inspired by the opening title sequence of Martin Scorsese’s Goodfellas, featuring the blurred Supreme Motion Logo across heavyweight cotton fleece.',
    detail: '100% heavyweight cotton crossgrain fleece. Screen-printed chest graphic, pouch pocket, ribbed gussets.',
    unavailable: ['XS'],
    featured: false,
    addedAt: '2026-10-22',
    tags: ['supreme', 'fleece']
  },
  {
    id: 'supreme-s-logo-hoodie-black',
    brand: 'Supreme',
    name: 'S Logo Hooded Sweatshirt (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: null,
    price: 31900,
    retailPrice: 35900,
    color: 'Black / White',
    slugs: [
      'Supreme-S-Logo-Hooded-Sweatshirt-FW22-Black'
    ],
    description: 'Heavyweight Supreme pullover featuring chenille and embroidered S-Logo applique at the left chest and small S embroidery on the hood.',
    detail: 'Heavyweight crossgrain brushed-back fleece. Ribbed side gussets, cuffs, and waist hem.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-19',
    tags: ['supreme', 'sale']
  },
  {
    id: 'supreme-tiffany-box-logo-tee-white',
    brand: 'Supreme',
    name: 'Supreme x Tiffany & Co. Box Logo Tee',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Grail',
    price: 44900,
    color: 'White / Tiffany Blue',
    slugs: [
      'Supreme-Tiffany-Co-Box-Logo-Tee-White'
    ],
    description: 'Landmark luxury-meets-street collaboration pairing Supreme’s Box Logo in signature Robin’s Egg Tiffany Blue with "Return to Supreme" back print.',
    detail: '100% pre-shrunk heavyweight ringspun cotton. Co-branded Tiffany & Co. neck label.',
    unavailable: ['XS', 'XL', 'XXL'],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['collab', 'grail', 'bogo', 'tees']
  },
  {
    id: 'supreme-bandana-box-logo-tee-black',
    brand: 'Supreme',
    name: 'Bandana Box Logo Tee (Black)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Hype',
    price: 34900,
    color: 'Black / Paisley White',
    slugs: [
      'Supreme-Bandana-Box-Logo-Tee-Black',
      'Supreme-Bandana-Box-Logo-Tee-White'
    ],
    description: 'FW19 archival classic featuring a paisley bandana fill inside the signature chest Box Logo on heavyweight black cotton.',
    detail: '100% cotton jersey. Classic skate fit with seamless double-needle collar.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-25',
    tags: ['bogo', 'tees', 'limited']
  },
  {
    id: 'supreme-andre-3000-photo-tee-black',
    brand: 'Supreme',
    name: 'André 3000 Photo Tee (Black)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Iconic',
    price: 14900,
    color: 'Black / Multi',
    slugs: [
      'Supreme-Andre-3000-Tee-Black',
      'Supreme-NBA-Youngboy-Tee-Black'
    ],
    description: 'From Supreme’s legendary Portrait Series, featuring OutKast icon André Benjamin wearing a classic red Box Logo.',
    detail: '100% ringspun cotton. High-definition plastisol photo print at center chest.',
    unavailable: ['XXL'],
    featured: false,
    addedAt: '2026-10-18',
    tags: ['photo-tee', 'tees']
  },
  {
    id: 'supreme-tnf-nuptse-jacket-black',
    brand: 'Supreme',
    name: 'Supreme x The North Face Down Jacket',
    category: 'Clothing',
    subcategory: 'Outerwear',
    silhouette: 'Jacket',
    badge: 'Collab',
    price: 68900,
    color: 'Black / White',
    slugs: [
      'Supreme-The-North-Face-By-Any-Means-Nuptse-Jacket-Black',
      'Supreme-The-North-Face-Faux-Fur-Nuptse-Jacket-Black',
      'Supreme-The-North-Face-Paper-Print-Nuptse-Jacket',
      'Supreme-The-North-Face-Bleached-Denim-Print-Nuptse-Jacket-Black',
      'Supreme-The-North-Face-Coldworks-700-Fill-Down-Parka-Black',
      'Supreme-The-North-Face-Taped-Seam-Shell-Jacket-Black'
    ],
    description: 'Coveted collaborative outerwear from Supreme and The North Face, engineered with water-resistant shell fabric and dual-branded patch detailing on the right sleeve.',
    detail: 'Water-resistant ripstop nylon shell with 700-fill down insulation, stowable hood, and dual-branded woven patches on sleeve.',
    unavailable: ['XS', 'XL', 'XXL'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['collab', 'outerwear', 'limited']
  },
  {
    id: 'stussy-8-ball-pigment-dyed-tee-natural',
    brand: 'Stüssy',
    name: '8 Ball Pigment Dyed Tee (Natural)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Trending',
    price: 9500,
    color: 'Natural / Black',
    slugs: [
      'Stussy-8-Ball-Tee-Pigment-Dyed-Natural',
      'Stussy-8-Ball-Pigment-Dyed-Tee-Natural',
      'Stussy-8-Ball-T-Shirt-White',
      'Stussy-8-Ball-Fade-Hoodie-Black',
      'Stussy-Basic-Stussy-Tee-Black',
      'Stussy-Basic-Stussy-T-Shirt-Black'
    ],
    description: 'California surf-and-street heritage rendered on a vintage pigment-dyed cotton tee with Stüssy’s iconic 8-Ball graphic.',
    detail: '100% carded cotton jersey, individually pigment-dyed for a lived-in vintage finish. Screen-printed front and oversized back graphics.',
    unavailable: ['XS'],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['streetwear', 'tees']
  },
  {
    id: 'stussy-basic-logo-tee-black',
    brand: 'Stüssy',
    name: 'Basic Stüssy Logo Tee (Black)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Essential',
    price: 8500,
    color: 'Black / White',
    slugs: [
      'Stussy-Basic-Stussy-Tee-Black',
      'Stussy-Basic-Stussy-Tee-White',
      'Stussy-World-Tour-Tee-Black',
      'Stussy-World-Tour-T-Shirt-Black',
      'Stussy-Dover-Street-Market-London-Tee-Black'
    ],
    description: 'Shawn Stussy’s unmistakable hand-drawn graffiti signature printed at the left chest and across the back on mid-weight ringspun cotton.',
    detail: '100% cotton. Ribbed crewneck collar, relaxed standard fit. Machine wash cold.',
    unavailable: ['XXL'],
    featured: false,
    addedAt: '2026-10-28',
    tags: ['streetwear', 'tees']
  },
  {
    id: 'stussy-world-tour-zip-hoodie-black',
    brand: 'Stüssy',
    name: 'World Tour Full-Zip Hoodie (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Popular',
    price: 22900,
    color: 'Black / White',
    slugs: [
      'Stussy-World-Tour-Zip-Hoodie-Black'
    ],
    description: 'Stüssy’s global roll call—New York, Los Angeles, Tokyo, London, Paris—mixed with Bronze, Compton, Santa Ana, Brooklyn, and Venice on a heavyweight full-zip fleece.',
    detail: '80% cotton, 20% polyester fleece. YKK metal zipper, split kangaroo pocket, screen-printed chest and back World Tour script.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-27',
    tags: ['streetwear', 'fleece']
  },
  {
    id: 'bape-color-camo-shark-full-zip-hoodie',
    brand: 'BAPE',
    name: 'Color Camo Shark Full Zip Hoodie (Purple)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Iconic',
    price: 48900,
    color: 'Purple Camo / Multi',
    slugs: [
      'BAPE-Color-Camo-Shark-Full-Zip-Hoodie-Purple',
      'BAPE-Color-Camo-Shark-Full-Zip-Hoodie-Red',
      'BAPE-Color-Camo-Shark-Full-Zip-Hoodie-Black',
      'BAPE-1st-Camo-Shark-Full-Zip-Hoodie-Green',
      'BAPE-ABC-Camo-Shark-Full-Zip-Hoodie-Green',
      'BAPE-ABC-Camo-Shark-Full-Zip-Hoodie-Blue'
    ],
    description: 'Ura-Harajuku legend from A Bathing Ape. Full-zip loopwheel cotton hoodie with the signature felt and chenille Shark face appliqué on the hood and WGM varsity lettering.',
    detail: '100% Japanese heavyweight cotton terry. Full dual-way zipper extending to the crown of the hood, woven Ape Head sleeve tag.',
    unavailable: ['XS', 'S'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['bape', 'camo', 'grail']
  },
  {
    id: 'bape-1st-camo-shark-full-zip-hoodie-yellow',
    brand: 'BAPE',
    name: '1st Camo Shark Full Zip Hoodie (Yellow)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Hype',
    price: 49900,
    color: 'Yellow 1st Camo / Green / Multi',
    slugs: [
      'BAPE-1st-Camo-Shark-Full-Zip-Hoodie-Yellow'
    ],
    description: 'Nigo’s original 1st Camo pattern in vibrant yellow and olive green, crowned with the chenille WGM Tiger and Shark hood appliqué.',
    detail: '100% cotton terry. Dual-way full hood zipper, ribbed cuffs and hem, woven golden Ape tag at sleeve.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-26',
    tags: ['bape', 'camo']
  },
  {
    id: 'bape-college-logo-tee-black',
    brand: 'BAPE',
    name: 'College Logo Tee (Black)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Classic',
    price: 13500,
    color: 'Black / White / Brown',
    slugs: [
      'BAPE-College-Tee-Black',
      'BAPE-ABC-Camo-College-Tee-Black',
      'BAPE-ABC-Camo-College-Tee-White',
      'BAPE-Color-Camo-Big-Ape-Head-Tee-Black-Red',
      'BAPE-Color-Camo-By-Bathing-Ape-Tee-White-Red'
    ],
    description: 'Iconic A Bathing Ape collegiate arch logo framing the Ape Head emblem on crisp Japanese cotton jersey.',
    detail: '100% cotton. Woven Ape Head tab on left sleeve cuff. Standard Japanese sizing (consider sizing up one size).',
    unavailable: ['XS'],
    featured: false,
    addedAt: '2026-10-19',
    tags: ['bape', 'tees']
  },
  {
    id: 'palace-tri-ferg-hoodie-black',
    brand: 'Palace',
    name: 'Tri-Ferg Pullover Hood (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Popular',
    price: 24900,
    color: 'Black / White',
    slugs: [
      'Palace-Tri-Chenille-Hood-Black',
      'Palace-Tri-To-Help-Hood-Black',
      'Palace-Tri-Ferg-Patch-Hood-Black',
      'Palace-Basically-A-Tri-Ferg-Hood-Black',
      'Palace-AMG-Hood-Black',
      'Palace-Gucci-Logo-Hoodie-Black'
    ],
    description: 'London skate royalty. Heavyweight loopback cotton hoodie sporting Fergus Purcell’s iconic Penrose triangle Tri-Ferg emblem.',
    detail: '100% heavyweight loopback cotton. Branded metal aglets, pouch pocket, ribbed cuffs and hem.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-22',
    tags: ['skate', 'palace']
  },
  {
    id: 'palace-classic-tri-ferg-hood-black',
    brand: 'Palace',
    name: 'Classic Tri-Ferg Hood (Black / White)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Trending',
    price: 25900,
    color: 'Black / Crisp White',
    slugs: [
      'Palace-Tri-Ferg-Hood-Black'
    ],
    description: 'Southbank skate staple featuring high-contrast white Tri-Ferg branding on the left chest and full back.',
    detail: 'Heavyweight 450gsm loopback cotton fleece. Custom Palace embossed drawcord tips.',
    unavailable: ['XS'],
    featured: false,
    addedAt: '2026-10-20',
    tags: ['skate', 'palace']
  },
  {
    id: 'palace-tri-ferg-tee-white',
    brand: 'Palace',
    name: 'Tri-Ferg Skate Tee (White)',
    category: 'Clothing',
    subcategory: 'Tees',
    silhouette: 'Tee',
    badge: 'Trending',
    price: 10900,
    color: 'White / Multi',
    slugs: [
      'Palace-Tri-To-Help-T-Shirt-White',
      'Palace-Basically-A-Tri-Ferg-T-Shirt-White',
      'Palace-Tri-Ripper-T-Shirt-White',
      'Palace-Tri-Tex-T-Shirt-White',
      'Palace-Tri-Shadow-T-Shirt-White',
      'Palace-Calvin-Klein-CK1-Tri-Ferg-T-Shirt-White'
    ],
    description: 'Soho skate staple with left-chest and oversized back Tri-Ferg screenprint on soft combed cotton.',
    detail: '100% ringspun cotton jersey. Ribbed crew neckline. Machine washable.',
    unavailable: ['XXL'],
    featured: false,
    addedAt: '2026-10-18',
    tags: ['skate', 'palace', 'tees']
  },
  {
    id: 'nike-tech-fleece-full-zip-hoodie-black',
    brand: 'Nike',
    name: 'Sportswear Tech Fleece Windrunner Hoodie (Black)',
    category: 'Clothing',
    subcategory: 'Outerwear',
    silhouette: 'Jacket',
    badge: 'Essential',
    price: 18900,
    retailPrice: 21900,
    color: 'Black / Black',
    slugs: [
      'Nike-Sportswear-Tech-Fleece-Full-Zip-Hoodie-Black',
      'Nike-Tech-Fleece-Full-Zip-Hoodie-Black',
      'Nike-x-NOCTA-Tech-Fleece-Hoodie-Black',
      'Nike-NRG-Solo-Swoosh-Fleece-Hoodie-Black'
    ],
    description: 'Engineered double-sided spacer fabric delivers lightweight warmth without extra bulk, finished with signature bonded Windrunner chevron tape.',
    detail: '53% cotton, 47% polyester Tech Fleece. Zip sleeve pocket, 4-panel scuba hood, articulated elbows.',
    unavailable: ['XS'],
    featured: false,
    addedAt: '2026-10-25',
    tags: ['tech-fleece', 'outerwear', 'sale']
  },
  {
    id: 'denim-tears-cotton-wreath-hoodie-black',
    brand: 'Denim Tears',
    name: 'The Cotton Wreath Sweatshirt Hoodie (Black)',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Hype',
    price: 42900,
    color: 'Black / White',
    slugs: [
      'Denim-Tears-The-Cotton-Wreath-Sweatshirt-Black',
      'Denim-Tears-The-Cotton-Wreath-Sweatshirt-Grey',
      'Denim-Tears-The-Cotton-Wreath-Sweatshirt-Pink',
      'Denim-Tears-Cotton-Wreath-Hoodie-Black'
    ],
    description: 'Tremaine Emory’s signature cultural statement piece featuring raised puff-print cotton wreath motifs across heavyweight American fleece.',
    detail: '100% heavyweight ringspun cotton fleece. All-over raised puff screenprint, double-lined hood without drawstring, kangaroo pocket.',
    unavailable: ['XS', 'XXL'],
    featured: true,
    addedAt: '2026-11-03',
    tags: ['hype', 'puff-print']
  },
  {
    id: 'denim-tears-cotton-wreath-sweatpants-grey',
    brand: 'Denim Tears',
    name: 'The Cotton Wreath Sweatpants (Heather Grey)',
    category: 'Clothing',
    subcategory: 'Pants & Shorts',
    silhouette: 'Sweatpants',
    badge: 'Trending',
    price: 36900,
    color: 'Heather Grey / White',
    slugs: [
      'Denim-Tears-The-Cotton-Wreath-Sweatpants-Grey',
      'Denim-Tears-The-Cotton-Wreath-Sweatpants-Black',
      'Denim-Tears-The-Cotton-Wreath-Shorts-Black'
    ],
    description: 'Matching heavyweight fleece sweatpants finished with raised white puff-print cotton wreath graphics from waist to hem.',
    detail: '100% cotton heavyweight fleece. Elasticated waistband and ankle cuffs, side seam pockets.',
    unavailable: ['XS', 'XL', 'XXL'],
    featured: false,
    addedAt: '2026-10-29',
    tags: ['hype', 'puff-print']
  },
  {
    id: 'carhartt-wip-detroit-jacket-black',
    brand: 'Carhartt WIP',
    name: 'OG Detroit Jacket (Dearborn Canvas)',
    category: 'Clothing',
    subcategory: 'Outerwear',
    silhouette: 'Jacket',
    badge: 'Classic',
    price: 34900,
    color: 'Black / Tobacco Contrast Collar',
    slugs: [
      'Carhartt-WIP-Detroit-Jacket-Black',
      'Carhartt-WIP-OG-Detroit-Jacket-Black',
      'Carhartt-WIP-Active-Jacket-Black',
      'Carhartt-WIP-Michigan-Coat-Black',
      'Stussy-Carhartt-WIP-Detroit-Jacket-Black',
      'Sacai-Carhartt-WIP-Canvas-MA-1-Jacket-Michigan-Black'
    ],
    description: 'Workwear heritage built from 12oz organic Dearborn Canvas with a corduroy top collar, zippered chest pocket, and woven Square Label.',
    detail: '100% organic cotton Dearborn Canvas (340gsm). Blanket-lined body, corduroy collar, adjustable snap cuffs and bottom band.',
    unavailable: ['XS', 'XXL'],
    featured: true,
    addedAt: '2026-10-24',
    tags: ['workwear', 'outerwear']
  },
  {
    id: 'kith-treats-box-logo-tee',
    brand: 'Kith',
    name: 'Classic Logo Williams III Hoodie',
    category: 'Clothing',
    subcategory: 'Hoodies & Sweats',
    silhouette: 'Hoodie',
    badge: 'Popular',
    price: 26900,
    retailPrice: 29900,
    color: 'Black / White',
    slugs: [
      'Kith-Williams-III-Hoodie-Current',
      'Kith-Williams-III-Hoodie-Black',
      'Kith-Williams-III-Hoodie-Stadium',
      'Kith-Cyber-Monday-Hoodie-Black',
      'Kith-Star-Wars-Stormtrooper-Vintage-Tee-Black'
    ],
    description: 'Ronnie Fieg’s signature Williams III silhouette crafted from garment-washed 500gsm cotton fleece with an embroidered Kith classic box logo.',
    detail: '100% cotton 500gsm fleece. Two-piece hood, ribbed side panels, and garment-dyed enzyme wash for a soft hand feel.',
    unavailable: ['XS', 'XXL'],
    featured: false,
    addedAt: '2026-10-15',
    tags: ['streetwear', 'sale']
  },

  // =========================================================================
  // ACCESSORIES (~13 items)
  // Subcategories: "Headwear" | "Bags" | "Socks" | "Small Goods"
  // =========================================================================
  {
    id: 'new-era-ny-yankees-59fifty-fitted-navy',
    brand: 'New Era',
    name: 'NY Yankees 59FIFTY Fitted Cap',
    category: 'Accessories',
    subcategory: 'Headwear',
    silhouette: 'Headwear',
    badge: 'Classic',
    price: 7500,
    color: 'Navy / White / Grey Undervisor',
    slugs: [
      'Fear-of-God-Essentials-New-Era-59Fifty-Fitted-Hat-Navy',
      'Fear-of-God-Essentials-New-Era-59Fifty-Fitted-Hat-Black',
      'Supreme-New-Era-Box-Logo-Balaclava-Black',
      'Supreme-No-Comp-Box-Logo-New-Era-Black',
      'Supreme-World-Famous-Box-Logo-New-Era-Black'
    ],
    description: 'Structured high-crown 59FIFTY fitted cap featuring raised front embroidery, flat visor, and classic grey underbrim.',
    detail: '100% woven wool/polyester crown. Structured 6-panel construction with embroidered eyelets. Spot clean only.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-28',
    tags: ['headwear', 'fitted']
  },
  {
    id: 'stussy-big-stock-bucket-hat-black',
    brand: 'Stüssy',
    name: 'Big Stock Bucket Hat (Black)',
    category: 'Accessories',
    subcategory: 'Headwear',
    silhouette: 'Headwear',
    badge: 'Popular',
    price: 7900,
    color: 'Black / White',
    slugs: [
      'Stussy-Big-Stock-Bucket-Hat-Black'
    ],
    description: '90s streetwear silhouette in heavy cotton twill with oversized embroidered Stüssy stock script wrapped across the crown.',
    detail: '100% cotton unstructured twill bucket hat with stitched brim and embroidered ventilation eyelets.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-30',
    tags: ['headwear', 'bucket-hat']
  },
  {
    id: 'carhartt-wip-acrylic-watch-hat-black',
    brand: 'Carhartt WIP',
    name: 'Acrylic Watch Hat Beanie (Black)',
    category: 'Accessories',
    subcategory: 'Headwear',
    silhouette: 'Headwear',
    badge: 'Essential',
    price: 4900,
    color: 'Black / Gold Square Label',
    slugs: [
      'Carhartt-WIP-Acrylic-Watch-Hat-Black'
    ],
    description: 'An icon of utilitarian headwear. Warm 9-gauge rib-knit acrylic beanie finished with the signature woven Carhartt WIP Square Label on the cuff.',
    detail: '100% acrylic stretchable rib-knit fabric. Height: 23.5 cm / 9.1 inch. Hand wash cold.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-26',
    tags: ['headwear', 'workwear', 'essentials']
  },
  {
    id: 'supreme-new-era-box-logo-beanie-black',
    brand: 'Supreme',
    name: 'New Era Box Logo Beanie (Black)',
    category: 'Accessories',
    subcategory: 'Headwear',
    silhouette: 'Headwear',
    badge: 'Trending',
    price: 11900,
    color: 'Black / Red / White',
    slugs: [
      'Supreme-New-Era-Box-Logo-Beanie-FW23-Black',
      'Supreme-New-Era-Box-Logo-Beanie-FW22-Black',
      'Supreme-New-Era-Box-Logo-Beanie-FW21-Black',
      'Supreme-Overdyed-Beanie-SS23-Black',
      'Supreme-Loose-Gauge-Beanie-FW22-Black'
    ],
    description: 'Cold-weather streetwear staple crafted by New Era with an embroidered Supreme Box Logo on the fold-over cuff and "World Famous" script at the rear.',
    detail: '100% acrylic rib-knit crown with fold-over cuff. Embroidered Box Logo patch on front cuff, New Era flag on side.',
    sizes: ['One size'],
    unavailable: [],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['headwear', 'bogo']
  },
  {
    id: 'supreme-loose-gauge-beanie-heather-grey',
    brand: 'Supreme',
    name: 'Loose Gauge Beanie',
    category: 'Accessories',
    subcategory: 'Headwear',
    silhouette: 'Headwear',
    badge: 'Essential',
    price: 8900,
    retailPrice: 10500,
    color: 'Heather Grey / White',
    slugs: [
      'Supreme-Overdyed-Beanie-SS23-Black',
      'Supreme-New-Era-Box-Logo-Beanie-FW21-Charcoal',
      'Supreme-New-Era-Cross-Box-Logo-Beanie-Heather-Grey',
      'Supreme-New-Era-S-Logo-Beanie-FW22-Black'
    ],
    description: 'Chunky rib-knit cuffed beanie with direct Supreme embroidery across the front fold.',
    detail: '100% breathable cotton/acrylic knit. Relaxed stretch fit. Hand wash cold.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-21',
    tags: ['headwear', 'sale']
  },
  {
    id: 'supreme-cordura-shoulder-bag-black',
    brand: 'Supreme',
    name: 'Cordura Ripstop Shoulder Bag (Black)',
    category: 'Accessories',
    subcategory: 'Bags',
    silhouette: 'Bag',
    badge: 'Trending',
    price: 17900,
    color: 'Black / Red Box Logo',
    slugs: [
      'Supreme-Shoulder-Bag-SS18-Black',
      'Supreme-Shoulder-Bag-FW22-Black',
      'Supreme-Shoulder-Bag-SS23-Black',
      'Supreme-Waist-Bag-SS18-Black'
    ],
    description: 'Compact daily utility bag built from abrasion-resistant Cordura ripstop nylon with a woven red Supreme Box Logo patch on the front panel.',
    detail: 'Water-resistant 610D Cordura® nylon with embossed logo lining. Zippered main compartment, front zip pocket, adjustable jacquard webbing strap.',
    sizes: ['One size'],
    unavailable: [],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['bags', 'cordura', 'utility']
  },
  {
    id: 'supreme-cordura-waist-bag-black',
    brand: 'Supreme',
    name: 'Cordura Crossbody Waist Bag (Black)',
    category: 'Accessories',
    subcategory: 'Bags',
    silhouette: 'Bag',
    badge: 'Popular',
    price: 19900,
    color: 'Black / White',
    slugs: [
      'Supreme-Waist-Bag-SS18-Black',
      'Supreme-Waist-Bag-FW20-Black',
      'Supreme-Waist-Bag-FW22-Black',
      'Supreme-Waist-Bag-SS19-Black'
    ],
    description: 'Versatile crossbody or waist pack constructed in heavy-duty Cordura nylon with jacquard logo repeat strap and dual zip compartments.',
    detail: '100% Cordura® ballistic nylon. Padded mesh back panel, quick-release buckle strap, interior organizer pocket.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-25',
    tags: ['bags', 'cordura']
  },
  {
    id: 'supreme-backpack-black',
    brand: 'Supreme',
    name: 'Cordura Utility Backpack (Black)',
    category: 'Accessories',
    subcategory: 'Bags',
    silhouette: 'Bag',
    badge: 'Hype',
    price: 28900,
    color: 'Black / White',
    slugs: [
      'Supreme-Backpack-FW20-Black',
      'Supreme-Backpack-SS18-Black',
      'Supreme-Backpack-FW22-Black',
      'Supreme-Backpack-SS23-Black'
    ],
    description: 'Full-sized everyday commuter backpack with padded laptop sleeve, side mesh bottle pockets, and signature Supreme Box Logo patch.',
    detail: '21L capacity. Water-resistant Cordura® nylon shell, ergonomic padded shoulder straps with sternum clip.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-22',
    tags: ['bags', 'commuter']
  },
  {
    id: 'telfar-shopping-bag-small-black',
    brand: 'Telfar',
    name: 'Small Shopping Bag (Black)',
    category: 'Accessories',
    subcategory: 'Bags',
    silhouette: 'Bag',
    badge: 'Iconic',
    price: 23900,
    retailPrice: 26900,
    color: 'Black / Monochrome',
    slugs: [
      'Telfar-Shopping-Bag-Small-Black',
      'Telfar-Shopping-Bag-Medium-Black',
      'Telfar-Eastpak-Shopper-Medium-Black'
    ],
    description: 'The Bushwick Birkin. Unisex everyday structured tote featuring the embossed Telfar TC monogram, dual top handles, and crossbody straps.',
    detail: 'Vegan faux leather exterior with twill lining. Magnetic snap closure and interior zip compartment.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-17',
    tags: ['bags', 'sale']
  },
  {
    id: 'supreme-hanes-crew-socks-4-pack-white',
    brand: 'Supreme',
    name: 'Supreme x Hanes Crew Socks (4 Pack White)',
    category: 'Accessories',
    subcategory: 'Socks',
    silhouette: 'Socks',
    badge: 'Essential',
    price: 5500,
    color: 'White / Red',
    slugs: [
      'Supreme-Hanes-Crew-Socks-4-Pack-White',
      'Supreme-Hanes-Crew-Socks-4-Pack-Black'
    ],
    description: 'Daily rotation essential. Four-pack of cushioned ribbed cotton crew socks with knitted red Supreme logo below the upper welt.',
    detail: 'Cotton/polyester/spandex blend with cushioned footbed and reinforced heel/toe. Pack of 4 pairs.',
    sizes: ['S', 'M', 'L'],
    unavailable: ['S'],
    featured: false,
    addedAt: '2026-10-30',
    tags: ['socks', 'essentials']
  },
  {
    id: 'supreme-hanes-crew-socks-4-pack-black',
    brand: 'Supreme',
    name: 'Supreme x Hanes Crew Socks (4 Pack Black)',
    category: 'Accessories',
    subcategory: 'Socks',
    silhouette: 'Socks',
    badge: 'Essential',
    price: 5500,
    color: 'Black / White',
    slugs: [
      'Supreme-Hanes-Crew-Socks-4-Pack-Black',
      'Supreme-Hanes-Bones-Thermal-Crew-1-Pack-Black'
    ],
    description: 'Four-pack of all-black cushioned crew socks featuring white jacquard-knit Supreme branding at the ankle.',
    detail: 'Breathable ribbed cotton blend with arch support and cushioned sole. Pack of 4 pairs.',
    sizes: ['S', 'M', 'L'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-29',
    tags: ['socks', 'essentials']
  },
  {
    id: 'supreme-zippo-lighter-red',
    brand: 'Supreme',
    name: 'Box Logo Zippo Lighter (Red)',
    category: 'Accessories',
    subcategory: 'Small Goods',
    silhouette: 'Small Goods',
    badge: 'Collectible',
    price: 9900,
    color: 'Red / White',
    slugs: [
      'Supreme-Red-Box-Logo-Zippo-Red',
      'Supreme-Glow-in-the-Dark-Zippo-White',
      'Supreme-Repeat-Engraved-Zippo-Silver',
      'Supreme-Logo-Zippo-Red'
    ],
    description: 'Genuine American-made windproof Zippo lighter finished in matte red powder coat with the classic white Supreme Box Logo.',
    detail: 'All-metal hinged case manufactured in Bradford, PA. Ships unfilled per safety regulations.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-14',
    tags: ['collectible', 'small-goods']
  },
  {
    id: 'supreme-steiff-bear-heather-grey',
    brand: 'Supreme',
    name: 'Supreme x Steiff Box Logo Bear',
    category: 'Accessories',
    subcategory: 'Small Goods',
    silhouette: 'Small Goods',
    badge: 'Collab',
    price: 34900,
    color: 'Heather Grey / Red',
    slugs: [
      'Supreme-Steiff-Bear-Heather-Grey',
      'Supreme-Chucky-Doll',
      'Supreme-Hot-Wheels-Fleet-Flyer-1992-BMW-M3-Red',
      'Supreme-Tamagotchi-Black'
    ],
    description: 'Collector-grade collaborative plush crafted by German heritage toymaker Steiff, dressed in a miniature heather grey Supreme Box Logo hoodie.',
    detail: 'Steiff mohair plush with signature stainless steel "Button in Ear" tag and removable miniature cotton fleece Box Logo hoodie.',
    sizes: ['One size'],
    unavailable: [],
    featured: false,
    addedAt: '2026-10-12',
    tags: ['collectible', 'collab', 'small-goods']
  },

  // =========================================================================
  // SNEAKERS (~19 items from under-represented brands)
  // Subcategory MUST be omitted for Sneakers per contract!
  // =========================================================================
  {
    id: 'new-balance-550-white-green',
    brand: 'New Balance',
    name: "550 'White Green'",
    category: 'Sneakers',
    silhouette: '550',
    badge: 'Classic',
    price: 18900,
    retailPrice: 21900,
    color: 'White / Team Forest Green / Black',
    slugs: [
      'New-Balance-550-White-Green',
      'New-Balance-550-Aime-Leon-Dore-White-Green'
    ],
    sku: 'BB550WT1',
    description: 'Revived from the 1989 basketball archives, the New Balance 550 pairs perforated white leather uppers with vintage varsity forest green accents.',
    detail: 'Style Code: BB550WT1. Smooth and perforated leather upper, EVA cushioning midsole, non-marking rubber cupsole.',
    unavailable: ['6.5', '10.5'],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['retro-basketball', 'sale']
  },
  {
    id: 'new-balance-550-white-grey',
    brand: 'New Balance',
    name: "550 'White Grey'",
    category: 'Sneakers',
    silhouette: '550',
    badge: 'Essential',
    price: 17900,
    color: 'White / Neutral Grey / Black',
    slugs: [
      'New-Balance-550-White-Grey'
    ],
    sku: 'BB550PB1',
    description: 'Clean monochrome versatility on the low-top 1989 court silhouette with subtle suede toe-wrap overlays and neutral grey detailing.',
    detail: 'Style Code: BB550PB1. Leather and suede upper with breathable mesh collar and durable rubber outsole.',
    unavailable: ['7.5'],
    featured: false,
    addedAt: '2026-10-28',
    tags: ['retro-basketball', 'essentials']
  },
  {
    id: 'new-balance-2002r-rain-cloud',
    brand: 'New Balance',
    name: "2002R 'Rain Cloud'",
    category: 'Sneakers',
    silhouette: '2002R',
    badge: 'Grail',
    price: 28900,
    color: 'Rain Cloud / Magnet / Vintage Cream',
    slugs: [
      'New-Balance-2002R-Rain-Cloud'
    ],
    sku: 'ML2002RA',
    description: 'Archival 2010 running craftsmanship featuring premium grey nubuck and breathable mesh uppers over a full-length ABZORB and N-ergy cushioning sole.',
    detail: 'Style Code: ML2002RA. Pigskin suede and mesh upper, ABZORB midsole, N-ergy shock-absorbing outsole.',
    unavailable: ['6', '10.5'],
    featured: true,
    addedAt: '2026-11-03',
    tags: ['runners', 'grail']
  },
  {
    id: 'new-balance-2002r-protection-pack-mirage-grey',
    brand: 'New Balance',
    name: "2002R 'Protection Pack - Mirage Grey'",
    category: 'Sneakers',
    silhouette: '2002R',
    badge: 'Popular',
    price: 26900,
    color: 'Mirage Grey / Castlerock / Vintage Sail',
    slugs: [
      'New-Balance-2002R-Protection-Pack-Mirage-Grey',
      'New-Balance-2002R-Bone-Light-Aluminum'
    ],
    sku: 'M2002RDD',
    description: 'Yue Wu’s deconstructed Protection Pack 2002R with jagged raw-edge suede panels, exposed foam tongue, and pre-distressed ABZORB tooling.',
    detail: 'Style Code: M2002RDD. Layered pigskin suede and breathable mesh upper with Stability Web arch support.',
    unavailable: ['8.5'],
    featured: false,
    addedAt: '2026-10-26',
    tags: ['protection-pack', 'runners']
  },
  {
    id: 'new-balance-1906r-silver-metallic',
    brand: 'New Balance',
    name: "1906R 'White Metallic Silver'",
    category: 'Sneakers',
    silhouette: '1906R',
    badge: 'Trending',
    price: 22900,
    color: 'White / Metallic Silver / Black',
    slugs: [
      'New-Balance-1906R-White-Silver-Metallic',
      'New-Balance-1906R-Silver-Metallic-Black',
      'New-Balance-1906R-Protection-Pack-Reflection',
      'New-Balance-1906D-Protection-Pack-Silver-Metallic'
    ],
    sku: 'M1906RRA',
    description: 'Late-2000s technical runner aesthetics with open-holed diamond mesh, metallic silver synthetic cages, and N-Lock lacing system.',
    detail: 'Style Code: M1906RRA. TPU heel cage, ACTEVA LITE midsole cushioning, and segmented ABZORB SBS heel pods.',
    unavailable: ['6.5'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['y2k-runner', 'metallic']
  },
  {
    id: 'new-balance-990v6-miusa-grey',
    brand: 'New Balance',
    name: "990v6 Made in USA 'Castlerock Grey'",
    category: 'Sneakers',
    silhouette: '990v6',
    badge: 'Iconic',
    price: 29900,
    color: 'Grey / Castlerock / White',
    slugs: [
      'New-Balance-990v6-MiUSA-Grey',
      'New-Balance-990v6-Made-in-USA-Grey',
      'New-Balance-990v5-Grey',
      'New-Balance-990v3-Grey'
    ],
    sku: 'M990GL6',
    description: 'Crafted in New England, the sixth evolution of the legendary 990 series introduces FuelCell midsole foam beneath signature grey pigskin suede.',
    detail: 'Style Code: M990GL6. Made in USA. Pigskin suede and mesh upper, FuelCell and ENCAP midsole cushioning.',
    unavailable: ['11'],
    featured: false,
    addedAt: '2026-10-22',
    tags: ['made-in-usa', 'dad-shoe']
  },
  {
    id: 'asics-gel-kayano-14-cream-black',
    brand: 'ASICS',
    name: "Gel-Kayano 14 'Cream Black Metallic Plum'",
    category: 'Sneakers',
    silhouette: 'Gel-Kayano 14',
    badge: 'Trending',
    price: 26900,
    color: 'Cream / Black / Metallic Plum',
    slugs: [
      'ASICS-Gel-Kayano-14-Cream-Black',
      'Asics-Gel-Kayano-14-Cream-Black',
      'ASICS-Gel-Kayano-14-White-Midnight',
      'ASICS-Gel-Kayano-14-Black-Pure-Silver'
    ],
    sku: '1201A019-108',
    description: '2008 runner resurgence at its peak. Breathable cream mesh meets metallic silver and black tiger stripes over visible GEL cushioning units.',
    detail: 'Style Code: 1201A019-108. TRUSSTIC support system, original 2008 midsole tooling, and multi-layered synthetic leather overlays.',
    unavailable: ['6', '9.5'],
    featured: true,
    addedAt: '2026-11-03',
    tags: ['y2k-runner', 'metallic']
  },
  {
    id: 'asics-gel-kayano-14-jjjjound-silver-white',
    brand: 'ASICS',
    name: "JJJJound x Gel-Kayano 14 'Silver White'",
    category: 'Sneakers',
    silhouette: 'Gel-Kayano 14',
    badge: 'Collab',
    price: 49900,
    color: 'White / Metallic Silver / Cream',
    slugs: [
      'ASICS-Gel-Kayano-14-JJJJound-Silver-White',
      'Asics-Gel-Kayano-14-JJJJound-Silver-White',
      'ASICS-Gel-Kayano-14-JJJJound-Silver-Black',
      'Asics-Gel-Kayano-14-JJJJound-Silver-Black'
    ],
    sku: '1201A457-100',
    description: 'Montreal design studio JJJJound strips the Gel-Kayano 14 down to a clinical white mesh, brushed metallic silver overlays, and subtle co-branded heel tabs.',
    detail: 'Style Code: 1201A457-100. Limited edition JJJJound collaboration with custom sockliners and dual lace sets.',
    unavailable: ['6', '6.5', '11'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['collab', 'jjjjound', 'grail']
  },
  {
    id: 'asics-gt-2160-cream-pure-silver',
    brand: 'ASICS',
    name: "GT-2160 'Cream Pure Silver'",
    category: 'Sneakers',
    silhouette: 'GT-2160',
    badge: 'Popular',
    price: 19900,
    color: 'Cream / Pure Silver / Blue',
    slugs: [
      'ASICS-GT-2160-Cream-Pure-Silver'
    ],
    sku: '1203A275-100',
    description: 'Paying homage to the technical design language of the GT-2000 series from the early 2010s with wavy forefoot sculpting and segmented midsole geometry.',
    detail: 'Style Code: 1203A275-100. Rearfoot GEL technology inserts and breathable open mesh upper.',
    unavailable: ['6.5'],
    featured: false,
    addedAt: '2026-10-28',
    tags: ['y2k-runner', 'metallic']
  },
  {
    id: 'asics-gel-1130-black-pure-silver',
    brand: 'ASICS',
    name: "Gel-1130 'Black Pure Silver'",
    category: 'Sneakers',
    silhouette: 'Gel-1130',
    badge: 'Popular',
    price: 16900,
    color: 'Black / Pure Silver / Anthracite',
    slugs: [
      'ASICS-Gel-1130-Black-Pure-Silver',
      'Asics-Gel-1130-Black-Pure-Silver',
      'ASICS-Gel-1130-White-Clay-Canyon',
      'Asics-Gel-1130-White-Clay-Canyon',
      'ASICS-Gel-1130-Cream-Iron-Clad'
    ],
    sku: '1201A256-003',
    description: 'Inspired by the ninth iteration of the GEL-1000 stability series from 2008, offering ultra-lightweight mesh comfort and bold silver striping.',
    detail: 'Style Code: 1201A256-003. Heel GEL technology cushioning and TRUSSTIC stability unit for everyday street wear.',
    unavailable: ['7'],
    featured: false,
    addedAt: '2026-10-27',
    tags: ['y2k-runner', 'metallic']
  },
  {
    id: 'asics-gel-nyc-cream-oyster-grey',
    brand: 'ASICS',
    name: "Gel-NYC 'Cream Oyster Grey'",
    category: 'Sneakers',
    silhouette: 'Gel-NYC',
    badge: 'Trending',
    price: 21900,
    color: 'Cream / Oyster Grey / Clay',
    slugs: [
      'ASICS-Gel-NYC-Cream-Oyster-Grey',
      'Asics-Gel-NYC-Cream-Oyster-Grey',
      'ASICS-Gel-NYC-Graphite-Grey-Black',
      'Asics-Gel-NYC-Graphite-Grey-Black'
    ],
    sku: '1201A789-103',
    description: 'Blending heritage uppers from the early-2000s GEL-NIMBUS 3 with the modern GEL-CUMULUS 16 tooling system in tonal suede and mesh.',
    detail: 'Style Code: 1201A789-103. FluidRide midsole foam paired with forefoot and rearfoot GEL inserts.',
    unavailable: ['6.5', '10'],
    featured: false,
    addedAt: '2026-10-29',
    tags: ['runners']
  },
  {
    id: 'salomon-xt-6-white-lunar-rock',
    brand: 'Salomon',
    name: "XT-6 'White Lunar Rock'",
    category: 'Sneakers',
    silhouette: 'XT-6',
    badge: 'Trending',
    price: 26900,
    retailPrice: 29500,
    color: 'White / White / Lunar Rock',
    slugs: [
      'Salomon-XT-6-White-White-Lunar-Rock',
      'Salomon-XT-6-Ghost-Grey',
      'Salomon-ACS-Pro-Advanced-Metal-Frost-Gray'
    ],
    sku: 'L41252900',
    description: 'Crisp monochromatic white and Lunar Rock grey take on Salomon’s flagship technical trail runner with Quicklace™ toggle closure and Agile Chassis™ System.',
    detail: 'Style Code: L41252900. Quicklace™ one-pull tightening with lace pocket on tongue, dual-density EVA cushioning, Mud Contagrip® sole.',
    unavailable: ['7.5', '11'],
    featured: true,
    addedAt: '2026-10-23',
    tags: ['gorpcore', 'trail', 'sale']
  },
  {
    id: 'converse-cdg-play-chuck-70-low-black',
    brand: 'Converse',
    name: "COMME des GARÇONS PLAY x Chuck 70 Low 'Black'",
    category: 'Sneakers',
    silhouette: 'Chuck 70',
    badge: 'Collab',
    price: 19900,
    color: 'Black / Egret / High Risk Red',
    slugs: [
      'Converse-Chuck-Taylor-All-Star-70s-Ox-Comme-des-Garcons-PLAY-Black',
      'Converse-Chuck-Taylor-All-Star-70s-Hi-Comme-des-Garcons-PLAY-Black',
      'Converse-Chuck-Taylor-All-Star-70-Hi-Black'
    ],
    sku: '150206C',
    description: 'Rei Kawakubo’s COMME des GARÇONS PLAY heart-and-eyes bug emblem peeks above the glossy egret midsole of a heavyweight canvas Chuck 70.',
    detail: 'Style Code: 150206C. 12oz heavyweight cotton canvas, OrthoLite cushioned footbed, vintage heel license plate.',
    unavailable: ['6.5'],
    featured: false,
    addedAt: '2026-10-20',
    tags: ['collab', 'canvas']
  },
  {
    id: 'vans-old-skool-black-white',
    brand: 'Vans',
    name: "Old Skool 'Core Black White'",
    category: 'Sneakers',
    silhouette: 'Old Skool',
    badge: 'Classic',
    price: 10900,
    color: 'Black / True White',
    slugs: [
      'Vans-Old-Skool-Black-White',
      'Vans-Knu-Skool-Black-White',
      'Vans-Old-Skool-36-DX-Anaheim-Factory-Black-True-White'
    ],
    sku: 'VN000D3HY28',
    description: 'First known as the Vans #36 in 1977, the Old Skool debuted the iconic leather Jazz Stripe alongside durable suede-and-canvas skate construction.',
    detail: 'Style Code: VN000D3HY28. Reinforced suede toe caps, padded supportive collars, and signature vulcanized rubber waffle outsole.',
    unavailable: ['10.5'],
    featured: false,
    addedAt: '2026-10-16',
    tags: ['skate', 'classic']
  },
  {
    id: 'onitsuka-tiger-mexico-66-kill-bill',
    brand: 'Onitsuka Tiger',
    name: "Mexico 66 'Yellow Black' (Kill Bill)",
    category: 'Sneakers',
    silhouette: 'Mexico 66',
    badge: 'Trending',
    price: 21900,
    color: 'Yellow / Black',
    slugs: [
      'Onitsuka-Tiger-Mexico-66-Kill-Bill',
      'Onitsuka-Tiger-Mexico-66-Yellow-Black',
      'Onitsuka-Tiger-Mexico-66-White-Blue-Red'
    ],
    sku: '1183C102-751',
    description: 'Sleek 1966 pre-Olympic track silhouette in unmistakable bumblebee yellow leather with black Onitsuka Tiger stripes and heel cross-flap.',
    detail: 'Style Code: 1183C102-751. Supple full-grain leather upper, suede T-toe overlay, low-profile herringbone rubber outsole.',
    unavailable: ['6', '9.5'],
    featured: true,
    addedAt: '2026-11-02',
    tags: ['terrace', 'retro']
  },
  {
    id: 'adidas-samba-og-core-black-gum',
    brand: 'adidas Originals',
    name: "Samba OG 'Core Black Cloud White'",
    category: 'Sneakers',
    silhouette: 'Samba',
    badge: 'Popular',
    price: 16900,
    color: 'Core Black / Cloud White / Gum',
    slugs: [
      'adidas-Samba-OG-Core-Black-Cloud-White-Gum',
      'adidas-Samba-OG-Black-White-Gum',
      'adidas-Samba-Classic-Black'
    ],
    sku: 'B75807',
    description: 'Pitch-to-pavement icon in black full-grain leather with serrated white Three Stripes, gold foil Samba lettering, and dark gum sole.',
    detail: 'Style Code: B75807. Full-grain leather upper with suede T-toe overlay and gum rubber cupsole.',
    unavailable: ['7'],
    featured: false,
    addedAt: '2026-10-25',
    tags: ['terrace', 'classic']
  },
  {
    id: 'adidas-wales-bonner-samba-pony-leopard',
    brand: 'adidas Originals',
    name: "Wales Bonner x Samba 'Pony Leo'",
    category: 'Sneakers',
    silhouette: 'Samba',
    badge: 'Grail',
    price: 45900,
    color: 'Leopard Print / Cream White / Mystery Brown',
    slugs: [
      'adidas-Samba-Pony-Leo-Wales-Bonner',
      'adidas-Samba-Nylon-Wales-Bonner-Fox-Brown',
      'adidas-Samba-Wales-Bonner-Silver'
    ],
    sku: 'IE0578',
    description: 'Grace Wales Bonner’s runaway runway-to-street collaboration featuring faux pony-hair leopard print, contrast decorative stitching, and fold-over tongue.',
    detail: 'Style Code: IE0578. Pony hair upper, satin sockliner, crocheted Three Stripes, and elongated fold-over tongue.',
    unavailable: ['6', '10', '10.5', '11'],
    featured: true,
    addedAt: '2026-11-01',
    tags: ['collab', 'terrace', 'grail']
  },
  {
    id: 'nike-zoom-vomero-5-photon-dust',
    brand: 'Nike',
    name: "Zoom Vomero 5 'Photon Dust Metallic Silver'",
    category: 'Sneakers',
    silhouette: 'Zoom Vomero 5',
    badge: 'Trending',
    price: 22900,
    color: 'Photon Dust / Metallic Silver / Summit White',
    slugs: [
      'Nike-Zoom-Vomero-5-Photon-Dust-Metallic-Silver-W',
      'Nike-Zoom-Vomero-5-SP-Vast-Grey',
      'Nike-Zoom-Vomero-5-Supersonic'
    ],
    sku: 'FD0884-025',
    description: 'Early-2010s distance runner reborn for daily streetwear rotation, layering breathable mesh, ribbed plastic caging, and dual Zoom Air units.',
    detail: 'Style Code: FD0884-025. Cushlon foam + Zoom Air cushioning, 3M reflective accents, and ventilated heel counter.',
    unavailable: ['6.5', '9'],
    featured: true,
    addedAt: '2026-10-31',
    tags: ['y2k-runner', 'metallic']
  },
  {
    id: 'nike-zoom-vomero-5-cobblestone',
    brand: 'Nike',
    name: "Zoom Vomero 5 'Cobblestone Flat Pewter'",
    category: 'Sneakers',
    silhouette: 'Zoom Vomero 5',
    badge: 'Popular',
    price: 21900,
    retailPrice: 24500,
    color: 'Cobblestone / Light Bone / Flat Pewter',
    slugs: [
      'Nike-Zoom-Vomero-5-Cobblestone-W',
      'Nike-Zoom-Vomero-5-Oatmeal-W',
      'Nike-Zoom-Vomero-5-SP-Anthracite'
    ],
    sku: 'FB8825-001',
    description: 'Earthy grey-green tones and textured teched-out overlays make this Zoom Vomero 5 an effortless neutral anchor.',
    detail: 'Style Code: FB8825-001. TecTuff® overlays, breathable mesh upper, and dual-zone Zoom Air cushioning.',
    unavailable: ['8'],
    featured: false,
    addedAt: '2026-10-21',
    tags: ['y2k-runner', 'sale']
  },
  {
    id: 'nike-air-max-plus-triple-black',
    brand: 'Nike',
    name: "Air Max Plus 'Triple Black' (TN)",
    category: 'Sneakers',
    silhouette: 'Air Max Plus',
    badge: 'Classic',
    price: 23900,
    color: 'Black / Black / Metallic Silver',
    slugs: [
      'Nike-Air-Max-Plus-Triple-Black',
      'Nike-Air-Max-Plus-OG-Hyper-Blue-2024',
      'Nike-Air-Max-Plus-OG-Sunset-2024'
    ],
    sku: '604133-050',
    description: 'Sean McDowell’s aggressive 1998 Tuned Air icon in murdered-out Triple Black with glossy TPU palm-tree ribs and whale-tail midfoot shank.',
    detail: 'Style Code: 604133-050. Tuned Air (TN) visible chambers in forefoot and heel, breathable mesh upper with moulded TPU cage.',
    unavailable: ['7', '10.5'],
    featured: false,
    addedAt: '2026-10-18',
    tags: ['air-max', 'triple-black']
  }
];

/**
 * Build candidate image URLs for a given StockX slug and category.
 */
function getCandidateUrlsForSlug(slug, isSneaker) {
  const urls = [];
  if (isSneaker) {
    urls.push({
      primary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img01.jpg`,
      secondary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img08.jpg`
    });
  }
  urls.push({
    primary: `https://images.stockx.com/images/${slug}-Product.jpg`,
    secondary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img08.jpg`
  });
  urls.push({
    primary: `https://images.stockx.com/images/${slug}.jpg`,
    secondary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img08.jpg`
  });
  if (!isSneaker) {
    urls.push({
      primary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img01.jpg`,
      secondary: `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img08.jpg`
    });
  }
  return urls;
}

function isTrueJpegBuffer(buf) {
  return Buffer.isBuffer(buf) && buf.length >= 5120 && buf[0] === 0xff && buf[1] === 0xd8;
}

function isTrueJpegFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < 5120) return false;
    const fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(3);
    fs.readSync(fd, head, 0, 3, 0);
    fs.closeSync(fd);
    return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  } catch {
    return false;
  }
}

async function fetchValidImageBuffer(url) {
  try {
    const jpegUrl = url + (url.includes('?') ? '&' : '?') + 'fm=jpg&q=85&w=1000';
    const res = await fetch(jpegUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/jpeg'
      }
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!isTrueJpegBuffer(buf)) return null;
    return buf;
  } catch {
    return null;
  }
}

async function resolveAndDownloadProductImages(item) {
  const isSneaker = item.category === 'Sneakers';
  const targetDir = isSneaker ? sneakersDir : apparelDir;
  const urlPrefix = isSneaker ? '/assets/sneakers' : '/assets/apparel';

  const img1File = `${item.id}-1.jpg`;
  const img2File = `${item.id}-2.jpg`;
  const img1Path = path.join(targetDir, img1File);
  const img2Path = path.join(targetDir, img2File);

  // Only reuse if ALREADY a genuine JPEG (>5KB with 0xFFD8FF header)
  if (isTrueJpegFile(img1Path)) {
    if (isSneaker && !isTrueJpegFile(img2Path)) {
      fs.copyFileSync(img1Path, img2Path);
    }
    const hasSecond = isTrueJpegFile(img2Path);
    return {
      image: `${urlPrefix}/${img1File}`,
      images: hasSecond
        ? [
            { url: `${urlPrefix}/${img1File}`, alt: `${item.brand} ${item.name} primary view` },
            { url: `${urlPrefix}/${img2File}`, alt: `${item.brand} ${item.name} alternate view` }
          ]
        : [{ url: `${urlPrefix}/${img1File}`, alt: `${item.brand} ${item.name}` }]
    };
  }

  for (const slug of item.slugs) {
    const candidates = getCandidateUrlsForSlug(slug, isSneaker);
    for (const cand of candidates) {
      const primaryBuf = await fetchValidImageBuffer(cand.primary);
      if (primaryBuf) {
        fs.writeFileSync(img1Path, primaryBuf);
        let hasSecond = false;
        if (cand.secondary && cand.secondary !== cand.primary) {
          const secBuf = await fetchValidImageBuffer(cand.secondary);
          if (secBuf) {
            fs.writeFileSync(img2Path, secBuf);
            hasSecond = true;
          }
        }
        if (isSneaker && !hasSecond) {
          fs.copyFileSync(img1Path, img2Path);
          hasSecond = true;
        }
        return {
          matchedSlug: slug,
          image: `${urlPrefix}/${img1File}`,
          images: hasSecond
            ? [
                { url: `${urlPrefix}/${img1File}`, alt: `${item.brand} ${item.name} primary view` },
                { url: `${urlPrefix}/${img2File}`, alt: `${item.brand} ${item.name} alternate angle` }
              ]
            : [{ url: `${urlPrefix}/${img1File}`, alt: `${item.brand} ${item.name}` }]
        };
      }
    }
  }
  return null;
}

async function main() {
  const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Keep only the original 112 base catalog items and enrich the 3 existing apparel/accessory items
  const baseCatalog = rawCatalog
    .slice(0, 112)
    .map((p) => {
      if (p.id === 'carhartt-chase-sweatshirt') {
        return {
          ...p,
          subcategory: p.subcategory || 'Hoodies & Sweats',
          addedAt: p.addedAt || '2026-10-05'
        };
      }
      if (p.id === 'district-heavyweight-hoodie') {
        return {
          ...p,
          subcategory: p.subcategory || 'Hoodies & Sweats',
          addedAt: p.addedAt || '2026-10-08'
        };
      }
      if (p.id === 'district-six-panel-cap') {
        return {
          ...p,
          subcategory: p.subcategory || 'Headwear',
          addedAt: p.addedAt || '2026-10-10'
        };
      }
      return p;
    });

  console.log(`Base catalog count: ${baseCatalog.length}`);
  const existingIds = new Set(baseCatalog.map((p) => p.id));

  const addedItems = [];
  const failedItems = [];

  // Process with polite concurrency of 4
  const CONCURRENCY = 4;
  for (let i = 0; i < EXPANSION_CANDIDATES.length; i += CONCURRENCY) {
    const batch = EXPANSION_CANDIDATES.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (item) => {
        if (existingIds.has(item.id)) {
          return { item, res: null, reason: 'duplicate-id' };
        }
        const res = await resolveAndDownloadProductImages(item);
        return { item, res };
      })
    );

    for (const { item, res } of results) {
      if (!res) {
        failedItems.push(item.id);
        console.warn(`✗ Dropped (no valid image): ${item.id}`);
        continue;
      }

      const defaultSizes =
        item.category === 'Sneakers'
          ? ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11']
          : item.category === 'Clothing'
          ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
          : ['One size'];

      const record = {
        id: item.id,
        brand: item.brand,
        name: item.name,
        category: item.category,
        ...(item.category !== 'Sneakers' && item.subcategory ? { subcategory: item.subcategory } : {}),
        silhouette: item.silhouette,
        badge: item.badge ?? null,
        price: item.price,
        ...(item.retailPrice ? { retailPrice: item.retailPrice } : {}),
        color: item.color,
        image: res.image,
        images: res.images,
        description: item.description,
        detail: item.detail,
        sizes: item.sizes || defaultSizes,
        unavailable: item.unavailable || [],
        featured: Boolean(item.featured),
        addedAt: item.addedAt,
        ...(item.tags ? { tags: item.tags } : {})
      };

      addedItems.push(record);
      existingIds.add(record.id);
      console.log(`✓ Added [${record.category}] ${record.id}`);
    }
  }

  const finalCatalog = [...baseCatalog, ...addedItems];
  fs.writeFileSync(catalogPath, JSON.stringify(finalCatalog, null, 2) + '\n', 'utf8');
  fs.writeFileSync(previewPath, JSON.stringify(finalCatalog, null, 2) + '\n', 'utf8');

  console.log(`\n=== Summary ===`);
  console.log(`Base items: ${baseCatalog.length}`);
  console.log(`Added items: ${addedItems.length}`);
  console.log(`Failed/dropped items (${failedItems.length}): ${failedItems.join(', ') || 'none'}`);
  console.log(`Total catalog items: ${finalCatalog.length}`);
}

main();
