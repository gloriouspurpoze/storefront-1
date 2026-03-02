# CORS for Admin (api.profixer.in ↔ admin.profixer.in)

If the admin app at **https://admin.profixer.in** still gets CORS errors when calling **https://api.profixer.in** (e.g. `POST /api/auth/login`), the **API server** must allow that origin and handle preflight.

## What the browser does

1. **Preflight (OPTIONS)**  
   Because the admin sends `Content-Type: application/json`, the browser first sends:
   - `OPTIONS https://api.profixer.in/api/auth/login`
   - Headers: `Origin: https://admin.profixer.in`, `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: content-type`

2. **Actual request (POST)**  
   Only if the OPTIONS response is valid, the browser then sends:
   - `POST https://api.profixer.in/api/auth/login`
   - Header: `Origin: https://admin.profixer.in`

## What the API must do

### 1. Allow the admin origin

The API must include **https://admin.profixer.in** in its allowed CORS origins (and **http://admin.profixer.in** if you test with HTTP). Do **not** allow only `www.profixer.in`; the admin is on a different host.

### 2. Respond correctly to OPTIONS (preflight)

For **OPTIONS** requests, the API should respond with:

- **Status:** `204 No Content` (or `200`)
- **Headers:**
  - `Access-Control-Allow-Origin: https://admin.profixer.in` (or the request’s `Origin` if it’s in your allow list)
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization, ...` (at least the headers the admin sends)
  - `Access-Control-Max-Age: 86400` (optional)

### 3. Add CORS headers to real responses

For **POST /api/auth/login** (and all other endpoints the admin calls), the response must include:

- `Access-Control-Allow-Origin: https://admin.profixer.in`

Other useful headers (if you use credentials):

- `Access-Control-Allow-Credentials: true` (only if you use cookies and allow a specific origin, not `*`)

## Backend checklist (fixer-backend)

- [ ] **Environment:** `CORS_ORIGIN` or equivalent includes `https://admin.profixer.in` and `http://admin.profixer.in` in production/staging.
- [ ] **OPTIONS:** Preflight is handled (by CORS middleware or a global OPTIONS handler) and returns the headers above.
- [ ] **No double CORS:** Only one CORS middleware runs and it’s applied before auth and routes.
- [ ] **Redeploy:** After changing CORS config, redeploy/restart the API and clear CDN/cache if any.

## Quick test from browser console (on admin.profixer.in)

```js
fetch('https://api.profixer.in/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('CORS or network:', e))
```

If you see a CORS error in the console, the API is still not sending the correct `Access-Control-Allow-Origin` (or not handling OPTIONS) for `https://admin.profixer.in`.
