import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCompanyEmail,
  normalizeCompanyEmail,
  cleanEmailUsername,
  buildFullCompanyEmail,
  isEmailTaken,
  validateCompanyUsername,
  DEFAULT_COMPANY_EMAIL_DOMAIN,
} from '../src/lib/email-validation';

test('cleanEmailUsername: strips accidental @domain and whitespace', () => {
  assert.equal(cleanEmailUsername('  budi.santoso@dexagroup.com '), 'budi.santoso');
  assert.equal(cleanEmailUsername('budi@gmail.com'), 'budi');
  assert.equal(cleanEmailUsername('budi'), 'budi');
  assert.equal(cleanEmailUsername(''), '');
});

test('buildFullCompanyEmail: creates complete official email', () => {
  assert.equal(buildFullCompanyEmail('budi.santoso'), 'budi.santoso@dexagroup.com');
  assert.equal(buildFullCompanyEmail('budi@dexagroup.com'), 'budi@dexagroup.com');
  assert.equal(buildFullCompanyEmail(''), '');
});

test('isEmailTaken: detects whether email is already registered', () => {
  const existing = ['budi@dexagroup.com', 'ani@dexagroup.com'];
  assert.equal(isEmailTaken('budi@dexagroup.com', existing), true);
  assert.equal(isEmailTaken('BUDI@DEXAGROUP.COM', existing), true);
  assert.equal(isEmailTaken('citra@dexagroup.com', existing), false);
});

test('validateCompanyUsername: validates username strictly', () => {
  assert.equal(validateCompanyUsername('budi.santoso').isValid, true);
  assert.equal(validateCompanyUsername('budi-123').isValid, true);

  const empty = validateCompanyUsername('');
  assert.equal(empty.isValid, false);
  assert.match(empty.error ?? '', /wajib diisi/);

  const short = validateCompanyUsername('a');
  assert.equal(short.isValid, false);
  assert.match(short.error ?? '', /minimal 2 karakter/);

  const consecutiveDots = validateCompanyUsername('budi..santoso');
  assert.equal(consecutiveDots.isValid, false);

  const invalidChars = validateCompanyUsername('budi santoso');
  assert.equal(invalidChars.isValid, false);
});

test('validateCompanyEmail: accepts valid email with @dexagroup.com', () => {
  const result = validateCompanyEmail('budi.santoso@dexagroup.com');
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedEmail, 'budi.santoso@dexagroup.com');
  assert.equal(result.error, undefined);
});

test('validateCompanyEmail: auto-completes plain username with default domain', () => {
  const result = validateCompanyEmail('budi');
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedEmail, `budi@${DEFAULT_COMPANY_EMAIL_DOMAIN}`);
});

test('validateCompanyEmail: normalizes uppercase email', () => {
  const result = validateCompanyEmail('BUDI.SANTOSO@DEXAGROUP.COM');
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedEmail, 'budi.santoso@dexagroup.com');
});

test('validateCompanyEmail: rejects email with foreign domain', () => {
  const gmailResult = validateCompanyEmail('budi@gmail.com');
  assert.equal(gmailResult.isValid, false);
  assert.match(gmailResult.error ?? '', /@dexagroup\.com/);

  const otherResult = validateCompanyEmail('budi@company.example');
  assert.equal(otherResult.isValid, false);
});

test('validateCompanyEmail: rejects empty or whitespace email', () => {
  const empty = validateCompanyEmail('');
  assert.equal(empty.isValid, false);
  assert.match(empty.error ?? '', /wajib diisi/);

  const whitespace = validateCompanyEmail('   ');
  assert.equal(whitespace.isValid, false);
});

test('validateCompanyEmail: rejects username shorter than 2 characters', () => {
  const short = validateCompanyEmail('a@dexagroup.com');
  assert.equal(short.isValid, false);
  assert.match(short.error ?? '', /minimal 2 karakter/);
});

test('validateCompanyEmail: rejects invalid characters or consecutive dots', () => {
  const consecutiveDots = validateCompanyEmail('budi..santoso@dexagroup.com');
  assert.equal(consecutiveDots.isValid, false);

  const spaces = validateCompanyEmail('budi santoso@dexagroup.com');
  assert.equal(spaces.isValid, false);
});

test('normalizeCompanyEmail: appends default domain if missing @', () => {
  assert.equal(normalizeCompanyEmail('budi'), 'budi@dexagroup.com');
  assert.equal(normalizeCompanyEmail('BUDI@dexagroup.com'), 'budi@dexagroup.com');
  assert.equal(normalizeCompanyEmail(''), '');
});
