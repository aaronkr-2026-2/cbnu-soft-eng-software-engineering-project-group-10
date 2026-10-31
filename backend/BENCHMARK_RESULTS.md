# Local benchmark observations

Measured on October 30, 2026 against a dedicated test database with 500
synthetic users and 10,000 reports. Host: Windows, AMD Ryzen 9 7940HS,
16 logical processors, approximately 47.2 GiB RAM, Node 24.15.0.

The keyword search EXPLAIN ANALYZE execution time was 70.621 ms before the
partial GIN search index and 0.154 ms after it. These are individual observations,
not controlled repeated cold-cache experiments.

Local HTTP smoke measurements used GET /reports?limit=20, 200 requests per level:

| Concurrent requests | Successful requests | Errors | Requests/second | p95 latency (ms) |
| --- | --- | --- | --- | --- |
| 1 | 200 | 0 | 224.70 | 7.88 |
| 5 | 200 | 0 | 242.60 | 32.63 |
| 10 | 200 | 0 | 539.38 | 28.07 |

These short runs do not establish sustained capacity. They exclude cloud network
latency, TLS, uploads, authentication and long-lived chat streams. They do not
demonstrate 100,000 or 1,000,000 requests per second or predict free-tier capacity.

Reproduction tools: scripts/seed-benchmark.mjs, scripts/measure-database.mjs,
scripts/benchmark.mjs and scripts/cleanup-benchmark.mjs. Database tools require
a database name ending in _test. HTTP benchmarking is restricted to localhost.
Never run synthetic load or seed scripts against real student data.
