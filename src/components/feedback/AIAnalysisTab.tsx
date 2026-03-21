import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collaborator } from '@/types/feedback';
import { useCollaboratorAnalyses, useFeedbackAnalysis } from '@/hooks/useFeedback';
import { AnalysisCard } from './AnalysisCard';
import { FileUploadZone } from './FileUploadZone';
import { 
  Upload, 
  Loader2,
  FileText,
  TrendingUp
} from 'lucide-react';

interface AIAnalysisTabProps {
  collaborator: Collaborator;
}

export function AIAnalysisTab({ collaborator }: AIAnalysisTabProps) {
  const { analyses, loading, fetchAnalyses, deleteAnalysis, deleting } = useCollaboratorAnalyses(collaborator.id);
  const { createAnalysis, analyzing } = useFeedbackAnalysis();
  const [files, setFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    const result = await createAnalysis(collaborator, files);
    if (result) {
      setFiles([]);
      setShowUpload(false);
      fetchAnalyses();
    }
  };

  // Calculate engagement stats
  const engagementStats = {
    positive: analyses.filter(a => a.engagement_level === 'positive').length,
    neutral: analyses.filter(a => a.engagement_level === 'neutral').length,
    negative: analyses.filter(a => a.engagement_level === 'negative').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-foreground">
              {analyses.length}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Análises
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl">
              {engagementStats.positive > engagementStats.negative ? '😀' : 
               engagementStats.negative > engagementStats.positive ? '😠' : '😐'}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Engajamento
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">
              {engagementStats.positive}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Positivos 😀
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-destructive">
              {engagementStats.negative}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Negativos 😠
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Toggle Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="gap-2 bg-gradient-primary hover:opacity-90"
        >
          <Upload className="w-4 h-4" />
          Nova Análise
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                Upload de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                files={files}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={handleRemoveFile}
              />

              {files.length > 0 && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                    disabled={analyzing}
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="gap-2 bg-gradient-primary"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Analisar {files.length} arquivo(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Analyses History */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Histórico de Análises
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : analyses.length === 0 ? (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma análise realizada
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Faça upload de prints de atendimento para gerar a primeira análise de feedback.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AnalysisCard 
                  analysis={analysis} 
                  onDelete={deleteAnalysis}
                  deleting={deleting === analysis.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
