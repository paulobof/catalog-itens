package com.catalog.catalogitens.photo;

import java.util.UUID;

public final class PhotoUrls {

    private static final String BASE = "/api/photos/";

    private PhotoUrls() {}

    public static String fileUrl(UUID photoId) {
        return BASE + photoId + "/file";
    }

    public static String thumbnailUrl(UUID photoId) {
        return BASE + photoId + "/thumbnail";
    }
}
