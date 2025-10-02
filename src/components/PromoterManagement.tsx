import { useState, useEffect } from 'react';
import { Plus, X, Users, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Promoter } from '@/pages/Index';

interface PromoterManagementProps {
  promoters: Promoter[];
  onPromotersChange: (promoters: Promoter[]) => void;
}

const DEFAULT_PROMOTERS: Promoter[] = [
  { name: 'AGM ALEF', leader: 'LIDER DIEGO SP' },
  { name: 'AGM ALEXSANDRA', leader: 'LIDER NATANAEL' },
  { name: 'AGM ANDERSON', leader: 'LIDER DIEGO SP' },
  { name: 'AGM ARLEM', leader: 'LIDER NATANAEL' },
  { name: 'AGM BRUNO VIEIR', leader: 'COORD EVERTON' },
  { name: 'AGM CARLOS NASC', leader: 'LIDER NATANAEL' },
  { name: 'AGM CARLOS MOTA', leader: 'LIDER NATANAEL' },
  { name: 'AGM CASSIUS SP', leader: 'LIDER EVERTON' },
  { name: 'AGM CLEITON UDI', leader: 'COORD EVERTON' },
  { name: 'AGM CLEYLSON', leader: 'LIDER NATANAEL' },
  { name: 'AGM CRISTIANA', leader: 'COORD EVERTON' },
  { name: 'AGM DANIEL ROCH', leader: 'LIDER NATANAEL' },
  { name: 'AGM DANIELLE', leader: 'LIDER NATANAEL' },
  { name: 'AGM EDER SE', leader: 'LIDER NATANAEL' },
  { name: 'AGM EDINALDO EM', leader: 'LIDER NATANAEL' },
  { name: 'AGM EDUARDO SIL', leader: 'LIDER EVERTON' },
  { name: 'AGM FABRICIO', leader: 'COORD EVERTON' },
  { name: 'AGM FERNANDA PR', leader: 'COORD EVERTON' },
  { name: 'AGM FERNANDO OL', leader: 'COORD EVERTON' },
  { name: 'AGM FERNANDO UD', leader: 'COORD EVERTON' },
  { name: 'AGM KATIA', leader: 'LIDER NATANAEL' },
  { name: 'AGM FRANCISCO', leader: 'LIDER EVERTON' },
  { name: 'AGM GABRIEL SP', leader: 'LIDER DIEGO SP' },
  { name: 'AGM ITALO BERNA', leader: 'LIDER EVERTON' },
  { name: 'AGM JAIRO MA', leader: 'LIDER NATANAEL' },
  { name: 'AGM JACKSON PER', leader: 'LIDER DIEGO SP' },
  { name: 'AGM JESSICA MAY', leader: 'LIDER NATANAEL' },
  { name: 'AGM JESSICA MA', leader: 'LIDER NATANAEL' },
  { name: 'AGM JOSE DAVIDS', leader: 'LIDER EVERTON' },
  { name: 'AGM JOSE LEANDR', leader: 'LIDER EVERTON' },
  { name: 'AGM JOSENILDO', leader: 'LIDER NATANAEL' },
  { name: 'AGM JOSE RONALD', leader: 'LIDER NATANAEL' },
  { name: 'AGM JULIANA', leader: 'LIDER NATANAEL' },
  { name: 'AGM KAREN', leader: 'LIDER NATANAEL' },
  { name: 'AGM KELLEN', leader: 'COORD EVERTON' },
  { name: 'AGM LAZARO JORG', leader: 'LIDER NATANAEL' },
  { name: 'AGM LEANDRO MAR', leader: 'LIDER EVERTON' },
  { name: 'AGM LEONARDO GO', leader: 'COORD EVERTON' },
  { name: 'AGM LINDOMAR', leader: 'COORD EVERTON' },
  { name: 'AGM LIVIA GO', leader: 'COORD EVERTON' },
  { name: 'AGM LUCAS CASTR', leader: 'LIDER EVERTON' },
  { name: 'AGM LUCAS RJ', leader: 'COORD EVERTON' },
  { name: 'AGM LUCAS RODRI', leader: 'LIDER DIEGO SP' },
  { name: 'AGM LUIZ HENRIQ', leader: 'COORD EVERTON' },
  { name: 'AGM MAICON', leader: 'LIDER NATANAEL' },
  { name: 'AGM MARCIA M', leader: 'COORD EVERTON' },
  { name: 'AGM MARCO TULIO', leader: 'LIDER EVERTON' },
  { name: 'AGM MARIA GABRI', leader: 'LIDER NATANAEL' },
  { name: 'AGM MATHEUS AFO', leader: 'COORD EVERTON' },
  { name: 'AGM MAYKE', leader: 'COORD EVERTON' },
  { name: 'AGM NHAYARA', leader: 'LIDER NATANAEL' },
  { name: 'AGM OTONIEL', leader: 'LIDER NATANAEL' },
  { name: 'AGM PEDRO CUNHA', leader: 'LIDER EVERTON' },
  { name: 'AGM PHILLIP SP', leader: 'LIDER EVERTON' },
  { name: 'AGM RAFAEL BH', leader: 'COORD EVERTON' },
  { name: 'AGM RENAN APARE', leader: 'LIDER DIEGO SP' },
  { name: 'AGM RENAN SENA', leader: 'COORD EVERTON' },
  { name: 'AGM RYAN FELIPE', leader: 'COORD EVERTON' },
  { name: 'AGM RICK JHONY', leader: 'COORD EVERTON' },
  { name: 'AGM RONICLEY', leader: 'COORD EVERTON' },
  { name: 'AGM SAMUEL', leader: 'COORD EVERTON' },
  { name: 'AGM SIMONE PINT', leader: 'COORD EVERTON' },
  { name: 'AGM SUELLEN', leader: 'LIDER NATANAEL' },
  { name: 'AGM SUZANA', leader: 'COORD EVERTON' },
  { name: 'AGM THAMARA', leader: 'COORD EVERTON' },
  { name: 'AGM THIAGO RJ', leader: 'COORD EVERTON' },
  { name: 'AGM TIAGO RP', leader: 'LIDER EVERTON' },
  { name: 'AGM VICTOR EDU', leader: 'COORD EVERTON' },
  { name: 'AGM VICTOR GO', leader: 'COORD EVERTON' },
  { name: 'AGM VICTOR REGO', leader: 'LIDER NATANAEL' },
  { name: 'AGM VINICIO', leader: 'COORD EVERTON' },
  { name: 'AGM VINICIUS', leader: 'COORD EVERTON' },
  { name: 'AGM VLADEMIR', leader: 'LIDER DIEGO SP' },
  { name: 'AGM WELLINGTON', leader: 'LIDER DIEGO SP' },
  { name: 'AGM WILLIAM BRU', leader: 'LIDER DIEGO SP' },
  { name: 'AGM WILMA', leader: 'COORD EVERTON' },
  { name: 'AGM WILSON ESCO', leader: 'COORD EVERTON' },
  { name: 'AGM WILTON', leader: 'LIDER DIEGO SP' },
  { name: 'AGM YGOR SP', leader: 'LIDER DIEGO SP' },
];

const AVAILABLE_LEADERS = [
  'LIDER DIEGO SP',
  'LIDER NATANAEL',
  'LIDER EVERTON',
  'COORD EVERTON'
];

export const PromoterManagement = ({ promoters, onPromotersChange }: PromoterManagementProps) => {
  const [newPromoterName, setNewPromoterName] = useState('');
  const [newPromoterLeader, setNewPromoterLeader] = useState('');
  const [editingPromoter, setEditingPromoter] = useState<string | null>(null);
  const [editLeader, setEditLeader] = useState('');

  // Initialize with default promoters if empty
  useEffect(() => {
    if (promoters.length === 0) {
      onPromotersChange(DEFAULT_PROMOTERS);
    }
  }, [promoters.length, onPromotersChange]);

  const addPromoter = () => {
    if (newPromoterName.trim() && newPromoterLeader && !promoters.find(p => p.name === newPromoterName.trim())) {
      onPromotersChange([...promoters, { name: newPromoterName.trim(), leader: newPromoterLeader }]);
      setNewPromoterName('');
      setNewPromoterLeader('');
    }
  };

  const removePromoter = (promoterName: string) => {
    onPromotersChange(promoters.filter(p => p.name !== promoterName));
  };

  const startEditing = (promoter: Promoter) => {
    setEditingPromoter(promoter.name);
    setEditLeader(promoter.leader);
  };

  const saveEdit = (promoterName: string) => {
    onPromotersChange(
      promoters.map(p => p.name === promoterName ? { ...p, leader: editLeader } : p)
    );
    setEditingPromoter(null);
    setEditLeader('');
  };

  const cancelEdit = () => {
    setEditingPromoter(null);
    setEditLeader('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPromoter();
    }
  };

  // Group promoters by leader
  const promotersByLeader = promoters.reduce((acc, promoter) => {
    if (!acc[promoter.leader]) {
      acc[promoter.leader] = [];
    }
    acc[promoter.leader].push(promoter);
    return acc;
  }, {} as Record<string, Promoter[]>);

  return (
    <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Gerenciar Promotores ({promoters.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new promoter */}
        <div className="space-y-2">
          <Input
            placeholder="Nome do promotor..."
            value={newPromoterName}
            onChange={(e) => setNewPromoterName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <div className="flex gap-2">
            <Select value={newPromoterLeader} onValueChange={setNewPromoterLeader}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o líder..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_LEADERS.map((leader) => (
                  <SelectItem key={leader} value={leader}>
                    {leader}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addPromoter} size="sm" disabled={!newPromoterName.trim() || !newPromoterLeader}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* List promoters grouped by leader */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {AVAILABLE_LEADERS.map((leader) => {
            const leaderPromoters = promotersByLeader[leader] || [];
            if (leaderPromoters.length === 0) return null;
            
            return (
              <div key={leader} className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">{leader} ({leaderPromoters.length})</h4>
                <div className="flex flex-wrap gap-2 pl-2">
                  {leaderPromoters.map((promoter) => (
                    <div key={promoter.name}>
                      {editingPromoter === promoter.name ? (
                        <div className="flex items-center gap-1 p-2 bg-muted rounded-md">
                          <Select value={editLeader} onValueChange={setEditLeader}>
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_LEADERS.map((l) => (
                                <SelectItem key={l} value={l} className="text-xs">
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => saveEdit(promoter.name)}
                            className="hover:text-success"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          <span className="text-xs">{promoter.name}</span>
                          <button
                            onClick={() => startEditing(promoter)}
                            className="hover:text-primary ml-1"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removePromoter(promoter.name)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
