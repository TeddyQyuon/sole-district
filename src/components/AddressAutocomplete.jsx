import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, MapPin, CheckCircle, WarningCircle, CaretDown, CaretUp } from '@phosphor-icons/react';
import { searchSingaporeAddress, isValidSingaporePostal } from '../utils/singaporeAddress';

export function AddressAutocomplete({
  value = { recipient: '', phone: '', line1: '', line2: '', postal_code: '' },
  onChange,
  disabled = false,
  showContact = true,
  className = '',
}) {
  const [query, setQuery] = useState(value.postal_code || value.line1 || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [manualMode, setManualMode] = useState(Boolean(value.line1 && !value.postal_code));
  const [verified, setVerified] = useState(Boolean(value.postal_code && value.line1));
  const unitRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live address search with debounce
  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 3 || manualMode) {
      setResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await searchSingaporeAddress(clean);
        if (active) {
          setResults(matches);
          setIsOpen(matches.length > 0);
          // If exactly 1 match and query is 6 digits, auto-select
          if (clean.length === 6 && isValidSingaporePostal(clean) && matches.length === 1) {
            handleSelect(matches[0]);
          }
        }
      } catch (err) {
        console.warn('Address lookup error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, manualMode]);

  const handleSelect = (item) => {
    const updated = {
      ...value,
      line1: item.line1,
      postal_code: item.postalCode || value.postal_code,
    };
    onChange(updated);
    setQuery(item.postalCode ? `${item.postalCode} — ${item.line1}` : item.line1);
    setIsOpen(false);
    setVerified(true);
    // Focus unit number input for smooth flow
    setTimeout(() => {
      if (unitRef.current) unitRef.current.focus();
    }, 100);
  };

  const handleManualChange = (field, val) => {
    const updated = { ...value, [field]: val };
    onChange(updated);
  };

  return (
    <div className={`address-autocomplete-container ${className}`} ref={dropdownRef}>
      {showContact && (
        <div className="address-contact-row">
          <label>
            <span>Recipient name</span>
            <input
              type="text"
              name="recipient"
              required
              autoComplete="name"
              placeholder="Full name for delivery"
              value={value.recipient || ''}
              disabled={disabled}
              onChange={(e) => handleManualChange('recipient', e.target.value)}
            />
          </label>
          <label>
            <span>Contact phone</span>
            <input
              type="tel"
              name="phone"
              required
              autoComplete="tel"
              placeholder="+65 9123 4567"
              value={value.phone || ''}
              disabled={disabled}
              onChange={(e) => handleManualChange('phone', e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Postal Code / Building Search Input */}
      <div className="address-search-group">
        <label>
          <div className="label-with-badge">
            <span>Singapore Postal Code / Building</span>
            {verified && (
              <span className="verified-pill">
                <CheckCircle size={14} weight="fill" /> Verified address
              </span>
            )}
          </div>
          <div className="search-input-wrapper">
            <MagnifyingGlass size={18} className="search-icon" />
            <input
              type="text"
              autoComplete="postal-code"
              placeholder="Enter 6-digit postal code (e.g. 238801) or building name"
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value);
                setVerified(false);
              }}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
            />
            {loading && <span className="search-spinner" aria-label="Searching…"></span>}
          </div>
        </label>

        {/* Dropdown Recommendations */}
        {isOpen && results.length > 0 && (
          <ul className="address-dropdown-list" role="listbox">
            {results.map((item, index) => (
              <li
                key={`${item.searchVal}-${index}`}
                role="option"
                className="address-dropdown-item"
                onClick={() => handleSelect(item)}
              >
                <MapPin size={18} className="dropdown-pin" />
                <div className="dropdown-copy">
                  <strong>{item.building || item.line1}</strong>
                  <small>{item.line1} · Singapore {item.postalCode}</small>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Street Address & Unit Row */}
      <div className="address-details-row">
        <label className="street-field">
          <span>Street address</span>
          <input
            type="text"
            required
            autoComplete="address-line1"
            placeholder="Street name & block"
            value={value.line1 || ''}
            disabled={disabled}
            onChange={(e) => handleManualChange('line1', e.target.value)}
          />
        </label>

        <label className="unit-field">
          <span>Unit / Floor (optional)</span>
          <input
            ref={unitRef}
            type="text"
            autoComplete="address-line2"
            placeholder="#08-124"
            value={value.line2 || ''}
            disabled={disabled}
            onChange={(e) => handleManualChange('line2', e.target.value)}
          />
        </label>

        <label className="postal-field">
          <span>Postal code</span>
          <input
            type="text"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit code"
            value={value.postal_code || ''}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              handleManualChange('postal_code', val);
              if (val.length === 6) {
                setQuery(val);
              }
            }}
          />
        </label>
      </div>

      <div className="address-meta-notice">
        <small>Tracked local courier across all Singapore residential & commercial addresses (2–4 business days).</small>
      </div>
    </div>
  );
}
