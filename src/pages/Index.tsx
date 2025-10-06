import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PPTXUpload } from '@/components/PPTXUpload';
import { ExtractedDataView } from '@/components/ExtractedDataView';
import { ExtractedSlideData } from '@/types';

// Re-export types for backwards compatibility
export type { Photo, Promoter } from '@/types';

const Index = () => {
  const [extractedData, setExtractedData] = useState<ExtractedSlideData[]>([]);

  const handleDataExtracted = (data: ExtractedSlideData[]) => {
    setExtractedData(data);
  };

  const handleReset = () => {
    setExtractedData([]);
  };

  const renderContent = () => {
    if (extractedData.length > 0) {
      return <ExtractedDataView data={extractedData} onReset={handleReset} />;
    }
    return <PPTXUpload onDataExtracted={handleDataExtracted} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">
                Processador de Slides de Merchandising
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Faça upload de apresentações PowerPoint e extraia automaticamente os dados de merchandising
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
