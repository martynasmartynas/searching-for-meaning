-- Promote "agency" to a first-class entity so non-IMAGO sources slot in cleanly.
-- A photographer is uniquely identified by (agency, name). NULL agency means a
-- solo photographer; NULLS NOT DISTINCT prevents duplicate solo rows.

DROP VIEW IF EXISTS images_search;

CREATE TABLE agencies (
  id         bigserial PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE photographers DROP CONSTRAINT photographers_name_unique;
ALTER TABLE photographers ADD COLUMN agency_id bigint REFERENCES agencies(id);
ALTER TABLE photographers
  ADD CONSTRAINT photographers_agency_name_uq
  UNIQUE NULLS NOT DISTINCT (agency_id, name);

CREATE VIEW images_search AS
SELECT
  i.bildnummer,
  i.suchtext,
  p.name                                   AS fotografen,
  a.name                                   AS agency,
  EXTRACT(EPOCH FROM i.datum)::BIGINT      AS datum_ts,
  i.width,
  i.height,
  CASE
    WHEN i.width > i.height THEN 'landscape'
    WHEN i.width < i.height THEN 'portrait'
    ELSE 'square'
  END                                      AS orientation,
  i.allowed_territories,
  i.denied_territories,
  EXTRACT(EPOCH FROM i.updated_at)::BIGINT AS updated_ts
FROM images i
JOIN photographers p ON p.id = i.photographer_id
LEFT JOIN agencies a ON a.id = p.agency_id;
