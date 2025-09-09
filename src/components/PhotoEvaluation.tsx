import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Photo } from '@/pages/Index';

interface PhotoEvaluationProps {
  photos: Photo[];
  onComplete: (evaluatedPhotos: Photo[]) => void;
}

const CRITERIA = [
  { name: 'Buraco na Sessão', penalty: 1 },
  { name: 'Agrupamento', penalty: 2 },
  { name: 'Alinhamento', penalty: 2 },
  { name: 'Cores e Padrão da Categoria', penalty: 1 },
  { name: 'Precificação', penalty: 0.5 },
  { name: 'Limpeza', penalty: 0.5 },
  { name: 'Qualidade de Foto', penalty: 0.5 },
  { name: 'Poluição Visual', penalty: 1 },
  { name: 'Posicionamento na Gôndola', penalty: 1 },
  { name: 'Avaria', penalty: 1 },
  { name: 'Espaçamento', penalty: 2 },
  { name: 'Fora de Layout', penalty: 3 },
];

export const PhotoEvaluation = ({ photos, onComplete }: PhotoEvaluationProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [evaluations, setEvaluations] = useState<Record<string, string[]>>({});

  const currentPhoto = photos[currentPhotoIndex];
  const currentCriteria = evaluations[currentPhoto.id] || [];
  const currentScore = 10 - CRITERIA.reduce((total, criterion) => {
    return currentCriteria.includes(criterion.name) ? total + criterion.penalty : total;
  }, 0);

  const evaluatedCount = Object.keys(evaluations).length;
  const progress = (evaluatedCount / photos.length) * 100;

  const toggleCriterion = (criterionName: string) => {
    setEvaluations(prev => {
      const photoId = currentPhoto.id;
      const currentList = prev[photoId] || [];
      const newList = currentList.includes(criterionName)
        ? currentList.filter(c => c !== criterionName)
        : [...currentList, criterionName];
      
      return { ...prev, [photoId]: newList };
    });
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === 'next' && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const resetCurrentEvaluation = () => {
    setEvaluations(prev => {
      const newEvaluations = { ...prev };
      delete newEvaluations[currentPhoto.id];
      return newEvaluations;
    });
  };

  const completeEvaluation = () => {
    const evaluatedPhotos = photos.map(photo => ({
      ...photo,
      evaluation: {
        score: evaluations[photo.id] ? 
          10 - CRITERIA.reduce((total, criterion) => {
            return evaluations[photo.id].includes(criterion.name) ? total + criterion.penalty : total;
          }, 0) : 10,
        criteria: evaluations[photo.id] || []
      }
    }));
    
    onComplete(evaluatedPhotos);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Progress */}
      <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Avaliação de Fotos</CardTitle>
              <CardDescription>
                Foto {currentPhotoIndex + 1} de {photos.length} • {evaluatedCount} avaliadas
              </CardDescription>
            </div>
            <Button 
              onClick={completeEvaluation}
              disabled={evaluatedCount === 0}
              className="bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80"
            >
              <Check className="w-4 h-4 mr-2" />
              Finalizar Avaliação
            </Button>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Display */}
        <Card className="lg:col-span-2 shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                {currentPhoto.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePhoto('prev')}
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Badge variant="secondary" className="px-3 py-1">
                  {currentPhotoIndex + 1}/{photos.length}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePhoto('next')}
                  disabled={currentPhotoIndex === photos.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden border-2 border-border">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.name}
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Panel */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Critérios de Avaliação</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCurrentEvaluation}
                disabled={currentCriteria.length === 0}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center py-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg border border-primary/20">
              <div className="text-3xl font-bold text-primary">{currentScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Pontuação Atual</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {CRITERIA.map((criterion) => {
              const isChecked = currentCriteria.includes(criterion.name);
              return (
                <div 
                  key={criterion.name}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isChecked 
                      ? 'bg-destructive/5 border-destructive/30' 
                      : 'bg-background/50 border-border hover:border-primary/30'
                  }`}
                  onClick={() => toggleCriterion(criterion.name)}
                >
                  <Checkbox
                    id={criterion.name}
                    checked={isChecked}
                    onCheckedChange={() => toggleCriterion(criterion.name)}
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={criterion.name} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {criterion.name}
                    </label>
                    <div className="text-xs text-muted-foreground">
                      -{criterion.penalty} ponto{criterion.penalty !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};