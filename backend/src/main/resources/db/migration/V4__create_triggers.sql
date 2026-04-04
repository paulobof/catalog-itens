-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply trigger to room
CREATE TRIGGER trg_room_updated_at
    BEFORE UPDATE ON room
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply trigger to location
CREATE TRIGGER trg_location_updated_at
    BEFORE UPDATE ON location
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply trigger to product
CREATE TRIGGER trg_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply trigger to product_location
CREATE TRIGGER trg_product_location_updated_at
    BEFORE UPDATE ON product_location
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Note: tag table does not have updated_at column per data model specification
