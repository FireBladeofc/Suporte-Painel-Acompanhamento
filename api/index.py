import os
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

# Adiciona o diretório raiz ao path para encontrar os módulos de Automacoes
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from Automacoes.Scripts.api_logic import processar_dados_planilha

app = FastAPI(title="Painel Suporte API")

# Configuração de CORS para permitir acesso do Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, substitua pelo domínio da Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"mensagem": "API Painel Suporte rodando com sucesso na Vercel!"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Motor Python está ativo!"}

@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    """Recebe uma planilha Excel/CSV e retorna a análise higienizada pelo Python."""
    try:
        content = await file.read()
        
        # Carrega o DataFrame dependendo da extensão
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
            
        if df.empty:
            raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")
            
        resultado = processar_dados_planilha(df)
        
        if not resultado.get('success'):
            raise HTTPException(status_code=500, detail=f"Erro no processamento Python: {resultado.get('errors')}")
            
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Entry point para execução local opcional
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
