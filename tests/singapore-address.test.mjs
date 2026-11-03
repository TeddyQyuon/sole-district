import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPostalSectorInfo,
  isValidSingaporePostal,
  validateSingaporePhone,
  validateSingaporeUnit,
  normalizeUnitNumber,
  normalizeOneMapItem,
  checkStreetPostalConsistency,
  validateSingaporeAddress,
} from '../src/utils/singaporeAddress.js';

test('validates official URA/SingPost postal sectors and rejects unassigned sectors', () => {
  // Valid sectors
  const ion = getPostalSectorInfo('238801');
  assert.equal(ion.validFormat, true);
  assert.equal(ion.validSector, true);
  assert.equal(ion.district, 'D09');

  const raf = getPostalSectorInfo('048624');
  assert.equal(raf.district, 'D01'); // Sector 04 is D01 Raffles Place / Collyer Quay (not Telok Blangah!)

  const tgPagar = getPostalSectorInfo('088539');
  assert.equal(tgPagar.district, 'D02'); // Sector 08 is D02 Tanjong Pagar / Outram

  const queenstown = getPostalSectorInfo('148955');
  assert.equal(queenstown.district, 'D03'); // Sector 14 is D03 Queenstown

  const jewel = getPostalSectorInfo('819666');
  assert.equal(jewel.district, 'D17');

  // Unassigned / impossible sectors
  for (const bad of ['000000', '740000', '830123', '888888', '999999', '12345', '23880A']) {
    assert.equal(isValidSingaporePostal(bad), false, `Expected ${bad} to be rejected`);
  }
});

test('validates and formats Singapore +65 contact phone numbers', () => {
  const mobile = validateSingaporePhone('91234567');
  assert.equal(mobile.valid, true);
  assert.equal(mobile.formatted, '+65 9123 4567');
  assert.equal(mobile.lineType, 'SG Mobile');

  const withPrefix = validateSingaporePhone('+65 8123-4567');
  assert.equal(withPrefix.valid, true);
  assert.equal(withPrefix.formatted, '+65 8123 4567');

  const landline = validateSingaporePhone('6550 0001');
  assert.equal(landline.valid, true);
  assert.equal(landline.lineType, 'SG Landline');

  for (const invalid of ['12345678', '55555555', '9123456', '912345678', '+44 7911 123456', 'abcdefgh']) {
    assert.equal(validateSingaporePhone(invalid).valid, false, `Expected phone ${invalid} to fail`);
  }
});

test('normalizes OneMap street addresses without adding bogus Blk to commercial buildings', () => {
  const ionItem = normalizeOneMapItem({
    SEARCHVAL: 'ION ORCHARD',
    BLK_NO: '2',
    ROAD_NAME: 'ORCHARD TURN',
    BUILDING: 'ION ORCHARD',
    ADDRESS: '2 ORCHARD TURN ION ORCHARD SINGAPORE 238801',
    POSTAL: '238801',
  });
  assert.equal(ionItem.line1, '2 Orchard Turn');
  assert.equal(ionItem.building, 'ION Orchard');
  assert.equal(ionItem.district, 'D09');
  assert.equal(ionItem.propertyType, 'commercial');

  const nypItem = normalizeOneMapItem({
    SEARCHVAL: 'NANYANG POLYTECHNIC',
    BLK_NO: '180',
    ROAD_NAME: 'ANG MO KIO AVENUE 8',
    BUILDING: 'NANYANG POLYTECHNIC',
    POSTAL: '569830',
  });
  assert.equal(nypItem.line1, '180 Ang Mo Kio Avenue 8');
  assert.equal(nypItem.district, 'D20');
});

test('validates unit numbers by property type and detects road/postal mismatches', () => {
  assert.equal(normalizeUnitNumber('08-124'), '#08-124');
  assert.equal(validateSingaporeUnit('08-124', { propertyType: 'highrise' }).valid, true);
  assert.equal(validateSingaporeUnit('', { propertyType: 'highrise' }).valid, false);
  assert.equal(validateSingaporeUnit('', { propertyType: 'landed' }).valid, true);

  const verifiedIon = [
    normalizeOneMapItem({
      BLK_NO: '2',
      ROAD_NAME: 'ORCHARD TURN',
      BUILDING: 'ION ORCHARD',
      POSTAL: '238801',
    }),
  ];

  // Mismatched street vs postal
  const mismatchCheck = checkStreetPostalConsistency('999 Tampines Street 81', verifiedIon);
  assert.equal(mismatchCheck.consistent, false);

  const fullBad = validateSingaporeAddress(
    {
      recipient: 'Tan Wei Ming',
      phone: '9123 4567',
      postal_code: '123456',
      line1: '123 Clementi Ave 3',
      line2: '#05-12',
    },
    { postalLookupStatus: 'not_found' },
  );
  assert.equal(fullBad.valid, false);
  assert.ok(fullBad.errors.postal_code);

  const fullGood = validateSingaporeAddress(
    {
      recipient: 'Tan Wei Ming',
      phone: '+65 9123 4567',
      postal_code: '238801',
      line1: '2 Orchard Turn',
      line2: '#04-12',
    },
    {
      propertyType: 'commercial',
      postalLookupStatus: 'verified',
      verifiedMatches: verifiedIon,
    },
  );
  assert.equal(fullGood.valid, true);
});
