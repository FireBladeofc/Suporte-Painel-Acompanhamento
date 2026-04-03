#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Inteligência e Insights
Responsável por gerar insights automáticos e planos de ação semanais.
"""

from ..utils.formatters import formatar_minutos_para_texto


def gerar_plano_acao_semanal(metricas_gerais, metricas_colaborador, motivos):
    """Gera plano de ação semanal baseado nas métricas calculadas.
    
    Analisa 5 dimensões: Rechamadas, Tempo de Espera, Motivos,
    NPS e Carga da Equipe. Classifica cada item como CRÍTICO, ALERTA ou OPORTUNIDADE.
    
    Returns:
        Lista de ações priorizadas com área, status, métricas e metas.
    """
    plano = []

    # 1. Análise de Rechamadas (Taxa de Retrabalho)
    taxa_rechamadas = metricas_gerais.get('taxa_rechamadas', 0)
    if taxa_rechamadas > 25:
        plano.append({
            "area": "Qualidade",
            "status": "CRÍTICO",
            "metricas": f"Taxa de Rechamadas: {taxa_rechamadas}%",
            "acao": "Realizar auditoria em tickets duplicados e reforçar treinamento de resolução no primeiro contato (FCR).",
            "meta_semana": "Reduzir rechamadas para abaixo de 20%"
        })
    elif taxa_rechamadas > 15:
        plano.append({
            "area": "Qualidade",
            "status": "ATENÇÃO",
            "metricas": f"Taxa de Rechamadas: {taxa_rechamadas}%",
            "acao": "Monitorar casos de rechamada para identificar dúvidas recorrentes da equipe.",
            "meta_semana": "Reduzir rechamadas para abaixo de 15%"
        })

    # 2. Análise de Tempo de Espera
    tme = metricas_gerais.get('tempo_medio_espera')
    if tme and tme > 60:
        plano.append({
            "area": "Operacional",
            "status": "CRÍTICO",
            "metricas": f"Tempo Médio de Espera: {formatar_minutos_para_texto(tme)}",
            "acao": "Revisar escala de horários de pico e considerar transbordo ou plantão.",
            "meta_semana": "Reduzir espera média para 30m"
        })

    # 3. Análise de Motivos (Top ofensores)
    if motivos and motivos.get('top_10_motivos'):
        top1 = motivos['top_10_motivos'][0]
        plano.append({
            "area": "Processos/Produto",
            "status": "OPORTUNIDADE",
            "metricas": f"Top Motivo: {top1['motivo']} ({top1['percentual']}%)",
            "acao": f"Criar ou atualizar material de autoajuda (FAQ/Artigo) específico sobre '{top1['motivo']}'.",
            "meta_semana": "Reduzir incidência deste motivo em 5%"
        })

    # 4. Análise de NPS
    nps = metricas_gerais.get('nps_medio')
    if nps and nps < 75:
        plano.append({
            "area": "Satisfação",
            "status": "ALERTA",
            "metricas": f"NPS Atual: {nps}",
            "acao": "Contatar detratores da semana para entender insatisfação e reverter quadro.",
            "meta_semana": "Elevar NPS para zona de qualidade"
        })

    # 5. Análise de Carga da Equipe (desbalanceamento)
    if metricas_colaborador:
        cargas = [c['percentual_participacao'] for c in metricas_colaborador]
        max_carga = max(cargas)
        min_carga = min(cargas)
        if (max_carga - min_carga) > 20:
            plano.append({
                "area": "Gestão de Equipe",
                "status": "ALERTA",
                "metricas": f"Desbalanceamento: Max {max_carga}% vs Min {min_carga}%",
                "acao": "Redistribuir tickets ou ajustar pausas para equilibrar demanda entre agentes.",
                "meta_semana": "Equiparar carga de trabalho"
            })

    return plano


def gerar_insights(metricas_gerais, metricas_colaborador, motivos,
                   outliers_tma=None, casos_longos=None, correlacao_nps=None):
    """Gera insights automáticos detalhados e acionáveis.
    
    Analisa múltiplas dimensões dos dados para produzir alertas,
    recomendações e destaques classificados por severidade.
    
    Tipos: critico, alerta, atencao, destaque, recomendacao.
    
    Returns:
        Lista de insights com tipo, título e mensagem acionável.
    """
    insights = []

    # --- Distribuição de carga ---
    if metricas_colaborador:
        cargas = [(c['colaborador'], c['percentual_participacao']) for c in metricas_colaborador]
        max_ag, max_carga = max(cargas, key=lambda x: x[1])
        min_ag, min_carga = min(cargas, key=lambda x: x[1])
        if max_carga > 30:
            insights.append({
                'tipo': 'alerta',
                'titulo': 'Concentração de Carga de Trabalho',
                'mensagem': (
                    f"{max_ag} concentra {max_carga:.1f}% dos atendimentos, enquanto "
                    f"{min_ag} tem apenas {min_carga:.1f}%. Diferença de "
                    f"{max_carga - min_carga:.1f}pp — redistribuição recomendada."
                )
            })

    # --- NPS baixo ---
    nps = metricas_gerais.get('nps_medio')
    taxa_aval = metricas_gerais.get('taxa_avaliacao', 0)
    pendentes = metricas_gerais.get('avaliacoes_pendentes', 0)
    if nps and nps < 4:
        insights.append({
            'tipo': 'critico',
            'titulo': 'NPS Abaixo do Esperado',
            'mensagem': (
                f"NPS médio de {nps:.2f}/5 indica insatisfação. "
                f"Taxa de resposta é de apenas {taxa_aval:.1f}% ({pendentes} avaliações pendentes). "
                "Aumentar a coleta de feedback e auditar detratores são prioridades imediatas."
            )
        })

    # --- Taxa de rechamadas ---
    taxa_rec = metricas_gerais.get('taxa_rechamadas', 0)
    if taxa_rec > 25:
        insights.append({
            'tipo': 'critico',
            'titulo': 'Alta Taxa de Rechamadas (Retrabalho)',
            'mensagem': (
                f"{taxa_rec:.1f}% dos clientes únicos retornaram mais de uma vez. "
                "Isso indica falha na resolução no primeiro contato (FCR). "
                "Recomenda-se auditoria nos tickets duplicados e reforço de treinamento."
            )
        })
    elif taxa_rec > 15:
        insights.append({
            'tipo': 'atencao',
            'titulo': 'Taxa de Rechamadas Elevada',
            'mensagem': (
                f"{taxa_rec:.1f}% dos clientes retornaram. "
                "Monitorar casos de rechamada para identificar dúvidas recorrentes."
            )
        })

    # --- Motivo predominante ---
    if motivos and motivos.get('motivo_mais_comum'):
        mc = motivos['motivo_mais_comum']
        if mc['percentual'] > 20:
            insights.append({
                'tipo': 'destaque',
                'titulo': 'Motivo Predominante de Contato',
                'mensagem': (
                    f"'{mc['motivo']}' representa {mc['percentual']:.1f}% dos atendimentos "
                    f"({mc['quantidade']} casos). Criar material de autoajuda (FAQ/artigo) "
                    "específico pode reduzir significativamente o volume."
                )
            })

    # --- Categorias com alta incidência ---
    if motivos and motivos.get('categorias'):
        for cat, dados in motivos['categorias'].items():
            if dados['percentual'] > 30:
                insights.append({
                    'tipo': 'recomendacao',
                    'titulo': f'Alta Incidência: {cat}',
                    'mensagem': (
                        f"{dados['percentual']:.1f}% dos atendimentos ({dados['quantidade']} casos) "
                        f"são classificados como '{cat}'. "
                        "Ações preventivas de produto/comunicação podem reduzir este volume."
                    )
                })

    # --- Outliers de TMA ---
    if outliers_tma and outliers_tma.get('total_outliers', 0) > 0:
        ot = outliers_tma
        insights.append({
            'tipo': 'atencao',
            'titulo': 'Outliers de Duração Detectados',
            'mensagem': (
                f"{ot['total_outliers']} atendimentos com duração acima de "
                f"{formatar_minutos_para_texto(ot['limite_superior_minutos'])} "
                f"(limite IQR). Duração média desses outliers: "
                f"{formatar_minutos_para_texto(ot['duracao_media_outliers'])}. "
                "Revisar esses casos para identificar tickets esquecidos ou abertos indevidamente."
            )
        })

    # --- Casos longos ---
    if casos_longos and casos_longos.get('total_casos', 0) > 0:
        cl = casos_longos
        insights.append({
            'tipo': 'critico',
            'titulo': f"Casos com Duração > {cl['limite_horas']}h Dominam o TMA",
            'mensagem': (
                f"{cl['total_casos']} atendimentos com duração superior a {cl['limite_horas']}h "
                f"representam {cl['impacto_percentual_tempo_total']:.1f}% do tempo total da equipe. "
                f"Duração média desses casos: {formatar_minutos_para_texto(cl['duracao_media_minutos'])}. "
                "Esses tickets distorcem o TMA real — considere tratá-los separadamente."
            )
        })

    # --- Correlação NPS × problema ---
    if correlacao_nps and len(correlacao_nps) >= 2:
        melhor = correlacao_nps[0]
        pior = correlacao_nps[-1]
        insights.append({
            'tipo': 'recomendacao',
            'titulo': 'Correlação NPS × Tipo de Problema',
            'mensagem': (
                f"Melhor NPS: '{melhor['finalizacao']}' ({melhor['nps_medio']:.2f}/5 com {melhor['total_avaliacoes']} avaliações). "
                f"Pior NPS: '{pior['finalizacao']}' ({pior['nps_medio']:.2f}/5 com {pior['total_avaliacoes']} avaliações). "
                "Investigar o que diferencia o atendimento nesses dois tipos de problema."
            )
        })

    # --- Tempo de espera ---
    tme = metricas_gerais.get('tempo_medio_espera')
    if tme and tme > 60:
        insights.append({
            'tipo': 'critico',
            'titulo': 'Tempo de Espera Elevado',
            'mensagem': (
                f"TME médio de {formatar_minutos_para_texto(tme)} está muito acima do aceitável. "
                "Revisar escala de atendimento, horários de pico e considerar transbordo automático."
            )
        })

    return insights
