package com.catalog.catalogitens.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Semeia usuários iniciais no banco de dados na primeira inicialização.
 *
 * As credenciais são lidas de variáveis de ambiente — nunca versionadas.
 * Se um usuário já existe no banco, o seeder não altera sua senha.
 *
 * Variáveis esperadas:
 *   SEED_USER_1_EMAIL, SEED_USER_1_PASSWORD, SEED_USER_1_NAME
 *   SEED_USER_2_EMAIL, SEED_USER_2_PASSWORD, SEED_USER_2_NAME
 *
 * Se qualquer variável estiver ausente, o seeder para sem erro — permite
 * ambientes onde os usuários são gerenciados manualmente (ex: produção
 * após trocar senhas via UPDATE direto).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserSeeder implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final Environment env;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedFromEnv(1);
        seedFromEnv(2);
    }

    private void seedFromEnv(int index) {
        String email = env.getProperty("SEED_USER_" + index + "_EMAIL");
        String password = env.getProperty("SEED_USER_" + index + "_PASSWORD");
        String name = env.getProperty("SEED_USER_" + index + "_NAME");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.debug("Seed user {} não configurado — pulando", index);
            return;
        }

        if (userRepository.findByEmail(email).isPresent()) {
            log.debug("Usuário já existe: {}", email);
            return;
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPassword(AuthService.hashPassword(password));
        user.setName(name != null ? name : email);
        userRepository.save(user);
        log.info("Usuário criado: {} ({})", user.getName(), email);
    }
}
