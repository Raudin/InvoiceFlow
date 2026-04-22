## 2025-05-15 - Batch Transaction N+1 Optimization
**Learning:** Identified a classic N+1 performance anti-pattern in the `CreateTransaction` handler where database queries for item verification and transaction creation were executed inside a loop. In high-volume environments, this leads to significant latency due to repeated database roundtrips.
**Action:** Use bulk fetching with `IN` clauses for verification and GORM's batch insert capabilities (`Create` with a slice) to reduce $2N+1$ queries down to a constant 3 queries, regardless of the number of items being recorded.
