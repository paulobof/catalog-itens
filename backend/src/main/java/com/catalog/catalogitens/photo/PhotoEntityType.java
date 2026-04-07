package com.catalog.catalogitens.photo;

public enum PhotoEntityType {
    PRODUCT("product"),
    LOCATION("location"),
    ROOM("room");

    private final String dbValue;

    PhotoEntityType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String dbValue() {
        return dbValue;
    }

    public static PhotoEntityType fromDbValue(String value) {
        for (var t : values()) {
            if (t.dbValue.equals(value)) {
                return t;
            }
        }
        throw new IllegalArgumentException("Unknown entity type: " + value);
    }
}
