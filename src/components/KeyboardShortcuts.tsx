import { useState } from 'react';
import { Settings, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface ShortcutConfig {
  nextPhoto: string;
  prevPhoto: string;
  criterion1: string; // Buraco na Sessão
  criterion2: string; // Agrupamento  
  criterion3: string; // Alinhamento
  criterion4: string; // Cores e Padrão
  criterion5: string; // Precificação
  criterion6: string; // Limpeza
  criterion7: string; // Qualidade de Foto
  criterion8: string; // Poluição Visual
  criterion9: string; // Posicionamento na Gôndola
  criterion0: string; // Avaria
  criterion11: string; // Espaçamento
  criterion12: string; // Fora de Layout
  resetScore: string;
  removePhoto: string;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutConfig;
  onShortcutsChange: (shortcuts: ShortcutConfig) => void;
}

const defaultShortcuts: ShortcutConfig = {
  nextPhoto: 'ArrowRight',
  prevPhoto: 'ArrowLeft',
  criterion1: 'Digit1',
  criterion2: 'Digit2',
  criterion3: 'Digit3',
  criterion4: 'Digit4',
  criterion5: 'Digit5',
  criterion6: 'Digit6',
  criterion7: 'Digit7',
  criterion8: 'Digit8',
  criterion9: 'Digit9',
  criterion0: 'Digit0',
  criterion11: 'KeyE',
  criterion12: 'KeyF',
  resetScore: 'KeyR',
  removePhoto: 'Delete'
};

const shortcutLabels = {
  nextPhoto: 'Próxima Foto',
  prevPhoto: 'Foto Anterior',
  criterion1: 'Buraco na Sessão',
  criterion2: 'Agrupamento',
  criterion3: 'Alinhamento',
  criterion4: 'Cores e Padrão',
  criterion5: 'Precificação',
  criterion6: 'Limpeza',
  criterion7: 'Qualidade de Foto',
  criterion8: 'Poluição Visual',
  criterion9: 'Posicionamento na Gôndola',
  criterion0: 'Avaria',
  criterion11: 'Espaçamento',
  criterion12: 'Fora de Layout',
  resetScore: 'Resetar Avaliação',
  removePhoto: 'Remover Foto'
};

const keyDisplayNames: Record<string, string> = {
  'ArrowRight': '→',
  'ArrowLeft': '←',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'Digit0': '0',
  'Digit1': '1',
  'Digit2': '2',
  'Digit3': '3',
  'Digit4': '4',
  'Digit5': '5',
  'Digit6': '6',
  'Digit7': '7',
  'Digit8': '8',
  'Digit9': '9',
  'Numpad0': 'Num0',
  'Numpad1': 'Num1',
  'Numpad2': 'Num2',
  'Numpad3': 'Num3',
  'Numpad4': 'Num4',
  'Numpad5': 'Num5',
  'Numpad6': 'Num6',
  'Numpad7': 'Num7',
  'Numpad8': 'Num8',
  'Numpad9': 'Num9',
  'KeyE': 'E',
  'KeyF': 'F',
  'KeyR': 'R',
  'Delete': 'Del',
  'Backspace': '⌫',
  'Enter': '↵',
  'Space': '␣'
};

export const KeyboardShortcuts = ({ shortcuts, onShortcutsChange }: KeyboardShortcutsProps) => {
  const [editingShortcuts, setEditingShortcuts] = useState(shortcuts);
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyCapture = (shortcutKey: keyof ShortcutConfig, event: React.KeyboardEvent) => {
    event.preventDefault();
    const key = event.code;
    setEditingShortcuts(prev => ({
      ...prev,
      [shortcutKey]: key
    }));
  };

  const handleSave = () => {
    onShortcutsChange(editingShortcuts);
    setIsOpen(false);
  };

  const handleReset = () => {
    setEditingShortcuts(defaultShortcuts);
  };

  const getKeyDisplay = (key: string) => {
    return keyDisplayNames[key] || key.replace('Key', '').replace('Digit', '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Keyboard className="w-4 h-4 mr-2" />
          Atalhos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(shortcutLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={key}
                    value=""
                    placeholder="Pressione uma tecla..."
                    onKeyDown={(e) => handleKeyCapture(key as keyof ShortcutConfig, e)}
                    className="flex-1"
                    readOnly
                  />
                  <Badge variant="secondary" className="min-w-[40px] text-center">
                    {getKeyDisplay(editingShortcuts[key as keyof ShortcutConfig])}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Padrão
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Atalhos
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};