-- fuzzystrmatch provides Levenshtein distance for typo-tolerant search.
-- pg_trgm similarity alone misses transpositions (e.g. wd40 vs dw40 share
-- only one trigram and score ~0.11), so we combine both in product search.
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
