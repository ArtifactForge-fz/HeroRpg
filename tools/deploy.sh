#!/bin/sh
# Deploy the HeroRPG static site to an SFTP host (e.g. a Strato subdomain webspace).
# Uploads index.html + changelog.html + js/ + css/ + assets/ (the whole playable site — on a
# real HTTP origin localStorage works natively, so the single-file artifact bundle is NOT used
# here). Any new root-level page linked from the game must be added to the find list below.
#
# Config comes from ./.env (gitignored) — see .env.example. Usage from the repo root:
#   sh tools/deploy.sh --check     # connectivity + list remote dir only (no upload)
#   sh tools/deploy.sh             # upload the site
#
# Auth: SFTP_KEY_PATH (preferred) or SFTP_PASSWORD. Uses curl's libssh2 SFTP so a
# password works non-interactively (no sshpass needed). Credentials are passed via a
# temp curl config file (chmod 600), never on the command line.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.env"
[ -f "$ENV_FILE" ] || { echo "deploy: $ENV_FILE not found (copy .env.example -> .env and fill it)"; exit 1; }

# --- Safe .env parser: read KEY=VALUE literally, do NOT execute (passwords may contain
# characters that would break `. ./.env`). Strips CR and surrounding quotes on the value. ---
SFTP_HOST=; SFTP_PORT=22; SFTP_USER=; SFTP_PASSWORD=; SFTP_KEY_PATH=; SFTP_REMOTE_DIR=; DEPLOY_URL=
while IFS= read -r _line || [ -n "$_line" ]; do
  _line="$(printf '%s' "$_line" | tr -d '\r')"
  case "$_line" in ''|\#*) continue;; esac
  case "$_line" in *=*) : ;; *) continue;; esac
  _key="${_line%%=*}"; _val="${_line#*=}"
  _key="$(printf '%s' "$_key" | tr -d ' ')"
  # trim leading/trailing whitespace on the value (dotenv-style)
  _val="$(printf '%s' "$_val" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
  # strip one layer of surrounding single/double quotes if present
  case "$_val" in \"*\") _val="${_val#\"}"; _val="${_val%\"}";; \'*\') _val="${_val#\'}"; _val="${_val%\'}";; esac
  case "$_key" in
    SFTP_HOST) SFTP_HOST="$_val";; SFTP_PORT) SFTP_PORT="$_val";; SFTP_USER) SFTP_USER="$_val";;
    SFTP_PASSWORD) SFTP_PASSWORD="$_val";; SFTP_KEY_PATH) SFTP_KEY_PATH="$_val";;
    SFTP_REMOTE_DIR) SFTP_REMOTE_DIR="$_val";; DEPLOY_URL) DEPLOY_URL="$_val";;
  esac
done < "$ENV_FILE"

: "${SFTP_PORT:=22}"
[ -n "$SFTP_HOST" ] || { echo "deploy: SFTP_HOST missing in .env"; exit 1; }
[ -n "$SFTP_USER" ] || { echo "deploy: SFTP_USER missing in .env"; exit 1; }
[ -n "$SFTP_REMOTE_DIR" ] || { echo "deploy: SFTP_REMOTE_DIR missing in .env"; exit 1; }
if [ -z "$SFTP_KEY_PATH" ] && [ -z "$SFTP_PASSWORD" ]; then
  echo "deploy: set either SFTP_KEY_PATH or SFTP_PASSWORD in .env"; exit 1
fi

# strip any leading slash so the path is relative to the SFTP login home (Strato webspace root)
REMOTE="${SFTP_REMOTE_DIR#/}"
BASE="sftp://$SFTP_HOST:$SFTP_PORT/$REMOTE"

# --- Host key: add the server's key to known_hosts so libssh2/curl can verify it. ---
mkdir -p "$HOME/.ssh"; chmod 700 "$HOME/.ssh" 2>/dev/null || true
if ! ssh-keygen -F "[$SFTP_HOST]:$SFTP_PORT" >/dev/null 2>&1 && ! ssh-keygen -F "$SFTP_HOST" >/dev/null 2>&1; then
  ssh-keyscan -p "$SFTP_PORT" "$SFTP_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true
fi

# --- Credentials via a temp curl config file (kept off the command line). ---
CFG="$(mktemp)"; chmod 600 "$CFG"
cleanup() { rm -f "$CFG"; }
trap cleanup EXIT INT TERM
if [ -n "$SFTP_KEY_PATH" ]; then
  { printf 'user = "%s:"\n' "$SFTP_USER"; printf 'key = "%s"\n' "$SFTP_KEY_PATH"; } > "$CFG"
else
  printf 'user = "%s:%s"\n' "$SFTP_USER" "$SFTP_PASSWORD" > "$CFG"
fi

if [ "${1:-}" = "--check" ]; then
  echo "deploy --check: listing $BASE/ ..."
  curl -sS -K "$CFG" "$BASE/"
  echo "deploy --check: OK (connection + auth + remote dir reachable)"
  exit 0
fi

# --- Upload the static site in ONE curl invocation (connection reused across all
# transfers via a config file), preserving relative paths and creating remote dirs. ---
echo "deploy: building transfer list ..."
printf 'ftp-create-dirs\n' >> "$CFG"     # applies to SFTP too: create missing remote dirs
n=0
while IFS= read -r f; do
  rel="${f#./}"
  printf 'upload-file = "%s"\n' "$rel" >> "$CFG"
  printf 'url = "%s/%s"\n' "$BASE" "$rel" >> "$CFG"
  n=$((n+1))
done <<EOF
$(find index.html changelog.html js css assets -type f | sed 's#^\./##')
EOF
echo "deploy: uploading $n files to $BASE/ (single connection) ..."
curl -sS -K "$CFG"
echo "deploy: upload complete ($n files)."

if [ -n "$DEPLOY_URL" ]; then
  echo "deploy: sanity-checking $DEPLOY_URL ..."
  code="$(curl -s -o /dev/null -w '%{http_code}' "$DEPLOY_URL" || echo '000')"
  echo "deploy: $DEPLOY_URL -> HTTP $code"
fi
