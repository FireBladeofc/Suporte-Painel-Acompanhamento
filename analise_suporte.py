#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Análise Estratégica de Suporte Técnico
Script otimizado com métricas completas
"""

import pandas as pd
import sys
import io
import json
import glob

# Configura encoding UTF-8 para Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def carregar_planilha(caminho):
    """Carrega planilha Excel"""
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
    """Detecta colunas automaticamente"""
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
        if 'agente' in col_lower or 'colaborador' in col_lower or 'atendente' in col_lower:
            colunas['colaborador'] = col
        elif 'lead' in col_lower or 'cliente' in col_lower or 'client' in col_lower:
            colunas['cliente'] = col
        elif 'duracao' in col_lower or ('tempo' in col_lower and 'espera' not in col_lower):
            colunas['tempo'] = col
        elif 'espera' in col_lower or 'wait' in col_lower:
            colunas['espera'] = col
        elif 'nps' in col_lower or 'avaliacao' in col_lower or 'nota' in col_lower:
            colunas['nps'] = col
        elif 'data' in col_lower or 'date' in col_lower:
            colunas['data'] = col
        elif 'finalizacao' in col_lower or 'motivo' in col_lower:
            colunas['finalizacao'] = col
    
    return colunas


def converter_tempo_para_minutos(valor):
    """Converte tempo HH:MM para minutos"""
    if pd.isna(valor):
        return None
    
    if isinstance(valor, (int, float)):
        return float(valor)
    
    if isinstance(valor, str):
        if ':' in valor:
            try:
                partes = valor.split(':')
                horas = int(partes[0])
                minutos = int(partes[1])
                return horas * 60 + minutos
            except:
                return None
        try:
            return float(valor)
        except:
            return None
    
    return None



def formatar_minutos_para_texto(minutos):
    """Converte minutos para formato legível (e.g., '2h 30m')"""
    if minutos is None or pd.isna(minutos):
        return "N/A"
    
    # Arredonda para inteiro para evitar frações
    minutos_int = int(round(minutos))
    
    horas = minutos_int // 60
    mins = minutos_int % 60
    
    if horas > 0:
        return f"{horas}h {mins:02d}m"
    return f"{mins}m"


def calcular_metricas_gerais(df, colunas):
    """Calcula métricas gerais"""
    col_tempo = colunas['tempo']
    col_espera = colunas['espera']
    col_nps = colunas['nps']
    col_colaborador = colunas['colaborador']
    col_cliente = colunas['cliente']
    col_finalizacao = colunas['finalizacao']
    
    # Tempos de atendimento
    tempos_validos = df[col_tempo].apply(converter_tempo_para_minutos).dropna()
    
    # Tempos de espera
    tempo_espera_medio = None
    if col_espera:
        tempos_espera = df[col_espera].apply(converter_tempo_para_minutos).dropna()
        tempo_espera_medio = round(tempos_espera.mean(), 2) if len(tempos_espera) > 0 else None
    
    # NPS
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
    
    # Finalizações N2
    total_n2 = 0
    if col_finalizacao:
        n2_mask = df[col_finalizacao].astype(str).str.contains('N2|n2|Sup - N2', case=False, na=False)
        total_n2 = n2_mask.sum()
    
    return {
        'total_registros': len(df),
        'contatos_unicos': df[col_cliente].nunique(),
        'tempo_medio_atendimento': round(tempos_validos.mean(), 2) if len(tempos_validos) > 0 else None,
        'tempo_medio_espera': tempo_espera_medio,
        'nps_medio': nps_medio,
        'taxa_rechamadas': taxa_rechamadas,
        'taxa_avaliacao': taxa_avaliacao,
        'avaliacoes_pendentes': avaliacoes_pendentes,
        'total_finalizacoes_n2': int(total_n2),
    }


def calcular_metricas_por_colaborador(df, col_colaborador, col_tempo, col_cliente, col_nps=None):
    """Calcula métricas por colaborador com detalhamento de NPS"""
    metricas = []
    total_atendimentos = len(df)
    
    for colaborador in df[col_colaborador].unique():
        df_colab = df[df[col_colaborador] == colaborador]
        
        tempos = df_colab[col_tempo].apply(converter_tempo_para_minutos).dropna()
        clientes_unicos = df_colab[col_cliente].nunique()
        duplicados = len(df_colab) - clientes_unicos
        
        # Métricas de NPS
        nps_dados = {'media': None, 'total': 0, 'pendentes': 0, 'detratores': 0}
        if col_nps:
            nps_vals = pd.to_numeric(df_colab[col_nps], errors='coerce')
            validos = nps_vals.dropna()
            pendentes = df_colab[col_nps].isna().sum()
            
            nps_dados['total'] = len(validos)
            nps_dados['pendentes'] = int(pendentes)
            if len(validos) > 0:
                nps_dados['media'] = round(validos.mean(), 2)
                nps_dados['detratores'] = len(validos[validos <= 6])
        
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


def analisar_detratores(df, colunas):
    """Analisa notas baixas (<=6) e motivos"""
    col_nps = colunas.get('nps')
    col_finalizacao = colunas.get('finalizacao')
    
    if not col_nps or not col_finalizacao:
        return {}
        
    # Filtra detratores
    nps_vals = pd.to_numeric(df[col_nps], errors='coerce')
    mask_detratores = nps_vals <= 6
    df_detratores = df[mask_detratores].copy()
    
    if len(df_detratores) == 0:
        return {'total': 0, 'motivos': {}}
        
    # Motivos dos detratores
    motivos = df_detratores[col_finalizacao].value_counts().head(5).to_dict()
    
    # Detalhes (amostra)
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
    """Analisa motivos de finalização"""
    if col_finalizacao is None or col_finalizacao not in df.columns:
        return {}
    
    motivos = df[col_finalizacao].dropna()
    if len(motivos) == 0:
        return {}
    
    contagem = motivos.value_counts()
    total = len(motivos)
    
    top_motivos = []
    for motivo, qtd in contagem.head(10).items():
        top_motivos.append({
            'motivo': str(motivo),
            'quantidade': int(qtd),
            'percentual': round((qtd / total) * 100, 2)
        })
    
    # Categorização
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


def gerar_plano_acao_semanal(metricas_gerais, metricas_colaborador, motivos):
    """Gera plano de ação semanal baseado nas métricas"""
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
    if tme and tme > 60: # Maior que 1 hora (exemplo)
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
    if nps and nps < 75: # Exemplo de corte
        plano.append({
            "area": "Satisfação",
            "status": "ALERTA",
            "metricas": f"NPS Atual: {nps}",
            "acao": "Contatar detratores da semana para entender insatisfação e reverter quadro.",
            "meta_semana": "Elevar NPS para zona de qualidade"
        })

    # 5. Análise de Carga da Equipe
    if metricas_colaborador:
        # Verifica desbalanceamento
        cargas = [c['percentual_participacao'] for c in metricas_colaborador]
        max_carga = max(cargas)
        min_carga = min(cargas)
        if (max_carga - min_carga) > 20: # Diferença grande
            plano.append({
                "area": "Gestão de Equipe",
                "status": "ALERTA",
                "metricas": f"Desbalanceamento: Max {max_carga}% vs Min {min_carga}%",
                "acao": "Redistribuir tickets ou ajustar pausas para equilibrar demanda entre agentes.",
                "meta_semana": "Equiparar carga de trabalho"
            })

    return plano


def analisar_outliers_tma(df, colunas):
    """Detecta outliers de duração via IQR e retorna análise detalhada"""
    col_tempo = colunas.get('tempo')
    col_colaborador = colunas.get('colaborador')
    col_finalizacao = colunas.get('finalizacao')
    col_cliente = colunas.get('cliente')

    if not col_tempo:
        return {}

    df2 = df.copy()
    df2['_dur_min'] = df2[col_tempo].apply(converter_tempo_para_minutos)
    df2 = df2.dropna(subset=['_dur_min'])

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

    # Top 5 mais longos
    top5 = []
    cols_top = [c for c in [col_colaborador, '_dur_min', col_finalizacao, col_cliente] if c]
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
    """Correlaciona NPS médio com tipo de finalização (mínimo de avaliações)"""
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
    """Analisa casos com duração acima do limite em horas"""
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

    por_problema = []
    if col_finalizacao and len(casos_longos) > 0:
        contagem = casos_longos[col_finalizacao].value_counts().head(10)
        for motivo, qtd in contagem.items():
            por_problema.append({'finalizacao': str(motivo), 'quantidade': int(qtd)})

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


def gerar_insights(metricas_gerais, metricas_colaborador, motivos,
                   outliers_tma=None, casos_longos=None, correlacao_nps=None):
    """Gera insights automáticos detalhados e acionáveis"""
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
    if nps and nps < 7:
        insights.append({
            'tipo': 'critico',
            'titulo': 'NPS Abaixo do Esperado',
            'mensagem': (
                f"NPS médio de {nps:.2f}/10 indica insatisfação. "
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
                f"Melhor NPS: '{melhor['finalizacao']}' ({melhor['nps_medio']:.2f}/10 com {melhor['total_avaliacoes']} avaliações). "
                f"Pior NPS: '{pior['finalizacao']}' ({pior['nps_medio']:.2f}/10 com {pior['total_avaliacoes']} avaliações). "
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


def salvar_json(dados, caminho):
    """Salva dados em JSON"""
    try:
        def converter_tipos(obj):
            """Converte tipos numpy para tipos Python nativos"""
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


def gerar_relatorio_markdown(dados, caminho):
    """Gera relatório em Markdown detalhado"""
    try:
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write("# Relatório Operacional Detalhado de Suporte\n\n")
            
            # 1. Visão Geral Detalhada
            geral = dados['metricas_gerais']
            f.write("## 1. Visão Geral da Operação\n\n")
            f.write("| Indicador | Resultado |\n")
            f.write("| :--- | :---: |\n")
            f.write(f"| **Volume Total** | {geral['total_registros']:,} |\n")
            f.write(f"| **Clientes Distintos** | {geral['contatos_unicos']:,} |\n")
            f.write(f"| **TMA (Tempo Médio)** | {formatar_minutos_para_texto(geral.get('tempo_medio_atendimento'))} |\n")
            f.write(f"| **TME (Tempo Espera)** | {formatar_minutos_para_texto(geral.get('tempo_medio_espera'))} |\n")
            f.write(f"| **NPS Global** | {geral.get('nps_medio', 'N/A')} |\n")
            f.write(f"| **Total Avaliações** | {geral['total_registros'] - geral['avaliacoes_pendentes']:,} |\n")
            f.write(f"| **Avaliações Pendentes** | {geral['avaliacoes_pendentes']:,} |\n")
            f.write("\n---\n\n")
            
            # 2. Análise Detalhada por Colaborador
            f.write("## 2. Detalhamento por Colaborador\n\n")
            f.write("Analise completa de produtividade e qualidade por agente.\n\n")
            
            f.write("| Colaborador | Vol. | TMA | Aval. Recebidas | Aval. Pendentes | NPS | Detratores |\n")
            f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n")
            
            for c in dados['metricas_colaborador']:
                nps = f"{c['nps_medio']:.1f}" if c['nps_medio'] else "-"
                tma = formatar_minutos_para_texto(c['tempo_medio_minutos'])
                f.write(f"| {c['colaborador']} | {c['total_atendimentos']} | {tma} | {c['avaliacoes_total']} | {c['avaliacoes_pendentes']} | {nps} | {c['detratores']} |\n")
            f.write("\n> **Nota:** TMA = Tempo Médio de Atendimento. Aval. Pendentes indicam oportunidades de pesquisa não respondida.\n\n")
            f.write("---\n\n")
            
            # 3. Raio-X dos Detratores (Notas Baixas)
            detratores = dados.get('analise_detratores', {})
            if detratores and detratores.get('total', 0) > 0:
                f.write(f"## 3. Análise de Insatisfação (Detratores)\n\n")
                f.write(f"Identificamos **{detratores['total']} avaliações baixas** (NPS <= 6). Abaixo, os motivos de finalização mais correntes nesses casos:\n\n")
                
                f.write("| Motivo da Finalização (Casos Críticos) | Ocorrências |\n")
                f.write("| :--- | :---: |\n")
                for motivo, qtd in detratores['motivos_principais'].items():
                    f.write(f"| {motivo} | {qtd} |\n")
                f.write("\n")
                
                f.write("### 🔍 Ação Recomendada para Detratores\n")
                f.write("- **Auditoria:** Revisar os atendimentos listados acima para entender se houve falha de procedimento ou insatisfação com o produto.\n")
                f.write("- **Feedback:** Aplicar feedback individual nos agentes com maior índice de detratores.\n\n")
            else:
                f.write("## 3. Análise de Insatisfação\n\n")
                f.write("✅ **Excelente!** Não foram detectados detratores (NPS <= 6) neste período.\n\n")
            
            f.write("---\n\n")

             # 4. Plano de Ação Semanal (Mantido e Refinado)
            if dados.get('plano_acao_semanal'):
                f.write("## 4. Plano de Ação Estratégico (Semanal)\n\n")
                for acao in dados['plano_acao_semanal']:
                    icon = "🔴" if acao['status'] == "CRÍTICO" else "🟡" if acao['status'] == "ALERTA" else "🔵"
                    f.write(f"### {icon} {acao['area']}\n")
                    f.write(f"- **O que:** {acao['acao']}\n")
                    f.write(f"- **Por que:** {acao['metricas']}\n")
                    f.write(f"- **Meta:** {acao['meta_semana']}\n\n")
            
            # 5. Motivos Gerais
            motivos = dados['motivos_finalizacao']
            if motivos.get('top_10_motivos'):
                f.write("## 5. Top 10 Motivos de Contato (Geral)\n\n")
                f.write("| Rank | Motivo | Volume | Representatividade |\n")
                f.write("| :---: | :--- | :---: | :---: |\n")
                for i, m in enumerate(motivos['top_10_motivos'], 1):
                    f.write(f"| {i}º | {m['motivo']} | {m['quantidade']} | {m['percentual']:.1f}% |\n")
            
        print(f"[OK] Relatório salvo: {caminho}")
    except Exception as e:
        print(f"[ERRO] Falha ao gerar relatório: {e}")


def gerar_walkthrough_analise(dados, caminho):
    """Gera um walkthrough detalhado e explicativo da análise"""
    try:
        with open(caminho, 'w', encoding='utf-8') as f:
            meta = dados['metadata']
            geral = dados['metricas_gerais']
            motivos = dados['motivos_finalizacao']
            detratores = dados.get('analise_detratores')
            
            f.write(f"# 📘 Walkthrough Analítico: {meta['arquivo_origem']}\n\n")
            f.write(f"> **Data da Análise:** {meta['data_analise']}\n\n")
            
            f.write("Este documento apresenta uma análise detalhada dos dados operacionais e de qualidade do suporte técnico.\n\n")
            
            # 1. Saúde Operacional
            f.write("## 1. Saúde Operacional\n\n")
            f.write("Abaixo, detalhamos os principais indicadores de performance (KPIs) da operação neste período:\n\n")
            
            f.write("| Indicador | Definição | Resultado |\n")
            f.write("| :--- | :--- | :---: |\n")
            f.write(f"| **TMA** | Tempo Médio de Atendimento | **{formatar_minutos_para_texto(geral.get('tempo_medio_atendimento'))}** |\n")
            f.write(f"| **TME** | Tempo Médio de Espera | **{formatar_minutos_para_texto(geral.get('tempo_medio_espera'))}** |\n")
            f.write(f"| **Volume** | Total de registros processados | **{geral['total_registros']:,}** |\n")
            f.write(f"| **Rechamadas** | Taxa estimada de retrabalho | **{geral['taxa_rechamadas']:.2f}%** |\n")
            f.write("\n")
            
            # Análise TMA/TME
            f.write("### ⏱️ Análise de Tempos\n")
            tme = geral.get('tempo_medio_espera')
            if tme and tme > 60:
                f.write(f"- ⚠️ **Atenção:** O TME de {formatar_minutos_para_texto(tme)} está elevado. Verifique se há picos de demanda ou falta de agentes.\n")
            else:
                f.write(f"- ✅ O TME está dentro de parâmetros aceitáveis.\n")
            f.write("\n")

            # 2. Qualidade e Satisfação (NPS)
            f.write("## 2. Qualidade Percebida (NPS)\n\n")
            nps = geral.get('nps_medio')
            f.write(f"O **NPS Médio** do período foi de **{nps if nps else 'N/A'}**.\n\n")
            
            f.write("| Métrica | Valor |\n")
            f.write("| :--- | :---: |\n")
            f.write(f"| Taxa de Resposta | {geral['taxa_avaliacao']:.1f}% ({geral['total_registros'] - geral['avaliacoes_pendentes']} avaliações) |\n")
            f.write(f"| Pendentes | {geral['avaliacoes_pendentes']} oportunidades de feedback não capturadas |\n")
            f.write("\n")
            
            # Detratores
            if detratores and detratores['total'] > 0:
                f.write(f"### 🔻 Análise de Detratores (NPS <= 6)\n")
                f.write(f"Foram identificados **{detratores['total']} clientes insatisfeitos**. Os principais motivos atrelados a essas notas foram:\n\n")
                for m, q in detratores['motivos_principais'].items():
                    f.write(f"- **{m}**: {q} ocorrências\n")
                f.write("\n> 💡 **Ação:** Auditar estes atendimentos para identificar falhas de processo ou produto.\n")
            else:
                f.write("### ✅ Nenhum detrator identificado neste período!\n")
            f.write("\n")
            
            # 3. Performance Individual
            f.write("## 3. Performance da Equipe\n\n")
            f.write("Comparativo detalhado entre os colaboradores:\n\n")
            f.write("| Agente | Vol. | TMA | NPS | Detratores | Pendentes |\n")
            f.write("| :--- | :---: | :---: | :---: | :---: | :---: |\n")
            for c in dados['metricas_colaborador']:
                nps_c = f"{c['nps_medio']:.1f}" if c['nps_medio'] else "-"
                tma_c = formatar_minutos_para_texto(c['tempo_medio_minutos'])
                f.write(f"| **{c['colaborador']}** | {c['total_atendimentos']} | {tma_c} | **{nps_c}** | {c['detratores']} | {c['avaliacoes_pendentes']} |\n")
            f.write("\n")

            # 4. Análise de TMA Detalhada
            outliers = dados.get('analise_tma_detalhada', {})
            if outliers:
                f.write("## 4. ⏱️ Análise Detalhada de TMA\n\n")
                if outliers.get('estatisticas_por_agente'):
                    f.write("### Estatísticas de TMA por Agente\n\n")
                    f.write("| Agente | Atendimentos | TMA (min) | Máximo (min) | Desvio Padrão |\n")
                    f.write("| :--- | :---: | :---: | :---: | :---: |\n")
                    for ag in outliers['estatisticas_por_agente']:
                        f.write(f"| {ag['agente']} | {ag['total_atendimentos']} | {ag['tma_minutos']} | {ag['maximo_minutos']} | {ag['desvio_padrao']} |\n")
                    f.write("\n")
                f.write(f"### ⚠️ Outliers de Duração\n\n")
                f.write(f"- **{outliers.get('total_outliers', 0)} atendimentos** com duração acima do normal (>{formatar_minutos_para_texto(outliers.get('limite_superior_minutos', 0))})\n")
                f.write(f"- **Duração média dos outliers:** {formatar_minutos_para_texto(outliers.get('duracao_media_outliers', 0))}\n\n")
                if outliers.get('top5_mais_longos'):
                    f.write("### 🔝 Top 5 atendimentos mais longos\n\n")
                    f.write("| Agente | Duração (min) | Finalização | Lead Number |\n")
                    f.write("| :--- | :---: | :--- | :--- |\n")
                    for t in outliers['top5_mais_longos']:
                        f.write(f"| {t.get('agente','-')} | {t.get('duracao_minutos','-')} | {t.get('finalizacao','-')} | {t.get('lead_number','-')} |\n")
                    f.write("\n")

            # 5. Correlação NPS × Problema
            correlacao = dados.get('correlacao_nps_problema', [])
            if correlacao:
                f.write("## 5. 📊 Correlação NPS × Tipo de Problema\n\n")
                f.write("| Finalização | Total Avaliações | NPS Médio |\n")
                f.write("| :--- | :---: | :---: |\n")
                for item in correlacao:
                    f.write(f"| {item['finalizacao']} | {item['total_avaliacoes']} | {item['nps_medio']:.2f} |\n")
                f.write("\n")

            # 6. Casos Longos
            cl = dados.get('analise_casos_longos', {})
            if cl and cl.get('total_casos', 0) > 0:
                f.write(f"## 6. 🔍 Casos com Duração > {cl.get('limite_horas',5)}h\n\n")
                f.write(f"- **Total de casos:** {cl['total_casos']}\n")
                f.write(f"- **Duração média:** {formatar_minutos_para_texto(cl['duracao_media_minutos'])}\n")
                f.write(f"- **Impacto na média geral:** {cl['impacto_percentual_tempo_total']:.1f}% do tempo total\n\n")
                if cl.get('por_problema'):
                    f.write("### Distribuição por tipo de problema\n\n")
                    f.write("| Finalização | Quantidade |\n")
                    f.write("| :--- | :---: |\n")
                    for p in cl['por_problema']:
                        f.write(f"| {p['finalizacao']} | {p['quantidade']} |\n")
                    f.write("\n")
                if cl.get('por_agente'):
                    f.write("### Distribuição por agente\n\n")
                    f.write("| Agente | Quantidade |\n")
                    f.write("| :--- | :---: |\n")
                    for a in cl['por_agente']:
                        f.write(f"| {a['agente']} | {a['quantidade']} |\n")
                    f.write("\n")

            # 7. Insights Detalhados
            insights_lista = dados.get('insights', [])
            if insights_lista:
                f.write("## 7. 💡 Insights e Alertas\n\n")
                icon_map = {'critico': '🔴', 'alerta': '🟠', 'atencao': '🟡', 'destaque': '🔵', 'recomendacao': '🟢'}
                for ins in insights_lista:
                    icon = icon_map.get(ins.get('tipo', ''), '⚪')
                    f.write(f"### {icon} {ins['titulo']}\n")
                    f.write(f"{ins['mensagem']}\n\n")

            # 8. Ofensores e Motivos
            f.write("## 8. Principais Motivos de Contato\n\n")
            if motivos.get('top_10_motivos'):
                top1 = motivos['top_10_motivos'][0]
                f.write(f"O principal ofensor foi **{top1['motivo']}**, representando **{top1['percentual']}%** do volume.\n\n")
                f.write("| Rank | Motivo | Volume | Impacto |\n")
                f.write("| :---: | :--- | :---: | :---: |\n")
                for i, m in enumerate(motivos['top_10_motivos'][:5], 1):
                    f.write(f"| {i}º | {m['motivo']} | {m['quantidade']} | {m['percentual']:.1f}% |\n")
            f.write("\n")

            # 9. Plano de Ação
            f.write("## 🚀 Próximos Passos (Plano de Ação)\n\n")
            if dados.get('plano_acao_semanal'):
                for acao in dados['plano_acao_semanal']:
                    status_icon = "🔴" if acao['status'] == "CRÍTICO" else "🟡"
                    f.write(f"### {status_icon} Foco em: {acao['area']}\n")
                    f.write(f"- **Situação Atual:** {acao['metricas']}\n")
                    f.write(f"- **Recomendação:** {acao['acao']}\n")
                    f.write(f"- **Objetivo:** {acao['meta_semana']}\n\n")
            else:
                f.write("Nenhuma ação crítica identificada automaticamente.\n")

        print(f"[OK] Walkthrough salvo: {caminho}")
    except Exception as e:
        print(f"[ERRO] Falha ao gerar walkthrough: {e}")


def analisar_planilha(caminho_arquivo):
    """Função principal de análise"""
    print("\n" + "="*60)
    print(">> INICIANDO ANALISE AVANCADA DE SUPORTE TECNICO")
    print("="*60 + "\n")
    
    # Carrega planilha
    df = carregar_planilha(caminho_arquivo)
    if df is None:
        return None
    
    # Detecta colunas
    print("\n[*] Detectando colunas...")
    colunas = detectar_colunas(df)
    print(f"   Colaborador: {colunas['colaborador']}")
    print(f"   Cliente: {colunas['cliente']}")
    print(f"   Tempo: {colunas['tempo']}")
    print(f"   Espera: {colunas['espera']}")
    print(f"   NPS: {colunas['nps']}")
    print(f"   Finalização: {colunas['finalizacao']}")
    
    # Calcula métricas
    print("\n[*] Calculando métricas operacionais...")
    metricas_gerais = calcular_metricas_gerais(df, colunas)
    metricas_colaborador = calcular_metricas_por_colaborador(df, colunas['colaborador'], colunas['tempo'], colunas['cliente'], col_nps=colunas['nps'])
    
    # Analisa motivos
    print("\n[*] Analisando motivos de finalização...")
    motivos = analisar_motivos_finalizacao(df, colunas['finalizacao'])
    
    # Analisa detratores
    print("\n[*] Analisando detratores (notas baixas)...")
    analise_detratores = analisar_detratores(df, colunas)

    # Análises avançadas
    print("\n[*] Executando análises avançadas...")
    outliers_tma = analisar_outliers_tma(df, colunas)
    correlacao_nps = analisar_correlacao_nps_problema(df, colunas)
    casos_longos = analisar_casos_longos(df, colunas, limite_horas=5)

    # Gera insights e plano de ação
    print("\n[*] Gerando inteligência de dados (insights e plano de ação)...")
    insights = gerar_insights(
        metricas_gerais, metricas_colaborador, motivos,
        outliers_tma=outliers_tma,
        casos_longos=casos_longos,
        correlacao_nps=correlacao_nps
    )
    plano_acao = gerar_plano_acao_semanal(metricas_gerais, metricas_colaborador, motivos)

    # Estrutura JSON aprofundada
    resultado = {
        'metadata': {
            'arquivo_origem': caminho_arquivo,
            'data_analise': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
        },
        'metricas_gerais': metricas_gerais,
        'metricas_colaborador': metricas_colaborador,
        'motivos_finalizacao': motivos,
        'analise_detratores': analise_detratores,
        'analise_tma_detalhada': outliers_tma,
        'correlacao_nps_problema': correlacao_nps,
        'analise_casos_longos': casos_longos,
        'insights': insights,
        'plano_acao_semanal': plano_acao
    }

    print("\n[OK] Análise concluída!")
    print("="*60 + "\n")

    return resultado


if __name__ == "__main__":
    # Detecta arquivo Excel
    if len(sys.argv) > 1:
        CAMINHO_PLANILHA = sys.argv[1]
    else:
        arquivos_excel = glob.glob("*.xlsx")
        
        if not arquivos_excel:
            print("\n[ERRO] Nenhum arquivo .xlsx encontrado!")
            print("Use: python analise_suporte.py <arquivo.xlsx>")
            sys.exit(1)
        elif len(arquivos_excel) == 1:
            CAMINHO_PLANILHA = arquivos_excel[0]
            print(f"\n[*] Arquivo detectado: {CAMINHO_PLANILHA}")
        else:
            print("\n[*] Múltiplos arquivos encontrados:")
            for i, arq in enumerate(arquivos_excel, 1):
                print(f"   {i}. {arq}")
            print("\nUse: python analise_suporte.py <arquivo.xlsx>")
            sys.exit(1)
    
    # Define nomes dos arquivos de saída
    nome_base = CAMINHO_PLANILHA.replace('.xlsx', '').replace('.xls', '')
    caminho_json = f"{nome_base}_resultado.json"
    caminho_walkthrough = f"{nome_base}_walkthrough.md"
    
    # Executa análise
    resultado = analisar_planilha(CAMINHO_PLANILHA)
    
    if resultado:
        # Salva arquivos
        salvar_json(resultado, caminho_json)
        gerar_walkthrough_analise(resultado, caminho_walkthrough)
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {caminho_json} (Dados Brutos)")
        print(f"   📘 {caminho_walkthrough} (Walkthrough Detalhado)")
        print("\n[OK] Processo finalizado com sucesso!")
    else:
        print("\n[ERRO] Falha na análise.")
