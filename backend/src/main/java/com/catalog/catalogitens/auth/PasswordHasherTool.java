package com.catalog.catalogitens.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Ferramenta standalone para gerar hashes BCrypt + pepper compativeis com o AuthService.
 *
 * NAO depende do Spring Context — pode ser executada com classpath minimo.
 *
 * Uso (em desenvolvimento, com codigo local):
 *
 *   cd backend
 *   ./mvnw -q compile
 *   java -cp "target/classes:$(./mvnw -q dependency:build-classpath -DincludeScope=runtime -Dmdep.outputFile=/dev/stdout 2>/dev/null)" \
 *     com.catalog.catalogitens.auth.PasswordHasherTool 'NovaSenha@2026'
 *
 * Ou (mais simples) usando o helper script:
 *
 *   ./scripts/hash-password.sh 'NovaSenha@2026'
 *
 * Com o pepper customizado via env var:
 *
 *   APP_AUTH_PEPPER='outro-pepper' ./scripts/hash-password.sh 'NovaSenha@2026'
 *
 * Output: o hash BCrypt para usar num UPDATE direto no Postgres:
 *
 *   UPDATE app_user SET password = '<hash>' WHERE email = 'paulobof@gmail.com';
 */
public class PasswordHasherTool {

    private static final String DEFAULT_PEPPER = "pepper2";
    private static final int BCRYPT_COST = 12;

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("Uso: PasswordHasherTool <senha-em-texto-plano>");
            System.err.println();
            System.err.println("O hash retornado deve ser usado em:");
            System.err.println("  UPDATE app_user SET password = '<hash>' WHERE email = '...';");
            System.exit(1);
        }

        String pepper = System.getenv("APP_AUTH_PEPPER");
        if (pepper == null || pepper.isBlank()) {
            pepper = DEFAULT_PEPPER;
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(BCRYPT_COST);
        String hash = encoder.encode(args[0] + pepper);

        System.out.println(hash);
    }
}
