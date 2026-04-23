import os
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
import io
import jwt  # python-jose

# Adiciona o diretório raiz ao path para encontrar os módulos de Automacoes
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from Automacoes.Scripts.api_logic import processar_dados_planilha

# ─────────────────────────────────────────────────────────────────────────────
# Configuração de origens permitidas (SEG-002)
# Em produção, defina a variável de ambiente ALLOWED_ORIGINS com o domínio real.
# Ex: ALLOWED_ORIGINS="https://meu-painel.vercel.app"
# ─────────────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
)
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# ─────────────────────────────────────────────────────────────────────────────
# Chave JWT pública do Supabase (SEG-003)
# Disponível em: Supabase Dashboard → Settings → API → JWT Secret
# ─────────────────────────────────────────────────────────────────────────────
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

app = FastAPI(title="Painel Suporte API")

# ─────────────────────────────────────────────────────────────────────────────
# CORS restrito (SEG-002) — sem allow_credentials=True com wildcard
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Verificação de token JWT do Supabase (SEG-003)
# ─────────────────────────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=True)


def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    """
    Valida o Bearer token JWT emitido pelo Supabase.
    Retorna o payload decodificado se válido, ou lança 401.
    """
    token = credentials.credentials

    if not SUPABASE_JWT_SECRET:
        # Se o segredo não estiver configurado, bloqueia por segurança
        raise HTTPException(
            status_code=503,
            detail="Servidor não configurado: SUPABASE_JWT_SECRET ausente.",
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase não usa 'aud' padrão
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado.")
    except jwt.JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Token inválido: {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# Limite de tamanho de upload: 10 MB (SEG-008)
# ─────────────────────────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# Assinaturas binárias (magic bytes) de formatos aceitos
XLSX_MAGIC = b"PK\x03\x04"   # ZIP/OOXML — .xlsx
XLS_MAGIC  = b"\xd0\xcf\x11\xe0"  # OLE2 — .xls (legado)


def validate_file(content: bytes, filename: str) -> None:
    """
    Valida tamanho e assinatura binária do arquivo enviado.
    Lança HTTPException 400 em caso de violação.
    """
    # Validação de tamanho
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Limite: 10 MB. Recebido: {len(content) / 1024 / 1024:.1f} MB.",
        )

    name_lower = filename.lower()

    # CSV: apenas texto — sem magic bytes fixas, mas verificamos a extensão e UTF-8
    if name_lower.endswith(".csv"):
        try:
            content[:512].decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Arquivo CSV com encoding inválido. Use UTF-8.",
            )
        return

    # XLSX: deve começar com PK\x03\x04
    if name_lower.endswith(".xlsx"):
        if not content[:4].startswith(XLSX_MAGIC):
            raise HTTPException(
                status_code=400,
                detail="Arquivo com extensão .xlsx não possui assinatura válida (magic bytes).",
            )
        return

    # XLS legado: assinatura OLE2
    if name_lower.endswith(".xls"):
        if not content[:4].startswith(XLS_MAGIC):
            raise HTTPException(
                status_code=400,
                detail="Arquivo com extensão .xls não possui assinatura válida.",
            )
        return

    raise HTTPException(
        status_code=400,
        detail="Formato de arquivo não suportado. Envie .xlsx, .xls ou .csv.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Rotas
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"mensagem": "API Painel Suporte rodando com sucesso na Vercel!"}


@app.get("/api/health", dependencies=[Depends(verify_supabase_jwt)])
def health_check():
    """Rota de health check — requer autenticação."""
    return {"status": "ok", "message": "Motor Python está ativo!"}


@app.post("/api/analyze", dependencies=[Depends(verify_supabase_jwt)])
async def analyze_file(file: UploadFile = File(...)):
    """
    Recebe uma planilha Excel/CSV e retorna a análise higienizada pelo Python.
    Requer Bearer token JWT válido do Supabase (SEG-003).
    Valida tamanho e assinatura binária do arquivo (SEG-008).
    """
    try:
        content = await file.read()

        # Validação de segurança: tamanho + magic bytes
        validate_file(content, file.filename or "upload")

        # Carrega o DataFrame dependendo da extensão
        filename_lower = (file.filename or "").lower()
        if filename_lower.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

        if df.empty:
            raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")

        resultado = processar_dados_planilha(df)

        if not resultado.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Erro no processamento Python: {resultado.get('errors')}",
            )

        return resultado

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Entry point para execução local opcional
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
