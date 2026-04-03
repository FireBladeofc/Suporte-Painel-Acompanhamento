#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Geração de Walkthrough Analítico
Gera documento explicativo completo com todas as seções de análise.
"""

from ..utils.formatters import formatar_minutos_para_texto


def gerar_walkthrough_analise(dados, caminho):
    """Gera walkthrough detalhado e explicativo da análise completa."""
    try:
        with open(caminho, 'w', encoding='utf-8') as f:
            meta = dados['metadata']
            geral = dados['metricas_gerais']
            motivos = dados['motivos_finalizacao']
            detratores = dados.get('analise_detratores')

            f.write(f"# 📘 Walkthrough Analítico: {meta['arquivo_origem']}\n\n")
            f.write(f"> **Data da Análise:** {meta['data_analise']}\n\n")
            f.write("Análise detalhada dos dados operacionais e de qualidade.\n\n")

            # 1. Saúde Operacional
            _escrever_saude_operacional(f, geral)

            # 2. Qualidade NPS
            _escrever_qualidade_nps(f, geral, detratores)

            # 3. Performance da Equipe
            _escrever_performance_equipe(f, dados['metricas_colaborador'])

            # 4-6. Análises avançadas
            _escrever_analises_avancadas(f, dados)

            # 7. Insights
            _escrever_insights(f, dados.get('insights', []))

            # 8. Motivos
            _escrever_motivos_walkthrough(f, motivos)

            # 9. Plano de Ação
            _escrever_plano_walkthrough(f, dados.get('plano_acao_semanal'))

        print(f"[OK] Walkthrough salvo: {caminho}")
    except Exception as e:
        print(f"[ERRO] Falha ao gerar walkthrough: {e}")


def _escrever_saude_operacional(f, geral):
    f.write("## 1. Saúde Operacional\n\n")
    f.write("| Indicador | Definição | Resultado |\n| :--- | :--- | :---: |\n")
    f.write(f"| **TMA** | Tempo Médio de Atendimento | **{formatar_minutos_para_texto(geral.get('tempo_medio_atendimento'))}** |\n")
    f.write(f"| **TME** | Tempo Médio de Espera | **{formatar_minutos_para_texto(geral.get('tempo_medio_espera'))}** |\n")
    f.write(f"| **Volume** | Total de registros | **{geral['total_registros']:,}** |\n")
    f.write(f"| **Rechamadas** | Taxa de retrabalho | **{geral['taxa_rechamadas']:.2f}%** |\n\n")

    tme = geral.get('tempo_medio_espera')
    f.write("### ⏱️ Análise de Tempos\n")
    if tme and tme > 60:
        f.write(f"- ⚠️ TME de {formatar_minutos_para_texto(tme)} está elevado.\n")
    else:
        f.write("- ✅ TME dentro de parâmetros aceitáveis.\n")
    f.write("\n")


def _escrever_qualidade_nps(f, geral, detratores):
    nps = geral.get('nps_medio')
    f.write("## 2. Qualidade Percebida (NPS)\n\n")
    f.write(f"NPS Médio: **{nps if nps else 'N/A'}**\n\n")
    f.write("| Métrica | Valor |\n| :--- | :---: |\n")
    f.write(f"| Taxa de Resposta | {geral['taxa_avaliacao']:.1f}% |\n")
    f.write(f"| Pendentes | {geral['avaliacoes_pendentes']} |\n\n")

    if detratores and detratores.get('total', 0) > 0:
        f.write(f"### 🔻 Detratores (NPS < 4): {detratores['total']} casos\n\n")
        for m, q in detratores['motivos_principais'].items():
            f.write(f"- **{m}**: {q} ocorrências\n")
        f.write("\n")
    else:
        f.write("### ✅ Nenhum detrator identificado!\n\n")


def _escrever_performance_equipe(f, metricas_colaborador):
    f.write("## 3. Performance da Equipe\n\n")
    f.write("| Agente | Vol. | TMA | NPS | Detr. | Pend. |\n")
    f.write("| :--- | :---: | :---: | :---: | :---: | :---: |\n")
    for c in metricas_colaborador:
        nps_c = f"{c['nps_medio']:.1f}" if c['nps_medio'] else "-"
        tma_c = formatar_minutos_para_texto(c['tempo_medio_minutos'])
        f.write(f"| **{c['colaborador']}** | {c['total_atendimentos']} | {tma_c} | **{nps_c}** | {c['detratores']} | {c['avaliacoes_pendentes']} |\n")
    f.write("\n")


def _escrever_analises_avancadas(f, dados):
    # 4. Outliers TMA
    outliers = dados.get('analise_tma_detalhada', {})
    if outliers:
        f.write("## 4. ⏱️ Análise Detalhada de TMA\n\n")
        if outliers.get('estatisticas_por_agente'):
            f.write("| Agente | Atend. | TMA | Máx. | Desvio |\n| :--- | :---: | :---: | :---: | :---: |\n")
            for ag in outliers['estatisticas_por_agente']:
                f.write(f"| {ag['agente']} | {ag['total_atendimentos']} | {ag['tma_minutos']} | {ag['maximo_minutos']} | {ag['desvio_padrao']} |\n")
            f.write("\n")
        f.write(f"**{outliers.get('total_outliers', 0)} outliers** (>{formatar_minutos_para_texto(outliers.get('limite_superior_minutos', 0))})\n\n")

    # 5. Correlação NPS
    correlacao = dados.get('correlacao_nps_problema', [])
    if correlacao:
        f.write("## 5. 📊 Correlação NPS × Problema\n\n")
        f.write("| Finalização | Avaliações | NPS |\n| :--- | :---: | :---: |\n")
        for item in correlacao:
            f.write(f"| {item['finalizacao']} | {item['total_avaliacoes']} | {item['nps_medio']:.2f} |\n")
        f.write("\n")

    # 6. Casos Longos
    cl = dados.get('analise_casos_longos', {})
    if cl and cl.get('total_casos', 0) > 0:
        f.write(f"## 6. 🔍 Casos > {cl.get('limite_horas', 5)}h\n\n")
        f.write(f"- **Total:** {cl['total_casos']} | **Impacto:** {cl['impacto_percentual_tempo_total']:.1f}% do tempo total\n\n")


def _escrever_insights(f, insights_lista):
    if insights_lista:
        f.write("## 7. 💡 Insights e Alertas\n\n")
        icon_map = {'critico': '🔴', 'alerta': '🟠', 'atencao': '🟡', 'destaque': '🔵', 'recomendacao': '🟢'}
        for ins in insights_lista:
            icon = icon_map.get(ins.get('tipo', ''), '⚪')
            f.write(f"### {icon} {ins['titulo']}\n{ins['mensagem']}\n\n")


def _escrever_motivos_walkthrough(f, motivos):
    f.write("## 8. Principais Motivos de Contato\n\n")
    if motivos.get('top_10_motivos'):
        top1 = motivos['top_10_motivos'][0]
        f.write(f"Principal ofensor: **{top1['motivo']}** ({top1['percentual']}%)\n\n")
        f.write("| # | Motivo | Vol. | % |\n| :---: | :--- | :---: | :---: |\n")
        for i, m in enumerate(motivos['top_10_motivos'][:5], 1):
            f.write(f"| {i}º | {m['motivo']} | {m['quantidade']} | {m['percentual']:.1f}% |\n")
    f.write("\n")


def _escrever_plano_walkthrough(f, plano):
    f.write("## 🚀 Próximos Passos\n\n")
    if plano:
        for acao in plano:
            icon = "🔴" if acao['status'] == "CRÍTICO" else "🟡"
            f.write(f"### {icon} {acao['area']}\n")
            f.write(f"- **Atual:** {acao['metricas']}\n- **Ação:** {acao['acao']}\n- **Meta:** {acao['meta_semana']}\n\n")
    else:
        f.write("Nenhuma ação crítica identificada.\n")
