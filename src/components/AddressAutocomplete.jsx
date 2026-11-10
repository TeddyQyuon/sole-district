import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import {
  MagnifyingGlass,
  MapPin,
  CheckCircle,
  Buildings,
  Briefcase,
  HouseLine,
  ShieldCheck,
  X,
  ArrowCounterClockwise,
} from '@phosphor-icons/react';
import {
  lookupSingaporeAddress,
  getPostalSectorInfo,
  validateSingaporePhone,
  normalizeUnitNumber,
  validateSingaporeAddress,
  checkStreetPostalConsistency,
} from '../utils/singaporeAddress';

const PROPERTY_TYPES = [
  { id: 'highrise', label: 'Apartment', icon: Buildings },
  { id: 'commercial', label: 'Office', icon: Briefcase },
  { id: 'landed', label: 'Landed house', icon: HouseLine },
];

export function AddressAutocomplete({
  value = { recipient: '', phone: '', line1: '', line2: '', postal_code: '', building: '', property_type: 'highrise' },
  onChange,
  onValidityChange,
  disabled = false,
  showContact = true,
  requirePhone = true,
  className = '',
}) {
  const fieldId = useId();
  const propertyType = value.property_type || 'highrise';
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState([]);
  const [verifiedMatches, setVerifiedMatches] = useState([]);
  const [postalLookupStatus, setPostalLookupStatus] = useState(null); // 'verified' | 'not_found' | 'invalid_sector' | 'offline' | 'partial_digits' | null
  const [lookupMessage, setLookupMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [touched, setTouched] = useState({});
  const [checkFeedback, setCheckFeedback] = useState(null); // { ok: boolean, text: string }

  const unitRef = useRef(null);
  const containerRef = useRef(null);
  const suppressSearchRef = useRef(false);
  const lastVerifiedPostalRef = useRef('');

  // Reset internal lookup state when parent resets the form (e.g. after saving in Account) or switches address ID
  useEffect(() => {
    if (!value.postal_code && !value.line1 && !value.recipient) {
      setSearchInput('');
      setResults([]);
      setVerifiedMatches([]);
      setPostalLookupStatus(null);
      setLookupMessage('');
      setTouched({});
      setCheckFeedback(null);
      lastVerifiedPostalRef.current = '';
    }
  }, [value.id, value.postal_code, value.line1, value.recipient]);

  // Whenever value.postal_code becomes a valid 6-digit Singapore postal code (e.g. typed directly in Postal Code box or loaded on Edit),
  // verify it against OneMap automatically so we know if it truly exists and whether Street Address matches!
  useEffect(() => {
    const postal = String(value.postal_code || '').trim();
    if (!postal) {
      setPostalLookupStatus(null);
      setVerifiedMatches([]);
      lastVerifiedPostalRef.current = '';
      return undefined;
    }

    const sectorCheck = getPostalSectorInfo(postal);
    if (!sectorCheck.validFormat) {
      setPostalLookupStatus(null);
      setVerifiedMatches([]);
      return undefined;
    }
    if (!sectorCheck.validSector) {
      setPostalLookupStatus('invalid_sector');
      setLookupMessage(sectorCheck.reason);
      setVerifiedMatches([]);
      return undefined;
    }

    if (lastVerifiedPostalRef.current === postal && (postalLookupStatus === 'verified' || postalLookupStatus === 'not_found')) {
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);

    lookupSingaporeAddress(postal, { signal: controller.signal })
      .then((res) => {
        if (!active) return;
        lastVerifiedPostalRef.current = postal;
        setPostalLookupStatus(res.status);
        setLookupMessage(res.message || '');
        if (res.status === 'verified' && res.results.length > 0) {
          setVerifiedMatches(res.results);
          // Auto-fill street ONLY if line1 is currently empty
          if (!String(value.line1 || '').trim()) {
            const top = res.results[0];
            onChange({
              ...value,
              line1: top.line1,
              building: top.building || '',
              postal_code: top.postalCode || postal,
              property_type: value.property_type || top.propertyType || 'highrise',
            });
          }
          if (res.results.length > 1) {
            setResults(res.results);
          }
        } else {
          setVerifiedMatches([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [value.postal_code]);

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search bar lookup (smartly gated: waits for all 6 digits on numeric input, or 3+ chars on building/road text)
  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return undefined;
    }

    const clean = searchInput.trim();
    if (!clean) {
      setResults([]);
      setIsOpen(false);
      return undefined;
    }

    if (/^[0-9]+$/.test(clean) && clean.length < 6) {
      setResults([]);
      setIsOpen(false);
      return undefined;
    }

    if (!/^[0-9]+$/.test(clean) && clean.length < 3) {
      setResults([]);
      setIsOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    const delay = /^[0-9]{6}$/.test(clean) ? 80 : 280;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const outcome = await lookupSingaporeAddress(clean, { signal: controller.signal });
        if (!active) return;

        if (outcome.status === 'verified' && outcome.results.length > 0) {
          setResults(outcome.results);
          setHighlightedIdx(0);

          // If user typed an exact 6-digit postal code with a single unambiguous building, select immediately
          if (/^[0-9]{6}$/.test(clean) && outcome.results.length === 1) {
            handleSelectResult(outcome.results[0], outcome.results);
          } else {
            setIsOpen(true);
          }
        } else {
          setResults([]);
          setIsOpen(false);
          if (/^[0-9]{6,}$/.test(clean)) {
            setPostalLookupStatus(outcome.status);
            setLookupMessage(outcome.message);
            // Sync invalid postal into postal_code field so validation clearly highlights why it failed
            if (clean.length === 6 && value.postal_code !== clean) {
              onChange({ ...value, postal_code: clean });
              setTouched((prev) => ({ ...prev, postal_code: true }));
            }
          } else if (outcome.status === 'not_found') {
            setLookupMessage(outcome.message);
            setPostalLookupStatus('search_empty');
          }
        }
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.warn('Singapore address lookup warning:', err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput]);

  const handleSelectResult = (item, allForPostal = [item]) => {
    suppressSearchRef.current = true;
    lastVerifiedPostalRef.current = item.postalCode || '';
    const inferredType = item.propertyType || propertyType || 'highrise';
    const nextAddress = {
      ...value,
      line1: item.line1,
      building: item.building || '',
      postal_code: item.postalCode || value.postal_code,
      property_type: inferredType,
    };
    onChange(nextAddress);
    setVerifiedMatches(allForPostal);
    setPostalLookupStatus('verified');
    const sec = getPostalSectorInfo(item.postalCode);
    setLookupMessage(
      sec.district
        ? `OneMap Verified · ${sec.district} (${sec.area})`
        : 'Verified in Singapore Postal Registry',
    );
    setSearchInput(
      item.building
        ? `${item.postalCode} — ${item.building} (${item.line1})`
        : `${item.postalCode} — ${item.line1}`,
    );
    setIsOpen(false);
    setCheckFeedback(null);
    setTouched((prev) => ({ ...prev, postal_code: true, line1: true }));

    if (inferredType !== 'landed') {
      setTimeout(() => {
        unitRef.current?.focus();
      }, 90);
    }
  };

  const updateField = (field, fieldValue) => {
    setCheckFeedback(null);
    onChange({ ...value, [field]: fieldValue });
  };

  const markTouched = (field) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  // Real-time validation computation
  const validation = useMemo(
    () =>
      validateSingaporeAddress(value, {
        requireContact: showContact,
        requirePhone,
        propertyType,
        postalLookupStatus,
        verifiedMatches,
      }),
    [value, showContact, requirePhone, propertyType, postalLookupStatus, verifiedMatches],
  );

  const phoneCheck = useMemo(
    () => validateSingaporePhone(value.phone, { required: requirePhone }),
    [value.phone, requirePhone],
  );

  const streetConsistency = useMemo(
    () =>
      postalLookupStatus === 'verified' && verifiedMatches.length > 0
        ? checkStreetPostalConsistency(value.line1, verifiedMatches)
        : { consistent: true, expectedStreet: null },
    [value.line1, postalLookupStatus, verifiedMatches],
  );

  useEffect(() => {
    if (typeof onValidityChange === 'function') {
      onValidityChange(validation);
    }
  }, [validation, onValidityChange]);

  const handleSearchKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightedIdx >= 0 && results[highlightedIdx]) {
      e.preventDefault();
      handleSelectResult(results[highlightedIdx], results);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleRunInteractiveCheck = () => {
    setTouched({
      recipient: true,
      phone: true,
      postal_code: true,
      line1: true,
      line2: true,
    });
    if (validation.valid) {
      const distLabel = validation.postalInfo?.district
        ? `${validation.postalInfo.district} · ${validation.postalInfo.area}`
        : 'Singapore';
      setCheckFeedback({
        ok: true,
        text: `Address verified & ready for courier dispatch (${distLabel}).`,
      });
    } else {
      const firstErr = Object.values(validation.errors)[0];
      setCheckFeedback({
        ok: false,
        text: firstErr || 'Please fix the highlighted delivery fields above.',
      });
    }
  };

  const isPostalVerified = postalLookupStatus === 'verified' && streetConsistency.consistent && !validation.errors.postal_code;
  const isPostalRejected =
    postalLookupStatus === 'not_found' ||
    postalLookupStatus === 'invalid_sector' ||
    (touched.postal_code && Boolean(validation.errors.postal_code));

  const renderField = (key, label, { hint, prefix, onBlur, ...inputProps } = {}) => {
    const error = (touched[key] || (key === 'postal_code' && isPostalRejected)) && validation.errors[key];
    const id = `${fieldId}-${key}`;
    return (
      <div className={`delivery-field ${error ? 'has-error' : ''}`}>
        <label htmlFor={id}>{label}</label>
        <div className={prefix ? 'delivery-input-prefix' : undefined}>
          {prefix && <span aria-hidden="true">{prefix}</span>}
          <input
            {...inputProps}
            id={id}
            name={key}
            disabled={disabled}
            value={key === 'phone' ? (value.phone || '').replace(/^\+65\s*/, '') : value[key] || ''}
            aria-invalid={Boolean(error)}
            aria-describedby={error || hint ? `${id}-hint` : undefined}
            onBlur={() => { markTouched(key); onBlur?.(); }}
            onChange={(event) => {
              let text = event.target.value;
              if (key === 'postal_code') {
                text = text.replace(/\D/g, '').slice(0, 6);
                lastVerifiedPostalRef.current = '';
              }
              if (key === 'phone') text = text.replace(/[^\d\s\-+]/g, '').slice(0, 14);
              updateField(key, text);
            }}
          />
        </div>
        {(error || hint) && <small id={`${id}-hint`} className={error ? 'delivery-error' : 'delivery-hint'}>{error || hint}</small>}
      </div>
    );
  };

  return (
    <div className={`delivery-address-form ${className}`} ref={containerRef}>
      {showContact && (
        <div className="delivery-grid delivery-contact">
          {renderField('recipient', 'Full name', {
            autoComplete: 'shipping name', placeholder: 'Name of recipient', required: true,
          })}
          {renderField('phone', 'Phone number', {
            type: 'tel', autoComplete: 'shipping tel-national', placeholder: '8123 4567',
            prefix: '+65', required: requirePhone,
            onBlur: () => {
              if (phoneCheck.valid && phoneCheck.formatted) updateField('phone', phoneCheck.formatted);
            },
          })}
        </div>
      )}

      <div className="delivery-lookup">
        <div className="delivery-lookup-heading">
          <label htmlFor={`${fieldId}-search`}>Find your address</label>
          <span className="delivery-lookup-status" role="status">
            {loading ? 'Searching…' : isPostalVerified ? <><CheckCircle size={14} weight="fill" /> Address found</> : 'Singapore'}
          </span>
        </div>
        <div className="delivery-search-shell">
          <MagnifyingGlass size={19} aria-hidden="true" />
          <input
            id={`${fieldId}-search`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={!disabled && isOpen && results.length > 0}
            aria-controls={!disabled && isOpen && results.length > 0 ? `${fieldId}-results` : undefined}
            aria-activedescendant={!disabled && isOpen && highlightedIdx >= 0 ? `${fieldId}-result-${highlightedIdx}` : undefined}
            aria-describedby={`${fieldId}-search-hint`}
            autoComplete="off"
            placeholder="Postal code or building name"
            value={searchInput}
            disabled={disabled}
            onChange={(e) => { setSearchInput(e.target.value); setCheckFeedback(null); }}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            onKeyDown={handleSearchKeyDown}
          />
          {loading ? <span className="delivery-search-spinner" aria-hidden="true" /> : searchInput && (
            <button type="button" className="delivery-clear" aria-label="Clear address search" disabled={disabled}
              onClick={() => { setSearchInput(''); setResults([]); setIsOpen(false); }}><X size={16} /></button>
          )}
          {!disabled && isOpen && results.length > 0 && (
            <ul id={`${fieldId}-results`} className="delivery-results" role="listbox" aria-label="Matching addresses">
              {results.map((item, index) => (
                <li key={`${item.postalCode}-${item.building}-${index}`} id={`${fieldId}-result-${index}`}
                  role="option" aria-selected={highlightedIdx === index}
                  className={highlightedIdx === index ? 'highlighted' : ''}
                  onMouseEnter={() => setHighlightedIdx(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectResult(item, results)}>
                  <MapPin size={18} aria-hidden="true" />
                  <div><strong>{item.building || item.line1}</strong><span>{item.line1} · Singapore {item.postalCode}</span></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p id={`${fieldId}-search-hint`} className="delivery-hint">
          {/^[0-9]{1,5}$/.test(searchInput.trim())
            ? `Enter all 6 digits (${searchInput.trim().length}/6).`
            : 'Search to autofill, or enter your address below.'}
        </p>
        {['not_found', 'invalid_sector', 'search_empty', 'offline'].includes(postalLookupStatus) && lookupMessage && (
          <p className={postalLookupStatus === 'offline' ? 'delivery-hint' : 'delivery-error'} role="status">{lookupMessage}</p>
        )}
      </div>

      {verifiedMatches.length > 1 && (
        <div className="delivery-building-options">
          <span>Choose your building</span>
          {verifiedMatches.map((item, index) => (
            <button key={index} type="button" disabled={disabled}
              aria-pressed={value.line1 === item.line1 && value.building === item.building}
              onClick={() => handleSelectResult(item, verifiedMatches)}>{item.building || item.line1}</button>
          ))}
        </div>
      )}

      <div className="delivery-grid delivery-address-fields">
        <div className="delivery-street">
          {renderField('line1', 'Street address', {
            autoComplete: 'shipping address-line1', placeholder: 'Block / house number and street', required: true,
          })}
          {!streetConsistency.consistent && streetConsistency.expectedStreet && (
            <div className="delivery-street-fix">
              <p className="delivery-error">Use the street for this postal code: {streetConsistency.expectedStreet}</p>
              <button type="button" disabled={disabled} onClick={() => updateField('line1', verifiedMatches[0].line1)}>
                <ArrowCounterClockwise size={14} /> Use suggested street
              </button>
            </div>
          )}
          {value.building && <span className="delivery-hint">{value.building}</span>}
        </div>
        {renderField('postal_code', 'Postal code', {
          inputMode: 'numeric', autoComplete: 'shipping postal-code', maxLength: 6,
          placeholder: '6-digit postal code', required: true,
        })}
        {renderField('line2', propertyType === 'landed' ? 'Unit number (optional)' : 'Unit number', {
          ref: unitRef, autoComplete: 'shipping address-line2',
          placeholder: propertyType === 'landed' ? 'Unit / floor, if applicable' : '#08-124',
          required: propertyType !== 'landed',
          onBlur: () => {
            const unit = normalizeUnitNumber(value.line2);
            if (unit && unit !== value.line2) updateField('line2', unit);
          },
        })}
      </div>

      <div className="delivery-property" role="group" aria-label="Property type">
        <span className="delivery-field-label">Property type</span>
        <div className="delivery-property-options">
          {PROPERTY_TYPES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" disabled={disabled} aria-pressed={propertyType === id}
              onClick={() => updateField('property_type', id)}>
              <Icon size={17} aria-hidden="true" /><span>{label}</span>
              {propertyType === id && <CheckCircle size={14} weight="fill" className="delivery-property-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>

      <div className="delivery-form-footer">
        <span><ShieldCheck size={16} aria-hidden="true" />Your details are used for delivery.</span>
        <button type="button" disabled={disabled || loading} onClick={handleRunInteractiveCheck}>Check address</button>
      </div>
      {checkFeedback && <p className={checkFeedback.ok ? 'delivery-success' : 'delivery-error'} role={checkFeedback.ok ? 'status' : 'alert'}>
        {checkFeedback.ok ? 'Your delivery details are ready.' : checkFeedback.text}
      </p>}
    </div>
  );
}
