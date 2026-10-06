import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompanyEmail } from '../src/modules/auth/company-email';

test('accepts an email using the configured company domain', () => {
  assert.equal(isCompanyEmail('employee@dexagroup.com', 'dexagroup.com'), true);
});

test('rejects an email using a public or different domain', () => {
  assert.equal(isCompanyEmail('employee@gmail.com', 'dexagroup.com'), false);
  assert.equal(isCompanyEmail('employee@other.example', 'dexagroup.com'), false);
});

test('rejects malformed email input', () => {
  assert.equal(isCompanyEmail('not-an-email', 'dexagroup.com'), false);
  assert.equal(isCompanyEmail('employee@dexagroup.com.evil', 'dexagroup.com'), false);
});

test('accepts emails when multiple company domains are configured', () => {
  assert.equal(isCompanyEmail('budi@dexagroup.com', 'dexagroup.com,subsidiary.dexagroup.com'), true);
  assert.equal(isCompanyEmail('budi@subsidiary.dexagroup.com', 'dexagroup.com,subsidiary.dexagroup.com'), true);
  assert.equal(isCompanyEmail('budi@other.com', 'dexagroup.com,subsidiary.dexagroup.com'), false);
});

