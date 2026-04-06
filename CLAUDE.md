# CLAUDE.md — AI Assistant Guide for `crypto`

## Project Overview

**crypto** (암복호화 모음) is an early-stage Node.js/Express web application for AES256 encryption and decryption. The UI is browser-based using CryptoJS; the server currently serves pages and lays groundwork for server-side crypto operations.

---

## Repository Structure

```
crypto/
├── src/
│   ├── server.js             # Express app entry point (port 3000)
│   ├── routes/
│   │   └── aes.js            # Route: GET /aes/aes256 → renders aes256.ejs
│   ├── views/
│   │   ├── aes256.ejs        # AES256 encrypt/decrypt UI (Bootstrap + CryptoJS)
│   │   └── index.html        # Home page scaffold (Bootstrap, Reflow CMS)
│   └── public/
│       ├── js/
│       │   ├── aesScript.js  # Client-side AES logic (INCOMPLETE — see Known Issues)
│       │   ├── app.js        # App init stub (empty)
│       │   ├── common.js     # Utility stub (empty)
│       │   └── customCrypto.js # Crypto wrapper stub (empty)
│       └── assets/
│           ├── bootstrap/css/bootstrap.min.css
│           ├── css/styles.min.css  (empty)
│           ├── js/script.min.js
│           ├── fonts/        # Google Fonts (.woff2 files)
│           └── img/          # Static images
├── babel.config.json         # Babel preset-env config
├── nodemon.json              # Nodemon: watches src/, ignores public/
├── package.json
└── package-lock.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server framework | Express 4.x |
| Templating | EJS |
| Transpilation | Babel (`@babel/preset-env`) + babel-node |
| Dev server | Nodemon |
| Client-side crypto | CryptoJS 4.0.0 (CDN) |
| Styling | Bootstrap 5.2.3 (local + CDN) |

---

## Development Workflow

### Start the dev server

```bash
npm run dev
```

This runs `nodemon` → `babel-node src/server.js`. The server auto-reloads on changes to `src/` (but ignores `src/public/`).

- App is available at: `http://localhost:3000`
- AES256 page: `http://localhost:3000/aes/aes256`

### No build step

There is no separate build or compile step. Babel transpilation happens at runtime via `babel-node`.

### No tests

No test framework is configured. When adding tests, choose Jest (already compatible with the Babel setup) and add a `test` script to `package.json`.

---

## Key Conventions

### Server-side (Node.js)

- Use CommonJS `require`/`module.exports` in route files (consistent with existing code).
- `server.js` uses ES module-style `import`-compatible syntax via Babel — new server-level code may use `import`/`export`.
- All routes live in `src/routes/` and are mounted in `server.js` with `app.use('/prefix', router)`.
- Views are EJS templates in `src/views/`. Pass a `title` variable from every render call.
- Static assets are served from `src/public/` at the root URL path.

### Client-side (Browser JS)

- Client scripts live in `src/public/js/`.
- CryptoJS is loaded from CDN — use the `CryptoJS` global; do not bundle it.
- jQuery is **not** present. Do **not** use `$()`. Use `document.getElementById()` or `document.querySelector()`.
- Bootstrap JS is loaded from CDN in EJS templates.

### Naming

- Route files: lowercase, feature-named (e.g., `aes.js`, `rsa.js`).
- View templates: lowercase, feature-named (e.g., `aes256.ejs`).
- Client scripts: camelCase (e.g., `aesScript.js`).

---

## Known Issues / Incomplete Areas

These are intentional gaps in the current codebase that future work should address:

1. **`aesScript.js` has bugs and is incomplete:**
   - Line 44: `CryptoJS.mode.` — syntax error, incomplete statement.
   - `getAes256Decrypt()` actually calls `CryptoJS.AES.encrypt` (should be `.decrypt`).
   - `getAes256Encrypt()` is an empty stub.
   - `setCrytoText()` references `text` but doesn't declare it as a parameter.
   - All DOM selectors use `$('id').value()` — jQuery style that won't work; should be `document.getElementById('id').value`.

2. **`aes256.ejs` UI is not wired to `aesScript.js`:**
   - Buttons have no `onclick` handlers.
   - Input `id` attributes don't match the IDs referenced in `aesScript.js`.
   - The template does not load `aesScript.js`.

3. **Stub files** (`app.js`, `common.js`, `customCrypto.js`) are empty — placeholder for future implementation.

4. **No server-side crypto endpoints** — `crypto` is imported in `server.js` but unused. No API routes for server-side AES operations exist yet.

5. **`styles.min.css` is empty** — custom styles not yet written.

---

## Adding New Features

### Add a new crypto algorithm (e.g., RSA)

1. Create `src/routes/rsa.js` following the pattern in `src/routes/aes.js`.
2. Create `src/views/rsa.ejs` following the structure of `aes256.ejs`.
3. Create `src/public/js/rsaScript.js` for client-side logic.
4. Mount the router in `src/server.js`: `app.use('/rsa', rsaRouter)`.

### Add server-side encryption API

1. Add a POST route in the relevant router file.
2. Use Node's built-in `crypto` module (already imported in `server.js`).
3. Parse request body with `bodyParser` (already configured).
4. Return JSON responses.

---

## Dependencies

### Production

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `ejs` | Server-side HTML templating |
| `body-parser` | Parse JSON and URL-encoded request bodies |
| `cookie-parser` | Parse cookies (session support) |
| `express-session` | Session management |
| `connect-flash` | Flash messages between requests |
| `connect-multiparty` | Multipart form data (file uploads) |
| `crypto` | Node.js crypto wrapper (currently unused) |
| `morgan` | HTTP request logging |

### Dev

| Package | Purpose |
|---|---|
| `nodemon` | Auto-restart server on file changes |
| `@babel/core`, `@babel/cli`, `@babel/node`, `@babel/preset-env` | ES6+ transpilation |

---

## Git & Branch Strategy

- Default branch: `main`
- Feature branches follow the pattern: `claude/<feature-name>-<id>`
- Current documentation branch: `claude/add-claude-documentation-TMhS5`
- Remote: configured via local proxy at `127.0.0.1:40083`
