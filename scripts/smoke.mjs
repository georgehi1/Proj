const BASE = "http://localhost:3000";

// Each call returns an isolated session (its own cookie jar) so we can drive
// the app as different users in one run — e.g. an office admin and a contractor.
function makeSession() {
  const cookies = {};
  const cookieHeader = () =>
    Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  const storeSetCookie = (res) => {
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      cookies[pair.slice(0, idx)] = pair.slice(idx + 1);
    }
  };
  const req = async (path, opts = {}) => {
    const res = await fetch(BASE + path, {
      ...opts,
      redirect: "manual",
      headers: { ...(opts.headers || {}), cookie: cookieHeader() },
    });
    storeSetCookie(res);
    return res;
  };
  const login = async (email, password) => {
    const { csrfToken } = await (await req("/api/auth/csrf")).json();
    return req("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, email, password }).toString(),
    });
  };
  return {
    req,
    login,
    get hasSession() {
      return Object.keys(cookies).some((k) => k.includes("session-token"));
    },
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("  ✓ " + msg);
}

const admin = makeSession();

// 1. CSRF
const csrf = await (await admin.req("/api/auth/csrf")).json();
assert(!!csrf.csrfToken, "got CSRF token");

// 2. Login (office admin)
const loginRes = await admin.login("admin@homefixlimited.co.uk", "password123");
assert(
  loginRes.status === 302 || loginRes.status === 200,
  `login POST returned ${loginRes.status}`
);
assert(admin.hasSession, "session cookie set");

// 3. Dashboard
const dash = await admin.req("/");
const dashHtml = await dash.text();
assert(dash.status === 200, "dashboard returns 200 when authed");
assert(dashHtml.includes("Dashboard"), "dashboard renders heading");
assert(dashHtml.includes("Outstanding"), "dashboard shows outstanding card");

// 3b. Baseline security headers are present on responses
assert(dash.headers.get("x-frame-options") === "DENY", "X-Frame-Options: DENY");
assert(
  dash.headers.get("x-content-type-options") === "nosniff",
  "X-Content-Type-Options: nosniff"
);
assert(
  dash.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
  "Referrer-Policy set"
);

// 4. Clients & jobs & invoices & contractors list
for (const [path, needle] of [
  ["/clients", "Sarah Smith"],
  ["/jobs", "Bathroom refurbishment"],
  ["/invoices", "Acme"],
  ["/contractors", "Dave Brennan"],
]) {
  const r = await admin.req(path);
  const h = await r.text();
  assert(r.status === 200 && h.includes(needle), `${path} lists data (${needle})`);
}

// 5. Form pages render
for (const path of [
  "/clients/new",
  "/clients/import",
  "/jobs/new",
  "/invoices/new",
  "/invoices/import",
  "/contractors/new",
  "/settings",
]) {
  const r = await admin.req(path);
  assert(r.status === 200, `${path} renders`);
}

// 5b. Calendar renders in all three views
{
  const monthName = new Date().toLocaleString("en-GB", { month: "long" });
  const month = await (await admin.req("/calendar")).text();
  assert(month.includes(monthName), `/calendar (month) shows ${monthName}`);
  const week = await admin.req("/calendar?view=week");
  assert(week.status === 200 && (await week.text()).includes("Unscheduled"), "/calendar week view renders");
  const day = await admin.req("/calendar?view=day");
  assert(day.status === 200, "/calendar day view renders");
}

// 5c. A job detail page shows assigned contractors
{
  const jobsHtml = await (await admin.req("/jobs")).text();
  const m = jobsHtml.match(/\/jobs\/(c[a-z0-9]{20,})"/);
  if (m) {
    const detail = await (await admin.req(`/jobs/${m[1]}`)).text();
    assert(detail.includes("Contractors"), "job detail shows Contractors section");
  }
}

// 6. Find an invoice id and download its PDF
const invList = await (await admin.req("/invoices")).text();
const m = invList.match(/\/invoices\/(c[a-z0-9]{20,})"/);
assert(!!m, "found an invoice detail link");
const invId = m[1];
const pdf = await admin.req(`/invoices/${invId}/pdf`);
const ct = pdf.headers.get("content-type");
const buf = Buffer.from(await pdf.arrayBuffer());
assert(ct === "application/pdf", `PDF content-type (${ct})`);
assert(buf.slice(0, 5).toString() === "%PDF-", "PDF starts with %PDF- magic bytes");
assert(buf.length > 1000, `PDF has real content (${buf.length} bytes)`);
assert(
  pdf.headers.get("x-content-type-options") === "nosniff",
  "PDF route sets nosniff"
);

// 7. Authorization: a CONTRACTOR must not reach office features.
// Server Actions / route handlers are the security boundary, not the UI — a
// contractor is confined regardless of which URL they hit directly.
console.log("\n— Authorization (contractor confinement) —");
{
  const contractor = makeSession();
  const cLogin = await contractor.login("dave@example.com", "password123");
  assert(
    (cLogin.status === 302 || cLogin.status === 200) && contractor.hasSession,
    "contractor login establishes a session"
  );

  // Office-only file routes return 404 (the same invoice the admin just read).
  const cPdf = await contractor.req(`/invoices/${invId}/pdf`);
  assert(cPdf.status === 404, `contractor blocked from invoice PDF (${cPdf.status})`);
  const cAtt = await contractor.req(`/jobs/anyjob/attachments/anyatt`);
  assert(cAtt.status === 404, `contractor blocked from attachment route (${cAtt.status})`);

  // Office pages redirect a contractor away (no office data served).
  for (const path of ["/clients", "/invoices", "/contractors", "/settings", "/shopping"]) {
    const r = await contractor.req(path);
    assert(
      [302, 303, 307].includes(r.status),
      `contractor redirected away from ${path} (${r.status})`
    );
  }

  // …but the contractor portal itself works.
  const my = await contractor.req("/my");
  assert(my.status === 200, "contractor can reach their own portal (/my)");
}

console.log("\nALL SMOKE TESTS PASSED ✅");
