import { lazy, Suspense, createContext, useContext, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Heart, List, MagnifyingGlass, Minus, Plus, Trash, User, X,
} from '@phosphor-icons/react';
import {
  api, cartLines, initialProducts, money, readStored, saveStored, trackEvent, validCart,
} from './shop';
import {
  Account, Brands, Checkout, Complete, Help, Home, Journal, Orders, ProductPage,
  ShopPage, Wishlist, NotFound,
} from './Pages';
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
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [store, setStore] = useState({ checkout_ready: false, preview: true, sample_catalogue: true });

  useEffect(() => {
    let active = true;
    api('catalog/').then((data) => {
      if (!active) return;
      setProducts(data.products);
      const variants = data.products.flatMap((product) => product.variants);
      setCart((items) => {
        const merged = new Map();
        for (const item of items) {
          const matches = variants.filter((variant) => variant.id === item.variantId || variant.legacy_id === item.variantId);
          const id = matches.length === 1 ? matches[0].id : item.variantId;
          const quantity = (merged.get(id)?.quantity || 0) + item.quantity;
          merged.set(id, { variantId: id, quantity: Math.min(10, quantity) });
        }
        return [...merged.values()];
      });
      setStore(data.store);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => { saveStored('sd-cart', cart); }, [cart]);
  useEffect(() => { saveStored('sd-wishlist', wishlist); }, [wishlist]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const add = (product, size) => {
    const variant = product.variants.find((item) => item.id === size) || product.variants.find((item) => item.size === size);
    if (!variant || variant.available < 1) return;
    const prior = cart.find((item) => item.variantId === variant.id);
    if ((prior?.quantity || 0) >= Math.min(variant.available, 10)) {
      setToast('You’ve reached the available quantity.');
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item.variantId === variant.id);
      return existing
        ? items.map((item) => item.variantId === variant.id
          ? { ...item, quantity: Math.min(item.quantity + 1, variant.available, 10) }
          : item)
        : [...items, { variantId: variant.id, quantity: 1 }];
    });
    trackEvent('cart_added', { product_id: product.id });
    setBagOpen(true);
  };

  const toggleWish = (id) => setWishlist((items) => (
    items.includes(id) ? items.filter((item) => item !== id) : [...items, id]
  ));
  const update = (variantId, quantity) => {
    const variant = products.flatMap((product) => product.variants).find((item) => item.id === variantId);
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
      lines, count, subtotal, bagOpen, setBagOpen, store, setStore, setToast,
    }}>
      {children}
      {toast && <div role="status" className="toast"><Check size={18} weight="bold" />{toast}</div>}
    </Shop.Provider>
  );
}

function Header() {
  const { count, setBagOpen } = useShop();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [location.pathname]);

  return (
    <>
      <div className="announcement">Illustrative preview · Purchases open after sourcing and stock checks</div>
      <header className="header">
        <button className="icon mobile-menu" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={23} /> : <List size={23} />}
        </button>
        <Link to="/" className="wordmark" aria-label="Sole District home">SOLE DISTRICT</Link>
        <nav aria-label="Main navigation" className={menuOpen ? 'nav open' : 'nav'}>
          <Link to="/shop">New Arrivals</Link>
          <Link to="/shop?category=Sneakers">Sneakers</Link>
          <Link to="/shop?category=Clothing">Clothing</Link>
          <Link to="/brands">Brands</Link>
          <Link to="/journal">Journal</Link>
        </nav>
        <div className="header-actions">
          <button className="icon" aria-label="Search products" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><MagnifyingGlass size={22} /></button>
          <Link className="icon account-icon" to="/account" aria-label="Your account"><User size={22} /></Link>
          <button className="bag-link" onClick={() => setBagOpen(true)} aria-label={'Open bag, ' + count + ' items'}>Bag ({count})</button>
        </div>
      </header>
      {searchOpen && (
        <form className="search-panel" role="search" onSubmit={(event) => {
          event.preventDefault();
          trackEvent('search_performed');
          navigate('/shop?q=' + encodeURIComponent(query));
        }}>
          <MagnifyingGlass size={20} />
          <input autoFocus aria-label="Search the collection" placeholder="Search sneakers, clothing, brands…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit" className="icon" aria-label="Submit search"><ArrowRight size={20} /></button>
          <button type="button" className="icon" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={20} /></button>
        </form>
      )}
    </>
  );
}

export function ProductCard({ product }) {
  const { wishlist, toggleWish } = useShop();
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={'/product/' + product.id}>
          <img src={product.image} alt={product.images?.[0]?.alt || product.brand + ' ' + product.name} loading="lazy" width="1200" height="900" />
        </Link>
        <button className="wish icon" aria-label={(wishlist.includes(product.id) ? 'Remove ' : 'Save ') + product.name + ' ' + (wishlist.includes(product.id) ? 'from' : 'to') + ' wishlist'} aria-pressed={wishlist.includes(product.id)} onClick={() => toggleWish(product.id)}>
          <Heart size={22} weight={wishlist.includes(product.id) ? 'fill' : 'regular'} />
        </button>
        {product.illustrative && !product.sellable && <span className="product-badge">Preview</span>}
      </div>
      <Link className="product-copy" to={'/product/' + product.id}>
        <strong>{product.brand}</strong>
        <div><span>{product.name}</span><span>{money(product.price)}</span></div>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }) {
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
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
        <div><Link className="wordmark" to="/">SOLE DISTRICT</Link><p>For the everyday. For what’s next.</p></div>
        <div><strong>Explore</strong><Link to="/shop">New arrivals</Link><Link to="/brands">Brands</Link><Link to="/wishlist">Wishlist</Link></div>
        <div><strong>Good to know</strong><Link to="/help/delivery">Delivery</Link><Link to="/help/returns">Returns</Link><Link to="/help/privacy">Privacy</Link></div>
        <div><strong>Your district</strong><Link to="/orders">Your orders</Link><Link to="/account">Account</Link><Link to="/help/store">Store information</Link></div>
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
      <div className="consent-actions"><button className="text-button" onClick={() => decide('rejected')}>Decline</button><button className="button button-dark" onClick={() => decide('accepted')}>Allow analytics</button></div>
    </aside>
  );
}

function StoreRoutes() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/manage')) return <Suspense fallback={<main id="main" className="section"><p role="status">Opening management workspace…</p></main>}><AdminApp /></Suspense>;
  return (
    <>
      <Header />
      <main id="main">
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
