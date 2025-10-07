import { useState } from 'react';
import { Download, Table as TableIcon, Search, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ExtractedSlideData } from '@/types';
import * as XLSX from 'xlsx';

interface ExtractedDataViewProps {
  data: ExtractedSlideData[];
  onReset: () => void;
  onStartEvaluation: (photos: any[]) => void;
}

export const ExtractedDataView = ({ data, onReset, onStartEvaluation }: ExtractedDataViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredData = data.filter(item =>
    item.codigoParceiro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nomeLoja.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.superior.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = data.map((item) => ({
        'Slide': item.slideNumber,
        'Código Parceiro': item.codigoParceiro,
        'Nome da Loja': item.nomeLoja,
        'Colaborador/Promotor': item.colaborador,
        'Superior/Líder': item.superior,
        'Data de Envio': item.dataEnvio,
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = [
        { wch: 8 },  // Slide
        { wch: 15 }, // Código
        { wch: 30 }, // Nome Loja
        { wch: 35 }, // Colaborador
        { wch: 30 }, // Superior
        { wch: 20 }, // Data
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Dados Extraídos');

      // Generate Excel file
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `merchandising_${timestamp}.xlsx`);

      toast({
        title: "Excel exportado",
        description: `${data.length} registro(s) exportado(s) com sucesso`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    }
  };

  const startPhotoEvaluation = () => {
    // Convert extracted data to photos for evaluation
    // In a real scenario, images would be extracted from the PPTX
    const mockPhotos = data.map((item, index) => ({
      id: `photo-${index}`,
      name: `${item.nomeLoja} - Slide ${item.slideNumber}`,
      url: `https://placehold.co/800x600/e2e8f0/1e293b?text=Slide+${item.slideNumber}`,
      promoter: item.colaborador,
      leader: item.superior,
    }));
    
    onStartEvaluation(mockPhotos);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-6 w-6" />
              Dados Extraídos ({data.length} slides)
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button 
                onClick={startPhotoEvaluation}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
              >
                <FileText className="h-4 w-4 mr-2" />
                Iniciar Avaliação
              </Button>
              <Button onClick={onReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, loja, colaborador ou superior..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Slide</TableHead>
                    <TableHead>Código Parceiro</TableHead>
                    <TableHead>Nome da Loja</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Superior</TableHead>
                    <TableHead>Data de Envio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado disponível'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.slideNumber}</TableCell>
                        <TableCell>{item.codigoParceiro}</TableCell>
                        <TableCell>{item.nomeLoja}</TableCell>
                        <TableCell>{item.colaborador}</TableCell>
                        <TableCell>{item.superior}</TableCell>
                        <TableCell>{item.dataEnvio}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {searchTerm && (
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredData.length} de {data.length} registros
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
