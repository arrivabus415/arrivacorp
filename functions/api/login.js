const FIREBASE_URL =
  'https://robloxwhitelist-ce463-default-rtdb.firebaseio.com';

const SESSION_TTL = 86400;
const SECRET = 'K8f$P2xN!Zr6c@Q9yA4m#EJ0w^DHLbC7T1VgUsRkM5';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://arriva-corporation.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/* ---------- SIGN ---------- */
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

/* ---------- OPTIONS (CORS PREFLIGHT) ---------- */
export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

/* ---------- POST /api/login ---------- */
export async function onRequestPost({ request }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing credentials' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const fb = await fetch(
      `${FIREBASE_URL}/Accounts/${encodeURIComponent(username)}.json`
    );

    const storedPassword = await fb.json();

    if (!storedPassword || storedPassword !== password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid login' }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const exp = Math.floor(Date.now() / 1000) + SESSION_TTL;
    const payload = `${username}.${exp}`;
    const sig = await sign(payload);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...CORS_HEADERS,
          'Set-Cookie': `session=${payload}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Bad request' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
