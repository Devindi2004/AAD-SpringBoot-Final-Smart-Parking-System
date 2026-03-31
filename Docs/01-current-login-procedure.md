# Current Login Procedure

## Overview

The current authentication system uses a simple **email + password** check with BCrypt hashing. No tokens are issued. The entire user object is stored in the browser's `sessionStorage` and trusted without any server-side verification on subsequent requests.

---

## Step-by-Step Flow

### 1. User Submits Login Form (Frontend)

File: `Frontend/index.html` → `Frontend/js/pages/index.js`

The login form collects `email` and `password`. On submit, it calls:

```js
AuthAPI.login({ email, password })
```

This sends a `POST` request to `http://localhost:8080/api/auth/login` with a JSON body.

---

### 2. Backend Receives the Request

File: `AuthController.java` → `POST /api/auth/login`

```java
public UserDTO login(@RequestBody LoginRequestDTO request)
```

The controller passes the request straight to `AuthServiceImpl.login()`.

---

### 3. AuthServiceImpl Validates Credentials

File: `AuthServiceImpl.java`

```
Step A — Find user by email
  userRepository.findByEmail(request.getEmail())
  → If not found: throw ResourceNotFoundException("No account found with this email address")

Step B — Verify password (BCrypt)
  passwordEncoder.matches(request.getPassword(), user.getPassword())
  → If mismatch: throw InvalidCredentialsException("Incorrect password. Please try again")

Step C — Block pending owners
  if (role == OWNER && status == INACTIVE)
  → throw InvalidCredentialsException("Your account is pending admin approval...")

Step D — Map entity to DTO and strip password
  UserDTO dto = modelMapper.map(user, UserDTO.class)
  dto.setPassword(null)
  return dto
```

---

### 4. Backend Returns UserDTO

The response body is a plain JSON object:

```json
{
  "id": 1,
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@parksmart.com",
  "phone": "0771234567",
  "role": "ADMIN",
  "status": "ACTIVE",
  "password": null
}
```

No token. No session cookie. Just the user data.

---

### 5. Frontend Stores User and Redirects

File: `Frontend/js/api/auth.api.js` → `redirectToDashboard(user)`

```js
sessionStorage.setItem('currentUser', JSON.stringify(user));
```

The role field determines which dashboard to load:

| Role    | Dashboard                        |
|---------|----------------------------------|
| DRIVER  | `pages/driver-dashboard.html`    |
| OWNER   | `pages/owner-dashboard.html`     |
| ADMIN   | `pages/admin-dashboard.html`     |

---

### 6. Every Dashboard Page Reads sessionStorage

File: `Frontend/js/api/auth.api.js` → `getCurrentUser()`

```js
function getCurrentUser() {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}
```

All dashboards call this on load to get the user's `id`, `role`, `firstName`, etc.

---

### 7. All API Calls — No Authorization Header

File: `Frontend/js/api/api.config.js` → `apiFetch()`

```js
const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
};
```

No `Authorization` header is attached. The backend has `permitAll()` on all `/api/**` routes, so any request from any client is accepted without verification.

---

## Security Gaps in Current System

| Gap | Risk |
|-----|------|
| No token issued | Anyone can call any API endpoint without logging in |
| sessionStorage holds full user object | Can be manually crafted or tampered with |
| All `/api/**` are `permitAll()` | No server-side enforcement of who is calling what |
| Role is only checked on the frontend | A user could change `role` in sessionStorage and access other dashboards |
| No expiry | A stolen sessionStorage object works indefinitely until the tab is closed |

---

## Sequence Diagram

```
Browser                     Spring Boot
   │                              │
   │  POST /api/auth/login        │
   │  { email, password }─────────►
   │                              │  findByEmail()
   │                              │  BCrypt.matches()
   │                              │  map to UserDTO
   │◄─────────────────────────────│
   │  { id, role, name... }       │
   │                              │
   │  sessionStorage.set()        │
   │  redirect to dashboard       │
   │                              │
   │  GET /api/appointments ──────►  (no auth header)
   │◄───────────────────────────── (accepted blindly)
```
