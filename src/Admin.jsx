import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowSquareOut, Bell, CalendarBlank, ChartBar, Check,
  DownloadSimple, GearSix, House, MagnifyingGlass, Megaphone, Package,
  Plus, ShoppingBag, SignOut, Tag, Users, WarningCircle, X,
} from '@phosphor-icons/react';
import { Button, useShop } from './App';
import { api, money } from './shop';

const NAV = [
  { label: 'Overview', path: '/manage', icon: House },
  { label: 'Orders', path: '/manage/orders', icon: ShoppingBag },
  { label: 'Products', path: '/manage/products', icon: Tag },
  { label: 'Inventory', path: '/manage/inventory', icon: Package },
  { label: 'Returns', path: '/manage/returns', icon: ArrowRight },
  { label: 'Customers', path: '/manage/customers', icon: Users },
  { label: 'Marketing', path: '/manage/marketing', icon: Megaphone },
  { label: 'Analytics', path: '/manage/analytics', icon: ChartBar },
  { label: 'Settings', path: '/manage/settings', icon: GearSix },
];

function localDate(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function rangeParams(days) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return 'from=' + localDate(start) + '&to=' + localDate(end);
}

function useAdminData(endpoint, refreshKey = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api(endpoint));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [endpoint, refreshKey]);
  return { data, loading, error, reload: load };
}

function ErrorState({ children }) {
  return <div className="admin-alert" role="alert"><WarningCircle size={19} />{children}</div>;
}

function LoadingState() {
  return <div className="admin-loading" role="status"><span className="loading-dot" />Loading store data…</div>;
}

function MetricCard({ label, value, delta, note }) {
  const numericDelta = Number(delta || 0);
  const trend = numericDelta > 0 ? 'up' : numericDelta < 0 ? 'down' : 'flat';
  return (
    <article className="metric-card">
      <span>{label}</span>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">
        {delta !== undefined && <span className={'metric-delta ' + trend}>{numericDelta > 0 ? '↗ ' : numericDelta < 0 ? '↘ ' : '— '}{Math.abs(numericDelta)}{label.includes('conversion') ? ' pp' : '%'}</span>}
        <span>{note || 'vs previous period'}</span>
      </div>
    </article>
  );
}

function calculateDelta(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function SalesChart({ rows = [] }) {
  const width = 760;
  const height = 240;
  const pad = { left: 42, right: 14, top: 14, bottom: 30 };
  const values = rows.flatMap((row) => [row.current, row.previous]);
  const max = Math.max(100, ...values);
  const x = (index) => pad.left + (rows.length <= 1 ? 0 : index * (width - pad.left - pad.right) / (rows.length - 1));
  const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
  const current = rows.map((row, index) => x(index) + ',' + y(row.current)).join(' ');
  const previous = rows.map((row, index) => x(index) + ',' + y(row.previous)).join(' ');
  const labels = rows.filter((_, index) => index === 0 || index === rows.length - 1 || index === Math.floor(rows.length / 2));
  return (
    <div className="sales-chart-wrap">
      {rows.some((row) => row.current || row.previous) ? (
        <svg className="sales-chart" viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label="Daily net sales compared with the previous period">
          {[0, 0.33, 0.66, 1].map((fraction) => {
            const yValue = height - pad.bottom - fraction * (height - pad.top - pad.bottom);
            return <g key={fraction}><line x1={pad.left} y1={yValue} x2={width - pad.right} y2={yValue} className="chart-grid" /><text x={pad.left - 9} y={yValue + 4} textAnchor="end" className="chart-label">{Math.round(max * fraction / 10000) / 10}k</text></g>;
          })}
          <polyline points={previous} className="chart-line chart-line-muted" />
          <polyline points={current} className="chart-line chart-line-current" />
          {rows.map((row, index) => <circle key={row.date} cx={x(index)} cy={y(row.current)} r="3.8" className="chart-point" />)}
          {labels.map((row) => {
            const index = rows.indexOf(row);
            return <text key={row.date} x={x(index)} y={height - 8} textAnchor="middle" className="chart-label">{new Date(row.date + 'T12:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}</text>;
          })}
        </svg>
      ) : <div className="chart-empty">Sales data will appear after confirmed orders.</div>}
      <div className="chart-legend"><span><i className="legend-solid" />Current period</span><span><i className="legend-dashed" />Previous period</span></div>
    </div>
  );
}

function Funnel({ data = {} }) {
  const stages = [
    ['Sessions', data.sessions || 0],
    ['Product views', data.product_views || 0],
    ['Added to bag', data.added_to_cart || 0],
    ['Reached checkout', data.checkout_started || 0],
    ['Purchased', data.purchased || 0],
  ];
  const max = Math.max(1, stages[0][1]);
  return (
    <div className="funnel-list">
      {stages.map(([label, value]) => <div className="funnel-row" key={label}><span>{label}</span><div className="funnel-track"><i style={{ width: Math.max(value ? 2 : 0, (value / max) * 100) + '%' }} /></div><strong>{Number(value).toLocaleString('en-SG')}</strong></div>)}
    </div>
  );
}

function ExportButton({ data, filename = 'sole-district-report.csv' }) {
  const exportCsv = () => {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => {
      const value = row[column] ?? '';
      return '"' + String(value).replaceAll('"', '""') + '"';
    }).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  return <button className="admin-button admin-button-light" onClick={exportCsv} disabled={!data}><DownloadSimple size={17} />Export report</button>;
}

function DashboardView({ days, setDays }) {
  const endpoint = '/manage/dashboard/?' + rangeParams(days);
  const { data, loading, error } = useAdminData(endpoint);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  const summary = data.summary;
  const salesDelta = calculateDelta(summary.net_sales, summary.previous_net_sales);
  const orderDelta = calculateDelta(summary.paid_orders, summary.previous_paid_orders);
  const aovDelta = calculateDelta(summary.average_order_value, summary.previous_average_order_value);
  return (
    <>
      <div className="admin-page-heading">
        <div><h1>Overview</h1><p>Understand your store. Make your next move.</p></div>
        <div className="admin-heading-actions"><label className="range-select"><CalendarBlank size={17} /><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label><ExportButton data={data.daily_sales} filename="sole-district-sales.csv" /></div>
      </div>
      <div className="admin-metrics">
        <MetricCard label="Net merchandise sales" value={money(summary.net_sales)} delta={salesDelta} note="after recorded refunds" />
        <MetricCard label="Paid orders" value={summary.paid_orders.toLocaleString('en-SG')} delta={orderDelta} />
        <MetricCard label="Average order value" value={money(summary.average_order_value)} delta={aovDelta} />
        <MetricCard label="Store conversion" value={summary.conversion_rate === null ? '—' : summary.conversion_rate + '%'} note={summary.sessions ? 'consented sessions' : 'consented traffic not available'} />
      </div>
      <p className="comparison-note">Compared with {data.comparison.from} to {data.comparison.to}. <span>Last refreshed {new Date(data.last_updated).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT</span></p>
      <div className="dashboard-grid">
        <section className="admin-panel sales-panel"><div className="panel-heading"><div><h2>Sales over time</h2><p>Net merchandise sales in SGD</p></div><span className="live-data-dot">Confirmed orders</span></div><SalesChart rows={data.daily_sales} /></section>
        <section className="admin-panel funnel-panel"><div className="panel-heading"><div><h2>Conversion funnel</h2><p>Session-based journey · consented events</p></div></div><Funnel data={data.funnel} /></section>
        <section className="admin-panel best-sellers-panel"><div className="panel-heading"><div><h2>Best sellers</h2><p>Ranked by net item sales</p></div><Link to="/manage/products">Products <ArrowRight size={16} /></Link></div>
          {data.best_sellers.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Size</th><th>Units</th><th>Net sales</th></tr></thead><tbody>{data.best_sellers.slice(0, 6).map((item, index) => <tr key={item.product_name + item.size}><td><span className="rank">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.brand_name}</strong><small>{item.product_name}</small></span></td><td>{item.size}</td><td>{item.units}</td><td>{money(item.net_sales || 0)}</td></tr>)}</tbody></table></div> : <div className="panel-empty">No paid product sales in this period.</div>}
        </section>
        <section className="admin-panel attention-panel"><div className="panel-heading"><div><h2>Needs attention</h2><p>Actions from current store records</p></div></div>
          <Link to="/manage/orders" className="attention-row"><ShoppingBag size={19} /><span><strong>{data.orders_awaiting_dispatch} orders awaiting dispatch</strong><small>Paid orders ready for fulfilment</small></span><ArrowRight size={17} /></Link>
          <Link to="/manage/inventory" className="attention-row"><WarningCircle size={19} /><span><strong>{data.stock_alerts.length} low stock sizes</strong><small>At or below the configured threshold</small></span><ArrowRight size={17} /></Link>
          <Link to="/manage/returns" className="attention-row"><Package size={19} /><span><strong>{data.return_requests} return requests</strong><small>Waiting for staff review</small></span><ArrowRight size={17} /></Link>
        </section>
      </div>
      <p className="data-note">{data.data_note}</p>
    </>
  );
}

function OrdersView({ search }) {
  const [status, setStatus] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const endpoint = '/manage/orders/?' + new URLSearchParams({ ...(status ? { status } : {}), ...(search ? { q: search } : {}) });
  const { data, loading, error, reload } = useAdminData(endpoint, String(refresh));
  const updateOrder = async (order, nextStatus) => {
    try {
      await api('manage/orders/' + order.id + '/', { method: 'PATCH', body: JSON.stringify({ status: nextStatus, carrier: order.carrier, tracking_number: order.tracking_number }) });
      setNotice('Order ' + order.reference + ' updated.');
      setRefresh((value) => value + 1);
      setSelected(null);
    } catch (reason) { setNotice(reason.message); }
  };
  return (
    <>
      <div className="admin-page-heading"><div><h1>Orders</h1><p>Review payments and move paid orders through fulfilment.</p></div><ExportButton data={data?.orders} filename="sole-district-orders.csv" /></div>
      {notice && <div className="notice notice-soft"><Check size={17} />{notice}<button className="icon" onClick={() => setNotice('')} aria-label="Dismiss"><X size={17} /></button></div>}
      <div className="admin-toolbar"><label className="range-select">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All orders</option><option value="pending">Pending payment</option><option value="paid">Paid</option><option value="fulfilling">Fulfilling</option><option value="shipped">Shipped</option><option value="completed">Completed</option><option value="payment_failed">Payment failed</option></select></label><span className="muted">{data?.orders.length || 0} orders</span></div>
      {loading ? <LoadingState /> : error ? <ErrorState>{error}</ErrorState> : data.orders.length ? <div className="admin-panel table-panel"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Fulfilment</th><th>Total</th><th /></tr></thead><tbody>{data.orders.map((order) => <tr key={order.id} className="clickable-row" onClick={() => setSelected(order)}><td><strong>{order.reference}</strong><small>{order.items.length} items</small></td><td>{new Date(order.created).toLocaleDateString('en-SG')}</td><td>{order.customer_email || 'Guest checkout'}</td><td><span className={'status-pill status-' + order.payment_status}>{order.payment_status}</span></td><td>{order.status.replace('_', ' ')}</td><td>{money(order.total)}</td><td><ArrowRight size={17} /></td></tr>)}</tbody></table></div></div> : <div className="admin-panel empty-admin"><ShoppingBag size={25} /><h2>No orders yet</h2><p>Orders appear here after Stripe confirms payment.</p></div>}
      {selected && <div className="admin-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title" onClick={(event) => event.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">{selected.reference}</span><h2 id="order-modal-title">Order details</h2></div><button className="icon" onClick={() => setSelected(null)} aria-label="Close"><X size={21} /></button></div><div className="admin-order-summary"><strong>{money(selected.total)}</strong><span className="status-pill">{selected.status.replace('_', ' ')}</span><span>{selected.customer_email || 'Guest checkout'}</span></div>{selected.items.map((item) => <div className="admin-order-item" key={item.line_id}><span>{item.name} · {item.size} × {item.quantity}</span><strong>{money(item.unit_price * item.quantity)}</strong></div>)}{selected.payment_status === 'paid' && <div className="form-grid"><label>Carrier<input value={selected.carrier || ''} onChange={(event) => setSelected({ ...selected, carrier: event.target.value })} /></label><label>Tracking number<input value={selected.tracking_number || ''} onChange={(event) => setSelected({ ...selected, tracking_number: event.target.value })} /></label></div>}<div className="admin-modal-actions">{selected.payment_status === 'paid' && <><button className="admin-button admin-button-light" onClick={() => updateOrder(selected, 'fulfilling')}>Mark preparing</button><button className="admin-button admin-button-dark" onClick={() => updateOrder(selected, 'shipped')}>Mark shipped</button></>}{selected.status === 'shipped' && <button className="admin-button admin-button-dark" onClick={() => updateOrder(selected, 'completed')}>Mark delivered</button>}</div></section></div>}
    </>
  );
}

function ProductsView({ search }) {
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const endpoint = '/manage/products/?' + new URLSearchParams(search ? { q: search } : {});
  const { data, loading, error } = useAdminData(endpoint, String(refresh));
  const createProduct = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const brand = String(form.get('brand')).trim();
    const name = String(form.get('name')).trim();
    const sizes = String(form.get('sizes')).split(',').map((size) => size.trim()).filter(Boolean);
    const prefix = (brand + '-' + name).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
    const variants = sizes.map((size) => ({ size, sku: prefix + '-' + size.toUpperCase().replace(/[^A-Z0-9]+/g, '-'), size_system: form.get('category') === 'Sneakers' ? 'UK' : 'INT', stock_on_hand: 0 }));
    try {
      await api('manage/products/', {
        method: 'POST',
        body: JSON.stringify({
          brand, name, category: form.get('category'), colour: form.get('colour'),
          description: form.get('description'), image_url: form.get('image_url'),
          price_cents: Math.round(Number(form.get('price')) * 100),
          status: form.get('status'), is_illustrative: form.get('is_illustrative') === 'on',
          sourcing_status: form.get('sourcing_status'), variants,
        }),
      });
      setNotice('Product created with ' + variants.length + ' size variants.');
      setCreating(false);
      setRefresh((value) => value + 1);
      event.currentTarget.reset();
    } catch (reason) { setNotice(reason.message); }
  };
  return (
    <>
      <div className="admin-page-heading"><div><h1>Products</h1><p>Manage product records, sizes, pricing and sourcing status.</p></div><button className="admin-button admin-button-dark" onClick={() => setCreating(!creating)}><Plus size={18} />Add product</button></div>
      {notice && <div className="notice notice-soft">{notice}<button className="icon" onClick={() => setNotice('')} aria-label="Dismiss"><X size={17} /></button></div>}
      {creating && <form className="admin-panel product-form" onSubmit={createProduct}><div className="panel-heading"><h2>New product</h2><button type="button" className="icon" onClick={() => setCreating(false)} aria-label="Close"><X size={19} /></button></div><div className="form-grid"><label>Brand<input name="brand" required /></label><label>Product name<input name="name" required /></label><label>Category<select name="category"><option>Sneakers</option><option>Clothing</option><option>Accessories</option></select></label><label>Colour<input name="colour" /></label><label>Price (SGD)<input name="price" type="number" min="0.01" step="0.01" required /></label><label>Sizes, comma separated<input name="sizes" placeholder="UK 8, UK 9 or S, M, L" required /></label><label className="full">Image path<input name="image_url" placeholder="/assets/product.webp" /></label><label className="full">Description<textarea name="description" rows="2" /></label><label>Listing status<select name="status"><option value="draft">Draft</option><option value="active">Active</option></select></label><label>Sourcing status<select name="sourcing_status"><option value="not_reviewed">Not reviewed</option><option value="in_review">In review</option><option value="verified">Verified</option></select></label><label className="check-field"><input name="is_illustrative" type="checkbox" defaultChecked />Illustrative preview item (not sellable)</label></div><button className="admin-button admin-button-dark">Create product</button></form>}
      {loading ? <LoadingState /> : error ? <ErrorState>{error}</ErrorState> : <div className="admin-panel table-panel"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sizes</th><th>Available</th><th>Sourcing</th><th>Status</th></tr></thead><tbody>{data.products.map((product) => <tr key={product.id}><td><span className="product-table-cell"><img src={product.image} alt="" /><span><strong>{product.brand}</strong><small>{product.name}{product.illustrative ? ' · preview' : ''}</small></span></span></td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.variants.length}</td><td>{product.variants.reduce((sum, variant) => sum + variant.available, 0)}</td><td><span className="status-pill">{product.sourcing_status.replace('_', ' ')}</span></td><td>{product.status}</td></tr>)}</tbody></table></div></div>}
    </>
  );
}

function InventoryView({ search }) {
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const endpoint = '/manage/inventory/?' + new URLSearchParams(search ? { q: search } : {});
  const { data, loading, error } = useAdminData(endpoint, String(refresh));
  const submitAdjustment = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('manage/inventory/adjust/', { method: 'POST', body: JSON.stringify({
        sku: form.get('sku'), quantity_change: Number(form.get('quantity_change')),
        unit_cost_cents: form.get('unit_cost') ? Math.round(Number(form.get('unit_cost')) * 100) : null,
        supplier_reference: form.get('supplier_reference'), reason: form.get('reason'),
      }) });
      setNotice(result.sku + ' updated to ' + result.stock_on_hand + ' units.');
      event.currentTarget.reset();
      setRefresh((value) => value + 1);
    } catch (reason) { setNotice(reason.message); }
  };
  return (
    <>
      <div className="admin-page-heading"><div><h1>Inventory</h1><p>Stock by size, reservations and movement history.</p></div><button className="admin-button admin-button-dark" onClick={() => setAdjusting(!adjusting)}><Plus size={18} />Adjust stock</button></div>
      {notice && <div className="notice notice-soft">{notice}<button className="icon" onClick={() => setNotice('')} aria-label="Dismiss"><X size={17} /></button></div>}
      {adjusting && <form className="admin-panel inventory-form form-grid" onSubmit={submitAdjustment}><label>SKU<input name="sku" required /></label><label>Change quantity<input name="quantity_change" type="number" step="1" required placeholder="Positive to receive, negative to remove" /></label><label>Unit cost (SGD)<input name="unit_cost" type="number" min="0" step="0.01" /></label><label>Supplier reference<input name="supplier_reference" /></label><label className="full">Reason<input name="reason" required maxLength="240" /></label><button className="admin-button admin-button-dark">Save inventory movement</button></form>}
      {loading ? <LoadingState /> : error ? <ErrorState>{error}</ErrorState> : <>
        <div className="admin-metrics inventory-metrics"><MetricCard label="Tracked variants" value={data.variants.length} note="active size records" /><MetricCard label="Units on hand" value={data.variants.reduce((sum, row) => sum + row.stock_on_hand, 0)} note="includes preview stock" /><MetricCard label="Reserved" value={data.variants.reduce((sum, row) => sum + row.reserved, 0)} note="open checkout attempts" /><MetricCard label="Low stock sizes" value={data.variants.filter((row) => row.available <= row.threshold).length} note="at or under threshold" /></div>
        <div className="admin-panel table-panel"><div className="panel-heading"><div><h2>Stock by size</h2><p>Each size variant has its own stock record.</p></div></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>Product</th><th>SKU / size</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Stock age</th></tr></thead><tbody>{data.variants.map((row) => <tr key={row.sku}><td><strong>{row.product}</strong>{row.illustrative && <small>Illustrative stock</small>}</td><td><span>{row.sku}</span><small>{row.size_system} {row.size}</small></td><td>{row.stock_on_hand}</td><td>{row.reserved}</td><td><span className={row.available <= row.threshold ? 'stock-low' : ''}>{row.available}</span></td><td>{row.age_days === null ? 'Not recorded' : row.age_days + ' days'}</td></tr>)}</tbody></table></div></div>
        <div className="admin-panel table-panel movements-panel"><div className="panel-heading"><div><h2>Recent movements</h2><p>Receipts, adjustments and paid sales.</p></div></div>{data.movements.length ? <div className="movement-list">{data.movements.map((movement, index) => <div key={movement.sku + movement.created_at + index}><span className={'movement-sign ' + (movement.quantity_change > 0 ? 'positive' : 'negative')}>{movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}</span><span><strong>{movement.product} · {movement.size}</strong><small>{movement.reason}</small></span><small>{new Date(movement.created_at).toLocaleDateString('en-SG')}</small></div>)}</div> : <div className="panel-empty">No stock movements yet.</div>}</div>
      </>}
    </>
  );
}

function ReturnsView() {
  const [status, setStatus] = useState('requested');
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [restock, setRestock] = useState(false);
  const { data, loading, error } = useAdminData('/manage/returns/?status=' + status, String(refresh));
  const act = async (row, action, options = {}) => {
    try {
      await api('manage/returns/' + row.id + '/', { method: 'PATCH', body: JSON.stringify({ status: action, ...options }) });
      setNotice('Return request ' + row.order_reference + ' updated.');
      setRefresh((value) => value + 1);
      setConfirming(null);
    } catch (reason) { setNotice(reason.message); }
  };
  return (
    <>
      <div className="admin-page-heading"><div><h1>Returns</h1><p>Review requests and record inspection before any refund.</p></div><label className="range-select">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="requested">Needs review</option><option value="approved">Approved</option><option value="received">Received</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option></select></label></div>
      {notice && <div className="notice notice-soft">{notice}<button className="icon" onClick={() => setNotice('')} aria-label="Dismiss"><X size={17} /></button></div>}
      {loading ? <LoadingState /> : error ? <ErrorState>{error}</ErrorState> : data.returns.length ? <div className="returns-grid">{data.returns.map((row) => <article className="admin-panel return-card" key={row.id}><div className="panel-heading"><span className="status-pill">{row.status}</span><small>{new Date(row.created_at).toLocaleDateString('en-SG')}</small></div><h2>{row.product}</h2><p>{row.order_reference} · size {row.size} · qty {row.quantity}</p><strong>{row.reason}</strong><p>{row.details || 'No extra details.'}</p><a href={'mailto:' + row.email}>{row.email}</a><div className="admin-modal-actions">{row.status === 'requested' && <><button className="admin-button admin-button-light" onClick={() => act(row, 'rejected')}>Decline</button><button className="admin-button admin-button-dark" onClick={() => act(row, 'approved')}>Approve request</button></>}{row.status === 'approved' && <button className="admin-button admin-button-dark" onClick={() => act(row, 'received')}>Record item received</button>}{row.status === 'received' && (confirming === row.id ? <div className="refund-confirmation"><p>Refund <strong>{money(row.refund_amount_cents)}</strong> to {row.email} through Stripe?</p><label><input type="checkbox" checked={restock} onChange={(event) => setRestock(event.target.checked)} /> Restock after inspection</label><div><button className="admin-button admin-button-dark" onClick={() => act(row, 'refunded', { restock })}>Confirm refund</button><button className="admin-button admin-button-light" onClick={() => setConfirming(null)}>Cancel</button></div></div> : <button className="admin-button admin-button-dark" onClick={() => { setRestock(false); setConfirming(row.id); }}>Review Stripe refund</button>)}</div></article>)}</div> : <div className="admin-panel empty-admin"><Package size={25} /><h2>No {status} return requests</h2><p>New customer requests will appear here.</p></div>}
    </>
  );
}

function CustomersView({ search }) {
  const endpoint = '/manage/customers/?' + new URLSearchParams(search ? { q: search } : {});
  const { data, loading, error } = useAdminData(endpoint);
  return (
    <>
      <div className="admin-page-heading"><div><h1>Customers</h1><p>Customer summaries derived from paid orders.</p></div><ExportButton data={data?.customers} filename="sole-district-customers.csv" /></div>
      {loading ? <LoadingState /> : error ? <ErrorState>{error}</ErrorState> : data.customers.length ? <div className="admin-panel table-panel"><div className="table-scroll"><table className="admin-table"><thead><tr><th>Email</th><th>Paid orders</th><th>Lifetime net sales</th><th>Last order</th></tr></thead><tbody>{data.customers.map((row) => <tr key={row.email}><td>{row.email}</td><td>{row.orders}</td><td>{money(row.lifetime_spend)}</td><td>{row.last_order ? new Date(row.last_order).toLocaleDateString('en-SG') : '—'}</td></tr>)}</tbody></table></div></div> : <div className="admin-panel empty-admin"><Users size={25} /><h2>No customer orders yet</h2><p>Customer summaries appear after verified paid orders.</p></div>}
    </>
  );
}

function AnalyticsView({ days, setDays }) {
  const endpoint = '/manage/analytics/?' + rangeParams(days);
  const { data, loading, error } = useAdminData(endpoint);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  return (
    <>
      <div className="admin-page-heading"><div><h1>Analytics</h1><p>Understand your store. Make your next move.</p></div><div className="admin-heading-actions"><label className="range-select"><CalendarBlank size={17} /><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label><ExportButton data={data.daily_sales} filename="sole-district-analytics.csv" /></div></div>
      <div className="admin-metrics"><MetricCard label="Net merchandise sales" value={money(data.summary.net_sales)} note="after recorded refunds" /><MetricCard label="Paid orders" value={data.summary.paid_orders} note="Stripe confirmed" /><MetricCard label="Average order value" value={money(data.summary.average_order_value)} note="SGD" /><MetricCard label="Gross profit" value={data.summary.gross_profit === null ? '—' : money(data.summary.gross_profit)} note={data.summary.gross_profit === null ? 'product costs missing' : 'recorded product cost basis'} /></div>
      <div className="dashboard-grid analytics-grid"><section className="admin-panel sales-panel"><div className="panel-heading"><div><h2>Sales over time</h2><p>{data.range.from} to {data.range.to}</p></div></div><SalesChart rows={data.daily_sales} /></section><section className="admin-panel funnel-panel"><div className="panel-heading"><div><h2>Shopping funnel</h2><p>Only consented, deduplicated sessions</p></div></div><Funnel data={data.funnel} /></section></div>
      <div className="dashboard-grid analytics-lower"><section className="admin-panel"><div className="panel-heading"><div><h2>Size demand</h2><p>Units from paid orders by size label</p></div></div>{data.size_demand.length ? <div className="analytics-bars">{data.size_demand.map((row) => <div key={row.size}><span>{row.size}</span><i style={{ width: Math.max(4, row.units / Math.max(...data.size_demand.map((item) => item.units)) * 100) + '%' }} /><strong>{row.units}</strong></div>)}</div> : <div className="panel-empty">Size demand appears after paid orders.</div>}</section><section className="admin-panel"><div className="panel-heading"><div><h2>Campaign performance</h2><p>First-touch UTM attribution from consented sessions</p></div></div>{data.campaign_performance.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Campaign</th><th>Orders</th><th>Net sales</th></tr></thead><tbody>{data.campaign_performance.map((row, index) => <tr key={row.campaign_name + row.campaign_source + index}><td><strong>{row.campaign_name || row.campaign_source}</strong><small>{row.campaign_medium || 'Unspecified medium'}</small></td><td>{row.orders}</td><td>{money(row.revenue || 0)}</td></tr>)}</tbody></table></div> : <div className="panel-empty">No consented campaign-attributed purchases yet.</div>}</section></div>
      <p className="data-note">{data.data_note} Last refreshed {new Date(data.last_updated).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SGT.</p>
    </>
  );
}

function MarketingView({ days }) {
  const { data, loading, error } = useAdminData('/manage/analytics/?' + rangeParams(days));
  if (loading) return <LoadingState />;
  if (error) return <ErrorState>{error}</ErrorState>;
  return (
    <>
      <div className="admin-page-heading"><div><h1>Marketing</h1><p>See which tagged campaigns led to confirmed orders.</p></div></div>
      <section className="admin-panel"><div className="panel-heading"><div><h2>Campaign attribution</h2><p>First-touch UTM source captured only after analytics consent.</p></div></div>
        {data.campaign_performance.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Campaign</th><th>Source</th><th>Medium</th><th>Paid orders</th><th>Net sales</th></tr></thead><tbody>{data.campaign_performance.map((row, index) => <tr key={row.campaign_name + row.campaign_source + index}><td>{row.campaign_name || '—'}</td><td>{row.campaign_source || '—'}</td><td>{row.campaign_medium || '—'}</td><td>{row.orders}</td><td>{money(row.revenue || 0)}</td></tr>)}</tbody></table></div> : <div className="panel-empty">No campaign-attributed purchases in this period. Add UTM tags to campaign links; attribution begins only when a shopper allows analytics.</div>}
      </section>
      <div className="settings-callout"><Megaphone size={21} /><div><strong>Discount codes are not active in checkout.</strong><p>The store avoids showing promotional controls until code validation and Stripe totals are wired end to end.</p></div></div>
    </>
  );
}

function SettingsView() {
  const { store } = useShop();
  return (
    <>
      <div className="admin-page-heading"><div><h1>Settings</h1><p>Store status and launch configuration.</p></div></div>
      <div className="settings-grid">
        <section className="admin-panel"><span className="eyebrow">COMMERCE</span><h2>Checkout status</h2><p>{store.checkout_ready ? 'Stripe checkout is configured.' : 'Stripe checkout is disabled.'}</p><span className={'status-pill ' + (store.checkout_ready ? 'status-paid' : '')}>{store.mode || 'unconfigured'} mode</span><p className="muted">Before launch, configure the Stripe secret and webhook in the backend environment. Enable PayNow in the eligible Singapore Stripe account, link the DBS payout account in Stripe, and verify payment methods.</p></section>
        <section className="admin-panel"><span className="eyebrow">CATALOGUE</span><h2>Product readiness</h2><p>Only active, non-illustrative products with verified sourcing status can be sold.</p><p className="muted">Current sample records are clearly marked as illustrative and cannot reach Stripe checkout.</p></section>
        <section className="admin-panel"><span className="eyebrow">STAFF ACCESS</span><h2>Role groups</h2><ul className="role-list"><li>Owner: all workspace sections</li><li>Catalogue: products and inventory</li><li>Warehouse: inventory and fulfilment</li><li>Support: orders, returns and customers</li><li>Analyst: reports and customer summaries</li></ul><p className="muted">Manage staff accounts and groups through the protected Django admin.</p></section>
        <section className="admin-panel"><span className="eyebrow">ANALYTICS</span><h2>Consent and retention</h2><p>Optional browser events are collected only after the shopper opts in. Confirmed purchases are recorded by Stripe webhooks.</p><p className="muted">Configured event retention: {180} days by default; run the event cleanup command on a schedule.</p></section>
      </div>
    </>
  );
}

function AdminLogin({ onSignedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('manage/login/', { method: 'POST', body: JSON.stringify({ username, password }) });
      onSignedIn(result);
    } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <main className="admin-login"><Link to="/" className="wordmark">SOLE DISTRICT</Link><span className="eyebrow">MERCHANT WORKSPACE</span><h1>Staff sign in</h1><p>Use a Django staff account. Customer accounts do not have merchant access.</p><form className="auth-form" onSubmit={submit}><label>Staff username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <ErrorState>{error}</ErrorState>}<button className="admin-button admin-button-dark" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={18} /></button></form></main>;
}

export function AdminApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState('');
  const pagePath = location.pathname.replace(/\/+$/, '') || '/manage';
  useEffect(() => {
    let alive = true;
    api('manage/session/').then((data) => { if (alive) setAuth(data.authenticated ? data : false); }).catch(() => { if (alive) setAuth(false); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const logout = async () => {
    try { await api('manage/logout/', { method: 'POST', body: '{}' }); } catch {}
    setAuth(false);
    navigate('/manage/login');
  };
  if (loading) return <div className="admin-loading admin-loading-full"><span className="loading-dot" />Loading merchant workspace…</div>;
  if (!auth) return <AdminLogin onSignedIn={(data) => { setAuth(data); navigate('/manage'); }} />;

  const title = NAV.find((item) => item.path === pagePath)?.label || (pagePath === '/manage/marketing' ? 'Marketing' : pagePath === '/manage/analytics' ? 'Analytics' : 'Overview');
  const activePath = pagePath === '/manage' || pagePath === '/manage/overview' ? '/manage' : pagePath;
  return (
    <div className="merchant-app">
      <aside className="merchant-sidebar">
        <Link to="/" className="merchant-brand"><span className="wordmark">SOLE DISTRICT</span><small>Merchant workspace</small></Link>
        <nav aria-label="Merchant navigation">{NAV.map((item) => {
          const Icon = item.icon;
          return <Link key={item.path} to={item.path} className={activePath === item.path ? 'active' : ''}><Icon size={20} weight={activePath === item.path ? 'fill' : 'regular'} />{item.label}</Link>;
        })}</nav>
        <div className="sidebar-bottom"><Link to="/" className="view-store-link"><ArrowSquareOut size={18} />View storefront <ArrowRight size={17} /></Link><div className="merchant-profile"><span className="profile-avatar">SD</span><span><strong>{auth.name || 'Staff'}</strong><small>{(auth.roles || ['owner']).join(', ')}</small></span><button className="icon" aria-label="Sign out" onClick={logout}><SignOut size={18} /></button></div></div>
      </aside>
      <section className="merchant-content">
        <header className="merchant-topbar"><form className="merchant-search" onSubmit={(event) => event.preventDefault()}><MagnifyingGlass size={19} /><input aria-label="Search store records" placeholder="Search orders, products and customers" value={search} onChange={(event) => setSearch(event.target.value)} /><button type="button" className="icon" aria-label="Clear search" onClick={() => setSearch('')}><X size={17} /></button></form><div className="merchant-top-actions"><span className="merchant-notice-dot" aria-hidden="true" /><Bell size={20} /><span className="profile-avatar small">SD</span></div></header>
        <main className="merchant-main">
          {pagePath === '/manage' || pagePath === '/manage/overview' ? <DashboardView days={days} setDays={setDays} /> :
            pagePath === '/manage/orders' ? <OrdersView search={search} /> :
            pagePath === '/manage/products' ? <ProductsView search={search} /> :
            pagePath === '/manage/inventory' ? <InventoryView search={search} /> :
            pagePath === '/manage/returns' ? <ReturnsView /> :
            pagePath === '/manage/customers' ? <CustomersView search={search} /> :
            pagePath === '/manage/analytics' ? <AnalyticsView days={days} setDays={setDays} /> :
            pagePath === '/manage/marketing' ? <MarketingView days={days} /> :
            pagePath === '/manage/settings' ? <SettingsView /> :
            <DashboardView days={days} setDays={setDays} />}
          <footer className="merchant-footnote"><span>{title}</span><span>Singapore / SGD</span></footer>
        </main>
      </section>
    </div>
  );
}
