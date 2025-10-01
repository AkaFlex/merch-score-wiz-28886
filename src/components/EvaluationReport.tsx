import { useState } from 'react';
import { Download, FileSpreadsheet, RotateCcw, Eye, Filter, TrendingUp, TrendingDown, FileImage, ZoomIn } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Calculate statistics
  const totalPhotos = photos.length;
  const averageScore = photos.reduce((sum, photo) => sum + (photo.evaluation?.score || 10), 0) / totalPhotos;
  const excellentCount = photos.filter(photo => (photo.evaluation?.score || 10) >= 9).length;
  const attentionCount = photos.filter(photo => (photo.evaluation?.score || 10) <= 5).length;

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
        (filterBy === 'attention' && score <= 5);
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

    // Create headers - each criterion as separate column
    const headers = [
      'Nome da Foto',
      'Responsável',
      'Nota Final',
      'Status',
      'Total de Problemas',
      ...criteriaColumns.map(c => `Problema: ${c}`),
      'Lista de Problemas'
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

      // Create row with proper separation
      const row = [
        photo.name,
        photo.promoter || 'Não Atribuído',
        score.toFixed(1),
        getStatus(score),
        criteria.length.toString()
      ];

      // Add individual criterion columns
      criteriaColumns.forEach(criterion => {
        row.push(criteria.includes(criterion) ? 'SIM' : 'NÃO');
      });

      // Add summary column
      row.push(criteria.length > 0 ? criteria.join(' | ') : 'Nenhum problema');

      return row;
    });

    // Add summary statistics at the end
    const summaryRows = [
      [''],
      ['RESUMO ESTATÍSTICO'],
      ['Métrica', 'Valor'],
      ['Total de Fotos', totalPhotos.toString()],
      ['Média Geral', averageScore.toFixed(1)],
      ['Fotos Excelentes (≥9.0)', excellentCount.toString()],
      ['Fotos Boas (7.0-8.9)', (photos.filter(p => (p.evaluation?.score || 10) >= 7 && (p.evaluation?.score || 10) < 9).length).toString()],
      ['Fotos que Precisam Atenção (≤5.0)', attentionCount.toString()],
      [''],
      ['PROBLEMAS MAIS FREQUENTES'],
      ['Problema', 'Ocorrências'],
      ...topIssues.map(([criterion, count]) => [criterion, count.toString()])
    ];

    // Create CSV content with proper column separation
    const csvContent = [
      headers.join(';'), // Use semicolon for better Excel separation
      ...rows.map(row => row.join(';')),
      ...summaryRows.map(row => row.join(';'))
    ].join('\n');

    // Create and download file with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-merchandising-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Criteria with penalties for showing in PDF
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


  const exportToPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    let currentY = 20;
    const margin = 20;
    const maxImageWidth = 120;
    const maxImageHeight = 90;
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Relatório de Merchandising', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const score = photo.evaluation?.score || 10;
      
      // Check if we need a new page
      if (currentY + maxImageHeight + 30 > pageHeight - margin) {
        pdf.addPage();
        currentY = 20;
      }
      
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          img.onload = () => {
            // Calculate proper aspect ratio
            const imgAspectRatio = img.naturalWidth / img.naturalHeight;
            let canvasWidth = 800;
            let canvasHeight = 600;
            
            // Adjust canvas size to maintain aspect ratio
            if (imgAspectRatio > 1) {
              canvasHeight = canvasWidth / imgAspectRatio;
            } else {
              canvasWidth = canvasHeight * imgAspectRatio;
            }
            
            // Create canvas with proper dimensions
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            if (ctx) {
              // Fill background with white to avoid transparency issues
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              
              // Draw image maintaining aspect ratio without any overlays
              ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            }
            
            // Calculate PDF image dimensions maintaining aspect ratio
            let pdfImageWidth = maxImageWidth;
            let pdfImageHeight = maxImageHeight;
            
            if (imgAspectRatio > maxImageWidth / maxImageHeight) {
              pdfImageHeight = maxImageWidth / imgAspectRatio;
            } else {
              pdfImageWidth = maxImageHeight * imgAspectRatio;
            }
            
            // Add image to PDF with proper quality
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', margin, currentY, pdfImageWidth, pdfImageHeight);
            
            resolve(void 0);
          };
          img.src = photo.url;
        });
        
        // Add text details with proper width management
        pdf.setFontSize(12);
        const textX = margin + maxImageWidth + 10;
        const maxTextWidth = pageWidth - textX - margin;
        
        // Split long text to avoid overflow
        const promoterLines = pdf.splitTextToSize(`Promoter: ${photo.promoter || 'Não Atribuído'}`, maxTextWidth);
        
        let textY = currentY + 15;
        
        pdf.text(promoterLines, textX, textY);
        textY += promoterLines.length * 5 + 5;
        
        pdf.text(`Nota: ${score.toFixed(1)}`, textX, textY);
        textY += 10;
        
        const problems = photo.evaluation?.criteria || [];
        if (problems.length > 0) {
          pdf.text('Problemas identificados:', textX, textY);
          textY += 8;
          
          problems.forEach((problem) => {
            // Find the penalty for this criterion
            const criterion = CRITERIA.find(c => c.name === problem);
            const penalty = criterion ? criterion.penalty : 0;
            
            const problemText = `• ${problem} (-${penalty} pts)`;
            const problemLines = pdf.splitTextToSize(problemText, maxTextWidth);
            pdf.text(problemLines, textX, textY);
            textY += problemLines.length * 5 + 2;
          });
        } else {
          pdf.text('✓ Nenhum problema identificado', textX, textY);
        }
        
        currentY += maxImageHeight + 25;
        
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue with next image
        currentY += maxImageHeight + 25;
      }
    }
    
    // Save PDF
    pdf.save(`relatorio-fotos-merchandising-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-success'; // Excelente: 10-9
    if (score >= 7) return 'text-primary'; // Bom: 8-7
    if (score >= 6) return 'text-accent';  // Ok: 6
    return 'text-destructive'; // Péssimo: 5-0
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excelente';
    if (score >= 7) return 'Bom';
    if (score >= 6) return 'Ok';
    return 'Péssimo';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return { variant: 'default' as const, label: 'Excelente', color: 'bg-success' };
    if (score >= 7) return { variant: 'secondary' as const, label: 'Bom', color: 'bg-primary' };
    if (score >= 6) return { variant: 'outline' as const, label: 'Ok', color: 'bg-accent' };
    return { variant: 'destructive' as const, label: 'Péssimo', color: 'bg-destructive' };
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
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button 
                onClick={exportToPDF}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Exportar PDF
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
            <div className="text-sm text-muted-foreground">Precisam Atenção (≤5.0)</div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPhoto(photo)}
                      className="border-primary/30 hover:border-primary/50"
                    >
                      <ZoomIn className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
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

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
                className="bg-background/90 backdrop-blur-sm"
              >
                ✕
              </Button>
            </div>
            
            <div className="relative">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.name}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                <div className="text-lg font-bold">
                  Nota: {(selectedPhoto.evaluation?.score || 10).toFixed(1)}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-background">
              <h3 className="text-xl font-bold mb-2">{selectedPhoto.name}</h3>
              <p className="text-muted-foreground mb-4">
                Promoter: {selectedPhoto.promoter || 'Não Atribuído'}
              </p>
              
              {selectedPhoto.evaluation?.criteria && selectedPhoto.evaluation.criteria.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2">Problemas Identificados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.evaluation.criteria.map((criterion) => (
                      <Badge key={criterion} variant="destructive">
                        {criterion}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-success font-medium">
                  ✓ Nenhum problema identificado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};