import { NormalizedFieldType } from './tools/utils';

export type Node = {
  id: string;
  description: string | null;
  fixed: boolean;
  isHidden: boolean;
  fields: ({ edgeId: string | null } & Argument)[];
};

export type Edge = {
  id: string;
  description: string | null;
  name: string;
  source: string;
  target: string;
  plurality: 'single' | 'array';
  optional: boolean;
  heuristic?: string;
  args: Argument[];
};

export interface EdgeGroup extends Pick<Edge, 'id' | 'source' | 'target'> {
  edges: (Omit<Edge, 'source' | 'target'> & { reverse?: true })[];
}

export interface Argument extends NormalizedFieldType {
  name: string;
  description: string | null;
}
