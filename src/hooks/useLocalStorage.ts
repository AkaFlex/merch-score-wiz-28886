import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      // For large data, use chunked storage
      if (item.startsWith('CHUNKED:')) {
        const chunkCount = parseInt(item.split(':')[1]);
        let reconstructed = '';
        for (let i = 0; i < chunkCount; i++) {
          reconstructed += window.localStorage.getItem(`${key}_chunk_${i}`) || '';
        }
        return JSON.parse(reconstructed);
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      const stringified = JSON.stringify(valueToStore);
      
      // If data is too large, split into chunks (5MB per chunk)
      const CHUNK_SIZE = 5 * 1024 * 1024;
      
      try {
        // Clear any existing chunks first
        let i = 0;
        while (window.localStorage.getItem(`${key}_chunk_${i}`)) {
          window.localStorage.removeItem(`${key}_chunk_${i}`);
          i++;
        }
        
        if (stringified.length > CHUNK_SIZE) {
          const chunkCount = Math.ceil(stringified.length / CHUNK_SIZE);
          
          for (let i = 0; i < chunkCount; i++) {
            const chunk = stringified.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            window.localStorage.setItem(`${key}_chunk_${i}`, chunk);
          }
          
          window.localStorage.setItem(key, `CHUNKED:${chunkCount}`);
        } else {
          window.localStorage.setItem(key, stringified);
        }
      } catch (localStorageError) {
        console.warn(`localStorage quota exceeded for key "${key}":`, localStorageError);
        // Fallback to sessionStorage for current session only
        try {
          window.sessionStorage.setItem(key, stringified);
        } catch (sessionStorageError) {
          console.error(`Storage failed for key "${key}":`, sessionStorageError);
        }
      }
    } catch (error) {
      console.error(`Error setting storage for key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
      
      // Remove any chunks
      let i = 0;
      while (window.localStorage.getItem(`${key}_chunk_${i}`)) {
        window.localStorage.removeItem(`${key}_chunk_${i}`);
        i++;
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}