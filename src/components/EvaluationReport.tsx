import { useState } from 'react';
import { Download, FileSpreadsheet, RotateCcw, Eye, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Photo } from '@/pages/Index';

interface EvaluationReportProps {
  photos: Photo[];
  onReset: () => void;
}

export const EvaluationReport = ({ photos, onReset }: EvaluationReportProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'excellent' | 'good' | 'attention'>('all');

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

  // Filter and sort photos
  const filteredPhotos = photos
    .filter(photo => {
      const matchesSearch = photo.name.toLowerCase().includes(searchTerm.toLowerCase());
      const score = photo.evaluation?.score || 10;
      const matchesFilter = 
        filterBy === 'all' || 
        (filterBy === 'excellent' && score >= 9) ||
        (filterBy === 'good' && score >= 7 && score < 9) ||
        (filterBy === 'attention' && score < 7);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return (b.evaluation?.score || 10) - (a.evaluation?.score || 10);
      }
      return a.name.localeCompare(b.name);
    });

  const exportToCSV = () => {
    // Define all criteria columns
    const criteriaColumns = [
      'Buraco na Sessão',
      'Agrupamento', 
      'Alinhamento',
      'Cores e Padrão da Categoria',
      'Precificação',
      'Limpeza',
      'Qualidade de Foto',
      'Poluição Visual',
      'Posicionamento na Gôndola',
      'Avaria',
      'Espaçamento',
      'Fora de Layout'
    ];

    // Create headers
    const headers = [
      'Nome da Foto',
      'Responsável',
      'Nota Final',
      'Status',
      'Total de Problemas',
      ...criteriaColumns,
      'Resumo dos Problemas'
    ];

      // Create rows with individual criterion columns
    const rows = photos.map(photo => {
      const score = photo.evaluation?.score || 10;
      const criteria = photo.evaluation?.criteria || [];
      
      const getStatus = (score: number) => {
        if (score >= 9) return 'Excelente';
        if (score >= 7) return 'Bom';
        return 'Precisa Atenção';
      };

      const row = [
        photo.name,
        photo.promoter || 'Não Atribuído',
        score.toFixed(1),
        getStatus(score),
        criteria.length.toString(),
        ...criteriaColumns.map(criterion => criteria.includes(criterion) ? 'X' : ''),
        criteria.length > 0 ? criteria.join('; ') : 'Nenhum problema'
      ];

      return row;
    });

    // Add summary statistics at the end
    const summaryRows = [
      [],
      ['RESUMO ESTATÍSTICO'],
      ['Total de Fotos', totalPhotos.toString()],
      ['Média Geral', averageScore.toFixed(1)],
      ['Fotos Excelentes (≥9.0)', excellentCount.toString()],
      ['Fotos Boas (7.0-8.9)', (photos.filter(p => (p.evaluation?.score || 10) >= 7 && (p.evaluation?.score || 10) < 9).length).toString()],
      ['Fotos que Precisam Atenção (<7.0)', attentionCount.toString()],
      [],
      ['PROBLEMAS MAIS FREQUENTES'],
      ...topIssues.map(([criterion, count]) => [criterion, `${count} occorrências`])
    ];

    // Create CSV content with proper escaping
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')),
      ...summaryRows.map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download file with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-merchandising-detalhado-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-success';
    if (score >= 7) return 'text-primary';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return { variant: 'default' as const, label: 'Excelente', color: 'bg-success' };
    if (score >= 7) return { variant: 'secondary' as const, label: 'Bom', color: 'bg-primary' };
    return { variant: 'destructive' as const, label: 'Atenção', color: 'bg-destructive' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Relatório de Avaliação
              </CardTitle>
              <CardDescription className="text-lg">
                Resultados completos da avaliação de merchandising
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onReset}
                className="border-border hover:border-primary/50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
              <Button 
                onClick={exportToCSV}
                className="bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
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

        {/* Filters and Search */}
        <Card className="lg:col-span-2 shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por nome da foto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={sortBy} onValueChange={(value: 'name' | 'score') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Por Nota</SelectItem>
                  <SelectItem value="name">Por Nome</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="excellent">Excelentes</SelectItem>
                  <SelectItem value="good">Boas</SelectItem>
                  <SelectItem value="attention">Atenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredPhotos.length} de {totalPhotos} fotos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photos List */}
      <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Lista Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPhotos.map((photo) => {
              const score = photo.evaluation?.score || 10;
              const badge = getScoreBadge(score);
              
              return (
                <div key={photo.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/30 transition-all">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <img 
                      src={photo.url} 
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{photo.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {photo.evaluation?.criteria.length || 0} critério(s) fora do padrão
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </div>
                    <Badge 
                      variant={badge.variant}
                      className={badge.variant === 'default' ? badge.color : ''}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};