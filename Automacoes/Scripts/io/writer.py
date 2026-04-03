#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Exportação de Dados
Responsável por salvar resultados em JSON e gerar relatórios Markdown.
"""

import json
from ..utils.formatters import formatar_minutos_para_texto


def salvar_json(dados, caminho):
    """Salva dados em JSON com conversão automática de tipos numpy."""
    try:
        def converter_tipos(obj):
            import numpy as np
            if isinstance(obj, (np.int64, np.int32)):
                return int(obj)
            if isinstance(obj, (np.float64, np.float32)):
                return float(obj)
            raise TypeError(f"Tipo {type(obj)} não é serializável")

        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, indent=2, default=converter_tipos)
        print(f"[OK] JSON salvo: {caminho}")
    except Exception as e:
        print(f"[ERRO] Falha ao salvar JSON: {e}")


def _escrever_visao_geral(f, geral):
    """Escreve seção de visão geral no relatório."""
    f.write("## 1. Visão Geral da Operação\n\n")
    f.write("| Indicador | Resultado |\n| :--- | :---: |\n")
    f.write(f"| **Volume Total** | {geral['total_registros']:,} |\n")
    f.write(f"| **Clientes Distintos** | {geral['contatos_unicos']:,} |\n")
    f.write(f"| **TMA** | {formatar_minutos_para_texto(geral.get('tempo_medio_atendimento'))} |\n")
    f.write(f"| **TME** | {formatar_minutos_para_texto(geral.get('tempo_medio_espera'))} |\n")
    f.write(f"| **NPS Global** | {geral.get('nps_medio', 'N/A')} |\n")
    f.write(f"| **Total Avaliações** | {geral['total_registros'] - geral['avaliacoes_pendentes']:,} |\n")
    f.write(f"| **Avaliações Pendentes** | {geral['avaliacoes_pendentes']:,} |\n")
    f.write("\n---\n\n")


def _escrever_colaboradores(f, metricas_colaborador):
    """Escreve tabela de colaboradores no relatório."""
    f.write("## 2. Detalhamento por Colaborador\n\n")
    f.write("| Colaborador | Vol. | TMA | Aval. | Pend. | NPS | Detr. |\n")
    f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n")
    for c in metricas_colaborador:
        nps = f"{c['nps_medio']:.1f}" if c['nps_medio'] else "-"
        tma = formatar_minutos_para_texto(c['tempo_medio_minutos'])
        f.write(f"| {c['colaborador']} | {c['total_atendimentos']} | {tma} | {c['avaliacoes_total']} | {c['avaliacoes_pendentes']} | {nps} | {c['detratores']} |\n")
    f.write("\n---\n\n")


def _escrever_detratores(f, detratores):
    """Escreve seção de detratores no relatório."""
    if detratores and detratores.get('total', 0) > 0:
        f.write(f"## 3. Análise de Insatisfação (Detratores)\n\n")
        f.write(f"**{detratores['total']} avaliações baixas** (NPS < 4):\n\n")
        f.write("| Motivo | Ocorrências |\n| :--- | :---: |\n")
        for motivo, qtd in detratores['motivos_principais'].items():
            f.write(f"| {motivo} | {qtd} |\n")
        f.write("\n")
    else:
        f.write("## 3. Análise de Insatisfação\n\n✅ Nenhum detrator neste período.\n\n")
    f.write("---\n\n")


def _escrever_plano_acao(f, plano):
    """Escreve plano de ação semanal."""
    if plano:
        f.write("## 4. Plano de Ação Estratégico (Semanal)\n\n")
        for acao in plano:
            icon = "🔴" if acao['status'] == "CRÍTICO" else "🟡" if acao['status'] == "ALERTA" else "🔵"
            f.write(f"### {icon} {acao['area']}\n")
            f.write(f"- **O que:** {acao['acao']}\n- **Por que:** {acao['metricas']}\n- **Meta:** {acao['meta_semana']}\n\n")


def _escrever_motivos(f, motivos):
    """Escreve top motivos de contato."""
    if motivos.get('top_10_motivos'):
        f.write("## 5. Top 10 Motivos de Contato\n\n")
        f.write("| Rank | Motivo | Volume | % |\n| :---: | :--- | :---: | :---: |\n")
        for i, m in enumerate(motivos['top_10_motivos'], 1):
            f.write(f"| {i}º | {m['motivo']} | {m['quantidade']} | {m['percentual']:.1f}% |\n")


def gerar_relatorio_markdown(dados, caminho):
    """Gera relatório operacional detalhado em Markdown."""
    try:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write("# Relatório Operacional Detalhado de Suporte\n\n")
            _escrever_visao_geral(f, dados['metricas_gerais'])
            _escrever_colaboradores(f, dados['metricas_colaborador'])
            _escrever_detratores(f, dados.get('analise_detratores', {}))
            _escrever_plano_acao(f, dados.get('plano_acao_semanal'))
            _escrever_motivos(f, dados['motivos_finalizacao'])
        print(f"[OK] Relatório salvo: {caminho}")
    except Exception as e:
        print(f"[ERRO] Falha ao gerar relatório: {e}")
