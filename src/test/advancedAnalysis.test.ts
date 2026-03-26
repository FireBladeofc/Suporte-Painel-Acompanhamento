import { describe, it, expect } from "vitest";
import { executarAnaliseAvancada } from "../data/advancedAnalysis";
import { SupportTicket } from "../types/support";

describe("advancedAnalysis - TMA Segregation", () => {
  it("should correctly separate normal TMA from outliers using IQR", () => {
    // Dados controlados: 6 tickets normais (10-15 min) e 1 outlier extremo (1000 min)
    const mockTickets: Partial<SupportTicket>[] = [
      { id: "1", duracao: 10, cliente: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "2", duracao: 12, cliente: "B", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "3", duracao: 11, cliente: "C", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "4", duracao: 13, cliente: "D", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "5", duracao: 15, cliente: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "6", duracao: 14, cliente: "B", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "7", duracao: 1000, cliente: "E", finalizacao: "Resolvido", nps: 5, espera: 1 },
    ];

    // Cálculos esperados:
    // Q1 = 11, Q3 = 14.5, IQR = 3.5. 
    // Limite Superior = 14.5 + (1.5 * 3.5) = 19.75
    // Tickets Normais (<= 19.75): [10, 12, 11, 13, 15, 14] -> Média = 75 / 6 = 12.5
    // Outliers (> 19.75): [1000] -> Média = 1000

    const result = executarAnaliseAvancada(mockTickets as SupportTicket[], []);

    expect(result.metricasGerais.tmaNormal).toBeCloseTo(12.5, 1);
    expect(result.metricasGerais.tmaOutliers).toBe(1000);
    expect(result.outliersTMA.totalOutliers).toBe(1);
  });

  it("should handle empty or zero duration tickets correctly", () => {
    const mockTickets: Partial<SupportTicket>[] = [
      { id: "1", duracao: 0, cliente: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
    ];
    const result = executarAnaliseAvancada(mockTickets as SupportTicket[], []);
    expect(result.metricasGerais.tmaNormal).toBeNull();
    expect(result.metricasGerais.tmaOutliers).toBeNull();
  });
});
