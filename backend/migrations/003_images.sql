-- Small demo images are stored transactionally with their metadata. No orphan files.
CREATE TABLE report_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
 content_type text NOT NULL DEFAULT 'image/webp' CHECK(content_type='image/webp'),
 data bytea NOT NULL CHECK(octet_length(data) BETWEEN 1 AND 1048576),
 width integer NOT NULL CHECK(width BETWEEN 1 AND 1600), height integer NOT NULL CHECK(height BETWEEN 1 AND 1600),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_images_report_idx ON report_images(report_id,created_at,id);
