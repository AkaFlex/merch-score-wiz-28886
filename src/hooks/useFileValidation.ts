import { useState } from 'react';
import { toast } from 'sonner';

interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

interface ValidationResult {
  validFiles: File[];
  errors: string[];
}

export const useFileValidation = (options: FileValidationOptions = {}) => {
  const [isValidating, setIsValidating] = useState(false);
  
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFiles = 1000 // Increased for large batches
  } = options;

  const validateFiles = async (files: File[]): Promise<ValidationResult> => {
    setIsValidating(true);
    const validFiles: File[] = [];
    const errors: string[] = [];

    try {
      // Check total number of files
      if (files.length > maxFiles) {
        errors.push(`Máximo de ${maxFiles} arquivos permitidos por vez.`);
        setIsValidating(false);
        return { validFiles: [], errors };
      }

      for (const file of files) {
        // Check file size
        if (file.size > maxSize) {
          errors.push(`${file.name}: Arquivo muito grande (máx. ${Math.round(maxSize / (1024 * 1024))}MB)`);
          continue;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: Tipo de arquivo não suportado`);
          continue;
        }

        // Check if file is actually an image
        try {
          await validateImageFile(file);
          validFiles.push(file);
        } catch (error) {
          errors.push(`${file.name}: Arquivo de imagem inválido`);
        }
      }

      // Show toast notifications for errors
      if (errors.length > 0) {
        toast.error(`${errors.length} arquivo(s) rejeitado(s)`, {
          description: errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : '')
        });
      }

      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} arquivo(s) válido(s) adicionado(s)`);
      }

    } catch (error) {
      errors.push('Erro ao validar arquivos');
      console.error('File validation error:', error);
    } finally {
      setIsValidating(false);
    }

    return { validFiles, errors };
  };

  return { validateFiles, isValidating };
};

// Helper function to validate if file is actually an image
const validateImageFile = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Invalid image file'));
    };

    img.src = objectUrl;
  });
};