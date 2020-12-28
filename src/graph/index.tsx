import './index.less';

import React, { useCallback, useMemo, useState } from 'react';

import { SvgCanvas } from '../svg-canvas';
import { Edge, EdgeGroup, Node } from '../types';
import { DomainObject } from './domain-object';
import { DomainEdge } from './domain-edge';
import { Simulation, SimulationState } from '../simulation';
import { NodePicker } from './node-picker';
import { Spotlight } from './spotlight';
import { useStateService } from '../graph-state';

export interface GraphProps {
  id: string;
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

export const Graph: React.VFC<GraphProps> = ({ id, nodes, edges }) => {
  const stateService = useStateService();

  const [selection, setSelection] = useState<{
    source?: Node;
    edge?: Edge;
    target?: Node;
  }>({});

  const [allNodes, setAllNodes] = useState<Node[]>(nodes);

  const handleHideAll = useCallback(() => {
    setSelection({});
    setAllNodes((prev) => {
      stateService?.removeNodes(prev.map((n) => n.id));
      return prev.map((node) => ({ ...node, isHidden: true }));
    });
  }, [stateService]);

  const handleHideUnpinned = useCallback(() => {
    setAllNodes((prev) => {
      const nodeIds = new Set<string>();
      const next = prev.map((node) => {
        if (node.fixed) return node;

        if (selection.source?.id === node.id) {
          setSelection({});
        } else if (selection.target?.id === node.id) {
          setSelection((sel) => ({
            source: sel.source,
          }));
        }

        nodeIds.add(node.id);

        return { ...node, isHidden: true };
      });

      stateService?.removeNodes([...nodeIds.values()]);

      return next;
    });
  }, [selection, stateService]);

  const allEdges: EdgeGroup[] = useMemo(() => {
    const index = edges.reduce<{ [id: string]: EdgeGroup }>((acc, edge) => {
      const { source, target, ...rest } = edge;

      const forwardId = `${source}>${target}`;
      const reverseId = `${target}>${source}`;
      const group = acc[forwardId] || acc[reverseId];

      if (group) {
        const e: EdgeGroup['edges'][number] = rest;
        if (group.id === reverseId) e.reverse = true;
        return { ...acc, [group.id]: { ...group, edges: [...group.edges, e] } };
      } else {
        const e: EdgeGroup['edges'][number] = rest;
        const g: EdgeGroup = {
          id: forwardId,
          source,
          target,
          edges: [e],
        };
        return {
          ...acc,
          [forwardId]: g,
        };
      }
    }, {});

    return Object.keys(index).map((key) => index[key]);
  }, [edges]);

  const visibleNodes = useMemo(
    () => allNodes.filter((node) => !node.isHidden),
    [allNodes],
  );

  const visibleEdges = useMemo(
    () =>
      allEdges.filter(
        (edge) =>
          allNodes.find((node) => node.id === edge.source)?.isHidden ===
            false &&
          allNodes.find((node) => node.id === edge.target)?.isHidden === false,
      ),
    [allNodes, allEdges],
  );

  const setIsHidden = useCallback(
    (nodeId: string, isHidden: boolean) => {
      if (isHidden) stateService?.removeNodes([nodeId]);
      setSelection((prev) => {
        if (nodeId === prev.source?.id) return {};
        if (nodeId === prev.target?.id) return { source: prev.source };
        return prev;
      });
      setAllNodes((prev) =>
        prev.some((node) => node.id === nodeId)
          ? prev.map((node) =>
              node.id === nodeId ? { ...node, isHidden } : node,
            )
          : prev,
      );
    },
    [stateService],
  );

  const setIsPinned = useCallback((nodeId: string, isPinned: boolean) => {
    setAllNodes((prev) =>
      prev.some((node) => node.id === nodeId)
        ? prev.map((node) =>
            node.id === nodeId ? { ...node, fixed: isPinned } : node,
          )
        : prev,
    );
  }, []);

  const handleExpand = useCallback(
    (nodeId: string) => {
      setAllNodes((prev) => {
        const nodeIds = allEdges
          .filter((edge) => edge.source === nodeId || edge.target === nodeId)
          .reduce<Set<string>>((acc, edge) => {
            if (edge.source !== nodeId) acc.add(edge.source);
            if (edge.target !== nodeId) acc.add(edge.target);
            return acc;
          }, new Set());

        if (
          nodeIds.size &&
          prev.some((node) => nodeIds.has(node.id) && node.isHidden)
        ) {
          return prev.some((node) => nodeIds.has(node.id))
            ? prev.map((node) =>
                nodeIds.has(node.id) && node.isHidden
                  ? { ...node, isHidden: false, fixed: false }
                  : node,
              )
            : prev;
        } else {
          return prev;
        }
      });
    },
    [allEdges],
  );

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);

      if (node?.isHidden) {
        setIsHidden(node.id, false);
      }
      // TODO: pan to node
      setSelection({ source: node });
    },
    [nodes, setIsHidden],
  );

  const handleSelectEdge = useCallback(
    (edgeId: string) => {
      const edge = edges.find((e) => e.id === edgeId) || null;
      const source = nodes.find((n) => n.id === edge?.source) || null;
      const target = nodes.find((n) => n.id === edge?.target) || null;

      if (source && edge && target) {
        if (source.isHidden !== false) {
          setIsHidden(source.id, false);
        }

        if (target.isHidden !== false) {
          setIsHidden(target.id, false);
        }
        // TODO: pad to edge center
        setSelection({ source, edge, target });
      } else {
        setSelection({});
      }
    },
    [nodes, edges, setIsHidden],
  );

  const handleCloseNode = useCallback((nodeId: string) => {
    setSelection((prev) => {
      if (prev.source?.id === nodeId) return {};
      if (prev.target?.id === nodeId) return { source: prev.source };
      return prev;
    });
  }, []);

  const handleChange = useCallback(
    async (state: SimulationState) => {
      await stateService?.updateNodes(state.nodes);
    },
    [stateService],
  );

  return (
    <Simulation
      graphId={id}
      nodes={visibleNodes}
      edges={visibleEdges}
      onChange={handleChange}
    >
      <SvgCanvas>
        <g>
          {visibleEdges.map((edge) => (
            <DomainEdge
              key={edge.id}
              selectedEdgeId={selection.edge?.id}
              edge={edge}
              onSelect={handleSelectEdge}
            />
          ))}
        </g>
        <g>
          {visibleNodes.map((node) => (
            <DomainObject
              key={node.id}
              isSelected={
                selection.source?.id === node.id ||
                selection.target?.id === node.id
              }
              onPin={(nodeId) => setIsPinned(nodeId, true)}
              onUnpin={(nodeId) => setIsPinned(nodeId, false)}
              onHide={(nodeId) => {
                setIsHidden(nodeId, true);
                setIsPinned(nodeId, false);
              }}
              onExpand={handleExpand}
              onSelect={handleSelectNode}
              node={node}
            />
          ))}
        </g>
      </SvgCanvas>
      <NodePicker
        nodes={allNodes}
        onShow={(nodeId) => {
          setIsHidden(nodeId, false);
        }}
        onHide={(nodeId) => {
          setIsHidden(nodeId, true);
          setIsPinned(nodeId, false);
        }}
        onHideAll={handleHideAll}
        onHideUnpinned={handleHideUnpinned}
      />

      <Spotlight
        source={selection.source}
        edge={selection.edge}
        target={selection.target}
        onCloseNode={handleCloseNode}
        onSelectEdge={handleSelectEdge}
      />
    </Simulation>
  );
};
