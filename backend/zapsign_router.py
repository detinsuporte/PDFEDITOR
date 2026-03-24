"""
zapsign_router.py
Integração com a plataforma ZapSign para assinatura de PDFs com Gov.br.

Endpoints:
  POST /api/pdf/zapsign/create   → cria documento e retorna sign_url
  POST /api/pdf/zapsign/webhook  → recebe notificação de conclusão da ZapSign
  GET  /api/pdf/zapsign/status/{token} → consulta status do documento

Configuração necessária (.env):
  ZAPSIGN_API_TOKEN=<token do painel ZapSign>
  ZAPSIGN_ENV=sandbox   # ou "production"
"""

import base64
import os
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/zapsign", tags=["ZapSign"])

_BASE_URLS = {
    "sandbox":    "https://sandbox.api.zapsign.com.br/api/v1",
    "production": "https://api.zapsign.com.br/api/v1",
}


def _get_base_url() -> str:
    load_dotenv(override=True)
    env = os.getenv("ZAPSIGN_ENV", "sandbox")
    return _BASE_URLS.get(env, _BASE_URLS["sandbox"])


def _get_token() -> str:
    load_dotenv(override=True)
    return os.getenv("ZAPSIGN_API_TOKEN", "")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_token()}",
        "Content-Type": "application/json",
    }



# ──────────────────────────────────────────────────────────────────────────────
# POST /api/pdf/zapsign/create
# Recebe o PDF, cria o documento na ZapSign com assinatura gov.br e
# devolve a sign_url para abrir no iframe do frontend.
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/create")
async def zapsign_create(pdf: UploadFile = File(...)):
    token = _get_token()
    if not token:
        return JSONResponse(
            {"error": "ZAPSIGN_API_TOKEN não configurado. Verifique o arquivo .env"},
            status_code=500,
        )
    base_url = _get_base_url()

    pdf_bytes  = await pdf.read()
    pdf_base64 = base64.b64encode(pdf_bytes).decode()

    payload = {
        "name": pdf.filename or "documento.pdf",
        "base64_pdf": pdf_base64,
        "lang": "pt-BR",
        "disable_signer_emails": True,
        "signers": [
            {
                "name": "Signatário",
                "email": "",
                "auth_mode": "assinatura_govbr",   # ← força autenticação Gov.br
                "send_automatic_email": False,
                "qualification": "Parte",
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{base_url}/docs/",
                json=payload,
                headers=_headers(),
            )
    except httpx.TransportError as exc:
        print(f"[ZapSign] ERRO DE CONEXÃO: {type(exc).__name__}: {exc}")
        return JSONResponse({"error": f"Sem conexão com a ZapSign: {type(exc).__name__}"}, status_code=502)
    except Exception as exc:
        print(f"[ZapSign] ERRO INESPERADO: {type(exc).__name__}: {exc}")
        return JSONResponse({"error": f"Erro inesperado: {exc}"}, status_code=500)

    if resp.status_code not in (200, 201):
        return JSONResponse({"error": resp.text}, status_code=resp.status_code)

    data      = resp.json()
    signer    = data["signers"][0]
    sign_url  = signer.get("sign_url", "")
    doc_token = data.get("token", "")

    return {"sign_url": sign_url, "doc_token": doc_token}


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/pdf/zapsign/status/{token}
# Consulta o status atual do documento na ZapSign.
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/status/{doc_token}")
async def zapsign_status(doc_token: str):
    token = _get_token()
    if not token:
        return JSONResponse({"error": "ZAPSIGN_API_TOKEN não configurado no .env"}, status_code=503)
    base_url = _get_base_url()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{base_url}/docs/{doc_token}/",
                headers=_headers(),
            )
    except httpx.TransportError as exc:
        print(f"[ZapSign/status] ERRO DE CONEXÃO: {type(exc).__name__}: {exc}")
        return JSONResponse({"error": f"Sem conexão com a ZapSign: {type(exc).__name__}"}, status_code=502)
    except Exception as exc:
        print(f"[ZapSign/status] ERRO INESPERADO: {type(exc).__name__}: {exc}")
        return JSONResponse({"error": f"Erro inesperado: {exc}"}, status_code=500)

    if resp.status_code == 404:
        return JSONResponse({"error": "Documento não encontrado"}, status_code=404)

    if resp.status_code in (401, 403):
        return JSONResponse({"error": "Token ZapSign inválido ou sem permissão"}, status_code=401)

    try:
        data = resp.json()
    except Exception:
        return JSONResponse({"error": f"Resposta inesperada da ZapSign (status {resp.status_code})", "raw": resp.text[:200]}, status_code=502)

    status     = data.get("status", "unknown")      # "pending" | "signed" | "refused"
    signed_url = data.get("signed_url") or None     # URL do PDF final após assinatura

    return {"status": status, "signed_url": signed_url, "doc_token": doc_token}


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/pdf/zapsign/webhook
# A ZapSign chama este endpoint automaticamente ao concluir a assinatura.
# Configure a URL do webhook no painel ZapSign → Configurações → Webhooks.
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/webhook")
async def zapsign_webhook(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Payload inválido"}, status_code=400)

    event_type = body.get("event_type", "")

    if event_type in ("doc_signed", "document_signed"):
        doc       = body.get("document", body)      # estrutura varia por versão
        pdf_url   = doc.get("signed_url", "")
        doc_token = doc.get("token", "")
        print(f"[ZapSign] Documento assinado  token={doc_token}  url={pdf_url}")
        # TODO: persistir pdf_url no banco vinculado ao doc_token

    return {"received": True, "event": event_type}
