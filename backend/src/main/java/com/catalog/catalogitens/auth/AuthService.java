package com.catalog.catalogitens.auth;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class AuthService {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12);

    private static final String DUMMY_HASH =
            "$2a$12$CwTycUXWue0Thq9StjUM0uJ8p8hY0Jv9tN4DYvWWKkOJPVbZH8yCW";

    private final AppUserRepository userRepository;
    private final String pepper;

    public AuthService(AppUserRepository userRepository,
                       @Value("${app.auth.pepper:pepper2}") String pepper) {
        this.userRepository = userRepository;
        this.pepper = pepper;
    }

    public Optional<AuthResponse> authenticate(String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();
        log.info("Tentativa de login");

        Optional<AppUser> userOpt = userRepository.findByEmail(normalizedEmail);

        String hashToCheck = userOpt.map(AppUser::getPassword).orElse(DUMMY_HASH);
        boolean matches = ENCODER.matches(password + pepper, hashToCheck);

        if (userOpt.isEmpty() || !matches) {
            log.warn("Login falhou");
            return Optional.empty();
        }

        AppUser user = userOpt.get();
        log.info("Login bem-sucedido: id={}", user.getId());
        return Optional.of(new AuthResponse(
                user.getId().toString(), user.getEmail(), user.getName()));
    }

    public static String hashPassword(String rawPassword) {
        String pepper = System.getenv("APP_AUTH_PEPPER");
        if (pepper == null || pepper.isBlank()) {
            pepper = "pepper2";
        }
        return ENCODER.encode(rawPassword + pepper);
    }
}
