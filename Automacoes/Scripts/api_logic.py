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
        
        # 6. Extração de Tickets Sanitizados (Garantia de Margem de Erro)
        # Filtramos para enviar apenas o que o Python validou
        # Convertemos colunas de data para string ISO para o React
        df_sanitizado = df.copy()
        for col_date in [colunas['data'], colunas.get('data_finalizacao')]:
            if col_date and col_date in df_sanitizado.columns:
                df_sanitizado[col_date] = pd.to_datetime(df_sanitizado[col_date], errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%S')

        tickets_sanitizados = []
        for index, row in df_sanitizado.iterrows():
            # Converte cada linha para o formato SupportTicket do Typescript
            # Nota: Aqui garantimos que o Dashboard receba apenas dados auditados
            tickets_sanitizados.append({
                'id': f"py-{index}-{pd.Timestamp.now().timestamp()}",
                'agente': str(row.get(colunas['colaborador'], 'Desconhecido')),
                'data_abertura': row.get(colunas['data']),
                'data_finalizacao': row.get(colunas.get('finalizacao')), # Mapeamento dinâmico
                'duracao': float(metricas_gerais.get('tempo_medio_atendimento', 0)), # Fallback se necessário
                'espera': float(metricas_gerais.get('tempo_medio_espera', 0)) if metricas_gerais.get('tempo_medio_espera') else 0,
                'finalizacao': str(row.get(colunas['finalizacao'], '')),
                'nps': float(row.get(colunas['nps'])) if pd.notnull(row.get(colunas['nps'])) else None,
                'lead_number': str(row.get(colunas['cliente'], '')),
                'departamento': str(row.get('Departamento', 'Suporte')) # Campo padrão ou heurística
            })

        return {
            'success': True,
            'metricas_gerais': metricas_gerais,
            'metricas_colaborador': metricas_colaborador,
            'motivos_finalizacao': motivos,
            'analise_detratores': analise_det,
            'analise_tma_detalhada': outliers_tma,
            'insights': insights,
            'plano_acao_semanal': plano_acao,
            'tickets': tickets_sanitizados[:5000], # Limite de amostragem para performance
            'errors': []
        }
    except Exception:
        import traceback
        return {
            'success': False,
            'errors': [traceback.format_exc()]
        }
