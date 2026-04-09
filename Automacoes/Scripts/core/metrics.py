#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Cálculo de Métricas
Responsável por KPIs globais e métricas individuais por colaborador.
"""

import pandas as pd
from ..utils.formatters import converter_tempo_para_minutos


def calcular_metricas_gerais(df, colunas):
    """Calcula KPIs globais da operação de suporte.
    
    Métricas calculadas: TMA, TME, NPS médio, taxa de rechamadas,
    taxa de avaliação, finalizações N2 e TMA segregado (normal vs outliers).
    
    Args:
        df: DataFrame com dados brutos
        colunas: Dicionário de mapeamento de colunas
    
    Returns:
        Dicionário com todas as métricas gerais calculadas.
    """
    col_tempo = colunas['tempo']
    col_espera = colunas['espera']
    col_nps = colunas['nps']
    col_colaborador = colunas['colaborador']
    col_cliente = colunas['cliente']
    col_finalizacao = colunas['finalizacao']

    # Tempos de atendimento convertidos para minutos (limite de sanidade de 24h)
    tempos_validos_raw = df[col_tempo].apply(converter_tempo_para_minutos).dropna()
    tempos_validos = tempos_validos_raw[tempos_validos_raw <= 1440] # 24h em minutos

    # Tempo médio de espera (limitado a 12h e incluindo zeros)
    tempo_espera_medio = None
    if col_espera:
        tempos_espera = df[col_espera].apply(converter_tempo_para_minutos).dropna()
        tempos_espera_validos = tempos_espera[tempos_espera <= 720]
        tempo_espera_medio = round(tempos_espera_validos.mean(), 2) if len(tempos_espera_validos) > 0 else None

    # NPS médio e taxa de avaliação
    nps_medio = None
    avaliacoes_pendentes = 0
    taxa_avaliacao = 0
    if col_nps:
        nps_validos = pd.to_numeric(df[col_nps], errors='coerce').dropna()
        nps_medio = round(nps_validos.mean(), 2) if len(nps_validos) > 0 else None
        avaliacoes_pendentes = df[col_nps].isna().sum()
        taxa_avaliacao = round((len(nps_validos) / len(df)) * 100, 2) if len(df) > 0 else 0

    # Taxa de rechamadas (duplicados) — alinhado com o frontend TS
    # Fórmula: (total_registros - contatos_unicos) / total_registros * 100
    contatos_unicos = df[col_cliente].nunique()
    rechamadas = len(df) - contatos_unicos
    taxa_rechamadas = round((rechamadas / len(df)) * 100, 2) if len(df) > 0 else 0

    # Finalizações N2 (escalações para segundo nível)
    total_n2 = 0
    if col_finalizacao:
        n2_mask = df[col_finalizacao].astype(str).str.contains('N2|n2|Sup - N2', case=False, na=False)
        total_n2 = n2_mask.sum()

    # TMA Segregado via IQR (separa atendimentos normais de outliers)
    tma_normal = None
    tma_outliers = None
    if len(tempos_validos) > 0:
        q1 = tempos_validos.quantile(0.25)
        q3 = tempos_validos.quantile(0.75)
        iqr = q3 - q1
        limite_superior = round(q3 + 1.5 * iqr, 2)

        normais = tempos_validos[tempos_validos <= limite_superior]
        outliers = tempos_validos[tempos_validos > limite_superior]

        tma_normal = round(normais.mean(), 2) if len(normais) > 0 else None
        tma_outliers = round(outliers.mean(), 2) if len(outliers) > 0 else None

    return {
        'total_registros': len(df),
        'contatos_unicos': df[col_cliente].nunique(),
        'tempo_medio_atendimento': round(tempos_validos.mean(), 2) if len(tempos_validos) > 0 else None,
        'tempo_medio_espera': tempo_espera_medio,
        'tma_normal': tma_normal,
        'tma_outliers': tma_outliers,
        'nps_medio': nps_medio,
        'taxa_rechamadas': taxa_rechamadas,
        'taxa_avaliacao': taxa_avaliacao,
        'avaliacoes_pendentes': avaliacoes_pendentes,
        'total_finalizacoes_n2': int(total_n2),
    }


def calcular_metricas_por_colaborador(df, col_colaborador, col_tempo, col_cliente, col_nps=None):
    """Calcula métricas individuais por colaborador com detalhamento de NPS.
    
    Args:
        df: DataFrame com dados brutos
        col_colaborador: Nome da coluna do colaborador
        col_tempo: Nome da coluna de tempo de atendimento
        col_cliente: Nome da coluna do cliente
        col_nps: Nome da coluna de NPS (opcional)
    
    Returns:
        Lista de dicionários ordenada por volume de atendimentos (desc).
    """
    metricas = []
    total_atendimentos = len(df)

    for colaborador in df[col_colaborador].unique():
        df_colab = df[df[col_colaborador] == colaborador]

        tempos_raw = df_colab[col_tempo].apply(converter_tempo_para_minutos).dropna()
        tempos = tempos_raw[tempos_raw <= 1440] # Sanity cap 24h
        clientes_unicos = df_colab[col_cliente].nunique()
        duplicados = len(df_colab) - clientes_unicos

        # Métricas de NPS por colaborador
        nps_dados = {'media': None, 'total': 0, 'pendentes': 0, 'detratores': 0}
        if col_nps:
            nps_vals = pd.to_numeric(df_colab[col_nps], errors='coerce')
            validos = nps_vals.dropna()
            pendentes = df_colab[col_nps].isna().sum()

            nps_dados['total'] = len(validos)
            nps_dados['pendentes'] = int(pendentes)
            if len(validos) > 0:
                nps_dados['media'] = round(validos.mean(), 2)
                nps_dados['detratores'] = len(validos[validos < 4])

        metricas.append({
            'colaborador': colaborador,
            'total_atendimentos': len(df_colab),
            'percentual_participacao': round((len(df_colab) / total_atendimentos) * 100, 2),
            'tempo_medio_minutos': round(tempos.mean(), 2) if len(tempos) > 0 else None,
            'clientes_unicos': int(clientes_unicos),
            'possiveis_duplicados': duplicados,
            'nps_medio': nps_dados['media'],
            'avaliacoes_total': nps_dados['total'],
            'avaliacoes_pendentes': nps_dados['pendentes'],
            'detratores': nps_dados['detratores']
        })

    return sorted(metricas, key=lambda x: x['total_atendimentos'], reverse=True)
