import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, X, Image, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { convertPdfToImages } from '@/lib/pdfToImages';

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB to allow larger PDFs
const MAX_FILES = 50; // Increased to allow PDF conversion (1 PDF can generate many pages)

interface FileUploadZoneProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
}

export function FileUploadZone({ files, onFilesSelected, onRemoveFile }: FileUploadZoneProps) {
  const { toast } = useToast();
  const [converting, setConverting] = useState(false);

  const processFiles = useCallback(
    async (acceptedFiles: File[]) => {
      const imageFiles: File[] = [];
      const pdfFiles: File[] = [];

      // Separate images from PDFs
      for (const file of acceptedFiles) {
        if (file.type === 'application/pdf') {
          pdfFiles.push(file);
        } else {
          imageFiles.push(file);
        }
      }

      // Convert each PDF to images
      if (pdfFiles.length > 0) {
        setConverting(true);
        toast({
          title: 'Convertendo PDF...',
          description: `Convertendo ${pdfFiles.length} PDF(s) para imagens.`,
        });

        try {
          for (const pdf of pdfFiles) {
            const pages = await convertPdfToImages(pdf, 50);
            imageFiles.push(...pages);
          }
          toast({
            title: 'Conversão concluída',
            description: `${imageFiles.length} imagem(ns) pronta(s) para análise.`,
          });
        } catch (err) {
          console.error('PDF conversion error:', err);
          toast({
            title: 'Erro ao converter PDF',
            description: 'Não foi possível processar o PDF.',
            variant: 'destructive',
          });
          setConverting(false);
          return;
        }
        setConverting(false);
      }

      // Check total file count after conversion
      const totalFiles = files.length + imageFiles.length;
      if (totalFiles > MAX_FILES) {
        toast({
          title: 'Limite excedido',
          description: `Máximo de ${MAX_FILES} arquivos permitidos. Você tem ${files.length} arquivo(s) e está tentando adicionar ${imageFiles.length}.`,
          variant: 'destructive',
        });
        return;
      }

      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    },
    [files.length, onFilesSelected, toast]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles);
    },
    [processFiles]
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      fileRejections.forEach((rejection) => {
        const errorMessages = rejection.errors.map((e) => {
          if (e.code === 'file-too-large') {
            return 'Arquivo muito grande (máx. 50MB)';
          }
          if (e.code === 'file-invalid-type') {
            return 'Tipo de arquivo não suportado';
          }
          return e.message;
        });

        toast({
          title: 'Arquivo rejeitado',
          description: `${rejection.file.name}: ${errorMessages.join(', ')}`,
          variant: 'destructive',
        });
      });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    disabled: converting,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-orange-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          converting && "pointer-events-none opacity-60",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "p-3 rounded-full transition-colors",
              isDragActive ? "bg-primary/20" : "bg-muted"
            )}
          >
            {converting ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <Upload
                className={cn(
                  "w-6 h-6",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {converting
                ? 'Convertendo PDF...'
                : isDragActive
                  ? 'Solte os arquivos aqui'
                  : 'Arraste e solte prints ou PDFs aqui'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {converting
                ? 'Aguarde enquanto as páginas são extraídas'
                : 'PNG, JPG, WebP, GIF ou PDF (convertido para imagens)'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {files.length} arquivo(s) selecionado(s)
          </p>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
