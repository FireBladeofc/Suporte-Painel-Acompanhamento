import { describe, it, expect } from "vitest";
import { executarAnaliseAvancada } from "../data/advancedAnalysis";
import { SupportTicket } from "../types/support";

describe("advancedAnalysis - TMA Segregation", () => {
  it("should correctly separate normal TMA from outliers using IQR", () => {
    // Dados controlados: 6 tickets normais (10-15 min) e 1 outlier extremo (1000 min)
    const mockTickets: Partial<SupportTicket>[] = [
      { id: "1", duracao: 10, lead_number: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "2", duracao: 12, lead_number: "B", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "3", duracao: 11, lead_number: "C", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "4", duracao: 13, lead_number: "D", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "5", duracao: 15, lead_number: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "6", duracao: 14, lead_number: "B", finalizacao: "Resolvido", nps: 5, espera: 1 },
      { id: "7", duracao: 1000, lead_number: "E", finalizacao: "Resolvido", nps: 5, espera: 1 },
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
      { id: "1", duracao: 0, lead_number: "A", finalizacao: "Resolvido", nps: 5, espera: 1 },
    ];
    const result = executarAnaliseAvancada(mockTickets as SupportTicket[], []);
    expect(result.metricasGerais.tmaNormal).toBeNull();
    expect(result.metricasGerais.tmaOutliers).toBeNull();
  });

  it("should correctly identify leads with risk (TMA + Re-calls)", () => {
    const mockTickets: Partial<SupportTicket>[] = [
      // Tickets normais para estabelecer um limite baixo
      { id: "n1", duracao: 10, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n2", duracao: 12, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n3", duracao: 11, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n4", duracao: 13, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n5", duracao: 15, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n6", duracao: 14, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n7", duracao: 10, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n8", duracao: 12, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n9", duracao: 11, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },
      { id: "n10", duracao: 13, lead_number: "NORM", agente: "Ag1", finalizacao: "OK" },

      // Lead A: 3 contatos, TMA alto (100) -> RISCO (deve estar acima do limite)
      { id: "1", duracao: 100, lead_number: "LEAD_A", agente: "Agente 1", data_finalizacao: new Date("2024-01-01"), finalizacao: "Resolvido" },
      { id: "2", duracao: 100, lead_number: "LEAD_A", agente: "Agente 1", data_finalizacao: new Date("2024-01-02"), finalizacao: "Resolvido" },
      { id: "3", duracao: 100, lead_number: "LEAD_A", agente: "Agente 2", data_finalizacao: new Date("2024-01-03"), finalizacao: "Resolvido" },
    ];

    // O limite IQR aproximado será baixo devido aos tickets do Lead B e Ticket 7 (outlier)
    // No entanto, o importante é que LEAD_A seja detectado como risco e LEAD_B não.
    const result = executarAnaliseAvancada(mockTickets as SupportTicket[], []);

    expect(result.leadsComRisco.total).toBe(1);
    expect(result.leadsComRisco.leads[0].leadNumber).toBe("LEAD_A");
    expect(result.leadsComRisco.leads[0].rechamadas).toBe(2);
    expect(result.leadsComRisco.leads[0].agente).toBe("Agente 2"); // Último agente
  });
});
