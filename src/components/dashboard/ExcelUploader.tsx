import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useExcelUpload, UploadResult } from '@/hooks/useExcelUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { SupportTicket } from '@/types/support';

interface ExcelUploaderProps {
  onDataLoaded: (tickets: SupportTicket[]) => void;
}

export function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processExcelFile, isLoading, error, progress } = useExcelUpload();
  const [showResult, setShowResult] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - now includes CSV
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      '.xlsx',
      '.xls',
      '.csv'
    ];
    
    const isValidType = validTypes.some(type => 
      file.type === type || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    );

    if (!isValidType) {
      setUploadResult({
        success: false,
        tickets: [],
        rowCount: 0,
        errors: ['Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)']
      });
      setShowResult(true);
      return;
    }

    const result = await processExcelFile(file);
    setUploadResult(result);
    setShowResult(true);

    if (result.success && result.tickets.length > 0) {
      onDataLoaded(result.tickets);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">
              {progress ? `${progress.percent}%` : 'Processando...'}
            </span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Dados</span>
          </>
        )}
      </Button>

      {/* Loading Dialog with Progress */}
      <Dialog open={isLoading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Processando arquivo...
            </DialogTitle>
            <DialogDescription className="text-left">
              <div className="space-y-4 mt-4">
                {progress && (
                  <>
                    <Progress value={progress.percent} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {progress.current.toLocaleString('pt-BR')} de {progress.total.toLocaleString('pt-BR')} registros ({progress.percent}%)
                    </p>
                  </>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Aguarde enquanto processamos os dados...
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResult && !isLoading} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {uploadResult?.success ? (
                <>
                  <Check className="w-5 h-5 text-primary" />
                  Importação Concluída
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Erro na Importação
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-left">
              {uploadResult?.success ? (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {uploadResult.rowCount.toLocaleString('pt-BR')} registros
                      </p>
                      <p className="text-sm text-muted-foreground">
                        importados com sucesso
                      </p>
                    </div>
                  </div>
                  
                  {uploadResult.errors.length > 0 && (
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <p className="text-sm text-warning font-medium mb-1">
                        {uploadResult.errors.length} avisos:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 max-h-20 overflow-y-auto">
                        {uploadResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                        {uploadResult.errors.length > 5 && (
                          <li>... e mais {uploadResult.errors.length - 5} avisos</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <ul className="text-sm text-destructive space-y-1">
                    {uploadResult?.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowResult(false)} variant="default">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
