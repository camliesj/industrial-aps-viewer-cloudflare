import { json } from "../_lib/http.js";
export function onRequestGet() { return json({ ok: true, runtime: "cloudflare-pages" }); }
