import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PromoterManagementProps {
  promoters: string[];
  onPromotersChange: (promoters: string[]) => void;
}

export const PromoterManagement = ({ promoters, onPromotersChange }: PromoterManagementProps) => {
  const [newPromoter, setNewPromoter] = useState('');

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