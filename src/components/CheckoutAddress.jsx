import { useEffect, useState } from 'react';
import { lookupSingaporeAddress, normalizeUnitNumber } from '../utils/singaporeAddress';

export function CheckoutAddress({ value, errors, onChange, disabled }) {
  const postal = value.postal_code;
  const [lookup, setLookup] = useState(null);

  useEffect(() => {
    if (!/^\d{6}$/.test(postal)) return;
    let active = true;
    lookupSingaporeAddress(postal, { signal: AbortSignal.timeout(4000) })
      .then(({ results }) => { if (active) setLookup({ postal, results }); })
      .catch(() => {});
    return () => { active = false; };
  }, [postal]);

  const suggestions = lookup?.postal === postal && !value.line1 ? lookup.results : [];
  const field = (key, label, props) => (
    <label>
      <span>{label}</span>
      <input {...props} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `delivery-error-${key}` : undefined} value={value[key] || ''} onChange={(event) => {
        const text = event.target.value;
        onChange({
          ...value,
          [key]: key === 'postal_code' ? text.replace(/\D/g, '').slice(0, 6) : text,
          ...(['postal_code', 'line1'].includes(key) ? { building: '' } : {}),
        });
      }} />
      {errors[key] && <small id={`delivery-error-${key}`}>{errors[key]}</small>}
    </label>
  );

  return (
    <fieldset className="checkout-address-fields" disabled={disabled} aria-label="Singapore delivery address">
      {field('recipient', 'Full name', { autoComplete: 'shipping name', required: true })}
      {field('phone', 'Mobile number', { type: 'tel', autoComplete: 'shipping tel', placeholder: '+65 8123 4567', required: true })}
      {field('postal_code', 'Postal code', { autoComplete: 'shipping postal-code', inputMode: 'numeric', placeholder: '6 digits', required: true })}
      <label>
        <span>Property type</span>
        <select value={value.property_type || 'highrise'} onChange={(event) => onChange({ ...value, property_type: event.target.value })}>
          <option value="highrise">HDB / Condo / Apartment</option>
          <option value="landed">Landed house</option>
          <option value="commercial">Office / Campus</option>
        </select>
      </label>
      <div className="checkout-address-street">
        {field('line1', 'Block or house number and street', { autoComplete: 'shipping address-line1', required: true })}
        {suggestions.length > 0 && (
          <div className="checkout-address-suggestions" aria-label="Suggested addresses">
            {suggestions.slice(0, 5).map((item, index) => (
              <button type="button" key={index} onClick={() => onChange({
                ...value, line1: item.line1, building: item.building || '',
                property_type: item.propertyType || value.property_type,
              })}>Use {item.line1}{item.building ? ` · ${item.building}` : ''}</button>
            ))}
          </div>
        )}
      </div>
      {field('line2', value.property_type === 'landed' ? 'Unit number (optional)' : 'Unit number', {
        autoComplete: 'shipping address-line2', placeholder: '#08-12',
        required: value.property_type !== 'landed',
        onBlur: () => {
          const normalized = normalizeUnitNumber(value.line2);
          if (normalized && normalized !== value.line2) onChange({ ...value, line2: normalized });
        },
      })}
    </fieldset>
  );
}
