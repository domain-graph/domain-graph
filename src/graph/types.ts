import { Node as RawNode, Edge as RawEdge } from '../types';

export interface Node extends RawNode {
  fixed?: boolean;
  isHidden?: boolean;
}

export type Edge = RawEdge;

export interface EdgeGroup extends Pick<RawEdge, 'id' | 'source' | 'target'> {
  edges: (Omit<RawEdge, 'source' | 'target'> & { reverse?: true })[];
}
