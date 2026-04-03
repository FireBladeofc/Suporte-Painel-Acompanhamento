#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Módulo de Formatação e Conversão de Dados
Responsável por transformações de tempo e formatação de saída.
"""

import pandas as pd


def converter_tempo_para_minutos(valor):
    """Converte tempo HH:MM para minutos decimais.
    
    Aceita formatos: int/float, string 'HH:MM' ou string numérica.
    Retorna None para valores inválidos ou nulos.
    """
    if pd.isna(valor):
        return None

    # Valor numérico direto (já em minutos)
    if isinstance(valor, (int, float)):
        return float(valor)

    # String no formato HH:MM
    if isinstance(valor, str):
        if ':' in valor:
            try:
                partes = valor.split(':')
                horas = int(partes[0])
                minutos = int(partes[1])
                return horas * 60 + minutos
            except (ValueError, IndexError):
                return None
        # String numérica
        try:
            return float(valor)
        except ValueError:
            return None

    return None


def formatar_minutos_para_texto(minutos):
    """Converte minutos para formato legível (ex: '2h 30m').
    
    Retorna 'N/A' para valores nulos.
    """
    if minutos is None or pd.isna(minutos):
        return "N/A"

    # Arredonda para inteiro para evitar frações confusas
    minutos_int = int(round(minutos))

    horas = minutos_int // 60
    mins = minutos_int % 60

    if horas > 0:
        return f"{horas}h {mins:02d}m"
    return f"{mins}m"
