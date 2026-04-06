package com.catalog.catalogitens.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String PEPPER = "pepper2";
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    private final AppUserRepository userRepository;

    public Optional<AuthResponse> authenticate(String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();
        log.info("Tentativa de login: {}", normalizedEmail);

        Optional<AppUser> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            log.warn("Login falhou — usuário não encontrado: {}", normalizedEmail);
            return Optional.empty();
        }

        AppUser user = userOpt.get();
        if (!encoder.matches(password + PEPPER, user.getPassword())) {
            log.warn("Login falhou — senha incorreta: {}", normalizedEmail);
            return Optional.empty();
        }

        log.info("Login bem-sucedido: {}", normalizedEmail);
        return Optional.of(new AuthResponse(user.getId().toString(), user.getEmail(), user.getName()));
    }

    public static String hashPassword(String rawPassword) {
        return encoder.encode(rawPassword + PEPPER);
    }
}
