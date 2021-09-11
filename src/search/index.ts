import { useCallback } from 'react';
import { ApplicationState } from '../state';
import { LunrSearchEngine } from './lunr';

const engine = new LunrSearchEngine();

export function useIndexBuilder() {
  return useCallback((state: ApplicationState) => {
    engine.index(state.graph);
  }, []);
}

export function useSearch() {
  return useCallback((query: string) => engine.search(query), []);
}
