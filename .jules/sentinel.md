# Sentinel's Journal 🛡️

## 2025-05-15 - Stale JWT Access for Deactivated Users
**Vulnerability:** Users who are deactivated via the `IsActive` flag can still access protected endpoints if they possess a valid, non-expired JWT.
**Learning:** The `AuthMiddleware` only validated the JWT signature and expiration, and checked for user existence, but failed to verify the current `IsActive` status of the user record in the database.
**Prevention:** Always verify account status (e.g., `IsActive`, `DeletedAt`) in the authentication middleware on every request, even if the JWT is technically valid.

## 2025-05-15 - Missing Fail-Fast for Critical Security Configuration
**Vulnerability:** The application would start even if `JWT_SECRET` was missing or empty, leading to runtime failures only when a token was generated or validated.
**Learning:** Relying on runtime checks for environmental configuration can lead to insecure or unstable states.
**Prevention:** Implement fail-fast checks at application startup for all mandatory security configurations (secrets, API keys, etc.).
