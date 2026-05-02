package com.catalog.catalogitens.photo;

import java.io.InputStream;

public record StoredObject(InputStream stream, String contentType, long contentLength, String etag) {}
