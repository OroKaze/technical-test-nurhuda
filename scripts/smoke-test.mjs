#!/usr/bin/env node

/**
 * End-to-End Smoke Test for Dexa Attendance Platform
 * Validates the core business journey through the API Gateway:
 * - Authentication (Employee & HRD)
 * - Profile display and phone update
 * - Secure photo upload and gateway proxy serving
 * - Attendance check-in and date-range summary
 * - HRD employee listing and read-only attendance monitoring
 */

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function run() {
  console.log(`\n🚀 Starting Dexa Platform Smoke Verification against: ${BASE_URL}\n`);

  let passedSteps = 0;
  const totalSteps = 9;

  function pass(step, detail) {
    passedSteps++;
    console.log(`  ✅ [${passedSteps}/${totalSteps}] ${step}: ${detail}`);
  }

  function fail(step, error) {
    console.error(`\n  ❌ [FAILED] ${step}:`, error);
    process.exit(1);
  }

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/v1/health/live`);
    if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
    const data = await res.json();
    pass('Gateway Health', `Status: ${data.status ?? 'ok'}`);
  } catch (err) {
    fail('Gateway Health', err.message);
  }

  // 2. Employee Login
  let employeeToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'employee@company.example', password: 'Employee123!' }),
    });
    if (!res.ok) throw new Error(`Login failed with status ${res.status}`);
    const data = await res.json();
    employeeToken = data.accessToken;
    if (!employeeToken) throw new Error('Missing accessToken in login response');
    pass('Employee Authentication', `Token received for ${data.user?.email}`);
  } catch (err) {
    fail('Employee Authentication', err.message);
  }

  // 3. Employee Profile Read
  let initialProfile = null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/me/profile`, {
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    if (!res.ok) throw new Error(`Profile read failed with status ${res.status}`);
    initialProfile = await res.json();
    pass('Employee Profile Read', `Name: ${initialProfile.fullName}, Position: ${initialProfile.position}`);
  } catch (err) {
    fail('Employee Profile Read', err.message);
  }

  // 4. Employee Phone Update
  try {
    const testPhone = '+628123456789';
    const res = await fetch(`${BASE_URL}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${employeeToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber: testPhone }),
    });
    if (!res.ok) throw new Error(`Phone update failed with status ${res.status}`);
    const data = await res.json();
    if (data.phoneNumber !== testPhone) throw new Error(`Expected phone ${testPhone}, got ${data.phoneNumber}`);
    pass('Employee Phone Update', `Saved phone: ${data.phoneNumber}`);
  } catch (err) {
    fail('Employee Phone Update', err.message);
  }

  // 5. Profile Photo Upload & Proxy Fetch
  try {
    // 1x1 transparent PNG
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const form = new FormData();
    form.append('photo', new Blob([pngBuffer], { type: 'image/png' }), 'smoke-test-avatar.png');

    const uploadRes = await fetch(`${BASE_URL}/api/v1/me/profile/photo`, {
      method: 'POST',
      headers: { authorization: `Bearer ${employeeToken}` },
      body: form,
    });
    if (!uploadRes.ok) throw new Error(`Photo upload failed with status ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    if (!uploadData.photoUrl) throw new Error('Missing photoUrl in response');

    // Verify proxy fetch
    const fetchRes = await fetch(`${BASE_URL}${uploadData.photoUrl}`);
    if (!fetchRes.ok) throw new Error(`Photo proxy fetch failed with status ${fetchRes.status}`);
    const contentType = fetchRes.headers.get('content-type') ?? '';
    if (!contentType.includes('image/png')) throw new Error(`Expected image/png, got ${contentType}`);

    pass('Photo Upload & Serving Proxy', `Uploaded & retrieved: ${uploadData.photoUrl}`);
  } catch (err) {
    fail('Photo Upload & Serving Proxy', err.message);
  }

  // 6. Attendance Action (Check-in or duplicate check)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/check-in`, {
      method: 'POST',
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    // 201 Created if first time today, or 409 Conflict if already checked in
    if (res.status === 201) {
      pass('Attendance Check-In', 'Recorded check-in for today (HTTP 201)');
    } else if (res.status === 409) {
      pass('Attendance Check-In', 'Verified duplicate check-in rejected correctly (HTTP 409)');
    } else {
      throw new Error(`Unexpected attendance response status ${res.status}`);
    }
  } catch (err) {
    fail('Attendance Check-In', err.message);
  }

  // 7. Attendance Summary Query with Date Filter
  try {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/summary?from=2026-10-01&to=2026-10-31`, {
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    if (!res.ok) throw new Error(`Summary query failed with status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array in attendance summary');
    pass('Attendance Summary Query', `Retrieved ${data.length} summary record(s) with date range`);
  } catch (err) {
    fail('Attendance Summary Query', err.message);
  }

  // 8. HRD Login
  let hrdToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'hrd@company.example', password: 'HrdEmployee123!' }),
    });
    if (!res.ok) throw new Error(`HRD login failed with status ${res.status}`);
    const data = await res.json();
    hrdToken = data.accessToken;
    if (data.user?.role !== 'HRD') throw new Error(`Expected role HRD, got ${data.user?.role}`);
    pass('HRD Authentication', `Authenticated as HRD: ${data.user?.email}`);
  } catch (err) {
    fail('HRD Authentication', err.message);
  }

  // 9. HRD Employee Listing & Read-Only Attendance Monitoring
  try {
    const [empRes, attRes] = await Promise.all([
      fetch(`${BASE_URL}/api/v1/admin/employees?limit=10`, {
        headers: { authorization: `Bearer ${hrdToken}` },
      }),
      fetch(`${BASE_URL}/api/v1/admin/attendance?limit=10`, {
        headers: { authorization: `Bearer ${hrdToken}` },
      }),
    ]);

    if (!empRes.ok) throw new Error(`HRD employee list failed with status ${empRes.status}`);
    if (!attRes.ok) throw new Error(`HRD attendance monitor failed with status ${attRes.status}`);

    const empData = await empRes.json();
    const attData = await attRes.json();

    pass(
      'HRD Monitoring (Read-Only)',
      `Listed ${empData.data?.length ?? 0} employee(s) and monitored ${attData.data?.length ?? 0} attendance record(s)`,
    );
  } catch (err) {
    fail('HRD Monitoring (Read-Only)', err.message);
  }

  console.log(`\n🎉 All ${passedSteps}/${totalSteps} smoke verification checks PASSED successfully!\n`);
}

run().catch((err) => {
  console.error('Smoke test runner error:', err);
  process.exit(1);
});
