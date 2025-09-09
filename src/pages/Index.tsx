import { useState } from 'react';
import { Upload, FileImage, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoEvaluation } from '@/components/PhotoEvaluation';
import { EvaluationReport } from '@/components/EvaluationReport';

export interface Photo {
  id: string;
  name: string;
  url: string;
  evaluation?: {
    score: number;
    criteria: string[];
  };
}

const Index = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'evaluate' | 'report'>('upload');

  const handlePhotosUpload = (uploadedPhotos: Photo[]) => {
    setPhotos(uploadedPhotos);
    setCurrentStep('evaluate');
  };

  const handleEvaluationComplete = (evaluatedPhotos: Photo[]) => {
    setPhotos(evaluatedPhotos);
    setCurrentStep('report');
  };

  const resetProcess = () => {
    setPhotos([]);
    setCurrentStep('upload');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return <PhotoUpload onPhotosUpload={handlePhotosUpload} />;
      case 'evaluate':
        return <PhotoEvaluation photos={photos} onComplete={handleEvaluationComplete} />;
      case 'report':
        return <EvaluationReport photos={photos} onReset={resetProcess} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <FileImage className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Avaliador de Merchandising</h1>
                <p className="text-sm text-muted-foreground">Sistema de Avaliação Automática</p>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 
                photos.length > 0 ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentStep === 'evaluate' ? 'bg-primary text-primary-foreground' : 
                currentStep === 'report' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <BarChart3 className="w-4 h-4" />
                <span>Avaliar</span>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentStep === 'report' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Download className="w-4 h-4" />
                <span>Relatório</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {renderStep()}
      </main>
    </div>
  );
};

export default Index;