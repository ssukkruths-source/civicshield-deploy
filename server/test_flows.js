import http from 'http';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch (e) {
            parsed = responseBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CIVICSHIELD END-TO-END VALIDATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'Health check endpoint returns 200 Healthy');

    // 2. Fetch stats
    const stats = await makeRequest('GET', '/api/dashboard/stats');
    assert(stats.status === 200 && typeof stats.data.data.total === 'number', 'Stats endpoint returns aggregate numbers');

    // 3. Reject invalid incident report (missing required description & short title)
    const invalidReport = await makeRequest('POST', '/api/incidents', {
      title: 'Bad',
      category: 'Fallen Electrical Cable'
    });
    assert(invalidReport.status === 400 && invalidReport.data.success === false, 'Validation rejects incomplete incident report');

    // 4. Submit valid citizen incident
    const testArea = 'Oakridge Sector ' + Math.floor(Math.random() * 1000);
    const validReport = await makeRequest('POST', '/api/incidents', {
      title: 'Active High-Pressure Gas / Utility Leak Near Substation',
      description: 'Hissing sound and strong odor coming from roadside distribution box. Pedestrians passing nearby.',
      category: 'Other Infrastructure Hazard',
      urgency: 'Critical',
      landmark: 'Main Electrical Substation Gate 1',
      area: testArea,
      latitude: 40.7300,
      longitude: -74.0010
    });
    assert(validReport.status === 201 && validReport.data.data.reference_id.startsWith('CS-'), 'Creates valid incident and generates reference ID', JSON.stringify(validReport.data));

    const createdIncident = validReport.data.data;
    const refId = createdIncident.reference_id;

    // 5. Duplicate Detection: Attempting to submit similar category in same area
    const duplicateReport = await makeRequest('POST', '/api/incidents', {
      title: 'Another Gas Leak at same substation',
      description: 'Smelling gas again right in front of the gate.',
      category: 'Other Infrastructure Hazard',
      urgency: 'Critical',
      landmark: 'Main Electrical Substation Gate 1',
      area: testArea,
      latitude: 40.7300,
      longitude: -74.0010
    });
    assert(duplicateReport.status === 409 && duplicateReport.data.isDuplicate === true, 'Duplicate detection detects matching category in same area within 24h');

    // 6. Force Submit bypass duplicate
    const forceReport = await makeRequest('POST', '/api/incidents', {
      title: 'Separate incident confirmed by caller',
      description: 'Second separate line ruptured across the street.',
      category: 'Other Infrastructure Hazard',
      urgency: 'Critical',
      landmark: 'Main Electrical Substation Gate 1',
      area: testArea,
      forceSubmit: true
    });
    assert(forceReport.status === 201, 'Force submit bypasses duplicate detection when explicitly confirmed');

    // 7. Track by Reference ID
    const tracked = await makeRequest('GET', `/api/incidents/reference/${refId}`);
    assert(tracked.status === 200 && tracked.data.data.reference_id === refId, 'Public tracking by reference ID returns correct incident');

    // 8. Preventing unauthorized staff actions (No auth header)
    const unauthorizedAssign = await makeRequest('PATCH', `/api/incidents/${createdIncident.id}/assign`, {
      crewId: 'staff-002'
    });
    assert(unauthorizedAssign.status === 401, 'Rejects crew assignment without staff credentials');

    // 9. Dispatcher Acknowledge Incident (With Dispatcher role header)
    const ack = await makeRequest('PATCH', `/api/incidents/${createdIncident.id}/status`, {
      status: 'Acknowledged',
      notes: 'Triage officer validated incident.'
    }, { 'X-Staff-Role': 'dispatcher' });
    assert(ack.status === 200 && ack.data.data.status === 'Acknowledged', 'Authorized dispatcher acknowledges incident');

    // 10. Dispatcher Assign Field Crew
    const assigned = await makeRequest('PATCH', `/api/incidents/${createdIncident.id}/assign`, {
      crewId: 'staff-002'
    }, { 'X-Staff-Role': 'dispatcher' });
    assert(assigned.status === 200 && assigned.data.data.status === 'Dispatched', 'Dispatcher assigns field crew and status transitions to Dispatched');

    // 11. Field Crew Marks On-Site
    const onSite = await makeRequest('POST', `/api/incidents/${createdIncident.id}/verification`, {
      notes: 'Arrived on scene with hazmat gas sniffer. Isolated distribution valve #4.'
    }, { 'X-Staff-Role': 'field_crew' });
    assert(onSite.status === 200 && onSite.data.data.status === 'On Site', 'Field crew records on-site verification and moves status to On Site');

    // 12. Field Crew Marks Resolved
    const resolved = await makeRequest('POST', `/api/incidents/${createdIncident.id}/resolution`, {
      notes: 'Replaced ruptured flange gasket and pressurized line. Leak test passed.',
      photo_url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80'
    }, { 'X-Staff-Role': 'field_crew' });
    assert(resolved.status === 200 && resolved.data.data.status === 'Resolved' && resolved.data.data.resolved_at != null, 'Field crew marks incident Resolved with audit notes');

    // 13. Audit Trail Check
    const finalIncident = await makeRequest('GET', `/api/incidents/${createdIncident.id}`);
    const logs = finalIncident.data.data.logs || [];
    assert(logs.length >= 4, `Persists full audit trail history (Found ${logs.length} status change log entries)`);

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
