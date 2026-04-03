import { useCallback, useEffect, useState } from 'react';
import { SupportTicket } from '@/types/support';

const DB_NAME = 'painel-suporte-db';
const DB_VERSION = 1;
const STORE_NAME = 'tickets';
const RECORD_KEY = 'last_import';

interface StoredTicketRecord {
  key: string;
  filename: string;
  importedAt: string;
  tickets: SupportTicket[];
}

// Abre (ou cria) o banco IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
  });
}

// Lê o último import salvo
async function loadFromDB(): Promise<StoredTicketRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(RECORD_KEY);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

// Salva tickets no IndexedDB
async function saveToDB(tickets: SupportTicket[], filename: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredTicketRecord = {
      key: RECORD_KEY,
      filename,
      importedAt: new Date().toISOString(),
      tickets,
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Remove os dados salvos (limpar cache)
async function clearDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(RECORD_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export interface TicketStorageState {
  /** Tickets carregados (do IndexedDB ou de novo upload) */
  tickets: SupportTicket[];
  /** Nome do arquivo da última importação */
  lastFilename: string | null;
  /** Data/hora da última importação */
  lastImportedAt: Date | null;
  /** true enquanto o IndexedDB está sendo lido na inicialização */
  isLoadingStorage: boolean;
  /** Salva novos tickets (chamado após upload da planilha) */
  persistTickets: (tickets: SupportTicket[], filename: string) => Promise<void>;
  /** Limpa os dados persistidos */
  clearTickets: () => Promise<void>;
}

/**
 * Hook que gerencia tickets com persistência via IndexedDB.
 * - Ao montar, tenta carregar o último import salvo.
 * - Ao importar nova planilha, substitui o registro salvo.
 * - Ao recarregar a página, os dados voltam automaticamente.
 */
export function useTicketStorage(): TicketStorageState {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [lastImportedAt, setLastImportedAt] = useState<Date | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  // Carrega dados ao iniciar
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const record = await loadFromDB();
        if (!cancelled && record) {
          // Restaura datas que viraram string no JSON
          const restored = record.tickets.map((t) => ({
            ...t,
            data_abertura: new Date(t.data_abertura),
            data_finalizacao: new Date(t.data_finalizacao),
          }));
          setTickets(restored);
          setLastFilename(record.filename);
          setLastImportedAt(new Date(record.importedAt));
        }
      } catch (err) {
        console.warn('[useTicketStorage] Erro ao carregar do IndexedDB:', err);
      } finally {
        if (!cancelled) setIsLoadingStorage(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const persistTickets = useCallback(async (newTickets: SupportTicket[], filename: string) => {
    setTickets(newTickets);
    setLastFilename(filename);
    setLastImportedAt(new Date());

    try {
      await saveToDB(newTickets, filename);
    } catch (err) {
      console.warn('[useTicketStorage] Erro ao salvar no IndexedDB:', err);
    }
  }, []);

  const clearTickets = useCallback(async () => {
    setTickets([]);
    setLastFilename(null);
    setLastImportedAt(null);

    try {
      await clearDB();
    } catch (err) {
      console.warn('[useTicketStorage] Erro ao limpar IndexedDB:', err);
    }
  }, []);

  return {
    tickets,
    lastFilename,
    lastImportedAt,
    isLoadingStorage,
    persistTickets,
    clearTickets,
  };
}
