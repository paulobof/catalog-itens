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
        return userRepository.findByEmail(email.toLowerCase().trim())
                .filter(user -> encoder.matches(password + PEPPER, user.getPassword()))
                .map(user -> {
                    log.info("Login bem-sucedido: {}", email);
                    return new AuthResponse(user.getId().toString(), user.getEmail(), user.getName());
                });
    }

    public static String hashPassword(String rawPassword) {
        return encoder.encode(rawPassword + PEPPER);
    }
}
