import { useCallback } from 'react';
import { ApplicationState } from '../state';
import { FastFuzzySearchEngine } from './fast-fuzzy';

const engine = new FastFuzzySearchEngine();

export function useIndexBuilder() {
  return useCallback((state: ApplicationState) => {
    engine.index(state.graph);
  }, []);
}

export function useSearch() {
  return useCallback(
    (query: string) => (query ? engine.search(query) : []),
    [],
  );
}
