// Official URA / SingPost Singapore Postal Sectors (First 2 digits -> Postal District & Planning Area)
// Valid Singapore postal sectors are 01–73 and 75–82 (sectors 00, 74, and 83–99 are unassigned).
export const POSTAL_DISTRICTS = {
  // District 01 — Raffles Place, Cecil, Marina, People's Park
  '01': { district: 'D01', area: 'Marina Bay, Raffles Place, Suntec' },
  '02': { district: 'D01', area: 'Marina South, Downtown Core' },
  '03': { district: 'D01', area: 'Raffles Place, Millenia, Marina Centre' },
  '04': { district: 'D01', area: 'Raffles Place, Collyer Quay, Boat Quay' },
  '05': { district: 'D01', area: 'People’s Park, Chinatown, Havelock' },
  '06': { district: 'D01', area: 'Shenton Way, Robinson Road, Cecil, Telok Ayer' },
  // District 02 — Anson, Tanjong Pagar
  '07': { district: 'D02', area: 'Anson, Tanjong Pagar, Tras Street' },
  '08': { district: 'D02', area: 'Tanjong Pagar, Outram, Duxton, Everton Park' },
  // District 04 — Telok Blangah, HarbourFront
  '09': { district: 'D04', area: 'HarbourFront, Telok Blangah, Mount Faber, Sentosa' },
  '10': { district: 'D04', area: 'Telok Blangah, Bukit Purmei, Depot Road' },
  // District 05 — Pasir Panjang, Hong Leong Garden, Clementi New Town
  '11': { district: 'D05', area: 'Pasir Panjang, Kent Ridge, Alexandra' },
  '12': { district: 'D05', area: 'Clementi New Town, West Coast' },
  '13': { district: 'D05', area: 'Buona Vista, Dover, one-north, NUS' },
  // District 03 — Queenstown, Tiong Bahru
  '14': { district: 'D03', area: 'Queenstown, Commonwealth, Dawson, Stirling' },
  '15': { district: 'D03', area: 'Redhill, Alexandra, Bukit Merah' },
  '16': { district: 'D03', area: 'Tiong Bahru, Bukit Ho Swee, River Valley West' },
  // District 06 — High Street, Beach Road (part)
  '17': { district: 'D06', area: 'City Hall, High Street, Clarke Quay, North Bridge' },
  // District 07 — Middle Road, Golden Mile
  '18': { district: 'D07', area: 'Bugis, Middle Road, Bras Basah, Waterloo' },
  '19': { district: 'D07', area: 'Beach Road, Golden Mile, Kampong Glam' },
  // District 08 — Little India
  '20': { district: 'D08', area: 'Little India, Farrer Park, Jalan Besar' },
  '21': { district: 'D08', area: 'Serangoon Road, Owen Road, Pek Kio' },
  // District 09 — Orchard, Cairnhill, River Valley
  '22': { district: 'D09', area: 'Orchard, Cairnhill, Emerald Hill' },
  '23': { district: 'D09', area: 'Orchard, Somerset, River Valley, Robertson Quay' },
  // District 10 — Ardmore, Bukit Timah, Holland Road, Tanglin
  '24': { district: 'D10', area: 'Tanglin, Chatsworth, Nassim, River Valley' },
  '25': { district: 'D10', area: 'Ardmore, Bukit Timah, Stevens, Botanic Gardens' },
  '26': { district: 'D10', area: 'Bukit Timah, Farrer Road, Duchess' },
  '27': { district: 'D10', area: 'Holland Village, Ghim Moh, Sixth Avenue' },
  // District 11 — Watten Estate, Novena, Thomson
  '28': { district: 'D11', area: 'Watten Estate, Dunearn, Bukit Timah' },
  '29': { district: 'D11', area: 'Thomson, Whitley, Mount Pleasant' },
  '30': { district: 'D11', area: 'Novena, Newton, Moulmein' },
  // District 12 — Balestier, Toa Payoh, Serangoon
  '31': { district: 'D12', area: 'Toa Payoh, Novena North' },
  '32': { district: 'D12', area: 'Balestier, Whampoa, St. Michael’s' },
  '33': { district: 'D12', area: 'Bendemeer, Boon Keng, Kallang Bahru' },
  // District 13 — Macpherson, Braddell
  '34': { district: 'D13', area: 'Potong Pasir, Sennett, Woodleigh' },
  '35': { district: 'D13', area: 'Braddell, Upper Serangoon, Bidadari' },
  '36': { district: 'D13', area: 'MacPherson, Joo Seng, Tai Seng' },
  '37': { district: 'D13', area: 'Circuit Road, MacPherson, Pipit' },
  // District 14 — Geylang, Eunos
  '38': { district: 'D14', area: 'Geylang, Aljunied, Sims' },
  '39': { district: 'D14', area: 'Geylang, Mountbatten, Old Airport' },
  '40': { district: 'D14', area: 'Paya Lebar, Ubi, Eunos' },
  '41': { district: 'D14', area: 'Eunos, Kembangan, Kaki Bukit, Chai Chee' },
  // District 15 — Katong, Joo Chiat, Amber Road
  '42': { district: 'D15', area: 'Joo Chiat, Katong, Telok Kurau' },
  '43': { district: 'D15', area: 'Tanjong Rhu, Meyer, Amber, Mountbatten' },
  '44': { district: 'D15', area: 'Marine Parade, East Coast' },
  '45': { district: 'D15', area: 'Siglap, Frankel, Opera Estate' },
  // District 16 — Bedok, Upper East Coast, Eastwood, Kew Drive
  '46': { district: 'D16', area: 'Bedok, Chai Chee, Bayshore' },
  '47': { district: 'D16', area: 'Bedok Reservoir,aki Bukit East' .replace('aki', 'Kaki') },
  '48': { district: 'D16', area: 'Tanah Merah, Simei South, Changi Business Park' },
  // District 17 — Loyang, Changi
  '49': { district: 'D17', area: 'Changi, Loyang, Fairy Point' },
  '50': { district: 'D17', area: 'Loyang, Changi Village, Flora Drive' },
  // District 18 — Tampines, Pasir Ris
  '51': { district: 'D18', area: 'Pasir Ris, Elias, Loyang West' },
  '52': { district: 'D18', area: 'Tampines, Simei' },
  // District 19 — Serangoon Garden, Hougang, Punggol
  '53': { district: 'D19', area: 'Hougang, Defu, Tai Keng' },
  '54': { district: 'D19', area: 'Sengkang, Compassvale, Rivervale, Kovan' },
  '55': { district: 'D19', area: 'Serangoon Central, Serangoon Gardens, Lorong Chuan' },
  // District 20 — Bishan, Ang Mo Kio
  '56': { district: 'D20', area: 'Ang Mo Kio, Cheng San, Kebun Baru' },
  '57': { district: 'D20', area: 'Bishan, Marymount, Sin Ming, Upper Thomson' },
  // District 21 — Upper Bukit Timah, Clementi Park, Ulu Pandan
  '58': { district: 'D21', area: 'Upper Bukit Timah, Beauty World, Toh Tuck' },
  '59': { district: 'D21', area: 'Clementi Park, Sunset Way, Hume, King Albert Park' },
  // District 22 — Jurong
  '60': { district: 'D22', area: 'Jurong East, Toh Guan, International Business Park' },
  '61': { district: 'D22', area: 'Taman Jurong, Corporation' },
  '62': { district: 'D22', area: 'Pioneer, Joo Koon, Benoi, Tuas' },
  '63': { district: 'D22', area: 'Tuas, Tuas South, Gul' },
  '64': { district: 'D22', area: 'Jurong West, Boon Lay, Westwood, Nanyang' },
  // District 23 — Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang
  '65': { district: 'D23', area: 'Bukit Batok, Guilin, Hillview' },
  '66': { district: 'D23', area: 'Hillview, Dairy Farm, Cashew' },
  '67': { district: 'D23', area: 'Bukit Panjang, Senja, Zhenghua' },
  '68': { district: 'D23', area: 'Choa Chu Kang, Yew Tee, Teck Whye' },
  // District 24 — Lim Chu Kang, Tengah
  '69': { district: 'D24', area: 'Tengah, Choa Chu Kang West' },
  '70': { district: 'D24', area: 'Lim Chu Kang, Sungei Gedong' },
  '71': { district: 'D24', area: 'Lim Chu Kang, Neo Tiew, Kranji Reservoir' },
  // District 25 — Kranji, Woodgrove, Woodlands
  '72': { district: 'D25', area: 'Kranji, Sungei Kadut, Turf Club' },
  '73': { district: 'D25', area: 'Woodlands, Marsiling, Admiralty, Woodgrove' },
  // Note: Sector 74 is officially unassigned in Singapore.
  // District 27 — Yishun, Sembawang
  '75': { district: 'D27', area: 'Sembawang, Canberra, Wellington' },
  '76': { district: 'D27', area: 'Yishun, Khatib, Lower Seletar' },
  // District 26 — Upper Thomson, Springleaf
  '77': { district: 'D26', area: 'Upper Thomson, Mandai, Nee Soon' },
  '78': { district: 'D26', area: 'Springleaf, Lentor, Tagore' },
  // District 28 — Seletar
  '79': { district: 'D28', area: 'Sengkang West, Fernvale, Seletar Hills, Jalan Kayu' },
  '80': { district: 'D28', area: 'Seletar, Greenwich, Yio Chu Kang' },
  // District 17 & 19 Newer Sectors
  '81': { district: 'D17', area: 'Changi Airport, Jewel Changi' },
  '82': { district: 'D19', area: 'Punggol, Waterway, Northshore' },
};

const UPPERCASE_TOKENS = new Set([
  'HDB', 'ION', 'MBS', 'DSM', 'DBS', 'OCBC', 'UOB', 'SG', 'NUS', 'NTU', 'SMU', 'SUTD', 'SIT',
  'NYP', 'NP', 'SP', 'TP', 'RP', 'ITE', 'MRT', 'LRT', 'SGH', 'NUH', 'TTSH', 'KKH', 'CGH',
  'CPF', 'URA', 'JTC', 'PSA', 'BCA', 'MOE', 'MINDEF', 'SAF', 'PIE', 'ECP', 'CTE', 'AYE',
  'BKE', 'TPE', 'KPE', 'SLE', 'MCE', 'MBFC', 'ORQ', 'CBD', 'II', 'III', 'IV', 'VI',
]);

const lookupCache = new Map();
const inFlightRequests = new Map();

/**
 * Inspects a Singapore postal code string for 6-digit format AND official URA/SingPost sector validity.
 */
export function getPostalSectorInfo(value) {
  const clean = String(value || '').trim();
  if (!clean) {
    return {
      clean: '',
      validFormat: false,
      validSector: false,
      sector: '',
      district: null,
      area: null,
      reason: '6-digit Singapore postal code is required.',
    };
  }
  if (!/^[0-9]{6}$/.test(clean)) {
    return {
      clean,
      validFormat: false,
      validSector: false,
      sector: clean.slice(0, 2),
      district: null,
      area: null,
      reason: 'Singapore postal codes must be exactly 6 digits (e.g. 238801).',
    };
  }
  const sector = clean.slice(0, 2);
  const info = POSTAL_DISTRICTS[sector];
  if (!info) {
    return {
      clean,
      validFormat: true,
      validSector: false,
      sector,
      district: null,
      area: null,
      reason: `Postal sector "${sector}" does not exist in Singapore (valid sectors are 01–73 and 75–82).`,
    };
  }
  return {
    clean,
    validFormat: true,
    validSector: true,
    sector,
    district: info.district,
    area: info.area,
    reason: null,
  };
}

/**
 * Validates whether a value has a valid 6-digit format AND belongs to a real Singapore postal sector.
 */
export function isValidSingaporePostal(value) {
  const info = getPostalSectorInfo(value);
  return info.validFormat && info.validSector;
}

/**
 * Validates and formats a Singapore phone number (+65 optional, 8 digits starting with 8, 9, 6, or 3).
 */
export function validateSingaporePhone(rawPhone, { required = true } = {}) {
  const raw = String(rawPhone || '').trim();
  if (!raw) {
    return {
      valid: !required,
      formatted: '',
      localDigits: '',
      lineType: null,
      error: required ? 'Singapore contact phone number is required for courier SMS updates.' : null,
    };
  }

  // Strip spaces, dashes, dots, parentheses
  let compact = raw.replace(/[\s\-().]/g, '');
  if (compact.startsWith('+65')) {
    compact = compact.slice(3);
  } else if (compact.startsWith('0065')) {
    compact = compact.slice(4);
  } else if (compact.length === 10 && compact.startsWith('65')) {
    compact = compact.slice(2);
  } else if (compact.startsWith('+')) {
    return {
      valid: false,
      formatted: raw,
      localDigits: '',
      lineType: null,
      error: 'Please provide a Singapore (+65) phone number for local courier delivery.',
    };
  }

  if (!/^[0-9]+$/.test(compact)) {
    return {
      valid: false,
      formatted: raw,
      localDigits: '',
      lineType: null,
      error: 'Phone number should contain digits only (e.g. 9123 4567).',
    };
  }

  if (compact.length !== 8) {
    return {
      valid: false,
      formatted: raw,
      localDigits: compact,
      lineType: null,
      error: `Singapore phone numbers must be 8 digits (currently ${compact.length} digit${compact.length === 1 ? '' : 's'}).`,
    };
  }

  const first = compact[0];
  if (!['8', '9', '6', '3'].includes(first)) {
    return {
      valid: false,
      formatted: raw,
      localDigits: compact,
      lineType: null,
      error: `Singapore numbers must start with 8 or 9 (mobile), 6 (landline), or 3 (VoIP) — not "${first}".`,
    };
  }

  const lineType = first === '8' || first === '9' ? 'SG Mobile' : first === '6' ? 'SG Landline' : 'SG VoIP';
  const formatted = `+65 ${compact.slice(0, 4)} ${compact.slice(4)}`;
  return {
    valid: true,
    formatted,
    localDigits: compact,
    displayLocal: `${compact.slice(0, 4)} ${compact.slice(4)}`,
    lineType,
    error: null,
  };
}

/**
 * Normalizes unit / floor input (e.g. "08-124" -> "#08-124").
 */
export function normalizeUnitNumber(rawUnit) {
  const trimmed = String(rawUnit || '').trim();
  if (!trimmed) return '';
  // If user typed floor-unit like "08-124" or "B1-05" without leading '#', prepend '#'
  if (/^(?:B?[0-9]{1,3})\s*-\s*[0-9A-Za-z]{1,6}$/i.test(trimmed)) {
    return '#' + trimmed.replace(/\s+/g, '').toUpperCase();
  }
  if (trimmed.startsWith('#')) {
    return '#' + trimmed.slice(1).replace(/\s*-\s*/g, '-').toUpperCase();
  }
  return trimmed;
}

/**
 * Validates unit/floor string based on property type ('highrise' | 'commercial' | 'landed').
 */
export function validateSingaporeUnit(rawUnit, { propertyType = 'highrise' } = {}) {
  const clean = String(rawUnit || '').trim();
  if (propertyType === 'landed') {
    return {
      valid: true,
      normalized: clean,
      error: null,
      warning: null,
    };
  }
  if (!clean) {
    return {
      valid: false,
      normalized: '',
      error: propertyType === 'commercial'
        ? 'Enter floor/suite or lobby drop-off (e.g. #03-12, Level 4, Concierge) — or switch to Landed.'
        : 'Unit number is required for HDB / Condo delivery (e.g. #08-124) — or switch to Landed.',
      warning: null,
    };
  }

  const normalized = normalizeUnitNumber(clean);
  const standardUnitPattern = /^#(?:B?[0-9]{1,3}|G)-[0-9A-Z]{1,6}(?:\/[0-9A-Z]{1,4})?$/i;
  const namedFloorPattern = /^(?:level|lvl|floor|flr|unit|suite|blk|lobby|concierge|reception|room|rm)\b/i;

  if (!standardUnitPattern.test(normalized) && !namedFloorPattern.test(clean)) {
    return {
      valid: false,
      normalized,
      error: 'Use Singapore unit format #Floor-Unit (e.g. #08-124, #01-01, #B1-05) or Level/Lobby.',
      warning: null,
    };
  }

  return {
    valid: true,
    normalized,
    error: null,
    warning: null,
  };
}

/**
 * Normalizes title casing for Singapore road and building names while preserving acronyms.
 */
export function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .split(/\s+/)
    .map((word) => {
      // Preserve parenthetical tokens like "(AUDITORIUM)" -> "(Auditorium)"
      const leading = word.startsWith('(') ? '(' : '';
      const trailing = word.endsWith(')') ? ')' : '';
      const core = word.slice(leading.length, word.length - trailing.length);
      if (!core) return word;
      const upper = core.toUpperCase();
      if (UPPERCASE_TOKENS.has(upper)) return `${leading}${upper}${trailing}`;
      // Block/unit suffixes like 123A, 45B
      if (/^[0-9]+[A-Z]$/i.test(core)) return `${leading}${upper}${trailing}`;
      const titled = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
      return `${leading}${titled}${trailing}`;
    })
    .join(' ');
}

/**
 * Infers likely property type from OneMap record.
 */
export function inferPropertyType(rawItem = {}) {
  const building = String(rawItem.BUILDING || rawItem.building || '').toUpperCase();
  const road = String(rawItem.ROAD_NAME || rawItem.roadName || '').toUpperCase();
  if (
    /\bION\b|MALL|PLAZA|TOWER|CENTRE|CENTER|BUILDING|HUB|POLYTECHNIC|UNIVERSITY|HOSPITAL|AIRPORT|JEWEL|EXCHANGE|SQUARE|GALLERIA|INDUSTRIAL|TECH|PARKVIEW|COMPLEX|CHAMBERS|SUNTEC|VIVOCITY|PARAGON|FUNAN|SANDS/.test(
      building,
    )
  ) {
    return 'commercial';
  }
  if (!building || building === 'NIL') {
    // Landed enclaves often have low house numbers and no building name on Avenue/Close/Walk/Drive/Park/Rise/Terrace,
    // but HDB blocks also have BUILDING === 'NIL' (typically 3-digit block numbers like 101..999).
    const blk = String(rawItem.BLK_NO || rawItem.blockNo || '');
    const blkNum = parseInt(blk, 10);
    if (blk && !Number.isNaN(blkNum) && blkNum < 100 && /WALK|TERRACE|CLOSE|RISE|GROVE|VALE|GREEN|PARK|LANE/.test(road)) {
      return 'landed';
    }
  }
  return 'highrise';
}

/**
 * Formats an authoritative OneMap result item using official SingPost addressing:
 * Street line: "<BLK_NO> <ROAD_NAME>" (no bogus "Blk" prefix on malls/condos/campuses).
 */
export function normalizeOneMapItem(item, fallbackPostal = '') {
  const rawBlk = item.BLK_NO && item.BLK_NO !== 'NIL' ? String(item.BLK_NO).trim() : '';
  const road = item.ROAD_NAME && item.ROAD_NAME !== 'NIL' ? toTitleCase(item.ROAD_NAME) : '';
  const rawBuilding = item.BUILDING && item.BUILDING !== 'NIL' ? toTitleCase(item.BUILDING) : '';
  const postal = item.POSTAL && item.POSTAL !== 'NIL'
    ? String(item.POSTAL).trim()
    : /^[0-9]{6}$/.test(fallbackPostal)
      ? fallbackPostal
      : '';

  // SingPost standard street line: "<House/Block No> <Road Name>" (e.g. "2 Orchard Turn", "560 Ang Mo Kio Avenue 10")
  let streetLine = `${rawBlk ? rawBlk + ' ' : ''}${road}`.trim();
  if (!streetLine && rawBuilding) streetLine = rawBuilding;
  if (!streetLine && item.ADDRESS) {
    streetLine = toTitleCase(String(item.ADDRESS).replace(/\s+SINGAPORE\s+[0-9]{6}$/i, ''));
  }

  const building = rawBuilding && rawBuilding.toUpperCase() !== road.toUpperCase() ? rawBuilding : '';
  const sectorInfo = postal ? getPostalSectorInfo(postal) : null;
  const propertyType = inferPropertyType(item);

  return {
    searchVal: item.SEARCHVAL || building || streetLine,
    blockNo: rawBlk,
    roadName: road,
    building,
    postalCode: postal,
    district: sectorInfo?.district || null,
    area: sectorInfo?.area || null,
    propertyType,
    line1: streetLine,
    fullStreetWithBuilding: building && !streetLine.toLowerCase().includes(building.toLowerCase())
      ? `${streetLine}, ${building}`
      : streetLine,
    label: building
      ? `${building} · ${streetLine}${postal ? ` (S${postal})` : ''}`
      : `${streetLine}${postal ? ` (S${postal})` : ''}`,
    source: 'onemap',
  };
}

function deduplicateOneMapResults(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.postalCode}|${item.line1.toUpperCase()}|${item.building.toUpperCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, 8);
}

async function fetchOneMapDirect(cleanQuery, signal) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(cleanQuery)}&returnGeom=N&getAddrDetails=Y&pageNum=1`;
  let response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  if (response.status === 429) {
    // Polite single backoff retry if OneMap rate-limits burst queries
    await new Promise((resolve) => setTimeout(resolve, 680));
    response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
  }
  if (!response.ok) {
    throw new Error(`OneMap HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Authoritative Singapore address lookup with structured status:
 * - status: 'verified'       -> Official OneMap match(es) found
 * - status: 'not_found'      -> OneMap confirmed 0 results (postal code / building does NOT exist)
 * - status: 'invalid_sector' -> 6-digit number uses an unassigned Singapore postal sector (00, 74, 83–99)
 * - status: 'partial_digits' -> User is still typing <6 digits of a postal code
 * - status: 'offline'        -> Network / OneMap temporarily unreachable (never fakes verification!)
 */
export async function lookupSingaporeAddress(query, { signal } = {}) {
  const clean = String(query || '').trim();
  if (!clean || clean.length < 2) {
    return { status: 'idle', results: [], districtInfo: null, message: '' };
  }

  // If user is typing pure digits, wait until all 6 digits of a Singapore postal code are entered
  if (/^[0-9]+$/.test(clean)) {
    if (clean.length < 6) {
      return {
        status: 'partial_digits',
        results: [],
        districtInfo: null,
        message: `Enter all 6 digits of your Singapore postal code (${clean.length}/6)…`,
      };
    }
    if (clean.length > 6) {
      return {
        status: 'invalid_sector',
        results: [],
        districtInfo: null,
        message: 'Singapore postal codes are exactly 6 digits.',
      };
    }
    const sectorCheck = getPostalSectorInfo(clean);
    if (!sectorCheck.validSector) {
      return {
        status: 'invalid_sector',
        results: [],
        districtInfo: sectorCheck,
        message: sectorCheck.reason,
      };
    }
  }

  const cacheKey = clean.toUpperCase();
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey);
  }

  if (inFlightRequests.has(cacheKey) && !signal) {
    return inFlightRequests.get(cacheKey);
  }

  const task = (async () => {
    const isSixDigitPostal = /^[0-9]{6}$/.test(clean);
    const sectorInfo = isSixDigitPostal ? getPostalSectorInfo(clean) : null;

    // 1. Try backend proxy first (shares server-side cache & avoids browser CORS/rate limits), then direct OneMap
    let rawResults = null;
    try {
      const apiRes = await fetch(`/api/address/search/?q=${encodeURIComponent(clean)}`, {
        headers: { Accept: 'application/json' },
        signal,
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (Array.isArray(apiData?.results) && apiData.status !== 'unavailable') {
          rawResults = apiData.results;
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }

    if (rawResults === null) {
      try {
        const directData = await fetchOneMapDirect(clean, signal);
        if (Array.isArray(directData?.results)) {
          rawResults = directData.results;
        }
      } catch (err) {
        if (err?.name === 'AbortError') throw err;
        // Network / OneMap temporarily unavailable — return honest 'offline' status without faking a street!
        return {
          status: 'offline',
          results: [],
          districtInfo: sectorInfo,
          message: sectorInfo?.validSector
            ? `Live postal lookup is temporarily unavailable. Sector ${sectorInfo.sector} (${sectorInfo.district} · ${sectorInfo.area}) is valid — please enter your street address manually.`
            : 'Address lookup is temporarily offline. Please enter your street and postal code manually.',
        };
      }
    }

    // Filter to exact postal match when searching a 6-digit postal code so unrelated partial matches never leak in
    let normalized = rawResults.map((item) => normalizeOneMapItem(item, isSixDigitPostal ? clean : ''));
    if (isSixDigitPostal) {
      const exactPostal = normalized.filter((item) => item.postalCode === clean);
      normalized = exactPostal;
    }
    const deduped = deduplicateOneMapResults(normalized);

    if (deduped.length > 0) {
      const first = deduped[0];
      const resolvedDistrict = sectorInfo || (first.postalCode ? getPostalSectorInfo(first.postalCode) : null);
      const outcome = {
        status: 'verified',
        results: deduped,
        districtInfo: resolvedDistrict,
        message: resolvedDistrict?.district
          ? `Verified in Singapore Postal Registry · ${resolvedDistrict.district} (${resolvedDistrict.area})`
          : 'Verified in Singapore Postal Registry',
      };
      lookupCache.set(cacheKey, outcome);
      return outcome;
    }

    const notFoundOutcome = {
      status: 'not_found',
      results: [],
      districtInfo: sectorInfo,
      message: isSixDigitPostal
        ? `Postal code ${clean} was not found in Singapore’s official OneMap postal registry. Please check all 6 digits.`
        : `No Singapore buildings or streets matched "${clean}". Try your 6-digit postal code instead.`,
    };
    lookupCache.set(cacheKey, notFoundOutcome);
    return notFoundOutcome;
  })();

  inFlightRequests.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Backward-compatible array search wrapper.
 */
export async function searchSingaporeAddress(query) {
  const res = await lookupSingaporeAddress(query);
  return res.results;
}

/**
 * Checks whether a manually typed street address conflicts with the official OneMap record(s) for a postal code.
 */
export function checkStreetPostalConsistency(line1, verifiedMatches = []) {
  const typed = String(line1 || '').trim().toLowerCase();
  if (!typed || !Array.isArray(verifiedMatches) || verifiedMatches.length === 0) {
    return { consistent: true, expectedStreet: null };
  }
  const normalizeTokens = (s) =>
    s
      .toLowerCase()
      .replace(/\bblk\b|\bblock\b/g, '')
      .replace(/\bave\b/g, 'avenue')
      .replace(/\brd\b/g, 'road')
      .replace(/\bst\b/g, 'street')
      .replace(/\bdr\b/g, 'drive')
      .replace(/\bcres\b/g, 'crescent')
      .replace(/\bctrl\b/g, 'central')
      .replace(/\bjln\b/g, 'jalan')
      .replace(/\blor\b/g, 'lorong')
      .replace(/\bbt\b/g, 'bukit')
      .replace(/\btg\b/g, 'tanjong')
      .replace(/\bupp\b/g, 'upper')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normTyped = normalizeTokens(typed);
  for (const match of verifiedMatches) {
    const roadNorm = normalizeTokens(match.roadName || match.line1 || '');
    const bldgNorm = normalizeTokens(match.building || '');
    if (
      (roadNorm && (normTyped.includes(roadNorm) || roadNorm.includes(normTyped))) ||
      (bldgNorm && normTyped.includes(bldgNorm))
    ) {
      return { consistent: true, expectedStreet: match.line1 };
    }
  }
  return {
    consistent: false,
    expectedStreet: verifiedMatches[0].fullStreetWithBuilding || verifiedMatches[0].line1,
  };
}

/**
 * Comprehensive Singapore Delivery Address Validator.
 */
export function validateSingaporeAddress(
  address = {},
  {
    requireContact = true,
    requirePhone = true,
    propertyType = address?.property_type || 'highrise',
    postalLookupStatus = null, // 'verified' | 'not_found' | 'invalid_sector' | 'offline' | null
    verifiedMatches = [],
  } = {},
) {
  const errors = {};
  const warnings = {};

  // 1. Recipient validation
  const recipient = String(address?.recipient || '').trim();
  if (requireContact) {
    if (!recipient) {
      errors.recipient = 'Recipient full name is required.';
    } else if (recipient.length < 2 || !/[A-Za-z\u00C0-\u024F\u4E00-\u9FFF]/.test(recipient)) {
      errors.recipient = 'Enter a valid recipient name (at least 2 letters).';
    }
  }

  // 2. Phone validation
  if (requireContact) {
    const phoneCheck = validateSingaporePhone(address?.phone, { required: requirePhone });
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.error;
    }
  }

  // 3. Postal code validation (6 digits + valid Singapore sector + live OneMap existence check)
  const postalInfo = getPostalSectorInfo(address?.postal_code);
  if (!postalInfo.validFormat || !postalInfo.validSector) {
    errors.postal_code = postalInfo.reason;
  } else if (postalLookupStatus === 'not_found') {
    errors.postal_code = `Postal code ${postalInfo.clean} does not exist in Singapore’s postal registry.`;
  }

  // 4. Street address validation
  const line1 = String(address?.line1 || '').trim();
  if (!line1) {
    errors.line1 = 'Street address (block/house number and road name) is required.';
  } else if (line1.length < 5 || !/[A-Za-z]/.test(line1) || /^singapore$/i.test(line1)) {
    errors.line1 = 'Enter a complete Singapore street name and house/block number (e.g. 2 Orchard Turn).';
  } else if (postalLookupStatus === 'verified' && verifiedMatches.length > 0) {
    const consistency = checkStreetPostalConsistency(line1, verifiedMatches);
    if (!consistency.consistent) {
      errors.line1 = `Street does not match postal code ${postalInfo.clean} (expected ${consistency.expectedStreet}).`;
    }
  }

  // 5. Unit / Floor validation
  const unitCheck = validateSingaporeUnit(address?.line2, { propertyType });
  if (!unitCheck.valid) {
    errors.line2 = unitCheck.error;
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    warnings,
    postalInfo,
  };
}

/**
 * Formats a full Singapore shipping address for display or courier labels.
 */
export function formatSingaporeShipping(address) {
  if (!address) return '';
  const parts = [];
  if (address.recipient) parts.push(address.recipient);
  if (address.phone) {
    const p = validateSingaporePhone(address.phone, { required: false });
    parts.push(`(${p.valid && p.formatted ? p.formatted : address.phone})`);
  }
  const addrParts = [];
  if (address.line1) addrParts.push(address.line1);
  if (address.building && (!address.line1 || !address.line1.toLowerCase().includes(address.building.toLowerCase()))) {
    addrParts.push(address.building);
  }
  if (address.line2) addrParts.push(normalizeUnitNumber(address.line2));
  if (address.postal_code) addrParts.push(`Singapore ${address.postal_code}`);
  if (addrParts.length) parts.push(addrParts.join(', '));
  return parts.join(' · ');
}

export function clearAddressLookupCache() {
  lookupCache.clear();
}
