import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useExcelUpload, UploadResult } from '@/hooks/useExcelUpload';

// SEG-008: Limite de tamanho e assinaturas binárias aceitas
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const XLSX_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04 (ZIP/OOXML)
const XLS_MAGIC  = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]); // OLE2 Compound File

/**
 * Lê os primeiros N bytes de um File sem carregar o arquivo inteiro.
 */
async function readMagicBytes(file: File, n = 4): Promise<Uint8Array> {
  const slice = file.slice(0, n);
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Compara dois Uint8Array byte a byte.
 */
function startsWith(data: Uint8Array, signature: Uint8Array): boolean {
  if (data.length < signature.length) return false;
  return signature.every((byte, i) => data[i] === byte);
}

/**
 * Valida tipo e tamanho do arquivo antes do processamento.
 * Retorna string de erro ou null se válido.
 */
async function validateFile(file: File): Promise<string | null> {
  // Validação de tamanho
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `Arquivo muito grande (${sizeMB} MB). O limite é 10 MB.`;
  }

  const nameLower = file.name.toLowerCase();
  const magic = await readMagicBytes(file, 4);

  if (nameLower.endsWith('.xlsx')) {
    if (!startsWith(magic, XLSX_MAGIC)) {
      return 'O arquivo não possui uma assinatura .xlsx válida. Verifique se o arquivo não está corrompido.';
    }
    return null;
  }

  if (nameLower.endsWith('.xls')) {
    if (!startsWith(magic, XLS_MAGIC)) {
      return 'O arquivo não possui uma assinatura .xls válida. Verifique se o arquivo não está corrompido.';
    }
    return null;
  }

  if (nameLower.endsWith('.csv')) {
    // CSV é texto — sem magic bytes fixas; aceito se a extensão for correta
    return null;
  }

  return 'Formato não suportado. Envie arquivos .xlsx, .xls ou .csv.';
}
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
  onDataLoaded: (tickets: SupportTicket[], filename: string) => Promise<void> | void;
}

export function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processExcelFile, isLoading, error, progress } = useExcelUpload();
  const [showResult, setShowResult] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // SEG-008: Validação de tamanho + assinatura binária (magic bytes)
    const validationError = await validateFile(file);
    if (validationError) {
      setUploadResult({
        success: false,
        tickets: [],
        rowCount: 0,
        errors: [validationError],
      });
      setShowResult(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const result = await processExcelFile(file);
    setUploadResult(result);
    setShowResult(true);

    if (result.success && result.tickets.length > 0) {
      await onDataLoaded(result.tickets, file.name);
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
