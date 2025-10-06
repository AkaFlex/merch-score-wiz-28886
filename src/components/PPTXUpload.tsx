import { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExtractedSlideData } from '@/types';

interface PPTXUploadProps {
  onDataExtracted: (data: ExtractedSlideData[]) => void;
}

export const PPTXUpload = ({ onDataExtracted }: PPTXUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

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

    try {
      console.log('Uploading PPTX file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('process-pptx', {
        body: formData,
      });

      if (error) {
        console.error('Error processing PPTX:', error);
        throw error;
      }

      console.log('PPTX processed successfully:', data);

      if (data.success && data.data) {
        onDataExtracted(data.data);
        toast({
          title: "Processamento concluído",
          description: `${data.totalSlides} slide(s) processado(s) com sucesso`,
        });
      } else {
        throw new Error(data.error || 'Falha ao processar arquivo');
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Processando {fileName}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Extraindo dados dos slides, por favor aguarde
                </p>
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
