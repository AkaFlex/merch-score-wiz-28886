import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Try localStorage first, fallback to sessionStorage if quota exceeded
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (localStorageError) {
        console.warn(`localStorage quota exceeded for key "${key}", using sessionStorage:`, localStorageError);
        try {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (sessionStorageError) {
          console.warn(`sessionStorage also failed for key "${key}":`, sessionStorageError);
          // Continue with in-memory storage only
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
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}