-- Denormalized read model for the search index.
-- Sequin watches this and pushes documents to Meilisearch.

CREATE VIEW images_search AS
SELECT
  i.bildnummer,
  i.suchtext,
  p.name                                   AS fotografen,
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
JOIN photographers p ON p.id = i.photographer_id;
