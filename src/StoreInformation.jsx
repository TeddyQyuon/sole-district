import { useEffect, useState } from 'react';
import { api } from './shop';

export function PublishedPolicy({ kind, fallbackTitle, fallbackCopy }) {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true; api('policies/').then((result) => { if (alive) setData(result); }).catch(() => {}); return () => { alive = false; }; }, []);
  const policy = data?.policies.find((row) => row.slug === kind);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { const result = await api('contact/', { method: 'POST', body: JSON.stringify(values) }); setMessage(result.message + ' Reference: ' + result.reference); }
    catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <><h1>{policy?.title || fallbackTitle}</h1><p className="policy-text">{policy?.body || fallbackCopy}</p>
    {kind === 'store' && data?.contact_ready && <section className="account-card"><h2>Contact the store</h2><form className="auth-form" onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Subject<input name="subject" maxLength={160} required /></label><label>Message<textarea name="message" minLength={10} maxLength={4000} required /></label><button className="button button-dark" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button>{message && <p role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}</form></section>}
  </>;
}

export function PolicyEditor({ policies, onSaved }) {
  const [slug, setSlug] = useState('delivery');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const policy = policies.find((row) => row.slug === slug);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try { await api('manage/policies/', { method: 'POST', body: JSON.stringify({ slug, title: form.get('title'), body: form.get('body'), published: form.get('published') === 'on' }) }); setMessage('Store information saved.'); onSaved(); }
    catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <section className="admin-panel"><h2>Store policies</h2><p>Enter reviewed policies and your actual store contact details. Delivery and tax terms must match your configured checkout. Publishing requires your approval.</p><label>Page<select value={slug} onChange={(event) => { setSlug(event.target.value); setMessage(''); }}>{['delivery', 'returns', 'privacy', 'terms', 'store'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><form key={slug + (policy?.body || '')} className="form-grid" onSubmit={submit}><label className="full">Title<input name="title" defaultValue={policy?.title || ''} required maxLength={120} /></label><label className="full">Reviewed policy text<textarea name="body" defaultValue={policy?.body || ''} required minLength={50} maxLength={30000} rows={10} /></label><label className="check-field full"><input name="published" type="checkbox" defaultChecked={policy?.published || false} />I reviewed and approve publishing this policy</label><button className="admin-button admin-button-dark" disabled={busy}>Save policy</button>{message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}</form></section>;
}
