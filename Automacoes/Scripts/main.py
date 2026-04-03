#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Análise Estratégica de Suporte Técnico
Ponto de entrada principal — orquestra leitura, cálculo, análise e exportação.

Uso:
    python -m Automacoes.Scripts.main <arquivo.xlsx>
    python Automacoes/Scripts/main.py <arquivo.xlsx>
"""

import sys
import io
import os
import glob
import pandas as pd

# Configura encoding UTF-8 para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Resolve paths para imports quando executado diretamente
if __name__ == "__main__":
    # Adiciona raiz do projeto ao sys.path para imports relativos
    _project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    if _project_root not in sys.path:
        sys.path.insert(0, _project_root)

from Automacoes.Scripts.io.reader import carregar_planilha, detectar_colunas
from Automacoes.Scripts.core.metrics import calcular_metricas_gerais, calcular_metricas_por_colaborador
from Automacoes.Scripts.core.analysis import (
    analisar_detratores, analisar_motivos_finalizacao,
    analisar_outliers_tma, analisar_correlacao_nps_problema,
    analisar_casos_longos
)
from Automacoes.Scripts.core.insights import gerar_insights, gerar_plano_acao_semanal
from Automacoes.Scripts.io.writer import salvar_json, gerar_relatorio_markdown
from Automacoes.Scripts.io.walkthrough import gerar_walkthrough_analise


# Diretório de saída relativo à raiz do projeto
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'Dados', 'Final')


def analisar_planilha(caminho_arquivo):
    """Função principal de análise — orquestra todo o pipeline."""
    print("\n" + "=" * 60)
    print(">> INICIANDO ANALISE AVANCADA DE SUPORTE TECNICO")
    print("=" * 60 + "\n")

    # 1. Carrega planilha
    df = carregar_planilha(caminho_arquivo)
    if df is None:
        return None

    # 2. Detecta colunas automaticamente
    print("\n[*] Detectando colunas...")
    colunas = detectar_colunas(df)
    for chave, valor in colunas.items():
        print(f"   {chave.capitalize()}: {valor}")

    # 3. Calcula métricas
    print("\n[*] Calculando métricas operacionais...")
    metricas_gerais = calcular_metricas_gerais(df, colunas)
    metricas_colaborador = calcular_metricas_por_colaborador(
        df, colunas['colaborador'], colunas['tempo'],
        colunas['cliente'], col_nps=colunas['nps']
    )

    # 4. Analisa motivos e detratores
    print("\n[*] Analisando motivos de finalização...")
    motivos = analisar_motivos_finalizacao(df, colunas['finalizacao'])

    print("\n[*] Analisando detratores (notas baixas)...")
    analise_det = analisar_detratores(df, colunas)

    # 5. Análises avançadas
    print("\n[*] Executando análises avançadas...")
    outliers_tma = analisar_outliers_tma(df, colunas)
    correlacao_nps = analisar_correlacao_nps_problema(df, colunas)
    casos_longos = analisar_casos_longos(df, colunas, limite_horas=5)

    # 6. Gera insights e plano de ação
    print("\n[*] Gerando inteligência de dados...")
    insights = gerar_insights(
        metricas_gerais, metricas_colaborador, motivos,
        outliers_tma=outliers_tma,
        casos_longos=casos_longos,
        correlacao_nps=correlacao_nps
    )
    plano_acao = gerar_plano_acao_semanal(metricas_gerais, metricas_colaborador, motivos)

    # 7. Monta resultado consolidado
    resultado = {
        'metadata': {
            'arquivo_origem': caminho_arquivo,
            'data_analise': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
        },
        'metricas_gerais': metricas_gerais,
        'metricas_colaborador': metricas_colaborador,
        'motivos_finalizacao': motivos,
        'analise_detratores': analise_det,
        'analise_tma_detalhada': outliers_tma,
        'correlacao_nps_problema': correlacao_nps,
        'analise_casos_longos': casos_longos,
        'insights': insights,
        'plano_acao_semanal': plano_acao
    }

    print("\n[OK] Análise concluída!")
    print("=" * 60 + "\n")
    return resultado


if __name__ == "__main__":
    # Detecta arquivo Excel via argumento ou busca na raiz
    if len(sys.argv) > 1:
        CAMINHO_PLANILHA = sys.argv[1]
    else:
        # Busca na pasta Dados/Bruto primeiro, depois na raiz do projeto
        raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        dados_bruto = os.path.join(raiz, 'Dados', 'Bruto')

        arquivos = glob.glob(os.path.join(dados_bruto, "*.xlsx"))
        if not arquivos:
            arquivos = glob.glob(os.path.join(raiz, "*.xlsx"))

        if not arquivos:
            print("\n[ERRO] Nenhum arquivo .xlsx encontrado!")
            print("Use: python Automacoes/Scripts/main.py <arquivo.xlsx>")
            sys.exit(1)
        elif len(arquivos) == 1:
            CAMINHO_PLANILHA = arquivos[0]
            print(f"\n[*] Arquivo detectado: {CAMINHO_PLANILHA}")
        else:
            print("\n[*] Múltiplos arquivos encontrados:")
            for i, arq in enumerate(arquivos, 1):
                print(f"   {i}. {arq}")
            print("\nUse: python Automacoes/Scripts/main.py <arquivo.xlsx>")
            sys.exit(1)

    # Garante que o diretório de saída existe
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Define nomes dos arquivos de saída
    nome_base = os.path.splitext(os.path.basename(CAMINHO_PLANILHA))[0]
    caminho_json = os.path.join(OUTPUT_DIR, f"{nome_base}_resultado.json")
    caminho_walkthrough = os.path.join(OUTPUT_DIR, f"{nome_base}_walkthrough.md")

    # Executa análise
    resultado = analisar_planilha(CAMINHO_PLANILHA)

    if resultado:
        salvar_json(resultado, caminho_json)
        gerar_walkthrough_analise(resultado, caminho_walkthrough)

        print(f"\n✅ Arquivos salvos em {OUTPUT_DIR}:")
        print(f"   📄 {caminho_json}")
        print(f"   📘 {caminho_walkthrough}")
        print("\n[OK] Processo finalizado com sucesso!")
    else:
        print("\n[ERRO] Falha na análise.")
