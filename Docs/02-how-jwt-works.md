# How JWT Authentication Works

## What is a JWT?

JWT stands for **JSON Web Token**. It is a compact, URL-safe string that securely transmits claims (facts) between two parties — typically a client (browser) and a server.

A JWT proves **who you are** and **what you are allowed to do**, without the server needing to look up a session in a database on every request.

---

## JWT Structure

A JWT is three Base64-encoded parts joined by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header
.eyJzdWIiOiIxIiwicm9sZSI6IkFETUlOIn0   ← Payload (Claims)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_  ← Signature
```

### Part 1 — Header

Describes the token type and the signing algorithm:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Part 2 — Payload (Claims)

Contains the actual data. For ParkSmart, this includes:

```json
{
  "sub": "1",
  "email": "admin@parksmart.com",
  "role": "ADMIN",
  "firstName": "Admin",
  "lastName": "User",
  "iat": 1711900000,
  "exp": 1711986400
}
```

| Claim       | Meaning                              |
|-------------|--------------------------------------|
| `sub`       | Subject — the user's ID              |
| `email`     | User's email                         |
| `role`      | ADMIN / DRIVER / OWNER               |
| `firstName` | Display name                         |
| `iat`       | Issued At — Unix timestamp           |
| `exp`       | Expiry — Unix timestamp (24h later)  |

### Part 3 — Signature

Prevents tampering. The server creates this by signing `Header + Payload` with a **secret key** only the server knows:

```
HMACSHA256(base64(header) + "." + base64(payload), SECRET_KEY)
```

If anyone modifies the payload (e.g. changes `role` from `DRIVER` to `ADMIN`), the signature will no longer match and the token is rejected.

---

## The Full JWT Flow

### Login (Token Issuance)

```
Browser                          Spring Boot
   │                                  │
   │  POST /api/auth/login            │
   │  { email, password } ───────────►│
   │                                  │  1. Find user by email
   │                                  │  2. BCrypt.matches() verify password
   │                                  │  3. Generate JWT token with user claims
   │                                  │     (id, email, role, exp = now + 24h)
   │                                  │  4. Sign with SECRET_KEY
   │◄─────────────────────────────────│
   │  {                               │
   │    "token": "eyJhbG...",         │
   │    "user": { id, role, name }    │
   │  }                               │
   │                                  │
   │  sessionStorage.set("token")     │
   │  sessionStorage.set("currentUser")│
   │  → redirect to dashboard         │
```

### Every Subsequent API Request

```
Browser                          Spring Boot
   │                                  │
   │  GET /api/appointments           │
   │  Authorization: Bearer eyJhbG...►│
   │                                  │  JwtAuthFilter runs:
   │                                  │  1. Extract token from header
   │                                  │  2. Validate signature + expiry
   │                                  │  3. Extract user id + role from claims
   │                                  │  4. Set SecurityContext
   │                                  │  5. Pass request to controller
   │◄─────────────────────────────────│
   │  [ appointment data ]            │
```

### Invalid / Expired Token

```
Browser                          Spring Boot
   │                                  │
   │  GET /api/appointments           │
   │  Authorization: Bearer EXPIRED ─►│
   │                                  │  JwtAuthFilter:
   │                                  │  token expired → reject
   │◄─────────────────────────────────│
   │  401 Unauthorized                │
   │                                  │
   │  logout() → redirect to login    │
```

---

## Key Concepts

### Stateless Authentication

The server does **not** store sessions in memory or a database. Every token is self-contained — the server just validates the signature and reads the claims. This means:

- No session table in the database
- Works across multiple server instances
- Scales horizontally without sticky sessions

### Secret Key

The `SECRET_KEY` is a long random string stored in `application.properties`. It must:

- Never be committed to version control
- Be at least 256 bits (32 characters) long for HS256
- Be the same across all instances of the backend

If the secret leaks, all existing tokens can be forged.

### Token Expiry

Tokens have a built-in expiry (`exp` claim). After expiry:

- The server rejects the token with `401 Unauthorized`
- The frontend catches this and calls `logout()`, redirecting to the login page
- The user must log in again to get a fresh token

In ParkSmart, tokens expire after **24 hours**.

### Why Not Store Tokens in localStorage?

`sessionStorage` is used instead of `localStorage` because:

| | sessionStorage | localStorage |
|---|---|---|
| Lifespan | Cleared when tab closes | Persists forever |
| XSS risk | Same, but shorter window | Longer exposure |
| Suitable for | Session-scoped auth | Persistent preferences |

---

## What Changes With JWT vs The Old System

| Aspect | Before JWT | After JWT |
|--------|------------|-----------|
| What login returns | Plain `UserDTO` | `{ token, user }` |
| How identity is verified | Only on login | On every API request |
| API security | All `/api/**` open | Only `/api/auth/**` open |
| Role tampering | Possible via sessionStorage edit | Impossible — signature prevents it |
| Session expiry | Tab close | 24 hours |
| Header on requests | None | `Authorization: Bearer <token>` |
