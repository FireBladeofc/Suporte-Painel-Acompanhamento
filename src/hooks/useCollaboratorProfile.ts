 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { 
   CollaboratorProfile, 
   CollaboratorWarning, 
   AttentionFlag,
   WarningType,
   AttentionFlagSeverity,
   AttentionFlagStatus
 } from '@/types/feedback';
 import { useToast } from '@/hooks/use-toast';
 
 export function useCollaboratorProfile(collaboratorId: string) {
   const [profile, setProfile] = useState<CollaboratorProfile | null>(null);
   const [warnings, setWarnings] = useState<CollaboratorWarning[]>([]);
   const [attentionFlags, setAttentionFlags] = useState<AttentionFlag[]>([]);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   const fetchProfile = useCallback(async () => {
     const { data, error } = await supabase
       .from('collaborator_profiles')
       .select('*')
       .eq('collaborator_id', collaboratorId)
       .maybeSingle();
 
     if (error && error.code !== 'PGRST116') {
       console.error('Error fetching profile:', error);
     }
     setProfile(data as CollaboratorProfile | null);
   }, [collaboratorId]);
 
   const fetchWarnings = useCallback(async () => {
     const { data, error } = await supabase
       .from('collaborator_warnings')
       .select('*')
       .eq('collaborator_id', collaboratorId)
       .order('warning_date', { ascending: false });
 
     if (error) {
       console.error('Error fetching warnings:', error);
     } else {
       setWarnings((data || []) as CollaboratorWarning[]);
     }
   }, [collaboratorId]);
 
   const fetchAttentionFlags = useCallback(async () => {
     const { data, error } = await supabase
       .from('collaborator_attention_flags')
       .select('*')
       .eq('collaborator_id', collaboratorId)
       .order('flag_date', { ascending: false });
 
     if (error) {
       console.error('Error fetching attention flags:', error);
     } else {
       setAttentionFlags((data || []) as AttentionFlag[]);
     }
   }, [collaboratorId]);
 
   useEffect(() => {
     const loadData = async () => {
       setLoading(true);
       await Promise.all([fetchProfile(), fetchWarnings(), fetchAttentionFlags()]);
       setLoading(false);
     };
     loadData();
   }, [fetchProfile, fetchWarnings, fetchAttentionFlags]);
 
  const upsertProfile = async (data: Partial<Omit<CollaboratorProfile, 'id' | 'collaborator_id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (profile) {
        const { error } = await supabase
          .from('collaborator_profiles')
          .update(data)
          .eq('id', profile.id);

        if (error) {
          console.error('Error updating profile:', error);
          toast({ title: 'Erro ao atualizar perfil', description: error.message, variant: 'destructive' });
          return false;
        }
      } else {
        const { error } = await supabase
          .from('collaborator_profiles')
          .insert({ collaborator_id: collaboratorId, ...data });

        if (error) {
          console.error('Error creating profile:', error);
          toast({ title: 'Erro ao criar perfil', description: error.message, variant: 'destructive' });
          return false;
        }
      }
      await fetchProfile();
      toast({ title: 'Perfil salvo com sucesso!', description: 'As alterações foram gravadas.' });
      return true;
    } catch (err) {
      console.error('Unexpected error saving profile:', err);
      toast({ title: 'Erro inesperado', description: 'Não foi possível salvar o perfil.', variant: 'destructive' });
      return false;
    }
  };
 
   const addWarning = async (data: { 
     warning_date: string; 
     type: WarningType; 
     reason: string; 
     details?: string 
   }) => {
     const { error } = await supabase
       .from('collaborator_warnings')
       .insert({ collaborator_id: collaboratorId, ...data });
 
     if (error) {
       toast({ title: 'Erro ao adicionar advertência', description: error.message, variant: 'destructive' });
       return false;
     }
     await fetchWarnings();
     toast({ title: 'Advertência registrada com sucesso!' });
     return true;
   };
 
   const deleteWarning = async (warningId: string) => {
     const { error } = await supabase
       .from('collaborator_warnings')
       .delete()
       .eq('id', warningId);
 
     if (error) {
       toast({ title: 'Erro ao excluir advertência', description: error.message, variant: 'destructive' });
       return false;
     }
     await fetchWarnings();
     toast({ title: 'Advertência excluída com sucesso!' });
     return true;
   };
 
   const addAttentionFlag = async (data: { 
     flag_date: string; 
     severity: AttentionFlagSeverity; 
     description: string 
   }) => {
     const { error } = await supabase
       .from('collaborator_attention_flags')
       .insert({ collaborator_id: collaboratorId, ...data });
 
     if (error) {
       toast({ title: 'Erro ao adicionar sinal de atenção', description: error.message, variant: 'destructive' });
       return false;
     }
     await fetchAttentionFlags();
     toast({ title: 'Sinal de atenção registrado com sucesso!' });
     return true;
   };
 
   const updateAttentionFlag = async (flagId: string, data: { 
     status: AttentionFlagStatus; 
     resolution_notes?: string 
   }) => {
     const { error } = await supabase
       .from('collaborator_attention_flags')
       .update(data)
       .eq('id', flagId);
 
     if (error) {
       toast({ title: 'Erro ao atualizar sinal de atenção', description: error.message, variant: 'destructive' });
       return false;
     }
     await fetchAttentionFlags();
     toast({ title: 'Sinal de atenção atualizado!' });
     return true;
   };
 
   const deleteAttentionFlag = async (flagId: string) => {
     const { error } = await supabase
       .from('collaborator_attention_flags')
       .delete()
       .eq('id', flagId);
 
     if (error) {
       toast({ title: 'Erro ao excluir sinal de atenção', description: error.message, variant: 'destructive' });
       return false;
     }
     await fetchAttentionFlags();
     toast({ title: 'Sinal de atenção excluído!' });
     return true;
   };
 
   return {
     profile,
     warnings,
     attentionFlags,
     loading,
     upsertProfile,
     addWarning,
     deleteWarning,
     addAttentionFlag,
     updateAttentionFlag,
     deleteAttentionFlag,
   };
 }