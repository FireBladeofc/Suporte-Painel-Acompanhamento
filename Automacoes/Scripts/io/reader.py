#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Leitura de Dados
Responsável por carregar planilhas e detectar colunas automaticamente.
"""

import pandas as pd


def carregar_planilha(caminho):
    """Carrega planilha Excel com tratamento de erros.
    
    Args:
        caminho: Caminho absoluto ou relativo para o arquivo .xlsx
    
    Returns:
        DataFrame com os dados ou None em caso de erro.
    """
    try:
        print(f"\n[*] Carregando planilha: {caminho}")
        df = pd.read_excel(caminho)
        print(f"[OK] Planilha carregada com sucesso! {len(df)} linhas encontradas")
        return df
    except FileNotFoundError:
        print(f"[ERRO] Arquivo não encontrado - {caminho}")
        return None
    except Exception as e:
        print(f"[ERRO] Erro ao carregar planilha: {e}")
        return None


def detectar_colunas(df):
    """Detecta colunas automaticamente por heurística de nomes.
    
    Busca padrões conhecidos nos nomes das colunas do DataFrame
    para mapear: colaborador, cliente, tempo, espera, nps, data, finalizacao.
    
    Args:
        df: DataFrame com dados brutos da planilha.
    
    Returns:
        Dicionário com mapeamento {campo_logico: nome_coluna_real}.
    """
    colunas = {
        'colaborador': None,
        'cliente': None,
        'tempo': None,
        'espera': None,
        'nps': None,
        'data': None,
        'finalizacao': None
    }

    for col in df.columns:
        col_lower = col.lower()

        # Detecção do colaborador/agente
        if 'agente' in col_lower or 'colab' in col_lower or 'atend' in col_lower:
            colunas['colaborador'] = col

        # Detecção do cliente/lead
        elif 'lead' in col_lower or 'client' in col_lower or 'usuari' in col_lower:
            colunas['cliente'] = col

        # Detecção do tempo de atendimento (exclui espera)
        elif 'dura' in col_lower or ('tempo' in col_lower and 'espera' not in col_lower):
            colunas['tempo'] = col

        # Detecção do tempo de espera
        elif 'espera' in col_lower or 'wait' in col_lower:
            colunas['espera'] = col

        # Detecção de NPS/avaliação
        elif 'nps' in col_lower or 'avaliac' in col_lower or 'nota' in col_lower:
            colunas['nps'] = col

        # Detecção de data
        elif 'data' in col_lower or 'date' in col_lower:
            colunas['data'] = col

        # Detecção de motivo de finalização
        elif 'finaliza' in col_lower or 'motiv' in col_lower:
            colunas['finalizacao'] = col

    return colunas
