import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DevelopmentPlan, DevelopmentPlanStatus, DevelopmentPlanCategory, DevelopmentPlanPriority, DevelopmentPlanSource } from '@/types/feedback';
import { useToast } from '@/hooks/use-toast';

interface CreatePlanData {
  collaborator_id: string;
  title: string;
  description?: string | null;
  category?: DevelopmentPlanCategory;
  priority?: DevelopmentPlanPriority;
  source?: DevelopmentPlanSource;
  due_date?: string | null;
}

interface UpdatePlanData {
  title?: string;
  description?: string | null;
  category?: DevelopmentPlanCategory;
  status?: DevelopmentPlanStatus;
  priority?: DevelopmentPlanPriority;
  due_date?: string | null;
  completed_at?: string | null;
}

export function useDevelopmentPlans(collaboratorId: string | null) {
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    if (!collaboratorId) { setPlans([]); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('development_plans')
        .select('*')
        .eq('collaborator_id', collaboratorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlans((data || []) as DevelopmentPlan[]);
    } catch (error) {
      console.error('Error fetching development plans:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar plano de desenvolvimento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [collaboratorId, toast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const addPlan = async (data: CreatePlanData): Promise<DevelopmentPlan | null> => {
    try {
      const { data: newPlan, error } = await supabase
        .from('development_plans')
        .insert({
          collaborator_id: data.collaborator_id,
          title: data.title,
          description: data.description || null,
          category: data.category || 'other',
          priority: data.priority || 'medium',
          source: data.source || 'manual',
          due_date: data.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      const typed = newPlan as DevelopmentPlan;
      setPlans(prev => [typed, ...prev]);
      toast({ title: 'Sucesso', description: 'Ação adicionada ao PDI' });
      return typed;
    } catch (error) {
      console.error('Error adding development plan:', error);
      toast({ title: 'Erro', description: 'Falha ao adicionar ação', variant: 'destructive' });
      return null;
    }
  };

  const updatePlan = async (id: string, data: UpdatePlanData): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === 'completed' && !data.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from('development_plans').update(updateData).eq('id', id);
      if (error) throw error;
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updateData } as DevelopmentPlan : p));
      toast({ title: 'Atualizado', description: 'Ação atualizada com sucesso' });
      return true;
    } catch (error) {
      console.error('Error updating development plan:', error);
      toast({ title: 'Erro', description: 'Falha ao atualizar ação', variant: 'destructive' });
      return false;
    }
  };

  const deletePlan = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('development_plans').delete().eq('id', id);
      if (error) throw error;
      setPlans(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Removido', description: 'Ação removida do PDI' });
      return true;
    } catch (error) {
      console.error('Error deleting development plan:', error);
      toast({ title: 'Erro', description: 'Falha ao remover ação', variant: 'destructive' });
      return false;
    }
  };

  const stats = {
    total: plans.length,
    inProgress: plans.filter(p => p.status === 'in_progress').length,
    completed: plans.filter(p => p.status === 'completed').length,
    cancelled: plans.filter(p => p.status === 'cancelled').length,
    aiRecommended: plans.filter(p => p.source === 'ai_recommendation').length,
  };

  return { plans, loading, stats, fetchPlans, addPlan, updatePlan, deletePlan };
}
