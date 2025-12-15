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

async function getRobloxUserId(username) {
  const r = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username] })
  });
  const d = await r.json();
  return d?.data?.[0]?.id ?? null;
}

/* -------- POST /api/blacklist -------- */
export async function onRequestPost({ request }) {
  const admin = await getSessionUser(request);
  if (!admin) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { username, blacklisted } = await request.json();
  const id = await getRobloxUserId(username);
  if (!id) {
    return Response.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  await fetch(`${FIREBASE_DB_URL}/${id}/Blacklisted.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blacklisted === true)
  });

  return Response.json({ success: true });
}
