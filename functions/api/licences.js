const FIREBASE_DB_URL =
  'https://robloxwhitelist-ce463-default-rtdb.firebaseio.com/';
const SECRET = 'K8f$P2xN!Zr6c@Q9yA4m#EJ0w^DHLbC7T1VgUsRkM5';

/* -------- SESSION -------- */
async function sign(value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function getSessionUser(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const [username, exp, sig] = match[1].split('.');
  if (+exp < Date.now() / 1000) return null;

  const valid = await sign(`${username}.${exp}`);
  return sig === valid ? username : null;
}

/* -------- ROBLOX -------- */
async function getRobloxUserId(username) {
  const r = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] })
  });
  const d = await r.json();
  return d?.data?.[0]?.id ?? null;
}

/* -------- GET /api/licenses -------- */
export async function onRequestGet({ request }) {
  const user = await getSessionUser(request);
  if (!user) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  if (!username) {
    return Response.json({ success: false, error: 'Missing username' }, { status: 400 });
  }

  const id = await getRobloxUserId(username);
  if (!id) {
    return Response.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const r = await fetch(`${FIREBASE_DB_URL}/${id}.json`);
  const d = await r.json();

  return Response.json({
    success: true,
    data: {
      username,
      blacklisted: d?.Blacklisted === true,
      licenses: d?.products
        ? Object.entries(d.products).map(([name, v]) => ({
            name,
            grantedBy: v.grantedBy || '—',
            timestamp: v.timestamp || null
          }))
        : []
    }
  });
}
