import { useState } from 'react';
import { Upload, FileImage, BarChart3, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoEvaluation } from '@/components/PhotoEvaluation';
import { EvaluationReport } from '@/components/EvaluationReport';
import { PromoterManagement } from '@/components/PromoterManagement';
import { PromoterAssignment } from '@/components/PromoterAssignment';
import { ReportSummary } from '@/components/ReportSummary';

export interface Photo {
  id: string;
  name: string;
  url: string;
  evaluation?: {
    score: number;
    criteria: string[];
  };
  promoter?: string;
}

const Index = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [promoters, setPromoters] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'evaluate' | 'assign' | 'report'>('upload');

  const handlePhotosUpload = (uploadedPhotos: Photo[]) => {
    setPhotos(uploadedPhotos);
    setCurrentStep('evaluate');
  };

  const handlePhotosUpdate = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

  const handleEvaluationComplete = (evaluatedPhotos: Photo[]) => {
    setPhotos(evaluatedPhotos);
    setCurrentStep('assign');
  };

  const handleAssignmentComplete = () => {
    setCurrentStep('report');
  };

  const goToStep = (step: 'upload' | 'evaluate' | 'assign' | 'report') => {
    // Only allow navigation to steps that have been reached
    if (step === 'upload') {
      setCurrentStep(step);
    } else if (step === 'evaluate' && photos.length > 0) {
      setCurrentStep(step);
    } else if (step === 'assign' && photos.length > 0 && photos.some(p => p.evaluation)) {
      setCurrentStep(step);
    } else if (step === 'report' && photos.length > 0 && photos.some(p => p.evaluation)) {
      setCurrentStep(step);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'evaluate':
        setCurrentStep('upload');
        break;
      case 'assign':
        setCurrentStep('evaluate');
        break;
      case 'report':
        setCurrentStep('assign');
        break;
    }
  };

  const resetProcess = () => {
    setPhotos([]);
    setPromoters([]);
    setCurrentStep('upload');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <PhotoUpload 
            onPhotosUpload={handlePhotosUpload}
            initialPhotos={photos}
            onPhotosUpdate={handlePhotosUpdate}
          />
        );
      case 'evaluate':
        return (
          <div className="space-y-6">
            <div className="flex justify-start">
              <Button variant="outline" onClick={goBack}>
                ← Voltar para Upload
              </Button>
            </div>
            <PhotoEvaluation 
              photos={photos} 
              onComplete={handleEvaluationComplete}
              onPhotosUpdate={handlePhotosUpdate}
            />
          </div>
        );
      case 'assign':
        return (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-start">
              <Button variant="outline" onClick={goBack}>
                ← Voltar para Avaliação
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PromoterManagement
                promoters={promoters}
                onPromotersChange={setPromoters}
              />
              <div className="lg:col-span-2">
                <ReportSummary photos={photos} />
              </div>
            </div>
            <PromoterAssignment
              photos={photos}
              promoters={promoters}
              onPhotosUpdate={setPhotos}
            />
            <div className="flex justify-center">
              <Button 
                onClick={handleAssignmentComplete}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
              >
                Gerar Relatório Final
              </Button>
            </div>
          </div>
        );
      case 'report':
        return (
          <div className="space-y-6">
            <div className="flex justify-start">
              <Button variant="outline" onClick={goBack}>
                ← Voltar para Atribuição
              </Button>
            </div>
            <EvaluationReport photos={photos} onReset={resetProcess} />
          </div>
        );
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
              <button
                onClick={() => goToStep('upload')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer hover:scale-105 ${
                  currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 
                  photos.length > 0 ? 'bg-success text-success-foreground hover:bg-success/80' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
              
              <button
                onClick={() => goToStep('evaluate')}
                disabled={photos.length === 0}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  photos.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                  currentStep === 'evaluate' ? 'bg-primary text-primary-foreground' : 
                  ['assign', 'report'].includes(currentStep) ? 'bg-success text-success-foreground hover:bg-success/80 cursor-pointer hover:scale-105' : 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 hover:scale-105'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Avaliar</span>
              </button>

              <button
                onClick={() => goToStep('assign')}
                disabled={!photos.some(p => p.evaluation)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !photos.some(p => p.evaluation) ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                  currentStep === 'assign' ? 'bg-primary text-primary-foreground' : 
                  currentStep === 'report' ? 'bg-success text-success-foreground hover:bg-success/80 cursor-pointer hover:scale-105' : 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 hover:scale-105'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Atribuir</span>
              </button>
              
              <button
                onClick={() => goToStep('report')}
                disabled={!photos.some(p => p.evaluation)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !photos.some(p => p.evaluation) ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                  currentStep === 'report' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 hover:scale-105'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Relatório</span>
              </button>
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