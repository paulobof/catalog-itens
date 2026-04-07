#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Uso: $0 <senha-em-texto-plano>" >&2
    exit 1
fi

PASSWORD="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"

cd "$BACKEND_DIR"

if [ ! -d target/classes ]; then
    echo "Compilando backend..." >&2
    ./mvnw -q compile
fi

case "$(uname -s 2>/dev/null || echo Unknown)" in
    MINGW*|MSYS*|CYGWIN*|Windows*) SEP=";" ;;
    *) SEP=":" ;;
esac

CP_FILE=$(mktemp)
trap 'rm -f "$CP_FILE"' EXIT
./mvnw -q dependency:build-classpath -DincludeScope=runtime -Dmdep.outputFile="$CP_FILE" >/dev/null 2>&1
DEPS=$(cat "$CP_FILE")

APP_AUTH_PEPPER="${APP_AUTH_PEPPER:-pepper2}" \
java -cp "target/classes${SEP}${DEPS}" \
     com.catalog.catalogitens.auth.PasswordHasherTool \
     "$PASSWORD"
