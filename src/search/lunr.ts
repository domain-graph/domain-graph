/* eslint-disable no-invalid-this */
import lunr from 'lunr';
import { Arg, Field, GraphState, Node } from '../state/types';
import {
  isResultField,
  isResultKind,
  MatchData,
  Result,
  SearchEngine,
} from './types';

export class LunrSearchEngine implements SearchEngine {
  private _idx: lunr.Index | null = null;

  index(graph: GraphState): void {
    this._idx = lunr(function () {
      this.ref('id');
      this.field('name', { boost: 3 });
      this.field('description', { boost: 2 });
      this.field('deprecationReason', { boost: 1 });
      this.field('defaultValue', { boost: 1 });

      this.metadataWhitelist = ['position'];

      console.log('indexing types');
      for (const id in graph.nodes) {
        this.add(fromType(graph.nodes[id]));
      }

      console.log('indexing fields');
      for (const id in graph.fields) {
        this.add(fromField(graph.fields[id]));
      }

      console.log('indexing args');
      for (const id in graph.args) {
        this.add(fromArg(graph.args[id]));
      }

      console.log(`done indexing`);
    });
  }

  search(query: string): Result[] {
    if (!this._idx) return [];
    return this._idx
      .search(query)
      .map((result) => {
        const [kind, id] = result.ref.split(':');

        if (!isResultKind(kind)) return undefined;

        const r: Result = {
          kind,
          id,
          score: result.score,
        };

        if (result.matchData.metadata) {
          for (const searchHit in result.matchData.metadata) {
            r.matchData = Object.keys(result.matchData.metadata[searchHit])
              .map(
                (field) =>
                  ({
                    field,
                    locations: result.matchData.metadata[searchHit][
                      field
                    ].position.map(([start, length]) => ({
                      start,
                      length,
                    })),
                  } as MatchData),
              )
              .filter((x) => isResultField(x.field));
          }
        }

        return r;
      })
      .filter(isTruthy);
  }
}

function isTruthy<T>(obj: T | null | undefined): obj is T {
  return obj !== null && typeof obj !== 'undefined';
}

interface SearchDocument {
  id: string;
  name: string;
  description?: string;
  deprecationReason?: string;
  defaultValue?: string;
}

function fromType(node: Node): SearchDocument {
  return {
    id: `Type:${node.id}`,
    name: node.id,
    description: node.description,
  };
}

function fromField(field: Field): SearchDocument {
  return {
    id: `Field:${field.id}`,
    name: field.id,
    description: field.description,
  };
}

function fromArg(arg: Arg): SearchDocument {
  return {
    id: `Arg:${arg.id}`,
    name: arg.id,
    description: arg.description,
    defaultValue: arg.defaultValue,
  };
}
