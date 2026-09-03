-- One-off backfill: pick a primary variant for every existing product_model
-- that doesn't have one yet, after adding ProductVariants.is_primary and
-- running `npm run sync`.
--
-- Picks the lowest sort_order (then lowest id) active, non-deleted variant
-- per model. Safe to re-run — only touches models with zero current primaries.

WITH ranked AS (
  SELECT id, product_model_id,
         ROW_NUMBER() OVER (PARTITION BY product_model_id ORDER BY sort_order ASC, id ASC) AS rn
  FROM product_variants
  WHERE status = true AND "deletedAt" IS NULL
),
models_without_primary AS (
  SELECT DISTINCT product_model_id
  FROM product_variants
  WHERE status = true AND "deletedAt" IS NULL
  GROUP BY product_model_id
  HAVING COUNT(*) FILTER (WHERE is_primary = true) = 0
)
UPDATE product_variants pv
SET is_primary = true
FROM ranked
WHERE pv.id = ranked.id
  AND ranked.rn = 1
  AND ranked.product_model_id IN (SELECT product_model_id FROM models_without_primary);

-- Sanity check — should return zero rows:
-- SELECT product_model_id, COUNT(*) FROM product_variants
-- WHERE is_primary = true GROUP BY product_model_id HAVING COUNT(*) > 1;
