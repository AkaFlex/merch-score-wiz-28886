import { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedSlideData } from '@/types';

interface PPTXUploadProps {
  onDataExtracted: (data: ExtractedSlideData[]) => void;
}

export const PPTXUpload = ({ onDataExtracted }: PPTXUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<{
    status: string;
    totalSlides?: number;
    processedSlides?: number;
    errorMessage?: string;
  } | null>(null);
  const { toast } = useToast();

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-job-status', {
          body: { jobId }
        });

        if (error) throw error;

        if (data.success && data.job) {
          setJobStatus({
            status: data.job.status,
            totalSlides: data.job.totalSlides,
            processedSlides: data.job.processedSlides,
            errorMessage: data.job.errorMessage
          });

          if (data.job.status === 'completed') {
            setIsProcessing(false);
            setJobId(null);
            toast({
              title: "Processamento concluído",
              description: `${data.job.extractedData?.length || 0} slides processados com sucesso`,
            });
            onDataExtracted(data.job.extractedData || []);
          } else if (data.job.status === 'failed') {
            setIsProcessing(false);
            setJobId(null);
            toast({
              title: "Erro no processamento",
              description: data.job.errorMessage || "Erro desconhecido",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, onDataExtracted, toast]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PowerPoint (.pptx)",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setJobStatus(null);

    try {
      console.log('Uploading PPTX file:', file.name);
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const { data, error } = await supabase.functions.invoke('process-pptx', {
        body: {
          fileName: file.name,
          fileSize: file.size,
          fileContent: base64,
        },
      });

      if (error) {
        console.error('Error processing PPTX:', error);
        throw error;
      }

      console.log('Processing response:', data);

      if (data.success && data.jobId) {
        setJobId(data.jobId);
        toast({
          title: "Processamento iniciado",
          description: "O arquivo está sendo processado em background. Aguarde...",
        });
      } else {
        throw new Error(data.error || 'Falha ao iniciar processamento');
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsProcessing(false);
      setFileName('');
    }
  };

  const progress = jobStatus?.totalSlides && jobStatus?.processedSlides
    ? (jobStatus.processedSlides / jobStatus.totalSlides) * 100
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Upload de Apresentação PowerPoint
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {isProcessing ? (
              <div className="space-y-4">
                {jobStatus?.status === 'pending' ? (
                  <>
                    <Clock className="h-12 w-12 mx-auto animate-pulse text-primary" />
                    <p className="text-sm font-medium">Iniciando processamento...</p>
                    <p className="text-xs text-muted-foreground">{fileName}</p>
                  </>
                ) : jobStatus?.status === 'processing' ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-sm font-medium">Processando slides...</p>
                    <p className="text-xs text-muted-foreground">{fileName}</p>
                    {jobStatus.totalSlides && jobStatus.processedSlides !== undefined && (
                      <div className="space-y-2 max-w-md mx-auto">
                        <Progress value={progress} className="w-full" />
                        <p className="text-xs text-muted-foreground">
                          {jobStatus.processedSlides} de {jobStatus.totalSlides} slides processados ({Math.round(progress)}%)
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Processando {fileName}...</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione um arquivo PowerPoint (.pptx) com fotos de merchandising
                </p>
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pptx-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="pptx-upload">
                  <Button asChild disabled={isProcessing}>
                    <span className="cursor-pointer">
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">O sistema irá extrair:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Código Parceiro da Loja</li>
              <li>Nome da Loja</li>
              <li>Colaborador/Promotor</li>
              <li>Superior/Líder</li>
              <li>Data de Envio</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
