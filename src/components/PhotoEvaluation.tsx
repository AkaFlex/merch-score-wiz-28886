import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, RotateCcw, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { KeyboardShortcuts, type ShortcutConfig } from '@/components/KeyboardShortcuts';
import { WatermarkRemover } from '@/components/WatermarkRemover';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Photo } from '@/pages/Index';

interface PhotoEvaluationProps {
  photos: Photo[];
  onComplete: (evaluatedPhotos: Photo[]) => void;
  onPhotosUpdate: (photos: Photo[]) => void;
}

const CRITERIA = [
  { name: 'Buraco na Sessão', penalty: 1 },
  { name: 'Agrupamento', penalty: 2 },
  { name: 'Alinhamento', penalty: 2 },
  { name: 'Cores e Padrão da Categoria', penalty: 1 },
  { name: 'Precificação', penalty: 0.5 },
  { name: 'Limpeza', penalty: 0.5 },
  { name: 'Qualidade de Foto', penalty: 0.5 },
  { name: 'Poluição Visual', penalty: 0.5 },
  { name: 'Posicionamento na Gôndola', penalty: 1 },
  { name: 'Avaria', penalty: 1 },
  { name: 'Espaçamento', penalty: 2 },
  { name: 'Fora de Layout', penalty: 3 },
];

export const PhotoEvaluation = ({ photos, onComplete, onPhotosUpdate }: PhotoEvaluationProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [evaluations, setEvaluations] = useLocalStorage<Record<string, string[]>>('photo-evaluations', {});
  const [currentPage, setCurrentPage] = useState(0);
  const [shortcuts, setShortcuts] = useLocalStorage<ShortcutConfig>('photo-evaluation-shortcuts', {
    nextPhoto: 'ArrowRight',
    prevPhoto: 'ArrowLeft', 
    criterion1: 'Digit1', // Buraco na Sessão
    criterion2: 'Digit2', // Agrupamento
    criterion3: 'Digit3', // Alinhamento
    criterion4: 'Digit4', // Cores e Padrão
    criterion5: 'Digit5', // Precificação
    criterion6: 'Digit6', // Limpeza
    criterion7: 'Digit7', // Qualidade de Foto
    criterion8: 'Digit8', // Poluição Visual
    criterion9: 'Digit9', // Posicionamento na Gôndola
    criterion0: 'Digit0', // Avaria
    criterion11: 'KeyE', // Espaçamento
    criterion12: 'KeyF', // Fora de Layout
    resetScore: 'KeyR',
    removePhoto: 'Delete'
  });
  
  const PHOTOS_PER_PAGE = 100; // Show 100 photos per page for large batches
  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
  const startIndex = currentPage * PHOTOS_PER_PAGE;
  const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photos.length);
  const currentPagePhotos = photos.slice(startIndex, endIndex);
  const relativePhotoIndex = currentPhotoIndex - startIndex;

  const toggleCriterion = useCallback((criterionName: string) => {
    if (!photos[currentPhotoIndex]) return;
    
    setEvaluations(prev => {
      const photoId = photos[currentPhotoIndex].id;
      const currentList = prev[photoId] || [];
      const newList = currentList.includes(criterionName)
        ? currentList.filter(c => c !== criterionName)
        : [...currentList, criterionName];
      
      return { ...prev, [photoId]: newList };
    });
  }, [currentPhotoIndex, photos, setEvaluations]);

  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPhotoIndex > 0) {
      const newIndex = currentPhotoIndex - 1;
      setCurrentPhotoIndex(newIndex);
      
      // Check if we need to go to previous page
      if (newIndex < startIndex && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } else if (direction === 'next' && currentPhotoIndex < photos.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      
      // Check if we need to go to next page
      if (newIndex >= endIndex && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
    }
  }, [currentPhotoIndex, photos.length, startIndex, currentPage, endIndex, totalPages]);

  const resetCurrentEvaluation = useCallback(() => {
    if (!photos[currentPhotoIndex]) return;
    
    setEvaluations(prev => {
      const newEvaluations = { ...prev };
      delete newEvaluations[photos[currentPhotoIndex].id];
      return newEvaluations;
    });
  }, [currentPhotoIndex, photos, setEvaluations]);

  const removeCurrentPhoto = useCallback(() => {
    if (!photos[currentPhotoIndex]) return;
    
    const updatedPhotos = photos.filter(photo => photo.id !== photos[currentPhotoIndex].id);
    
    // Remove evaluation for this photo
    setEvaluations(prev => {
      const newEvaluations = { ...prev };
      delete newEvaluations[photos[currentPhotoIndex].id];
      return newEvaluations;
    });

    // Adjust current photo index if necessary
    if (currentPhotoIndex >= updatedPhotos.length && updatedPhotos.length > 0) {
      setCurrentPhotoIndex(updatedPhotos.length - 1);
    } else if (updatedPhotos.length === 0) {
      // No photos left, go back to upload
      onPhotosUpdate(updatedPhotos);
      return;
    }

    onPhotosUpdate(updatedPhotos);
  }, [currentPhotoIndex, photos, setEvaluations, onPhotosUpdate]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Prevent keyboard shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.code;
    
    // Helper to check if key matches shortcut (including Numpad variants)
    const matchesShortcut = (shortcut: string) => {
      if (key === shortcut) return true;
      // Support Numpad variants for digit keys
      if (shortcut.startsWith('Digit') && key === shortcut.replace('Digit', 'Numpad')) return true;
      if (shortcut.startsWith('Numpad') && key === shortcut.replace('Numpad', 'Digit')) return true;
      return false;
    };
    
    if (matchesShortcut(shortcuts.nextPhoto)) {
      event.preventDefault();
      navigatePhoto('next');
    } else if (matchesShortcut(shortcuts.prevPhoto)) {
      event.preventDefault();
      navigatePhoto('prev');
    } else if (matchesShortcut(shortcuts.resetScore)) {
      event.preventDefault();
      resetCurrentEvaluation();
    } else if (matchesShortcut(shortcuts.removePhoto)) {
      event.preventDefault();
      removeCurrentPhoto();
    } else if (matchesShortcut(shortcuts.criterion1)) {
      event.preventDefault();
      toggleCriterion('Buraco na Sessão');
    } else if (matchesShortcut(shortcuts.criterion2)) {
      event.preventDefault();
      toggleCriterion('Agrupamento');
    } else if (matchesShortcut(shortcuts.criterion3)) {
      event.preventDefault();
      toggleCriterion('Alinhamento');
    } else if (matchesShortcut(shortcuts.criterion4)) {
      event.preventDefault();
      toggleCriterion('Cores e Padrão da Categoria');
    } else if (matchesShortcut(shortcuts.criterion5)) {
      event.preventDefault();
      toggleCriterion('Precificação');
    } else if (matchesShortcut(shortcuts.criterion6)) {
      event.preventDefault();
      toggleCriterion('Limpeza');
    } else if (matchesShortcut(shortcuts.criterion7)) {
      event.preventDefault();
      toggleCriterion('Qualidade de Foto');
    } else if (matchesShortcut(shortcuts.criterion8)) {
      event.preventDefault();
      toggleCriterion('Poluição Visual');
    } else if (matchesShortcut(shortcuts.criterion9)) {
      event.preventDefault();
      toggleCriterion('Posicionamento na Gôndola');
    } else if (matchesShortcut(shortcuts.criterion0)) {
      event.preventDefault();
      toggleCriterion('Avaria');
    } else if (matchesShortcut(shortcuts.criterion11)) {
      event.preventDefault();
      toggleCriterion('Espaçamento');
    } else if (matchesShortcut(shortcuts.criterion12)) {
      event.preventDefault();
      toggleCriterion('Fora de Layout');
    }
  }, [shortcuts, toggleCriterion, navigatePhoto, resetCurrentEvaluation, removeCurrentPhoto]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Safety check for empty photos or invalid index - AFTER all hooks
  if (!photos || photos.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground">Nenhuma foto para avaliar</h2>
        <p className="text-muted-foreground">Faça o upload de fotos primeiro.</p>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];
  if (!currentPhoto) {
    // Fix index if out of bounds
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(0);
    }
    return null;
  }
  
  const currentCriteria = evaluations[currentPhoto.id] || [];
  const currentScore = 10 - CRITERIA.reduce((total, criterion) => {
    return currentCriteria.includes(criterion.name) ? total + criterion.penalty : total;
  }, 0);

  const evaluatedCount = Object.keys(evaluations).length;
  const progress = (evaluatedCount / photos.length) * 100;

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setCurrentPhotoIndex(page * PHOTOS_PER_PAGE);
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

  const handleImageUpdate = (newUrl: string) => {
    if (!currentPhoto) return;
    
    const updatedPhotos = photos.map(photo => 
      photo.id === currentPhoto.id 
        ? { ...photo, url: newUrl }
        : photo
    );
    onPhotosUpdate(updatedPhotos);
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
                  {totalPages > 1 && (
                    <span className="block text-xs mt-1">
                      Página {currentPage + 1} de {totalPages} ({startIndex + 1}-{endIndex} de {photos.length})
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <KeyboardShortcuts 
                  shortcuts={shortcuts}
                  onShortcutsChange={setShortcuts}
                />
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 mr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Página Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {currentPage + 1}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                    >
                      Próxima Página
                    </Button>
                  </div>
                )}
                <Button 
                  onClick={completeEvaluation}
                  disabled={evaluatedCount === 0}
                  className="bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Avaliação
                </Button>
              </div>
            </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Photo Display */}
        <Card className="lg:col-span-3 shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 min-w-0">
                <Eye className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="truncate" title={currentPhoto.name}>
                  {currentPhoto.name}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePhoto('prev')}
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Badge variant="secondary" className="px-2 py-1 text-xs whitespace-nowrap">
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removeCurrentPhoto}
                  title="Excluir foto"
                >
                  <Trash2 className="w-4 h-4" />
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

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Watermark Remover */}
          <WatermarkRemover
            imageUrl={currentPhoto.url}
            imageName={currentPhoto.name}
            onImageUpdated={handleImageUpdate}
          />

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
                <div className="text-3xl font-bold text-primary">{Math.max(0, currentScore).toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Pontuação Atual</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentCriteria.length === 0 ? 'Nota máxima (10.0)' : `${currentCriteria.length} critério(s) aplicado(s)`}
                </div>
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
    </div>
  );
};