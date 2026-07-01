export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...init.headers }
  });
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export function badRequest(message) { return json({ error: message }, { status: 400 }); }
export function methodNotAllowed() { return json({ error: "Method not allowed" }, { status: 405 }); }

export async function handleErrors(handler) {
  try { return await handler(); }
  catch (error) { return json({ error: error.message || "Unexpected server error" }, { status: error.status || 500 }); }
}
