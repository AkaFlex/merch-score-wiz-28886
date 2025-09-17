import { useState, useEffect } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PromoterManagementProps {
  promoters: string[];
  onPromotersChange: (promoters: string[]) => void;
}

const DEFAULT_PROMOTERS = [
  'AGM ALEF', 'AGM ALEXSANDRA', 'AGM ANDERSON', 'AGM ARLEM', 'AGM BRUNO VIEIR',
  'AGM CARLOS NASC', 'AGM CARLOS MOTA', 'AGM CASSIUS SP', 'AGM CLEITON UDI', 'AGM CLEYLSON',
  'AGM CRISTIANA', 'AGM DANIEL ROCH', 'AGM DANIELLE', 'AGM EDER SE', 'AGM EDUARDO SIL',
  'AGM FABRICIO', 'AGM FERNANDO OL', 'AGM FERNANDO UD', 'AGM KATIA', 'AGM FRANCISCO',
  'AGM GABRIEL SP', 'AGM JAIRO MA', 'AGM JESSICA MAY', 'AGM JESSICA MA', 'AGM JOSE DAVIDS',
  'AGM JOSENILDO', 'AGM JULIANA', 'AGM KAREN', 'AGM KELLEN', 'AGM LAZARO JORG',
  'AGM LEANDRO MAR', 'AGM LEONARDO GO', 'AGM LINDOMAR', 'AGM LIVIA GO', 'AGM LUCAS CASTR',
  'AGM LUCAS RJ', 'AGM LUCAS RODRI', 'AGM LUIZ HENRIQ', 'AGM MAICON', 'AGM MARCIA M',
  'AGM MARCO TULIO', 'AGM MARIA GABRI', 'AGM MATHEUS AFO', 'AGM MATHEUS LOP', 'AGM MAYKE',
  'AGM NHAYARA', 'AGM OTONIEL', 'AGM PEDRO CUNHA', 'AGM PHILLIP SP', 'AGM RAFAEL BH',
  'AGM RENAN APARE', 'AGM RENAN SENA', 'AGM RICK JHONY', 'AGM RONICLEY', 'AGM SAMUEL',
  'AGM SIMONE PINT', 'AGM SUELLEN', 'AGM SUZANA', 'AGM THAMARA', 'AGM THIAGO RJ',
  'AGM TIAGO RP', 'AGM VICTOR EDU', 'AGM VICTOR GO', 'AGM VICTOR REGO', 'AGM VINICIO',
  'AGM VINICIUS', 'AGM VLADEMIR', 'AGM WELLINGTON', 'AGM WESLEY', 'AGM WILLIAM BRU',
  'AGM WILMA', 'AGM WILSON ESCO', 'AGM WILTON', 'AGM YGOR SP'
];

export const PromoterManagement = ({ promoters, onPromotersChange }: PromoterManagementProps) => {
  const [newPromoter, setNewPromoter] = useState('');

  // Initialize with default promoters if empty
  useEffect(() => {
    if (promoters.length === 0) {
      onPromotersChange(DEFAULT_PROMOTERS);
    }
  }, [promoters.length, onPromotersChange]);

  const addPromoter = () => {
    if (newPromoter.trim() && !promoters.includes(newPromoter.trim())) {
      onPromotersChange([...promoters, newPromoter.trim()]);
      setNewPromoter('');
    }
  };

  const removePromoter = (promoter: string) => {
    onPromotersChange(promoters.filter(p => p !== promoter));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPromoter();
    }
  };

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Gerenciar Promotores ({promoters.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do promotor..."
            value={newPromoter}
            onChange={(e) => setNewPromoter(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addPromoter} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {promoters.map((promoter) => (
            <Badge
              key={promoter}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {promoter}
              <button
                onClick={() => removePromoter(promoter)}
                className="hover:text-destructive ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        {promoters.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Adicione promotores para atribuir às fotos avaliadas
          </p>
        )}
      </CardContent>
    </Card>
  );
};