package com.catalog.catalogitens.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String PEPPER = "test-pepper";
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12);

    @Mock
    private AppUserRepository userRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, ENCODER, PEPPER);
    }

    private AppUser buildUser(String email, String rawPassword) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setName("Test User");
        user.setPassword(ENCODER.encode(rawPassword + PEPPER));
        return user;
    }

    @Test
    @DisplayName("authenticate with valid credentials returns user")
    void authenticate_validCredentials_returnsUser() {
        AppUser user = buildUser("paulo@example.com", "secret123");
        when(userRepository.findByEmail("paulo@example.com")).thenReturn(Optional.of(user));

        Optional<AuthResponse> result = authService.authenticate("paulo@example.com", "secret123");

        assertThat(result).isPresent();
        assertThat(result.get().id()).isEqualTo(user.getId().toString());
        assertThat(result.get().email()).isEqualTo("paulo@example.com");
        assertThat(result.get().name()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("authenticate with wrong password returns empty")
    void authenticate_wrongPassword_returnsEmpty() {
        AppUser user = buildUser("paulo@example.com", "secret123");
        when(userRepository.findByEmail("paulo@example.com")).thenReturn(Optional.of(user));

        Optional<AuthResponse> result = authService.authenticate("paulo@example.com", "wrong-password");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("authenticate when user not found returns empty")
    void authenticate_userNotFound_returnsEmpty() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        Optional<AuthResponse> result = authService.authenticate("missing@example.com", "secret123");

        assertThat(result).isEmpty();
        verify(userRepository, times(1)).findByEmail("missing@example.com");
    }

    @Test
    @DisplayName("authenticate normalizes uppercase email to lowercase before lookup")
    void authenticate_emailNormalization_uppercaseEmailLowercased() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        authService.authenticate("PAULO@EXAMPLE.COM", "secret123");

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        verify(userRepository).findByEmail(emailCaptor.capture());
        assertThat(emailCaptor.getValue()).isEqualTo("paulo@example.com");
    }

    @Test
    @DisplayName("authenticate trims surrounding whitespace from email")
    void authenticate_emailWithSpaces_trimmed() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        authService.authenticate("  paulo@example.com  ", "secret123");

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        verify(userRepository).findByEmail(emailCaptor.capture());
        assertThat(emailCaptor.getValue()).isEqualTo("paulo@example.com");
    }

    @Test
    @DisplayName("hashPassword produces a hash verifiable with BCrypt + pepper")
    void hashPassword_consistentWithVerification() {
        String rawPassword = "minha-senha-forte";
        String hash = authService.hashPassword(rawPassword);

        assertThat(ENCODER.matches(rawPassword + PEPPER, hash))
                .as("hash should verify with the same raw password + injected pepper")
                .isTrue();
        assertThat(ENCODER.matches(rawPassword, hash))
                .as("hash should NOT verify without the pepper")
                .isFalse();
        assertThat(ENCODER.matches("wrong" + PEPPER, hash))
                .as("hash should NOT verify with a wrong password")
                .isFalse();
    }

    @Test
    @DisplayName("authenticate does not call findByEmail more than once per attempt")
    void authenticate_singleRepositoryCall() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        authService.authenticate("paulo@example.com", "secret123");

        verify(userRepository, times(1)).findByEmail(anyString());
        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
