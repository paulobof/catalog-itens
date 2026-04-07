package com.catalog.catalogitens.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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
