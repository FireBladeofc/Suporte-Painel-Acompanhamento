# Dashboard Suporte ChatPro

Dashboard completo para análise de performance de suporte técnico com KPIs, métricas de agentes e insights gerenciais.

## Tecnologias Utilizadas

- **Front-end:** React + TypeScript + Vite
- **UI:** shadcn-ui + Tailwind CSS
- **Backend:** Supabase (Auth, Database, RLS)
- **Automação:** Python + Pandas (análise de dados)

## Estrutura do Projeto

```
/PAINEL SUPORTE
├── /Automacoes/Scripts/   ← Scripts Python modularizados
│   ├── main.py            ← Ponto de entrada da análise
│   ├── /core/             ← Métricas, análises e insights
│   ├── /io/               ← Leitura e exportação de dados
│   └── /utils/            ← Formatação e conversão
├── /Dados/
│   ├── /Bruto/            ← Planilhas Excel de entrada
│   ├── /Tratado/          ← Dados intermediários
│   └── /Final/            ← Saídas JSON e Markdown
├── /src/                  ← Front-end React
├── /supabase/             ← Migrations e Edge Functions
└── Configs (Vite, TS, ESLint, Tailwind)
```

## Configuração Local

### 1. Pré-requisitos
- Node.js 18+
- npm
- Python 3.10+ (para scripts de análise)

### 2. Configuração do Supabase
```sh
cp .env.example .env
```
Preencha as variáveis no `.env` com as credenciais do seu projeto Supabase:
- `VITE_SUPABASE_PROJECT_ID` — ID do projeto
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Chave anon/pública
- `VITE_SUPABASE_URL` — URL do projeto

### 3. Instalar dependências e rodar
```sh
npm install
npm run dev
```

### 4. Script de Análise Python
```sh
pip install pandas openpyxl
python Automacoes/Scripts/main.py <arquivo.xlsx>
```
Os resultados são salvos em `Dados/Final/`.

## Funcionalidades

- Análise Executiva de KPIs
- Dashboard Operacional detalhado
- Monitoramento de Performance de Agentes
- Insights gerados por IA para feedback
- Upload de dados via Excel
- Plano de ação semanal automatizado
