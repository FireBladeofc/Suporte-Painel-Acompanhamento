import { useCallback, useEffect, useState } from 'react';
import { SupportTicket } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';

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
      setIsLoadingStorage(true);
      try {
        // 1. Tenta carregar do Supabase (dados globais compartilhados)
        const { data: remoteImport, error: remoteError } = await supabase
          .from('ticket_imports')
          .select('filename, imported_at, tickets')
          .eq('is_active', true)
          .order('imported_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && remoteImport) {
          // console.log('[useTicketStorage] Carregando dados globais do Supabase');
          const rawTickets = remoteImport.tickets as any[];
          const restored = rawTickets.map((t: any) => ({
            ...t,
            data_abertura: new Date(t.data_abertura),
            data_finalizacao: new Date(t.data_finalizacao),
          })) as SupportTicket[];

          setTickets(restored);
          setLastFilename(remoteImport.filename);
          setLastImportedAt(new Date(remoteImport.imported_at));
          setIsLoadingStorage(false);
          return;
        }

        if (remoteError) {
          console.warn('[useTicketStorage] Erro ao buscar do Supabase:', remoteError);
        }

        // 2. Fallback para IndexedDB (dados locais do navegador)
        const record = await loadFromDB();
        if (!cancelled && record) {
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
        console.warn('[useTicketStorage] Erro ao carregar dados:', err);
      } finally {
        if (!cancelled) setIsLoadingStorage(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const persistTickets = useCallback(async (newTickets: SupportTicket[], filename: string) => {
    setTickets(newTickets);
    setLastFilename(filename);
    const now = new Date();
    setLastImportedAt(now);

    try {
      // 1. Salva no IndexedDB (cache local)
      await saveToDB(newTickets, filename);

      // 2. Salva no Supabase (compartilhamento global)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('ticket_imports').insert({
          filename,
          tickets: newTickets as any,
          ticket_count: newTickets.length,
          imported_by: user.id,
          is_active: true
        });

        if (error) throw error;
      }
    } catch (err) {
      console.warn('[useTicketStorage] Erro ao persistir dados:', err);
    }
  }, []);

  const clearTickets = useCallback(async () => {
    setTickets([]);
    setLastFilename(null);
    setLastImportedAt(null);

    try {
      // 1. Limpa IndexedDB
      await clearDB();

      // 2. Inativa imports no Supabase
      const { error } = await supabase
        .from('ticket_imports')
        .update({ is_active: false })
        .eq('is_active', true);
      
      if (error) console.error('[useTicketStorage] Erro ao inativar no Supabase:', error);
    } catch (err) {
      console.warn('[useTicketStorage] Erro ao limpar dados:', err);
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
