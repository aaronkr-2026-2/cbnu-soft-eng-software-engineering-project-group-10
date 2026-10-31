-- Measured on synthetic test data: selective keyword search otherwise scans all reports.
CREATE INDEX reports_search_idx ON reports USING gin(to_tsvector('simple',title||' '||description)) WHERE deleted_at IS NULL;
