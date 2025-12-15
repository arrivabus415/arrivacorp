export async function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Set-Cookie': 'session=; Max-Age=0; Path=/'
    }
  });
}
