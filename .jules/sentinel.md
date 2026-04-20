## 2025-05-15 - [JWT Algorithm Switching Vulnerability]
**Vulnerability:** The JWT authentication middleware did not validate the signing algorithm.
**Learning:** `jwt.ParseWithClaims` expects a Keyfunc that returns the key for validation, but it's a security best practice to also verify that the algorithm in the token header matches the expected one (e.g., HS256) to prevent attackers from using "none" algorithm or switching from RS256 to HS256 (if the public key is known).
**Prevention:** Always check `token.Method` in the `Keyfunc` passed to `jwt.Parse` or `jwt.ParseWithClaims`.
