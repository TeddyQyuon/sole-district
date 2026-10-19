import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './shop';
import { AddressAutocomplete } from './components/AddressAutocomplete';

function useEmailLink() {
  const [link] = useState(() => ({
    purpose: new URLSearchParams(window.location.search).get('action'),
    token: new URLSearchParams(window.location.hash.slice(1)).get('token') || '',
  }));
  useEffect(() => {
    if (link.token) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [link.token]);
  return link;
}

export function GuestAccess({ onAccess }) {
  const link = useEmailLink();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const result = link.token && !used
        ? await api('auth/token/', { method: 'POST', body: JSON.stringify({ purpose: 'order', token: link.token }) })
        : await api('auth/email/', { method: 'POST', body: JSON.stringify({ ...values, purpose: 'order' }) });
      setMessage(result.message);
      if (link.token && !used) { setUsed(true); onAccess(); }
    } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  return <details className="account-card" open={Boolean(link.token)}><summary>Access a guest order</summary><form className="auth-form" onSubmit={submit}>
    {link.token && !used ? <p>Open the order from your email. Access lasts 30 minutes.</p> : <><label>Order reference<input name="reference" required autoComplete="off" placeholder="SD…" /></label><label>Checkout email<input name="email" type="email" required autoComplete="email" /></label></>}
    <button className="button button-dark" disabled={busy}>{busy ? 'Please wait…' : link.token && !used ? 'Open my order' : 'Email an order link'}</button>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
  </form></details>;
}

const emptyAddress = { label: 'Home', recipient: '', phone: '', line1: '', line2: '', postal_code: '', is_default: false };

export function Account() {
  const link = useEmailLink();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(link.token ? link.purpose : 'login');
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    const data = await api('auth/me/');
    setUser(data.authenticated ? data.user : null);
    if (data.authenticated) setAddresses((await api('auth/addresses/')).addresses);
  };
  useEffect(() => { load().catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  const run = async (operation) => {
    setBusy(true); setMessage(''); setError('');
    try { await operation(); } catch (reason) { setError(reason.message); } finally { setBusy(false); }
  };
  const submit = (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    run(async () => {
      if (['reset', 'verify'].includes(mode) && link.token) {
        const result = await api('auth/token/', { method: 'POST', body: JSON.stringify({ ...form, purpose: mode, token: link.token }) });
        setMessage(result.message); setMode('login'); await load(); return;
      }
      if (mode === 'forgot') {
        const result = await api('auth/email/', { method: 'POST', body: JSON.stringify({ ...form, purpose: 'reset' }) });
        setMessage(result.message); return;
      }
      await api('auth/' + (mode === 'register' ? 'register/' : 'login/'), { method: 'POST', body: JSON.stringify(form) });
      await load(); setMessage(mode === 'register' ? 'Account created. Check your email to verify your address.' : 'You are signed in.');
    });
  };
  const saveAddress = (event) => {
    event.preventDefault();
    run(async () => {
      await api('auth/addresses/', { method: address.id ? 'PATCH' : 'POST', body: JSON.stringify(address) });
      setAddress(emptyAddress); await load(); setMessage('Address saved.');
    });
  };
  if (loading) return <div className="section"><p role="status">Loading your account…</p></div>;
  const emailAction = ['reset', 'verify'].includes(mode) && link.token;
  return <div className="section account-page"><span className="eyebrow">YOUR DISTRICT</span><h1>{emailAction ? mode === 'reset' ? 'Choose a new password' : 'Verify your email' : user ? 'Your account' : mode === 'forgot' ? 'Reset your password' : mode === 'register' ? 'Create an account' : 'Sign in'}</h1>
    {message && <p className="notice notice-soft" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
    {user && !emailAction ? <div className="account-grid"><section className="account-card"><h2>Welcome back</h2><p>{user.name || user.email}</p><p>{user.email_verified ? 'Email verified' : 'Your email needs verification.'}</p>
      {!user.email_verified && <button className="underlined" disabled={busy} onClick={() => run(async () => { const data = await api('auth/email/', { method: 'POST', body: JSON.stringify({ purpose: 'verify', email: user.email }) }); setMessage(data.message); })}>Resend verification email</button>}
      <p><Link className="underlined" to="/orders">View your orders</Link></p><button className="text-button" disabled={busy} onClick={() => run(async () => { await api('auth/logout/', { method: 'POST', body: '{}' }); setUser(null); setAddresses([]); })}>Sign out</button></section>
      <section className="account-card"><h2>Saved delivery addresses</h2>{addresses.map((row) => <div className="address-row" key={row.id}><strong>{row.label}{row.is_default ? ' · Default' : ''}</strong><span>{row.recipient}, {row.line1} {row.line2}, Singapore {row.postal_code}</span><div><button className="underlined" disabled={busy} onClick={() => setAddress(row)}>Edit</button>{' · '}<button className="underlined" disabled={busy} onClick={() => run(async () => { await api('auth/addresses/', { method: 'DELETE', body: JSON.stringify({ id: row.id }) }); await load(); })}>Delete</button></div></div>)}
        <form className="account-address-form" onSubmit={saveAddress}>
          <div className="label-field-wrapper">
            <label><span>Address label</span><input value={address.label || ''} placeholder="e.g. Home, Office, Studio" onChange={(e) => setAddress({ ...address, label: e.target.value })} /></label>
          </div>
          <AddressAutocomplete value={address} onChange={setAddress} showContact={true} />
          <label className="check-field"><input type="checkbox" checked={address.is_default} onChange={(event) => setAddress({ ...address, is_default: event.target.checked })} />Set as default delivery address</label>
          <div className="address-form-actions">
            <button className="button button-dark" disabled={busy}>{address.id ? 'Save changes' : 'Save address'}</button>
            {address.id && <button type="button" className="text-button" onClick={() => setAddress(emptyAddress)}>Cancel editing</button>}
          </div>
        </form>
      </section></div> : <form className="auth-form" onSubmit={submit}>
      {mode === 'register' && <label>Name<input name="name" autoComplete="name" maxLength={120} /></label>}
      {!emailAction && <label>Email<input name="email" type="email" required autoComplete="email" /></label>}
      {!['forgot', 'verify'].includes(mode) && <label>{mode === 'reset' ? 'New password' : 'Password'}<input name="password" type="password" required minLength={8} autoComplete={['register', 'reset'].includes(mode) ? 'new-password' : 'current-password'} /></label>}
      <button className="button button-dark" disabled={busy}>{busy ? 'Please wait…' : mode === 'forgot' ? 'Email a reset link' : mode === 'reset' ? 'Reset password' : mode === 'verify' ? 'Verify email' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
      <p><button type="button" className="underlined" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button>{' · '}<button type="button" className="underlined" onClick={() => { setMode(mode === 'forgot' ? 'login' : 'forgot'); setError(''); }}>{mode === 'forgot' ? 'Back to sign in' : 'Forgot password?'}</button></p>
    </form>}
  </div>;
}
