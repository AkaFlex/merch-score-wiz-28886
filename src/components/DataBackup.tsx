import { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { Photo, Promoter } from '@/pages/Index';

interface DataBackupProps {
  photos: Photo[];
  promoters: Promoter[];
  onDataImport: (data: { photos: Photo[]; promoters: Promoter[] }) => void;
}

export const DataBackup = ({ photos, promoters, onDataImport }: DataBackupProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        photos,
        promoters,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merchandising-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.photos || !data.promoters || !Array.isArray(data.photos) || !Array.isArray(data.promoters)) {
        throw new Error('Formato de arquivo inválido');
      }

      onDataImport({
        photos: data.photos,
        promoters: data.promoters
      });

      toast.success('Backup importado com sucesso');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro ao importar backup - verifique o formato do arquivo');
    } finally {
      setIsImporting(false);
      // Reset input
      event.target.value = '';
    }
  };

  const hasData = photos.length > 0 || promoters.length > 0;

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Backup dos Dados
        </CardTitle>
        <CardDescription>
          Exporte ou importe seus dados para segurança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado disponível para backup
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={exportData}
            disabled={!hasData || isExporting}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Backup'}
          </Button>

          <div className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              disabled={isImporting}
              className="hidden"
              id="import-backup"
            />
            <label htmlFor="import-backup" className="w-full">
              <Button
                disabled={isImporting}
                variant="outline"
                className="w-full cursor-pointer"
                type="button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importando...' : 'Importar Backup'}
              </Button>
            </label>
          </div>
        </div>

        {hasData && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>{photos.length} fotos, {promoters.length} promotores</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};