import {
  define,
  key,
  required,
  indexOf,
  optional,
} from 'flux-standard-functions';

import { Entity, StandardReducer } from '../entity';
import { handleSelectEdges } from './side-effects';

export type Edge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
};

export const edgeDef = define<Edge>({
  id: key(),
  sourceNodeId: required(),
  targetNodeId: required(),
});

export type EdgesState = {
  data: Record<string, Edge>;
  selectedEdgeId?: string;
};

export const stateDef = define<EdgesState>({
  data: required(indexOf(edgeDef)),
  selectedEdgeId: optional(),
});

export const edges = new Entity('EDGES', stateDef, edgeDef, { data: {} });

export const reducer: StandardReducer<'EDGES', Edge, EdgesState> = (
  originalState,
  action,
) => {
  let currentState = edges.standardReducer(originalState, action);
  currentState = handleSelectEdges(originalState, currentState, action);

  return currentState;
};
