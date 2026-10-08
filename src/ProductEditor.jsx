import { useEffect, useState } from 'react';
import { Dialog } from './App';
import { api } from './shop';

export function ProductEditor({ productId, canReview, onClose, onSaved }) {
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true; api('manage/products/' + productId + '/').then((data) => { if (alive) { setProduct(data); setImages(data.images); } }).catch((reason) => { if (alive) setError(reason.message); }); return () => { alive = false; }; }, [productId]);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api('manage/products/' + productId + '/', { method: 'PATCH', body: JSON.stringify({
        name: form.get('name'), colour: form.get('colour'), description: form.get('description'),
        details: form.get('details'), price_cents: Math.round(Number(form.get('price')) * 100),
        status: form.get('status'), is_illustrative: form.get('illustrative') === 'on',
        images, variants: product.variants.map((variant) => ({ ...variant,
          price_cents: form.get('price:' + variant.sku) === '' ? null : Math.round(Number(form.get('price:' + variant.sku)) * 100),
          cost_cents: form.get('cost:' + variant.sku) === '' ? null : Math.round(Number(form.get('cost:' + variant.sku)) * 100),
          active: form.get('active:' + variant.sku) === 'on' })) }) });
      setMessage('Product saved. Review sourcing again after changes to identity or photos.'); onSaved();
    } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  const review = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await api('manage/products/' + productId + '/sourcing/', { method: 'POST', body: JSON.stringify(values) }); setMessage('Private sourcing review recorded.'); onSaved(); }
    catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <Dialog title="Product details" onClose={onClose}>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!product ? <p>Loading product…</p> : <><form className="form-grid" onSubmit={submit}>
      <label>Name<input name="name" defaultValue={product.name} required maxLength={180} /></label><label>Colour<input name="colour" defaultValue={product.color} maxLength={120} /></label>
      <label>Price (SGD)<input name="price" type="number" min="0.01" step="0.01" defaultValue={product.price / 100} required /></label><label>Listing<select name="status" defaultValue={product.status}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
      <label className="full">Description<textarea name="description" defaultValue={product.description} maxLength={4000} /></label><label className="full">Details and care<textarea name="details" defaultValue={product.detail} maxLength={4000} /></label>
      <label className="check-field full"><input name="illustrative" type="checkbox" defaultChecked={product.illustrative} />Illustrative product; cannot be purchased</label>
      <fieldset className="full"><legend>Product photos</legend>{images.map((image, index) => <div className="form-grid" key={index}><label>Photo URL<input type="text" required value={image.url} onChange={(event) => setImages((rows) => rows.map((row, i) => i === index ? { ...row, url: event.target.value } : row))} /></label><label>Alternative text<input required maxLength={240} value={image.alt} onChange={(event) => setImages((rows) => rows.map((row, i) => i === index ? { ...row, alt: event.target.value } : row))} /></label><button type="button" className="underlined" onClick={() => setImages((rows) => rows.filter((_, i) => i !== index))}>Remove photo {index + 1}</button></div>)}<button type="button" className="underlined" disabled={images.length >= 12} onClick={() => setImages((rows) => [...rows, { url: '', alt: '' }])}>Add photo</button></fieldset>
      <fieldset className="full"><legend>Sizes and colours</legend>{product.variants.map((variant) => <div className="form-grid" key={variant.sku}><p className="full">{variant.sku} · {variant.size_system} {variant.size} · {variant.colour}</p><label>Price override (SGD)<input name={'price:' + variant.sku} type="number" min="0.01" step="0.01" defaultValue={variant.price_cents === null ? '' : variant.price_cents / 100} /></label><label>Recorded unit cost (SGD)<input name={'cost:' + variant.sku} type="number" min="0" step="0.01" defaultValue={variant.cost_cents === null ? '' : variant.cost_cents / 100} /></label><label className="check-field"><input name={'active:' + variant.sku} type="checkbox" defaultChecked={variant.active} />Available in catalogue</label></div>)}</fieldset>
      <button className="button button-dark" disabled={busy}>Save product</button></form>
      {canReview && <details className="account-card"><summary>Private sourcing review</summary><p>Record references to actual supplier documents and completed physical checks. These references stay private.</p><form className="form-grid" onSubmit={review}>{[['supplier', 'Supplier'], ['invoice_reference', 'Invoice reference'], ['evidence_reference', 'Private evidence reference']].map(([key, label]) => <label key={key}>{label}<input name={key} required maxLength={key === 'evidence_reference' ? 500 : 180} /></label>)}<label>Decision<select name="status"><option value="in_review">In review</option><option value="verified">Verified after completed checks</option><option value="rejected">Rejected</option></select></label><label className="full">Review notes<textarea name="notes" maxLength={4000} /></label><button className="button button-dark" disabled={busy}>Record review</button></form></details>}
    </>}
  </Dialog>;
}
