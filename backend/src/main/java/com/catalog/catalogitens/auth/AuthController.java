package com.catalog.catalogitens.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiter rateLimiter;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletRequest httpRequest) {
        String ipKey = "ip:" + clientIp(httpRequest);
        String emailKey = "email:" + request.email().toLowerCase().trim();

        long ipLockout = rateLimiter.checkLockout(ipKey);
        long emailLockout = rateLimiter.checkLockout(emailKey);
        long lockout = Math.max(ipLockout, emailLockout);

        if (lockout > 0) {
            log.warn("Login bloqueado por rate limit");
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(lockout))
                    .body(Map.of(
                            "message", "Muitas tentativas. Tente novamente em "
                                    + (lockout / 60 + 1) + " minuto(s)."
                    ));
        }

        return authService.authenticate(request.email(), request.password())
                .<ResponseEntity<?>>map(user -> {
                    rateLimiter.recordSuccess(ipKey);
                    rateLimiter.recordSuccess(emailKey);
                    return ResponseEntity.ok(user);
                })
                .orElseGet(() -> {
                    rateLimiter.recordFailure(ipKey);
                    rateLimiter.recordFailure(emailKey);
                    return ResponseEntity.status(401)
                            .body(Map.of("message", "E-mail ou senha incorretos"));
                });
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
