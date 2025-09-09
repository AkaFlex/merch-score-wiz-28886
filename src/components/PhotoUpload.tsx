import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Photo } from '@/pages/Index';

interface PhotoUploadProps {
  onPhotosUpload: (photos: Photo[]) => void;
}

export const PhotoUpload = ({ onPhotosUpload }: PhotoUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    
    const photos: Photo[] = await Promise.all(
      uploadedFiles.map(async (file, index) => {
        return new Promise<Photo>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: `photo-${index}`,
              name: file.name,
              url: e.target?.result as string,
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );
    
    setIsProcessing(false);
    onPhotosUpload(photos);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
          Upload das Fotos de Merchandising
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          Faça o upload de todas as fotos para iniciar o processo de avaliação automática
        </p>
      </div>

      <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-primary" />
            Selecionar Fotos
          </CardTitle>
          <CardDescription>
            Arraste e solte as fotos aqui ou clique para selecionar. Aceita JPG, PNG e WEBP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-primary/2'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Solte as fotos aqui...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">Arraste e solte suas fotos aqui</p>
                <p className="text-muted-foreground">ou clique para selecionar arquivos</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fotos Carregadas ({uploadedFiles.length})</span>
              <Button 
                onClick={processFiles} 
                disabled={isProcessing}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
              >
                {isProcessing ? 'Processando...' : 'Iniciar Avaliação'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing && (
              <div className="mb-4">
                <Progress value={100} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Preparando fotos para avaliação...
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-center mt-2 truncate" title={file.name}>
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};