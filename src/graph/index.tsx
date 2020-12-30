import './index.less';

import React from 'react';

import { SvgCanvas } from '../svg-canvas';
import { DomainObject } from './domain-object';
import { DomainEdge } from './domain-edge';
import { Simulation } from '../simulation';
import { NodePicker } from './node-picker';
import { Spotlight } from './spotlight';
import { useVisibleEdges } from '../state/edges/hooks';
import { useVisibleNodeIds } from '../state/nodes/hooks';

export interface GraphProps {
  id: string;
  className?: string;
}

export const Graph: React.VFC<GraphProps> = ({ id }) => {
  const nodeIds = useVisibleNodeIds();
  const edges = useVisibleEdges();

  return (
    <Simulation
      graphId={id}
      onChange={() => {
        /* todo */
      }}
    >
      <SvgCanvas>
        <g>
          {edges.map((edge) => (
            <DomainEdge key={edge.id} edgeId={edge.id} />
          ))}
        </g>
        <g>
          {nodeIds.map((nodeId) => (
            <DomainObject key={nodeId} nodeId={nodeId} />
          ))}
        </g>
      </SvgCanvas>
      <NodePicker />
      <Spotlight />
    </Simulation>
  );
};
