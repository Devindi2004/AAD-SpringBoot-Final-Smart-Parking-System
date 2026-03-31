# JWT Implementation Steps

## Overview

This document walks through every change made to implement JWT authentication in ParkSmart. Changes span both the Spring Boot backend and the vanilla JS frontend.

---

## Backend Changes

### Step 1 — Add JJWT Dependency (`pom.xml`)

JJWT (Java JWT) is the standard library for creating and validating JWTs in Java. Three artifacts are needed:

- `jjwt-api` — the public API (interfaces and builder)
- `jjwt-impl` — the runtime implementation (scope: runtime)
- `jjwt-jackson` — Jackson-based JSON parsing for JWT payload (scope: runtime)

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

---

### Step 2 — Add JWT Config to `application-dev2.properties`

Add the secret key and expiration time. The secret must be long enough for HS256 (≥256 bits):

```properties
jwt.secret=a-very-long-random-secret-key-for-parksmart-app-minimum-256-bits
jwt.expiration=86400000
```

- `jwt.secret` — used to sign and verify every token
- `jwt.expiration` — token lifetime in milliseconds (86400000 = 24 hours)

---

### Step 3 — Create `JwtUtil.java` (new `security/` package)

**Package:** `org.example.backend.security`

This class is responsible for all token operations:

- `generateToken(User user)` — creates a signed JWT with user claims
- `extractUserId(String token)` — reads the `sub` claim (user ID)
- `extractEmail(String token)` — reads the `email` claim
- `extractRole(String token)` — reads the `role` claim
- `isTokenValid(String token)` — returns true if signature is valid and token is not expired

Reads `jwt.secret` and `jwt.expiration` from `application.properties` via `@Value`.

---

### Step 4 — Create `JwtAuthFilter.java` (new `security/` package)

**Package:** `org.example.backend.security`

Extends `OncePerRequestFilter` — Spring calls this for every HTTP request before it reaches any controller.

**Logic per request:**

```
1. Read the "Authorization" header
2. If header is missing or doesn't start with "Bearer " → skip (let Spring handle it)
3. Extract the token string (strip "Bearer " prefix)
4. Call JwtUtil.isTokenValid(token)
   → If invalid/expired: return 401 Unauthorized
5. Extract userId and role from token claims
6. Create an Authentication object and set it in SecurityContextHolder
7. Call filterChain.doFilter() to pass the request to the next filter/controller
```

Once the `SecurityContext` is set, Spring Security considers the request authenticated for that thread.

---

### Step 5 — Create `AuthResponseDTO.java` (`dto/` package)

**Package:** `org.example.backend.dto`

A new response DTO that wraps both the token and the user data:

```java
private String token;
private UserDTO user;
```

This is what the frontend receives on successful login instead of a plain `UserDTO`.

---

### Step 6 — Update `SecurityConfig.java`

Two additions:

1. **Register `JwtAuthFilter`** in the filter chain — it must run before Spring's `UsernamePasswordAuthenticationFilter`
2. **Set session policy to STATELESS** — disables server-side HTTP sessions entirely (JWT is stateless)
3. **Tighten route security** — change from `permitAll()` for all `/api/**` to:
   - `/api/auth/**` → permitAll (login endpoint stays public)
   - Everything else → `authenticated()` (requires valid JWT)

```
Before: all /api/** → permitAll
After:  /api/auth/** → permitAll
        /api/**      → authenticated (valid JWT required)
```

---

### Step 7 — Update `AuthService.java` (interface)

Change the return type of `login()` from `UserDTO` to `AuthResponseDTO`:

```java
// Before
UserDTO login(LoginRequestDTO request);

// After
AuthResponseDTO login(LoginRequestDTO request);
```

---

### Step 8 — Update `AuthServiceImpl.java`

Inject `JwtUtil`. After successful credential verification, generate a token and return `AuthResponseDTO`:

```
1. Find user by email
2. BCrypt.matches() verify password
3. Block OWNER + INACTIVE
4. JwtUtil.generateToken(user)  ← NEW
5. Return AuthResponseDTO(token, userDTO)  ← NEW (was just userDTO)
```

---

### Step 9 — Update `AuthController.java`

Change return type to `AuthResponseDTO` to match the service:

```java
// Before
public UserDTO login(@RequestBody LoginRequestDTO request)

// After
public AuthResponseDTO login(@RequestBody LoginRequestDTO request)
```

---

## Frontend Changes

### Step 10 — Update `api.config.js`

The central `apiFetch()` function must attach the JWT to every request.

Read the token from `sessionStorage` and add it as a header:

```js
// Before
headers: { 'Content-Type': 'application/json' }

// After
headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
}
```

Also handle `401 Unauthorized` responses — if the server rejects the token (expired or invalid), automatically call `logout()` to clear the session and redirect to login.

---

### Step 11 — Update `auth.api.js`

The login response now contains `{ token, user }` instead of just a user object.

`redirectToDashboard()` must be updated to:

1. Store `token` in `sessionStorage` under the key `"token"`
2. Store `user` in `sessionStorage` under the key `"currentUser"` (unchanged key — all dashboards keep working)

```js
// Before
sessionStorage.setItem('currentUser', JSON.stringify(user));

// After
sessionStorage.setItem('token', response.token);
sessionStorage.setItem('currentUser', JSON.stringify(response.user));
```

`logout()` must also clear the token:

```js
// Before
sessionStorage.removeItem('currentUser');

// After
sessionStorage.removeItem('currentUser');
sessionStorage.removeItem('token');
```

---

## Files Changed Summary

| File | Type | Change |
|------|------|--------|
| `pom.xml` | Backend | Add jjwt-api, jjwt-impl, jjwt-jackson |
| `application-dev2.properties` | Backend | Add jwt.secret and jwt.expiration |
| `security/JwtUtil.java` | Backend — NEW | Token generation and validation |
| `security/JwtAuthFilter.java` | Backend — NEW | Per-request token verification filter |
| `dto/AuthResponseDTO.java` | Backend — NEW | Login response wrapping token + user |
| `config/SecurityConfig.java` | Backend | Register filter, STATELESS, tighten routes |
| `service/AuthService.java` | Backend | Return type → AuthResponseDTO |
| `service/impl/AuthServiceImpl.java` | Backend | Generate token, return AuthResponseDTO |
| `controller/AuthController.java` | Backend | Return type → AuthResponseDTO |
| `js/api/api.config.js` | Frontend | Attach Bearer token to every apiFetch |
| `js/api/auth.api.js` | Frontend | Store token, update logout to clear token |

---

## New Package Structure

```
backend/src/main/java/org/example/backend/
├── config/
│   ├── CorsConfig.java
│   ├── ModelMapperConfig.java
│   ├── SecurityConfig.java          ← modified
│   └── SwaggerConfig.java
├── controller/
│   └── AuthController.java          ← modified
├── dto/
│   ├── AuthResponseDTO.java         ← NEW
│   ├── LoginRequestDTO.java
│   └── UserDTO.java
├── security/                        ← NEW PACKAGE
│   ├── JwtUtil.java                 ← NEW
│   └── JwtAuthFilter.java           ← NEW
├── service/
│   ├── AuthService.java             ← modified
│   └── impl/
│       ├── AuthServiceImpl.java     ← modified
│       └── UserServiceImpl.java
```

---

## After Implementation — Login Flow

```
Browser                              Spring Boot
   │                                      │
   │  POST /api/auth/login                │
   │  { email, password } ───────────────►│
   │                                      │  AuthServiceImpl:
   │                                      │  1. findByEmail()
   │                                      │  2. BCrypt.matches()
   │                                      │  3. JwtUtil.generateToken()
   │◄─────────────────────────────────────│
   │  {                                   │
   │    "token": "eyJhbGciOiJIUzI...",   │
   │    "user": { id, role, name... }     │
   │  }                                   │
   │                                      │
   │  sessionStorage.set("token", ...)    │
   │  sessionStorage.set("currentUser")   │
   │  → redirect to dashboard             │
   │                                      │
   │  GET /api/appointments               │
   │  Authorization: Bearer eyJhbG... ───►│
   │                                      │  JwtAuthFilter:
   │                                      │  1. Extract + validate token
   │                                      │  2. Set SecurityContext
   │                                      │  3. Forward to controller
   │◄─────────────────────────────────────│
   │  [ appointments data ]               │
```
