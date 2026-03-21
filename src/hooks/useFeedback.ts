import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator, FeedbackAnalysis, AnalysisResult } from '@/types/feedback';
import { useToast } from '@/hooks/use-toast';

// File validation constants - Only image formats supported by AI vision models
// (PDF is converted to images in FileUploadZone before reaching here)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (pages from PDF can be large)
const MAX_FILES = 50; // Increased to allow PDF conversion (1 PDF can generate many pages)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCollaborators = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('name');

      if (error) throw error;
      setCollaborators((data as Collaborator[]) || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar colaboradores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = async (name: string, role: 'N1' | 'N2') => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .insert({ name, role })
        .select()
        .single();

      if (error) throw error;
      setCollaborators(prev => [...prev, data as Collaborator]);
      toast({
        title: 'Sucesso',
        description: 'Colaborador adicionado com sucesso',
      });
      return data as Collaborator;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar colaborador',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCollaborator = async (id: string) => {
    try {
      // 1. Get all analysis IDs for this collaborator to cleanup file references
      const { data: analyses, error: analysesQueryError } = await supabase
        .from('feedback_analyses')
        .select('id')
        .eq('collaborator_id', id);

      if (analysesQueryError) throw analysesQueryError;

      const analysisIds = (analyses || []).map(a => a.id);

      // 2. Cleanup analysis files if any analyses exist
      if (analysisIds.length > 0) {
        const { error: filesDeleteError } = await supabase
          .from('analysis_files')
          .delete()
          .in('analysis_id', analysisIds);
        
        if (filesDeleteError) throw filesDeleteError;
      }

      // 3. Delete from all secondary tables that reference collaborator_id
      await supabase.from('feedback_analyses').delete().eq('collaborator_id', id);
      await supabase.from('manual_feedbacks').delete().eq('collaborator_id', id);
      await supabase.from('collaborator_profiles').delete().eq('collaborator_id', id);
      await supabase.from('collaborator_attention_flags').delete().eq('collaborator_id', id);
      await supabase.from('collaborator_warnings').delete().eq('collaborator_id', id);
      await supabase.from('development_plans').delete().eq('collaborator_id', id);

      // 4. Finally, delete the collaborator
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollaborators(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Colaborador e todos os seus dados foram removidos',
      });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover colaborador e dependências',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return { collaborators, loading, fetchCollaborators, addCollaborator, deleteCollaborator };
}

export function useCollaboratorAnalyses(collaboratorId: string | null) {
  const [analyses, setAnalyses] = useState<FeedbackAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalyses = useCallback(async () => {
    if (!collaboratorId) {
      setAnalyses([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feedback_analyses')
        .select('*')
        .eq('collaborator_id', collaboratorId)
        .order('analysis_date', { ascending: false });

      if (error) throw error;
      setAnalyses((data as FeedbackAnalysis[]) || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar análises',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [collaboratorId, toast]);

  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      setDeleting(analysisId);

      // 1. Get file references to delete from storage
      const { data: files, error: filesQueryError } = await supabase
        .from('analysis_files')
        .select('file_path')
        .eq('analysis_id', analysisId);

      if (filesQueryError) {
        console.error('Error fetching analysis files:', filesQueryError);
      }

      // 2. Delete files from storage
      if (files && files.length > 0) {
        // Extract storage paths from signed URLs
        const storagePaths = files.map(f => {
          try {
            const url = new URL(f.file_path);
            // Path format: /storage/v1/object/sign/feedback-files/filename
            const match = url.pathname.match(/\/feedback-files\/([^?]+)/);
            return match ? match[1] : null;
          } catch {
            return null;
          }
        }).filter((p): p is string => p !== null);

        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('feedback-files')
            .remove(storagePaths);

          if (storageError) {
            console.error('Error deleting files from storage:', storageError);
          }
        }
      }

      // 3. Delete file references (cascade should handle this, but explicit is safer)
      const { error: filesDeleteError } = await supabase
        .from('analysis_files')
        .delete()
        .eq('analysis_id', analysisId);

      if (filesDeleteError) {
        console.error('Error deleting analysis files:', filesDeleteError);
        throw filesDeleteError;
      }

      // 4. Delete the analysis
      const { error: deleteError } = await supabase
        .from('feedback_analyses')
        .delete()
        .eq('id', analysisId);

      if (deleteError) {
        console.error('Error deleting analysis:', deleteError);
        throw deleteError;
      }

      // 5. CRITICAL: Refetch to ensure UI is in sync with database
      await fetchAnalyses();

      toast({
        title: 'Análise excluída',
        description: 'A análise e seus arquivos foram removidos.',
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover a análise. Verifique suas permissões.',
        variant: 'destructive',
      });
      // Refetch even on error to ensure consistency
      await fetchAnalyses();
    } finally {
      setDeleting(null);
    }
  }, [toast, fetchAnalyses]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return { analyses, loading, fetchAnalyses, deleteAnalysis, deleting };
}

export function useFeedbackAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const validateFiles = (files: File[]): void => {
    if (files.length > MAX_FILES) {
      throw new Error(`Máximo de ${MAX_FILES} arquivos permitidos`);
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Arquivo ${file.name} excede o limite de 10MB`);
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
      }
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    // Validate files before upload
    validateFiles(files);

    const urls: string[] = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('feedback-files')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Falha ao enviar ${file.name}`);
      }

      // Use signed URLs instead of public URLs for private bucket
      const { data: urlData, error: urlError } = await supabase.storage
        .from('feedback-files')
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      if (urlError || !urlData?.signedUrl) {
        console.error('Signed URL error:', urlError);
        throw new Error(`Falha ao obter URL para ${file.name}`);
      }

      urls.push(urlData.signedUrl);
    }

    return urls;
  };

  const analyzeImages = async (
    imageUrls: string[],
    collaborator: Collaborator
  ): Promise<AnalysisResult> => {
    const response = await supabase.functions.invoke('analyze-feedback', {
      body: {
        images: imageUrls,
        collaboratorName: collaborator.name,
        collaboratorRole: collaborator.role,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Analysis failed');
    }

    if (!response.data.success) {
      throw new Error(response.data.error || 'Analysis failed');
    }

    return response.data.analysis;
  };

  const createAnalysis = async (
    collaborator: Collaborator,
    files: File[]
  ): Promise<FeedbackAnalysis | null> => {
    try {
      setAnalyzing(true);

      toast({
        title: 'Enviando arquivos...',
        description: `Fazendo upload de ${files.length} arquivo(s)`,
      });

      // Upload files to storage
      const imageUrls = await uploadFiles(files);

      toast({
        title: 'Analisando atendimentos...',
        description: 'A IA está processando os prints. Isso pode levar alguns segundos.',
      });

      // Analyze with AI
      const analysis = await analyzeImages(imageUrls, collaborator);

      // Calculate week start (Monday of current week)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Save analysis to database
      const { data: analysisData, error: analysisError } = await supabase
        .from('feedback_analyses')
        .insert({
          collaborator_id: collaborator.id,
          week_start: weekStartStr,
          tone_attendant: analysis.tone_attendant,
          tone_client: analysis.tone_client,
          complaints_count: analysis.complaints_count,
          questions_count: analysis.questions_count,
          processes_executed: analysis.processes_executed,
          resolution_status: analysis.resolution_status,
          summary: analysis.summary,
          insights: analysis.insights,
          feedback: analysis.feedback,
          engagement_level: analysis.engagement_level,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          patterns: analysis.patterns,
          transfer_detected: analysis.transfer_detected,
          transfer_reason: analysis.transfer_reason,
          instance_code_requested: analysis.instance_code_requested,
          client_sentiment_start: analysis.client_sentiment_start,
          client_sentiment_end: analysis.client_sentiment_end,
          robotic_communication: analysis.robotic_communication,
          robotic_communication_details: analysis.robotic_communication_details,
          efficiency_conclusion: analysis.efficiency_conclusion,
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Save file references
      const fileRecords = imageUrls.map((url, index) => ({
        analysis_id: analysisData.id,
        file_path: url,
        file_name: files[index].name,
        file_type: files[index].type,
      }));

      const { error: filesError } = await supabase
        .from('analysis_files')
        .insert(fileRecords);

      if (filesError) {
        console.error('Error saving file references:', filesError);
      }

      toast({
        title: 'Análise concluída!',
        description: 'O feedback foi gerado com sucesso.',
      });

      return analysisData as FeedbackAnalysis;
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast({
        title: 'Erro na análise',
        description: error instanceof Error ? error.message : 'Falha ao processar análise',
        variant: 'destructive',
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  return { createAnalysis, analyzing };
}
