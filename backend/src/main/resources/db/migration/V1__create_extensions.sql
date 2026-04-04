-- Enable trigram extension for fuzzy/ILIKE search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- UUID v7 generator function (time-ordered UUIDs for B-tree performance)
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_time        NUMERIC;
    v_unix_ms     NUMERIC;
    v_hex         TEXT;
    v_unix_hex    TEXT;
    v_rand_hex    TEXT;
BEGIN
    v_time     := EXTRACT(EPOCH FROM clock_timestamp()) * 1000;
    v_unix_ms  := FLOOR(v_time);
    v_unix_hex := LPAD(TO_HEX(v_unix_ms::BIGINT), 12, '0');

    -- 10 random bytes (80 bits) for the remainder
    v_rand_hex := ENCODE(gen_random_bytes(10), 'hex');

    -- Assemble UUID v7: 48-bit timestamp | version 7 | 12-bit random | variant 10 | 62-bit random
    v_hex := v_unix_hex
          || '7'
          || SUBSTRING(v_rand_hex, 1, 3)
          || CASE SUBSTRING(v_rand_hex, 4, 1)
                WHEN '0' THEN '8' WHEN '1' THEN '9'
                WHEN '2' THEN 'a' WHEN '3' THEN 'b'
                WHEN '4' THEN '8' WHEN '5' THEN '9'
                WHEN '6' THEN 'a' WHEN '7' THEN 'b'
                WHEN '8' THEN '8' WHEN '9' THEN '9'
                WHEN 'a' THEN 'a' WHEN 'b' THEN 'b'
                WHEN 'c' THEN '8' WHEN 'd' THEN '9'
                WHEN 'e' THEN 'a' WHEN 'f' THEN 'b'
             END
          || SUBSTRING(v_rand_hex, 5, 15);

    RETURN CAST(
        SUBSTRING(v_hex, 1, 8)  || '-' ||
        SUBSTRING(v_hex, 9, 4)  || '-' ||
        SUBSTRING(v_hex, 13, 4) || '-' ||
        SUBSTRING(v_hex, 17, 4) || '-' ||
        SUBSTRING(v_hex, 21, 12)
    AS UUID);
END;
$$;
