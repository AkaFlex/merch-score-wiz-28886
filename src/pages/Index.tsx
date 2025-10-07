import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PPTXUpload } from '@/components/PPTXUpload';
import { ExtractedDataView } from '@/components/ExtractedDataView';
import { PhotoEvaluation } from '@/components/PhotoEvaluation';
import { EvaluationReport } from '@/components/EvaluationReport';
import { ExtractedSlideData, Photo } from '@/types';

// Re-export types for backwards compatibility
export type { Photo, Promoter } from '@/types';

type ViewMode = 'upload' | 'data' | 'evaluation' | 'report';

const Index = () => {
  const [extractedData, setExtractedData] = useState<ExtractedSlideData[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('upload');

  const handleDataExtracted = (data: ExtractedSlideData[]) => {
    setExtractedData(data);
    setViewMode('data');
  };

  const handleStartEvaluation = (photosToEvaluate: Photo[]) => {
    setPhotos(photosToEvaluate);
    setViewMode('evaluation');
  };

  const handleEvaluationComplete = (evaluatedPhotos: Photo[]) => {
    setPhotos(evaluatedPhotos);
    setViewMode('report');
  };

  const handlePhotosUpdate = (updatedPhotos: Photo[]) => {
    setPhotos(updatedPhotos);
  };

  const handleReset = () => {
    setExtractedData([]);
    setPhotos([]);
    setViewMode('upload');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'data':
        return (
          <ExtractedDataView 
            data={extractedData} 
            onReset={handleReset}
            onStartEvaluation={handleStartEvaluation}
          />
        );
      case 'evaluation':
        return (
          <PhotoEvaluation
            photos={photos}
            onComplete={handleEvaluationComplete}
            onPhotosUpdate={handlePhotosUpdate}
          />
        );
      case 'report':
        return <EvaluationReport photos={photos} onReset={handleReset} />;
      default:
        return <PPTXUpload onDataExtracted={handleDataExtracted} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                Sistema de Avaliação de Merchandising
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {viewMode === 'upload' && 'Faça upload de apresentações PowerPoint e extraia automaticamente os dados'}
              {viewMode === 'data' && 'Visualize os dados extraídos e inicie a avaliação das fotos'}
              {viewMode === 'evaluation' && 'Avalie as fotos de merchandising aplicando critérios de qualidade'}
              {viewMode === 'report' && 'Relatório completo com todas as avaliações e estatísticas'}
            </p>
          </div>

          {/* Main Content */}
          <div className="animate-fade-in">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
