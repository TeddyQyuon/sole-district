import { lazy, Suspense, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CaretDown, Check, Heart, List, MagnifyingGlass, Minus, Plus, Sparkle, Bag as BagIcon, Trash, User, X,
} from '@phosphor-icons/react';
import {
  api, cartLines, initialProducts, money, readStored, saveStored, trackEvent, validCart,
} from './shop';
import {
  ACCESSORY_SUBCATEGORIES, CLOTHING_SUBCATEGORIES, discountPercent, getAvailableSizeCount,
  getDerivedBrands, getDerivedSilhouettes, getDerivedSubcategories, isLowStock, isNewIn, isOnSale, isSoldOut,
} from './catalogHelpers';
import {
  Account, Brands, Checkout, Complete, Help, Home, Journal, Orders, ProductPage,
  ShopPage, Wishlist, NotFound,
} from './Pages';
import { ScrollProgressBar, useScrolledHeader } from './motion';
const AdminApp = lazy(() => import('./Admin').then(module => ({ default: module.AdminApp })));
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

const Shop = createContext(null);
export const useShop = () => useContext(Shop);

export function Button({ children, to, className = '', ...props }) {
  const classes = 'button ' + className;
  return to
    ? <Link className={classes} to={to} {...props}>{children}</Link>
    : <button className={classes} {...props}>{children}</button>;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Provider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState(() => validCart(readStored('sd-cart', [])));
  const [wishlist, setWishlist] = useState(() => {
    const saved = readStored('sd-wishlist', []);
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string') : [];
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [store, setStore] = useState({ checkout_ready: false, preview: true, sample_catalogue: true });

  useEffect(() => {
    let active = true;
    api('catalog/', { signal: AbortSignal.timeout(12000) }).then((data) => {
      if (!active) return;
      if (Array.isArray(data.products) && data.products.length > 0) {
        const backendMap = new Map(data.products.map((p) => [p.id, p]));
        const mergedList = initialProducts.map((p) => {
          const bp = backendMap.get(p.id);
          return bp ? { ...p, ...bp, images: bp.images?.length ? bp.images : p.images } : p;
        });
        for (const bp of data.products) {
          if (!mergedList.some((p) => p.id === bp.id)) {
            mergedList.push(bp);
          }
        }
        setProducts(mergedList);
        const variants = mergedList.flatMap((product) => product.variants || []);
        setCart((items) => {
          const merged = new Map();
          for (const item of items) {
            const matches = variants.filter((variant) => variant.id === item.variantId || variant.legacy_id === item.variantId || (variant.sku && item.variantId === 'sku:' + variant.sku));
            const id = matches.length === 1 ? (matches[0].legacy_id || matches[0].id) : item.variantId;
            const quantity = (merged.get(id)?.quantity || 0) + item.quantity;
            merged.set(id, { variantId: id, quantity: Math.min(10, quantity) });
          }
          return [...merged.values()];
        });
      }
      setStore(data.store);
    }).catch(() => {}).finally(() => {
      if (active) setCatalogLoading(false);
    });
    return () => { active = false; };
  }, []);

  useLayoutEffect(() => { saveStored('sd-cart', cart); }, [cart]);
  useEffect(() => { saveStored('sd-wishlist', wishlist); }, [wishlist]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const add = (product, size) => {
    const variant = product.variants.find((item) => item.id === size) || product.variants.find((item) => item.size === size);
    if (!variant || variant.available < 1) return;
    const cartKey = variant.legacy_id || variant.id;
    const prior = cart.find((item) => item.variantId === cartKey);
    if ((prior?.quantity || 0) >= Math.min(variant.available, 10)) {
      setToast('You’ve reached the available quantity.');
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item.variantId === cartKey);
      return existing
        ? items.map((item) => item.variantId === cartKey
          ? { ...item, quantity: Math.min(item.quantity + 1, variant.available, 10) }
          : item)
        : [...items, { variantId: cartKey, quantity: 1 }];
    });
    trackEvent('cart_added', { product_id: product.id });
    setBagOpen(true);
  };

  const toggleWish = (id) => setWishlist((items) => (
    items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
  ));
  const update = (variantId, quantity) => {
    const variant = products.flatMap((product) => product.variants).find((item) => item.id === variantId || item.legacy_id === variantId);
    setCart((items) => quantity <= 0
      ? items.filter((item) => item.variantId !== variantId)
      : items.map((item) => item.variantId === variantId
        ? { ...item, quantity: Math.min(variant?.available || 1, 10, quantity) }
        : item));
  };
  const lines = cartLines(cart, products);
  const count = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = lines.reduce((total, line) => total + line.quantity * (line.variant.price || line.product.price), 0);

  return (
    <Shop.Provider value={{
      products, setProducts, cart, setCart, wishlist, toggleWish, add, update,
      lines, count, subtotal, catalogLoading, bagOpen, setBagOpen, store, setStore, setToast,
    }}>
      {children}
      {toast && <div role="status" className="toast"><Check size={18} weight="bold" />{toast}</div>}
    </Shop.Provider>
  );
}

const MARQUEE_ITEMS = [
  '100% Authentic Verified Sneakers & Streetwear',
  'Singapore Dispatch · Same-Day Local Processing',
  'Complimentary Tracked Delivery Over S$150',
  'Curated Footwear, Heavyweight Apparel & Accessories',
  'Use Code DISTRICT10 For 10% Off Your Rotation',
];

function Header() {
  const { products, count, wishlist, setBagOpen } = useShop();
  const isScrolled = useScrolledHeader(26);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaSection, setMegaSection] = useState(null);
  const [mobileAccordion, setMobileAccordion] = useState('Sneakers');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [bagBump, setBagBump] = useState(false);
  const [wishBump, setWishBump] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const searchInputRef = useRef(null);
  const closeTimerRef = useRef(null);
  const prevCountRef = useRef(count);
  const prevWishRef = useRef(wishlist.length);

  useEffect(() => {
    if (count > prevCountRef.current) {
      setBagBump(true);
      prevCountRef.current = count;
      const t = window.setTimeout(() => setBagBump(false), 460);
      return () => window.clearTimeout(t);
    }
    prevCountRef.current = count;
    return undefined;
  }, [count]);

  useEffect(() => {
    if (wishlist.length > prevWishRef.current) {
      setWishBump(true);
      prevWishRef.current = wishlist.length;
      const t = window.setTimeout(() => setWishBump(false), 460);
      return () => window.clearTimeout(t);
    }
    prevWishRef.current = wishlist.length;
    return undefined;
  }, [wishlist.length]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMegaSection(null);
    setActiveIndex(-1);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (megaSection) setMegaSection(null);
        if (menuOpen) setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, megaSection, menuOpen]);

  const derivedBrands = useMemo(() => getDerivedBrands(products), [products]);
  const sneakerBrands = useMemo(
    () => getDerivedBrands(products.filter((p) => p.category === 'Sneakers')).slice(0, 8),
    [products]
  );
  const sneakerSilhouettes = useMemo(
    () => getDerivedSilhouettes(products.filter((p) => p.category === 'Sneakers')).slice(0, 8),
    [products]
  );
  const clothingSubcats = useMemo(() => {
    const map = new Map(getDerivedSubcategories(products, 'Clothing').map((s) => [s.name, s.count]));
    return CLOTHING_SUBCATEGORIES.map((name) => ({ name, count: map.get(name) || 0 }));
  }, [products]);
  const accessorySubcats = useMemo(() => {
    const map = new Map(getDerivedSubcategories(products, 'Accessories').map((s) => [s.name, s.count]));
    return ACCESSORY_SUBCATEGORIES.map((name) => ({ name, count: map.get(name) || 0 }));
  }, [products]);

  const newInCount = useMemo(() => products.filter((p) => isNewIn(p)).length, [products]);
  const saleCount = useMemo(() => products.filter((p) => isOnSale(p)).length, [products]);

  const spotlightProduct = useMemo(() => {
    return (
      products.find((p) => isNewIn(p) && p.category === 'Clothing') ||
      products.find((p) => p.featured) ||
      products[0]
    );
  }, [products]);

  // Predictive search calculations
  const trimmedQuery = query.trim().toLowerCase();
  const predictiveResults = useMemo(() => {
    if (!trimmedQuery) {
      return {
        products: products.filter((p) => isNewIn(p) || p.featured).slice(0, 4),
        brands: derivedBrands.slice(0, 6),
        categories: [
          { label: 'Sneakers', to: '/shop?category=Sneakers' },
          { label: 'Hoodies & Sweats', to: '/shop?category=Clothing&subcategory=' + encodeURIComponent('Hoodies & Sweats') },
          { label: 'Tees', to: '/shop?category=Clothing&subcategory=Tees' },
          { label: 'Accessories', to: '/shop?category=Accessories' },
        ],
        totalMatches: 0,
      };
    }
    const matchingProducts = products.filter((p) => {
      const hay = `${p.brand} ${p.name} ${p.color || ''} ${p.category || ''} ${p.subcategory || ''} ${p.silhouette || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(trimmedQuery);
    });
    const matchingBrands = derivedBrands.filter((b) => b.name.toLowerCase().includes(trimmedQuery)).slice(0, 5);
    const allSubcats = [...clothingSubcats, ...accessorySubcats].filter((s) => s.name.toLowerCase().includes(trimmedQuery));
    const matchingCategories = [
      ...['Sneakers', 'Clothing', 'Accessories']
        .filter((c) => c.toLowerCase().includes(trimmedQuery))
        .map((c) => ({ label: c, to: '/shop?category=' + encodeURIComponent(c) })),
      ...allSubcats.map((s) => ({
        label: s.name,
        to: '/shop?subcategory=' + encodeURIComponent(s.name),
      })),
    ].slice(0, 4);

    return {
      products: matchingProducts.slice(0, 6),
      brands: matchingBrands,
      categories: matchingCategories,
      totalMatches: matchingProducts.length,
    };
  }, [trimmedQuery, products, derivedBrands, clothingSubcats, accessorySubcats]);

  const handleMegaEnter = (section) => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setMegaSection(section);
  };

  const handleMegaLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setMegaSection(null);
    }, 140);
  };

  const handleSearchKeyDown = (event) => {
    const items = predictiveResults.products;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1 < items.length ? prev + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : items.length - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      trackEvent('search_performed');
      const target = items[activeIndex];
      setSearchOpen(false);
      navigate('/product/' + target.id);
    }
  };

  return (
    <div className={'site-header-wrapper' + (isScrolled ? ' is-scrolled' : '')} ref={headerRef}>
      {/* Animated Marquee Announcement Bar */}
      <div className="announcement" role="region" aria-label="Store announcements">
        <div className="marquee-track">
          {[0, 1].map((copyIdx) => (
            <div className="marquee-group" key={copyIdx} aria-hidden={copyIdx === 1 ? 'true' : undefined}>
              {MARQUEE_ITEMS.map((item, idx) => (
                <span key={idx} className="marquee-item">
                  <span className="marquee-dot" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className="header" onMouseLeave={handleMegaLeave}>
        <button
          className="icon mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={23} /> : <List size={23} />}
        </button>

        <Link to="/" className="wordmark" aria-label="Sole District home">SOLE DISTRICT</Link>

        {/* Desktop Navigation with Mega-Menu triggers */}
        <nav aria-label="Main navigation" className="nav desktop-nav">
          <Link to="/shop?new=true" className="nav-link nav-link-highlight" onMouseEnter={() => setMegaSection(null)}>
            New In
            {newInCount > 0 && <span className="nav-badge-pill">{newInCount}</span>}
          </Link>

          <div
            className={'nav-item-dropdown ' + (megaSection === 'Sneakers' ? 'is-active' : '')}
            onMouseEnter={() => handleMegaEnter('Sneakers')}
            onFocus={() => handleMegaEnter('Sneakers')}
          >
            <Link
              to="/shop?category=Sneakers"
              className="nav-link has-caret"
              aria-expanded={megaSection === 'Sneakers'}
              aria-haspopup="true"
            >
              Sneakers <CaretDown size={12} weight="bold" />
            </Link>
          </div>

          <div
            className={'nav-item-dropdown ' + (megaSection === 'Clothing' ? 'is-active' : '')}
            onMouseEnter={() => handleMegaEnter('Clothing')}
            onFocus={() => handleMegaEnter('Clothing')}
          >
            <Link
              to="/shop?category=Clothing"
              className="nav-link has-caret"
              aria-expanded={megaSection === 'Clothing'}
              aria-haspopup="true"
            >
              Clothing <CaretDown size={12} weight="bold" />
            </Link>
          </div>

          <div
            className={'nav-item-dropdown ' + (megaSection === 'Accessories' ? 'is-active' : '')}
            onMouseEnter={() => handleMegaEnter('Accessories')}
            onFocus={() => handleMegaEnter('Accessories')}
          >
            <Link
              to="/shop?category=Accessories"
              className="nav-link has-caret"
              aria-expanded={megaSection === 'Accessories'}
              aria-haspopup="true"
            >
              Accessories <CaretDown size={12} weight="bold" />
            </Link>
          </div>

          <div
            className={'nav-item-dropdown ' + (megaSection === 'Brands' ? 'is-active' : '')}
            onMouseEnter={() => handleMegaEnter('Brands')}
            onFocus={() => handleMegaEnter('Brands')}
          >
            <Link
              to="/brands"
              className="nav-link has-caret"
              aria-expanded={megaSection === 'Brands'}
              aria-haspopup="true"
            >
              Brands <CaretDown size={12} weight="bold" />
            </Link>
          </div>

          <Link to="/shop?sale=true" className="nav-link nav-link-sale" onMouseEnter={() => setMegaSection(null)}>
            Sale
            {saleCount > 0 && <span className="nav-sale-count">{saleCount}</span>}
          </Link>
        </nav>

        <div className="header-actions">
          <button
            className="icon search-trigger-btn"
            aria-label="Search products"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMegaSection(null);
            }}
          >
            <MagnifyingGlass size={21} />
            <span className="search-trigger-label">Search</span>
          </button>
          <Link className={'icon wishlist-header-icon' + (wishBump ? ' is-bumping' : '')} to="/wishlist" aria-label={'Wishlist, ' + wishlist.length + ' saved'}>
            <Heart size={21} weight={wishlist.length ? 'fill' : 'regular'} />
            {wishlist.length > 0 && <span className="header-count-dot">{wishlist.length}</span>}
          </Link>
          <Link className="icon account-icon" to="/account" aria-label="Your account"><User size={21} /></Link>
          <button className={'bag-link' + (bagBump ? ' is-bumping' : '') + (count > 0 ? ' has-items' : '')} onClick={() => setBagOpen(true)} aria-label={'Open bag, ' + count + ' items'}>
            Bag ({count})
          </button>
        </div>

        {/* Desktop Mega-Menu Panel */}
        {megaSection && (
          <div
            className="mega-menu"
            role="region"
            aria-label="Store directory mega menu"
            onMouseEnter={() => {
              if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
            }}
            onMouseLeave={handleMegaLeave}
          >
            <div className="mega-menu-inner">
              {/* Column 1: Sneakers */}
              <div className={'mega-col ' + (megaSection === 'Sneakers' ? 'mega-col-active' : '')}>
                <div className="mega-col-header">
                  <Link to="/shop?category=Sneakers" className="mega-col-title">Sneakers</Link>
                  <Link to="/shop?category=Sneakers" className="mega-view-all">All Footwear →</Link>
                </div>
                <div className="mega-sub-Split">
                  <div>
                    <span className="mega-eyebrow">By Brand</span>
                    <ul className="mega-list">
                      {sneakerBrands.map((b) => (
                        <li key={b.name}>
                          <Link to={`/shop?category=Sneakers&brand=${encodeURIComponent(b.name)}`}>
                            <span>{b.name}</span>
                            <span className="mega-count">{b.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="mega-eyebrow">Key Silhouettes</span>
                    <ul className="mega-list">
                      {sneakerSilhouettes.map((s) => (
                        <li key={s.name}>
                          <Link to={`/shop?category=Sneakers&silhouette=${encodeURIComponent(s.name)}`}>
                            <span>{s.name}</span>
                            <span className="mega-count">{s.count}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Column 2: Clothing */}
              <div className={'mega-col ' + (megaSection === 'Clothing' ? 'mega-col-active' : '')}>
                <div className="mega-col-header">
                  <Link to="/shop?category=Clothing" className="mega-col-title">Clothing</Link>
                  <Link to="/shop?category=Clothing" className="mega-view-all">All Apparel →</Link>
                </div>
                <span className="mega-eyebrow">By Subcategory</span>
                <ul className="mega-list">
                  <li>
                    <Link to="/shop?category=Clothing">
                      <strong>Shop All Streetwear Apparel</strong>
                      <span className="mega-count">{products.filter((p) => p.category === 'Clothing').length}</span>
                    </Link>
                  </li>
                  {clothingSubcats.map((sub) => (
                    <li key={sub.name}>
                      <Link to={`/shop?category=Clothing&subcategory=${encodeURIComponent(sub.name)}`}>
                        <span>{sub.name}</span>
                        {sub.count > 0 && <span className="mega-count">{sub.count}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mega-curated-tags">
                  <Link to="/shop?category=Clothing&new=true" className="mega-pill">New Season Apparel</Link>
                  <Link to="/shop?category=Clothing&sale=true" className="mega-pill mega-pill-sale">Apparel Sale</Link>
                </div>
              </div>

              {/* Column 3: Accessories */}
              <div className={'mega-col ' + (megaSection === 'Accessories' ? 'mega-col-active' : '')}>
                <div className="mega-col-header">
                  <Link to="/shop?category=Accessories" className="mega-col-title">Accessories</Link>
                  <Link to="/shop?category=Accessories" className="mega-view-all">All Goods →</Link>
                </div>
                <span className="mega-eyebrow">By Subcategory</span>
                <ul className="mega-list">
                  <li>
                    <Link to="/shop?category=Accessories">
                      <strong>Shop All Accessories</strong>
                      <span className="mega-count">{products.filter((p) => p.category === 'Accessories').length}</span>
                    </Link>
                  </li>
                  {accessorySubcats.map((sub) => (
                    <li key={sub.name}>
                      <Link to={`/shop?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`}>
                        <span>{sub.name}</span>
                        {sub.count > 0 && <span className="mega-count">{sub.count}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <span className="mega-eyebrow" style={{ marginTop: '14px' }}>Curated Edits</span>
                <ul className="mega-list">
                  <li><Link to="/shop?new=true"><span>New Arrivals</span><span className="mega-tag-lime">NEW</span></Link></li>
                  <li><Link to="/shop?sale=true"><span>Archive Sale</span><span className="mega-tag-sale">SALE</span></Link></li>
                </ul>
              </div>

              {/* Column 4: Dynamic Brands */}
              <div className={'mega-col ' + (megaSection === 'Brands' ? 'mega-col-active' : '')}>
                <div className="mega-col-header">
                  <Link to="/brands" className="mega-col-title">Brands ({derivedBrands.length})</Link>
                  <Link to="/brands" className="mega-view-all">A–Z Index →</Link>
                </div>
                <span className="mega-eyebrow">Most Stocked Labels</span>
                <ul className="mega-list mega-brand-grid">
                  {derivedBrands.slice(0, 10).map((b) => (
                    <li key={b.name}>
                      <Link to={`/shop?brand=${encodeURIComponent(b.name)}`}>
                        <span>{b.name}</span>
                        <span className="mega-count">{b.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 5: Editorial Spotlight */}
              {spotlightProduct && (
                <div className="mega-spotlight">
                  <Link to={'/product/' + spotlightProduct.id} className="mega-spotlight-card">
                    <div className="mega-spotlight-img">
                      <img src={spotlightProduct.images?.[0]?.url || spotlightProduct.image} alt={spotlightProduct.name} loading="lazy" />
                      <span className="mega-spotlight-badge">District Edit</span>
                    </div>
                    <div className="mega-spotlight-copy">
                      <span className="eyebrow">{spotlightProduct.brand}</span>
                      <strong>{spotlightProduct.name}</strong>
                      <span>{money(spotlightProduct.price)} · Explore piece →</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer with Accordions */}
      {menuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMenuOpen(false)}>
          <aside
            className="mobile-drawer"
            aria-label="Mobile navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <span className="wordmark">SOLE DISTRICT</span>
              <button className="icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form
              className="mobile-drawer-search"
              onSubmit={(e) => {
                e.preventDefault();
                if (!query.trim()) return;
                trackEvent('search_performed');
                setMenuOpen(false);
                navigate('/shop?q=' + encodeURIComponent(query));
              }}
            >
              <MagnifyingGlass size={18} />
              <input
                type="search"
                placeholder="Search sneakers, hoodies, tees, brands…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
            </form>

            <div className="mobile-quick-pills">
              <Link to="/shop?new=true" className="mobile-pill mobile-pill-lime">
                <Sparkle size={14} weight="fill" /> New In ({newInCount})
              </Link>
              <Link to="/shop?sale=true" className="mobile-pill mobile-pill-sale">
                Sale ({saleCount})
              </Link>
              <Link to="/shop" className="mobile-pill">
                All Pieces ({products.length})
              </Link>
            </div>

            <div className="mobile-accordions">
              {/* Sneakers Accordion */}
              <div className="mobile-acc-item">
                <button
                  type="button"
                  className="mobile-acc-trigger"
                  aria-expanded={mobileAccordion === 'Sneakers'}
                  onClick={() => setMobileAccordion(mobileAccordion === 'Sneakers' ? '' : 'Sneakers')}
                >
                  <span>Sneakers</span>
                  <CaretDown size={16} className={mobileAccordion === 'Sneakers' ? 'rotated' : ''} />
                </button>
                {mobileAccordion === 'Sneakers' && (
                  <div className="mobile-acc-panel">
                    <Link to="/shop?category=Sneakers" className="mobile-acc-all">Shop All Sneakers →</Link>
                    <span className="mobile-acc-subhead">Top Brands</span>
                    {sneakerBrands.map((b) => (
                      <Link key={b.name} to={`/shop?category=Sneakers&brand=${encodeURIComponent(b.name)}`}>
                        <span>{b.name}</span>
                        <span className="mega-count">{b.count}</span>
                      </Link>
                    ))}
                    <span className="mobile-acc-subhead">Popular Silhouettes</span>
                    {sneakerSilhouettes.slice(0, 6).map((s) => (
                      <Link key={s.name} to={`/shop?category=Sneakers&silhouette=${encodeURIComponent(s.name)}`}>
                        <span>{s.name}</span>
                        <span className="mega-count">{s.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Clothing Accordion */}
              <div className="mobile-acc-item">
                <button
                  type="button"
                  className="mobile-acc-trigger"
                  aria-expanded={mobileAccordion === 'Clothing'}
                  onClick={() => setMobileAccordion(mobileAccordion === 'Clothing' ? '' : 'Clothing')}
                >
                  <span>Clothing</span>
                  <CaretDown size={16} className={mobileAccordion === 'Clothing' ? 'rotated' : ''} />
                </button>
                {mobileAccordion === 'Clothing' && (
                  <div className="mobile-acc-panel">
                    <Link to="/shop?category=Clothing" className="mobile-acc-all">Shop All Clothing →</Link>
                    {clothingSubcats.map((sub) => (
                      <Link key={sub.name} to={`/shop?category=Clothing&subcategory=${encodeURIComponent(sub.name)}`}>
                        <span>{sub.name}</span>
                        {sub.count > 0 && <span className="mega-count">{sub.count}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Accessories Accordion */}
              <div className="mobile-acc-item">
                <button
                  type="button"
                  className="mobile-acc-trigger"
                  aria-expanded={mobileAccordion === 'Accessories'}
                  onClick={() => setMobileAccordion(mobileAccordion === 'Accessories' ? '' : 'Accessories')}
                >
                  <span>Accessories</span>
                  <CaretDown size={16} className={mobileAccordion === 'Accessories' ? 'rotated' : ''} />
                </button>
                {mobileAccordion === 'Accessories' && (
                  <div className="mobile-acc-panel">
                    <Link to="/shop?category=Accessories" className="mobile-acc-all">Shop All Accessories →</Link>
                    {accessorySubcats.map((sub) => (
                      <Link key={sub.name} to={`/shop?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`}>
                        <span>{sub.name}</span>
                        {sub.count > 0 && <span className="mega-count">{sub.count}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands Accordion */}
              <div className="mobile-acc-item">
                <button
                  type="button"
                  className="mobile-acc-trigger"
                  aria-expanded={mobileAccordion === 'Brands'}
                  onClick={() => setMobileAccordion(mobileAccordion === 'Brands' ? '' : 'Brands')}
                >
                  <span>Brands ({derivedBrands.length})</span>
                  <CaretDown size={16} className={mobileAccordion === 'Brands' ? 'rotated' : ''} />
                </button>
                {mobileAccordion === 'Brands' && (
                  <div className="mobile-acc-panel">
                    <Link to="/brands" className="mobile-acc-all">View All Brands Directory →</Link>
                    {derivedBrands.slice(0, 12).map((b) => (
                      <Link key={b.name} to={`/shop?brand=${encodeURIComponent(b.name)}`}>
                        <span>{b.name}</span>
                        <span className="mega-count">{b.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mobile-drawer-footer">
              <Link to="/wishlist">Wishlist ({wishlist.length})</Link>
              <Link to="/orders">Your Orders</Link>
              <Link to="/account">Account</Link>
              <Link to="/journal">District Journal</Link>
              <Link to="/help/delivery">Singapore Delivery & Returns</Link>
            </div>
          </aside>
        </div>
      )}

      {/* Predictive Search Panel + Live Results Overlay */}
      {searchOpen && (
        <div className="search-overlay-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-overlay-container" onClick={(e) => e.stopPropagation()}>
            <form
              className="search-panel"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                trackEvent('search_performed');
                setSearchOpen(false);
                navigate('/shop?q=' + encodeURIComponent(query));
              }}
            >
              <MagnifyingGlass size={20} />
              <input
                ref={searchInputRef}
                autoFocus
                aria-label="Search the collection"
                placeholder="Search sneakers, hoodies, tees, brands, colourways…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
              />
              {query && (
                <button
                  type="button"
                  className="text-button search-clear-btn"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(-1);
                    searchInputRef.current?.focus();
                  }}
                >
                  Clear
                </button>
              )}
              <button type="submit" className="icon" aria-label="Submit search"><ArrowRight size={20} /></button>
              <button type="button" className="icon" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={20} /></button>
            </form>

            <div className="predictive-results" role="region" aria-label="Search suggestions">
              <div className="predictive-sidebar">
                {!trimmedQuery ? (
                  <>
                    <div className="predictive-group">
                      <span className="predictive-heading">Trending Searches</span>
                      <div className="predictive-chips">
                        {['Jordan 1', 'Yeezy', 'Hoodies & Sweats', 'Tees', 'New Balance', 'Dunk Low'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            className="predictive-chip"
                            onClick={() => setQuery(term)}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="predictive-group">
                      <span className="predictive-heading">Top Labels</span>
                      <ul className="predictive-links">
                        {predictiveResults.brands.map((b) => (
                          <li key={b.name}>
                            <Link to={`/shop?brand=${encodeURIComponent(b.name)}`} onClick={() => setSearchOpen(false)}>
                              <span>{b.name}</span>
                              <span className="mega-count">{b.count}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {predictiveResults.brands.length > 0 && (
                      <div className="predictive-group">
                        <span className="predictive-heading">Matching Brands</span>
                        <ul className="predictive-links">
                          {predictiveResults.brands.map((b) => (
                            <li key={b.name}>
                              <Link to={`/shop?brand=${encodeURIComponent(b.name)}`} onClick={() => setSearchOpen(false)}>
                                <span>{b.name}</span>
                                <span className="mega-count">{b.count} pieces</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {predictiveResults.categories.length > 0 && (
                      <div className="predictive-group">
                        <span className="predictive-heading">Categories</span>
                        <div className="predictive-chips">
                          {predictiveResults.categories.map((c) => (
                            <Link
                              key={c.label}
                              to={c.to}
                              className="predictive-chip"
                              onClick={() => setSearchOpen(false)}
                            >
                              {c.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="predictive-main">
                <div className="predictive-main-header">
                  <span className="predictive-heading">
                    {trimmedQuery
                      ? `Top Matches (${predictiveResults.totalMatches})`
                      : 'Highlighted Rotation'}
                  </span>
                  {trimmedQuery && predictiveResults.totalMatches > 0 && (
                    <Link
                      to={`/shop?q=${encodeURIComponent(query)}`}
                      className="predictive-view-all"
                      onClick={() => {
                        trackEvent('search_performed');
                        setSearchOpen(false);
                      }}
                    >
                      View all {predictiveResults.totalMatches} results <ArrowRight size={14} />
                    </Link>
                  )}
                </div>

                {predictiveResults.products.length > 0 ? (
                  <div className="predictive-product-list" role="listbox">
                    {predictiveResults.products.map((item, idx) => {
                      const onSale = isOnSale(item);
                      return (
                        <Link
                          key={item.id}
                          to={'/product/' + item.id}
                          role="option"
                          aria-selected={activeIndex === idx}
                          className={'predictive-product-card ' + (activeIndex === idx ? 'is-highlighted' : '')}
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="predictive-thumb">
                            <img src={item.images?.[0]?.url || item.image} alt={item.name} loading="lazy" />
                          </div>
                          <div className="predictive-info">
                            <span className="predictive-brand">{item.brand} · {item.subcategory || item.silhouette || item.category}</span>
                            <strong className="predictive-name">{item.name}</strong>
                            <div className="predictive-price-row">
                              <span className={onSale ? 'price-sale' : ''}>{money(item.price)}</span>
                              {onSale && <del className="price-retail">{money(item.retailPrice)}</del>}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="predictive-empty">
                    <p>No direct matches for “{query}”. Try searching by brand, category, or silhouette.</p>
                    <div className="predictive-chips">
                      <Link to="/shop?new=true" className="predictive-chip" onClick={() => setSearchOpen(false)}>Shop New In</Link>
                      <Link to="/shop?category=Sneakers" className="predictive-chip" onClick={() => setSearchOpen(false)}>All Sneakers</Link>
                      <Link to="/shop?category=Clothing" className="predictive-chip" onClick={() => setSearchOpen(false)}>Streetwear Apparel</Link>
                      <Link to="/shop?category=Accessories" className="predictive-chip" onClick={() => setSearchOpen(false)}>Accessories</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product, index = 0 }) {
  const { wishlist, toggleWish, add } = useShop();
  const [quickOpen, setQuickOpen] = useState(false);
  const [justAddedSize, setJustAddedSize] = useState('');
  const [heartPop, setHeartPop] = useState(false);

  const isWished = wishlist.includes(product.id);
  const primaryImg = product.images?.[0]?.url || product.image;
  const secondaryImg = product.images?.[1]?.url;
  const soldOut = isSoldOut(product);
  const lowStock = isLowStock(product);
  const onSale = isOnSale(product);
  const newIn = isNewIn(product);
  const salePct = discountPercent(product);
  const availSizesCount = getAvailableSizeCount(product);

  const badgeText = product.badge || (product.illustrative && !product.sellable ? 'Preview' : null);
  const showNewBadge = newIn && (!badgeText || !/new/i.test(badgeText));
  const subLabel = product.subcategory || product.silhouette || product.category;

  const handleQuickAdd = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || variant.available < 1) return;
    add(product, variant.id);
    setJustAddedSize(variant.size);
    window.setTimeout(() => {
      setJustAddedSize('');
      setQuickOpen(false);
    }, 900);
  };

  return (
    <article
      className={'product-card' + (quickOpen ? ' quick-add-open' : '') + (soldOut ? ' is-sold-out' : '')}
      style={{ '--card-idx': Math.min(index, 11) }}
    >
      <div className="product-image">
        <Link to={'/product/' + product.id}>
          <img
            className="primary-img"
            src={primaryImg}
            alt={product.images?.[0]?.alt || product.brand + ' ' + product.name}
            loading="lazy"
            width="1200"
            height="900"
          />
          {secondaryImg && (
            <img
              className="secondary-img"
              src={secondaryImg}
              alt={(product.images?.[1]?.alt || product.brand + ' ' + product.name) + ' alternate angle'}
              loading="lazy"
              width="1200"
              height="900"
            />
          )}
        </Link>

        <button
          className={'wish icon' + (isWished ? ' is-wished' : '') + (heartPop ? ' is-popping' : '')}
          aria-label={(isWished ? 'Remove ' : 'Save ') + product.name + ' ' + (isWished ? 'from' : 'to') + ' wishlist'}
          aria-pressed={isWished}
          onClick={() => {
            if (!isWished) {
              setHeartPop(true);
              window.setTimeout(() => setHeartPop(false), 430);
            }
            toggleWish(product.id);
          }}
        >
          <Heart size={20} weight={isWished ? 'fill' : 'regular'} />
        </button>

        {/* Top-left Status Badges */}
        <div className="product-card-tags">
          {soldOut && <span className="product-badge badge-soldout">Sold Out</span>}
          {!soldOut && onSale && <span className="product-badge badge-sale">Sale −{salePct}%</span>}
          {!soldOut && showNewBadge && <span className="product-badge badge-new">New In</span>}
          {badgeText && <span className="product-badge">{badgeText}</span>}
          {!soldOut && lowStock && <span className="product-badge badge-lowstock">Low Stock</span>}
          <span className="auth-pill">Verified</span>
        </div>

        {/* Touch-friendly Quick-Add Toggle Button */}
        {!soldOut && product.variants?.length > 0 && (
          <button
            type="button"
            className="quick-add-toggle"
            aria-label={quickOpen ? 'Close quick add sizes' : `Quick add ${product.name}`}
            aria-expanded={quickOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickOpen((prev) => !prev);
            }}
          >
            <BagIcon size={14} weight="bold" />
            <span>{quickOpen ? 'Close' : 'Quick Add'}</span>
          </button>
        )}

        {/* Hover / Touch Quick-Add Size Picker Drawer */}
        {!soldOut && product.variants?.length > 0 && (
          <div className="quick-add-drawer" aria-label={`Quick add size for ${product.name}`}>
            <div className="quick-add-header">
              <span>Quick Add {product.category === 'Sneakers' ? '(UK)' : ''}</span>
              {justAddedSize && <span className="quick-added-feedback">✓ Added {justAddedSize}</span>}
            </div>
            <div className="quick-add-sizes">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.available < 1}
                  className={'quick-size-btn' + (justAddedSize === v.size ? ' added' : '')}
                  title={v.available < 1 ? `${v.size} — Sold out` : `Add size ${v.size} to bag`}
                  onClick={(e) => handleQuickAdd(e, v)}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link className="product-copy" to={'/product/' + product.id}>
        <div className="brand-line">
          <strong>{product.brand}</strong>
          {subLabel && <span className="silhouette-tag">{subLabel}</span>}
        </div>
        <div className="title-price-line">
          <span className="shoe-name">{product.name}</span>
          <span className="shoe-price-group">
            {onSale && <del className="price-retail">{money(product.retailPrice)}</del>}
            <span className={'shoe-price' + (onSale ? ' is-sale' : '')}>{money(product.price)}</span>
          </span>
        </div>
        <div className="card-meta-line">
          {product.color && <span className="shoe-colorway">{product.color}</span>}
          <span className="size-count-hint">
            {soldOut
              ? 'Out of stock'
              : product.sizes?.length === 1 && product.sizes[0] === 'One size'
                ? 'One size'
                : `${availSizesCount} ${availSizesCount === 1 ? 'size' : 'sizes'}`}
          </span>
        </div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, columns }) {
  const gridClass = 'product-grid' + (columns ? ` cols-${columns}` : '');
  return (
    <div className={gridClass}>
      {products.map((product, idx) => <ProductCard key={product.id} product={product} index={idx} />)}
    </div>
  );
}

export function Dialog({ children, title, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const prior = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      prior?.focus?.();
    };
  }, []);
  return (
    <dialog ref={ref} className="dialog" onCancel={onClose} onClick={(event) => {
      if (event.target === ref.current) onClose();
    }}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button className="icon" onClick={onClose} aria-label="Close dialog"><X size={22} /></button>
      </div>
      {children}
    </dialog>
  );
}

export function LineItem({ line }) {
  const { update } = useShop();
  const price = line.variant.price || line.product.price;
  return (
    <article className="cart-item">
      <Link to={'/product/' + line.product.id}><img src={line.product.image} alt={line.product.name} /></Link>
      <div className="cart-item-copy">
        <strong>{line.product.brand}</strong>
        <Link to={'/product/' + line.product.id}>{line.product.name}</Link>
        <span className="muted">{line.variant.size_system === 'UK' ? 'UK ' : ''}{line.variant.size} · {line.product.color.split(' / ')[0]}</span>
        <div className="quantity">
          <button aria-label={'Decrease ' + line.product.name + ' quantity'} onClick={() => update(line.variantId, line.quantity - 1)}><Minus size={15} /></button>
          <span>{line.quantity}</span>
          <button aria-label={'Increase ' + line.product.name + ' quantity'} disabled={line.quantity >= Math.min(line.variant.available, 10)} onClick={() => update(line.variantId, line.quantity + 1)}><Plus size={15} /></button>
        </div>
      </div>
      <div className="line-end">
        <span>{money(line.quantity * price)}</span>
        <button className="icon" aria-label={'Remove ' + line.product.name} onClick={() => update(line.variantId, 0)}><Trash size={18} /></button>
      </div>
    </article>
  );
}

function Bag() {
  const { bagOpen, setBagOpen, lines, subtotal, count } = useShop();
  const dialog = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (bagOpen && !dialog.current.open) dialog.current.showModal();
    if (!bagOpen && dialog.current.open) dialog.current.close();
  }, [bagOpen]);
  const delivery = subtotal >= 15000 ? 0 : 800;
  return (
    <dialog ref={dialog} className="bag-dialog" onCancel={() => setBagOpen(false)} onClick={(event) => {
      if (event.target === dialog.current) setBagOpen(false);
    }}>
      <div className="bag-heading">
        <h2>Your bag <span>({count})</span></h2>
        <button className="icon" onClick={() => setBagOpen(false)} aria-label="Close bag"><X size={22} /></button>
      </div>
      {lines.length ? (
        <>
          <div className="shipping-note">{subtotal >= 15000 ? <><Check size={18} />Preview order reaches complimentary delivery.</> : <>You’re {money(15000 - subtotal)} away from complimentary delivery.</>}</div>
          <div className="bag-items">{lines.map((line) => <LineItem key={line.variantId} line={line} />)}</div>
          <div className="bag-bottom">
            <div><strong>Subtotal</strong><strong>{money(subtotal)}</strong></div>
            <p>Estimated Singapore delivery: {delivery ? money(delivery) : 'Complimentary'}</p>
            <Button onClick={() => {
              setBagOpen(false);
              trackEvent('checkout_started');
              navigate('/checkout');
            }}>Review bag <ArrowRight size={20} /></Button>
            <button className="underlined" onClick={() => setBagOpen(false)}>Continue shopping</button>
          </div>
        </>
      ) : (
        <div className="empty">
          <h2>Your next favourite is waiting.</h2>
          <p>Find something for your everyday rotation.</p>
          <Button onClick={() => { setBagOpen(false); navigate('/shop'); }}>Explore the collection <ArrowRight size={20} /></Button>
        </div>
      )}
    </dialog>
  );
}

function Footer() {
  const { store } = useShop();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link className="wordmark" to="/">SOLE DISTRICT</Link>
          <p>Sneakers, heavyweight streetwear & daily essentials. Dispatched from Singapore.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link to="/shop?new=true">New Arrivals</Link>
          <Link to="/shop?category=Sneakers">Sneakers</Link>
          <Link to="/shop?category=Clothing">Streetwear Apparel</Link>
          <Link to="/shop?category=Accessories">Accessories</Link>
          <Link to="/shop?sale=true">Archive Sale</Link>
          <Link to="/brands">Brands Directory</Link>
        </div>
        <div>
          <strong>Good to know</strong>
          <Link to="/help/delivery">Delivery</Link>
          <Link to="/help/returns">Returns</Link>
          <Link to="/help/privacy">Privacy</Link>
          <Link to="/journal">Journal</Link>
        </div>
        <div>
          <strong>Your district</strong>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">Your orders</Link>
          <Link to="/account">Account</Link>
          <Link to="/help/store">Store information</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} SOLE DISTRICT</span>
        <span>{store.preview ? 'Preview catalogue · Purchases disabled' : 'Singapore store · Payments handled by Stripe'}</span>
        <span>SG / SGD</span>
      </div>
    </footer>
  );
}

function ConsentBanner() {
  const [choice, setChoice] = useState(() => localStorage.getItem('sd-analytics-consent'));
  useEffect(() => {
    if (choice === 'accepted') {
      api('consent/', { method: 'POST', body: JSON.stringify({ consent: true }) })
        .then(() => trackEvent('session_started'))
        .catch(() => {});
    } else if (choice === 'rejected') {
      api('consent/', { method: 'POST', body: JSON.stringify({ consent: false }) }).catch(() => {});
    }
  }, [choice]);
  if (choice) return null;
  const decide = async (value) => {
    localStorage.setItem('sd-analytics-consent', value);
    setChoice(value);
    try { await api('consent/', { method: 'POST', body: JSON.stringify({ consent: value === 'accepted' }) }); } catch {}
  };
  return (
    <aside className="consent-banner" aria-label="Analytics consent">
      <div><strong>Your privacy, your call.</strong><p>Optional shopping analytics help us understand what works. They stay off unless you choose to allow them.</p></div>
      <div className="consent-actions"><button className="button button-light consent-decline" onClick={() => decide('rejected')}>Decline</button><button className="button button-dark consent-accept" onClick={() => decide('accepted')}>Allow analytics</button></div>
    </aside>
  );
}

function StoreRoutes() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/manage')) return <Suspense fallback={<main id="main" className="section"><p role="status">Opening management workspace…</p></main>}><AdminApp /></Suspense>;
  return (
    <>
      <ScrollProgressBar />
      <Header />
      <main id="main">
        <div key={pathname} className="route-stage">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/complete" element={<Complete />} />
            <Route path="/help/:kind" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <Bag />
      <ConsentBanner />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Provider>
        <ScrollTop />
        <a className="skip-link" href="#main">Skip to content</a>
        <StoreRoutes />
      </Provider>
    </BrowserRouter>
  );
}
