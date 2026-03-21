import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CollaboratorFeedbackStats {
  collaboratorId: string;
  analysesCount: number;
  manualFeedbacksCount: number;
  pendingFeedbacksCount: number;
  lastAnalysisDate: string | null;
  lastManualFeedbackDate: string | null;
}

export function useCollaboratorStats(collaboratorIds: string[]) {
  const [stats, setStats] = useState<Map<string, CollaboratorFeedbackStats>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (collaboratorIds.length === 0) {
      setStats(new Map());
      return;
    }

    try {
      setLoading(true);

      // Fetch analyses counts and last dates
      const { data: analysesData, error: analysesError } = await supabase
        .from('feedback_analyses')
        .select('collaborator_id, analysis_date')
        .in('collaborator_id', collaboratorIds);

      if (analysesError) throw analysesError;

      // Fetch manual feedbacks counts and last dates
      const { data: manualData, error: manualError } = await supabase
        .from('manual_feedbacks')
        .select('collaborator_id, feedback_date, status')
        .in('collaborator_id', collaboratorIds);

      if (manualError) throw manualError;

      // Process the data
      const statsMap = new Map<string, CollaboratorFeedbackStats>();

      // Initialize stats for all collaborators
      collaboratorIds.forEach(id => {
        statsMap.set(id, {
          collaboratorId: id,
          analysesCount: 0,
          manualFeedbacksCount: 0,
          pendingFeedbacksCount: 0,
          lastAnalysisDate: null,
          lastManualFeedbackDate: null,
        });
      });

      // Process analyses
      analysesData?.forEach(analysis => {
        const stat = statsMap.get(analysis.collaborator_id);
        if (stat) {
          stat.analysesCount++;
          if (!stat.lastAnalysisDate || analysis.analysis_date > stat.lastAnalysisDate) {
            stat.lastAnalysisDate = analysis.analysis_date;
          }
        }
      });

      // Process manual feedbacks
      manualData?.forEach(feedback => {
        const stat = statsMap.get(feedback.collaborator_id);
        if (stat) {
          stat.manualFeedbacksCount++;
          if (feedback.status === 'pending') {
            stat.pendingFeedbacksCount++;
          }
          if (!stat.lastManualFeedbackDate || feedback.feedback_date > stat.lastManualFeedbackDate) {
            stat.lastManualFeedbackDate = feedback.feedback_date;
          }
        }
      });

      setStats(statsMap);
    } catch (error) {
      console.error('Error fetching collaborator stats:', error);
    } finally {
      setLoading(false);
    }
  }, [collaboratorIds.join(',')]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
