## 2025-05-14 - Batch Operations in Transaction Creation
**Learning:** The `CreateTransaction` endpoint was performing individual database lookups for each item in a batch request and inserting transactions one by one. This led to N+1 query patterns and multiple database round-trips for a single API call. Using GORM's batch fetch (`Where("id IN ?", ids)`) and batch insert (`Create(&slice)`) significantly reduces database overhead.
**Action:** Always check if loop-based database operations can be refactored into batch operations, especially for endpoints handling collections of data.
