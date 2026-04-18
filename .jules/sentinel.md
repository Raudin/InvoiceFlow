# Sentinel's Journal 🛡️

## 2025-05-15 - JWT Authentication Hardening
**Vulnerability:** Algorithm-switching attacks and insecure default configuration. The application did not verify the JWT signing method and allowed starting without a `JWT_SECRET`.
**Learning:** Many JWT libraries, including `golang-jwt/jwt`, do not enforce a signing method by default in the `Parse` callback, leaving the application vulnerable to `alg: none` or public-key-to-HMAC attacks if not explicitly checked.
**Prevention:** Always validate `token.Method` in the JWT parse callback and ensure critical security environment variables are validated at application startup.
