package com.catalog.catalogitens.exception;

public class PhotoLimitExceededException extends RuntimeException {

    public PhotoLimitExceededException(String entityType, Object entityId) {
        super("Maximum of 3 photos allowed for " + entityType + " with id: " + entityId);
    }
}
