import { define, key, required, optional } from 'flux-standard-functions';

export type Node = {
  id: string;
  description?: string;
  isPinned: boolean;
  isVisible: boolean;
  x?: number;
  y?: number;
};

export const nodeDef = define<Node>({
  id: key(),
  description: optional(),
  isPinned: required(),
  isVisible: required(),
  x: optional(),
  y: optional(),
});

export type NewDevice = Omit<Node, 'id'>;

export type DeviceUpdate = Omit<Node, 'id'>;
