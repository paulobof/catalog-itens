#!/usr/bin/env bash
# Gera um hash BCrypt + pepper compativel com o AuthService do catalog-itens.
# Pure Java + spring-security-crypto, sem subir Spring Boot completo.
#
# Uso:
#   ./scripts/hash-password.sh "NovaSenha@2026"
#
# Output:
#   $2a$12$....hash.bcrypt....
#
# Para usar o hash em produc,ao (sem redeploy):
#   docker compose exec db psql -U catalog catalog_itens -c \
#     "UPDATE app_user SET password = '<hash>' WHERE email = 'paulobof@gmail.com';"
#
# Pepper customizado (caso ja tenha movido para env var via SEC-03):
#   APP_AUTH_PEPPER='novo-pepper' ./scripts/hash-password.sh "NovaSenha@2026"

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Uso: $0 <senha-em-texto-plano>" >&2
    echo "" >&2
    echo "Exemplo:" >&2
    echo "  $0 'NovaSenha@2026'" >&2
    exit 1
fi

PASSWORD="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"

cd "$BACKEND_DIR"

# Compila so se ainda nao foi compilado
if [ ! -d target/classes ]; then
    echo "Compilando backend..." >&2
    ./mvnw -q compile
fi

# Detecta separador de classpath (`;` no Windows, `:` no Unix)
case "$(uname -s 2>/dev/null || echo Unknown)" in
    MINGW*|MSYS*|CYGWIN*|Windows*) SEP=";" ;;
    *) SEP=":" ;;
esac

# Constroi classpath com runtime deps via arquivo (evita issues de stdout)
CP_FILE=$(mktemp)
trap 'rm -f "$CP_FILE"' EXIT
./mvnw -q dependency:build-classpath -DincludeScope=runtime -Dmdep.outputFile="$CP_FILE" >/dev/null 2>&1
DEPS=$(cat "$CP_FILE")

# Roda o tool — passa APP_AUTH_PEPPER via env var (nao via -D)
APP_AUTH_PEPPER="${APP_AUTH_PEPPER:-pepper2}" \
java -cp "target/classes${SEP}${DEPS}" \
     com.catalog.catalogitens.auth.PasswordHasherTool \
     "$PASSWORD"
