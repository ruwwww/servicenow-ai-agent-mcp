/**
 * test-query.js
 * 
 * Verifies that the ServiceNow REST API can be queried using Basic Auth.
 * 
 * Usage:
 *   node scripts/test-query.js
 * 
 * Requires environment variables:
 *   SERVICENOW_INSTANCE_URL
 *   SERVICENOW_BASIC_USERNAME
 *   SERVICENOW_BASIC_PASSWORD
 */

const instanceUrl = process.env.SERVICENOW_INSTANCE_URL?.replace(/\/+$/, '');
const username = process.env.SERVICENOW_BASIC_USERNAME || 'admin';
const password = process.env.SERVICENOW_BASIC_PASSWORD;

if (!instanceUrl || !password) {
  console.error('Error: SERVICENOW_INSTANCE_URL and SERVICENOW_BASIC_PASSWORD must be set in environment.');
  process.exit(1);
}

async function run() {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const url = `${instanceUrl}/api/now/table/incident?sysparm_limit=3&sysparm_display_value=all`;

  console.log(`Querying ${url}...`);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });

  console.log(`Status: ${res.status}`);
  if (res.status !== 200) {
    const errorText = await res.text();
    console.error('API Error Response:', errorText);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Found ${data.result?.length || 0} incidents:`);
  data.result?.forEach((inc, index) => {
    console.log(`  [${index + 1}] ${inc.number?.display_value} - ${inc.short_description?.display_value} (Priority: ${inc.priority?.display_value})`);
  });
}

run().catch(err => {
  console.error('Test query failed:', err.message);
  process.exit(1);
});
