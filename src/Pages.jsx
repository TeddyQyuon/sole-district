import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CaretDown, CaretLeft, CaretRight, Check, CheckCircle,
  Fire, Funnel, GridFour, Heart, LockSimple, MapPin, Package, Plus, Rows, ShieldCheck,
  SlidersHorizontal, Sparkle, SquaresFour, Tag, Truck, X,
} from '@phosphor-icons/react';
import { Button, Dialog, LineItem, ProductCard, ProductGrid, useShop } from './App';
import { GuestAccess } from './Account';
import { PublishedPolicy } from './StoreInformation';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import { checkoutFingerprint, clearCheckoutAttempt, clearCheckoutDraft, getCheckoutKey, readCheckoutDraft, saveCheckoutDraft } from './checkoutState';
import {
  getPostalSectorInfo, lookupSingaporeAddress, validateSingaporeAddress,
} from './utils/singaporeAddress';
import {
  api, getCsrf, money, readStored, saveStored, shipping, sortVariantsBySize, trackEvent,
} from './shop';
import {
  ACCESSORY_SUBCATEGORIES, CLOTHING_SUBCATEGORIES, discountPercent, getAvailableSizeCount,
  getDerivedBrands, getDerivedSilhouettes, getDerivedSubcategories, isLowStock, isNewIn, isOnSale, isSoldOut,
} from './catalogHelpers';
import { AnimatedCount, BrandTicker, Reveal, handleSpotlightMove } from './motion';

export function Home() {
  const { products } = useShop();
  const [apparelTab, setApparelTab] = useState('All');
  const newInRef = useRef(null);

  const derivedBrands = useMemo(() => getDerivedBrands(products), [products]);

  const newInProducts = useMemo(() => {
    const fresh = products
      .filter((p) => isNewIn(p))
      .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
    return fresh.length >= 4 ? fresh.slice(0, 12) : products.filter((p) => p.featured || p.badge).slice(0, 10);
  }, [products]);

  const trendingSneakers = useMemo(
    () => products.filter((p) => p.category === 'Sneakers' && (p.featured || p.badge === 'Grail' || p.badge === 'Trending')).slice(0, 8),
    [products]
  );
  const yeezySneakers = useMemo(
    () => products.filter((p) => p.brand === 'adidas Yeezy').slice(0, 4),
    [products]
  );
  const jordanSneakers = useMemo(
    () => products.filter((p) => p.brand === 'Jordan').slice(0, 4),
    [products]
  );

  const streetwearProducts = useMemo(() => {
    const allApparel = products.filter((p) => p.category === 'Clothing' || p.category === 'Accessories');
    if (apparelTab === 'All') return allApparel.slice(0, 8);
    if (apparelTab === 'Accessories') return allApparel.filter((p) => p.category === 'Accessories').slice(0, 8);
    return allApparel.filter((p) => p.subcategory === apparelTab).slice(0, 8);
  }, [products, apparelTab]);

  // Dynamic category image tiles
  const categoryTiles = useMemo(() => {
    const findImg = (predicate, fallbackIdx = 0) => {
      const match = products.find(predicate) || products[fallbackIdx] || products[0];
      return match?.images?.[0]?.url || match?.image || '/assets/hero.webp';
    };
    const countMatch = (predicate) => products.filter(predicate).length;

    return [
      {
        title: 'Sneakers',
        eyebrow: 'VERIFIED DEADSTOCK',
        to: '/shop?category=Sneakers',
        count: countMatch((p) => p.category === 'Sneakers'),
        image: findImg((p) => p.category === 'Sneakers' && p.featured, 0),
      },
      {
        title: 'Hoodies & Sweats',
        eyebrow: 'HEAVYWEIGHT FLEECE',
        to: '/shop?category=Clothing&subcategory=' + encodeURIComponent('Hoodies & Sweats'),
        count: countMatch((p) => p.subcategory === 'Hoodies & Sweats' || (p.category === 'Clothing' && /hoodie|sweat|crew/i.test(p.name))),
        image: findImg((p) => p.subcategory === 'Hoodies & Sweats' || (p.category === 'Clothing' && /hoodie|sweat|crew|fleece/i.test(p.name)), 1),
      },
      {
        title: 'Tees & Graphic Tops',
        eyebrow: 'DAILY ROTATION',
        to: '/shop?category=Clothing&subcategory=Tees',
        count: countMatch((p) => p.subcategory === 'Tees' || (p.category === 'Clothing' && /tee|t-shirt/i.test(p.name))),
        image: findImg((p) => p.subcategory === 'Tees' || (p.category === 'Clothing' && /tee|t-shirt|shirt/i.test(p.name)), 2),
      },
      {
        title: 'Outerwear & Pants',
        eyebrow: 'UTILITARIAN LAYERS',
        to: '/shop?category=Clothing',
        count: countMatch((p) => p.category === 'Clothing'),
        image: findImg((p) => p.subcategory === 'Outerwear' || p.subcategory === 'Pants & Shorts' || p.category === 'Clothing', 3),
      },
      {
        title: 'Headwear & Goods',
        eyebrow: 'ACCESSORIES',
        to: '/shop?category=Accessories',
        count: countMatch((p) => p.category === 'Accessories'),
        image: findImg((p) => p.category === 'Accessories', 4),
      },
    ];
  }, [products]);

  const clothingFeature = products.find((product) => product.category === 'Clothing') || products[0];

  const scrollCarousel = (dir) => {
    if (!newInRef.current) return;
    const width = newInRef.current.clientWidth * 0.78;
    newInRef.current.scrollBy({ left: dir * width, behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero">
        <img className="hero-photo" src="/assets/hero.webp" alt="Streetwear and authentic sneakers curation" fetchPriority="high" width="1586" height="992" />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-live-row hero-stagger hero-stagger-1">
            <span className="eyebrow">
              <span className="live-pulse-dot" aria-hidden="true" />
              100% AUTHENTIC SNEAKERS & STREETWEAR
            </span>
            <span className="hero-live-count">{products.length} VERIFIED PIECES · SG</span>
          </div>
          <h1 className="hero-headline">
            <span className="hero-line-mask"><span className="hero-line-inner hero-line-1">THE NEXT</span></span>
            <span className="hero-line-mask"><span className="hero-line-inner hero-line-2">STREET STANDARD.</span></span>
          </h1>
          <p className="hero-stagger hero-stagger-3">Verified authentic sneakers, heavyweight streetwear apparel, and accessories. Hand-inspected by specialists, dispatched directly from Singapore.</p>
          <div className="hero-cta-group hero-stagger hero-stagger-4">
            <Button to="/shop" className="hero-primary-cta">Explore collection <ArrowRight size={21} /></Button>
            <Link to="/shop?new=true" className="button button-outline-hero">New Arrivals</Link>
            <Link to="/shop?category=Clothing" className="button button-outline-hero">Streetwear Apparel</Link>
          </div>
        </div>
      </section>

      {/* Kinetic Infinite Streetwear Label Strip */}
      <BrandTicker brands={derivedBrands} />

      {/* Dynamic Brand Marquee / Quick-Access Rail */}
      <section className="brand-rail-section" aria-label="Shop by brand">
        <div className="brand-pills-bar">
          <Link to="/shop" className="brand-pill-btn active">
            <span>All Pieces</span>
            <span className="pill-count">{products.length}</span>
          </Link>
          <Link to="/shop?new=true" className="brand-pill-btn brand-pill-new">
            <span>New In</span>
          </Link>
          {derivedBrands.map((b) => (
            <Link key={b.name} to={'/shop?brand=' + encodeURIComponent(b.name)} className="brand-pill-btn">
              <span>{b.name}</span>
              <span className="pill-count">{b.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial Shop By Category Image Tiles */}
      <Reveal as="section" className="section category-tiles-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CURATED DEPARTMENTS</span>
            <h2>Shop by Category</h2>
          </div>
          <Link to="/shop" className="arrow-glide-link">Browse full archive <ArrowRight size={19} /></Link>
        </div>
        <div className="category-tiles-grid">
          {categoryTiles.map((tile, idx) => (
            <Link
              key={tile.title}
              to={tile.to}
              className="category-tile-card spotlight-surface"
              style={{ '--tile-idx': idx }}
              onPointerMove={handleSpotlightMove}
            >
              <div className="category-tile-media">
                <img src={tile.image} alt={tile.title} loading="lazy" />
              </div>
              <div className="category-tile-overlay">
                <span className="eyebrow">{tile.eyebrow}</span>
                <div className="category-tile-bottom">
                  <h3>{tile.title}</h3>
                  <span className="category-tile-cta">
                    {tile.count > 0 ? `${tile.count} pieces` : 'Explore'} <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* New In Horizontal Scroller Carousel */}
      <Reveal as="section" className="section new-in-carousel-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">JUST LANDED IN SINGAPORE</span>
            <h2>New In Rotation</h2>
          </div>
          <div className="carousel-controls-group">
            <div className="carousel-arrows">
              <button type="button" className="carousel-arrow-btn" aria-label="Scroll previous" onClick={() => scrollCarousel(-1)}>
                <CaretLeft size={18} weight="bold" />
              </button>
              <button type="button" className="carousel-arrow-btn" aria-label="Scroll next" onClick={() => scrollCarousel(1)}>
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
            <Link to="/shop?new=true" className="carousel-view-all arrow-glide-link">Shop all New In <ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="horizontal-scroller" ref={newInRef}>
          {newInProducts.map((product, idx) => (
            <div key={product.id} className="scroller-item">
              <ProductCard product={product} index={idx} />
            </div>
          ))}
        </div>
      </Reveal>

      {/* Streetwear Apparel & Essentials Section */}
      <Reveal as="section" className="section apparel-showcase-section">
        <div className="section-heading apparel-heading">
          <div>
            <span className="eyebrow">HEAVYWEIGHT STREETWEAR & GOODS</span>
            <h2>Streetwear Apparel & Essentials</h2>
          </div>
          <div className="apparel-filter-pills" role="tablist" aria-label="Filter streetwear showcase">
            {['All', 'Hoodies & Sweats', 'Tees', 'Pants & Shorts', 'Outerwear', 'Accessories'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={apparelTab === tab}
                className={'silhouette-chip ' + (apparelTab === tab ? 'active' : '')}
                onClick={() => setApparelTab(tab)}
              >
                {tab === 'All' ? 'All Streetwear' : tab}
              </button>
            ))}
          </div>
        </div>
        <div key={apparelTab} className="tab-stage">
          <ProductGrid
            products={streetwearProducts.length ? streetwearProducts : products.filter((p) => p.category !== 'Sneakers').slice(0, 8)}
          />
        </div>
        <div className="section-footer-cta">
          <Button to="/shop?category=Clothing" className="button-light">
            Explore All Clothing & Accessories <ArrowRight size={18} />
          </Button>
        </div>
      </Reveal>

      {/* Trending Sneaker Heat Grid */}
      <Reveal as="section" className="section fresh">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IN THE DISTRICT</span>
            <h2>Trending Footwear Heat</h2>
          </div>
          <Link to="/shop?category=Sneakers" className="arrow-glide-link">View all sneakers <ArrowRight size={19} /></Link>
        </div>
        <ProductGrid products={trendingSneakers.length ? trendingSneakers : products.slice(0, 8)} />
      </Reveal>

      {/* The Yeezy Vault Feature Banner */}
      <Reveal as="section" className="vault-banner" variant="scale">
        <div className="vault-content">
          <span className="eyebrow vault-eyebrow">EXCLUSIVE ARCHIVE</span>
          <h2>THE YEEZY VAULT.</h2>
          <p>Explore the defining silhouettes that transformed footwear culture: the Boost 350 V2, the sculpted 700 Wave Runner, and ultra-comfortable Slides & Foam Runners.</p>
          <Button to="/shop?brand=adidas+Yeezy">Shop The Vault <ArrowRight size={20} /></Button>
        </div>
        <div className="vault-preview-grid">
          <ProductGrid products={yeezySneakers} />
        </div>
      </Reveal>

      {/* Air Jordan Retro Collection */}
      <Reveal as="section" className="section jordan-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HERITAGE GRAILS</span>
            <h2>Air Jordan Collection</h2>
          </div>
          <Link to="/shop?brand=Jordan" className="arrow-glide-link">Shop all Jordan <ArrowRight size={19} /></Link>
        </div>
        <ProductGrid products={jordanSneakers} />
      </Reveal>

      {/* Authenticity Trust Standard */}
      <Reveal as="section" className="auth-trust-banner">
        <div className="auth-trust-header">
          <div>
            <span className="eyebrow">VERIFICATION PROMISE</span>
            <h2>THE 4-POINT AUTHENTICITY STANDARD.</h2>
          </div>
          <p>Every sneaker, garment, and accessory that passes through Sole District undergoes rigorous physical evaluation before reaching your doorstep.</p>
        </div>
        <div className="auth-trust-grid">
          <div className="auth-trust-card spotlight-surface" onPointerMove={handleSpotlightMove}>
            <span className="card-step">01 / PHYSICAL AUDIT</span>
            <h3>Stitching, Weave & Geometry</h3>
            <p>Every seam, collar height, heavyweight fleece GSM, and silhouette curve is measured against verified production baselines.</p>
          </div>
          <div className="auth-trust-card spotlight-surface" onPointerMove={handleSpotlightMove}>
            <span className="card-step">02 / OPTICAL & UV</span>
            <h3>Materials, Labels & Blacklight</h3>
            <p>Full UV examination and woven neck/wash label inspection to verify typography, ink density, and dye consistency.</p>
          </div>
          <div className="auth-trust-card spotlight-surface" onPointerMove={handleSpotlightMove}>
            <span className="card-step">03 / DEADSTOCK AUDIT</span>
            <h3>Packaging, Tags & Hardware</h3>
            <p>Original retail boxes, dust bags, hangtags, YKK/custom zippers, barcode checks, and factory accessories.</p>
          </div>
          <div className="auth-trust-card spotlight-surface" onPointerMove={handleSpotlightMove}>
            <span className="card-step">04 / DISPATCH SEAL</span>
            <h3>Tamper-Evident Seal</h3>
            <p>Dispatched with an individually numbered Sole District security tag and backed by our 100% authenticity guarantee.</p>
          </div>
        </div>
      </Reveal>

      {/* The Everyday Edit */}
      <Reveal as="section" className="edit">
        <div>
          <span className="eyebrow">THE EVERYDAY EDIT</span>
          <h2>Good pieces.<br />Great rotation.</h2>
          <p>Considered layers, heavyweight hoodies, graphic tees, and familiar footwear classics. Discover the pieces that work harder in your wardrobe.</p>
          <Button to="/shop?category=Clothing">Explore clothing <ArrowRight size={20} /></Button>
        </div>
        {clothingFeature && <Link to={'/product/' + clothingFeature.id} className="edit-feature-link"><img src={clothingFeature.image} alt={clothingFeature.brand + ' ' + clothingFeature.name} loading="lazy" /></Link>}
      </Reveal>

      <Reveal as="section" className="trust-strip">
        <div><span>01</span><strong><AnimatedCount value={products.length} suffix="+" /> Verified Pieces</strong><p>Multi-point physical verification across <AnimatedCount value={derivedBrands.length} /> global labels in stock.</p></div>
        <div><span>02</span><strong>Singapore Dispatch</strong><p>Local stock with same-day dispatch and tracked courier delivery across all 28 SG districts.</p></div>
        <div><span>03</span><strong>Complimentary Delivery</strong><p>Complimentary tracked delivery on all orders over S$150.</p></div>
      </Reveal>
    </>
  );
}

export function ShopPage() {
  const { products } = useShop();
  const [params, setParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [gridCols, setGridCols] = useState(() => readStored('sd-grid-cols', 3));
  const [extraBatchCount, setExtraBatchCount] = useState(0);

  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const subcategory = params.get('subcategory') || '';
  const brand = params.get('brand') || '';
  const silhouette = params.get('silhouette') || '';
  const size = params.get('size') || '';
  const sort = params.get('sort') || 'new';
  const stockOnly = params.get('stock') === 'true';
  const newOnly = params.get('new') === 'true';
  const saleOnly = params.get('sale') === 'true';
  const colour = params.get('colour') || '';
  const maxPrice = Number(params.get('maxPrice')) || 0;
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);

  // Reset extra loaded batches when primary filter parameters change
  useEffect(() => {
    setExtraBatchCount(0);
  }, [query, category, subcategory, brand, silhouette, size, sort, stockOnly, newOnly, saleOnly, colour, maxPrice, requestedPage]);

  const handleSetCols = (cols) => {
    setGridCols(cols);
    saveStored('sd-grid-cols', cols);
  };

  const change = (key, value) => {
    const next = new URLSearchParams(params);
    if (key !== 'page') next.delete('page');
    if (key === 'category' && value !== category) {
      next.delete('subcategory');
      next.delete('silhouette');
    }
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const clearFilter = (key) => {
    const next = new URLSearchParams(params);
    next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const derivedBrands = useMemo(() => getDerivedBrands(products), [products]);
  const derivedSubcategories = useMemo(
    () => getDerivedSubcategories(products, category),
    [products, category]
  );
  const allSilhouettes = useMemo(
    () => getDerivedSilhouettes(products, brand).map((s) => s.name),
    [products, brand]
  );

  const sortedFilterSizes = useMemo(() => {
    const rawSizes = [
      ...new Set(
        products
          .filter((p) => (!category || p.category === category) && (!subcategory || p.subcategory === subcategory))
          .flatMap((p) => p.sizes || [])
      ),
    ];
    return sortVariantsBySize(rawSizes.map((s) => ({ size: s }))).map((v) => v.size);
  }, [products, category, subcategory]);

  const categoryCounts = useMemo(() => {
    const counts = { All: products.length, Sneakers: 0, Clothing: 0, Accessories: 0 };
    for (const p of products) {
      if (counts[p.category] !== undefined) counts[p.category] += 1;
    }
    return counts;
  }, [products]);

  let found = products.filter((product) => {
    if (category && product.category !== category) return false;
    if (subcategory && product.subcategory !== subcategory) return false;
    if (brand && product.brand !== brand) return false;
    if (silhouette && product.silhouette !== silhouette) return false;
    if (newOnly && !isNewIn(product)) return false;
    if (saleOnly && !isOnSale(product)) return false;
    if (query) {
      const hay = `${product.brand} ${product.name} ${product.color || ''} ${product.category || ''} ${product.subcategory || ''} ${product.silhouette || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    if (size && !product.variants.some((variant) => variant.size === size && variant.available > 0)) return false;
    if (stockOnly && !product.variants.some((variant) => variant.available > 0)) return false;
    if (colour && product.color !== colour) return false;
    if (maxPrice && product.price > maxPrice * 100) return false;
    return true;
  });

  if (sort === 'low') {
    found = [...found].sort((a, b) => a.price - b.price);
  } else if (sort === 'high') {
    found = [...found].sort((a, b) => b.price - a.price);
  } else if (sort === 'newest' || (sort === 'new' && newOnly)) {
    found = [...found].sort((a, b) => {
      const dateA = a.addedAt || '';
      const dateB = b.addedAt || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  } else if (sort === 'new') {
    found = [...found].sort((a, b) => {
      const featDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featDiff !== 0) return featDiff;
      return (b.addedAt || '').localeCompare(a.addedAt || '');
    });
  }

  const perPage = 12;
  const pages = Math.max(1, Math.ceil(found.length / perPage));
  const page = Math.min(requestedPage, pages);
  const startIdx = (page - 1) * perPage;
  const endIdx = Math.min(found.length, (page + extraBatchCount) * perPage);
  const visibleProducts = found.slice(startIdx, endIdx);
  const progressPct = found.length > 0 ? Math.min(100, Math.round((endIdx / found.length) * 100)) : 100;

  const hasActiveFilters = Boolean(
    brand || subcategory || silhouette || size || colour || maxPrice || stockOnly || newOnly || saleOnly || query
  );

  const headingTitle = useMemo(() => {
    if (query) return `Results for “${query}”`;
    if (newOnly && subcategory) return `New In: ${subcategory}`;
    if (newOnly && category) return `New In ${category}`;
    if (newOnly) return 'New Arrivals';
    if (saleOnly && category) return `${category} Archive Sale`;
    if (saleOnly) return 'Archive Sale';
    if (subcategory && brand) return `${brand} · ${subcategory}`;
    if (subcategory) return subcategory;
    if (silhouette) return silhouette;
    if (brand && category) return `${brand} ${category}`;
    if (brand) return brand;
    if (category) return category;
    return 'All Sneakers, Streetwear & Goods';
  }, [query, newOnly, saleOnly, subcategory, silhouette, brand, category]);

  const renderFilterGroups = () => (
    <>
      {/* Status & Curations */}
      <details className="filter-group" open>
        <summary>Release & Availability <CaretDown size={14} /></summary>
        <div className="filter-group-body filter-checks">
          <label className="checkbox">
            <input type="checkbox" checked={newOnly} onChange={(e) => change('new', e.target.checked ? 'true' : '')} />
            <span>New In (Last 45 days)</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={saleOnly} onChange={(e) => change('sale', e.target.checked ? 'true' : '')} />
            <span>On Sale</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={stockOnly} onChange={(e) => change('stock', e.target.checked ? 'true' : '')} />
            <span>In Stock Only</span>
          </label>
        </div>
      </details>

      {/* Category */}
      <details className="filter-group" open>
        <summary>Category <CaretDown size={14} /></summary>
        <div className="filter-group-body filter-list-buttons">
          {['', 'Sneakers', 'Clothing', 'Accessories'].map((cat) => {
            const label = cat || 'All Categories';
            const cnt = cat ? categoryCounts[cat] : categoryCounts.All;
            return (
              <button
                key={label}
                type="button"
                className={'filter-list-btn ' + (category === cat ? 'active' : '')}
                onClick={() => change('category', cat)}
              >
                <span>{label}</span>
                <span className="filter-item-count">{cnt}</span>
              </button>
            );
          })}
        </div>
      </details>

      {/* Subcategory */}
      {(category === 'Clothing' || category === 'Accessories' || !category) && derivedSubcategories.length > 0 && (
        <details className="filter-group" open>
          <summary>Subcategory <CaretDown size={14} /></summary>
          <div className="filter-group-body filter-list-buttons">
            <button
              type="button"
              className={'filter-list-btn ' + (!subcategory ? 'active' : '')}
              onClick={() => change('subcategory', '')}
            >
              <span>All Subcategories</span>
            </button>
            {derivedSubcategories.map((sub) => (
              <button
                key={sub.name}
                type="button"
                className={'filter-list-btn ' + (subcategory === sub.name ? 'active' : '')}
                onClick={() => change('subcategory', subcategory === sub.name ? '' : sub.name)}
              >
                <span>{sub.name}</span>
                <span className="filter-item-count">{sub.count}</span>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Brand with counts */}
      <details className="filter-group" open>
        <summary>Brand ({derivedBrands.length}) <CaretDown size={14} /></summary>
        <div className="filter-group-body filter-list-buttons filter-scroll-box">
          <button
            type="button"
            className={'filter-list-btn ' + (!brand ? 'active' : '')}
            onClick={() => change('brand', '')}
          >
            <span>All Brands</span>
            <span className="filter-item-count">{products.length}</span>
          </button>
          {derivedBrands.map((b) => (
            <button
              key={b.name}
              type="button"
              className={'filter-list-btn ' + (brand === b.name ? 'active' : '')}
              onClick={() => change('brand', brand === b.name ? '' : b.name)}
            >
              <span>{b.name}</span>
              <span className="filter-item-count">{b.count}</span>
            </button>
          ))}
        </div>
      </details>

      {/* Size Buttons Grid */}
      <details className="filter-group" open>
        <summary>Size {size && `(${size})`} <CaretDown size={14} /></summary>
        <div className="filter-group-body">
          <div className="filter-size-grid">
            {sortedFilterSizes.map((item) => (
              <button
                key={item}
                type="button"
                className={'filter-size-btn ' + (size === item ? 'active' : '')}
                onClick={() => change('size', size === item ? '' : item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </details>

      {/* Price Range */}
      <details className="filter-group" open>
        <summary>Price Range (SGD) <CaretDown size={14} /></summary>
        <div className="filter-group-body">
          <div className="price-tier-chips">
            {[150, 250, 400, 600].map((tier) => (
              <button
                key={tier}
                type="button"
                className={'price-tier-chip ' + (maxPrice === tier ? 'active' : '')}
                onClick={() => change('maxPrice', maxPrice === tier ? '' : String(tier))}
              >
                Under S${tier}
              </button>
            ))}
          </div>
          <label className="max-price-input-label">
            <span>Max SGD</span>
            <input
              type="number"
              min="0"
              step="10"
              placeholder="No limit"
              value={maxPrice || ''}
              onChange={(event) => change('maxPrice', event.target.value)}
            />
          </label>
        </div>
      </details>

      {/* Silhouette */}
      {(!category || category === 'Sneakers') && allSilhouettes.length > 0 && (
        <details className="filter-group">
          <summary>Silhouette <CaretDown size={14} /></summary>
          <div className="filter-group-body">
            <select value={silhouette} onChange={(event) => change('silhouette', event.target.value)} aria-label="Silhouette">
              <option value="">All silhouettes</option>
              {allSilhouettes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </details>
      )}
    </>
  );

  return (
    <div className="section shop-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(category)}`}>{category}</Link>
          </>
        )}
        {subcategory && (
          <>
            <span>/</span>
            <span>{subcategory}</span>
          </>
        )}
        {!subcategory && (brand || silhouette || newOnly || saleOnly) && (
          <>
            <span>/</span>
            <span>{silhouette || brand || (newOnly ? 'New In' : 'Sale')}</span>
          </>
        )}
      </div>

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {newOnly ? 'FRESH ROTATION' : saleOnly ? 'LIMITED ARCHIVE MARKDOWNS' : 'AUTHENTIC ROTATION'}
          </span>
          <h1>{headingTitle}</h1>
          <p>Hand-verified authentic footwear grails, heavyweight streetwear apparel, and everyday accessories.</p>
        </div>
        <span className="results-counter-badge">{found.length} {found.length === 1 ? 'piece' : 'pieces'}</span>
      </div>

      {/* Dynamic Brand Quick Switcher */}
      <div className="brand-pills-bar shop-brand-bar">
        <button
          className={'brand-pill-btn ' + (!brand ? 'active' : '')}
          onClick={() => change('brand', '')}
        >
          All Brands ({products.length})
        </button>
        {derivedBrands.map((b) => (
          <button
            key={b.name}
            className={'brand-pill-btn ' + (brand === b.name ? 'active' : '')}
            onClick={() => change('brand', brand === b.name ? '' : b.name)}
          >
            <span>{b.name}</span>
            <span className="pill-count">{b.count}</span>
          </button>
        ))}
      </div>

      {/* Contextual Subcategory or Silhouette Filter Chips */}
      {(category === 'Clothing' || category === 'Accessories') ? (
        <div className="silhouette-filter-bar" aria-label="Filter by subcategory">
          <button
            className={'silhouette-chip ' + (!subcategory ? 'active' : '')}
            onClick={() => change('subcategory', '')}
          >
            All {category}
          </button>
          {(category === 'Clothing' ? CLOTHING_SUBCATEGORIES : ACCESSORY_SUBCATEGORIES).map((sub) => (
            <button
              key={sub}
              className={'silhouette-chip ' + (subcategory === sub ? 'active' : '')}
              onClick={() => change('subcategory', subcategory === sub ? '' : sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      ) : (
        <div className="silhouette-filter-bar" aria-label="Filter by silhouette or subcategory">
          <button
            className={'silhouette-chip ' + (!silhouette && !subcategory ? 'active' : '')}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete('silhouette');
              next.delete('subcategory');
              next.delete('page');
              setParams(next);
            }}
          >
            All Styles
          </button>
          {CLOTHING_SUBCATEGORIES.slice(0, 3).map((sub) => (
            <button
              key={sub}
              className={'silhouette-chip ' + (subcategory === sub ? 'active' : '')}
              onClick={() => change('subcategory', subcategory === sub ? '' : sub)}
            >
              {sub}
            </button>
          ))}
          {allSilhouettes.slice(0, 10).map((sil) => (
            <button
              key={sil}
              className={'silhouette-chip ' + (silhouette === sil ? 'active' : '')}
              onClick={() => change('silhouette', silhouette === sil ? '' : sil)}
            >
              {sil}
            </button>
          ))}
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="active-filter-chips">
          <span className="active-filter-label">Active:</span>
          {newOnly && (
            <button className="filter-chip-remove" onClick={() => clearFilter('new')}>
              New In <X size={14} />
            </button>
          )}
          {saleOnly && (
            <button className="filter-chip-remove" onClick={() => clearFilter('sale')}>
              On Sale <X size={14} />
            </button>
          )}
          {subcategory && (
            <button className="filter-chip-remove" onClick={() => clearFilter('subcategory')}>
              {subcategory} <X size={14} />
            </button>
          )}
          {brand && (
            <button className="filter-chip-remove" onClick={() => clearFilter('brand')}>
              Brand: {brand} <X size={14} />
            </button>
          )}
          {silhouette && (
            <button className="filter-chip-remove" onClick={() => clearFilter('silhouette')}>
              Model: {silhouette} <X size={14} />
            </button>
          )}
          {size && (
            <button className="filter-chip-remove" onClick={() => clearFilter('size')}>
              Size: {size} <X size={14} />
            </button>
          )}
          {colour && (
            <button className="filter-chip-remove" onClick={() => clearFilter('colour')}>
              {colour} <X size={14} />
            </button>
          )}
          {maxPrice > 0 && (
            <button className="filter-chip-remove" onClick={() => clearFilter('maxPrice')}>
              Under S${maxPrice} <X size={14} />
            </button>
          )}
          {query && (
            <button className="filter-chip-remove" onClick={() => clearFilter('q')}>
              “{query}” <X size={14} />
            </button>
          )}
          {stockOnly && (
            <button className="filter-chip-remove" onClick={() => clearFilter('stock')}>
              In-stock only <X size={14} />
            </button>
          )}
          <button className="text-button clear-all-link" onClick={() => setParams({})}>
            Reset all
          </button>
        </div>
      )}

      <div className="shop-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="text-button filter-button desktop-filter-toggle"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            <SlidersHorizontal size={18} />
            <span>{desktopSidebarOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
          <button
            type="button"
            className="text-button filter-button mobile-filter-toggle"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={18} />
            <span>Filters & Sort</span>
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
        </div>

        <div className="category-tabs">
          {['', 'Sneakers', 'Clothing', 'Accessories'].map((item) => (
            <button
              key={item || 'all'}
              className={category === item ? 'active' : ''}
              onClick={() => change('category', item)}
            >
              {item || 'All Pieces'}
            </button>
          ))}
        </div>

        <div className="toolbar-right">
          <div className="grid-density-toggle" role="group" aria-label="Grid density">
            {[2, 3, 4].map((cols) => (
              <button
                key={cols}
                type="button"
                className={'density-btn ' + (gridCols === cols ? 'active' : '')}
                onClick={() => handleSetCols(cols)}
                aria-label={`${cols} columns`}
                aria-pressed={gridCols === cols}
              >
                {cols}
              </button>
            ))}
          </div>

          <label className="sort-label">
            Sort by
            <select value={sort} onChange={(event) => change('sort', event.target.value)}>
              <option value="new">Featured & Grails</option>
              <option value="newest">Newest Arrivals</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>

      <div className={'shop-layout ' + (desktopSidebarOpen ? 'has-filters' : 'no-sidebar')}>
        {desktopSidebarOpen && (
          <aside className="filters desktop-filters-sidebar" aria-label="Product filters">
            <div className="filters-sidebar-header">
              <strong>Filter By</strong>
              {hasActiveFilters && (
                <button type="button" className="text-button" onClick={() => setParams(category ? { category } : {})}>
                  Clear all
                </button>
              )}
            </div>
            {renderFilterGroups()}
          </aside>
        )}

        <div className="shop-results">
          {found.length ? (
            <>
              <ProductGrid products={visibleProducts} columns={gridCols} />

              {/* Showing X of Y + Progress Bar + Load More + Pagination */}
              <div className="catalogue-footer">
                <div className="catalogue-progress-wrap">
                  <span className="catalogue-progress-text">
                    Showing <strong>{visibleProducts.length}</strong> of <strong>{found.length}</strong> pieces
                  </span>
                  <div className="catalogue-progress-bar">
                    <div className="catalogue-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {endIdx < found.length && (
                  <Button
                    type="button"
                    className="button-light load-more-btn"
                    onClick={() => setExtraBatchCount((c) => c + 1)}
                  >
                    Load more pieces ({found.length - endIdx} remaining) <Plus size={16} />
                  </Button>
                )}

                {pages > 1 && (
                  <nav className="catalogue-pagination" aria-label="Catalogue pages">
                    <button
                      className="text-button"
                      disabled={page === 1}
                      onClick={() => change('page', String(page - 1))}
                    >
                      Previous
                    </button>
                    <span>Page {page} of {pages}</span>
                    <button
                      className="text-button"
                      disabled={page === pages}
                      onClick={() => change('page', String(page + 1))}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </div>
            </>
          ) : (
            <div className="empty">
              <h2>No pieces match your current filters.</h2>
              <p>Try selecting another brand, category, or size — or reset your active filters to explore the full collection.</p>
              <Button onClick={() => setParams({})}>Explore all pieces</Button>
            </div>
          )}
        </div>
      </div>

      {/* Off-Canvas Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="mobile-filter-backdrop" onClick={() => setMobileFiltersOpen(false)}>
          <aside className="mobile-filter-drawer" aria-label="Mobile filters" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-filter-header">
              <h2>Filter & Sort ({found.length})</h2>
              <button type="button" className="icon" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X size={22} />
              </button>
            </div>
            <div className="mobile-filter-body">
              {renderFilterGroups()}
            </div>
            <div className="mobile-filter-footer">
              <button
                type="button"
                className="button button-light"
                onClick={() => setParams({})}
              >
                Reset all
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setMobileFiltersOpen(false)}
              >
                View {found.length} pieces
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export function ProductPage() {
  const { products, add, wishlist, toggleWish } = useShop();
  const { pathname } = useLocation();
  const product = products.find((item) => item.id === pathname.split('/').pop());
  const [selected, setSelected] = useState('');
  const [zoom, setZoom] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => readStored('sd-recently-viewed', []));
  const sizeGridRef = useRef(null);

  useEffect(() => {
    setSelected('');
    setActiveImage(0);
    setSizeError(false);
  }, [pathname]);

  useEffect(() => {
    if (!product) return;
    trackEvent('product_viewed', { product_id: product.id });
    setRecentlyViewedIds((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const next = [product.id, ...list.filter((id) => id !== product.id)].slice(0, 10);
      saveStored('sd-recently-viewed', next);
      return next;
    });
  }, [product?.id]);

  // Precompute cross-sell ("Complete the look"), similar items, and recently viewed
  const completeTheLook = useMemo(() => {
    if (!product) return [];
    const targetCategories = product.category === 'Sneakers'
      ? ['Clothing', 'Accessories']
      : ['Sneakers', product.category === 'Clothing' ? 'Accessories' : 'Clothing'];
    const pool = products.filter((p) => p.id !== product.id && targetCategories.includes(p.category));
    // Prefer items from different subcategories/categories for a balanced outfit
    const picked = [];
    const seenSub = new Set();
    for (const candidate of pool) {
      const key = candidate.subcategory || candidate.category;
      if (!seenSub.has(key) && picked.length < 4) {
        picked.push(candidate);
        seenSub.add(key);
      }
    }
    for (const candidate of pool) {
      if (picked.length >= 4) break;
      if (!picked.some((p) => p.id === candidate.id)) picked.push(candidate);
    }
    return picked.slice(0, 4);
  }, [product, products]);

  const similarItems = useMemo(() => {
    if (!product) return [];
    const completeIds = new Set(completeTheLook.map((p) => p.id));
    return products
      .filter((p) => p.id !== product.id && !completeIds.has(p.id))
      .map((p) => {
        let score = 0;
        if (p.category === product.category) score += 4;
        if (product.subcategory && p.subcategory === product.subcategory) score += 6;
        if (product.silhouette && p.silhouette === product.silhouette) score += 6;
        if (p.brand === product.brand) score += 5;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.p);
  }, [product, products, completeTheLook]);

  const recentlyViewedProducts = useMemo(() => {
    if (!product || !Array.isArray(recentlyViewedIds)) return [];
    return recentlyViewedIds
      .filter((id) => id !== product.id)
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 4);
  }, [product, recentlyViewedIds, products]);

  if (!product) return <NotFound />;

  const sortedVariants = sortVariantsBySize(product.variants || []);
  const selectedVariant = sortedVariants.find((variant) => variant.id === selected);
  const images = product.images?.length ? product.images : [{ url: product.image, alt: product.brand + ' ' + product.name }];
  const currentImage = images[activeImage] || images[0];
  const isSneaker = product.category === 'Sneakers';
  const isClothing = product.category === 'Clothing';
  const onSale = isOnSale(product);
  const salePct = discountPercent(product);
  const newIn = isNewIn(product);
  const lowStock = isLowStock(product);
  const soldOut = isSoldOut(product);

  const addToBag = () => {
    if (!selectedVariant) {
      setSizeError(true);
      if (sizeGridRef.current) {
        sizeGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setTimeout(() => setSizeError(false), 2400);
      return;
    }
    if (selectedVariant.available < 1) return;
    add(product, selected);
  };

  return (
    <div className="section product-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={'/shop?category=' + encodeURIComponent(product.category)}>{product.category}</Link>
        {product.subcategory && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}&subcategory=${encodeURIComponent(product.subcategory)}`}>
              {product.subcategory}
            </Link>
          </>
        )}
        <span>/</span>
        <Link to={'/shop?brand=' + encodeURIComponent(product.brand)}>{product.brand}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-layout">
        <div className="gallery">
          <div className="thumbs">
            {images.map((image, index) => (
              <button
                key={image.url + index}
                className={activeImage === index ? 'selected' : ''}
                onClick={() => setActiveImage(index)}
                aria-label={'Show product image ' + (index + 1)}
              >
                <img src={image.url} alt="" />
              </button>
            ))}
          </div>
          <button className="main-product-photo" onClick={() => setZoom(true)} aria-label="Enlarge product image">
            <img key={currentImage.url} className="pdp-hero-img" src={currentImage.url} alt={currentImage.alt} />
            <span><Plus size={17} />Enlarge</span>
          </button>
        </div>

        <div className="purchase-panel">
          <div className="pdp-badges-row">
            <Link to={'/shop?brand=' + encodeURIComponent(product.brand)} className="eyebrow pdp-brand-link">{product.brand}</Link>
            {newIn && <span className="product-badge badge-new">New In</span>}
            {onSale && <span className="product-badge badge-sale">Sale −{salePct}%</span>}
            {product.badge && <span className="product-badge">{product.badge}</span>}
            {lowStock && !soldOut && <span className="product-badge badge-lowstock">Low Stock</span>}
            {soldOut && <span className="product-badge badge-soldout">Sold Out</span>}
          </div>

          <h1>{product.name}</h1>
          <p className="color-name">
            {product.color}
            {(product.subcategory || product.silhouette) && ` · ${product.subcategory || product.silhouette}`}
          </p>

          <div className="pdp-price-block">
            <span className={'price' + (onSale ? ' price-sale' : '')}>{money(product.price)}</span>
            {onSale && (
              <>
                <del className="pdp-retail-price">{money(product.retailPrice)}</del>
                <span className="pdp-save-pill">Save {money(product.retailPrice - product.price)} ({salePct}%)</span>
              </>
            )}
          </div>

          {product.tags?.length > 0 && (
            <div className="pdp-tags-row">
              {product.tags.map((tag) => (
                <span key={tag} className="pdp-tag-chip">#{tag}</span>
              ))}
            </div>
          )}

          <p className="description">{product.description}</p>

          {/* Authenticity Box for all categories (Sneakers, Clothing, Accessories) */}
          <div className="authenticity-box">
            <div className="authenticity-box-header">
              <ShieldCheck size={20} weight="fill" color="#566e00" />
              <strong>100% Authentic Guaranteed</strong>
              <span>{isSneaker ? 'Verified Deadstock' : 'Verified Brand New'}</span>
            </div>
            <ul>
              {isSneaker ? (
                <>
                  <li>✓ Multi-point physical verification by sneaker specialists</li>
                  <li>✓ Brand new in original packaging with verified security tag</li>
                  <li>✓ Dispatched locally from Singapore with tracked delivery</li>
                </>
              ) : (
                <>
                  <li>✓ Multi-point garment fabric weight, weave, wash tag & hardware inspection</li>
                  <li>✓ Brand new with original retail tags & tamper-evident District seal</li>
                  <li>✓ Dispatched locally from Singapore with tracked courier delivery</li>
                </>
              )}
            </ul>
          </div>

          <div className="colour-row"><span>Colourway</span><span>{product.color.split(' / ')[0]}</span></div>

          <div className="size-heading">
            <strong>Select size {isSneaker ? '(UK)' : ''}</strong>
            {sizeError && <span className="size-prompt-pill" role="alert">Please select a size</span>}
            <button className="underlined" onClick={() => setGuideOpen(true)}>
              {isClothing ? 'Clothing size guide' : isSneaker ? 'Sneaker size guide' : 'Sizing & dimensions'}
            </button>
          </div>
          <p className="size-system">
            {isSneaker
              ? 'UK sizing shown. Click Size guide for US / EU / CM conversion.'
              : isClothing
                ? 'International streetwear sizing (XS–XXL). Click Size guide for chest & length in cm.'
                : 'Standard accessory sizing shown.'}
          </p>

          <div ref={sizeGridRef} className={'sizes' + (sizeError ? ' shake-sizes' : '')}>
            {sortedVariants.map((variant) => {
              const labelPrefix = variant.size_system === 'UK' ? 'UK ' : '';
              return (
                <button
                  key={variant.id}
                  className={selected === variant.id ? 'selected' : ''}
                  disabled={variant.available < 1}
                  aria-pressed={selected === variant.id}
                  aria-label={`${labelPrefix}${variant.size}${variant.available < 1 ? ' — sold out' : ''}`}
                  onClick={() => {
                    setSelected(variant.id);
                    setSizeError(false);
                  }}
                >
                  {labelPrefix}{variant.size}
                  {variant.colour && sortedVariants.some((row) => row.size === variant.size && row.id !== variant.id) ? ' · ' + variant.colour : ''}
                </button>
              );
            })}
          </div>

          <p className={'stock-message ' + (selected ? 'ready' : '') + (sizeError ? ' text-error' : '')}>
            {sizeError
              ? 'Please choose your size above before adding to bag.'
              : product.illustrative && !product.sellable
                ? selectedVariant
                  ? `Preview availability only · ${selectedVariant.size_system === 'UK' ? 'UK ' : ''}${selectedVariant.size} selected${selectedVariant.available <= 3 ? ` · Only ${selectedVariant.available} left` : ''}`
                  : lowStock
                    ? '⚡ Low stock across remaining sizes · Illustrative preview'
                    : 'Illustrative sizes · preview only'
                : selectedVariant
                  ? `✓ ${selectedVariant.size_system === 'UK' ? 'UK ' : ''}${selectedVariant.size} selected · ${selectedVariant.available} available`
                  : 'Choose your size to continue'}
          </p>

          <div className="purchase-actions">
            <Button
              disabled={soldOut || (selectedVariant && selectedVariant.available < 1)}
              onClick={addToBag}
              className={!selectedVariant ? 'button-prompt-size' : ''}
            >
              {soldOut ? 'Sold out' : !selectedVariant ? 'Select size to add' : 'Add to bag'} <ArrowRight size={20} />
            </Button>
            <button
              className="outline-icon"
              aria-label="Save to wishlist"
              aria-pressed={wishlist.includes(product.id)}
              onClick={() => toggleWish(product.id)}
            >
              <Heart size={22} weight={wishlist.includes(product.id) ? 'fill' : 'regular'} />
            </button>
          </div>

          <div className="delivery-perks">
            <span><Truck size={21} />Tracked SG delivery (Free over S$150)</span>
            <span><Package size={21} />Easy return requests</span>
          </div>

          <details open>
            <summary>Details & composition <CaretDown size={16} /></summary>
            <p>{product.detail}</p>
          </details>
          <details>
            <summary>Delivery & returns <CaretDown size={16} /></summary>
            <p>Singapore delivery is estimated at S$8, complimentary from S$150. Final terms will appear before payment. <Link to="/help/delivery">Delivery information</Link></p>
          </details>
          <details>
            <summary>Sourcing & verification <CaretDown size={16} /></summary>
            <p>{product.illustrative && !product.sellable ? 'This is an illustrative preview. Supplier evidence and physical product checks have not been recorded, so this item cannot be purchased.' : 'Sourcing information and authentic product checks are verified for this product.'}</p>
          </details>
          <button className="underlined sizing-help" onClick={() => setGuideOpen(true)}>Need help with sizing?</button>
        </div>
      </div>

      {/* Complete The Look Cross-Sell Section */}
      {completeTheLook.length > 0 && (
        <Reveal as="section" className="related complete-look-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">STYLE IT WITH</span>
              <h2>Complete the Look</h2>
            </div>
            <Link to={isSneaker ? '/shop?category=Clothing' : '/shop?category=Sneakers'} className="arrow-glide-link">
              Shop {isSneaker ? 'Streetwear Apparel' : 'Sneakers'} <ArrowRight size={19} />
            </Link>
          </div>
          <ProductGrid products={completeTheLook} />
        </Reveal>
      )}

      {/* Similar Items Section */}
      <Reveal as="section" className="related">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SIMILAR ROTATION PIECES</span>
            <h2>You Might Also Like</h2>
          </div>
          <Link to={'/shop?category=' + encodeURIComponent(product.category)} className="arrow-glide-link">
            Explore all {product.category} <ArrowRight size={19} />
          </Link>
        </div>
        <ProductGrid products={similarItems} />
      </Reveal>

      {/* Recently Viewed Rail */}
      {recentlyViewedProducts.length > 0 && (
        <Reveal as="section" className="related recently-viewed-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR ARCHIVE TRAIL</span>
              <h2>Recently Viewed</h2>
            </div>
          </div>
          <ProductGrid products={recentlyViewedProducts} />
        </Reveal>
      )}

      {/* Category-Aware Size Guide Modal */}
      {guideOpen && (
        <Dialog
          title={
            isClothing
              ? 'Streetwear Apparel Sizing & Fit Guide'
              : isSneaker
                ? 'Sneaker Sizing & Fit Guide'
                : 'Accessories & Headwear Sizing Guide'
          }
          onClose={() => setGuideOpen(false)}
        >
          {isClothing ? (
            <div className="size-guide-modal-content">
              <p>Garment measurements in centimetres (cm) taken flat across chest and from highest shoulder point to hem:</p>
              <div className="table-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>Size (INT)</th>
                      <th>Chest Width (cm)</th>
                      <th>Body Length (cm)</th>
                      <th>Shoulder (cm)</th>
                      <th>Equivalent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>XS</td><td>108</td><td>67</td><td>50</td><td>UK 34 / US XS</td></tr>
                    <tr><td>S</td><td>114</td><td>70</td><td>52</td><td>UK 36 / US S</td></tr>
                    <tr><td>M</td><td>120</td><td>73</td><td>54</td><td>UK 38–40 / US M</td></tr>
                    <tr><td>L</td><td>126</td><td>76</td><td>56</td><td>UK 42 / US L</td></tr>
                    <tr><td>XL</td><td>132</td><td>79</td><td>58</td><td>UK 44 / US XL</td></tr>
                    <tr><td>XXL</td><td>138</td><td>81</td><td>60</td><td>UK 46 / US XXL</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="size-fit-tips">
                <div><strong>Fear of God Essentials & Boxy Cuts:</strong> Designed with a dropped shoulder and relaxed, oversized drape. Take your normal size for the intended boxy look, or size down once for a closer fit.</div>
                <div><strong>Stüssy, Supreme & Palace Tees/Hoodies:</strong> Relaxed skate fit. True to size (TTS) for everyday streetwear comfort.</div>
                <div><strong>Carhartt WIP & Outerwear:</strong> Structured workwear silhouette with room for layering underneath.</div>
              </div>
            </div>
          ) : isSneaker ? (
            <div className="size-guide-modal-content">
              <p>International footwear conversion matrix across UK, US Men, US Women, EU, and CM measurements:</p>
              <div className="table-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>UK</th>
                      <th>US Men</th>
                      <th>US Women</th>
                      <th>EU</th>
                      <th>CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>6</td><td>6.5</td><td>8</td><td>40</td><td>25.0</td></tr>
                    <tr><td>6.5</td><td>7</td><td>8.5</td><td>40.5</td><td>25.5</td></tr>
                    <tr><td>7</td><td>7.5</td><td>9</td><td>41</td><td>26.0</td></tr>
                    <tr><td>7.5</td><td>8</td><td>9.5</td><td>42</td><td>26.5</td></tr>
                    <tr><td>8</td><td>8.5</td><td>10</td><td>42.5</td><td>27.0</td></tr>
                    <tr><td>8.5</td><td>9</td><td>10.5</td><td>43</td><td>27.5</td></tr>
                    <tr><td>9</td><td>9.5</td><td>11</td><td>44</td><td>28.0</td></tr>
                    <tr><td>9.5</td><td>10</td><td>11.5</td><td>44.5</td><td>28.5</td></tr>
                    <tr><td>10</td><td>10.5</td><td>12</td><td>45</td><td>29.0</td></tr>
                    <tr><td>10.5</td><td>11</td><td>12.5</td><td>45.5</td><td>29.5</td></tr>
                    <tr><td>11</td><td>11.5</td><td>13</td><td>46</td><td>30.0</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="size-fit-tips">
                <div><strong>Air Jordan & Nike Dunks:</strong> True to size (TTS). If you have wider feet, we suggest choosing 0.5 size up on Air Jordan 4 and Dunk Low.</div>
                <div><strong>adidas Yeezy 350 & 700:</strong> Fits snug around the toe-box. We advise going 0.5 size up from your standard UK size.</div>
                <div><strong>Yeezy Slide & Foam Runner:</strong> Produced in whole sizes only. In-between sizes should select the next full size up.</div>
              </div>
            </div>
          ) : (
            <div className="size-guide-modal-content">
              <p>Accessory sizing reference for headwear, crew socks, and everyday carry bags:</p>
              <div className="table-wrapper">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Measurement / Fit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Headwear (Caps & Beanies)</td><td>One size</td><td>55 – 60 cm circumference (adjustable strap / stretch rib)</td></tr>
                    <tr><td>Crew Socks</td><td>S / M / L</td><td>S: UK 4–6 · M: UK 7–9 · L: UK 10–12</td></tr>
                    <tr><td>Bags & Small Goods</td><td>One size</td><td>Dimensions listed in product details above</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Dialog>
      )}
      {zoom && <Dialog title={product.brand + ' ' + product.name} onClose={() => setZoom(false)}><img className="zoom-image" src={currentImage.url} alt={currentImage.alt} /></Dialog>}

      {/* Mobile Sticky Quick Add Bar */}
      <div className="mobile-sticky-action-bar" aria-label="Quick buy bar">
        <div className="sticky-info">
          <span className="sticky-brand">{product.brand}</span>
          <span className="sticky-name">{product.name}</span>
          <span className="sticky-price">{money(product.price)}</span>
        </div>
        <div className="sticky-controls">
          <select
            className="sticky-size-select"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setSizeError(false);
            }}
            aria-label="Select size"
          >
            <option value="">{selectedVariant ? `${selectedVariant.size_system === 'UK' ? 'UK ' : ''}${selectedVariant.size}` : 'Size'}</option>
            {sortedVariants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.available < 1}>
                {v.size_system === 'UK' ? 'UK ' : ''}{v.size} {v.available < 1 ? '(Sold out)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button sticky-add-btn"
            disabled={soldOut || (selectedVariant && selectedVariant.available < 1)}
            onClick={addToBag}
          >
            {soldOut ? 'Sold out' : !selectedVariant ? 'Select size' : 'Add to bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Checkout() {
  const { lines, subtotal, store } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [params] = useSearchParams();
  const cancellationSent = useRef(false);
  const paying = useRef(false);
  const [draft] = useState(readCheckoutDraft);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(draft.useNewAddress);
  const [deliveryAddress, setDeliveryAddress] = useState(draft.deliveryAddress);
  const [addressValidState, setAddressValidState] = useState({ valid: false, errors: {} });

  // Promo code state
  const [promoInput, setPromoInput] = useState(draft.promoInput);
  const [appliedPromo, setAppliedPromo] = useState(draft.appliedPromo);
  const [promoError, setPromoError] = useState('');

  // Free delivery calculation (S$150 = 15,000 cents)
  const freeThreshold = 15000;
  const delivery = shipping(subtotal);
  const freeDeliveryPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const amountToFree = Math.max(0, freeThreshold - subtotal);

  // Promo discount calculation
  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo === 'DISTRICT10') return Math.round(subtotal * 0.10);
    if (appliedPromo === 'SOLE20') return subtotal >= 10000 ? 2000 : 0;
    return 0;
  }, [appliedPromo, subtotal]);

  const finalTotal = Math.max(0, subtotal - promoDiscount) + delivery;

  useEffect(() => {
    saveCheckoutDraft({ deliveryAddress, promoInput, appliedPromo, useNewAddress,
      selectedAddressId: savedAddresses[selectedAddressIndex]?.id || draft.selectedAddressId });
  }, [deliveryAddress, promoInput, appliedPromo, useNewAddress, savedAddresses, selectedAddressIndex, draft]);

  useEffect(() => { getCsrf().catch(() => {}); }, []);

  // Load saved addresses if authenticated
  useEffect(() => {
    let alive = true;
    api('auth/me/')
      .then((me) => {
        if (!alive || !me.authenticated) return;
        return api('auth/addresses/').then((data) => {
          if (!alive || !data.addresses?.length) return;
          setSavedAddresses(data.addresses);
          const restoredIdx = data.addresses.findIndex((a) => a.id === draft.selectedAddressId);
          const defaultIdx = restoredIdx >= 0 ? restoredIdx : data.addresses.findIndex((a) => a.is_default);
          setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const orderId = params.get('cancelled');
    if (!orderId || cancellationSent.current) return;
    cancellationSent.current = true;
    api('checkout/cancel/', { method: 'POST', body: JSON.stringify({ order_id: orderId }) })
      .then(() => { clearCheckoutAttempt(); setCancelled(true); })
      .catch((reason) => setError(reason.message));
  }, [params]);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'DISTRICT10') {
      setAppliedPromo('DISTRICT10');
      setPromoInput('');
    } else if (code === 'SOLE20') {
      if (subtotal < 10000) {
        setPromoError('SOLE20 requires a bag minimum of S$100.');
        return;
      }
      setAppliedPromo('SOLE20');
      setPromoInput('');
    } else {
      setPromoError('Promo code not recognized. Try DISTRICT10 or SOLE20.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo('');
    setPromoError('');
  };

  const pay = async () => {
    if (paying.current || !lines.length) return;
    setError('');

    const isSaved = savedAddresses.length > 0 && !useNewAddress;
    const activeAddress = isSaved ? savedAddresses[selectedAddressIndex] : deliveryAddress;

    if (appliedPromo === 'SOLE20' && subtotal < 10000) {
      setError('SOLE20 requires a bag minimum of S$100. Add another piece or remove the code.');
      return;
    }
    paying.current = true;
    setBusy(true);
    try {
      // Fail fast on missing fields; a postal lookup should never delay this feedback.
      const basic = validateSingaporeAddress(activeAddress, {
        requireContact: true,
        requirePhone: !isSaved || Boolean(activeAddress.phone),
        propertyType: activeAddress.property_type || (activeAddress.line2 ? 'highrise' : 'landed'),
      });
      if (!basic.valid) throw new Error(Object.values(basic.errors)[0]);
      const lookup = await lookupSingaporeAddress(activeAddress.postal_code, { signal: AbortSignal.timeout(4000) })
        .catch((reason) => {
          if (['AbortError', 'TimeoutError'].includes(reason.name)) return { status: 'offline', results: [] };
          throw reason;
        });
      const check = validateSingaporeAddress(activeAddress, {
        requireContact: true,
        requirePhone: !isSaved || Boolean(activeAddress.phone),
        propertyType: activeAddress.property_type || (activeAddress.line2 ? 'highrise' : 'landed'),
        postalLookupStatus: lookup.status,
        verifiedMatches: lookup.results,
      });

      if (!check.valid) {
        throw new Error(Object.values(check.errors)[0] || 'Please provide a valid Singapore delivery address.');
      }

      const attemptKey = getCheckoutKey(checkoutFingerprint(lines, appliedPromo, activeAddress, finalTotal));
      const data = await api('checkout/', {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
        headers: { 'Idempotency-Key': attemptKey },
        body: JSON.stringify({
          items: lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
          shipping_address: activeAddress,
          promo_code: appliedPromo || undefined,
        }),
      });
      if (data.total_cents !== finalTotal) throw new Error('Your bag total changed. Refresh to review the latest prices before paying. Your bag and promo code are saved.');
      const target = new URL(data.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw new Error('The payment link could not be verified.');
      try { sessionStorage.setItem('sd-last-order-reference', data.reference); } catch { /* Payment still works without storage. */ }
      window.location.assign(target.href);
    } catch (reason) {
      setError(['AbortError', 'TimeoutError'].includes(reason.name)
        ? 'Checkout is taking longer than expected. Your bag, address and promo are saved. Try again to resume the same checkout.'
        : reason.message);
      paying.current = false;
      setBusy(false);
    }
  };

  if (!lines.length) return <div className="section empty checkout-empty"><h1>Your bag is empty.</h1><p>Choose a piece before reviewing checkout.</p><Button to="/shop">Explore the collection</Button></div>;
  return (
    <div className="section checkout-page">
      <Link className="back-link" to="/shop"><ArrowLeft size={18} />Continue shopping</Link>
      <div className="page-heading">
        <div><span className="eyebrow">YOUR NEXT ROTATION</span><h1>Checkout</h1></div>
        <span className="secure-label"><LockSimple size={18} />Secure payment</span>
      </div>
      {cancelled && <div className="notice notice-soft"><Check size={18} />Checkout was cancelled. Your bag is still here.</div>}
      
      <div className="checkout-layout">
        <section className="checkout-items">
          {/* STEP 1: Singapore Delivery Address & OneMap Validator */}
          <div className="checkout-step-card">
            <div className="step-card-header sg-checkout-header">
              <div className="step-header-left">
                <div className="step-badge"><MapPin size={20} weight="bold" /></div>
                <div>
                  <span className="eyebrow">DESTINATION</span>
                  <h2>Singapore Delivery Address</h2>
                </div>
              </div>
              {!(savedAddresses.length > 0 && !useNewAddress) && addressValidState.valid && (
                <span className="sg-header-ready-pill">
                  <CheckCircle size={14} weight="fill" /> Dispatch Ready
                </span>
              )}
            </div>

            {savedAddresses.length > 0 && !useNewAddress ? (
              <div className="saved-addresses-selector">
                <p className="step-subhead">Choose a saved delivery address for Singapore courier dispatch:</p>
                <div className="address-chip-grid">
                  {savedAddresses.map((addr, idx) => {
                    const sec = getPostalSectorInfo(addr.postal_code);
                    return (
                      <button
                        type="button"
                        key={addr.id || idx}
                        className={`address-chip ${selectedAddressIndex === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressIndex(idx)}
                      >
                        <div className="chip-top">
                          <strong>{addr.label || 'Home'}</strong>
                          <div className="sg-saved-badges">
                            {sec.district && <span className="sg-district-mini">{sec.district}</span>}
                            {selectedAddressIndex === idx && <CheckCircle size={16} weight="fill" />}
                          </div>
                        </div>
                        <span className="chip-name">{addr.recipient}{addr.phone ? ` · ${addr.phone}` : ''}</span>
                        <span className="chip-line">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</span>
                        <span className="chip-postal">
                          Singapore {addr.postal_code}
                          {sec.area ? ` · ${sec.area}` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="text-button new-address-toggle" onClick={() => setUseNewAddress(true)}>
                  + Deliver to a different address
                </button>
              </div>
            ) : (
              <div className="new-address-form">
                {savedAddresses.length > 0 && (
                  <button type="button" className="text-button back-to-saved" onClick={() => setUseNewAddress(false)}>
                    ← Use saved address
                  </button>
                )}
                <AddressAutocomplete
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  onValidityChange={setAddressValidState}
                  disabled={busy}
                  showContact={true}
                  requirePhone={true}
                />
              </div>
            )}

            <div className="courier-badge">
              <Truck size={22} weight="duotone" />
              <div>
                <strong>Tracked Singapore Courier (2–4 Business Days)</strong>
                <p>Dispatched with district verification tag. Doorstep delivery with SMS tracking notifications.</p>
              </div>
            </div>
          </div>

          {/* STEP 2: Review Bag */}
          <div className="checkout-step-card">
            <div className="step-card-header">
              <div className="step-badge"><Package size={20} weight="bold" /></div>
              <div>
                <span className="eyebrow">YOUR PIECES</span>
                <h2>Review your bag ({lines.length})</h2>
              </div>
            </div>
            {lines.map((line) => <LineItem key={line.variantId} line={line} />)}
          </div>

          {/* Payment info */}
          <div className="payment-options">
            <span className="eyebrow">PAY SECURELY WITH STRIPE</span>
            <h2>Choose at checkout</h2>
            <p>Choose your payment method on the secure payment page.</p>
            <div className="payment-brand-grid" aria-label="Payment methods available through Stripe">
              <div className="payment-brand"><div className="payment-brand-art card-brands"><img src="/assets/payment-brands/visa.png" alt="Visa" /><img src="/assets/payment-brands/mastercard.svg" alt="Mastercard" /></div><span>Debit & credit cards</span></div>
              <div className="payment-brand"><div className="payment-brand-art paynow-art"><img src="/assets/payment-brands/paynow.jpg" alt="PayNow" /></div><span>Scan to pay with QR</span></div>
              <div className="payment-brand"><div className="payment-brand-art"><img src="/assets/payment-brands/apple-pay.svg" alt="Apple Pay" /></div><span>Express wallet</span></div>
              <div className="payment-brand"><div className="payment-brand-art"><img src="/assets/payment-brands/google-pay.svg" alt="Google Pay" /></div><span>Express wallet</span></div>
            </div>
            <small>Available methods depend on your device and payment eligibility. Select PayNow on the payment page to generate your order’s QR code.</small>
          </div>
        </section>

        <aside className="order-summary">
          <h2>Order summary</h2>

          {/* Dynamic Free Shipping Meter */}
          <div className="shipping-meter">
            <div className="shipping-meter-header">
              {subtotal >= freeThreshold ? (
                <span className="shipping-meter-unlocked">
                  <CheckCircle size={16} weight="fill" /> Complimentary Singapore Delivery unlocked!
                </span>
              ) : (
                <span>Add <strong>{money(amountToFree)}</strong> more for <strong>Complimentary Delivery</strong></span>
              )}
              <span className="shipping-meter-pct">{freeDeliveryPercent}%</span>
            </div>
            <div className="shipping-meter-track">
              <div className="shipping-meter-fill" style={{ width: `${freeDeliveryPercent}%` }} />
            </div>
          </div>

          <div className="summary-line"><span>Subtotal</span><span>{money(subtotal)}</span></div>

          {/* Promo code line if applied */}
          {appliedPromo && promoDiscount > 0 && (
            <div className="discount-line summary-line">
              <span>Promo ({appliedPromo}) <button type="button" className="remove-promo-btn" onClick={handleRemovePromo} title="Remove promo"><X size={12} /></button></span>
              <span className="discount-amount">−{money(promoDiscount)}</span>
            </div>
          )}

          <div className="summary-line"><span>Singapore delivery</span><span>{delivery ? money(delivery) : 'Complimentary'}</span></div>
          <div className="total summary-line"><strong>Total</strong><strong>{money(finalTotal)}</strong></div>

          {/* Promo Code Box */}
          <fieldset className="promo-box" disabled={busy}>
            {!appliedPromo ? (
              <form onSubmit={handleApplyPromo} className="promo-form">
                <div className="promo-input-group">
                  <Tag size={16} className="promo-icon" />
                  <input
                    type="text"
                    placeholder="Promo code (e.g. DISTRICT10)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    autoCapitalize="characters"
                  />
                  <button type="submit" className="button button-dark promo-apply-btn" disabled={!promoInput.trim()}>
                    Apply
                  </button>
                </div>
                {promoError && <p className="promo-error" role="alert">{promoError}</p>}
                <div className="promo-suggestions">
                  <button type="button" onClick={() => setPromoInput('DISTRICT10')}>Try <strong>DISTRICT10</strong> (10% off)</button>
                  <button type="button" onClick={() => setPromoInput('SOLE20')}>Try <strong>SOLE20</strong> (S$20 off S$100+)</button>
                </div>
              </form>
            ) : (
              <div className="promo-active-badge">
                <Tag size={16} weight="fill" />
                <span>Promo code <strong>{appliedPromo}</strong> applied</span>
                <button type="button" onClick={handleRemovePromo} className="text-button remove-btn">Remove</button>
              </div>
            )}
          </fieldset>

          <p className="summary-footnote">All amounts in SGD. Your discount is included in the secure payment total.</p>
          {!store.checkout_ready && <div className="checkout-notice">Preview only. Payments are disabled until Stripe is configured and the catalogue is verified.</div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button disabled={busy || !store.checkout_ready || lines.some((line) => line.product.sellable === false)} onClick={pay}>
            {busy ? 'Opening secure checkout…' : 'Continue to secure payment'} <ArrowRight size={20} />
          </Button>
          <span className="payment-note"><LockSimple size={15} />Payment details stay on Stripe.</span>
          <Link className="underlined" to="/help/returns">Delivery & returns</Link>
        </aside>
      </div>
    </div>
  );
}

export function Complete() {
  const [params] = useSearchParams();
  const { setCart } = useShop();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const sessionId = params.get('session_id');
  const cleared = useRef(false);
  useEffect(() => {
    let alive = true;
    let timer;
    async function load() {
      try {
        const data = await api('orders/by-session/?session_id=' + encodeURIComponent(sessionId || ''));
        if (!alive) return;
        setOrder(data);
        if (data.payment_status === 'paid' && !cleared.current) {
          cleared.current = true;
          const purchased = new Map(data.items.map((item) => [item.variant_id, item.quantity]));
          setCart((items) => items.map((item) => ({ ...item, quantity: item.quantity - (purchased.get(item.variantId) || 0) })).filter((item) => item.quantity > 0));
          clearCheckoutDraft();
        } else if (['pending', 'payment_pending'].includes(data.status)) {
          timer = window.setTimeout(load, 4000);
        }
      } catch (reason) {
        if (alive) setError(reason.message);
      }
    }
    if (sessionId) load();
    else setError('No Stripe checkout reference was provided.');
    return () => { alive = false; window.clearTimeout(timer); };
  }, [sessionId, setCart]);

  const paid = order?.payment_status === 'paid';
  const pending = order && ['pending', 'payment_pending'].includes(order.status);
  const shippingAddr = order?.shipping_address || {};

  return (
    <div className="section complete-page">
      <span className="eyebrow">SOLE DISTRICT</span>
      <h1>{paid ? 'Your order is confirmed.' : order?.status === 'expired' || order?.status === 'payment_failed' ? 'Payment was not completed.' : error ? 'Order unavailable.' : 'Checking your payment.'}</h1>
      <p>{paid ? 'Thank you. Your order has been placed and is being prepared for Singapore courier dispatch.' : pending ? 'Stripe is confirming your payment. This page will update when the verified payment event arrives.' : 'The store checks payment status with its server. A redirect by itself does not confirm a purchase.'}</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      
      {/* 4-Stage Post-Purchase Order Timeline */}
      {paid && (
        <div className="order-stepper-container">
          <h2>Order fulfillment status</h2>
          <div className="order-stepper">
            <div className="step-node completed">
              <div className="node-icon"><CheckCircle size={22} weight="fill" /></div>
              <div className="node-info">
                <strong>Order Confirmed</strong>
                <span>Payment verified via Stripe</span>
              </div>
            </div>
            <div className="step-node active">
              <div className="node-icon"><ShieldCheck size={22} weight="duotone" /></div>
              <div className="node-info">
                <strong>Authentication Check</strong>
                <span>District tag & condition inspection</span>
              </div>
            </div>
            <div className="step-node">
              <div className="node-icon"><Package size={22} /></div>
              <div className="node-info">
                <strong>Custom Packaging</strong>
                <span>Double-boxed & sealed</span>
              </div>
            </div>
            <div className="step-node">
              <div className="node-icon"><Truck size={22} /></div>
              <div className="node-info">
                <strong>Courier Dispatch</strong>
                <span>Estimated 2–4 business days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Delivery Destination Card */}
      {order && (shippingAddr.line1 || shippingAddr.postal_code) && (
        <div className="confirmed-destination-card">
          <div className="destination-header">
            <MapPin size={20} weight="fill" />
            <strong>Delivery Destination</strong>
          </div>
          <div className="destination-body">
            <p className="destination-name">{shippingAddr.name || shippingAddr.recipient || 'Customer'}</p>
            <p className="destination-line">{shippingAddr.line1}{shippingAddr.line2 ? `, ${shippingAddr.line2}` : ''}</p>
            <p className="destination-postal">Singapore {shippingAddr.postal_code}</p>
            {shippingAddr.phone && <p className="destination-contact">Phone: {shippingAddr.phone}</p>}
          </div>
          <div className="destination-footer">
            <Truck size={18} />
            <span>Express Courier Tracked Delivery · Estimated 2–4 Business Days</span>
          </div>
        </div>
      )}

      {order && (
        <div className="receipt">
          <div>
            <strong>Order {order.reference}</strong>
            <span className="status-pill">{order.status.replace('_', ' ')}</span>
          </div>
          <strong>{money(order.total)}</strong>
          {order.promo_code && (
            <div className="receipt-promo">
              <span>Promo code applied</span>
              <span>{order.promo_code}</span>
            </div>
          )}
          {order.items.map((item) => (
            <div key={item.line_id}>
              <span>{item.name} · {item.size} × {item.quantity}</span>
              <span>{money(item.unit_price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="complete-actions">
        <Button to="/orders">View your orders <ArrowRight size={19} /></Button>
        <Link className="underlined" to="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}

function ReturnForm({ order, item, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('Wrong size');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('orders/' + order.id + '/returns/', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.line_id, quantity: 1, reason, details }),
      });
      setOpen(false);
      onSubmitted();
    } catch (reasonError) {
      setError(reasonError.message);
    } finally {
      setBusy(false);
    }
  };
  if (!open) return <button className="underlined" onClick={() => setOpen(true)}>Request a return</button>;
  return (
    <form className="return-form" onSubmit={submit}>
      <label>Reason<select value={reason} onChange={(event) => setReason(event.target.value)}><option>Wrong size</option><option>Changed my mind</option><option>Item issue</option><option>Other</option></select></label>
      <label>Details (optional)<textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1500} rows={3} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div><button className="button button-dark" disabled={busy}>{busy ? 'Sending…' : 'Submit request'}</button><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => api('orders/').then((data) => setOrders(data.orders)).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  return (
    <div className="section orders-page">
      <span className="eyebrow">YOUR DISTRICT</span><h1>Your orders</h1>
      <p>Signed-in orders stay with your account. Use an email link to access a guest order on another device.</p><GuestAccess onAccess={load} />
      {loading ? <p role="status">Loading your orders…</p> : error ? <p className="form-error" role="alert">{error}</p> : orders.length ? (
        <div className="order-list">{orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-heading"><span><strong>{order.reference}</strong><small>{new Date(order.created).toLocaleDateString('en-SG')}</small></span><span className="status-pill">{order.status.replace('_', ' ')}</span><strong>{money(order.total)}</strong></div>
            {order.items.map((item) => <div className="order-line" key={item.line_id}><span>{item.name} · {item.size} × {item.quantity}</span><span>{money(item.unit_price * item.quantity)}</span>{order.payment_status === 'paid' && <ReturnForm order={order} item={item} onSubmitted={load} />}</div>)}
            {order.timeline?.length > 0 && <ol className="order-timeline">{order.timeline.map((update, index) => <li key={index}>{update.message} <small>{new Date(update.created).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}</small></li>)}</ol>}{order.returns?.map((row) => <p key={row.id} className="muted">Return #{row.id}: {row.status} · {row.quantity} unit(s)</p>)}{order.tracking_number && <p className="muted">Tracking: {order.carrier} · {order.tracking_number}</p>}
          </article>
        ))}</div>
      ) : (
        <div className="empty"><Package size={34} /><h2>A fresh start.</h2><p>Your orders appear here after a confirmed payment.</p><Button to="/shop">Find your next favourite</Button></div>
      )}
    </div>
  );
}

export { Account } from './Account';

export function Wishlist() {
  const { products, wishlist } = useShop();
  const saved = products.filter((product) => wishlist.includes(product.id));
  return <div className="section"><div className="page-heading"><div><span className="eyebrow">ON YOUR RADAR</span><h1>Your wishlist</h1></div><span>{saved.length} saved</span></div>{saved.length ? <ProductGrid products={saved} /> : <div className="empty"><Heart size={34} /><h2>Keep your favourites close.</h2><p>Tap the heart on any piece to save it here.</p><Button to="/shop">Explore the collection</Button></div>}</div>;
}

export function Brands() {
  const { products } = useShop();
  const brands = useMemo(() => getDerivedBrands(products), [products]);
  return (
    <div className="section brands-page">
      <span className="eyebrow">LABELS IN THE DISTRICT</span>
      <h1>The Brands ({brands.length})</h1>
      <p>Heritage footwear icons, global streetwear houses, and contemporary essentials — ranked by collection depth.</p>
      <div className="brands-directory-grid">
        {brands.map((brand, index) => (
          <Link key={brand.name} to={'/shop?brand=' + encodeURIComponent(brand.name)} className="brand-directory-card">
            <span className="muted">{String(index + 1).padStart(2, '0')}</span>
            <div className="brand-directory-info">
              <h2>{brand.name}</h2>
              <span className="brand-directory-meta">
                {brand.categories.join(' · ')} · {brand.count} {brand.count === 1 ? 'piece' : 'pieces'}
              </span>
            </div>
            <ArrowUpRight size={26} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Journal() {
  const { products } = useShop();
  return <div className="section journal-page"><span className="eyebrow">THE DISTRICT JOURNAL</span><h1>Wear it your way.</h1><img src="/assets/hero.webp" alt="Neutral streetwear editorial" /><div className="journal-copy"><h2>Build a rotation, not a collection.</h2><p>Start with pieces you reach for every day: a familiar pair of sneakers, a heavyweight hoodie, and a graphic tee that feels like you. A thoughtful wardrobe is built around what you actually wear.</p><p>Neutral colours make mixing easier. Let texture do the work: soft fleece, worn-in suede and structured cotton. Choose fewer pieces, then find more ways to wear them.</p><Button to="/shop">Find your everyday pieces <ArrowRight size={19} /></Button><span className="muted">{products.length} preview pieces in the collection</span></div></div>;
}

export function Help() {
  const { pathname } = useLocation();
  const kind = pathname.split('/').pop();
  const content = {
    delivery: ['Delivery', 'Singapore delivery is estimated at S$8, complimentary from S$150. Final delivery methods and dates will be shown before payment.'],
    returns: ['Returns & exchanges', 'Return requests are reviewed by the store team. Requesting a return does not approve a refund. The final return window and policy must be published before live sales.'],
    privacy: ['Privacy', 'Your bag and wishlist are saved in this browser. Optional storefront analytics remain off unless you allow them. Confirmed purchases come from the payment webhook, not browser events. Stripe handles payment details.'],
    store: ['Store information', 'SOLE DISTRICT is a prototype retailer project. Catalogue prices, images and stock are illustrative. Products cannot be purchased until sourcing, authentic product records, stock, policies and Stripe settings are verified. This site does not claim brand authorisation.'],
    terms: ['Store information', 'SOLE DISTRICT is a prototype retailer project. Catalogue prices, images and stock are illustrative. Products cannot be purchased until sourcing, authentic product records, stock, policies and Stripe settings are verified.'],
  };
  const [title, copy] = content[kind] || content.store;
  return <div className="section policy-page"><span className="eyebrow">GOOD TO KNOW</span><PublishedPolicy kind={kind} fallbackTitle={title} fallbackCopy={copy} /><Button to="/shop">Back to the collection <ArrowRight size={19} /></Button></div>;
}

export function NotFound() {
  return <div className="section empty"><h1>This piece is out of sight.</h1><p>Let’s get you back to the collection.</p><Button to="/shop">Explore the collection</Button></div>;
}
