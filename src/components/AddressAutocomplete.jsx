import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MagnifyingGlass,
  MapPin,
  CheckCircle,
  WarningCircle,
  Buildings,
  Briefcase,
  HouseLine,
  Phone,
  ShieldCheck,
  X,
  ArrowCounterClockwise,
  Sparkle,
} from '@phosphor-icons/react';
import {
  lookupSingaporeAddress,
  getPostalSectorInfo,
  validateSingaporePhone,
  validateSingaporeUnit,
  normalizeUnitNumber,
  validateSingaporeAddress,
  checkStreetPostalConsistency,
} from '../utils/singaporeAddress';

const SAMPLE_POSTALS = [
  { code: '238801', label: '238801 · ION Orchard' },
  { code: '018956', label: '018956 · Marina Bay' },
  { code: '569830', label: '569830 · Ang Mo Kio' },
];

const PROPERTY_TYPES = [
  { id: 'highrise', label: 'HDB / Condo / Apt', icon: Buildings },
  { id: 'commercial', label: 'Office / Campus', icon: Briefcase },
  { id: 'landed', label: 'Landed House', icon: HouseLine },
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

  const unitCheck = useMemo(
    () => validateSingaporeUnit(value.line2, { propertyType }),
    [value.line2, propertyType],
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

  const postalInfo = validation.postalInfo;
  const isPostalVerified = postalLookupStatus === 'verified' && streetConsistency.consistent && !validation.errors.postal_code;
  const isPostalRejected =
    postalLookupStatus === 'not_found' ||
    postalLookupStatus === 'invalid_sector' ||
    (touched.postal_code && Boolean(validation.errors.postal_code));

  return (
    <div className={`address-autocomplete-container sg-validator-v2 ${className}`} ref={containerRef}>
      {/* Top Validator Status Strip */}
      <div className="sg-validator-status-bar">
        <div className="sg-validator-status-left">
          <ShieldCheck size={17} weight="duotone" />
          <span>Singapore Postal &amp; OneMap Registry Validator</span>
        </div>
        <div className="sg-validator-badges">
          {loading ? (
            <span className="sg-status-pill pill-checking">Checking OneMap…</span>
          ) : isPostalVerified ? (
            <span className="sg-status-pill pill-verified">
              <CheckCircle size={14} weight="fill" /> OneMap Verified
              {postalInfo?.district ? ` · ${postalInfo.district}` : ''}
            </span>
          ) : isPostalRejected ? (
            <span className="sg-status-pill pill-invalid">
              <WarningCircle size={14} weight="fill" /> Invalid Address / Postal
            </span>
          ) : postalLookupStatus === 'offline' && postalInfo?.validSector ? (
            <span className="sg-status-pill pill-manual">
              Sector {postalInfo.district} · Manual Check
            </span>
          ) : (
            <span className="sg-status-pill pill-neutral">Awaiting 6-Digit Postal</span>
          )}
        </div>
      </div>

      {/* Step A: Quick OneMap Postal Code / Building Finder */}
      <div className="address-search-group">
        <label htmlFor="sg-onemap-finder">
          <div className="label-with-badge">
            <span>Quick Find by 6-Digit Postal Code or Building</span>
            <span className="sg-finder-hint">Auto-fills road &amp; district</span>
          </div>
        </label>
        <div className="search-input-wrapper sg-finder-box">
          <MagnifyingGlass size={18} className="search-icon" />
          <input
            id="sg-onemap-finder"
            type="text"
            autoComplete="off"
            placeholder="Type 6-digit postal code (e.g. 238801) or building name (e.g. ION Orchard)…"
            value={searchInput}
            disabled={disabled}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCheckFeedback(null);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
          />
          {loading && <span className="search-spinner" aria-label="Searching OneMap…" />}
          {!loading && searchInput && (
            <button
              type="button"
              className="sg-clear-search-btn"
              aria-label="Clear search"
              onClick={() => {
                setSearchInput('');
                setResults([]);
                setIsOpen(false);
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Helper while typing partial digits vs quick sample chips */}
        {/^[0-9]{1,5}$/.test(searchInput.trim()) ? (
          <div className="sg-typing-progress" role="status">
            <span>Enter all 6 digits to query Singapore’s postal registry ({searchInput.trim().length}/6 digits)</span>
          </div>
        ) : !searchInput && !value.postal_code ? (
          <div className="sg-sample-chips">
            <span className="sg-sample-label"><Sparkle size={12} weight="fill" /> Try verified code:</span>
            {SAMPLE_POSTALS.map((sample) => (
              <button
                key={sample.code}
                type="button"
                className="sg-sample-chip"
                disabled={disabled}
                onClick={() => setSearchInput(sample.code)}
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Live Lookup Alert Banner (Not Found / Invalid Sector / Offline) */}
        {(postalLookupStatus === 'not_found' || postalLookupStatus === 'invalid_sector' || postalLookupStatus === 'search_empty') && lookupMessage && (
          <div className="sg-validation-banner banner-error" role="alert">
            <WarningCircle size={18} weight="fill" />
            <div>
              <strong>Address Could Not Be Verified</strong>
              <p>{lookupMessage}</p>
            </div>
          </div>
        )}

        {postalLookupStatus === 'offline' && lookupMessage && (
          <div className="sg-validation-banner banner-warn" role="status">
            <WarningCircle size={18} weight="duotone" />
            <div>
              <strong>Offline Postal Sector Check</strong>
              <p>{lookupMessage}</p>
            </div>
          </div>
        )}

        {/* Dropdown Recommendations */}
        {isOpen && results.length > 0 && (
          <ul className="address-dropdown-list" role="listbox" aria-label="Matching Singapore addresses">
            {results.map((item, index) => (
              <li
                key={`${item.postalCode}-${item.building}-${index}`}
                role="option"
                aria-selected={highlightedIdx === index}
                className={`address-dropdown-item ${highlightedIdx === index ? 'highlighted' : ''}`}
                onMouseEnter={() => setHighlightedIdx(index)}
                onClick={() => handleSelectResult(item, results)}
              >
                <MapPin size={18} weight="fill" className="dropdown-pin" />
                <div className="dropdown-copy">
                  <div className="dropdown-title-row">
                    <strong>{item.building || item.line1}</strong>
                    {item.postalCode && <span className="dropdown-postal-tag">S({item.postalCode})</span>}
                  </div>
                  <small>
                    {item.line1}
                    {item.district ? ` · ${item.district} (${item.area})` : ''}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Multi-building / wing selector when a valid postal code maps to several blocks/wings */}
      {postalLookupStatus === 'verified' && verifiedMatches.length > 1 && (
        <div className="sg-multi-building-bar">
          <span>Select building / wing at S({value.postal_code}):</span>
          <div className="sg-building-pills">
            {verifiedMatches.slice(0, 5).map((m, idx) => {
              const label = m.building || m.line1;
              const active = (value.building || '') === (m.building || '') && value.line1 === m.line1;
              return (
                <button
                  key={`${label}-${idx}`}
                  type="button"
                  className={`sg-building-pill ${active ? 'active' : ''}`}
                  onClick={() => handleSelectResult(m, verifiedMatches)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step B: Contact Details (Recipient & +65 Phone Validator) */}
      {showContact && (
        <div className="address-contact-row">
          <div className={`sg-field ${touched.recipient && validation.errors.recipient ? 'has-error' : touched.recipient && value.recipient ? 'is-valid' : ''}`}>
            <label>
              <div className="sg-field-label-row">
                <span>Recipient full name *</span>
                {value.recipient && !validation.errors.recipient && (
                  <CheckCircle size={14} weight="fill" className="sg-inline-ok" />
                )}
              </div>
              <input
                type="text"
                name="recipient"
                required
                autoComplete="name"
                placeholder="e.g. Tan Wei Ming"
                value={value.recipient || ''}
                disabled={disabled}
                onBlur={() => markTouched('recipient')}
                onChange={(e) => updateField('recipient', e.target.value)}
              />
            </label>
            {touched.recipient && validation.errors.recipient && (
              <span className="sg-field-error" role="alert">{validation.errors.recipient}</span>
            )}
          </div>

          <div className={`sg-field ${touched.phone && validation.errors.phone ? 'has-error' : phoneCheck.valid && value.phone ? 'is-valid' : ''}`}>
            <label>
              <div className="sg-field-label-row">
                <span>Singapore mobile / phone {requirePhone ? '*' : ''}</span>
                {phoneCheck.valid && value.phone && (
                  <span className="sg-line-type-tag">{phoneCheck.lineType} ✓</span>
                )}
              </div>
              <div className="sg-phone-input-wrap">
                <span className="sg-phone-prefix" aria-hidden="true">
                  <Phone size={13} weight="bold" /> +65
                </span>
                <input
                  type="tel"
                  name="phone"
                  required={requirePhone}
                  autoComplete="tel-national"
                  placeholder="9123 4567"
                  value={value.phone ? value.phone.replace(/^\+?65\s*/, '') : ''}
                  disabled={disabled}
                  onBlur={() => {
                    markTouched('phone');
                    if (phoneCheck.valid && phoneCheck.formatted) {
                      updateField('phone', phoneCheck.formatted);
                    }
                  }}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d\s\-+]/g, '').slice(0, 14);
                    updateField('phone', cleaned);
                  }}
                />
              </div>
            </label>
            {touched.phone && validation.errors.phone && (
              <span className="sg-field-error" role="alert">{validation.errors.phone}</span>
            )}
          </div>
        </div>
      )}

      {/* Step C: Property Type Segmented Selector */}
      <div className="sg-property-type-group" role="group" aria-label="Property type">
        <span className="sg-property-type-label">Property type</span>
        <div className="sg-property-pills">
          {PROPERTY_TYPES.map((pt) => {
            const Icon = pt.icon;
            const selected = propertyType === pt.id;
            return (
              <button
                key={pt.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                className={`sg-prop-pill ${selected ? 'active' : ''}`}
                onClick={() => updateField('property_type', pt.id)}
              >
                <Icon size={15} weight={selected ? 'fill' : 'regular'} />
                <span>{pt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step D: Postal Code + Street Address + Unit/Floor */}
      <div className="sg-address-grid-v2">
        {/* 6-Digit Postal Code */}
        <div className={`sg-field postal-field ${isPostalRejected ? 'has-error' : isPostalVerified ? 'is-valid' : ''}`}>
          <label>
            <div className="sg-field-label-row">
              <span>Postal code *</span>
              {postalInfo?.validSector && !validation.errors.postal_code && (
                <span className="sg-district-mini">{postalInfo.district}</span>
              )}
            </div>
            <div className="sg-postal-input-wrap">
              <span className="sg-postal-prefix">S(</span>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="238801"
                value={value.postal_code || ''}
                disabled={disabled}
                onBlur={() => markTouched('postal_code')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  lastVerifiedPostalRef.current = '';
                  updateField('postal_code', digits);
                  if (digits.length === 6) {
                    markTouched('postal_code');
                  }
                }}
              />
              <span className="sg-postal-suffix">)</span>
            </div>
          </label>
          {(touched.postal_code || isPostalRejected) && validation.errors.postal_code ? (
            <span className="sg-field-error" role="alert">{validation.errors.postal_code}</span>
          ) : postalInfo?.validSector && postalLookupStatus === 'verified' ? (
            <span className="sg-field-hint ok">{postalInfo.district} · {postalInfo.area}</span>
          ) : null}
        </div>

        {/* Street Address */}
        <div className={`sg-field street-field ${touched.line1 && validation.errors.line1 ? 'has-error' : value.line1 && !validation.errors.line1 ? 'is-valid' : ''}`}>
          <label>
            <div className="sg-field-label-row">
              <span>Street address (House / Blk &amp; Road) *</span>
              {value.building && <span className="sg-building-badge">{value.building}</span>}
            </div>
            <input
              type="text"
              required
              autoComplete="address-line1"
              placeholder="e.g. 2 Orchard Turn"
              value={value.line1 || ''}
              disabled={disabled}
              onBlur={() => markTouched('line1')}
              onChange={(e) => updateField('line1', e.target.value)}
            />
          </label>
          {!streetConsistency.consistent && streetConsistency.expectedStreet ? (
            <div className="sg-mismatch-inline" role="alert">
              <span>
                Does not match S({value.postal_code}): expected <strong>{streetConsistency.expectedStreet}</strong>
              </span>
              <button
                type="button"
                className="sg-fix-street-btn"
                onClick={() => {
                  const top = verifiedMatches[0];
                  updateField('line1', top.line1);
                }}
              >
                <ArrowCounterClockwise size={13} /> Use official road
              </button>
            </div>
          ) : touched.line1 && validation.errors.line1 ? (
            <span className="sg-field-error" role="alert">{validation.errors.line1}</span>
          ) : null}
        </div>

        {/* Unit / Floor */}
        <div className={`sg-field unit-field ${touched.line2 && validation.errors.line2 ? 'has-error' : (propertyType === 'landed' || (unitCheck.valid && value.line2)) ? 'is-valid' : ''}`}>
          <label>
            <div className="sg-field-label-row">
              <span>{propertyType === 'landed' ? 'Unit / Floor (optional)' : 'Unit / Floor *'}</span>
              {propertyType === 'landed' && <span className="sg-optional-tag">Landed</span>}
            </div>
            <input
              ref={unitRef}
              type="text"
              autoComplete="address-line2"
              placeholder={
                propertyType === 'landed'
                  ? 'Optional (e.g. Gate B)'
                  : propertyType === 'commercial'
                    ? '#03-12 or Level 4'
                    : '#08-124'
              }
              value={value.line2 || ''}
              disabled={disabled}
              onBlur={() => {
                markTouched('line2');
                if (value.line2) {
                  const norm = normalizeUnitNumber(value.line2);
                  if (norm !== value.line2) updateField('line2', norm);
                }
              }}
              onChange={(e) => updateField('line2', e.target.value)}
            />
          </label>
          {touched.line2 && validation.errors.line2 ? (
            <span className="sg-field-error" role="alert">{validation.errors.line2}</span>
          ) : (
            <span className="sg-field-hint">
              {propertyType === 'landed'
                ? 'Ground / landed delivery — no unit # needed'
                : 'Auto-formats e.g. 08-124 → #08-124'}
            </span>
          )}
        </div>
      </div>

      {/* Step E: Live Formatted Courier Dispatch Label Preview & Verify Button */}
      <div className={`sg-dispatch-preview-card ${validation.valid && isPostalVerified ? 'ready' : ''}`}>
        <div className="sg-dispatch-preview-info">
          <div className="sg-dispatch-eyebrow">
            <span>SINGAPORE COURIER PARCEL LABEL PREVIEW</span>
            {postalInfo?.district && !validation.errors.postal_code && (
              <span className="sg-route-code">ROUTE: SG-{postalInfo.district}</span>
            )}
          </div>
          {value.line1 || value.postal_code || value.recipient ? (
            <div className="sg-dispatch-lines">
              <strong>
                {value.recipient || 'Recipient Name'}
                {phoneCheck.valid && phoneCheck.formatted ? ` · ${phoneCheck.formatted}` : value.phone ? ` · ${value.phone}` : ''}
              </strong>
              <span>
                {[
                  value.line1,
                  value.line2 ? normalizeUnitNumber(value.line2) : '',
                  value.building && (!value.line1 || !value.line1.toLowerCase().includes(value.building.toLowerCase()))
                    ? value.building
                    : '',
                ]
                  .filter(Boolean)
                  .join(', ') || 'Street address pending'}
              </span>
              <span className="sg-dispatch-postal">
                SINGAPORE {value.postal_code || '______'}
                {postalInfo?.area && !validation.errors.postal_code ? ` (${postalInfo.area})` : ''}
              </span>
            </div>
          ) : (
            <p className="sg-dispatch-placeholder">
              Enter your 6-digit Singapore postal code above to auto-populate and validate your courier label.
            </p>
          )}
        </div>

        <button
          type="button"
          className={`sg-verify-btn ${validation.valid ? 'btn-valid' : ''}`}
          disabled={disabled || loading}
          onClick={handleRunInteractiveCheck}
        >
          <CheckCircle size={16} weight={validation.valid ? 'fill' : 'regular'} />
          <span>{validation.valid ? 'Verified ✓' : 'Validate Address'}</span>
        </button>
      </div>

      {checkFeedback && (
        <div
          className={`sg-check-feedback ${checkFeedback.ok ? 'ok' : 'err'}`}
          role={checkFeedback.ok ? 'status' : 'alert'}
        >
          {checkFeedback.ok ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
          <span>{checkFeedback.text}</span>
        </div>
      )}
    </div>
  );
}
