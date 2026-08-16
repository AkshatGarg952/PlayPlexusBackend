# PlayPlexus — Backend

REST + Socket.IO API for [PlayPlexus](../PlayPlexusFrontend): players and teams
register, search for each other by sport/game and city, send play requests, chat
in real time, and ask a small assistant to find people for them.

Built with **Express 5**, **MongoDB/Mongoose**, **Socket.IO** and **JWT** auth.

---

## Table of contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Data model](#data-model)
- [REST API](#rest-api)
- [Socket.IO API](#socketio-api)
- [Authentication & authorization](#authentication--authorization)
- [The assistant](#the-assistant)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick start

**Requirements:** Node.js 18-23 (22 LTS recommended) and a MongoDB database
(local or Atlas).

> **Node 24+ is not supported.** `jsonwebtoken` depends on
> `buffer-equal-constant-time`, which uses the `SlowBuffer` API that newer
> Node releases removed — the process crashes on start-up. The version is
> pinned in `.node-version` and `engines.node`; keep both in step.

```bash
cd PlayPlexusBackend

# The lockfile needs legacy peer resolution — see Troubleshooting.
npm install --legacy-peer-deps

cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run dev               # nodemon, restarts on change
```

The server prints `[server] listening on port 3000 (development)` once MongoDB is
connected. Check it with:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptime":1.23}
```

| Script | Purpose |
| --- | --- |
| `npm start` | Run the server. |
| `npm run dev` | Run with nodemon for local development. |

The process **exits immediately** if `DATABASE_URL` or `JWT_SECRET` is missing, or
if the database is unreachable — a failure at boot rather than on first request.

---

## Configuration

All configuration is read once, in [`src/config/env.js`](src/config/env.js).
Nothing else in the codebase reads `process.env`.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | **yes** | — | MongoDB connection string. |
| `JWT_SECRET` | **yes** | — | Signing key for access tokens. |
| `PORT` | no | `3000` | Port to listen on. |
| `NODE_ENV` | no | `development` | `production` hides error details and stack traces. |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated allowed origins (REST **and** sockets). |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime. |
| `CLOUDINARY_CLOUD_NAME` | no | — | Image uploads. Omit all three and uploads are skipped. |
| `CLOUDINARY_API_KEY` | no | — | |
| `CLOUDINARY_API_SECRET` | no | — | |
| `EXPIRY_JOB_INTERVAL_MS` | no | `60000` | How often pending requests are swept for expiry. |
| `LIBRETRANSLATE_URLS` | no | two public mirrors | Translation endpoints for the assistant. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Architecture

```
index.js                     Boot: connect DB → build app → attach sockets → listen
└── src/
    ├── app.js               Express app: CORS, parsers, routers, error handling
    ├── config/env.js        Validated configuration (the only reader of process.env)
    ├── database/mongoose.js Connection lifecycle
    ├── realtime/socket.js   Socket.IO server, handshake auth, chat, rooms
    ├── middleware/
    │   ├── jwt.auth.js          Bearer-token guard (+ verifyToken, reused by sockets)
    │   ├── multer.middleware.js Cloudinary uploads, optional and fail-soft
    │   └── error.middleware.js  404 + the single error-to-response translator
    ├── utils/
    │   ├── ApiError.js       Errors that carry an HTTP status
    │   ├── asyncHandler.js   Rejected promises → Express error middleware
    │   └── parseList.js      "a, b, c" → ["a","b","c"]
    └── features/
        ├── accounts/         Shared account behaviour (see below)
        ├── users/            User model + routes
        ├── teams/            Team model + routes
        ├── requests/         Play requests + the expiry job
        ├── chats/            Message model and history
        └── chatbot/          Intent parsing, keyword data, translation
```

### Users and teams share one implementation

A user and a team are the same kind of thing for authentication, search and
messaging: a named account with credentials, a location, an avatar and a list of
sports and games. They differ in three details only — a user has a `username`, a
team has a `leader`, and their avatars are called `profileImage` and `logo`.

So the behaviour lives once in `features/accounts/` and is configured per model:

```js
// features/users/user.routes.js
const repository = createAccountRepository({
  Model: User,
  label: 'User',
  uniqueFields: [{ field: 'username', message: 'User with this username already exists!' }],
});

const controller = createAccountController({
  repository,
  resourceKey: 'user',            // response envelope: { user, token }
  imageField: 'profileImage',
  textFields: ['name', 'username', 'email', 'password', 'phone', 'location', 'bio'],
});
```

`features/teams/team.routes.js` is the same file with `leader`, `logo` and `team`
substituted. Adding a field or fixing a bug happens in one place.

### Error handling

Route handlers are wrapped in `asyncHandler` and simply throw:

```js
if (request.status !== 'pending') {
  throw ApiError.conflict(`This request has already been ${request.status}.`);
}
```

`error.middleware.js` turns those into responses, and also translates Mongoose
`ValidationError` → 400 with readable text, duplicate keys → 409, and `CastError`
→ 400. Handlers contain no `try`/`catch` and no `res.status(...)` for failures.

---

## Data model

### `User` / `Team`

Both are built by `createAccountSchema`, which supplies:

| Field | Notes |
| --- | --- |
| `name` | 3–50 chars. |
| `location` | Stored lower-case; searches are case-insensitive. |
| `email` | Unique, lower-case, format-checked. |
| `password` | **`select: false`** — never loaded unless a query asks. Hashed by a `pre('save')` hook whenever it changes. |
| `phone`, `bio` | |
| `sports`, `onlineGames` | Arrays of strings, trimmed and lower-cased on write. |
| `createdAt` / `updatedAt` | From `timestamps: true`. |

Plus `username` (User) or `leader` (Team), and `profileImage` (User) or `logo` (Team).

`toJSON` deletes `password` as a second line of defence, so a hash cannot reach a
client even if a query selects it.

### `Request`

A play request between two accounts, either of which may be a user or a team.
Sender and receiver are stored as plain `ObjectId`s alongside a `senderModel` /
`receiverModel` discriminator (`'User' | 'Team'`), and display names are
denormalised onto the document so listing requests needs no extra lookups.

`status` is one of `pending | accepted | rejected | expired | cancelled`.
`expiresAt` drives the expiry sweep; `scheduledFor` is when the match itself is.

### `Message`

`conversationId` is the two participant ids sorted and joined with `_`, so both
directions of a conversation share one indexed key and history is a single
lookup rather than a two-branch `$or`.

---

## REST API

Base path `/api`. All responses are JSON. Errors are `{ "message": "..." }`.

Every route except registration, login and `/health` requires:

```
Authorization: Bearer <token>
```

### Accounts

`:kind` is `users` or `teams`; the shapes are identical apart from
`username`/`leader` and the response key.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/:kind/register` | — | Create an account. `multipart/form-data` if sending an image. → `201 { user\|team, token }` |
| `POST` | `/api/:kind/login` | — | → `200 { user\|team, token }` |
| `GET` | `/api/users/details/:id` | ✔ | One account. |
| `GET` | `/api/users/allUsers/:id` | ✔ | All accounts **except** `:id`. |
| `GET` | `/api/teams/allTeams/:id` | ✔ | As above, for teams. |
| `POST` | `/api/:kind/update/:id` | ✔ (self) | Partial update. Sending `password` re-hashes it. |
| `GET` | `/api/:kind/filterbyLocation/:location` | ✔ | Exact city match. |
| `GET` | `/api/:kind/filter/:sport/:loca/:id` | ✔ | Search by activity + city, excluding `:id`. `all` / `null` mean "no filter". |

Registration accepts `sports` and `onlineGames` as either an array or a
comma-separated string (`"Cricket, Football"`).

### Requests

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/requests/send/:sId/:rId` | Send a request. `:sId` must be the caller. |
| `GET` | `/api/requests/details/:id` | Everything the account is involved in. |
| `GET` | `/api/requests/newdetails/:id` | Unseen incoming requests (notifications). |
| `GET` | `/api/requests/sended/:id` | Sent only. |
| `GET` | `/api/requests/received/:id` | Received only. |
| `POST` | `/api/requests/update/:id` | `{ "status": "accepted" \| "rejected" \| "cancelled" }` |
| `POST` | `/api/requests/seen/:id` | Mark incoming requests read. → `204` |
| `GET` | `/api/requests/sender/:id` | `{ total, statusWise: [{_id, count}] }` for the dashboard. |
| `GET` | `/api/requests/receiver/:id` | As above, for received. |

Send body:

```json
{
  "message":    "Fancy a match this weekend?",
  "dateTime":   "2030-06-01T18:30",
  "expiryTime": 24,
  "expiryUnit": "hours",
  "sport":      "cricket",
  "venue":      "Oval Ground"
}
```

`expiryUnit` is `seconds`, `minutes` or `hours`, capped at 30 days. Use `game`
and `platform` instead of `sport` and `venue` for an online game.

**Status rules**, enforced server-side:

- only the **receiver** may `accept` or `reject`;
- only the **sender** may `cancel`;
- only while the request is still `pending`;
- `expired` is set exclusively by the background job, never by a client.

### Chat & assistant

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/chats/fetch/:sId/:rId` | Full history, oldest first. Caller must be one of the two. |
| `POST` | `/api/chatBot/ask/:id` | `{ "userSpeechText": "..." }` → `{ text, link?, requiresMoreInfo?, suggestion? }` |

---

## Socket.IO API

Connect with the same JWT the REST API uses:

```js
io('http://localhost:3000', { auth: { token } });
```

The handshake is rejected without a valid token. The authenticated id is the
**only** identity the server trusts, so a client cannot act as somebody else.

Each connection automatically joins a private room `account:<id>` used for
request notifications.

**Client → server**

| Event | Payload | Notes |
| --- | --- | --- |
| `joinConversation` | `peerId` | Join the room for a conversation. |
| `sendMessage` | `{ message, receiverId }`, plus an ack callback | `senderId` is taken from the token, never the payload. Ack is `{ ok, message }` or `{ error }`. |

**Server → client**

| Event | Payload | When |
| --- | --- | --- |
| `receiveMessage` | the saved message | A message is sent in a joined conversation. |
| `requestCreated` | the new request | Someone sends you a request. |
| `receive` | `{ id, status, seen }` | A request you are part of changes status. |

Status changes are emitted **by the controller after the database write**, only
to the two participants' rooms.

---

## Authentication & authorization

Tokens are `{ id }` signed with `JWT_SECRET`, sent as `Authorization: Bearer <token>`.
`jwtAuth` verifies them and sets `req.user`. Expired tokens return
`401 { message, code: "TOKEN_EXPIRED" }` so the client can prompt a fresh login.

Authentication is not enough on its own — routes also check *what* you may touch:

- `POST /api/:kind/update/:id` — only your own account;
- every `/api/requests/*` read — only your own requests;
- `POST /api/requests/update/:id` — only your side of that request, and only the
  transitions listed above;
- `GET /api/chats/fetch/:sId/:rId` — only a participant;
- `POST /api/chatBot/ask/:id` — only as yourself.

---

## The assistant

`POST /api/chatBot/ask/:id` is a **rule-based** parser, not an LLM — it has no
API key and makes no model calls.

1. `chatbot.translate.js` detects the language with `franc` and translates the
   message to English via LibreTranslate.
2. `chatbot.intent.js` decides whether it is a "find players/teams" request and
   extracts the activity, whether players or teams are wanted, and the city.
3. `chatbot.controller.js` answers with a link into the frontend
   (`/FUserPage/:id/:activity/:city` or `/FTeamPage/...`), asks for the missing
   city, or falls back to a suggestion.
4. The reply is translated back to the original language.

Translation is **best-effort**: if every mirror fails, the reply is returned in
English rather than erroring.

Recognised sports and games are plain dictionaries in `chatbot.data.js`; add
aliases there. Longer aliases are matched first, so `"counter strike"` wins over
a bare `"cs"`, and matching is word-boundary aware so `"val"` will not match
`"value"`.

---

## Deployment

1. Set every variable from [Configuration](#configuration); set `NODE_ENV=production`.
2. Put the deployed frontend's origin in `CORS_ORIGINS` (comma-separated for more
   than one). This governs both REST and WebSocket connections — a missing entry
   shows up as CORS errors and sockets that will not connect.
3. Run `npm ci --legacy-peer-deps && npm start`.
4. Point health checks at `GET /health`.

The host must support **WebSockets** for chat and live request updates.
`SIGTERM`/`SIGINT` are handled: the expiry job stops, sockets and the server
close, and the database connection is released.

---

## Troubleshooting

**`npm install` fails with `ERESOLVE`/`Conflicting peer dependency: cloudinary@1.41.3`**
`multer-storage-cloudinary@4` declares a peer of `cloudinary@^1`, but this project
uses `cloudinary@2`. The v2 API it relies on is compatible, so install with
`--legacy-peer-deps`. Replacing that package is the proper long-term fix.

**`TypeError: Cannot read properties of undefined (reading 'prototype')`
in `buffer-equal-constant-time`**
The host is running Node 24 or newer. Pin Node 22 — commit `.node-version`,
or set `NODE_VERSION=22` in your host's environment. On Render, redeploy
with **Clear build cache & deploy** so the native `bcrypt` binding is
rebuilt for the new Node ABI.

**Process exits with `Missing required environment variable`**
`.env` is absent or incomplete. Copy `.env.example` and fill it in.

**`[uploads] Cloudinary is not configured`**
Expected without Cloudinary credentials. Registration and profile updates still
work; the image is discarded.

**CORS errors, or sockets never connect**
The frontend origin is not in `CORS_ORIGINS`. It must be the exact scheme + host
+ port, with no trailing slash.

**Requests never become `expired`**
The sweep runs in-process every `EXPIRY_JOB_INTERVAL_MS`. On a host that idles
your dyno, nothing runs while it is asleep; requests expire on the next wake-up.

---

## Notes for maintainers

Recent refactoring changed two things that touch existing data:

- **`Request`** replaced the separate `date` (Date) and `time` (String) fields
  with a single `scheduledFor` datetime, and the unused `refPath`/`responses`
  fields with explicit `senderModel` / `receiverModel`.
- **`Message`** gained `conversationId` and `timestamps`, replacing the manual
  `timestamp` field.

New documents are written in the new shape. **Existing production documents need
a one-off migration** before they will display correctly; there is no migration
script in the repo yet.
