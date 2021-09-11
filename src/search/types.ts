import { GraphState } from '../state/graph';

export type ResultKind = 'Arg' | 'Field' | 'Type';

export function isResultKind(str: string): str is ResultKind {
  return str === 'Arg' || str === 'Field' || str === 'Type';
}

export type ResultField =
  | 'name'
  | 'description'
  | 'deprecationReason'
  | 'defaultValue';

export function isResultField(str: string): str is ResultField {
  return (
    str === 'name' ||
    str === 'description' ||
    str === 'deprecationReason' ||
    str === 'defaultValue'
  );
}

export type Result = {
  kind: ResultKind;
  id: string;
  score: number;
  matchData?: MatchData[];
};

export type MatchData = {
  field: ResultField;
  locations: { offset: number; length: number }[];
};

export interface SearchEngine {
  index(graph: GraphState): void;
  search(query: string): Result[];
}
