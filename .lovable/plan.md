

# Plano: Painel Completo de Registro do Colaborador

## Visao Geral

Este plano expande significativamente o sistema de feedback, transformando-o em um painel completo de gestao de colaboradores. As melhorias incluem registro de jornada, avaliacoes de gestor, advertencias e sinais de atencao, alem de reorganizar onde o feedback da IA eh exibido.

---

## Mudancas Principais

### 1. Remover Feedback da Aba "Analise de IA"

O bloco "Feedback para o Colaborador" que aparece ao final de cada card de analise sera removido, mantendo o feedback apenas na aba "Resumo & Insights" onde ja esta consolidado.

**Arquivo afetado:** `src/components/feedback/AnalysisCard.tsx`

---

### 2. Nova Aba "Ficha do Colaborador"

Adicionar uma quarta aba no detalhe do colaborador com as seguintes secoes:

```text
+---------------------------------------+
|          FICHA DO COLABORADOR         |
+---------------------------------------+
|                                       |
|  [Horarios de Trabalho]               |
|  Entrada: 08:00  |  Saida: 17:00      |
|  Dias: Seg a Sex                      |
|                                       |
+---------------------------------------+
|  [Avaliacoes do Gestor]               |
|  +-------------+-------------------+  |
|  | Nivel Tec.  | ★★★★☆ (4/5)      |  |
|  | Comunicacao | ★★★☆☆ (3/5)      |  |
|  +-------------+-------------------+  |
|  Dificuldades: [Tags editaveis]       |
|                                       |
+---------------------------------------+
|  [Advertencias]                       |
|  📋 Lista de advertencias aplicadas   |
|  + Botao para adicionar nova          |
|                                       |
+---------------------------------------+
|  [Sinais de Atencao]                  |
|  ⚠️ Alertas e observacoes criticas    |
|                                       |
+---------------------------------------+
```

---

## Novas Tabelas no Banco de Dados

### Tabela: `collaborator_profiles`
Armazena dados adicionais do colaborador (horarios, niveis, dificuldades)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| collaborator_id | uuid | Referencia ao colaborador |
| work_start_time | time | Horario de entrada |
| work_end_time | time | Horario de saida |
| work_days | text[] | Dias da semana (ex: ["seg","ter","qua","qui","sex"]) |
| technical_level | integer | Nivel tecnico (1-5) |
| communication_level | integer | Nivel de comunicacao (1-5) |
| main_difficulties | text[] | Lista de dificuldades principais |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### Tabela: `collaborator_warnings`
Registra advertencias aplicadas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| collaborator_id | uuid | Referencia ao colaborador |
| warning_date | date | Data da advertencia |
| type | text | Tipo (verbal, escrita, suspensao) |
| reason | text | Motivo da advertencia |
| details | text | Detalhes adicionais |
| created_by | uuid | Gestor que aplicou |
| created_at | timestamptz | Data de criacao |

### Tabela: `collaborator_attention_flags`
Registra sinais de atencao

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| collaborator_id | uuid | Referencia ao colaborador |
| flag_date | date | Data do registro |
| severity | text | Severidade (baixa, media, alta, critica) |
| description | text | Descricao do sinal |
| status | text | Status (ativo, resolvido, monitorando) |
| resolution_notes | text | Notas de resolucao |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

---

## Novos Componentes React

### 1. `CollaboratorProfileTab.tsx`
Aba principal da ficha do colaborador com as secoes:
- Horarios de trabalho (editavel)
- Avaliacao de nivel tecnico (slider 1-5 estrelas)
- Avaliacao de comunicacao (slider 1-5 estrelas)
- Tags de dificuldades (editaveis)
- Lista de advertencias com botao de adicionar
- Lista de sinais de atencao com botao de adicionar

### 2. `AddWarningModal.tsx`
Modal para registrar nova advertencia com campos:
- Data da advertencia
- Tipo (verbal, escrita, suspensao)
- Motivo
- Detalhes

### 3. `AddAttentionFlagModal.tsx`
Modal para registrar sinal de atencao:
- Data
- Severidade
- Descricao

### 4. `useCollaboratorProfile.ts`
Hook para gerenciar os dados do perfil:
- Buscar/atualizar perfil
- Listar/criar advertencias
- Listar/criar/atualizar sinais de atencao

---

## Modificacoes em Componentes Existentes

### `CollaboratorDetail.tsx`
- Adicionar nova aba "Ficha" com icone de clipboard
- Reorganizar ordem das abas

### `AnalysisCard.tsx`
- Remover a secao "Feedback para o Colaborador" (linhas 287-296)
- Manter demais informacoes da analise

---

## Tipos TypeScript Novos

```text
// src/types/feedback.ts (adicoes)

CollaboratorProfile {
  id, collaborator_id, work_start_time, work_end_time,
  work_days, technical_level, communication_level,
  main_difficulties, created_at, updated_at
}

CollaboratorWarning {
  id, collaborator_id, warning_date, type, reason,
  details, created_by, created_at
}

AttentionFlag {
  id, collaborator_id, flag_date, severity, description,
  status, resolution_notes, created_at, updated_at
}
```

---

## Politicas de Seguranca (RLS)

Todas as novas tabelas terao politicas identicas as existentes:
- Somente `admin` e `manager` podem ler, inserir, atualizar e deletar
- Usando a funcao `has_role()` ja existente

---

## Resumo das Entregas

| Item | Tipo | Descricao |
|------|------|-----------|
| 3 tabelas | Banco de dados | Perfis, advertencias e sinais de atencao |
| 4 componentes | Frontend | Aba de ficha + modais + hook |
| 1 modificacao | Frontend | Remover feedback do AnalysisCard |
| 1 modificacao | Frontend | Adicionar aba em CollaboratorDetail |
| Tipos TypeScript | Tipos | Interfaces para novas entidades |
| RLS Policies | Seguranca | Protecao para todas as novas tabelas |

---

## Secao Tecnica

### Migracao SQL

```sql
-- Tabela de perfis
CREATE TABLE public.collaborator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  work_start_time time,
  work_end_time time,
  work_days text[] DEFAULT '{"seg","ter","qua","qui","sex"}',
  technical_level integer CHECK (technical_level >= 1 AND technical_level <= 5),
  communication_level integer CHECK (communication_level >= 1 AND communication_level <= 5),
  main_difficulties text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collaborator_id)
);

-- Tabela de advertencias
CREATE TABLE public.collaborator_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  warning_date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL CHECK (type IN ('verbal', 'escrita', 'suspensao')),
  reason text NOT NULL,
  details text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de sinais de atencao
CREATE TABLE public.collaborator_attention_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  flag_date date NOT NULL DEFAULT CURRENT_DATE,
  severity text NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'monitorando')),
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.collaborator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_attention_flags ENABLE ROW LEVEL SECURITY;

-- Policies para cada tabela (admin e manager)
```

### Estrutura de Arquivos Novos

```text
src/components/feedback/
  CollaboratorProfileTab.tsx    (novo)
  AddWarningModal.tsx           (novo)
  AddAttentionFlagModal.tsx     (novo)

src/hooks/
  useCollaboratorProfile.ts     (novo)
```

