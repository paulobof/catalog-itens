package com.catalog.catalogitens;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class CatalogItensApplicationTests {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("catalog_itens_test")
            .withUsername("catalog")
            .withPassword("changeme");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.storage.minio.endpoint", () -> "http://localhost:9000");
        registry.add("app.storage.minio.access-key", () -> "minioadmin");
        registry.add("app.storage.minio.secret-key", () -> "minioadmin");
        registry.add("app.storage.minio.bucket", () -> "catalog-photos-test");
    }

    @Test
    void contextLoads() {
    }
}
