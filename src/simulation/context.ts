import { createContext } from 'react';
import { EdgeSubscriber } from './edge-subscriber';
import { NodeSubscriber } from './node-subscriber';

const noop = () => {
  // NO-OP
};

export const context = createContext<{
  nodeSubscriber: NodeSubscriber;
  edgeSubscriber: EdgeSubscriber;
}>({
  nodeSubscriber: noop,
  edgeSubscriber: noop,
});
