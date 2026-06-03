const BASE = "http://localhost:3000";
let cookies = {};

function cookieHeader() {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}
function storeSetCookie(res) {
  const sc = res.headers.getSetCookie?.() ?? [];
  for (const c of sc) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    cookies[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
}
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    redirect: "manual",
    headers: { ...(opts.headers || {}), cookie: cookieHeader() },
  });
  storeSetCookie(res);
  return res;
}

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("  ✓ " + msg);
}

// 1. CSRF
const csrfRes = await req("/api/auth/csrf");
const { csrfToken } = await csrfRes.json();
assert(!!csrfToken, "got CSRF token");

// 2. Login
const body = new URLSearchParams({
  csrfToken,
  email: "admin@homefixlimited.co.uk",
  password: "password123",
});
const loginRes = await req("/api/auth/callback/credentials", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: body.toString(),
});
assert(
  loginRes.status === 302 || loginRes.status === 200,
  `login POST returned ${loginRes.status}`
);
assert(
  Object.keys(cookies).some((k) => k.includes("session-token")),
  "session cookie set"
);

// 3. Dashboard
const dash = await req("/");
const dashHtml = await dash.text();
assert(dash.status === 200, "dashboard returns 200 when authed");
assert(dashHtml.includes("Dashboard"), "dashboard renders heading");
assert(dashHtml.includes("Outstanding"), "dashboard shows outstanding card");

// 4. Clients & jobs & invoices list
for (const [path, needle] of [
  ["/clients", "Sarah Smith"],
  ["/jobs", "Bathroom refurbishment"],
  ["/invoices", "Acme"],
]) {
  const r = await req(path);
  const h = await r.text();
  assert(r.status === 200 && h.includes(needle), `${path} lists data (${needle})`);
}

// 5. Form pages render
for (const path of ["/clients/new", "/jobs/new", "/invoices/new", "/settings"]) {
  const r = await req(path);
  assert(r.status === 200, `${path} renders`);
}

// 6. Find an invoice id and download its PDF
const invList = await (await req("/invoices")).text();
const m = invList.match(/\/invoices\/(c[a-z0-9]{20,})"/);
assert(!!m, "found an invoice detail link");
const invId = m[1];
const pdf = await req(`/invoices/${invId}/pdf`);
const ct = pdf.headers.get("content-type");
const buf = Buffer.from(await pdf.arrayBuffer());
assert(ct === "application/pdf", `PDF content-type (${ct})`);
assert(buf.slice(0, 5).toString() === "%PDF-", "PDF starts with %PDF- magic bytes");
assert(buf.length > 1000, `PDF has real content (${buf.length} bytes)`);

console.log("\nALL SMOKE TESTS PASSED ✅");
