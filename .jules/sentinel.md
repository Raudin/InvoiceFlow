# Sentinel Security Journal

## 2025-05-15 - JWT Algorithm Switching Prevention
**Vulnerability:** The application did not validate the JWT signing method during token verification, potentially allowing an attacker to use a 'none' algorithm or a public key in place of an HMAC secret (algorithm switching attack).
**Learning:** Modern JWT libraries often require explicit validation of the signing method in the `Keyfunc` callback to prevent these types of attacks.
**Prevention:** Always check `token.Method` in the parsing logic and ensure the application fails securely on startup if critical secrets like `JWT_SECRET` are missing.
