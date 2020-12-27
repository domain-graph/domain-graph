import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as d3 from 'd3';

import { Edge, EdgeGroup, Node } from '../types';
import { useStableClone } from '../../use-stable-clone';

const noop = () => {
  // NO-OP
};

const context = createContext<{
  nodeSubscriber: NodeMutationSubscriber;
  edgeSubscriber: EdgeMutationSubscriber;
}>({
  nodeSubscriber: noop,
  edgeSubscriber: noop,
});

export function useNodeMutation(nodeId: string, onChange: NodeMutation): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const subscribe = useContext(context)?.nodeSubscriber;

  useEffect(() => {
    subscribe?.(nodeId, (event, location) => {
      requestAnimationFrame(() => {
        onChangeRef.current?.(event, location);
      });
    });
  }, [subscribe, nodeId]);
}

export interface NodeMutationSubscriber {
  (nodeId: string, mutation: NodeMutation): void;
}
export interface NodeMutation {
  (
    event: 'dragstart' | 'dragend' | 'drag' | 'tick',
    location: { x: number; y: number },
  ): void;
}

export function useEdgeMutation(edgeId: string, onChange: EdgeMutation): void {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const subscribe = useContext(context)?.edgeSubscriber;

  useEffect(() => {
    subscribe?.(edgeId, (change) => {
      requestAnimationFrame(() => {
        onChangeRef.current?.(change);
      });
    });
  }, [subscribe, edgeId]);
}

export interface EdgeMutationSubscriber {
  (edgeId: string, mutation: EdgeMutation): void;
}
export interface EdgeMutation {
  (change: { x1: number; y1: number; x2: number; y2: number }): void;
}

type SimulationNode = Node & d3.SimulationNodeDatum;

function isNotNull<T>(obj: T | null | undefined): obj is T {
  return obj !== null && typeof obj !== 'undefined';
}

function customMapping(
  node: Node,
  simNode: SimulationNode,
): Partial<SimulationNode> {
  if (node?.fixed === true) {
    return {
      fx: simNode.x,
      fy: simNode.y,
      vx: 0,
      vy: 0,
    };
  } else if (node?.fixed === false) {
    return {
      fx: null,
      fy: null,
    };
  } else {
    return {};
  }
}

export interface SimulationState {
  nodes: {
    id: string;
    fixed?: boolean;
    x: number;
    y: number;
  }[];
}

export const Simulation: React.FC<{
  nodes: Node[];
  edges: EdgeGroup[];
  // initialState: SimulationState;
  onChange: (state: SimulationState) => void;
}> = ({ nodes, edges, onChange, children }) => {
  const [svg, setSvg] = useState(d3.select('svg'));

  useEffect(() => {
    setSvg(d3.select('svg'));
  }, []);

  const filteredEdges = useMemo(
    () => edges.filter((edge) => edge.source !== edge.target),
    [edges],
  );

  const circularEdgeIdsByNode: Record<string, string[]> = useMemo(
    () =>
      edges
        .filter((edge) => edge.source === edge.target)
        .reduce<Record<string, string[]>>((acc, edge) => {
          acc[edge.source] ||= [];

          acc[edge.source].push(edge.id);

          return acc;
        }, {}),
    [edges],
  );

  const clonedNodes = useStableClone<Node, SimulationNode>({
    items: nodes,
    keyProp: 'id',
    customMapping,
  });
  const clonedEdges = useStableClone({ items: filteredEdges, keyProp: 'id' });

  const nodeMutations = useRef<{ [id: string]: NodeMutation }>({});
  const nodeSubscriber: NodeMutationSubscriber = useCallback(
    (id: string, dataFn: NodeMutation) => {
      nodeMutations.current[id] = dataFn;
    },
    [],
  );
  const edgeMutations = useRef<{ [id: string]: EdgeMutation }>({});
  const edgeSubscriber: EdgeMutationSubscriber = useCallback(
    (id: string, dataFn: EdgeMutation) => {
      edgeMutations.current[id] = dataFn;
    },
    [],
  );

  // Must be a layout effect because we attach the sim to existing DOM nodes
  useLayoutEffect(() => {
    if (svg && clonedNodes) {
      const simulation = d3
        .forceSimulation<SimulationNode, EdgeGroup>(clonedNodes)
        .force(
          'link',
          d3
            .forceLink<SimulationNode, EdgeGroup>(clonedEdges)
            .id((d) => d.id)
            .distance(120),
        )
        .force('charge', d3.forceManyBody().strength(-500).distanceMax(150));

      // TODO: consider this when we can plumn tick XOR drag event data
      // if (!clonedNodes.some((n) => !n.fixed)) simulation.stop();

      const link = svg.selectAll('g.edge').data(clonedEdges);

      const node = svg
        .selectAll('g.simulation-node .handle')
        .data(clonedNodes, function (this: Element, d: any) {
          // eslint-disable-next-line no-invalid-this
          return d ? d.id : this.id;
        });

      node.on('mouseover', function (d) {
        // eslint-disable-next-line no-invalid-this
        d3.select((this as any).parentNode).raise();
      });

      node.call(drag(simulation, nodeMutations.current));

      simulation.on('end', () => {
        onChange({
          nodes: clonedNodes
            .map((n) => {
              if (typeof n.x === 'number' && typeof n.y === 'number') {
                return {
                  id: n.id,
                  fixed: n.fixed,
                  x: n.x,
                  y: n.y,
                };
              } else {
                return null;
              }
            })
            .filter(isNotNull),
        });
      });

      simulation.on('tick', () => {
        link.each((d: any) => {
          edgeMutations.current[d.id]?.({
            x1: d.source.x,
            y1: d.source.y,
            x2: d.target.x,
            y2: d.target.y,
          });
        });

        node.each((d) => {
          if (typeof d.x === 'number' && typeof d.y === 'number') {
            nodeMutations.current[d.id]?.('tick', { x: d.x, y: d.y });

            const edgeIds = circularEdgeIdsByNode[d.id];

            if (edgeIds?.length) {
              for (const edgeId of edgeIds) {
                edgeMutations.current[edgeId]?.({
                  x1: d.x,
                  y1: d.y,
                  x2: d.x,
                  y2: d.y,
                });
              }
            }
          }
        });
      });

      return () => {
        simulation.stop();
      };
    } else {
      return undefined;
    }
  }, [clonedNodes, clonedEdges, circularEdgeIdsByNode, svg, onChange]);

  return (
    <context.Provider value={{ nodeSubscriber, edgeSubscriber }}>
      {children}
    </context.Provider>
  );
};

function drag(
  simulation: d3.Simulation<SimulationNode, Edge>,
  subscribers: { [id: string]: NodeMutation },
): any {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    subscribers[event.subject.id]?.('dragstart', {
      x: event.subject.x,
      y: event.subject.y,
    });
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    subscribers[event.subject.id]?.('drag', {
      x: event.x,
      y: event.y,
    });
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    subscribers[event.subject.id]?.('dragend', {
      x: event.subject.x,
      y: event.subject.y,
    });
    if (!event.subject.fixed) {
      event.subject.fx = null;
      event.subject.fy = null;
      event.subject.vx = null;
      event.subject.vy = null;
    }
  }

  return d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}
