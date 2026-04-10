#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Teste de Integração Interno.
Valida o motor de análise Python sem depender de navegador ou servidor externo.
"""

import pandas as pd
import sys
import os

# Adiciona diretório raiz ao path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from Automacoes.Scripts.api_logic import processar_dados_planilha

def run_test():
    print("\n--- INICIANDO TESTE INTERNO DE INTEGRAÇÃO ---")
    
    # 1. Cria dados de teste simulando uma planilha real
    data = {
        'Agente': ['Ana', 'Ana', 'Beto', 'Beto'],
        'Lead Number': ['101', '102', '103', '104'],
        'Departamento': ['Suporte', 'Suporte', 'N2', 'Financeiro'],
        'Duração': ['00:10:00', '00:15:00', '00:05:00', '01:00:00'],
        'Espera': ['00:01:00', '00:02:00', '00:00:30', '00:10:00'],
        'NPS': [5, 4, 5, 2],
        'Finalização': ['Certificado', 'N2', 'Financeiro', 'Dúvida']
    }
    df = pd.DataFrame(data)
    
    print("[*] DataFrame de teste criado com 4 registros.")
    
    # 2. Processa via lógica da API
    result = processar_dados_planilha(df)
    
    # 3. Validações
    if not result['success']:
        print(f"[ERRO] Falha no processamento: {result['errors']}")
        return False
        
    metrics = result['metricas_gerais']
    print(f"[OK] Processamento bem-sucedido.")
    print(f"     - Total Registros: {metrics['total_registros']}")
    print(f"     - TMA Médio: {metrics['tempo_medio_atendimento']} min")
    print(f"     - NPS Médio: {metrics['nps_medio']}")
    
    # Verifica se os cálculos básicos estão corretos
    assert metrics['total_registros'] == 4
    assert metrics['total_finalizacoes_n2'] == 1
    
    print("\n[OK] TESTE INTERNO CONCLUIDO COM SUCESSO!")
    return True

if __name__ == "__main__":
    if run_test():
        sys.exit(0)
    else:
        sys.exit(1)
