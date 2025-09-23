import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFileValidation } from '@/hooks/useFileValidation';
import { toast } from 'sonner';
import type { Photo } from '@/pages/Index';

interface PhotoUploadProps {
  onPhotosUpload: (photos: Photo[]) => void;
  initialPhotos?: Photo[];
  onPhotosUpdate?: (photos: Photo[]) => void;
}

export const PhotoUpload = ({ onPhotosUpload, initialPhotos = [], onPhotosUpdate }: PhotoUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>(initialPhotos);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { validateFiles, isValidating } = useFileValidation({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFiles: 1000 // Increased for large batches
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    try {
      const { validFiles, errors } = await validateFiles(acceptedFiles);
      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
      }
    } catch (error) {
      setError('Erro ao validar arquivos. Tente novamente.');
      console.error('File validation error:', error);
    }
  }, [validateFiles]);

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

  const removePhoto = (photoId: string) => {
    const updatedPhotos = uploadedPhotos.filter(photo => photo.id !== photoId);
    setUploadedPhotos(updatedPhotos);
    onPhotosUpdate?.(updatedPhotos);
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    
    try {
      const newPhotos: Photo[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const progress = ((i + 1) / uploadedFiles.length) * 100;
        setProcessingProgress(progress);
        
        const photo = await new Promise<Photo>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve({
                id: `photo-${Date.now()}-${i}`,
                name: file.name,
                url: e.target.result as string,
              });
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });
        
        newPhotos.push(photo);
      }
      
      const allPhotos = [...uploadedPhotos, ...newPhotos];
      setUploadedPhotos(allPhotos);
      setUploadedFiles([]);
      onPhotosUpload(allPhotos);
      toast.success(`${newPhotos.length} foto(s) processada(s) com sucesso`);
      
    } catch (error) {
      setError('Erro ao processar arquivos. Tente novamente.');
      console.error('File processing error:', error);
      toast.error('Erro ao processar arquivos');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
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
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-border hover:border-primary/50 hover:bg-primary/2'
            } ${isValidating ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            {isValidating ? (
              <p className="text-lg font-medium text-primary">Validando arquivos...</p>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-primary">Solte as fotos aqui...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">Arraste e solte suas fotos aqui</p>
                <p className="text-muted-foreground">ou clique para selecionar arquivos</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Máx. 1000 fotos, 10MB cada • JPG, PNG, WEBP
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {(uploadedFiles.length > 0 || uploadedPhotos.length > 0) && (
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Fotos {uploadedPhotos.length > 0 && 'Processadas'} 
                ({uploadedPhotos.length + uploadedFiles.length})
                {uploadedFiles.length > 0 && ` • ${uploadedFiles.length} novas`}
              </span>
              {uploadedFiles.length > 0 && (
                <Button 
                  onClick={processFiles} 
                  disabled={isProcessing || isValidating}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
                >
                  {isProcessing ? `Processando... ${Math.round(processingProgress)}%` : 
                   isValidating ? 'Validando...' :
                   uploadedPhotos.length > 0 ? 'Adicionar Fotos' : 'Iniciar Avaliação'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing && (
              <div className="mb-4">
                <Progress value={processingProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Processando fotos... {Math.round(processingProgress)}%
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Fotos já processadas */}
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-success group-hover:border-primary/50 transition-all">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <div className="absolute top-2 left-2 p-1 bg-success text-success-foreground rounded-full">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-center mt-2 truncate" title={photo.name}>
                    {photo.name}
                  </p>
                </div>
              ))}
              
              {/* Novos arquivos para processar */}
              {uploadedFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
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