import { define, key, required, indexOf } from 'flux-standard-functions';

import { Entity } from '../entity';

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
};

export const stateDef = define<EdgesState>({
  data: required(indexOf(edgeDef)),
});

export const edges = new Entity('EDGES', stateDef, edgeDef, { data: {} });
