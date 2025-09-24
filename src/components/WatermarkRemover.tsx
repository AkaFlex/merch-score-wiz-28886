import { useState } from 'react';
import { Wand2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WatermarkRemoverProps {
  imageUrl: string;
  imageName: string;
  onImageUpdated: (newUrl: string) => void;
}

export const WatermarkRemover = ({ imageUrl, imageName, onImageUpdated }: WatermarkRemoverProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const removeWatermark = async () => {
    setIsProcessing(true);
    toast('Iniciando remoção de marca d\'água...');

    try {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar o contexto do canvas');
      }

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple watermark removal algorithm
      // This removes very light/white areas that are commonly used for watermarks
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Detect light areas (potential watermarks)
        const brightness = (r + g + b) / 3;
        const isLightWatermark = brightness > 200 && a > 100;
        
        if (isLightWatermark) {
          // Try to blend with surrounding pixels
          const neighbors = getNeighborPixels(data, i / 4, canvas.width, canvas.height);
          if (neighbors.length > 0) {
            const avgR = neighbors.reduce((sum, p) => sum + p.r, 0) / neighbors.length;
            const avgG = neighbors.reduce((sum, p) => sum + p.g, 0) / neighbors.length;
            const avgB = neighbors.reduce((sum, p) => sum + p.b, 0) / neighbors.length;
            
            data[i] = avgR;
            data[i + 1] = avgG;
            data[i + 2] = avgB;
          }
        }
      }
      
      // Put processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to blob and create new URL
      canvas.toBlob((blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob);
          onImageUpdated(newUrl);
          toast.success('Marca d\'água removida com sucesso!');
        } else {
          throw new Error('Falha ao processar a imagem');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Erro ao remover marca d\'água:', error);
      toast.error('Erro ao remover marca d\'água. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getNeighborPixels = (data: Uint8ClampedArray, pixelIndex: number, width: number, height: number) => {
    const neighbors = [];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    
    // Check 8 surrounding pixels
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIndex = (ny * width + nx) * 4;
          const r = data[neighborIndex];
          const g = data[neighborIndex + 1];
          const b = data[neighborIndex + 2];
          const brightness = (r + g + b) / 3;
          
          // Only use darker pixels as reference
          if (brightness < 200) {
            neighbors.push({ r, g, b });
          }
        }
      }
    }
    
    return neighbors;
  };

  const downloadProcessedImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `processed_${imageName}`;
    link.click();
  };

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wand2 className="w-4 h-4" />
          Remover Marca d'Água
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={removeWatermark}
          disabled={isProcessing}
          className="w-full"
          size="sm"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Remover Marca d'Água
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={downloadProcessedImage}
          className="w-full"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar Imagem
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          Algoritmo básico que remove áreas claras comuns em marcas d'água
        </div>
      </CardContent>
    </Card>
  );
};