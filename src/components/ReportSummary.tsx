import { TrendingUp, TrendingDown, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Photo } from '@/pages/Index';

interface ReportSummaryProps {
  photos: Photo[];
}

export const ReportSummary = ({ photos }: ReportSummaryProps) => {
  // Calculate statistics
  const totalPhotos = photos.length;
  const averageScore = photos.reduce((sum, photo) => sum + (photo.evaluation?.score || 10), 0) / totalPhotos;
  const excellentCount = photos.filter(photo => (photo.evaluation?.score || 10) >= 9).length;
  const attentionCount = photos.filter(photo => (photo.evaluation?.score || 10) < 7).length;

  // Most common issues
  const allCriteria: { [key: string]: number } = {};
  photos.forEach(photo => {
    photo.evaluation?.criteria.forEach(criterion => {
      allCriteria[criterion] = (allCriteria[criterion] || 0) + 1;
    });
  });
  const topIssues = Object.entries(allCriteria)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Promoter statistics
  const promoterStats = photos.reduce((acc, photo) => {
    if (photo.promoter) {
      if (!acc[photo.promoter]) {
        acc[photo.promoter] = { photos: 0, totalScore: 0 };
      }
      acc[photo.promoter].photos += 1;
      acc[photo.promoter].totalScore += (photo.evaluation?.score || 10);
    }
    return acc;
  }, {} as { [key: string]: { photos: number; totalScore: number } });

  const promoterRanking = Object.entries(promoterStats)
    .map(([name, stats]) => ({
      name,
      photos: stats.photos,
      average: stats.totalScore / stats.photos
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const photosWithPromoter = photos.filter(p => p.promoter).length;
  const photosWithoutPromoter = totalPhotos - photosWithPromoter;

  return (
    <div className="space-y-6">
      {/* General Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-card border-0 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{totalPhotos}</div>
            <div className="text-sm text-muted-foreground">Total de Fotos</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-success mb-2">{averageScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Média Geral</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-success mb-2">{excellentCount}</div>
            <div className="text-sm text-muted-foreground">Excelentes (≥9.0)</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-destructive mb-2">{attentionCount}</div>
            <div className="text-sm text-muted-foreground">Precisam Atenção (&lt;7.0)</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Issues */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Principais Problemas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topIssues.length > 0 ? topIssues.map(([criterion, count]) => (
              <div key={criterion} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <span className="text-sm font-medium">{criterion}</span>
                <Badge variant="destructive">{count}x</Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum problema identificado!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Promoter Assignment Status */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Status de Atribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
              <span className="text-sm font-medium">Com Responsável</span>
              <Badge variant="default" className="bg-success">{photosWithPromoter}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">Sem Responsável</span>
              <Badge variant="secondary">{photosWithoutPromoter}</Badge>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {photosWithPromoter > 0 && `${((photosWithPromoter / totalPhotos) * 100).toFixed(1)}% atribuídas`}
            </div>
          </CardContent>
        </Card>

        {/* Top Promoters */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Melhores Promotores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promoterRanking.length > 0 ? promoterRanking.map((promoter, index) => (
              <div key={promoter.name} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{promoter.name}</div>
                    <div className="text-xs text-muted-foreground">{promoter.photos} fotos</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-primary">
                  {promoter.average.toFixed(1)}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Atribua promotores para ver o ranking
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};