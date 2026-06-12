#!/usr/bin/env python3
"""
Gera um refresh token OAuth pra Google Ads API.

Como rodar:
    export GOOGLE_ADS_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
    export GOOGLE_ADS_CLIENT_SECRET="seu-client-secret"
    python3 scripts/google_ads_refresh_token.py

Pré-requisito (uma vez só):
    No Google Cloud Console → APIs & Services → Credentials → seu Client OAuth,
    adicione na lista de Authorized redirect URIs:

        http://localhost:8080/oauth2callback

    Depois, salve e espere ~30s pra propagar.

O script:
  1. Gera a URL de autorização OAuth com scope=adwords e abre no navegador
  2. Sobe um HTTP server local em :8080 pra receber o callback
  3. Troca o authorization code pelo refresh token
  4. Imprime o refresh token (e opcionalmente salva em scripts/.google_ads_refresh_token)
"""

import http.server
import json
import os
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

# ── Configuração ────────────────────────────────────────────────────────

CLIENT_ID = os.environ.get("GOOGLE_ADS_CLIENT_ID")
CLIENT_SECRET = os.environ.get("GOOGLE_ADS_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    print(
        "× Defina as variáveis de ambiente antes de rodar:\n"
        '    export GOOGLE_ADS_CLIENT_ID="..."\n'
        '    export GOOGLE_ADS_CLIENT_SECRET="..."\n'
    )
    sys.exit(1)

SCOPE = "https://www.googleapis.com/auth/adwords"
REDIRECT_HOST = "localhost"
REDIRECT_PORT = int(os.environ.get("OAUTH_PORT", "8080"))
REDIRECT_PATH = "/oauth2callback"
REDIRECT_URI = f"http://{REDIRECT_HOST}:{REDIRECT_PORT}{REDIRECT_PATH}"

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"

# ── Callback handler ────────────────────────────────────────────────────


class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802 (BaseHTTPRequestHandler API)
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != REDIRECT_PATH:
            self.send_response(404)
            self.end_headers()
            return

        qs = urllib.parse.parse_qs(parsed.query)
        self.server.received = {  # type: ignore[attr-defined]
            "code": qs.get("code", [None])[0],
            "error": qs.get("error", [None])[0],
            "state": qs.get("state", [None])[0],
        }

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

        err = self.server.received["error"]  # type: ignore[attr-defined]
        if err:
            body = (
                f"<h1 style='color:#9F1239'>Erro: {err}</h1>"
                "<p>Volta pro terminal pra ver os detalhes.</p>"
            )
        else:
            body = (
                "<div style='font-family:system-ui;text-align:center;padding:60px'>"
                "<h1 style='color:#0D4A4A'>Autorizado!</h1>"
                "<p>Pode fechar essa aba e voltar pro terminal.</p>"
                "</div>"
            )
        self.wfile.write(body.encode("utf-8"))

    def log_message(self, fmt, *args):
        # Silencia o log padrão do servidor HTTP — só queremos saída do nosso script
        return


# ── Fluxo principal ─────────────────────────────────────────────────────


def main() -> None:
    state = secrets.token_urlsafe(16)
    auth_params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",  # necessário pra receber refresh token
        "prompt": "consent",  # força a tela de consentimento mesmo em re-auth
        "state": state,
        "include_granted_scopes": "true",
    }
    auth_url_full = AUTH_URL + "?" + urllib.parse.urlencode(auth_params)

    try:
        server = http.server.HTTPServer((REDIRECT_HOST, REDIRECT_PORT), CallbackHandler)
    except OSError as e:
        print(f"× Não consegui subir o servidor em :{REDIRECT_PORT}: {e}")
        print(
            f"  Tente outra porta: OAUTH_PORT=9090 python3 {sys.argv[0]}\n"
            "  (E lembre de adicionar o novo URI nos Authorized redirect URIs do Cloud Console.)"
        )
        sys.exit(1)

    server.received = None  # type: ignore[attr-defined]

    print(f"→ Escutando em {REDIRECT_URI}\n")
    print("→ Abrindo o navegador pra você autorizar…")
    print("  Se nada acontecer, abre essa URL manualmente:\n")
    print(f"  {auth_url_full}\n")

    webbrowser.open(auth_url_full)

    # Bloqueia até receber o callback
    while server.received is None:  # type: ignore[attr-defined]
        server.handle_request()
    server.server_close()

    received = server.received  # type: ignore[attr-defined]

    if received.get("state") != state:
        print("× state inválido — possível CSRF. Abortando.")
        sys.exit(1)

    if received.get("error"):
        print(f"× Erro no consentimento: {received['error']}")
        sys.exit(1)

    code = received.get("code")
    if not code:
        print("× Não recebi authorization code.")
        sys.exit(1)

    print("✓ Code recebido. Trocando por refresh token…\n")

    token_params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }
    data = urllib.parse.urlencode(token_params).encode("utf-8")
    req = urllib.request.Request(
        TOKEN_URL,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with urllib.request.urlopen(req) as resp:
            tokens = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"× Erro do Google ao trocar code por token (HTTP {e.code}):")
        print(body)
        sys.exit(1)

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        print("× A resposta não trouxe refresh_token.")
        print(
            "  Possíveis causas:\n"
            "    1. Esse Client OAuth já foi autorizado antes pelo mesmo usuário\n"
            "       e o Google não reemitiu o refresh token. Pra forçar, vá em\n"
            "       https://myaccount.google.com/permissions e revogue o acesso\n"
            "       do seu app, depois rode esse script de novo.\n"
            "    2. O tipo do Client OAuth não é 'Desktop' ou 'Web' válido.\n"
        )
        print("Resposta completa:")
        print(json.dumps(tokens, indent=2))
        sys.exit(1)

    print("=" * 64)
    print("✓ Refresh token gerado com sucesso!")
    print("=" * 64)
    print()
    print(f"  REFRESH TOKEN: {refresh_token}")
    print()
    if tokens.get("access_token"):
        print(f"  (access token pra teste imediato, expira em {tokens.get('expires_in', '?')}s):")
        print(f"  {tokens['access_token']}")
        print()

    # Oferece salvar num arquivo local
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".google_ads_refresh_token")
    try:
        ans = input(f"Quer salvar em {out_path}? (s/N) ").strip().lower()
    except EOFError:
        ans = ""
    if ans == "s":
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(refresh_token + "\n")
        print(f"  Salvo em {out_path}")
        print("  (esse arquivo está no .gitignore? Confira antes de commitar.)")
    else:
        print("  OK, não salvei. Copia o token e guarda em lugar seguro (env var, secret manager).")

    print()
    print("Pra usar com a Google Ads API Python client, exporte:")
    print(f'  export GOOGLE_ADS_REFRESH_TOKEN="{refresh_token}"')


if __name__ == "__main__":
    main()
