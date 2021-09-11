import { GraphState } from '../state/graph';
import { Result, SearchEngine } from './types';

import { Searcher } from 'fast-fuzzy';

export class FastFuzzySearchEngine implements SearchEngine {
  private typeNames: Searcher<string, any> | null;
  private fieldNames: Searcher<string, any> | null;
  private argNames: Searcher<string, any> | null;

  index(graph: GraphState): void {
    const typeNames = Object.keys(graph.nodes);
    const fieldNames = Object.keys(graph.fields);
    const argNames = Object.keys(graph.args);

    this.typeNames = new Searcher(typeNames);
    this.fieldNames = new Searcher(fieldNames);
    this.argNames = new Searcher(argNames);
  }
  search(query: string): Result[] {
    const typeMatches =
      this.typeNames?.search(query, {
        returnMatchData: true,
        threshold: 0.6,
      }) || [];

    const fieldMatches =
      this.fieldNames?.search(query, {
        returnMatchData: true,
        threshold: 0.6,
      }) || [];

    const argMatches =
      this.argNames?.search(query, {
        returnMatchData: true,
        threshold: 0.6,
      }) || [];

    const typeResults = typeMatches.map(
      (r) =>
        ({
          id: r.original,
          kind: 'Type',
          score: (3 * (r.score * query.length)) / r.original.length,
          matchData: [
            {
              field: 'name',
              locations: [{ offset: r.match.index, length: r.match.length }],
            },
          ],
        } as Result),
    );

    const fieldResults = fieldMatches.map(
      (r) =>
        ({
          id: r.original,
          kind: 'Field',
          score: (2 * (r.score * query.length)) / r.original.length,
          matchData: [
            {
              field: 'name',
              locations: [{ offset: r.match.index, length: r.match.length }],
            },
          ],
        } as Result),
    );

    const argResults = argMatches.map(
      (r) =>
        ({
          id: r.original,
          kind: 'Arg',
          score: (r.score * query.length) / r.original.length,
          matchData: [
            {
              field: 'name',
              locations: [{ offset: r.match.index, length: r.match.length }],
            },
          ],
        } as Result),
    );

    return [...typeResults, ...fieldResults, ...argResults].sort(
      (a, b) => b.score - a.score,
    );
  }
}
