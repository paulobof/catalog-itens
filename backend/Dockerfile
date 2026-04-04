# =============================================================================
# Backend — Multi-stage Dockerfile
# Stages:
#   1. deps    — Download all Maven dependencies (cached layer)
#   2. build   — Compile + package the application JAR
#   3. runtime — Minimal JRE image with non-root user
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: deps
# Download all dependencies into the local repository so the build stage
# benefits from Docker layer cache even when source code changes.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS deps

WORKDIR /build

# Copy Maven wrapper and POM first — this layer is rebuilt only when they change
COPY mvnw pom.xml ./
COPY .mvn/ .mvn/

# Ensure mvnw has Unix line endings and is executable
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Download all dependencies (including plugins) offline
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw --batch-mode dependency:go-offline -q

# -----------------------------------------------------------------------------
# Stage 2: build
# Compile the application and produce the executable JAR.
# Tests are skipped here; they should run in CI before building the image.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /build

# Re-use the downloaded .m2 repository from the deps stage
COPY --from=deps /root/.m2 /root/.m2

# Copy the Maven wrapper and POM
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Copy all source code
COPY src/ src/

# Ensure mvnw is executable and has Unix line endings, then package
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && \
    ./mvnw --batch-mode package -DskipTests -q && \
    mv target/*.jar target/app.jar

# -----------------------------------------------------------------------------
# Stage 3: runtime
# Minimal JRE image — no JDK, no build tools, no shell utilities beyond
# what is needed for health checks. Runs as non-root user "spring".
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for health check
RUN apk add --no-cache curl

# Create a non-root group and user
# UID/GID 1001 avoids conflicts with common system users
RUN addgroup -g 1001 -S spring && \
    adduser -u 1001 -S spring -G spring

WORKDIR /app

# Copy only the built JAR from the build stage
COPY --from=build --chown=spring:spring /build/target/app.jar ./app.jar

# Switch to the non-root user for all subsequent commands and at runtime
USER spring:spring

# Expose the Spring Boot HTTP port
EXPOSE 8080

# JVM flags:
#   -XX:+UseContainerSupport       — respect cgroup memory/CPU limits
#   -XX:MaxRAMPercentage=75.0      — use 75% of container memory as heap
#   -XX:+ExitOnOutOfMemoryError    — crash fast on OOM instead of degrading
# Additional flags can be passed via JAVA_TOOL_OPTIONS env var at runtime.
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Health check — polls Spring Boot Actuator /actuator/health
# start-period: 60s gives Flyway and Spring context time to fully start
# interval: 30s is frequent enough to detect failures quickly
# timeout: 5s prevents hanging checks from blocking container lifecycle
# retries: 3 means the container is marked unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
