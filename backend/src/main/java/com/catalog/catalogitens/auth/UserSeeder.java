package com.catalog.catalogitens.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserSeeder implements ApplicationRunner {

    private final AppUserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedUser("paulobof@gmail.com", "***REMOVED***", "Paulo");
        seedUser("tamara_saka@hotmail.com", "***REMOVED***", "Tamara");
    }

    private void seedUser(String email, String rawPassword, String name) {
        if (userRepository.findByEmail(email).isPresent()) {
            log.debug("Usuário já existe: {}", email);
            return;
        }
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPassword(AuthService.hashPassword(rawPassword));
        user.setName(name);
        userRepository.save(user);
        log.info("Usuário criado: {} ({})", name, email);
    }
}
