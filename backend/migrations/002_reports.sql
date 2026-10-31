CREATE TABLE categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
 is_active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX categories_name_idx ON categories(lower(trim(name)));
CREATE TABLE locations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
 is_active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX locations_name_idx ON locations(lower(trim(name)));
INSERT INTO categories(name) VALUES ('Electronics'), ('ID & Cards'), ('Accessories'), ('Clothing'), ('Bags'), ('Other');
INSERT INTO locations(name) VALUES ('Library'), ('Student Center'), ('Engineering Building'), ('Unknown campus location');
CREATE TABLE reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
 location_id uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
 report_type text NOT NULL CHECK(report_type IN ('lost','found')),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','recovered')),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 description text NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 3000),
 occurred_on date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 recovered_at timestamptz, deleted_at timestamptz,
 CHECK ((status='recovered') = (recovered_at IS NOT NULL))
);
CREATE INDEX reports_page_idx ON reports(created_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX reports_author_idx ON reports(author_id,created_at DESC,id DESC) WHERE deleted_at IS NULL;
CREATE INDEX reports_category_idx ON reports(category_id);
CREATE INDEX reports_location_idx ON reports(location_id);
