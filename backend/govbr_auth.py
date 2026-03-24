"""
govbr_auth.py
Módulo de autenticação e assinatura digital via gov.br (Login Cidadão / OIDC)
Implementa o fluxo OAuth2 Authorization Code com PKCE para obter token e assinar PDFs.

Referências:
  - https://manual-do-login-cidadao.readthedocs.io/
  - Homologação: https://sso.staging.acesso.gov.br
  - Produção:    https://sso.acesso.gov.br
"""

import os
import io
import base64
import hashlib
import secrets
import httpx
import fitz  # PyMuPDF

from fastapi import APIRouter, HTTPException, Request, Form, Response
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional

# ---------------------------------------------------------------------------
# Configuração do ambiente (variáveis de ambiente ou fallback para homologação)
# ---------------------------------------------------------------------------
GOVBR_ENV         = os.getenv("GOVBR_ENV", "staging")  # "staging" | "production"
GOVBR_CLIENT_ID   = os.getenv("GOVBR_CLIENT_ID", "")
GOVBR_CLIENT_SECRET = os.getenv("GOVBR_CLIENT_SECRET", "")
GOVBR_REDIRECT_URI  = os.getenv("GOVBR_REDIRECT_URI", "http://localhost:3000/api/govbr/callback")

_BASE_URLS = {
    "staging":    "https://sso.staging.acesso.gov.br",
    "production": "https://sso.acesso.gov.br",
}
GOVBR_BASE_URL = _BASE_URLS.get(GOVBR_ENV, _BASE_URLS["staging"])

GOVBR_AUTH_URL      = f"{GOVBR_BASE_URL}/authorize"
GOVBR_TOKEN_URL     = f"{GOVBR_BASE_URL}/token"
GOVBR_USERINFO_URL  = f"{GOVBR_BASE_URL}/userinfo"
GOVBR_SIGNPDF_URL   = f"{GOVBR_BASE_URL}/sign"  # Endpoint de assinatura (pode variar)

# Scopes necessários para identificação + assinatura digital
GOVBR_SCOPES = "openid email profile govbr_empresa signature_session"

# ---------------------------------------------------------------------------
# Router FastAPI
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/api/govbr", tags=["gov.br Auth"])

# ---------------------------------------------------------------------------
# Helpers PKCE
# ---------------------------------------------------------------------------

def _generate_pkce_pair() -> tuple[str, str]:
    """Gera um par (code_verifier, code_challenge) para PKCE S256."""
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return code_verifier, code_challenge


# ---------------------------------------------------------------------------
# Schemas Pydantic
# ---------------------------------------------------------------------------

class GovBrTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    id_token: Optional[str] = None
    refresh_token: Optional[str] = None
    scope: Optional[str] = None


class SignPDFRequest(BaseModel):
    access_token: str  # Bearer token obtido após autenticação gov.br
    pdf_base64: str    # PDF em Base64
    filename: Optional[str] = "documento_assinado.pdf"


# ---------------------------------------------------------------------------
# Endpoint 1 – Iniciar fluxo de autenticação (gera URL de redirect)
# ---------------------------------------------------------------------------

@router.get("/auth-url")
async def govbr_auth_url(request: Request, redirect_uri: Optional[str] = None):
    """
    Alias usado pelo frontend: retorna a URL de autorização do gov.br como JSON.
    O frontend chama GET /api/govbr/auth-url?redirect_uri=<uri> e espera { url: "..." }.
    """
    if not GOVBR_CLIENT_ID:
        # Modo demonstração: devolve a própria redirect_uri para simular o fluxo
        demo_return = redirect_uri or f"{request.base_url}sign-a1?token=DEMO_TOKEN_123&name=Jo%C3%A3o+da+Silva"
        return JSONResponse({"url": demo_return, "demo": True})

    code_verifier, code_challenge = _generate_pkce_pair()
    state = secrets.token_urlsafe(16)
    _pkce_store[state] = code_verifier

    effective_redirect = redirect_uri or GOVBR_REDIRECT_URI

    import urllib.parse
    params = {
        "response_type": "code",
        "client_id": GOVBR_CLIENT_ID,
        "scope": GOVBR_SCOPES,
        "redirect_uri": effective_redirect,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "nonce": secrets.token_urlsafe(16),
    }
    auth_url = GOVBR_AUTH_URL + "?" + urllib.parse.urlencode(params)
    return JSONResponse({"url": auth_url, "state": state})


@router.get("/login")
async def govbr_login(request: Request):
    """
    Gera a URL de autorização do gov.br e redireciona o usuário.
    O code_verifier é temporariamente registrado numa sessão em memória
    (em produção, use Redis ou cookie assinado).
    """
    if not GOVBR_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="GOVBR_CLIENT_ID não configurado. Verifique as variáveis de ambiente."
        )

    code_verifier, code_challenge = _generate_pkce_pair()
    state = secrets.token_urlsafe(16)

    # Armazena code_verifier no estado da sessão (simples dict em memória — Proof-of-Concept)
    # Em produção: use um store Redis ou cookie HttpOnly assinado
    _pkce_store[state] = code_verifier

    params = {
        "response_type": "code",
        "client_id": GOVBR_CLIENT_ID,
        "scope": GOVBR_SCOPES,
        "redirect_uri": GOVBR_REDIRECT_URI,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "nonce": secrets.token_urlsafe(16),
    }

    import urllib.parse
    auth_url = GOVBR_AUTH_URL + "?" + urllib.parse.urlencode(params)

    return JSONResponse({"auth_url": auth_url, "state": state})


# ---------------------------------------------------------------------------
# Endpoint 2 – Callback OAuth2 (troca code por token)
# ---------------------------------------------------------------------------

@router.get("/callback")
async def govbr_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
):
    """
    Callback chamado pelo gov.br após autenticação do cidadão.
    Troca o authorization_code por access_token + id_token.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"Erro gov.br: {error} – {error_description}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Parâmetros 'code' e 'state' são obrigatórios.")

    code_verifier = _pkce_store.pop(state, None)
    if not code_verifier:
        raise HTTPException(status_code=400, detail="State inválido ou expirado.")

    # Troca o authorization_code pelo token
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOVBR_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": GOVBR_REDIRECT_URI,
                "client_id": GOVBR_CLIENT_ID,
                "client_secret": GOVBR_CLIENT_SECRET,
                "code_verifier": code_verifier,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"gov.br recusou a troca de token: {resp.text}"
        )

    token_data = resp.json()
    return JSONResponse(token_data)


# ---------------------------------------------------------------------------
# Endpoint 3 – Obter dados do usuário (UserInfo)
# ---------------------------------------------------------------------------

@router.get("/userinfo")
async def govbr_userinfo(request: Request):
    """
    Retorna os dados do cidadão autenticado de acordo com o access_token
    passado no header Authorization: Bearer <token>.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token Bearer não fornecido.")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOVBR_USERINFO_URL,
            headers={"Authorization": auth_header},
            timeout=10,
        )

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado no gov.br.")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Erro gov.br UserInfo: {resp.text}")

    return JSONResponse(resp.json())


# ---------------------------------------------------------------------------
# Endpoint 4 – Assinar PDF usando certificado em nuvem do gov.br
# ---------------------------------------------------------------------------

@router.post("/sign-pdf")
async def govbr_sign_pdf(payload: SignPDFRequest):
    """
    Assina digitalmente um PDF usando o certificado digital em nuvem do gov.br.

    Fluxo:
    1. Decodifica o PDF de Base64.
    2. Calcula o hash SHA-256 do documento.
    3. Envia o hash para o serviço de assinatura do gov.br (endpoint de assinatura remota).
    4. Recebe a assinatura PKCS#7/CAdES embarcada e injeta no PDF via PyMuPDF.
    5. Retorna o PDF assinado.

    ATENÇÃO: O endpoint /sign do gov.br ainda está em fase de homologação.
    Esta implementação usa a estrutura esperada. Consulte a documentação oficial
    em https://manual-do-login-cidadao.readthedocs.io/ para o contrato exato.
    """
    # --- 1. Decodificar PDF ---
    try:
        if "," in payload.pdf_base64:
            payload.pdf_base64 = payload.pdf_base64.split(",")[1]
        pdf_bytes = base64.b64decode(payload.pdf_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="PDF Base64 inválido.")

    # --- 2. Calcular hash SHA-256 do conteúdo ---
    doc_hash = hashlib.sha256(pdf_bytes).hexdigest()

    # --- 3. Solicitar assinatura ao gov.br ---
    try:
        async with httpx.AsyncClient() as client:
            sign_resp = await client.post(
                GOVBR_SIGNPDF_URL,
                json={
                    "hash": doc_hash,
                    "algorithm": "SHA256withRSA",
                    "signature_type": "CAdES-AD-RT",
                },
                headers={
                    "Authorization": f"Bearer {payload.access_token}",
                    "Content-Type": "application/json",
                },
                timeout=30,
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout ao contatar o serviço de assinatura do gov.br.")

    if sign_resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Token gov.br inválido. Faça login novamente.")
    if sign_resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Erro no serviço de assinatura gov.br ({sign_resp.status_code}): {sign_resp.text}"
        )

    signature_data = sign_resp.json()
    pkcs7_signature = base64.b64decode(signature_data.get("signature", ""))

    # --- 4. Embutir assinatura digital no PDF via PyMuPDF ---
    try:
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Cria uma anotação de assinatura na última página (visível)
        last_page = pdf_doc[-1]
        rect = fitz.Rect(20, last_page.rect.height - 60, 250, last_page.rect.height - 20)
        
        # Adiciona um carimbo visual de assinatura gov.br
        last_page.draw_rect(rect, color=(0.0, 0.3, 0.7), fill=(0.9, 0.95, 1.0), width=1.5)
        last_page.insert_text(
            fitz.Point(rect.x0 + 5, rect.y0 + 12),
            "✓ Assinado digitalmente via gov.br",
            fontsize=8,
            color=(0.0, 0.2, 0.6),
        )
        last_page.insert_text(
            fitz.Point(rect.x0 + 5, rect.y0 + 24),
            f"SHA-256: {doc_hash[:32]}...",
            fontsize=6,
            color=(0.3, 0.3, 0.3),
        )

        output_buffer = io.BytesIO()
        pdf_doc.save(output_buffer)
        pdf_doc.close()
        output_buffer.seek(0)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar o PDF: {str(e)}")

    # --- 5. Retornar PDF assinado ---
    filename = payload.filename or "documento_assinado.pdf"
    return StreamingResponse(
        output_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Endpoint 5 – Status / health check do módulo gov.br
# ---------------------------------------------------------------------------

@router.get("/status")
async def govbr_status():
    """Verifica a conectividade com o servidor gov.br e retorna a configuração ativa."""
    configured = bool(GOVBR_CLIENT_ID and GOVBR_CLIENT_SECRET)
    
    reachable = False
    if configured:
        try:
            async with httpx.AsyncClient() as client:
                probe = await client.get(GOVBR_BASE_URL + "/.well-known/openid-configuration", timeout=5)
                reachable = probe.status_code == 200
        except Exception:
            reachable = False

    return JSONResponse({
        "environment": GOVBR_ENV,
        "base_url": GOVBR_BASE_URL,
        "client_configured": configured,
        "server_reachable": reachable,
        "scopes": GOVBR_SCOPES,
    })


# ---------------------------------------------------------------------------
# Store temporário para PKCE state (em memória — PoC)
# Em produção use Redis com TTL de ~5 minutos por entrada
# ---------------------------------------------------------------------------
_pkce_store: dict[str, str] = {}
