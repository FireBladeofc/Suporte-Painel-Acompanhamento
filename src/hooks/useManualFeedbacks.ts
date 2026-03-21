import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ManualFeedback, ManualFeedbackStatus, ManualFeedbackCategory } from '@/types/feedback';
import { useToast } from '@/hooks/use-toast';

interface CreateManualFeedbackData {
  collaborator_id: string;
  feedback_date: string;
  status?: ManualFeedbackStatus;
  category?: ManualFeedbackCategory | null;
  observations?: string | null;
}

interface UpdateManualFeedbackData {
  status?: ManualFeedbackStatus;
  category?: ManualFeedbackCategory | null;
  observations?: string | null;
}

export function useManualFeedbacks(collaboratorId: string | null) {
  const [feedbacks, setFeedbacks] = useState<ManualFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFeedbacks = useCallback(async () => {
    if (!collaboratorId) {
      setFeedbacks([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manual_feedbacks')
        .select('*')
        .eq('collaborator_id', collaboratorId)
        .order('feedback_date', { ascending: false });

      if (error) throw error;
      
      // Cast the data to ManualFeedback type
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as ManualFeedbackStatus,
        category: item.category as ManualFeedbackCategory | null,
      })) as ManualFeedback[];
      
      setFeedbacks(typedData);
    } catch (error) {
      console.error('Error fetching manual feedbacks:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar feedbacks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [collaboratorId, toast]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const addFeedback = async (data: CreateManualFeedbackData): Promise<ManualFeedback | null> => {
    try {
      const { data: newFeedback, error } = await supabase
        .from('manual_feedbacks')
        .insert({
          collaborator_id: data.collaborator_id,
          feedback_date: data.feedback_date,
          status: data.status || 'pending',
          category: data.category || null,
          observations: data.observations || null,
        })
        .select()
        .single();

      if (error) throw error;

      const typedFeedback = {
        ...newFeedback,
        status: newFeedback.status as ManualFeedbackStatus,
        category: newFeedback.category as ManualFeedbackCategory | null,
      } as ManualFeedback;

      setFeedbacks(prev => [typedFeedback, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Feedback adicionado',
      });

      return typedFeedback;
    } catch (error) {
      console.error('Error adding manual feedback:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar feedback',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateFeedback = async (id: string, data: UpdateManualFeedbackData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('manual_feedbacks')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setFeedbacks(prev => 
        prev.map(f => f.id === id ? { ...f, ...data } as ManualFeedback : f)
      );

      toast({
        title: 'Atualizado',
        description: 'Feedback atualizado com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Error updating manual feedback:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar feedback',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteFeedback = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('manual_feedbacks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedbacks(prev => prev.filter(f => f.id !== id));

      toast({
        title: 'Removido',
        description: 'Feedback removido com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Error deleting manual feedback:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover feedback',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleStatus = async (id: string): Promise<boolean> => {
    const feedback = feedbacks.find(f => f.id === id);
    if (!feedback) return false;

    const newStatus: ManualFeedbackStatus = 
      feedback.status === 'completed' ? 'pending' : 'completed';

    return updateFeedback(id, { status: newStatus });
  };

  // Stats for the collaborator
  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    completed: feedbacks.filter(f => f.status === 'completed').length,
    cancelled: feedbacks.filter(f => f.status === 'cancelled').length,
  };

  return {
    feedbacks,
    loading,
    stats,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    toggleStatus,
  };
}
