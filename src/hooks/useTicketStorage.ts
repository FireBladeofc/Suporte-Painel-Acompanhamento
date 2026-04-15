import { useCallback, useEffect, useState } from 'react';
import { SupportTicket } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  /** Indica se está sincronizando com o Supabase */
  isSyncing: boolean;
  /** Indica se os dados atuais vieram da nuvem */
  isCloudSynced: boolean;
  /** Salva novos tickets (chamado após upload da planilha) */
  persistTickets: (tickets: SupportTicket[], filename: string) => Promise<boolean>;
  /** Limpa os dados persistidos */
  clearTickets: () => Promise<void>;
}

/**
 * Hook que gerencia tickets com persistência via IndexedDB e Supabase.
 */
export function useTicketStorage(): TicketStorageState {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [lastImportedAt, setLastImportedAt] = useState<Date | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const { toast } = useToast();

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

        if (remoteError) {
          // Tabela não existe no Supabase (migration não aplicada)
          if (remoteError.code === '42P01' || remoteError.message?.includes('does not exist')) {
            console.error(
              '[useTicketStorage] ❌ TABELA ticket_imports NÃO EXISTE NO SUPABASE.\n' +
              'Execute o script SQL de correção no Supabase Dashboard > SQL Editor.\n' +
              'Arquivo: supabase/migrations/20260403193000_create_ticket_imports.sql'
            );
          } else {
            console.warn('[useTicketStorage] Erro ao buscar do Supabase:', remoteError.code, remoteError.message);
          }
        }

        if (!cancelled && remoteImport) {
          const rawTickets = remoteImport.tickets as any[];
          const restored = rawTickets.map((t: any) => ({
            ...t,
            data_abertura: new Date(t.data_abertura),
            data_finalizacao: new Date(t.data_finalizacao),
          })) as SupportTicket[];

          setTickets(restored);
          setLastFilename(remoteImport.filename);
          setLastImportedAt(new Date(remoteImport.imported_at));
          setIsCloudSynced(true);
          setIsLoadingStorage(false);
          return;
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
          setIsCloudSynced(false);
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
    setIsSyncing(true);
    
    try {
      // 1. Salva no IndexedDB (cache local imediato)
      await saveToDB(newTickets, filename);
      
      // Atualiza estado local imediatamente para fluidez da UI
      setTickets(newTickets);
      setLastFilename(filename);
      const now = new Date();
      setLastImportedAt(now);

      // 2. Salva no Supabase (compartilhamento global)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado para sincronizar.');

      const { error } = await supabase.from('ticket_imports').insert({
        filename,
        tickets: newTickets as any,
        ticket_count: newTickets.length,
        imported_by: user.id,
        is_active: true
      });

      if (error) {
        console.error('[useTicketStorage] Erro Supabase:', error);
        
        // Se for erro de payload muito grande
        if (error.message?.includes('payload too large') || error.code === '413') {
          toast({
            title: 'Planilha muito grande',
            description: 'Os dados foram salvos APENAS no seu navegador. Outros usuários não verão este painel.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro na Sincronização',
            description: 'Dados salvos localmente, mas a sincronização com a nuvem falhou.',
            variant: 'destructive',
          });
        }
        setIsCloudSynced(false);
        return false;
      }

      toast({
        title: 'Sincronização Concluída',
        description: 'Os dados foram salvos e estão disponíveis para todos os usuários.',
      });
      
      setIsCloudSynced(true);
      return true;

    } catch (err) {
      console.error('[useTicketStorage] Erro fatal na persistência:', err);
      toast({
        title: 'Erro de Persistência',
        description: 'Ocorreu um erro ao salvar os dados.',
        variant: 'destructive',
      });
      setIsCloudSynced(false);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);

  const clearTickets = useCallback(async () => {
    setTickets([]);
    setLastFilename(null);
    setLastImportedAt(null);
    setIsCloudSynced(false);

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
    isSyncing,
    isCloudSynced,
    persistTickets,
    clearTickets,
  };
}
