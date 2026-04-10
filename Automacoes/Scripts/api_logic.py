#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Adaptador de API para o Motor de Análise.
Transforma a lógica de script em funções chamáveis por uma API Web.
"""

import os
import pandas as pd
from Automacoes.Scripts.io.reader import detectar_colunas
from Automacoes.Scripts.core.metrics import calcular_metricas_gerais, calcular_metricas_por_colaborador
from Automacoes.Scripts.core.analysis import (
    analisar_detratores, analisar_motivos_finalizacao,
    analisar_outliers_tma, analisar_correlacao_nps_problema,
    analisar_casos_longos
)
from Automacoes.Scripts.core.insights import gerar_insights, gerar_plano_acao_semanal

def processar_dados_planilha(df: pd.DataFrame):
    """Executa o pipeline completo de análise em um DataFrame em memória."""
    try:
        # 1. Detecta colunas
        colunas = detectar_colunas(df)
        
        # 2. Calcula métricas
        metricas_gerais = calcular_metricas_gerais(df, colunas)
        metricas_colaborador = calcular_metricas_por_colaborador(
            df, colunas['colaborador'], colunas['tempo'],
            colunas['cliente'], col_nps=colunas['nps']
        )
        
        # 3. Análises transversais
        motivos = analisar_motivos_finalizacao(df, colunas['finalizacao'])
        analise_det = analisar_detratores(df, colunas)
        
        # 4. Análises avançadas
        outliers_tma = analisar_outliers_tma(df, colunas)
        correlacao_nps = analisar_correlacao_nps_problema(df, colunas)
        casos_longos = analisar_casos_longos(df, colunas, limite_horas=5)
        
        # 5. Inteligência
        insights = gerar_insights(
            metricas_gerais, metricas_colaborador, motivos,
            outliers_tma=outliers_tma,
            casos_longos=casos_longos,
            correlacao_nps=correlacao_nps
        )
        plano_acao = gerar_plano_acao_semanal(metricas_gerais, metricas_colaborador, motivos)
        
        return {
            'success': True,
            'metricas_gerais': metricas_gerais,
            'metricas_colaborador': metricas_colaborador,
            'motivos_finalizacao': motivos,
            'analise_detratores': analise_det,
            'analise_tma_detalhada': outliers_tma,
            'insights': insights,
            'plano_acao_semanal': plano_acao,
            'errors': []
        }
    except Exception:
        import traceback
        return {
            'success': False,
            'errors': [traceback.format_exc()]
        }
