import { useState } from 'react';
import { UserCheck, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Photo } from '@/pages/Index';

interface PromoterAssignmentProps {
  photos: Photo[];
  promoters: string[];
  onPhotosUpdate: (photos: Photo[]) => void;
}

export const PromoterAssignment = ({ photos, promoters, onPhotosUpdate }: PromoterAssignmentProps) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState('');

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAll = () => {
    setSelectedPhotos(photos.map(p => p.id));
  };

  const selectNone = () => {
    setSelectedPhotos([]);
  };

  const assignPromoter = () => {
    if (!selectedPromoter || selectedPhotos.length === 0) return;

    const updatedPhotos = photos.map(photo =>
      selectedPhotos.includes(photo.id)
        ? { ...photo, promoter: selectedPromoter }
        : photo
    );

    onPhotosUpdate(updatedPhotos);
    setSelectedPhotos([]);
    setSelectedPromoter('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-success';
    if (score >= 7) return 'text-primary';
    return 'text-destructive';
  };

  const photosWithoutPromoter = photos.filter(p => !p.promoter);
  const photosWithPromoter = photos.filter(p => p.promoter);

  return (
    <div className="space-y-6">
      {/* Assignment Interface */}
      <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Atribuir Responsáveis ({selectedPhotos.length} selecionadas)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um promotor..." />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter} value={promoter}>
                      {promoter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Limpar Seleção
              </Button>
              <Button 
                onClick={assignPromoter}
                disabled={!selectedPromoter || selectedPhotos.length === 0}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                Atribuir ({selectedPhotos.length})
              </Button>
            </div>
          </div>

          {promoters.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Adicione promotores primeiro para poder atribuí-los às fotos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos without promoter */}
      {photosWithoutPromoter.length > 0 && (
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Fotos Sem Responsável ({photosWithoutPromoter.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {photosWithoutPromoter.map((photo) => {
                const score = photo.evaluation?.score || 10;
                const isSelected = selectedPhotos.includes(photo.id);
                
                return (
                  <div
                    key={photo.id}
                    className={`relative group cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePhotoSelection(photo.id)}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>

                    {/* Score badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge 
                        variant={score >= 9 ? 'default' : score >= 7 ? 'secondary' : 'destructive'}
                        className="text-xs font-bold"
                      >
                        {score.toFixed(1)}
                      </Badge>
                    </div>

                    {/* Photo */}
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                      <img 
                        src={photo.url} 
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Photo name */}
                    <div className="mt-2 text-xs text-center truncate px-1">
                      {photo.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos with promoters */}
      {photosWithPromoter.length > 0 && (
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Fotos com Responsável ({photosWithPromoter.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {promoters
                .filter(promoter => photosWithPromoter.some(p => p.promoter === promoter))
                .map(promoter => {
                  const promoterPhotos = photosWithPromoter.filter(p => p.promoter === promoter);
                  const avgScore = promoterPhotos.reduce((sum, p) => sum + (p.evaluation?.score || 10), 0) / promoterPhotos.length;
                  
                  return (
                    <div key={promoter}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{promoter}</h4>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{promoterPhotos.length} fotos</Badge>
                          <div className={`font-bold ${getScoreColor(avgScore)}`}>
                            Média: {avgScore.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {promoterPhotos.map((photo) => {
                          const score = photo.evaluation?.score || 10;
                          
                          return (
                            <div key={photo.id} className="relative group">
                              {/* Score badge */}
                              <div className="absolute top-2 right-2 z-10">
                                <Badge 
                                  variant={score >= 9 ? 'default' : score >= 7 ? 'secondary' : 'destructive'}
                                  className="text-xs font-bold"
                                >
                                  {score.toFixed(1)}
                                </Badge>
                              </div>

                              {/* Remove assignment */}
                              <button
                                onClick={() => {
                                  const updatedPhotos = photos.map(p =>
                                    p.id === photo.id ? { ...p, promoter: undefined } : p
                                  );
                                  onPhotosUpdate(updatedPhotos);
                                }}
                                className="absolute top-2 left-2 z-10 bg-destructive/80 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>

                              {/* Photo */}
                              <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={photo.url} 
                                  alt={photo.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Photo name */}
                              <div className="mt-2 text-xs text-center truncate px-1">
                                {photo.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};