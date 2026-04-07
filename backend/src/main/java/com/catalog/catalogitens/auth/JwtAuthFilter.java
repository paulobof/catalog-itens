package com.catalog.catalogitens.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

/**
 * Filtro que valida JWTs HS256 emitidos pelo frontend.
 * O frontend Next.js assina um JWT com SESSION_SECRET no /api/auth/login
 * e envia no header Authorization: Bearer <token> para cada proxied API call.
 */
@Slf4j
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final byte[] secretBytes;

    public JwtAuthFilter(@Value("${app.auth.session-secret:}") String secret) {
        if (secret == null || secret.length() < 32) {
            log.warn("app.auth.session-secret nao configurado ou muito curto — JWT auth desabilitado");
            this.secretBytes = null;
        } else {
            this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER) && secretBytes != null) {
            String token = header.substring(BEARER.length());
            AuthenticatedUser user = verify(token);
            if (user != null) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                user, null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }

    private AuthenticatedUser verify(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;

            Base64.Decoder dec = Base64.getUrlDecoder();
            String headerJson = new String(dec.decode(parts[0]), StandardCharsets.UTF_8);
            String payloadJson = new String(dec.decode(parts[1]), StandardCharsets.UTF_8);
            byte[] providedSig = dec.decode(parts[2]);

            JsonNode header = MAPPER.readTree(headerJson);
            if (!"HS256".equals(header.path("alg").asText())) return null;

            // Verifica assinatura HMAC-SHA256 sobre "header.payload"
            String signingInput = parts[0] + "." + parts[1];
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] expectedSig = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));

            if (!constantTimeEquals(expectedSig, providedSig)) {
                return null;
            }

            JsonNode payload = MAPPER.readTree(payloadJson);

            // Verifica expiracao
            long exp = payload.path("exp").asLong(0);
            if (exp > 0 && exp < System.currentTimeMillis() / 1000) {
                return null;
            }

            String id = payload.path("id").asText(null);
            String email = payload.path("email").asText(null);
            if (id == null || email == null) return null;

            return new AuthenticatedUser(id, email, payload.path("name").asText(null));
        } catch (Exception e) {
            log.debug("JWT invalido: {}", e.getMessage());
            return null;
        }
    }

    private static boolean constantTimeEquals(byte[] a, byte[] b) {
        if (a.length != b.length) return false;
        int r = 0;
        for (int i = 0; i < a.length; i++) r |= a[i] ^ b[i];
        return r == 0;
    }

    public record AuthenticatedUser(String id, String email, String name) {}
}
