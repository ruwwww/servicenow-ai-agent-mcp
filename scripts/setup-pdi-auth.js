/**
 * setup-pdi-auth.js
 * 
 * In modern ServiceNow releases (Washington, Xanadu, etc.), Basic Auth Restriction
 * is enforced by default (glide.authenticate.basic_auth.restriction.enforce = true).
 * This script automates logging in via the web session and assigning the required
 * 'snc_basic_auth_api_access' role to the admin user so REST APIs and MCP can connect.
 * 
 * Usage:
 *   node scripts/setup-pdi-auth.js
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
  console.log(`[1/4] Authenticating web session for user '${username}' on ${instanceUrl}...`);
  const body = new URLSearchParams({
    user_name: username,
    user_password: password,
    sys_action: 'sysverb_login'
  });

  const res1 = await fetch(`${instanceUrl}/login.do`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    redirect: 'manual'
  });

  const cookies = res1.headers.getSetCookie ? res1.headers.getSetCookie() : [res1.headers.get('set-cookie')];
  const loc = res1.headers.get('location');

  const res2 = await fetch(`${instanceUrl}/${loc || ''}`, {
    headers: { 'Cookie': cookies.map(c => c.split(';')[0]).join('; ') },
    redirect: 'manual'
  });

  const allCookies = [...cookies, ...(res2.headers.getSetCookie ? res2.headers.getSetCookie() : [])]
    .map(c => c.split(';')[0])
    .join('; ');

  const html = await res2.text();
  const tokenMatch = html.match(/g_ck\s*=\s*'([^']+)'/);

  if (!tokenMatch) {
    console.error('Failed to obtain user session token. Please verify your credentials and instance URL.');
    process.exit(1);
  }

  const headers = {
    'Cookie': allCookies,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-UserToken': tokenMatch[1]
  };

  console.log('[2/4] Resolving user sys_id...');
  const userRes = await fetch(`${instanceUrl}/api/now/table/sys_user?user_name=${encodeURIComponent(username)}`, { headers });
  const userData = await userRes.json();
  const userSysId = userData.result?.[0]?.sys_id;
  if (!userSysId) {
    throw new Error(`User '${username}' not found in sys_user table.`);
  }

  console.log('[3/4] Resolving role sys_id for snc_basic_auth_api_access...');
  const roleRes = await fetch(`${instanceUrl}/api/now/table/sys_user_role?name=snc_basic_auth_api_access`, { headers });
  const roleData = await roleRes.json();
  const roleSysId = roleData.result?.[0]?.sys_id;
  if (!roleSysId) {
    console.log('Role snc_basic_auth_api_access not found (instance might not require it). Skipping.');
    return;
  }

  console.log('[4/4] Assigning role to user...');
  const assignRes = await fetch(`${instanceUrl}/api/now/table/sys_user_has_role`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user: userSysId, role: roleSysId })
  });

  if (assignRes.status === 201) {
    console.log(`Success! Role 'snc_basic_auth_api_access' has been assigned to '${username}'. Basic Auth is now enabled.`);
  } else if (assignRes.status === 400 || assignRes.status === 409) {
    console.log(`User '${username}' already has the role or assignment succeeded.`);
  } else {
    console.log('Assignment response status:', assignRes.status);
  }
}

run().catch(err => {
  console.error('Execution failed:', err.message);
  process.exit(1);
});
