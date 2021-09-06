/* eslint-disable no-invalid-this */
import lunr from 'lunr';
import { useCallback } from 'react';
import { ApplicationState } from '../state';
import { Arg, Field, Node } from '../state/types';

export interface SearchDocument {
  id: string;
  name: string;
  description?: string;
  deprecationReason?: string;
  defaultValue?: string;
}

export function fromType(node: Node): SearchDocument {
  return {
    id: `Node:${node.id}`,
    name: node.id,
    description: node.description,
  };
}

export function fromField(field: Field): SearchDocument {
  return {
    id: `Field:${field.id}`,
    name: field.id,
    description: field.description,
  };
}

export function fromArg(arg: Arg): SearchDocument {
  return {
    id: `Arg:${arg.id}`,
    name: arg.id,
    description: arg.description,
    defaultValue: arg.defaultValue,
  };
}

let idx: lunr.Index | null = null;

export function useIndexBuilder() {
  return useCallback((state: ApplicationState) => {
    idx = lunr(function () {
      this.ref('id');
      this.field('name', { boost: 3 });
      this.field('description', { boost: 2 });
      this.field('deprecationReason', { boost: 1 });
      this.field('defaultValue', { boost: 1 });

      // this.metadataWhitelist = ['position'];

      console.log('indexing types');
      for (const id in state.graph.nodes) {
        this.add(fromType(state.graph.nodes[id]));
      }

      console.log('indexing fields');
      for (const id in state.graph.fields) {
        this.add(fromField(state.graph.fields[id]));
      }

      console.log('indexing args');
      for (const id in state.graph.args) {
        this.add(fromArg(state.graph.args[id]));
      }

      console.log(`done indexing`);
    });

    return idx;
  }, []);
}

export function useSearch() {
  return useCallback((query: string) => {
    if (!idx) return [];

    return idx.search(query);
  }, []);
}
