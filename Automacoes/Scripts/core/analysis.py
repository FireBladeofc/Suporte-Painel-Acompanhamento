#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Análises Avançadas
Responsável por análises de detratores, motivos, outliers, correlações e casos longos.
"""

import pandas as pd
from ..utils.formatters import converter_tempo_para_minutos


def analisar_detratores(df, colunas):
    """Analisa notas baixas (NPS < 4) e seus motivos de finalização.
    
    Args:
        df: DataFrame com dados brutos
        colunas: Dicionário de mapeamento de colunas
    
    Returns:
        Dicionário com total de detratores, motivos principais e amostra.
    """
    col_nps = colunas.get('nps')
    col_finalizacao = colunas.get('finalizacao')

    if not col_nps or not col_finalizacao:
        return {}

    # Filtra detratores (NPS < 4)
    nps_vals = pd.to_numeric(df[col_nps], errors='coerce')
    mask_detratores = nps_vals < 4
    df_detratores = df[mask_detratores].copy()

    if len(df_detratores) == 0:
        return {'total': 0, 'motivos': {}}

    # Top 5 motivos dos detratores
    motivos = df_detratores[col_finalizacao].value_counts().head(5).to_dict()

    # Amostra dos 10 primeiros casos para auditoria
    amostra = []
    cols_export = [c for c in [colunas['colaborador'], col_nps, col_finalizacao] if c]
    for _, row in df_detratores.head(10).iterrows():
        item = {k: str(row[k]) for k in cols_export}
        amostra.append(item)

    return {
        'total': len(df_detratores),
        'motivos_principais': {str(k): int(v) for k, v in motivos.items()},
        'amostra': amostra
    }


def analisar_motivos_finalizacao(df, col_finalizacao):
    """Analisa e categoriza motivos de finalização dos atendimentos.
    
    Categorias automáticas: Instabilidade/Falhas, Dúvidas/Suporte,
    Configuração, Comunicação, Outros.
    
    Args:
        df: DataFrame com dados brutos
        col_finalizacao: Nome da coluna de finalização
    
    Returns:
        Dicionário com top 10, categorias e motivo mais comum.
    """
    if col_finalizacao is None or col_finalizacao not in df.columns:
        return {}

    motivos = df[col_finalizacao].dropna()
    if len(motivos) == 0:
        return {}

    contagem = motivos.value_counts()
    total = len(motivos)

    # Top 10 motivos com volume e percentual
    top_motivos = []
    for motivo, qtd in contagem.head(10).items():
        top_motivos.append({
            'motivo': str(motivo),
            'quantidade': int(qtd),
            'percentual': round((qtd / total) * 100, 2)
        })

    # Categorização automática por palavras-chave
    categorias = {
        'Instabilidade/Falhas': 0,
        'Dúvidas/Suporte': 0,
        'Configuração': 0,
        'Comunicação': 0,
        'Outros': 0
    }

    for motivo, qtd in contagem.items():
        motivo_lower = str(motivo).lower()
        if any(p in motivo_lower for p in ['instabilidade', 'falha', 'erro', 'bug']):
            categorias['Instabilidade/Falhas'] += qtd
        elif any(p in motivo_lower for p in ['dúvida', 'duvida', 'ajuda', 'suporte']):
            categorias['Dúvidas/Suporte'] += qtd
        elif any(p in motivo_lower for p in ['config', 'ajuste', 'setup']):
            categorias['Configuração'] += qtd
        elif any(p in motivo_lower for p in ['comunicação', 'comunicacao', 'mensagem', 'sincroniza']):
            categorias['Comunicação'] += qtd
        else:
            categorias['Outros'] += qtd

    # Aplica percentuais apenas para categorias com ocorrências
    categorias_percentual = {}
    for cat, qtd in categorias.items():
        if qtd > 0:
            categorias_percentual[cat] = {
                'quantidade': qtd,
                'percentual': round((qtd / total) * 100, 2)
            }

    return {
        'total_analisado': total,
        'total_motivos_unicos': len(contagem),
        'top_10_motivos': top_motivos,
        'categorias': categorias_percentual,
        'motivo_mais_comum': {
            'motivo': str(contagem.index[0]),
            'quantidade': int(contagem.iloc[0]),
            'percentual': round((contagem.iloc[0] / total) * 100, 2)
        }
    }


def analisar_outliers_tma(df, colunas):
    """Detecta outliers de duração via IQR e retorna análise detalhada.
    
    Utiliza o método Interquartile Range para identificar atendimentos
    com duração anormalmente alta.
    
    Args:
        df: DataFrame com dados brutos
        colunas: Dicionário de mapeamento de colunas
    
    Returns:
        Dicionário com limite, total de outliers, estatísticas e top 5 mais longos.
    """
    col_tempo = colunas.get('tempo')
    col_colaborador = colunas.get('colaborador')
    col_finalizacao = colunas.get('finalizacao')
    col_cliente = colunas.get('cliente')

    if not col_tempo:
        return {}

    df2 = df.copy()
    df2['_dur_min'] = df2[col_tempo].apply(converter_tempo_para_minutos)
    df2 = df2.dropna(subset=['_dur_min'])

    # Cálculo IQR
    q1 = df2['_dur_min'].quantile(0.25)
    q3 = df2['_dur_min'].quantile(0.75)
    iqr = q3 - q1
    limite_superior = round(q3 + 1.5 * iqr, 2)

    outliers = df2[df2['_dur_min'] > limite_superior]

    # Estatísticas por agente
    stats_agente = []
    if col_colaborador:
        for agente in df2[col_colaborador].unique():
            df_ag = df2[df2[col_colaborador] == agente]
            stats_agente.append({
                'agente': agente,
                'total_atendimentos': len(df_ag),
                'tma_minutos': round(df_ag['_dur_min'].mean(), 1),
                'maximo_minutos': round(df_ag['_dur_min'].max(), 1),
                'desvio_padrao': round(df_ag['_dur_min'].std(), 1)
            })
        stats_agente.sort(key=lambda x: x['total_atendimentos'], reverse=True)

    # Top 5 atendimentos mais longos
    top5 = []
    for _, row in outliers.nlargest(5, '_dur_min').iterrows():
        item = {}
        if col_colaborador:
            item['agente'] = str(row[col_colaborador])
        item['duracao_minutos'] = round(row['_dur_min'], 1)
        if col_finalizacao:
            item['finalizacao'] = str(row[col_finalizacao])
        if col_cliente:
            item['lead_number'] = str(row[col_cliente])
        top5.append(item)

    return {
        'limite_superior_minutos': limite_superior,
        'total_outliers': len(outliers),
        'duracao_media_outliers': round(outliers['_dur_min'].mean(), 1) if len(outliers) > 0 else 0,
        'estatisticas_por_agente': stats_agente,
        'top5_mais_longos': top5
    }


def analisar_correlacao_nps_problema(df, colunas, min_avaliacoes=5):
    """Correlaciona NPS médio com tipo de finalização.
    
    Filtra apenas motivos com número mínimo de avaliações para
    garantir significância estatística.
    
    Args:
        df: DataFrame com dados brutos
        colunas: Dicionário de mapeamento de colunas
        min_avaliacoes: Mínimo de avaliações para considerar um motivo
    
    Returns:
        Lista de dicionários ordenada por NPS médio (desc).
    """
    col_nps = colunas.get('nps')
    col_finalizacao = colunas.get('finalizacao')

    if not col_nps or not col_finalizacao:
        return []

    df2 = df.copy()
    df2['_nps'] = pd.to_numeric(df2[col_nps], errors='coerce')
    df2 = df2.dropna(subset=['_nps'])

    resultado = []
    for motivo, grupo in df2.groupby(col_finalizacao):
        if len(grupo) >= min_avaliacoes:
            resultado.append({
                'finalizacao': str(motivo),
                'total_avaliacoes': len(grupo),
                'nps_medio': round(grupo['_nps'].mean(), 2)
            })

    resultado.sort(key=lambda x: x['nps_medio'], reverse=True)
    return resultado


def analisar_casos_longos(df, colunas, limite_horas=5):
    """Analisa casos com duração acima do limite em horas.
    
    Identifica atendimentos excepcionalmente longos e calcula
    seu impacto no tempo total da equipe.
    
    Args:
        df: DataFrame com dados brutos
        colunas: Dicionário de mapeamento de colunas
        limite_horas: Limite em horas para considerar como caso longo
    
    Returns:
        Dicionário com total, impacto, distribuição por problema e por agente.
    """
    col_tempo = colunas.get('tempo')
    col_colaborador = colunas.get('colaborador')
    col_finalizacao = colunas.get('finalizacao')

    if not col_tempo:
        return {}

    limite_min = limite_horas * 60
    df2 = df.copy()
    df2['_dur_min'] = df2[col_tempo].apply(converter_tempo_para_minutos)
    df2 = df2.dropna(subset=['_dur_min'])

    casos_longos = df2[df2['_dur_min'] > limite_min]
    total_tempo = df2['_dur_min'].sum()
    tempo_longos = casos_longos['_dur_min'].sum()
    impacto_pct = round((tempo_longos / total_tempo) * 100, 1) if total_tempo > 0 else 0

    # Distribuição por tipo de problema
    por_problema = []
    if col_finalizacao and len(casos_longos) > 0:
        contagem = casos_longos[col_finalizacao].value_counts().head(10)
        for motivo, qtd in contagem.items():
            por_problema.append({'finalizacao': str(motivo), 'quantidade': int(qtd)})

    # Distribuição por agente
    por_agente = []
    if col_colaborador and len(casos_longos) > 0:
        contagem_ag = casos_longos[col_colaborador].value_counts()
        for agente, qtd in contagem_ag.items():
            por_agente.append({'agente': str(agente), 'quantidade': int(qtd)})

    return {
        'limite_horas': limite_horas,
        'total_casos': len(casos_longos),
        'duracao_media_minutos': round(casos_longos['_dur_min'].mean(), 1) if len(casos_longos) > 0 else 0,
        'impacto_percentual_tempo_total': impacto_pct,
        'por_problema': por_problema,
        'por_agente': por_agente
    }
