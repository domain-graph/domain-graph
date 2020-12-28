import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as d3 from 'd3';

import { Edge, EdgeGroup, Node } from '../types';
import { useStableClone } from '../use-stable-clone';
import { NodeEvent, NodeSubscriber } from './node-subscriber';
import { context } from './context';
import { EdgeEvent, EdgeSubscriber } from './edge-subscriber';
import { GraphState, NodeState, useStateService } from '../graph-state';

type SimulationNode = Node & d3.SimulationNodeDatum;

function isNotNull<T>(obj: T | null | undefined): obj is T {
  return obj !== null && typeof obj !== 'undefined';
}

function useInitialNodes(
  graphId: string,
): React.MutableRefObject<Map<string, NodeState>> {
  const stateService = useStateService();
  const initialNodes = useRef(
    new Map(
      (stateService?.currentState?.nodes || []).map((node) => [node.id, node]),
    ),
  );
  useEffect(() => {
    initialNodes.current = new Map(
      (stateService?.currentState?.nodes || [])?.map((node) => [node.id, node]),
    );
    console.log(initialNodes.current);
  }, [graphId, stateService]);

  return initialNodes;
}

export type SimulationState = Pick<GraphState, 'nodes'>;

export interface SimulationProps {
  graphId: string;
  nodes: Node[];
  edges: EdgeGroup[];
  onChange: (state: SimulationState) => void;
}

export const Simulation: React.FC<SimulationProps> = ({
  graphId,
  nodes,
  edges,
  onChange,
  children,
}) => {
  const [svg, setSvg] = useState(d3.select('svg'));

  const initialNodes = useInitialNodes(graphId);

  const customMapping = useRef(
    (node: Node, simNode: SimulationNode): Partial<SimulationNode> => {
      const initialNode = initialNodes.current.get(node.id);

      if (initialNode) {
        initialNodes.current.delete(initialNode.id);
        return {
          x: initialNode.x,
          y: initialNode.y,
          fx: initialNode.fixed ? initialNode.x : null,
          fy: initialNode.fixed ? initialNode.y : null,
        };
      } else if (node?.fixed === true) {
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
    },
  );

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
    customMapping: customMapping.current,
  });
  const clonedEdges = useStableClone({ items: filteredEdges, keyProp: 'id' });

  const nodeEventsByNodeId = useRef<Record<string, NodeEvent>>({});
  const nodeSubscriber: NodeSubscriber = useCallback(
    (id: string, onNodeChange: NodeEvent) => {
      nodeEventsByNodeId.current[id] = onNodeChange;
    },
    [],
  );
  const edgeEventsByEdgeId = useRef<Record<string, EdgeEvent>>({});
  const edgeSubscriber: EdgeSubscriber = useCallback(
    (id: string, dataFn: EdgeEvent) => {
      edgeEventsByEdgeId.current[id] = dataFn;
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

      node.call(drag(simulation, nodeEventsByNodeId.current));

      simulation.on('end', () => {
        onChange({
          nodes: clonedNodes
            .map((n) => {
              if (typeof n.x === 'number' && typeof n.y === 'number') {
                return {
                  id: n.id,
                  fixed: n.fixed === true,
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
          edgeEventsByEdgeId.current[d.id]?.({
            x1: d.source.x,
            y1: d.source.y,
            x2: d.target.x,
            y2: d.target.y,
          });
        });

        node.each((d) => {
          if (typeof d.x === 'number' && typeof d.y === 'number') {
            nodeEventsByNodeId.current[d.id]?.('tick', {
              x: d.x,
              y: d.y,
            });

            const edgeIds = circularEdgeIdsByNode[d.id];

            if (edgeIds?.length) {
              for (const edgeId of edgeIds) {
                edgeEventsByEdgeId.current[edgeId]?.({
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
  subscribers: { [id: string]: NodeEvent },
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
