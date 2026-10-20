import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CaretDown, Check, CheckCircle, Heart, LockSimple,
  MapPin, Package, Plus, ShieldCheck, SlidersHorizontal, Sparkle, Tag, Truck, X,
} from '@phosphor-icons/react';
import { Button, Dialog, LineItem, ProductGrid, useShop } from './App';
import { GuestAccess } from './Account';
import { PublishedPolicy } from './StoreInformation';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import { api, money, shipping, sortVariantsBySize, trackEvent } from './shop';

export function Home() {
  const { products } = useShop();
  const clothing = products.find((product) => product.category === 'Clothing') || products[0];

  const brandCounts = useMemo(() => {
    const counts = {};
    for (const p of products) {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    }
    return counts;
  }, [products]);

  const trendingSneakers = products.filter((p) => p.featured || p.badge === 'Grail' || p.badge === 'Trending').slice(0, 8);
  const yeezySneakers = products.filter((p) => p.brand === 'adidas Yeezy').slice(0, 4);
  const jordanSneakers = products.filter((p) => p.brand === 'Jordan').slice(0, 4);

  return (
    <>
      <section className="hero">
        <img className="hero-photo" src="/assets/hero.webp" alt="Streetwear and authentic sneakers curation" fetchPriority="high" width="1586" height="992" />
        <div className="hero-copy">
          <span className="eyebrow">100% AUTHENTIC SNEAKERS & STREETWEAR</span>
          <h1>THE NEXT<br />STREET STANDARD.</h1>
          <p>Verified authentic Jordan, Nike, and Yeezy. Hand-inspected by sneaker specialists, dispatched directly from Singapore.</p>
          <div className="hero-cta-group">
            <Button to="/shop">Explore collection <ArrowRight size={21} /></Button>
            <Link to="/shop?brand=adidas+Yeezy" className="button button-outline-hero">Shop Yeezy</Link>
          </div>
        </div>
      </section>

      {/* Brand Quick-Access Rail */}
      <section className="brand-rail-section">
        <div className="brand-pills-bar">
          <Link to="/shop" className="brand-pill-btn active">
            <span>All Pieces</span>
            <span className="pill-count">{products.length}</span>
          </Link>
          {['Jordan', 'Nike', 'adidas Yeezy', 'New Balance', 'adidas Originals'].map((brandName) => (
            <Link key={brandName} to={'/shop?brand=' + encodeURIComponent(brandName)} className="brand-pill-btn">
              <span>{brandName}</span>
              {brandCounts[brandName] ? <span className="pill-count">{brandCounts[brandName]}</span> : null}
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Heat Grid */}
      <section className="section fresh">
        <div className="section-heading">
          <div>
            <span className="eyebrow">IN THE DISTRICT</span>
            <h2>Trending Heat</h2>
          </div>
          <Link to="/shop">View all {products.length} pieces <ArrowRight size={19} /></Link>
        </div>
        <ProductGrid products={trendingSneakers.length ? trendingSneakers : products.slice(0, 8)} />
      </section>

      {/* The Yeezy Vault Feature Banner */}
      <section className="vault-banner">
        <div className="vault-content">
          <span className="eyebrow vault-eyebrow">EXCLUSIVE ARCHIVE</span>
          <h2>THE YEEZY VAULT.</h2>
          <p>Explore the defining silhouettes that transformed footwear culture: the Boost 350 V2, the sculpted 700 Wave Runner, and ultra-comfortable Slides & Foam Runners.</p>
          <Button to="/shop?brand=adidas+Yeezy">Shop The Vault <ArrowRight size={20} /></Button>
        </div>
        <div className="vault-preview-grid">
          <ProductGrid products={yeezySneakers} />
        </div>
      </section>

      {/* Air Jordan Retro Collection */}
      <section className="section jordan-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HERITAGE GRAILS</span>
            <h2>Air Jordan Collection</h2>
          </div>
          <Link to="/shop?brand=Jordan">Shop all Jordan <ArrowRight size={19} /></Link>
        </div>
        <ProductGrid products={jordanSneakers} />
      </section>

      {/* Authenticity Trust Standard */}
      <section className="auth-trust-banner">
        <div className="auth-trust-header">
          <div>
            <span className="eyebrow">VERIFICATION PROMISE</span>
            <h2>THE 4-POINT AUTHENTICITY STANDARD.</h2>
          </div>
          <p>Every pair that passes through Sole District undergoes rigorous physical evaluation before reaching your doorstep.</p>
        </div>
        <div className="auth-trust-grid">
          <div className="auth-trust-card">
            <span className="card-step">01 / PHYSICAL AUDIT</span>
            <h3>Stitching & Geometry</h3>
            <p>Every seam, collar height, stitch spacing, and heel curve is measured against verified production baselines.</p>
          </div>
          <div className="auth-trust-card">
            <span className="card-step">02 / OPTICAL & UV</span>
            <h3>Materials & Blacklight</h3>
            <p>Full UV blacklight examination to verify fabric glow, invisible production stamps, and dye consistency.</p>
          </div>
          <div className="auth-trust-card">
            <span className="card-step">03 / DEADSTOCK AUDIT</span>
            <h3>Box, Laces & Tags</h3>
            <p>Original retail box labels, typography, barcode checks, tissue paper graphics, and factory spare laces.</p>
          </div>
          <div className="auth-trust-card">
            <span className="card-step">04 / DISPATCH SEAL</span>
            <h3>Tamper-Evident Seal</h3>
            <p>Dispatched with an individually numbered Sole District security tag and backed by our 100% guarantee.</p>
          </div>
        </div>
      </section>

      {/* The Everyday Edit */}
      <section className="edit">
        <div>
          <span className="eyebrow">THE EVERYDAY EDIT</span>
          <h2>Good pieces.<br />Great rotation.</h2>
          <p>Considered layers and familiar classics. Discover the pieces that work harder in your wardrobe.</p>
          <Button to="/shop?category=Clothing">Explore clothing <ArrowRight size={20} /></Button>
        </div>
        {clothing && <Link to={'/product/' + clothing.id}><img src={clothing.image} alt={clothing.brand + ' ' + clothing.name} loading="lazy" /></Link>}
      </section>

      <section className="trust-strip">
        <div><span>01</span><strong>Guaranteed Authentic</strong><p>Multi-point physical verification on every single sneaker.</p></div>
        <div><span>02</span><strong>Singapore Dispatch</strong><p>Local stock with same-day dispatch and tracking.</p></div>
        <div><span>03</span><strong>Complimentary Delivery</strong><p>Complimentary tracked delivery on all orders over S$150.</p></div>
      </section>
    </>
  );
}

export function ShopPage() {
  const { products } = useShop();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const silhouette = params.get('silhouette') || '';
  const size = params.get('size') || '';
  const sort = params.get('sort') || 'new';
  const stockOnly = params.get('stock') === 'true';
  const colour = params.get('colour') || '';
  const maxPrice = Number(params.get('maxPrice')) || 0;
  const requestedPage = Math.max(1, Number(params.get('page')) || 1);

  const change = (key, value) => {
    const next = new URLSearchParams(params);
    if (key !== 'page') next.delete('page');
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

  const rawSizes = [...new Set(products.filter((product) => !category || product.category === category).flatMap((product) => product.sizes || []))];
  const sortedFilterSizes = sortVariantsBySize(rawSizes.map((s) => ({ size: s }))).map((v) => v.size);

  const allSilhouettes = useMemo(() => {
    return [...new Set(products.filter((p) => p.silhouette).map((p) => p.silhouette))];
  }, [products]);

  const activeBrands = useMemo(() => {
    return ['Jordan', 'Nike', 'adidas Yeezy', 'New Balance', 'adidas Originals', 'Carhartt WIP'];
  }, []);

  let found = products.filter((product) => (
    (!category || product.category === category) &&
    (!brand || product.brand === brand) &&
    (!silhouette || product.silhouette === silhouette) &&
    (!query || (product.brand + ' ' + product.name + ' ' + product.color + ' ' + (product.silhouette || '')).toLowerCase().includes(query.toLowerCase())) &&
    (!size || product.variants.some((variant) => variant.size === size && variant.available > 0)) &&
    (!stockOnly || product.variants.some((variant) => variant.available > 0)) &&
    (!colour || product.color === colour) && (!maxPrice || product.price <= maxPrice * 100)
  ));

  if (sort === 'low') found = [...found].sort((a, b) => a.price - b.price);
  if (sort === 'high') found = [...found].sort((a, b) => b.price - a.price);

  const pages = Math.max(1, Math.ceil(found.length / 12));
  const page = Math.min(requestedPage, pages);
  const visibleProducts = found.slice((page - 1) * 12, page * 12);
  const hasActiveFilters = Boolean(brand || silhouette || size || colour || maxPrice || stockOnly || query);

  return (
    <div className="section shop-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>{silhouette || brand || category || 'Sneakers'}</span>
      </div>

      <div className="page-heading">
        <div>
          <span className="eyebrow">AUTHENTIC ROTATION</span>
          <h1>{query ? `Results for “${query}”` : silhouette ? `${silhouette}` : brand || category || 'All Sneakers & Apparel'}</h1>
          <p>Hand-verified authentic grails, modern classics, and daily essentials.</p>
        </div>
        <span>{found.length} {found.length === 1 ? 'piece' : 'pieces'}</span>
      </div>

      {/* Brand Quick Switcher */}
      <div className="brand-pills-bar shop-brand-bar">
        <button
          className={'brand-pill-btn ' + (!brand ? 'active' : '')}
          onClick={() => change('brand', '')}
        >
          All Brands ({products.length})
        </button>
        {activeBrands.map((bName) => {
          const count = products.filter((p) => p.brand === bName).length;
          return (
            <button
              key={bName}
              className={'brand-pill-btn ' + (brand === bName ? 'active' : '')}
              onClick={() => change('brand', brand === bName ? '' : bName)}
            >
              <span>{bName}</span>
              <span className="pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Silhouette Filter Chips */}
      {(!category || category === 'Sneakers') && (
        <div className="silhouette-filter-bar" aria-label="Filter by silhouette">
          <button
            className={'silhouette-chip ' + (!silhouette ? 'active' : '')}
            onClick={() => change('silhouette', '')}
          >
            All Silhouettes
          </button>
          {allSilhouettes.map((sil) => (
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
              Size: UK {size} <X size={14} />
            </button>
          )}
          {colour && (
            <button className="filter-chip-remove" onClick={() => clearFilter('colour')}>
              {colour} <X size={14} />
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
        <button className="text-button filter-button" onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={19} />
          Filters {(brand || silhouette || size || stockOnly) && <span className="filter-dot" />}
        </button>
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
        <label className="sort-label">
          Sort by
          <select value={sort} onChange={(event) => change('sort', event.target.value)}>
            <option value="new">Featured & Grails</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </label>
      </div>

      <div className={'shop-layout ' + (filtersOpen ? 'has-filters' : '')}>
        {filtersOpen && (
          <aside className="filters">
            <label>Brand
              <select value={brand} onChange={(event) => change('brand', event.target.value)}>
                <option value="">All brands</option>
                {[...new Set(products.map((product) => product.brand))].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Silhouette
              <select value={silhouette} onChange={(event) => change('silhouette', event.target.value)}>
                <option value="">All models</option>
                {allSilhouettes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Size
              <select value={size} onChange={(event) => change('size', event.target.value)}>
                <option value="">All sizes</option>
                {sortedFilterSizes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Colour
              <select value={colour} onChange={(event) => change('colour', event.target.value)}>
                <option value="">All colours</option>
                {[...new Set(products.map((product) => product.color))].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>Maximum price (SGD)
              <input type="number" min="0" step="1" value={maxPrice || ''} onChange={(event) => change('maxPrice', event.target.value)} />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={stockOnly} onChange={(event) => change('stock', event.target.checked ? 'true' : '')} />
              Available sizes only
            </label>
            <button className="text-button" onClick={() => setParams(category ? { category } : {})}>Clear filters</button>
          </aside>
        )}
        <div className="shop-results">
          {found.length ? <ProductGrid products={visibleProducts} /> : (
            <div className="empty">
              <h2>No sneakers found.</h2>
              <p>Try searching another silhouette, or reset your filters.</p>
              <Button onClick={() => setParams({})}>Explore all sneakers</Button>
            </div>
          )}
        </div>
      </div>
      {pages > 1 && (
        <nav className="catalogue-pagination" aria-label="Catalogue pages">
          <button className="text-button" disabled={page === 1} onClick={() => change('page', String(page - 1))}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="text-button" disabled={page === pages} onClick={() => change('page', String(page + 1))}>Next</button>
        </nav>
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
  const sizeGridRef = useRef(null);

  useEffect(() => {
    setSelected('');
    setActiveImage(0);
    setSizeError(false);
  }, [pathname]);
  useEffect(() => {
    if (product) trackEvent('product_viewed', { product_id: product.id });
  }, [product?.id]);
  if (!product) return <NotFound />;
  const sortedVariants = sortVariantsBySize(product.variants || []);
  const selectedVariant = sortedVariants.find((variant) => variant.id === selected);
  const images = product.images?.length ? product.images : [{ url: product.image, alt: product.brand + ' ' + product.name }];
  const currentImage = images[activeImage] || images[0];
  const sneaker = product.category === 'Sneakers';
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
      <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={'/shop?category=' + encodeURIComponent(product.category)}>{product.category}</Link><span>/</span><Link to={'/shop?brand=' + encodeURIComponent(product.brand)}>{product.brand}</Link><span>/</span><span>{product.name}</span></div>
      <div className="product-layout">
        <div className="gallery">
          <div className="thumbs">
            {images.map((image, index) => <button key={image.url + index} className={activeImage === index ? 'selected' : ''} onClick={() => setActiveImage(index)} aria-label={'Show product image ' + (index + 1)}><img src={image.url} alt="" /></button>)}
          </div>
          <button className="main-product-photo" onClick={() => setZoom(true)} aria-label="Enlarge product image"><img src={currentImage.url} alt={currentImage.alt} /><span><Plus size={17} />Enlarge</span></button>
        </div>
        <div className="purchase-panel">
          <span className="eyebrow">{product.brand}</span>
          <h1>{product.name}</h1>
          <p className="color-name">{product.color}</p>
          <p className="price">{money(product.price)}</p>
          <p className="description">{product.description}</p>
          {sneaker && (
            <div className="authenticity-box">
              <div className="authenticity-box-header">
                <ShieldCheck size={20} weight="fill" color="#566e00" />
                <strong>100% Authentic Guaranteed</strong>
                <span>Verified Deadstock</span>
              </div>
              <ul>
                <li>✓ Multi-point physical verification by sneaker specialists</li>
                <li>✓ Brand new in original packaging with verified security tag</li>
                <li>✓ Dispatched locally from Singapore with tracked delivery</li>
              </ul>
            </div>
          )}
          <div className="colour-row"><span>Colour</span><span>{product.color.split(' / ')[0]}</span></div>
          <div className="size-heading">
            <strong>Select size</strong>
            {sizeError && <span className="size-prompt-pill" role="alert">Please select a size</span>}
            <button className="underlined" onClick={() => setGuideOpen(true)}>Size guide</button>
          </div>
          <p className="size-system">Sizes shown with each variant’s recorded size system.</p>
          <div ref={sizeGridRef} className={'sizes' + (sizeError ? ' shake-sizes' : '')}>
            {sortedVariants.map((variant) => (
              <button
                key={variant.id}
                className={selected === variant.id ? 'selected' : ''}
                disabled={variant.available < 1}
                aria-pressed={selected === variant.id}
                aria-label={`${variant.size_system} ${variant.size}${variant.available < 1 ? ' — sold out' : ''}`}
                onClick={() => {
                  setSelected(variant.id);
                  setSizeError(false);
                }}
              >
                {variant.size_system} {variant.size}
                {variant.colour && sortedVariants.some((row) => row.size === variant.size && row.id !== variant.id) ? ' · ' + variant.colour : ''}
              </button>
            ))}
          </div>
          <p className={'stock-message ' + (selected ? 'ready' : '') + (sizeError ? ' text-error' : '')}>
            {sizeError
              ? 'Please choose your size above before adding to bag.'
              : product.illustrative && !product.sellable
                ? selectedVariant ? `Preview availability only · ${selectedVariant.size_system} ${selectedVariant.size} selected` : 'Illustrative sizes · preview only'
                : selectedVariant ? `✓ ${selectedVariant.size_system} ${selectedVariant.size} selected · ${selectedVariant.available} available` : 'Choose your size to continue'}
          </p>
          <div className="purchase-actions">
            <Button
              disabled={selectedVariant && selectedVariant.available < 1}
              onClick={addToBag}
              className={!selectedVariant ? 'button-prompt-size' : ''}
            >
              {!selectedVariant ? 'Select size to add' : 'Add to bag'} <ArrowRight size={20} />
            </Button>
            <button className="outline-icon" aria-label="Save to wishlist" aria-pressed={wishlist.includes(product.id)} onClick={() => toggleWish(product.id)}><Heart size={22} weight={wishlist.includes(product.id) ? 'fill' : 'regular'} /></button>
          </div>
          <div className="delivery-perks"><span><Truck size={21} />Tracked delivery</span><span><Package size={21} />Return requests</span></div>
          <details><summary>Details & care <CaretDown size={16} /></summary><p>{product.detail}</p></details>
          <details><summary>Delivery & returns <CaretDown size={16} /></summary><p>Singapore delivery is estimated at S$8, complimentary from S$150. Final terms will appear before payment. <Link to="/help/delivery">Delivery information</Link></p></details>
          <details><summary>Sourcing & verification <CaretDown size={16} /></summary><p>{product.illustrative && !product.sellable ? 'This is an illustrative preview. Supplier evidence and physical product checks have not been recorded, so this item cannot be purchased.' : 'Sourcing information and authentic product checks are verified for this product.'}</p></details>
          <button className="underlined sizing-help" onClick={() => setGuideOpen(true)}>Need help with sizing?</button>
        </div>
      </div>
      <section className="related"><div className="section-heading"><div><span className="eyebrow">MORE FROM THE DISTRICT</span><h2>Keep your rotation fresh</h2></div><Link to="/shop">Explore all <ArrowRight size={19} /></Link></div><ProductGrid products={products.filter((item) => item.id !== product.id).slice(0, 4)} /></section>
      {guideOpen && (
        <Dialog title="Sneaker Sizing & Fit Guide" onClose={() => setGuideOpen(false)}>
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
            <option value="">{selectedVariant ? `${selectedVariant.size_system} ${selectedVariant.size}` : 'Size'}</option>
            {sortedVariants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.available < 1}>
                {v.size_system} {v.size} {v.available < 1 ? '(Sold out)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button sticky-add-btn"
            disabled={selectedVariant && selectedVariant.available < 1}
            onClick={addToBag}
          >
            {!selectedVariant ? 'Select size' : 'Add to bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCheckoutKey(lines) {
  const fingerprint = JSON.stringify(lines.map((line) => [line.variantId, line.quantity]).sort());
  const stored = sessionStorage.getItem('sd-checkout-attempt');
  if (stored) {
    try {
      const value = JSON.parse(stored);
      if (value.fingerprint === fingerprint) return value.key;
    } catch {}
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem('sd-checkout-attempt', JSON.stringify({ fingerprint, key }));
  return key;
}

export function Checkout() {
  const { lines, subtotal, store } = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [params] = useSearchParams();
  const cancellationSent = useRef(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    recipient: '',
    phone: '',
    line1: '',
    line2: '',
    postal_code: '',
  });

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
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

  // Load saved addresses if authenticated
  useEffect(() => {
    let alive = true;
    api('auth/me/')
      .then((me) => {
        if (!alive || !me.authenticated) return;
        return api('auth/addresses/').then((data) => {
          if (!alive || !data.addresses?.length) return;
          setSavedAddresses(data.addresses);
          const defaultIdx = data.addresses.findIndex((a) => a.is_default);
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
      .then(() => setCancelled(true))
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
    if (busy || !lines.length) return;
    setError('');

    const activeAddress = savedAddresses.length > 0 && !useNewAddress
      ? savedAddresses[selectedAddressIndex]
      : deliveryAddress;

    if (!activeAddress.recipient?.trim()) {
      setError('Please provide a recipient name for delivery.');
      return;
    }
    if (!activeAddress.line1?.trim() || !activeAddress.postal_code?.trim()) {
      setError('Please provide a valid Singapore delivery address and 6-digit postal code.');
      return;
    }

    setBusy(true);
    try {
      const attemptKey = getCheckoutKey(lines);
      const data = await api('checkout/', {
        method: 'POST',
        headers: { 'Idempotency-Key': attemptKey },
        body: JSON.stringify({
          items: lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
          shipping_address: activeAddress,
          promo_code: appliedPromo || undefined,
        }),
      });
      const target = new URL(data.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw new Error('The payment link could not be verified.');
      sessionStorage.setItem('sd-last-order-reference', data.reference);
      window.location.assign(target.href);
    } catch (reason) {
      setError(reason.message);
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
          {/* STEP 1: Singapore Delivery Address Auto-Recommendation */}
          <div className="checkout-step-card">
            <div className="step-card-header">
              <div className="step-badge"><MapPin size={20} weight="bold" /></div>
              <div>
                <span className="eyebrow">DESTINATION</span>
                <h2>Singapore Delivery Address</h2>
              </div>
            </div>

            {savedAddresses.length > 0 && !useNewAddress ? (
              <div className="saved-addresses-selector">
                <p className="step-subhead">Choose a saved delivery address for Singapore courier dispatch:</p>
                <div className="address-chip-grid">
                  {savedAddresses.map((addr, idx) => (
                    <button
                      type="button"
                      key={addr.id || idx}
                      className={`address-chip ${selectedAddressIndex === idx ? 'selected' : ''}`}
                      onClick={() => setSelectedAddressIndex(idx)}
                    >
                      <div className="chip-top">
                        <strong>{addr.label || 'Home'}</strong>
                        {selectedAddressIndex === idx && <CheckCircle size={16} weight="fill" />}
                      </div>
                      <span className="chip-name">{addr.recipient}</span>
                      <span className="chip-line">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</span>
                      <span className="chip-postal">Singapore {addr.postal_code}</span>
                    </button>
                  ))}
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
                <p className="step-subhead">Enter your 6-digit postal code or building name for instant auto-recommendation:</p>
                <AddressAutocomplete
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  disabled={busy}
                  showContact={true}
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
            <p>Stripe presents the payment methods available to your account and device, including cards, PayNow QR, and Apple Pay or Google Pay when eligible.</p>
            <div className="payment-method-chips"><span>Cards</span><span>PayNow QR</span><span>Apple Pay*</span><span>Google Pay*</span></div>
            <small>*Wallet buttons depend on device, browser, wallet setup, and Stripe account settings.</small>
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
          <div className="promo-box">
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
          </div>

          <p className="summary-footnote">Amounts shown in SGD. Shipping is calculated using the current store rule. Tax settings are not configured.</p>
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
          sessionStorage.removeItem('sd-checkout-attempt');
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
  const brands = [...new Set(products.map((product) => product.brand))];
  return <div className="section brands-page"><span className="eyebrow">LABELS IN THE DISTRICT</span><h1>The brands</h1><p>Familiar classics. Fresh perspectives.</p><div>{brands.map((brand, index) => <Link key={brand} to={'/shop?brand=' + encodeURIComponent(brand)}><span className="muted">{String(index + 1).padStart(2, '0')}</span><h2>{brand}</h2><ArrowUpRight size={28} /></Link>)}</div></div>;
}

export function Journal() {
  const { products } = useShop();
  return <div className="section journal-page"><span className="eyebrow">THE DISTRICT JOURNAL</span><h1>Wear it your way.</h1><img src="/assets/hero.webp" alt="Neutral streetwear editorial" /><div className="journal-copy"><h2>Build a rotation, not a collection.</h2><p>Start with pieces you reach for every day: a familiar pair of sneakers, an easy layer and a fit that feels like you. A thoughtful wardrobe is built around what you actually wear.</p><p>Neutral colours make mixing easier. Let texture do the work: soft fleece, worn-in suede and structured cotton. Choose fewer pieces, then find more ways to wear them.</p><Button to="/shop">Find your everyday pieces <ArrowRight size={19} /></Button><span className="muted">{products.length} preview pieces in the collection</span></div></div>;
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
