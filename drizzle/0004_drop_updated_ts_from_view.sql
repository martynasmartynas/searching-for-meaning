-- updated_ts was indexed into Meilisearch but never read by anything (no sort,
-- no filter, no display). Dropping it from the view shrinks each search-engine
-- document and removes a misleading field.

DROP VIEW IF EXISTS images_search;

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
  i.denied_territories
FROM images i
JOIN photographers p ON p.id = i.photographer_id
LEFT JOIN agencies a ON a.id = p.agency_id;
