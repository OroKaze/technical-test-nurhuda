import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompanyEmail } from '../src/modules/auth/company-email';

test('accepts an email using the configured company domain', () => {
  assert.equal(isCompanyEmail('employee@company.example', 'company.example'), true);
});

test('rejects an email using a public or different domain', () => {
  assert.equal(isCompanyEmail('employee@gmail.com', 'company.example'), false);
  assert.equal(isCompanyEmail('employee@other.example', 'company.example'), false);
});

test('rejects malformed email input', () => {
  assert.equal(isCompanyEmail('not-an-email', 'company.example'), false);
  assert.equal(isCompanyEmail('employee@company.example.evil', 'company.example'), false);
});

test('accepts emails when multiple company domains are configured', () => {
  assert.equal(isCompanyEmail('budi@dexagroup.com', 'dexagroup.com,company.example'), true);
  assert.equal(isCompanyEmail('budi@company.example', 'dexagroup.com,company.example'), true);
  assert.equal(isCompanyEmail('budi@other.com', 'dexagroup.com,company.example'), false);
});

