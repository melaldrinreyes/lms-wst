import { useContext } from 'react';
import { SaveContext } from '../contexts/SaveContext';

export function useSave() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within SaveProvider');
  }
  return context;
}
