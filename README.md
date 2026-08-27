# KeyPass Manager

A small, single-screen web client for the KeyPass HTTP API — search, add, edit and
delete vault entries. Built with React, TypeScript and Vite. It talks to the real
backend only: there is no mock data, no fake authentication and no local database.

## Requirements

- Node.js 20+ (developed on 22)
- A running KeyPass backend, e.g. `http://localhost:5204` or `https://localhost:7044`
- A bearer token issued by that backend

## Setup

```bash
npm install
cp .env.example .env.local     # then edit VITE_API_BASE_URL if needed
npm run dev                    # http://localhost:5173
```

Scripts:

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Vite dev server with HMR                 |
| `npm run build`   | Type-check and build to `dist/`          |
| `npm run preview` | Serve the production build locally       |

## Configuration

The API base URL is the only build-time configuration:

```
VITE_API_BASE_URL=http://localhost:5204
```

Put it in `.env.local` (git-ignored). Never commit an env file containing a token
or secret — `.env.example` is the only env file in the repository, and it holds
no credentials.

`VITE_BASE_PATH` is optional and only matters for GitHub Pages (see below).

## Authentication

Open **Settings** in the header and paste a bearer token. The token is held in
React state for the current tab only:

- it is never written to `localStorage` or `sessionStorage`, so a reload clears it;
- it is never logged;
- **Sign out** clears the token together with the results and any revealed password.

Every protected request is sent with `Authorization: Bearer <token>` and, when it
carries a body, `Content-Type: application/json`. With no token the app shows an
"Authentication required" prompt instead of failing silently.

### Client credentials

The backend also supports `POST /oauth/token` with
`grant_type=client_credentials`. That flow requires a client secret, which cannot
be kept confidential in a browser bundle, so this app deliberately does **not**
implement it. Obtain a token out of band (your backend, a CLI, a server-side
service) and paste it into Settings.

## How the app handles passwords

The search endpoint returns decrypted passwords, so they are treated as secrets
throughout:

- masked as `******` by default, using `type="password"`;
- revealed only per row, by an explicit click on that row's eye button — there is
  no "reveal all";
- reveal state is cleared when results refresh, when an entry is deleted or
  edited, and on sign out; it is never persisted;
- copy is disabled until the password is revealed;
- passwords never appear in URLs, query strings, logs, error messages, or as
  React keys or DOM attributes.

The API may return the placeholder `[unavailable]` instead of a password (for
example in `POST`/`PATCH` responses). The app recognises that value and shows
"Not available" rather than presenting the placeholder as a real password.

The edit form never loads an existing password. Its field is labelled
**New password (optional)**, and `password` is sent in the `PATCH` body only when
you actually type one — leaving it blank preserves what is stored.

## Endpoints used

| Action | Request |
| ------ | ------- |
| Search | `GET /api/keypass/search?query={query}&top={top}` (`top` is 5, 10 or 20) |
| Add    | `POST /api/keypass` → `201` with the created entry |
| Update | `PATCH /api/keypass/{id}` → `200` with the updated entry |
| Delete | `DELETE /api/keypass/{id}` → `204` |

There is no get-by-id call, because the HTTP API does not expose one: edit and
delete use the IDs returned by search. The re-embed endpoint is out of scope.

## Project structure

```
src/
  api/client.ts            single API client: URLs, bearer token, JSON, errors
  api/keypass.ts           typed wrappers for the four KeyPass endpoints
  api/errors.ts            ApiError + user-safe messages per HTTP status
  types/keypass.ts         KeyPass, Create/Update requests, SearchResponse
  state/AuthContext.tsx    in-memory bearer token
  state/ToastContext.tsx   notifications
  state/useKeyPassSearch.ts search state, cancellation, list updates
  components/EntryForm.tsx      add + edit form
  components/ResultsView.tsx    table (desktop) and cards (mobile)
  components/PasswordCell.tsx   per-row mask / reveal / copy
  components/DeleteDialog.tsx   delete confirmation
  components/SettingsPanel.tsx  token entry
  components/Modal.tsx          accessible dialog shell
  components/Toasts.tsx         notification stack
```

Errors from every call go through `ApiError`, which maps HTTP 400/401/403/404/409/500,
network failures and cancellation to a message that is safe to display. When the
backend returns `{ "error": "..." }`, that message is shown. Raw stack traces and
response bodies are never surfaced.

## Accessibility

Labelled inputs, keyboard-operable dialogs (focus trapped, Escape closes, focus
returns to the opener), Enter submits forms, visible focus rings, descriptive
button names (`Show password for GitHub`, `Copy password for GitHub`), and status
messages that carry a text prefix rather than relying on color alone.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and publishes `dist/` on every push to
`main`. To enable it:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.** This
   step has to be done by hand once: the workflow's `GITHUB_TOKEN` cannot create
   the Pages site itself (the API rejects it with "Resource not accessible by
   integration"), so the first deploy fails until Pages exists.
2. **Settings → Secrets and variables → Actions → Variables** — add a repository
   variable named `VITE_API_BASE_URL` pointing at your KeyPass API. It is baked
   into the bundle at build time, so use a URL, never a token.
3. Push to `main`, or re-run the workflow from the Actions tab.

The site is published at `https://<owner>.github.io/<repo>/`; the workflow sets
`VITE_BASE_PATH` to `/<repo>/` so asset URLs resolve under that sub-path.

Two things to know before pointing the hosted app at a backend:

- **Mixed content.** Pages is served over HTTPS. Firefox and Safari block requests
  to a plain `http://` API from an HTTPS page (Chromium exempts `http://localhost`).
  For a usable deployment, expose the API over HTTPS.
- **CORS.** The backend must allow the Pages origin
  (`https://<owner>.github.io`) and the `Authorization` header.

If the API only listens on localhost, run the app locally with `npm run dev`
instead — that is the supported development setup.

## Security notes

No tokens, client IDs or client secrets are in the source or in any committed
file. Passwords and tokens are never logged, never persisted, and are cleared
from component state after submit or cancel. No analytics or telemetry is sent.
